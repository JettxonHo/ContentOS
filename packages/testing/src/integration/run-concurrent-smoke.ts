import { spawn } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  rmdirSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { stripVTControlCharacters } from 'node:util';

import { composeDown, parseComposeProjectNames } from './compose.ts';
import {
  readComposeCredentials,
  readManagedProcessControl,
  readOwnershipClaim,
  SMOKE_CHILD_TOKEN_ENV,
  SMOKE_CLAIM_FILE_ENV,
  SMOKE_PARENT_TOKEN_ENV,
  writeManagedProcessControl,
  type SmokeOwnershipClaim,
  type SmokeState,
} from './env.ts';
import { acquireBuildLock } from './harness.ts';
import { run } from './process.ts';
import { stopManagedProcess, type ManagedProcessIdentity } from './process-identity.ts';

const DISCOVERY_TIMEOUT_MS = 240_000;
const COMPLETION_TIMEOUT_MS = 240_000;
const TERMINATION_GRACE_MS = 75_000;
const KILL_GRACE_MS = 10_000;
const MAX_CAPTURED_OUTPUT = 8_192;

const FAILED_MODULE_LINE =
  /^\s*❯\s+packages\/testing\/src\/integration\/([a-z0-9-]+\.test\.ts)\s+\(\d+\s+tests?\s+\|\s+\d+\s+failed(?:\s+\|\s+\d+\s+(?:skipped|todo))*\)\s+\d+ms(?:\s+\d+\s+MB heap used)?\s*$/;
const FAILED_SUMMARY_LINE =
  /^\s*FAIL\s+packages\/testing\/src\/integration\/([a-z0-9-]+\.test\.ts)(?:\s+>\s+\S.*)?\s*$/;
const FETCHER_GATEWAY_FAIL_LINE =
  /^\s*FAIL\s+packages\/testing\/src\/integration\/fetcher-gateway-api\.test\.ts(?:\s+>\s+(.+?))?\s*$/;
const FETCHER_GATEWAY_CASE_MARKER = /\[FG-[^\]\r\n]*\]/gi;
const FETCHER_GATEWAY_CASE_IDS = new Set(
  Array.from({ length: 11 }, (_, index) => `FG-${String(index + 1).padStart(2, '0')}`),
);

export interface ChildResult {
  readonly code: number | null;
  readonly signal: NodeJS.Signals | null;
  readonly output: string;
  readonly outputStartsMidLine?: boolean;
  readonly startFailed?: boolean;
}

export interface ManagedSmokeChild {
  readonly claim: SmokeOwnershipClaim;
  readonly result: Promise<ChildResult>;
  signal(signal: NodeJS.Signals): void;
}

export interface TrackedSmokeChild {
  readonly child: ManagedSmokeChild;
  readonly settled: Promise<void>;
  result?: ChildResult;
}

function signalProcessGroup(childPid: number | undefined, signal: NodeJS.Signals): void {
  if (childPid === undefined) return;
  try {
    if (process.platform === 'win32') {
      process.kill(childPid, signal);
    } else {
      process.kill(-childPid, signal);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error;
  }
}

function startCompleteSmoke(claim: SmokeOwnershipClaim, extraEnv: NodeJS.ProcessEnv = {}): ManagedSmokeChild {
  const child = spawn('corepack', ['pnpm', 'test:integration'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...extraEnv,
      [SMOKE_PARENT_TOKEN_ENV]: claim.ownership.parentToken,
      [SMOKE_CHILD_TOKEN_ENV]: claim.ownership.childToken,
      [SMOKE_CLAIM_FILE_ENV]: claim.claimFile,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
  });
  let output = '';
  let outputStartsMidLine = false;
  const capture = (chunk: Buffer): void => {
    const combined = `${output}${chunk.toString('utf8')}`;
    const boundary = combined.length - MAX_CAPTURED_OUTPUT;
    if (boundary > 0) {
      outputStartsMidLine = combined[boundary - 1] !== '\n';
    } else if (outputStartsMidLine && combined.includes('\n')) {
      outputStartsMidLine = false;
    }
    output = combined.slice(-MAX_CAPTURED_OUTPUT);
  };
  child.stdout.on('data', capture);
  child.stderr.on('data', capture);
  const result = new Promise<ChildResult>((resolve) => {
    child.once('error', () => resolve({ code: null, signal: null, output, outputStartsMidLine, startFailed: true }));
    child.once('close', (code, signal) => resolve({ code, signal, output, outputStartsMidLine }));
  });
  return { claim, result, signal: (signal) => signalProcessGroup(child.pid, signal) };
}

export function createConcurrentClaims(rootDirectory: string, parentToken: string): readonly SmokeOwnershipClaim[] {
  const parentRoot = mkdtempSync(join(rootDirectory, 'contentos-smoke-concurrent-'));
  const childTokens = [randomBytes(16).toString('hex'), randomBytes(16).toString('hex')];
  while (childTokens[1] === childTokens[0]) childTokens[1] = randomBytes(16).toString('hex');
  try {
    return ['child-one', 'child-two'].map((name, index): SmokeOwnershipClaim => {
      const runDir = join(parentRoot, name);
      mkdirSync(runDir, { mode: 0o700 });
      const claim: SmokeOwnershipClaim = {
        schemaVersion: 'contentos/smoke-ownership-claim/v1',
        mode: 'concurrent',
        parentRoot,
        runDir,
        claimFile: join(runDir, 'ownership-claim.json'),
        processFile: join(runDir, 'managed-processes.json'),
        stateFile: join(runDir, 'ready-state.json'),
        projectName: `contentos-smoke-${randomBytes(4).toString('hex')}`,
        ownership: { parentToken, childToken: childTokens[index]! },
      };
      writeFileSync(claim.claimFile, `${JSON.stringify(claim, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
      chmodSync(claim.claimFile, 0o600);
      writeManagedProcessControl(claim, []);
      return readOwnershipClaim(claim.claimFile);
    });
  } catch (error) {
    rmSync(parentRoot, { recursive: true, force: true });
    throw error;
  }
}

function trackChildren(children: readonly ManagedSmokeChild[]): readonly TrackedSmokeChild[] {
  return children.map((child) => {
    const tracker: TrackedSmokeChild = {
      child,
      settled: child.result
        .catch((): ChildResult => ({ code: null, signal: null, output: '', startFailed: true }))
        .then((result) => {
          tracker.result = result;
        }),
    };
    return tracker;
  });
}

/**
 * Extract one safe Integration test basename from complete Vitest metadata
 * lines. The bounded child tail can begin or end in the middle of a line, so
 * only newline-terminated records are eligible for attribution. The caller
 * supplies `outputStartsMidLine` only when the slice boundary proves that the
 * first retained fragment is incomplete.
 */
export function extractIntegrationTestBasename(output: string, outputStartsMidLine = false): string {
  const normalized = stripVTControlCharacters(output);
  const lines = normalized.split('\n');
  if (!normalized.endsWith('\n')) lines.pop();
  if (outputStartsMidLine) lines.shift();
  const basenames = new Set<string>();
  for (const line of lines) {
    const candidate = line.endsWith('\r') ? line.slice(0, -1) : line;
    const moduleMatch = FAILED_MODULE_LINE.exec(candidate);
    const summaryMatch = FAILED_SUMMARY_LINE.exec(candidate);
    const basename = moduleMatch?.[1] ?? summaryMatch?.[1];
    if (basename) basenames.add(basename);
  }
  return basenames.size === 1 ? [...basenames][0]! : 'unclassified';
}

/**
 * Extract one safe Fetcher Gateway case ID from complete Vitest FAIL metadata.
 * Only the exact Fetcher Gateway integration path and one allowlisted marker
 * on that same newline-terminated line are eligible for attribution.
 */
export function extractFetcherGatewayCase(output: string, outputStartsMidLine = false): string {
  const normalized = stripVTControlCharacters(output);
  const lines = normalized.split('\n');
  if (!normalized.endsWith('\n')) lines.pop();
  if (outputStartsMidLine) lines.shift();

  const caseIds = new Set<string>();
  let invalidMetadata = false;
  for (const line of lines) {
    const candidate = line.endsWith('\r') ? line.slice(0, -1) : line;
    const match = FETCHER_GATEWAY_FAIL_LINE.exec(candidate);
    if (!match) continue;
    const markers = match[1]?.match(FETCHER_GATEWAY_CASE_MARKER) ?? [];
    if (markers.length !== 1) {
      invalidMetadata = true;
      continue;
    }
    const caseId = markers[0]!.slice(1, -1);
    if (!FETCHER_GATEWAY_CASE_IDS.has(caseId)) {
      invalidMetadata = true;
      continue;
    }
    caseIds.add(caseId.toLowerCase());
  }
  return !invalidMetadata && caseIds.size === 1 ? [...caseIds][0]! : 'unclassified';
}

function childDiagnostic(index: number, result: ChildResult): string {
  const combinedSetup = result.output.match(/contentos smoke setup failed: setup=([a-z-]+) teardown=(clean|failed)/);
  const cleanupMatch = result.output.match(
    /(?:harness teardown failed:|teardown=failed) cleanup=([a-z,-]+) physical=(clean|incomplete) capsule=(removed|preserved)/,
  );
  const allowlistedCleanup = new Set([
    'managed-process',
    'process-control',
    'object-storage',
    'compose',
    'compose-verify',
    'root',
    'synthetic',
  ]);
  const cleanupCategories = cleanupMatch?.[1]?.split(',') ?? [];
  const cleanupCategory =
    cleanupCategories.length > 0 && cleanupCategories.every((category) => allowlistedCleanup.has(category))
      ? `cleanup-${cleanupCategories[0]}`
      : undefined;
  const category = result.startFailed
    ? 'start-failed'
    : cleanupCategory
      ? cleanupCategory
      : result.output.includes('teardown=failed')
        ? 'cleanup-failed'
        : combinedSetup
          ? `setup-${combinedSetup[1]}`
          : result.output.includes('Docker engine is not available')
            ? 'docker-unavailable'
            : result.output.includes('Application build failed')
              ? 'build-failed'
              : result.output.includes('Compose up failed')
                ? 'compose-start-failed'
                : result.output.includes('Database migration failed')
                  ? 'migration-failed'
                  : result.output.includes('error during close')
                    ? 'cleanup-failed'
                    : result.output.includes('Test Files')
                      ? 'test-run-failed'
                      : 'unclassified';
  const code = Number.isInteger(result.code) ? String(result.code) : 'none';
  const signal = result.signal && /^SIG[A-Z0-9]+$/.test(result.signal) ? result.signal : 'none';
  const outputBytes = Math.min(Buffer.byteLength(result.output, 'utf8'), MAX_CAPTURED_OUTPUT);
  const testAttribution =
    category === 'test-run-failed' ? extractIntegrationTestBasename(result.output, result.outputStartsMidLine) : '';
  const caseAttribution =
    testAttribution === 'fetcher-gateway-api.test.ts'
      ? ` case=${extractFetcherGatewayCase(result.output, result.outputStartsMidLine)}`
      : '';
  const testDiagnostic = category === 'test-run-failed' ? ` test=${testAttribution}${caseAttribution}` : '';
  return `child-${index + 1} exit=${code} signal=${signal} category=${category}${testDiagnostic} captured-bytes=${outputBytes}`;
}

interface RuntimeEvidence {
  readonly envFingerprint: string;
  readonly credentialFingerprints: Readonly<Record<string, string>>;
}

function captureRuntimeEvidence(state: SmokeState): RuntimeEvidence {
  const envBytes = readFileSync(state.envFile);
  const credentials = readComposeCredentials(state.envFile);
  const credentialNames = [
    'POSTGRES_PASSWORD',
    'REDIS_PASSWORD',
    'OBJECT_STORAGE_ACCESS_KEY',
    'OBJECT_STORAGE_SECRET_KEY',
    'CONTENTOS_FETCHER_GATEWAY_SECRET',
    'CONTENTOS_TEST_OWNER_PASSWORD',
  ] as const;
  const credentialFingerprints: Record<string, string> = {};
  for (const name of credentialNames) {
    const value = credentials[name];
    if (!value) throw new Error(`Concurrent smoke credential evidence was incomplete for ${name}.`);
    credentialFingerprints[name] = createHash('sha256').update(value).digest('hex');
  }
  return {
    envFingerprint: createHash('sha256').update(envBytes).digest('hex'),
    credentialFingerprints,
  };
}

async function waitForChildren(trackers: readonly TrackedSmokeChild[], timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (trackers.some((tracker) => tracker.result === undefined) && Date.now() < deadline) {
    const unsettled = trackers.filter((tracker) => tracker.result === undefined).map((tracker) => tracker.settled);
    await Promise.race([new Promise((resolve) => setTimeout(resolve, 25)), ...unsettled]);
  }
  return trackers.every((tracker) => tracker.result !== undefined);
}

async function terminateRemainingChildren(
  trackers: readonly TrackedSmokeChild[],
  terminationGraceMs: number,
  killGraceMs: number,
): Promise<'clean' | 'signal-failed' | 'kill-timeout'> {
  let signalFailed = false;
  for (const tracker of trackers) {
    if (tracker.result !== undefined) continue;
    try {
      tracker.child.signal('SIGTERM');
    } catch {
      signalFailed = true;
    }
  }
  if (await waitForChildren(trackers, terminationGraceMs)) return signalFailed ? 'signal-failed' : 'clean';

  for (const tracker of trackers) {
    if (tracker.result !== undefined) continue;
    try {
      tracker.child.signal('SIGKILL');
    } catch {
      signalFailed = true;
    }
  }
  if (!(await waitForChildren(trackers, killGraceMs))) return 'kill-timeout';
  return signalFailed ? 'signal-failed' : 'clean';
}

function safeCoordinationMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  return /^(A concurrent smoke|An owned smoke|Timed out discovering|Concurrent smoke|A smoke state|Expected exactly|Cannot write)/.test(
    message,
  )
    ? message.slice(0, 1_024)
    : 'Concurrent smoke coordination failed.';
}

export async function coordinateConcurrentSmoke(options: {
  readonly claims: readonly SmokeOwnershipClaim[];
  readonly children: readonly ManagedSmokeChild[];
  readonly discoveryTimeoutMs?: number;
  readonly completionTimeoutMs?: number;
  readonly terminationGraceMs?: number;
  readonly killGraceMs?: number;
  readonly pollMs?: number;
  readonly onAuthenticatedState?: (state: SmokeState) => void;
  readonly onStatesReady?: (states: readonly SmokeState[]) => void;
  readonly verifyOwnedCleanup: (claims: readonly SmokeOwnershipClaim[], states: readonly SmokeState[]) => Promise<void>;
}): Promise<readonly SmokeState[]> {
  const childTokens = options.claims.map((claim) => claim.ownership.childToken);
  if (
    options.claims.length !== 2 ||
    options.children.length !== 2 ||
    new Set(childTokens).size !== childTokens.length ||
    options.children.some((child, index) => JSON.stringify(child.claim) !== JSON.stringify(options.claims[index]))
  ) {
    throw new Error('Concurrent smoke managed child tokens were not distinct.');
  }
  const trackers = trackChildren(options.children);
  const capturedByChild = new Map<string, SmokeState>();
  let states: readonly SmokeState[] = [];
  try {
    states = await discoverOwnedStates({
      claims: options.claims,
      ...(options.discoveryTimeoutMs === undefined ? {} : { timeoutMs: options.discoveryTimeoutMs }),
      ...(options.pollMs === undefined ? {} : { pollMs: options.pollMs }),
      trackedChildren: trackers,
      onAuthenticatedState: (state) => {
        capturedByChild.set(state.ownership!.childToken, state);
        options.onAuthenticatedState?.(state);
      },
    });
    options.onStatesReady?.(states);

    if (!(await waitForChildren(trackers, options.completionTimeoutMs ?? COMPLETION_TIMEOUT_MS))) {
      throw new Error('A concurrent smoke child exceeded the bounded completion deadline.');
    }
    const failures = trackers
      .map((tracker, index) => ({ result: tracker.result!, index }))
      .filter(({ result }) => result.code !== 0 || result.signal !== null || result.startFailed === true);
    if (failures.length > 0) {
      throw new Error(
        `A concurrent smoke child failed after authenticated state capture. ${failures
          .map(({ result, index }) => childDiagnostic(index, result))
          .join('; ')}`,
      );
    }
  } catch (error) {
    const termination = await terminateRemainingChildren(
      trackers,
      options.terminationGraceMs ?? TERMINATION_GRACE_MS,
      options.killGraceMs ?? KILL_GRACE_MS,
    );
    let cleanup = 'verified';
    try {
      await options.verifyOwnedCleanup(options.claims, [...capturedByChild.values()]);
    } catch {
      cleanup = 'failed';
    }
    if (trackers.some((tracker) => tracker.result?.output.includes('teardown=failed'))) cleanup = 'failed';
    throw new Error(`${safeCoordinationMessage(error)} remaining-child=${termination} owned-cleanup=${cleanup}`);
  }

  await options.verifyOwnedCleanup(options.claims, states);
  return states;
}

export async function discoverOwnedStates(options: {
  readonly claims: readonly SmokeOwnershipClaim[];
  readonly timeoutMs?: number;
  readonly pollMs?: number;
  readonly trackedChildren?: readonly TrackedSmokeChild[];
  readonly onAuthenticatedState?: (state: SmokeState) => void;
}): Promise<readonly SmokeState[]> {
  const expectedChildren = new Set(options.claims.map((claim) => claim.ownership.childToken));
  if (expectedChildren.size !== options.claims.length) {
    throw new Error('An owned smoke child token appeared in more than one ownership claim.');
  }
  const ownedByChild = new Map<string, SmokeState>();
  const deadline = Date.now() + (options.timeoutMs ?? DISCOVERY_TIMEOUT_MS);
  while (Date.now() < deadline) {
    for (const claim of options.claims) {
      const { runDir, stateFile } = claim;
      if (!existsSync(stateFile)) continue;
      let parsed: unknown;
      try {
        parsed = JSON.parse(readFileSync(stateFile, 'utf8')) as unknown;
      } catch {
        // A concurrently written or unreadable state file is not classifiable yet.
        continue;
      }
      if (typeof parsed !== 'object' || parsed === null) continue;
      const state = parsed as Partial<SmokeState>;
      const childToken = state.ownership?.childToken;
      if (state.ownership?.parentToken !== claim.ownership.parentToken || childToken !== claim.ownership.childToken) {
        throw new Error('An owned smoke state failed exact ownership-claim validation.');
      }
      if (
        state.runDir !== runDir ||
        state.claimFile !== claim.claimFile ||
        state.processFile !== claim.processFile ||
        state.stateFile !== stateFile ||
        state.projectName !== claim.projectName
      ) {
        throw new Error('An owned smoke state failed exact run-directory identity validation.');
      }
      const existing = ownedByChild.get(childToken);
      if (existing && existing.runDir !== state.runDir) {
        throw new Error('An owned smoke child token appeared in more than one run directory.');
      }
      if (!existing) {
        const authenticatedState = state as SmokeState;
        ownedByChild.set(childToken, authenticatedState);
        options.onAuthenticatedState?.(authenticatedState);
      }
    }
    if (ownedByChild.size === expectedChildren.size) {
      return options.claims.map((claim) => ownedByChild.get(claim.ownership.childToken)!);
    }
    for (const [index, tracker] of (options.trackedChildren ?? []).entries()) {
      if (tracker.result && !ownedByChild.has(tracker.child.claim.ownership.childToken)) {
        throw new Error(
          `A concurrent smoke child exited before authenticated state publication. ${childDiagnostic(index, tracker.result)}`,
        );
      }
    }
    const lifecycleEvents = (options.trackedChildren ?? [])
      .filter((tracker) => !ownedByChild.has(tracker.child.claim.ownership.childToken) && tracker.result === undefined)
      .map((tracker) => tracker.settled);
    await Promise.race([new Promise((resolve) => setTimeout(resolve, options.pollMs ?? 50)), ...lifecycleEvents]);
  }
  throw new Error('Timed out discovering both token-owned concurrent smoke harness states.');
}

export function assertDistinctRuntime(
  states: readonly SmokeState[],
  evidenceByChild: ReadonlyMap<string, RuntimeEvidence>,
): readonly string[] {
  if (states.length !== 2) throw new Error('Expected exactly two concurrent smoke states.');
  const [left, right] = states;
  if (!left || !right) throw new Error('Concurrent smoke states were incomplete.');
  for (const state of states) {
    if (dirname(state.stateFile) !== state.runDir || state.stateFile !== join(state.runDir, 'ready-state.json')) {
      throw new Error('A smoke state file is not owned by its exact run directory.');
    }
  }
  if (
    !left.ownership ||
    !right.ownership ||
    left.ownership.parentToken !== right.ownership.parentToken ||
    left.ownership.childToken === right.ownership.childToken
  ) {
    throw new Error('Concurrent smoke parent/child ownership tokens were not correctly bound.');
  }
  for (const [label, leftValue, rightValue] of [
    ['run directory', left.runDir, right.runDir],
    ['state file', left.stateFile, right.stateFile],
    ['Compose project', left.projectName, right.projectName],
  ] as const) {
    if (leftValue === rightValue) throw new Error(`Concurrent smoke ${label} values collided.`);
  }
  const allPorts = [...Object.values(left.ports), ...Object.values(right.ports)];
  if (new Set(allPorts).size !== allPorts.length || allPorts.some((port) => port <= 0)) {
    throw new Error('Concurrent smoke loopback ports collided or were invalid.');
  }
  const leftEvidence = evidenceByChild.get(left.ownership.childToken);
  const rightEvidence = evidenceByChild.get(right.ownership.childToken);
  if (!leftEvidence || !rightEvidence) throw new Error('Concurrent smoke runtime evidence was incomplete.');
  for (const name of Object.keys(leftEvidence.credentialFingerprints)) {
    if (
      !leftEvidence.credentialFingerprints[name] ||
      leftEvidence.credentialFingerprints[name] === rightEvidence.credentialFingerprints[name]
    ) {
      throw new Error(`Concurrent smoke credential isolation failed for ${name}.`);
    }
  }
  if (leftEvidence.envFingerprint === rightEvidence.envFingerprint) {
    throw new Error('Concurrent smoke credential files were identical.');
  }
  return states.map((state) => state.projectName);
}

export function writeOwnedSentinels(states: readonly SmokeState[]): readonly string[] {
  return states.map((state) => {
    if (!state.ownership) throw new Error('Cannot write a sentinel for an unowned smoke state.');
    const sentinel = join(state.runDir, 'concurrency-owner-sentinel');
    writeFileSync(sentinel, state.ownership.childToken, { mode: 0o600 });
    return sentinel;
  });
}

function cleanupStateForClaim(claim: SmokeOwnershipClaim): SmokeState {
  const repoRoot = process.cwd();
  return {
    runDir: claim.runDir,
    claimFile: claim.claimFile,
    processFile: claim.processFile,
    stateFile: claim.stateFile,
    projectName: claim.projectName,
    repoRoot,
    baseFile: join(repoRoot, 'compose.yaml'),
    overrideFile: join(repoRoot, 'packages', 'testing', 'fixtures', 'compose.smoke.yaml'),
    envFile: join(claim.runDir, 'compose.env'),
    ports: { postgres: 0, redis: 0, objectStorage: 0, web: 0, api: 0 },
    webOrigin: '',
    apiOrigin: '',
    objectStorageBucket: '',
    ownership: claim.ownership,
  };
}

interface ClaimCleanupOperations {
  readonly stopManagedProcess?: (identity: ManagedProcessIdentity) => Promise<void>;
  readonly composeDown?: typeof composeDown;
  readonly listComposeProjects?: () => Promise<{ readonly ok: boolean; readonly stdout: string }>;
}

export async function cleanupAndVerifyClaims(
  claims: readonly SmokeOwnershipClaim[],
  operations: ClaimCleanupOperations = {},
): Promise<void> {
  const errors: string[] = [];
  if (
    claims.length !== 2 ||
    new Set(claims.map((claim) => claim.parentRoot)).size !== 1 ||
    new Set(claims.map((claim) => claim.runDir)).size !== 2
  ) {
    throw new Error('Expected concurrent ownership claims are missing or invalid.');
  }

  const listComposeProjects =
    operations.listComposeProjects ??
    (async () => run('docker', ['compose', 'ls', '--all', '--format', 'json'], { timeoutMs: 20_000 }));
  const composeBeforeCleanup = await listComposeProjects();
  let composeBeforeNames: ReadonlySet<string> | undefined;
  if (composeBeforeCleanup.ok) {
    try {
      composeBeforeNames = parseComposeProjectNames(composeBeforeCleanup.stdout);
    } catch {
      errors.push('Compose cleanup verification failed');
    }
  } else {
    errors.push('Compose cleanup verification failed');
  }

  for (const claim of claims) {
    if (!existsSync(claim.runDir)) continue;
    let authenticated = false;
    try {
      authenticated = JSON.stringify(readOwnershipClaim(claim.claimFile)) === JSON.stringify(claim);
    } catch {
      // A remaining root without its exact immutable claim is not removable.
    }
    if (!authenticated) {
      errors.push('expected child claim missing or invalid');
      continue;
    }

    let processControl;
    try {
      processControl = readManagedProcessControl(claim);
    } catch {
      errors.push('expected managed-process control missing or invalid');
      continue;
    }
    let processCleanupFailed = false;
    for (const managedProcess of processControl.processes) {
      try {
        await (operations.stopManagedProcess ?? stopManagedProcess)(managedProcess);
      } catch {
        processCleanupFailed = true;
      }
    }
    if (processCleanupFailed) {
      errors.push('exact managed-process cleanup failed');
      continue;
    }

    const cleanupState = cleanupStateForClaim(claim);
    if (existsSync(cleanupState.envFile)) {
      const down = await (operations.composeDown ?? composeDown)(cleanupState);
      if (!down.ok) {
        errors.push('exact Compose project cleanup failed');
        continue;
      }
    } else if (composeBeforeNames?.has(claim.projectName)) {
      // A project that outlived its exact env file cannot be safely removed by
      // reconstructing credentials or runtime inputs from global state.
      errors.push('claimed Compose project lacked exact cleanup inputs');
      continue;
    }
    try {
      rmSync(claim.runDir, { recursive: true, force: true });
    } catch {
      errors.push('exact child root cleanup failed');
    }
  }

  const compose = await listComposeProjects();
  let composeAfterNames: ReadonlySet<string> | undefined;
  if (compose.ok) {
    try {
      composeAfterNames = parseComposeProjectNames(compose.stdout);
    } catch {
      errors.push('Compose cleanup verification failed');
    }
  } else {
    errors.push('Compose cleanup verification failed');
  }
  for (const claim of claims) {
    if (existsSync(claim.runDir)) errors.push('claimed child root residue remained');
    if (composeAfterNames?.has(claim.projectName)) errors.push('claimed Compose project residue remained');
  }

  const parentRoot = claims[0]!.parentRoot;
  if (!claims.some((claim) => existsSync(claim.runDir)) && existsSync(parentRoot)) {
    try {
      if (readdirSync(parentRoot).length !== 0) throw new Error('not empty');
      rmdirSync(parentRoot);
    } catch {
      errors.push('parent-owned root residue remained');
    }
  }
  if (existsSync(parentRoot)) errors.push('parent-owned root residue remained');
  if (errors.length > 0) throw new Error(`Concurrent claimed cleanup failed (${new Set(errors).size} class(es)).`);
}

async function main(): Promise<void> {
  const injectTermination = process.env.CONTENTOS_CONCURRENT_INJECT_FIRST_TERMINATION_AFTER_READY;
  if (injectTermination !== undefined && injectTermination !== 'SIGTERM' && injectTermination !== 'SIGKILL') {
    throw new Error('Concurrent smoke termination injection is invalid.');
  }
  const parentToken = randomBytes(16).toString('hex');
  const claims = createConcurrentClaims(tmpdir(), parentToken);
  let releaseBuildLock: (() => void) | undefined;
  try {
    releaseBuildLock = await acquireBuildLock();
    const build = await run('corepack', ['pnpm', 'build'], { cwd: process.cwd(), timeoutMs: 240_000 });
    if (!build.ok) throw new Error('Concurrent smoke parent build failed.');
  } catch (error) {
    try {
      await cleanupAndVerifyClaims(claims);
    } catch {
      throw new Error('Concurrent smoke parent build failed and claimed cleanup failed.');
    }
    throw error;
  } finally {
    releaseBuildLock?.();
  }
  const evidenceByChild = new Map<string, RuntimeEvidence>();
  const sentinelPaths = new Set<string>();
  const injectPartialFailure = process.env.CONTENTOS_CONCURRENT_INJECT_FIRST_PARTIAL_SETUP_FAILURE === '1';
  const injectTeardownFailure = process.env.CONTENTOS_CONCURRENT_INJECT_FIRST_TEARDOWN_FAILURE === '1';
  const children = [
    startCompleteSmoke(claims[0]!, {
      CONTENTOS_SMOKE_USE_PARENT_BUILD: '1',
      ...(injectPartialFailure ? { CONTENTOS_SMOKE_INJECT_SETUP_FAILURE_AFTER_COMPOSE: '1' } : {}),
      ...(injectTeardownFailure ? { CONTENTOS_SMOKE_INJECT_TEARDOWN_FAILURE: '1' } : {}),
    }),
    startCompleteSmoke(claims[1]!, { CONTENTOS_SMOKE_USE_PARENT_BUILD: '1' }),
  ] as const;
  await coordinateConcurrentSmoke({
    claims,
    children,
    onAuthenticatedState: (state) => {
      const childToken = state.ownership!.childToken;
      evidenceByChild.set(childToken, captureRuntimeEvidence(state));
      sentinelPaths.add(writeOwnedSentinels([state])[0]!);
    },
    onStatesReady: (states) => {
      assertDistinctRuntime(states, evidenceByChild);
      if (sentinelPaths.size !== 2) throw new Error('Concurrent smoke cleanup sentinel paths collided.');
      if (injectTermination !== undefined) children[0].signal(injectTermination);
    },
    verifyOwnedCleanup: async (expectedClaims) => cleanupAndVerifyClaims(expectedClaims),
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
