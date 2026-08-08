import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  coordinateConcurrentSmoke,
  cleanupAndVerifyClaims,
  discoverOwnedStates,
  extractIntegrationTestBasename,
  writeOwnedSentinels,
  type ChildResult,
  type ManagedSmokeChild,
} from './integration/run-concurrent-smoke.js';
import type { SmokeOwnershipClaim, SmokeState } from './integration/env.js';
import { managedProcessControlForClaim } from './integration/env.js';

function makeClaim(parentRoot: string, name: string, parentToken: string, childToken: string): SmokeOwnershipClaim {
  const runDir = join(parentRoot, name);
  mkdirSync(runDir);
  const claim: SmokeOwnershipClaim = {
    schemaVersion: 'contentos/smoke-ownership-claim/v1',
    mode: 'concurrent',
    parentRoot,
    runDir,
    claimFile: join(runDir, 'ownership-claim.json'),
    processFile: join(runDir, 'managed-processes.json'),
    stateFile: join(runDir, 'ready-state.json'),
    projectName: `contentos-smoke-${childToken.slice(0, 8)}`,
    ownership: { parentToken, childToken },
  };
  writeFileSync(claim.claimFile, JSON.stringify(claim), { mode: 0o600 });
  chmodSync(claim.claimFile, 0o600);
  writeFileSync(claim.processFile, JSON.stringify(managedProcessControlForClaim(claim)), { mode: 0o600 });
  chmodSync(claim.processFile, 0o600);
  return claim;
}

function writeState(claim: SmokeOwnershipClaim): SmokeState {
  const state: SmokeState = {
    runDir: claim.runDir,
    claimFile: claim.claimFile,
    processFile: claim.processFile,
    stateFile: claim.stateFile,
    projectName: claim.projectName,
    repoRoot: '/test/repository',
    baseFile: '/test/repository/compose.yaml',
    overrideFile: '/test/repository/compose.smoke.yaml',
    envFile: join(claim.runDir, 'compose.env'),
    ports: { postgres: 1, redis: 2, objectStorage: 3, web: 4, api: 5 },
    webOrigin: 'http://127.0.0.1:4',
    apiOrigin: 'http://127.0.0.1:5',
    objectStorageBucket: `bucket-${claim.ownership.childToken.slice(0, 8)}`,
    ownership: claim.ownership,
  };
  writeFileSync(claim.stateFile, JSON.stringify(state));
  return state;
}

function deferredResult(): { readonly promise: Promise<ChildResult>; resolve(result: ChildResult): void } {
  let resolve!: (result: ChildResult) => void;
  return { promise: new Promise((done) => (resolve = done)), resolve };
}

function fakeManagedProcessIdentity(role: 'api' | 'web', pid: number) {
  return {
    role,
    pid,
    pgid: pid,
    startIdentity: 'a'.repeat(64),
    executableFingerprint: 'b'.repeat(64),
    commandFingerprint: 'c'.repeat(64),
  };
}

function managedChild(
  claim: SmokeOwnershipClaim,
  result: Promise<ChildResult>,
  signal: (signal: NodeJS.Signals) => void = () => undefined,
): ManagedSmokeChild {
  return { claim, result, signal };
}

describe('concurrent smoke claimed ownership', () => {
  it('cleans only exact claimed managed processes and Compose projects', async () => {
    const root = mkdtempSync(join(tmpdir(), 'contentos-concurrent-claim-test-'));
    const ownedParent = join(root, 'owned-parent');
    const unrelatedParent = join(root, 'unrelated-parent');
    mkdirSync(ownedParent);
    mkdirSync(unrelatedParent);
    try {
      const claims = [
        makeClaim(ownedParent, 'child-one', 'a'.repeat(32), 'b'.repeat(32)),
        makeClaim(ownedParent, 'child-two', 'a'.repeat(32), 'c'.repeat(32)),
      ] as const;
      writeFileSync(
        claims[0].processFile,
        JSON.stringify(managedProcessControlForClaim(claims[0], [fakeManagedProcessIdentity('api', 101)])),
      );
      writeFileSync(
        claims[1].processFile,
        JSON.stringify(managedProcessControlForClaim(claims[1], [fakeManagedProcessIdentity('web', 202)])),
      );
      for (const claim of claims) writeFileSync(join(claim.runDir, 'compose.env'), 'non-secret-test-fixture=1');

      const unrelatedClaim = makeClaim(unrelatedParent, 'child', 'd'.repeat(32), 'e'.repeat(32));
      const unrelatedMarker = join(unrelatedClaim.runDir, 'unrelated-process-999-and-compose-project');
      writeFileSync(unrelatedMarker, 'untouched');
      const stopped: number[] = [];
      const composeDownProjects: string[] = [];
      let listCount = 0;
      await cleanupAndVerifyClaims(claims, {
        stopManagedProcess: async (identity) => {
          stopped.push(identity.pid);
        },
        composeDown: async (state) => {
          composeDownProjects.push(state.projectName);
          return { ok: true, code: 0, stdout: '', stderr: '' };
        },
        listComposeProjects: async () => ({
          ok: true,
          stdout:
            listCount++ === 0
              ? JSON.stringify([
                  ...claims.map((claim) => ({ Name: claim.projectName })),
                  { Name: unrelatedClaim.projectName },
                ])
              : JSON.stringify([{ Name: unrelatedClaim.projectName }]),
        }),
      });

      expect(stopped).toEqual([101, 202]);
      expect(stopped).not.toContain(999);
      expect(composeDownProjects).toEqual(claims.map((claim) => claim.projectName));
      expect(readFileSync(unrelatedMarker, 'utf8')).toBe('untouched');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it.each([
    ['claim', 'missing'],
    ['claim', 'invalid'],
    ['managed-process control', 'missing'],
    ['managed-process control', 'invalid'],
  ] as const)('does not report cleanup verified for a %s that is %s', async (target, mode) => {
    const root = mkdtempSync(join(tmpdir(), 'contentos-concurrent-claim-test-'));
    try {
      const claims = [
        makeClaim(root, 'child-one', 'a'.repeat(32), 'b'.repeat(32)),
        makeClaim(root, 'child-two', 'a'.repeat(32), 'c'.repeat(32)),
      ] as const;
      const corruptedFile = target === 'claim' ? claims[0].claimFile : claims[0].processFile;
      if (mode === 'missing') rmSync(corruptedFile);
      else writeFileSync(corruptedFile, '{"schemaVersion":"invalid"}');
      const stopped: number[] = [];

      await expect(
        cleanupAndVerifyClaims(claims, {
          stopManagedProcess: async (identity) => {
            stopped.push(identity.pid);
          },
          listComposeProjects: async () => ({ ok: true, stdout: '[]' }),
        }),
      ).rejects.toThrow('claimed cleanup failed');
      expect(stopped).toEqual([]);
      expect(existsSync(claims[0].runDir)).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('reads only the two exact claims and never modifies an unrelated run', async () => {
    const root = mkdtempSync(join(tmpdir(), 'contentos-concurrent-claim-test-'));
    const parentRoot = join(root, 'owned-parent');
    const unrelatedParent = join(root, 'unrelated-parent');
    mkdirSync(parentRoot);
    mkdirSync(unrelatedParent);
    try {
      const claims = [
        makeClaim(parentRoot, 'child-one', 'a'.repeat(32), 'b'.repeat(32)),
        makeClaim(parentRoot, 'child-two', 'a'.repeat(32), 'c'.repeat(32)),
      ] as const;
      const expectedStates = claims.map(writeState);
      const unrelatedClaim = makeClaim(unrelatedParent, 'unrelated-child', 'd'.repeat(32), 'e'.repeat(32));
      const unrelatedState = writeState(unrelatedClaim);
      const marker = join(unrelatedClaim.runDir, 'unrelated-marker');
      writeFileSync(marker, 'must remain unchanged');

      const discovered = await discoverOwnedStates({ claims, timeoutMs: 100 });
      expect(discovered).toEqual(expectedStates);
      writeOwnedSentinels(discovered);
      expect(readFileSync(marker, 'utf8')).toBe('must remain unchanged');
      expect(readFileSync(unrelatedClaim.stateFile, 'utf8')).toBe(JSON.stringify(unrelatedState));
      expect(existsSync(join(unrelatedClaim.runDir, 'concurrency-owner-sentinel'))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('rejects duplicate claimed child tokens before discovery', async () => {
    const root = mkdtempSync(join(tmpdir(), 'contentos-concurrent-claim-test-'));
    try {
      const claims = [
        makeClaim(root, 'child-one', 'a'.repeat(32), 'b'.repeat(32)),
        makeClaim(root, 'child-two', 'a'.repeat(32), 'b'.repeat(32)),
      ];
      await expect(discoverOwnedStates({ claims, timeoutMs: 100 })).rejects.toThrow('more than one ownership claim');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('rejects a ready state that violates its exact claim identity', async () => {
    const root = mkdtempSync(join(tmpdir(), 'contentos-concurrent-claim-test-'));
    try {
      const claims = [
        makeClaim(root, 'child-one', 'a'.repeat(32), 'b'.repeat(32)),
        makeClaim(root, 'child-two', 'a'.repeat(32), 'c'.repeat(32)),
      ] as const;
      const invalid = writeState(claims[0]);
      writeFileSync(invalid.stateFile, JSON.stringify({ ...invalid, runDir: join(root, 'other') }));
      await expect(discoverOwnedStates({ claims, timeoutMs: 100 })).rejects.toThrow(
        'exact run-directory identity validation',
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('retains successful ready states whose filesystem lifetimes never overlap', async () => {
    const root = mkdtempSync(join(tmpdir(), 'contentos-concurrent-claim-test-'));
    const firstResult = deferredResult();
    const secondResult = deferredResult();
    try {
      const claims = [
        makeClaim(root, 'child-one', 'a'.repeat(32), 'b'.repeat(32)),
        makeClaim(root, 'child-two', 'a'.repeat(32), 'c'.repeat(32)),
      ] as const;
      const coordination = coordinateConcurrentSmoke({
        claims,
        children: [managedChild(claims[0], firstResult.promise), managedChild(claims[1], secondResult.promise)],
        discoveryTimeoutMs: 500,
        completionTimeoutMs: 500,
        terminationGraceMs: 20,
        killGraceMs: 20,
        pollMs: 2,
        verifyOwnedCleanup: async (_claims, states) => {
          expect(states).toHaveLength(2);
          expect(states.every((state) => !existsSync(state.runDir))).toBe(true);
        },
      });

      const first = writeState(claims[0]);
      await new Promise((resolve) => setTimeout(resolve, 15));
      rmSync(first.runDir, { recursive: true, force: true });
      firstResult.resolve({ code: 0, signal: null, output: '' });
      await new Promise((resolve) => setTimeout(resolve, 15));
      const second = writeState(claims[1]);
      await new Promise((resolve) => setTimeout(resolve, 15));
      rmSync(second.runDir, { recursive: true, force: true });
      secondResult.resolve({ code: 0, signal: null, output: '' });

      await expect(coordination).resolves.toEqual([first, second]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('fails promptly, terminates only the remaining claimed child, and preserves unrelated resources', async () => {
    const root = mkdtempSync(join(tmpdir(), 'contentos-concurrent-claim-test-'));
    const ownedParent = join(root, 'owned-parent');
    const unrelatedParent = join(root, 'unrelated-parent');
    mkdirSync(ownedParent);
    mkdirSync(unrelatedParent);
    const remainingResult = deferredResult();
    const signals: NodeJS.Signals[] = [];
    try {
      const claims = [
        makeClaim(ownedParent, 'child-one', 'a'.repeat(32), 'b'.repeat(32)),
        makeClaim(ownedParent, 'child-two', 'a'.repeat(32), 'c'.repeat(32)),
      ] as const;
      const remainingState = writeState(claims[1]);
      const unrelatedClaim = makeClaim(unrelatedParent, 'child', 'd'.repeat(32), 'e'.repeat(32));
      const unrelatedState = writeState(unrelatedClaim);
      const marker = join(unrelatedClaim.runDir, 'unrelated-marker');
      writeFileSync(marker, 'leave untouched');

      const startedAt = Date.now();
      let failure: Error | undefined;
      try {
        await coordinateConcurrentSmoke({
          claims,
          children: [
            managedChild(
              claims[0],
              Promise.resolve({
                code: 1,
                signal: null,
                output: 'Test Files failed SECRET=do-not-echo Source body private-text',
              }),
            ),
            managedChild(claims[1], remainingResult.promise, (signal) => {
              signals.push(signal);
              if (signal === 'SIGTERM') {
                rmSync(claims[1].runDir, { recursive: true, force: true });
                remainingResult.resolve({ code: null, signal: 'SIGTERM', output: '' });
              }
            }),
          ],
          discoveryTimeoutMs: 1_000,
          terminationGraceMs: 50,
          killGraceMs: 50,
          pollMs: 2,
          verifyOwnedCleanup: async (expectedClaims, states) => {
            expect(expectedClaims).toEqual(claims);
            expect(states).toEqual([remainingState]);
            expect(existsSync(claims[1].runDir)).toBe(false);
            expect(readFileSync(marker, 'utf8')).toBe('leave untouched');
          },
        });
      } catch (error) {
        failure = error as Error;
      }

      expect(Date.now() - startedAt).toBeLessThan(500);
      expect(failure?.message).toContain('exited before authenticated state publication');
      expect(failure?.message).toContain('child-1 exit=1 signal=none category=test-run-failed test=unclassified');
      expect(failure?.message).not.toContain('do-not-echo');
      expect(failure?.message).not.toContain('private-text');
      expect(failure?.message).not.toContain(root);
      expect(signals).toEqual(['SIGTERM']);
      expect(readFileSync(marker, 'utf8')).toBe('leave untouched');
      expect(readFileSync(unrelatedClaim.stateFile, 'utf8')).toBe(JSON.stringify(unrelatedState));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('escalates SIGTERM to SIGKILL and never reports an invalid claimed cleanup as verified', async () => {
    const root = mkdtempSync(join(tmpdir(), 'contentos-concurrent-claim-test-'));
    const remainingResult = deferredResult();
    const signals: NodeJS.Signals[] = [];
    try {
      const claims = [
        makeClaim(root, 'child-one', 'a'.repeat(32), 'b'.repeat(32)),
        makeClaim(root, 'child-two', 'a'.repeat(32), 'c'.repeat(32)),
      ] as const;
      writeState(claims[1]);
      await expect(
        coordinateConcurrentSmoke({
          claims,
          children: [
            managedChild(claims[0], Promise.resolve({ code: 1, signal: null, output: '' })),
            managedChild(claims[1], remainingResult.promise, (signal) => {
              signals.push(signal);
              if (signal === 'SIGKILL') remainingResult.resolve({ code: null, signal: 'SIGKILL', output: '' });
            }),
          ],
          discoveryTimeoutMs: 1_000,
          terminationGraceMs: 10,
          killGraceMs: 50,
          pollMs: 2,
          verifyOwnedCleanup: async () => {
            throw new Error('expected claim invalid');
          },
        }),
      ).rejects.toThrow('remaining-child=clean owned-cleanup=failed');
      expect(signals).toEqual(['SIGTERM', 'SIGKILL']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('reports child teardown failure even when physical claim cleanup succeeds', async () => {
    const root = mkdtempSync(join(tmpdir(), 'contentos-concurrent-claim-test-'));
    try {
      const claims = [
        makeClaim(root, 'child-one', 'a'.repeat(32), 'b'.repeat(32)),
        makeClaim(root, 'child-two', 'a'.repeat(32), 'c'.repeat(32)),
      ] as const;
      await expect(
        coordinateConcurrentSmoke({
          claims,
          children: [
            managedChild(
              claims[0],
              Promise.resolve({ code: 1, signal: null, output: 'setup=partial-compose-injected teardown=failed' }),
            ),
            managedChild(claims[1], Promise.resolve({ code: 1, signal: null, output: '' })),
          ],
          discoveryTimeoutMs: 100,
          pollMs: 2,
          verifyOwnedCleanup: async () => undefined,
        }),
      ).rejects.toThrow('owned-cleanup=failed');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('safe concurrent failure attribution', () => {
  it('recognizes one plain failed-module and FAIL summary basename', () => {
    const output = [
      ' ❯ packages/testing/src/integration/worker-dispatcher.test.ts (2 tests | 1 failed) 12ms',
      ' FAIL  packages/testing/src/integration/worker-dispatcher.test.ts > repaired dispatch',
      ' Test Files  1 failed (1)',
      '',
    ].join('\n');

    expect(extractIntegrationTestBasename(output)).toBe('worker-dispatcher.test.ts');
  });

  it('strips ANSI formatting and deduplicates repeated metadata', () => {
    const output = [
      '\u001b[31m ❯ packages/testing/src/integration/url-capture.test.ts (3 tests | 1 failed | 1 skipped) 7ms\u001b[39m',
      '\u001b[1m FAIL  packages/testing/src/integration/url-capture.test.ts > capture\u001b[22m',
      '',
    ].join('\n');

    expect(extractIntegrationTestBasename(output)).toBe('url-capture.test.ts');
  });

  it('drops only a flagged truncated leading fragment', () => {
    const metadata = '❯ packages/testing/src/integration/api.test.ts (2 tests | 1 failed) 4ms\n';

    expect(extractIntegrationTestBasename(metadata, true)).toBe('unclassified');
    expect(extractIntegrationTestBasename(metadata, false)).toBe('api.test.ts');
  });

  it('requires a complete trailing metadata line', () => {
    expect(
      extractIntegrationTestBasename('❯ packages/testing/src/integration/api.test.ts (2 tests | 1 failed) 4ms'),
    ).toBe('unclassified');
  });

  it.each([
    ' ❯ packages/testing/src/integration/api.test.ts (2 tests | 1 failed) 4ms\n ❯ packages/testing/src/integration/web.test.ts (2 tests | 1 failed) 4ms\n',
    ' ❯ packages/testing/src/integration/api.test.ts (2 tests | 1 failed) 4ms\n ❯ packages/testing/src/integration/api.test.ts (2 tests | 1 failed) 4ms\n ❯ packages/testing/src/integration/web.test.ts (2 tests | 1 failed) 4ms\n',
  ])('returns unclassified when metadata has zero or multiple distinct basenames', (output) => {
    expect(extractIntegrationTestBasename(output)).toBe('unclassified');
  });

  it('ignores passing modules, stack paths, malformed lines, and incomplete output', () => {
    const output = [
      ' ✓ packages/testing/src/integration/api.test.ts (2 tests) 4ms',
      ' ❯ packages/testing/src/integration/invalid_name.test.ts (2 tests | 1 failed) 4ms',
      ' ❯ packages/testing/src/integration/api.test.ts (2 tests | 1 failed)',
      ' ❯ /private/tmp/api.test.ts (2 tests | 1 failed) 4ms',
      ' at /private/tmp/project/packages/testing/src/integration/web.test.ts:3:4',
      ' FAIL packages/testing/src/integration/api.test.ts >',
    ].join('\n');

    expect(extractIntegrationTestBasename(output)).toBe('unclassified');
  });

  it('does not return sensitive adjacent output or a standalone path', () => {
    const output = [
      'AssertionError: private body https://private.example.test/secret TOKEN=do-not-echo',
      ' at /Users/private/project/packages/testing/src/integration/source.test.ts:3:4',
      'packages/testing/src/integration/source.test.ts',
      '',
    ].join('\n');

    const attribution = extractIntegrationTestBasename(output);
    expect(attribution).toBe('unclassified');
    expect(attribution).not.toContain('private.example');
    expect(attribution).not.toContain('do-not-echo');
  });

  it('adds only the safe basename to a test-run-failed child diagnostic', async () => {
    const root = mkdtempSync(join(tmpdir(), 'contentos-concurrent-attribution-test-'));
    const remainingResult = deferredResult();
    const claims = [
      makeClaim(root, 'child-one', 'a'.repeat(32), 'b'.repeat(32)),
      makeClaim(root, 'child-two', 'a'.repeat(32), 'c'.repeat(32)),
    ] as const;
    try {
      await expect(
        coordinateConcurrentSmoke({
          claims,
          children: [
            managedChild(
              claims[0],
              Promise.resolve({
                code: 1,
                signal: null,
                output: [
                  ' ❯ packages/testing/src/integration/api.test.ts (2 tests | 1 failed) 4ms',
                  ' FAIL  packages/testing/src/integration/api.test.ts > login TOKEN=do-not-echo',
                  ' Test Files  1 failed (1)',
                  '',
                ].join('\n'),
              }),
            ),
            managedChild(claims[1], remainingResult.promise, (signal) => {
              if (signal === 'SIGTERM') remainingResult.resolve({ code: null, signal: 'SIGTERM', output: '' });
            }),
          ],
          discoveryTimeoutMs: 100,
          terminationGraceMs: 50,
          killGraceMs: 50,
          pollMs: 2,
          verifyOwnedCleanup: async () => undefined,
        }),
      ).rejects.toThrow(/category=test-run-failed test=api\.test\.ts captured-bytes=\d+/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
