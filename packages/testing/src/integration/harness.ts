import { spawn } from 'node:child_process';
import {
  chmodSync,
  closeSync,
  existsSync,
  fsyncSync,
  linkSync,
  mkdtempSync,
  openSync,
  readFileSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomBytes, scryptSync } from 'node:crypto';

import * as smokeEnv from './env.ts';
import type { SmokeOwnershipClaim, SmokeState } from './env.ts';
import { allocateLoopbackPort, run, waitForHttpOk } from './process.ts';
import { composeDown, composePort, composeUp, listComposeProjectNames } from './compose.ts';
import { signedFetch, type AwsCredentials } from './sigv4.ts';
import { captureManagedProcessIdentity, stopManagedProcess, type ManagedProcessIdentity } from './process-identity.ts';

const OVERRIDE_FIXTURE = join('packages', 'testing', 'fixtures', 'compose.smoke.yaml');
const BASE_COMPOSE = 'compose.yaml';
const BUILD_LOCK_FILE = join(tmpdir(), 'contentos-smoke-build.lock');
const {
  readComposeCredentials,
  readManagedProcessControl,
  readOwnershipClaim,
  writeManagedProcessControl,
  SMOKE_CHILD_TOKEN_ENV,
  SMOKE_CLAIM_FILE_ENV,
  SMOKE_PARENT_TOKEN_ENV,
  SMOKE_STATE_FILE_ENV,
} = smokeEnv;

interface HarnessRuntime {
  runDir: string;
  parentRoot: string;
  claimFile: string;
  processFile: string;
  stateFile: string;
  projectName: string;
  repoRoot: string;
  baseFile: string;
  overrideFile: string;
  envFile: string;
  ports: SmokeState['ports'];
  webOrigin: string;
  apiOrigin: string;
  webProcess: ManagedProcessIdentity | undefined;
  apiProcess: ManagedProcessIdentity | undefined;
  composeUp: boolean;
  built: boolean;
  stopped: boolean;
  bucketName: string;
  ownership: SmokeState['ownership'];
}

let runtime: HarnessRuntime | undefined;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

function randomHex(bytes: number): string {
  return randomBytes(bytes).toString('hex');
}

function randomCredential(length: number): string {
  const chars = randomBytes(length * 2)
    .toString('base64url')
    .replace(/[^A-Za-z0-9]/g, '');
  return chars.slice(0, length);
}

function establishOwnershipClaim(): SmokeOwnershipClaim {
  const parentToken = process.env[SMOKE_PARENT_TOKEN_ENV];
  const childToken = process.env[SMOKE_CHILD_TOKEN_ENV];
  const configuredClaimFile = process.env[SMOKE_CLAIM_FILE_ENV];
  if (parentToken === undefined && childToken === undefined && configuredClaimFile === undefined) {
    const runDir = mkdtempSync(join(tmpdir(), 'contentos-smoke-harness-'));
    const claim: SmokeOwnershipClaim = {
      schemaVersion: 'contentos/smoke-ownership-claim/v1',
      mode: 'ordinary',
      parentRoot: runDir,
      runDir,
      claimFile: join(runDir, 'ownership-claim.json'),
      processFile: join(runDir, 'managed-processes.json'),
      stateFile: join(runDir, 'ready-state.json'),
      projectName: `contentos-smoke-${randomHex(4)}`,
      ownership: { parentToken: randomHex(16), childToken: randomHex(16) },
    };
    try {
      writeFileSync(claim.claimFile, `${JSON.stringify(claim, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
      chmodSync(claim.claimFile, 0o600);
      writeManagedProcessControl(claim, []);
      return readOwnershipClaim(claim.claimFile);
    } catch (error) {
      rmSync(runDir, { recursive: true, force: true });
      throw error;
    }
  }
  if (
    !parentToken ||
    !childToken ||
    !configuredClaimFile ||
    !/^[0-9a-f]{32}$/.test(parentToken) ||
    !/^[0-9a-f]{32}$/.test(childToken)
  ) {
    throw new Error('Concurrent smoke ownership identity is incomplete.');
  }
  const claim = readOwnershipClaim(configuredClaimFile);
  if (
    claim.mode !== 'concurrent' ||
    claim.ownership.parentToken !== parentToken ||
    claim.ownership.childToken !== childToken
  ) {
    throw new Error('Concurrent smoke ownership claim does not match the configured identity.');
  }
  if (readManagedProcessControl(claim).processes.length !== 0) {
    throw new Error('Concurrent smoke managed-process control was not empty before child startup.');
  }
  return claim;
}

export interface BuildLockOptions {
  readonly lockFile?: string;
  readonly ownerPid?: number;
  readonly timeoutMs?: number;
  readonly pollMs?: number;
  readonly malformedGraceMs?: number;
  readonly processIsAlive?: (pid: number) => boolean;
  readonly writeCandidate?: (fd: number, payload: string) => void;
}

function defaultProcessIsAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code !== 'ESRCH';
  }
}

type FileIdentity = NonNullable<ReturnType<typeof statSync>>;

function sameFile(left: FileIdentity, right: FileIdentity): boolean {
  return left.dev === right.dev && left.ino === right.ino;
}

function reclaimPublishedLock(lockFile: string, observed: FileIdentity): void {
  try {
    if (sameFile(observed, statSync(lockFile))) unlinkSync(lockFile);
  } catch {
    // A different waiter may already have reclaimed it.
  }
}

export async function acquireBuildLock(options: BuildLockOptions = {}): Promise<() => void> {
  const lockFile = options.lockFile ?? BUILD_LOCK_FILE;
  const ownerPid = options.ownerPid ?? process.pid;
  const timeoutMs = options.timeoutMs ?? 300_000;
  const pollMs = options.pollMs ?? 100;
  const malformedGraceMs = options.malformedGraceMs ?? 5_000;
  const processIsAlive = options.processIsAlive ?? defaultProcessIsAlive;
  const writeCandidate = options.writeCandidate ?? ((fd, payload) => writeFileSync(fd, payload));
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const token = randomHex(16);
    const payload = JSON.stringify({ pid: ownerPid, token });
    const candidateFile = `${lockFile}.${ownerPid}.${token}.candidate`;
    let candidateFd: number | undefined;
    try {
      candidateFd = openSync(candidateFile, 'wx', 0o600);
      writeCandidate(candidateFd, payload);
      fsyncSync(candidateFd);
      closeSync(candidateFd);
      candidateFd = undefined;
      linkSync(candidateFile, lockFile);
      unlinkSync(candidateFile);
      return () => {
        try {
          if (readFileSync(lockFile, 'utf8') === payload) unlinkSync(lockFile);
        } catch {
          // A missing or replaced lock is already released for this process.
        }
      };
    } catch (error) {
      if (candidateFd !== undefined) {
        try {
          closeSync(candidateFd);
        } catch {
          // The write failure may already have closed the descriptor.
        }
      }
      try {
        unlinkSync(candidateFile);
      } catch {
        // The candidate may never have been created or was already linked and removed.
      }
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      try {
        const observed = statSync(lockFile);
        const rawOwner = readFileSync(lockFile, 'utf8');
        let parsed: unknown;
        try {
          parsed = JSON.parse(rawOwner);
        } catch {
          parsed = undefined;
        }
        const record = parsed as { pid?: unknown; token?: unknown } | undefined;
        const publishedPid = record?.pid;
        const publishedToken = record?.token;
        const validOwner =
          Number.isSafeInteger(publishedPid) &&
          (publishedPid as number) > 0 &&
          typeof publishedToken === 'string' &&
          /^[0-9a-f]{32}$/.test(publishedToken);
        if (validOwner) {
          if (!processIsAlive(publishedPid as number)) reclaimPublishedLock(lockFile, observed);
        } else if (Date.now() - observed.mtimeMs >= malformedGraceMs) {
          reclaimPublishedLock(lockFile, observed);
        }
      } catch {
        // Missing/replaced locks are retried. Unexpected inspection failures
        // are treated as held and will hit the bounded timeout.
      }
      await sleep(pollMs);
    }
  }
  throw new Error('Timed out waiting for the shared smoke application-build lock.');
}

function smokePasswordHash(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 32, { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$v=1$N=16384$r=8$p=1$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

function writeEnvFile(envFile: string): void {
  const ownerPassword = randomCredential(32);
  const lines = [
    'POSTGRES_USER=smoke_user',
    `POSTGRES_PASSWORD=${randomCredential(32)}`,
    'POSTGRES_DB=smoke_db',
    `REDIS_PASSWORD=${randomCredential(32)}`,
    `OBJECT_STORAGE_ACCESS_KEY=${randomCredential(20)}`,
    `OBJECT_STORAGE_SECRET_KEY=${randomCredential(40)}`,
    `CONTENTOS_FETCHER_GATEWAY_SECRET=${randomCredential(43)}`,
    'CONTENTOS_OWNER_USER_ID=00000000-0000-4000-8000-000000000001',
    // Compose treats single-quoted env-file values literally, so the `$`
    // separators in the scrypt hash cannot be expanded or exposed as warnings.
    `CONTENTOS_OWNER_PASSWORD_HASH='${smokePasswordHash(ownerPassword)}'`,
    `CONTENTOS_TEST_OWNER_PASSWORD=${ownerPassword}`,
  ];
  writeFileSync(envFile, `${lines.join('\n')}\n`, { mode: 0o600 });
  chmodSync(envFile, 0o600);
}

function toState(rt: HarnessRuntime): SmokeState {
  return {
    runDir: rt.runDir,
    claimFile: rt.claimFile,
    processFile: rt.processFile,
    stateFile: rt.stateFile,
    projectName: rt.projectName,
    repoRoot: rt.repoRoot,
    baseFile: rt.baseFile,
    overrideFile: rt.overrideFile,
    envFile: rt.envFile,
    ports: rt.ports,
    webOrigin: rt.webOrigin,
    apiOrigin: rt.apiOrigin,
    objectStorageBucket: rt.bucketName,
    ownership: rt.ownership,
  };
}

function claimForRuntime(rt: HarnessRuntime): SmokeOwnershipClaim {
  if (!rt.ownership) throw new Error('Smoke managed-process identity is unavailable.');
  return {
    schemaVersion: 'contentos/smoke-ownership-claim/v1',
    mode: rt.parentRoot === rt.runDir ? 'ordinary' : 'concurrent',
    parentRoot: rt.parentRoot,
    runDir: rt.runDir,
    claimFile: rt.claimFile,
    processFile: rt.processFile,
    stateFile: rt.stateFile,
    projectName: rt.projectName,
    ownership: rt.ownership,
  };
}

function persistManagedProcesses(rt: HarnessRuntime): void {
  writeManagedProcessControl(
    claimForRuntime(rt),
    [rt.apiProcess, rt.webProcess].filter(Boolean) as ManagedProcessIdentity[],
  );
}

async function readLoopbackPort(rt: HarnessRuntime, service: string, containerPort: number): Promise<number> {
  const result = await composePort(toState(rt), service, containerPort);
  if (!result.ok) {
    throw new Error(`compose port ${service}:${containerPort} failed: ${result.stderr.trim()}`);
  }
  const line = result.stdout.trim();
  if (!line.startsWith('127.0.0.1:')) {
    throw new Error(`smoke service ${service} is not bound to loopback: ${line}`);
  }
  const port = Number.parseInt(line.split(':')[1] ?? '', 10);
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error(`could not parse host port for ${service} from "${line}"`);
  }
  return port;
}

async function setupRuntime(): Promise<SmokeState> {
  const repoRoot = process.cwd();
  const baseFile = join(repoRoot, BASE_COMPOSE);
  const overrideFile = join(repoRoot, OVERRIDE_FIXTURE);
  if (!existsSync(baseFile)) {
    throw new Error(`compose.yaml not found at ${baseFile}`);
  }
  if (!existsSync(overrideFile)) {
    throw new Error(`smoke override fixture not found at ${overrideFile}`);
  }
  const claim = establishOwnershipClaim();

  runtime = {
    runDir: claim.runDir,
    parentRoot: claim.parentRoot,
    claimFile: claim.claimFile,
    processFile: claim.processFile,
    stateFile: claim.stateFile,
    projectName: claim.projectName,
    repoRoot,
    baseFile,
    overrideFile,
    envFile: join(claim.runDir, 'compose.env'),
    ports: { postgres: 0, redis: 0, objectStorage: 0, web: 0, api: 0 },
    webOrigin: '',
    apiOrigin: '',
    webProcess: undefined,
    apiProcess: undefined,
    composeUp: false,
    built: false,
    stopped: false,
    bucketName: '',
    ownership: claim.ownership,
  };

  // The immutable non-secret claim and in-memory runtime identity exist before
  // the first credential or runtime side effect.
  writeEnvFile(runtime.envFile);

  // 1. Docker must be available; a missing/invalid engine fails clearly.
  const dockerInfo = await run('docker', ['info', '--format', '{{.ServerVersion}}'], { timeoutMs: 20_000 });
  if (!dockerInfo.ok) {
    throw new Error(`Docker engine is not available; \`docker info\` failed (exit ${dockerInfo.code}).`);
  }

  // 2. Build the five application artifacts (no Docker required). The
  // concurrent coordinator performs one parent-owned build after publishing
  // both claims, avoiding two children overwriting the shared Web output while
  // the first child starts it.
  if (!(claim.mode === 'concurrent' && process.env.CONTENTOS_SMOKE_USE_PARENT_BUILD === '1')) {
    const releaseBuildLock = await acquireBuildLock();
    try {
      const build = await run('corepack', ['pnpm', 'build'], { cwd: repoRoot, timeoutMs: 240_000 });
      if (!build.ok) {
        throw new Error(`Application build failed (exit ${build.code}).`);
      }
    } finally {
      releaseBuildLock();
    }
  }
  runtime.built = true;

  // 3. Start the isolated Compose project (base + smoke override, tmpfs only).
  // Mark started before invoking `up` so teardown removes any partially-created
  // project even if `up` fails midway.
  runtime.composeUp = true;
  const up = await composeUp(toState(runtime));
  if (!up.ok) {
    throw new Error(`Compose up failed (exit ${up.code}). stderr: ${up.stderr.trim().slice(-800)}`);
  }
  if (process.env.CONTENTOS_SMOKE_INJECT_SETUP_FAILURE_AFTER_COMPOSE === '1') {
    throw new Error('Injected setup failure after partial Compose side effect.');
  }

  // 4. Resolve the ephemeral loopback host ports.
  runtime.ports.postgres = await readLoopbackPort(runtime, 'postgres', 5432);
  runtime.ports.redis = await readLoopbackPort(runtime, 'redis', 6379);
  runtime.ports.objectStorage = await readLoopbackPort(runtime, 'object-storage', 8333);

  const credentials = readComposeCredentials(runtime.envFile);
  const postgresPassword = credentials.POSTGRES_PASSWORD;
  const ownerUserId = credentials.CONTENTOS_OWNER_USER_ID;
  const ownerPasswordHash = credentials.CONTENTOS_OWNER_PASSWORD_HASH;
  const objectStorageAccessKey = credentials.OBJECT_STORAGE_ACCESS_KEY;
  const objectStorageSecretKey = credentials.OBJECT_STORAGE_SECRET_KEY;
  const fetcherGatewaySecret = credentials.CONTENTOS_FETCHER_GATEWAY_SECRET;
  if (
    !postgresPassword ||
    !ownerUserId ||
    !ownerPasswordHash ||
    !objectStorageAccessKey ||
    !objectStorageSecretKey ||
    !fetcherGatewaySecret
  ) {
    throw new Error('smoke credential setup is incomplete');
  }
  const databaseUrl = `postgresql://smoke_user:${encodeURIComponent(postgresPassword)}@127.0.0.1:${runtime.ports.postgres}/smoke_db`;

  // 4b. Create a unique task-owned private bucket before API startup.
  const objectStorageEndpoint = `http://127.0.0.1:${runtime.ports.objectStorage}`;
  const bucketName = `contentos-smoke-${randomHex(8)}`;
  const s3Credentials: AwsCredentials = {
    accessKeyId: objectStorageAccessKey,
    secretAccessKey: objectStorageSecretKey,
  };
  const createBucketResponse = await signedFetch({
    method: 'PUT',
    url: `${objectStorageEndpoint}/${bucketName}`,
    credentials: s3Credentials,
  });
  if (!createBucketResponse.ok) {
    throw new Error(`task-owned S3 bucket creation failed (status ${createBucketResponse.status})`);
  }
  runtime.bucketName = bucketName;

  // 5. Apply reviewed SQL migrations twice: the second run proves that the
  // migration runner is safely repeatable against an already-current schema.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const migration = await run('corepack', ['pnpm', 'db:migrate'], {
      cwd: repoRoot,
      env: { ...process.env, DATABASE_URL: databaseUrl },
      timeoutMs: 120_000,
    });
    if (!migration.ok) {
      throw new Error(`Database migration failed (exit ${migration.code}).`);
    }
  }

  // 6. Allocate the Web origin before API startup so exact Origin policy is
  // stable for the complete API process lifetime.
  const apiPort = await allocateLoopbackPort();
  runtime.ports.api = apiPort;
  runtime.apiOrigin = `http://127.0.0.1:${apiPort}`;
  const webPort = await allocateLoopbackPort();
  runtime.ports.web = webPort;
  runtime.webOrigin = `http://127.0.0.1:${webPort}`;

  // 7. Start the API artifact on its allocated loopback port with process-specific
  // configuration. Secret values stay in the child environment and temp file.
  const apiLog = openSync(join(runtime.runDir, 'api.log'), 'a');
  const apiChild = spawn(process.execPath, [join(repoRoot, 'apps', 'api', 'dist', 'main.js')], {
    cwd: join(repoRoot, 'apps', 'api'),
    env: {
      ...process.env,
      API_HOST: '127.0.0.1',
      API_PORT: String(apiPort),
      CONTENTOS_ENV: 'test',
      CONTENTOS_OWNER_PASSWORD_HASH: ownerPasswordHash,
      CONTENTOS_OWNER_USER_ID: ownerUserId,
      CONTENTOS_SECURE_COOKIES: 'false',
      CONTENTOS_SESSION_TTL_SECONDS: '300',
      CONTENTOS_WEB_ORIGIN: runtime.webOrigin,
      DATABASE_URL: databaseUrl,
      CONTENTOS_OBJECT_STORAGE_ENDPOINT: objectStorageEndpoint,
      CONTENTOS_OBJECT_STORAGE_REGION: 'us-east-1',
      CONTENTOS_OBJECT_STORAGE_BUCKET: bucketName,
      CONTENTOS_OBJECT_STORAGE_FORCE_PATH_STYLE: 'true',
      OBJECT_STORAGE_ACCESS_KEY: objectStorageAccessKey,
      OBJECT_STORAGE_SECRET_KEY: objectStorageSecretKey,
      CONTENTOS_FETCHER_GATEWAY_SECRET: fetcherGatewaySecret,
    },
    detached: true,
    stdio: ['ignore', apiLog, apiLog],
  });
  apiChild.unref();
  runtime.apiProcess = await captureManagedProcessIdentity(apiChild.pid, 'api');
  persistManagedProcesses(runtime);
  if (!(await waitForHttpOk(`${runtime.apiOrigin}/health/live`, 40_000))) {
    throw new Error(`api did not become ready on ${runtime.apiOrigin}/health/live`);
  }

  // 8. Start Web on the reserved loopback port; Next honors PORT and binds
  // 127.0.0.1 through the existing skeleton command.
  const webLog = openSync(join(runtime.runDir, 'web.log'), 'a');
  const webChild = spawn('corepack', ['pnpm', '--filter', '@contentos/web', 'start'], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PORT: String(webPort),
      CONTENTOS_ENV: 'test',
      CONTENTOS_API_ORIGIN: runtime.apiOrigin,
    },
    detached: true,
    stdio: ['ignore', webLog, webLog],
  });
  webChild.unref();
  runtime.webProcess = await captureManagedProcessIdentity(webChild.pid, 'web');
  persistManagedProcesses(runtime);
  if (!(await waitForHttpOk(runtime.webOrigin, 40_000))) {
    throw new Error(`web did not become ready on ${runtime.webOrigin}`);
  }

  const state = toState(runtime);
  writeFileSync(runtime.stateFile, `${JSON.stringify(state, null, 2)}\n`);
  process.env[SMOKE_STATE_FILE_ENV] = runtime.stateFile;
  return state;
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function decodeXmlEntities(value: string): string {
  const entities: Readonly<Record<string, string>> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
  };
  return value.replace(/&(amp|lt|gt|quot|apos);/g, (_match, name: string) => entities[name] as string);
}

function encodeObjectKeyPath(key: string): string {
  return key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

const CLEANUP_CATEGORY_ORDER = [
  'managed-process',
  'process-control',
  'object-storage',
  'compose',
  'compose-verify',
  'root',
  'synthetic',
] as const;
type CleanupCategory = (typeof CLEANUP_CATEGORY_ORDER)[number];

class HarnessCleanupError extends Error {
  readonly categories: readonly CleanupCategory[];
  readonly physical: 'clean' | 'incomplete';
  readonly capsule: 'removed' | 'preserved';
  constructor(
    categories: readonly CleanupCategory[],
    physical: 'clean' | 'incomplete',
    capsule: 'removed' | 'preserved',
  ) {
    super(
      `contentos smoke harness teardown failed: cleanup=${categories.join(',')} physical=${physical} capsule=${capsule}`,
    );
    this.categories = categories;
    this.physical = physical;
    this.capsule = capsule;
  }
}

async function verifyBucketAbsent(endpoint: string, credentials: AwsCredentials, bucketName: string): Promise<boolean> {
  try {
    const response = await signedFetch({
      method: 'GET',
      url: `${endpoint}/${bucketName}?list-type=2&max-keys=0`,
      credentials,
    });
    return response.status === 404;
  } catch {
    return false;
  }
}

async function teardown(): Promise<void> {
  const rt = runtime;
  if (!rt || rt.stopped) {
    return;
  }
  rt.stopped = true;

  const categories = new Set<CleanupCategory>();
  const injectProcessStopFailure = process.env.CONTENTOS_SMOKE_INJECT_PROCESS_STOP_FAILURE === '1';
  for (const key of ['webProcess', 'apiProcess'] as const) {
    const identity = rt[key];
    if (!identity) continue;
    if (injectProcessStopFailure) {
      categories.add('managed-process');
      continue;
    }
    try {
      await stopManagedProcess(identity);
      rt[key] = undefined;
    } catch {
      // Retain only identities that may still be alive for Parent recovery.
      categories.add('managed-process');
    }
  }
  let processControlUpdated = true;
  try {
    persistManagedProcesses(rt);
  } catch {
    processControlUpdated = false;
    categories.add('process-control');
  }

  // Clean the task-owned bucket while the S3 endpoint is still alive (before
  // compose down). Credentials are re-read from the temp env file which is
  // removed only in a later step.
  let bucketAbsent = rt.bucketName === '';
  if (rt.bucketName) {
    try {
      const teardownCredentials = readComposeCredentials(rt.envFile);
      const teardownS3Credentials: AwsCredentials = {
        accessKeyId: teardownCredentials.OBJECT_STORAGE_ACCESS_KEY ?? '',
        secretAccessKey: teardownCredentials.OBJECT_STORAGE_SECRET_KEY ?? '',
      };
      const s3Endpoint = `http://127.0.0.1:${rt.ports.objectStorage}`;
      await emptyAndDeleteBucket(s3Endpoint, teardownS3Credentials, rt.bucketName, {
        injectRealAuthFailure: process.env.CONTENTOS_SMOKE_INJECT_S3_CLEANUP_FAILURE === '1',
      });
    } catch {
      categories.add('object-storage');
    }
    try {
      const teardownCredentials = readComposeCredentials(rt.envFile);
      bucketAbsent = await verifyBucketAbsent(
        `http://127.0.0.1:${rt.ports.objectStorage}`,
        {
          accessKeyId: teardownCredentials.OBJECT_STORAGE_ACCESS_KEY ?? '',
          secretAccessKey: teardownCredentials.OBJECT_STORAGE_SECRET_KEY ?? '',
        },
        rt.bucketName,
      );
    } catch {
      bucketAbsent = false;
    }
  }

  let composeAbsent = !rt.composeUp;
  if (rt.composeUp) {
    if (process.env.CONTENTOS_SMOKE_INJECT_COMPOSE_DOWN_FAILURE === '1') {
      categories.add('compose');
    } else {
      try {
        const down = await composeDown(toState(rt));
        if (!down.ok) categories.add('compose');
      } catch {
        categories.add('compose');
      }
    }
    const projects = await listComposeProjectNames();
    if (!projects.ok) categories.add('compose-verify');
    else composeAbsent = !projects.names.has(rt.projectName);
    if (!composeAbsent) categories.add('compose-verify');
  }

  const physicalClean =
    rt.webProcess === undefined &&
    rt.apiProcess === undefined &&
    processControlUpdated &&
    bucketAbsent &&
    composeAbsent;
  let capsuleRemoved = false;
  if (physicalClean) {
    try {
      if (
        dirname(rt.stateFile) !== rt.runDir ||
        dirname(rt.claimFile) !== rt.runDir ||
        dirname(rt.processFile) !== rt.runDir ||
        rt.claimFile !== join(rt.runDir, 'ownership-claim.json') ||
        rt.processFile !== join(rt.runDir, 'managed-processes.json')
      ) {
        throw new Error('invalid-capsule-path');
      }
      rmSync(rt.runDir, { recursive: true, force: true });
      capsuleRemoved = !existsSync(rt.runDir);
    } catch {
      categories.add('root');
    }
  }

  // Deterministic verification switch: after all real cleanup has been
  // attempted, record one synthetic cleanup failure so teardown rejects and the
  // command exits non-zero. Real cleanup above still completes, so no runtime
  // residue remains; the message references no credential value.
  if (process.env.CONTENTOS_SMOKE_INJECT_TEARDOWN_FAILURE === '1') {
    categories.add('synthetic');
  }

  if (process.env[SMOKE_STATE_FILE_ENV] === rt.stateFile) {
    delete process.env[SMOKE_STATE_FILE_ENV];
  }
  if (process.env[SMOKE_CLAIM_FILE_ENV] === rt.claimFile) {
    delete process.env[SMOKE_CLAIM_FILE_ENV];
  }
  runtime = undefined;

  if (categories.size > 0 || !physicalClean || !capsuleRemoved) {
    const ordered = CLEANUP_CATEGORY_ORDER.filter((category) => categories.has(category));
    throw new HarnessCleanupError(
      ordered.length > 0 ? ordered : ['root'],
      physicalClean ? 'clean' : 'incomplete',
      capsuleRemoved ? 'removed' : 'preserved',
    );
  }
}

function classifySetupFailure(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  if (message.startsWith('Docker engine is not available')) return 'docker-unavailable';
  if (message.startsWith('Application build failed')) return 'build-failed';
  if (message.startsWith('Compose up failed')) return 'compose-start-failed';
  if (message.startsWith('Injected setup failure after partial Compose')) return 'partial-compose-injected';
  if (/^(compose port|smoke service|could not parse host port)/.test(message)) return 'port-resolution-failed';
  if (message.startsWith('task-owned S3 bucket creation failed')) return 'bucket-create-failed';
  if (message.startsWith('Database migration failed')) return 'migration-failed';
  if (message.startsWith('api did not become ready')) return 'api-start-failed';
  if (message.startsWith('web did not become ready')) return 'web-start-failed';
  if (/ownership (identity|claim)/.test(message) || message.startsWith('Expected smoke ownership')) {
    return 'ownership-invalid';
  }
  return 'setup-failed';
}

async function setup(): Promise<SmokeState> {
  try {
    return await setupRuntime();
  } catch (error) {
    let teardownClassification = 'teardown=clean';
    try {
      await teardown();
    } catch (teardownError) {
      teardownClassification =
        teardownError instanceof HarnessCleanupError
          ? `teardown=failed cleanup=${teardownError.categories.join(',')} physical=${teardownError.physical} capsule=${teardownError.capsule}`
          : 'teardown=failed cleanup=root physical=incomplete capsule=preserved';
    }
    throw new Error(`contentos smoke setup failed: setup=${classifySetupFailure(error)} ${teardownClassification}`);
  }
}

/**
 * Empties and deletes a task-owned bucket through authenticated SigV4 requests.
 * Every HTTP result is checked; a rejected or unexpected response is collected
 * as an error while later cleanup steps are still attempted. Object keys are
 * URL-encoded and XML-decoded. List pagination is handled via continuation
 * tokens. No credential, body content, or object key is exposed in errors.
 */
interface BucketCleanupOptions {
  injectRealAuthFailure?: boolean;
  request?: typeof signedFetch;
}

export async function emptyAndDeleteBucket(
  endpoint: string,
  credentials: AwsCredentials,
  bucketName: string,
  options: BucketCleanupOptions = {},
): Promise<void> {
  const errors: string[] = [];
  const request = options.request ?? signedFetch;

  // Verification mode produces a real authenticated-endpoint rejection while
  // preserving the valid credentials for the cleanup that follows.
  if (options.injectRealAuthFailure) {
    try {
      const rejected = await request({
        method: 'GET',
        url: `${endpoint}/${bucketName}?list-type=2`,
        credentials: { ...credentials, secretAccessKey: `${credentials.secretAccessKey}x` },
      });
      if (rejected.ok) errors.push('injected bucket-auth rejection unexpectedly succeeded');
      else errors.push(`injected bucket-auth rejection observed (status ${rejected.status})`);
    } catch (error) {
      errors.push(`injected bucket-auth request threw: ${describeError(error)}`);
    }
  }

  // List and delete all objects, handling pagination.
  let continuationToken: string | undefined;
  do {
    const listUrl = new URL(`${endpoint}/${bucketName}`);
    listUrl.searchParams.set('list-type', '2');
    if (continuationToken) listUrl.searchParams.set('continuation-token', continuationToken);
    let listResponse: Response;
    try {
      listResponse = await request({ method: 'GET', url: listUrl.toString(), credentials });
    } catch (error) {
      errors.push(`bucket list request threw: ${describeError(error)}`);
      break;
    }
    if (!listResponse.ok) {
      errors.push(`bucket list failed (status ${listResponse.status})`);
      break;
    }
    let xml: string;
    try {
      xml = await listResponse.text();
    } catch (error) {
      errors.push(`bucket list response read failed: ${describeError(error)}`);
      break;
    }
    // XML-decode listed keys: &amp; → &, &lt; → <, &gt; → >, &quot; → ", &apos; → '
    const rawKeys = Array.from(xml.matchAll(/<Key>([^<]+)<\/Key>/g)).map((m) => decodeXmlEntities(m[1] as string));

    for (const key of rawKeys) {
      const encodedKey = encodeObjectKeyPath(key);
      try {
        const deleteResponse = await request({
          method: 'DELETE',
          url: `${endpoint}/${bucketName}/${encodedKey}`,
          credentials,
        });
        if (!deleteResponse.ok) {
          errors.push(`object delete failed (status ${deleteResponse.status})`);
        }
      } catch (error) {
        errors.push(`object delete request threw: ${describeError(error)}`);
      }
    }

    // Check for truncated results (pagination)
    const isTruncated = /<IsTruncated>true<\/IsTruncated>/.test(xml);
    const tokenMatch = xml.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/);
    continuationToken = isTruncated && tokenMatch ? decodeXmlEntities(tokenMatch[1]!) : undefined;
  } while (continuationToken !== undefined);

  // Delete the bucket itself.
  try {
    const bucketDeleteResponse = await request({
      method: 'DELETE',
      url: `${endpoint}/${bucketName}`,
      credentials,
    });
    if (!bucketDeleteResponse.ok) {
      errors.push(`bucket delete failed (status ${bucketDeleteResponse.status})`);
    }
  } catch (error) {
    errors.push(`bucket delete request threw: ${describeError(error)}`);
  }

  if (errors.length > 0) {
    throw new Error(`S3 bucket cleanup failed (${errors.length} step(s)): ${errors.join('; ')}`);
  }
}

export const harness = { setup, teardown };
