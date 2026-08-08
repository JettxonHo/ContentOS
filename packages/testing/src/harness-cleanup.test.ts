import type { ChildProcess } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  acquireBuildLock,
  captureAndPublishManagedProcess,
  classifySetupFailure,
  emptyAndDeleteBucket,
  formatHarnessCleanupRecord,
  HarnessCleanupError,
  rollbackManagedProcessHandoff,
  runTeardownAttempt,
  type TeardownAttemptState,
  type ManagedProcessHandoffState,
} from './integration/harness.js';
import { emitHarnessTeardownFailure } from './integration/global-setup.js';
import type { ManagedProcessIdentity } from './integration/process-identity.js';
import type { signedFetch } from './integration/sigv4.js';

const credentials = { accessKeyId: 'test-access', secretAccessKey: 'test-secret' };

describe('safe Harness teardown record transport', () => {
  it('formats structured cleanup fields into one fixed record without CR/LF', () => {
    const record = formatHarnessCleanupRecord(new HarnessCleanupError(['synthetic'], 'clean', 'removed'));

    expect(record).toBe('contentos smoke harness teardown failed: cleanup=synthetic physical=clean capsule=removed');
    expect(record).not.toMatch(/[\r\n]/);
  });

  it('fails closed for arbitrary errors without exposing message-like input', () => {
    const secretAndPath = 'secret-value /private/tmp/contentos-owner-password';
    const record = formatHarnessCleanupRecord(new Error(`cleanup failed: ${secretAndPath}`));

    expect(record).toBe(
      'contentos smoke harness teardown failed: cleanup=unclassified physical=incomplete capsule=preserved',
    );
    expect(record).not.toContain(secretAndPath);
  });

  it('writes exactly one LF-terminated record, sets failure status, and rethrows the same error', () => {
    const error = new HarnessCleanupError(['synthetic'], 'clean', 'removed');
    const previousExitCode = process.exitCode;
    const stderrWrite = vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
      expect(process.exitCode).toBe(1);
      expect(chunk).toBe('contentos smoke harness teardown failed: cleanup=synthetic physical=clean capsule=removed\n');
      return true;
    });
    process.exitCode = 0;
    try {
      let thrown: unknown;
      try {
        emitHarnessTeardownFailure(error);
      } catch (caught) {
        thrown = caught;
      }
      expect(thrown).toBe(error);
      expect(process.exitCode).toBe(1);
      expect(stderrWrite).toHaveBeenCalledTimes(1);
      expect(stderrWrite).toHaveBeenCalledWith(
        'contentos smoke harness teardown failed: cleanup=synthetic physical=clean capsule=removed\n',
      );
    } finally {
      stderrWrite.mockRestore();
      process.exitCode = previousExitCode;
    }
  });
});

describe('smoke S3 cleanup', () => {
  it('decodes escaped pagination tokens once and attempts later pages and bucket deletion after an object throw', async () => {
    const calls: Array<{ method: string; url: string }> = [];
    let listCount = 0;
    const request: typeof signedFetch = async (options) => {
      calls.push({ method: options.method, url: options.url });
      if (options.method === 'GET') {
        listCount += 1;
        if (listCount === 1) {
          return new Response(
            '<ListBucketResult><IsTruncated>true</IsTruncated><Contents><Key>folder/a&amp;b</Key></Contents><NextContinuationToken>tok&amp;en%3F</NextContinuationToken></ListBucketResult>',
            { status: 200 },
          );
        }
        expect(new URL(options.url).searchParams.get('continuation-token')).toBe('tok&en%3F');
        return new Response('<ListBucketResult><IsTruncated>false</IsTruncated></ListBucketResult>', { status: 200 });
      }
      if (options.url.includes('/folder/')) throw new Error('injected object-delete transport failure');
      return new Response(null, { status: 204 });
    };

    await expect(
      emptyAndDeleteBucket('http://127.0.0.1:8333', credentials, 'test-bucket', { request }),
    ).rejects.toThrow('object delete request threw');

    expect(calls.filter((call) => call.method === 'GET')).toHaveLength(2);
    expect(calls.at(-1)).toEqual({ method: 'DELETE', url: 'http://127.0.0.1:8333/test-bucket' });
  });

  it('attempts bucket deletion after the list request throws', async () => {
    const methods: string[] = [];
    const request: typeof signedFetch = async (options) => {
      methods.push(options.method);
      if (options.method === 'GET') throw new Error('injected list transport failure');
      return new Response(null, { status: 204 });
    };

    await expect(
      emptyAndDeleteBucket('http://127.0.0.1:8333', credentials, 'test-bucket', { request }),
    ).rejects.toThrow('bucket list request threw');
    expect(methods).toEqual(['GET', 'DELETE']);
  });

  it('decodes a literal entity-like object key exactly once', async () => {
    const deletes: string[] = [];
    const request: typeof signedFetch = async (options) => {
      if (options.method === 'GET') {
        return new Response(
          '<ListBucketResult><IsTruncated>false</IsTruncated><Contents><Key>folder/literal&amp;lt;.txt</Key></Contents></ListBucketResult>',
          { status: 200 },
        );
      }
      deletes.push(options.url);
      return new Response(null, { status: 204 });
    };

    await emptyAndDeleteBucket('http://127.0.0.1:8333', credentials, 'test-bucket', { request });
    expect(deletes[0]).toBe('http://127.0.0.1:8333/test-bucket/folder/literal%26lt%3B.txt');
  });
});

describe('smoke build lock', () => {
  it('reclaims malformed and dead-owner locks but preserves a live lock', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'contentos-build-lock-test-'));
    const lockFile = join(directory, 'build.lock');
    try {
      writeFileSync(lockFile, 'malformed');
      const old = new Date(Date.now() - 60_000);
      utimesSync(lockFile, old, old);
      const releaseMalformed = await acquireBuildLock({ lockFile, malformedGraceMs: 1, timeoutMs: 100, pollMs: 1 });
      releaseMalformed();

      writeFileSync(lockFile, JSON.stringify({ pid: 999_999, token: 'a'.repeat(32) }));
      const releaseStale = await acquireBuildLock({
        lockFile,
        processIsAlive: () => false,
        timeoutMs: 100,
        pollMs: 1,
      });
      releaseStale();

      const livePayload = JSON.stringify({ pid: 42, token: 'b'.repeat(32) });
      writeFileSync(lockFile, livePayload);
      await expect(
        acquireBuildLock({ lockFile, processIsAlive: () => true, timeoutMs: 20, pollMs: 1 }),
      ).rejects.toThrow('Timed out');
      expect(readFileSync(lockFile, 'utf8')).toBe(livePayload);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('closes and removes its unpublished candidate when writing fails', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'contentos-build-lock-write-test-'));
    const lockFile = join(directory, 'build.lock');
    try {
      await expect(
        acquireBuildLock({
          lockFile,
          timeoutMs: 20,
          writeCandidate: () => {
            throw new Error('injected candidate write failure');
          },
        }),
      ).rejects.toThrow('injected candidate write failure');
      expect(() => readFileSync(lockFile)).toThrow();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});

describe('managed process handoff cleanup', () => {
  it('retains pending and full ownership when control publication fails, then rolls back exactly once', async () => {
    const unref = vi.fn();
    const child = { pid: 321, unref } as unknown as ChildProcess;
    const identity: ManagedProcessIdentity = {
      role: 'api',
      pid: 321,
      pgid: 321,
      startIdentity: 'a'.repeat(64),
      executableFingerprint: 'b'.repeat(64),
      commandFingerprint: 'c'.repeat(64),
    };
    const state: ManagedProcessHandoffState = {
      apiProcess: undefined,
      webProcess: undefined,
      pendingApiProcess: undefined,
      pendingWebProcess: undefined,
    };
    const published: ManagedProcessIdentity[] = [];

    await expect(
      captureAndPublishManagedProcess(state, 'api', child, {
        capture: async () => identity,
        publish: () => {
          published.push(identity);
          throw new Error('managed-process-control-publication-failed');
        },
      }),
    ).rejects.toThrow('managed-process-control-publication-failed');

    expect(published).toEqual([identity]);
    expect(state.apiProcess).toEqual(identity);
    expect(state.pendingApiProcess?.pid).toBe(321);
    expect(state.pendingApiProcess?.pgid).toBe(321);
    expect(unref).not.toHaveBeenCalled();
    expect(classifySetupFailure(new Error('managed-process-control-publication-failed'))).toBe(
      'process-identity-failed',
    );

    const stopped: ManagedProcessIdentity[] = [];
    await rollbackManagedProcessHandoff(state, 'api', {
      stopManaged: async (record) => {
        stopped.push(record);
      },
    });
    expect(stopped).toEqual([identity]);
    expect(state.apiProcess).toBeUndefined();
    expect(state.pendingApiProcess).toBeUndefined();
  });

  it('retries rollback after a failed stop instead of treating incomplete cleanup as stopped', async () => {
    const child = { pid: 322, unref: vi.fn() } as unknown as ChildProcess;
    const identity: ManagedProcessIdentity = {
      role: 'api',
      pid: 322,
      pgid: 322,
      startIdentity: 'd'.repeat(64),
      executableFingerprint: 'e'.repeat(64),
      commandFingerprint: 'f'.repeat(64),
    };
    const state: ManagedProcessHandoffState = {
      apiProcess: identity,
      webProcess: undefined,
      pendingApiProcess: { role: 'api', child, pid: 322, pgid: 322 },
      pendingWebProcess: undefined,
    };
    let stopCalls = 0;
    let capsuleRemoved = false;
    const attemptState: TeardownAttemptState = { stopped: false, stopping: false };
    const physicalClean = (): boolean =>
      state.apiProcess === undefined &&
      state.pendingApiProcess === undefined &&
      state.webProcess === undefined &&
      state.pendingWebProcess === undefined;
    const stopManaged = async (): Promise<void> => {
      stopCalls += 1;
      if (stopCalls === 1) throw new Error('managed-process-still-alive');
    };

    await expect(
      runTeardownAttempt(attemptState, async () => {
        await rollbackManagedProcessHandoff(state, 'api', { stopManaged });
        if (physicalClean()) attemptState.stopped = true;
      }),
    ).rejects.toThrow('managed-process-still-alive');
    expect(stopCalls).toBe(1);
    expect(physicalClean()).toBe(false);
    expect(capsuleRemoved).toBe(false);
    expect(attemptState.stopped).toBe(false);
    expect(attemptState.stopping).toBe(false);
    expect(classifySetupFailure(new Error('managed-process-term-failed'))).toBe('process-identity-failed');

    await runTeardownAttempt(attemptState, async () => {
      await rollbackManagedProcessHandoff(state, 'api', { stopManaged });
      if (physicalClean()) {
        capsuleRemoved = true;
        attemptState.stopped = true;
      }
    });
    expect(stopCalls).toBe(2);
    expect(physicalClean()).toBe(true);
    expect(attemptState.stopped).toBe(true);
    expect(attemptState.stopping).toBe(true);
    expect(capsuleRemoved).toBe(true);
    expect(state.apiProcess).toBeUndefined();
    expect(state.pendingApiProcess).toBeUndefined();
  });
});
