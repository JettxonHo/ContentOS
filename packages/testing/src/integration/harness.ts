import { spawn } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, openSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes, scryptSync } from 'node:crypto';

import { ENV_FILE, readComposeCredentials, SMOKE_DIR, STATE_FILE, type SmokeState } from './env.js';
import { allocateLoopbackPort, run, waitForHttpOk } from './process.js';
import { composeDown, composePort, composeUp } from './compose.js';

const OVERRIDE_FIXTURE = join('packages', 'testing', 'fixtures', 'compose.smoke.yaml');
const BASE_COMPOSE = 'compose.yaml';

interface HarnessRuntime {
  projectName: string;
  repoRoot: string;
  baseFile: string;
  overrideFile: string;
  envFile: string;
  ports: SmokeState['ports'];
  webOrigin: string;
  apiOrigin: string;
  webPid: number | undefined;
  apiPid: number | undefined;
  composeUp: boolean;
  built: boolean;
  stopped: boolean;
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
    'CONTENTOS_OWNER_USER_ID=00000000-0000-4000-8000-000000000001',
    `CONTENTOS_OWNER_PASSWORD_HASH=${smokePasswordHash(ownerPassword)}`,
    `CONTENTOS_TEST_OWNER_PASSWORD=${ownerPassword}`,
  ];
  writeFileSync(envFile, `${lines.join('\n')}\n`, { mode: 0o600 });
  chmodSync(envFile, 0o600);
}

function toState(rt: HarnessRuntime): SmokeState {
  return {
    projectName: rt.projectName,
    repoRoot: rt.repoRoot,
    baseFile: rt.baseFile,
    overrideFile: rt.overrideFile,
    envFile: rt.envFile,
    ports: rt.ports,
    webOrigin: rt.webOrigin,
    apiOrigin: rt.apiOrigin,
  };
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

type ProbeOutcome = 'gone' | 'alive' | 'error';

// Probe the process group with signal 0. Only ESRCH means the group is gone;
// EPERM or any other code is an unexpected error and must not be treated as
// success.
function probeProcessGroup(pid: number): ProbeOutcome {
  try {
    process.kill(-pid, 0);
    return 'alive';
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ESRCH') {
      return 'gone';
    }
    return 'error';
  }
}

// Deliver a signal to the process group. Returns 'ok' on delivery, 'gone' when
// the group no longer exists (ESRCH), or 'error' for EPERM/any other code.
function signalProcessGroup(pid: number, signal: NodeJS.Signals): 'ok' | 'gone' | 'error' {
  try {
    process.kill(-pid, signal);
    return 'ok';
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ESRCH') {
      return 'gone';
    }
    return 'error';
  }
}

// Poll the group until it is gone (ESRCH) or the deadline elapses. Any probe
// outcome other than 'gone'/'alive' throws immediately. Returns true if the
// group is gone, false if it is still alive when the deadline expires.
async function waitForGone(pid: number, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (true) {
    const probe = probeProcessGroup(pid);
    if (probe === 'gone') {
      return true;
    }
    if (probe === 'error') {
      throw new Error('process-group liveness probe reported an unexpected error (not ESRCH)');
    }
    if (Date.now() >= deadline) {
      return false;
    }
    await sleep(100);
  }
}

async function stopProcessGroup(pid: number | undefined): Promise<void> {
  if (pid === undefined) {
    return;
  }

  // 1. SIGTERM, then a bounded wait for graceful exit.
  const term = signalProcessGroup(pid, 'SIGTERM');
  if (term === 'error') {
    throw new Error('failed to deliver SIGTERM to the process group (unexpected error; not ESRCH)');
  }
  if (term === 'gone' || (await waitForGone(pid, 7_000))) {
    return;
  }

  // 2. SIGKILL, then a bounded verification that the group is actually gone.
  const kill = signalProcessGroup(pid, 'SIGKILL');
  if (kill === 'error') {
    throw new Error('failed to deliver SIGKILL to the process group (unexpected error; not ESRCH)');
  }
  if (kill === 'gone' || (await waitForGone(pid, 5_000))) {
    return;
  }

  // 3. Still present after SIGTERM and SIGKILL + bounded waits. The message
  // references no credential, log content, or local path.
  throw new Error('process group did not terminate after SIGTERM and SIGKILL');
}

async function setup(): Promise<void> {
  const repoRoot = process.cwd();
  const baseFile = join(repoRoot, BASE_COMPOSE);
  const overrideFile = join(repoRoot, OVERRIDE_FIXTURE);
  if (!existsSync(baseFile)) {
    throw new Error(`compose.yaml not found at ${baseFile}`);
  }
  if (!existsSync(overrideFile)) {
    throw new Error(`smoke override fixture not found at ${overrideFile}`);
  }

  // Fresh, repository-external temp directory. Credentials live only here and
  // never appear in argv, logs, or the repository.
  rmSync(SMOKE_DIR, { recursive: true, force: true });
  mkdirSync(SMOKE_DIR, { recursive: true });
  writeEnvFile(ENV_FILE);

  runtime = {
    projectName: `contentos-smoke-${randomHex(4)}`,
    repoRoot,
    baseFile,
    overrideFile,
    envFile: ENV_FILE,
    ports: { postgres: 0, redis: 0, objectStorage: 0, web: 0, api: 0 },
    webOrigin: '',
    apiOrigin: '',
    webPid: undefined,
    apiPid: undefined,
    composeUp: false,
    built: false,
    stopped: false,
  };

  // 1. Docker must be available; a missing/invalid engine fails clearly.
  const dockerInfo = await run('docker', ['info', '--format', '{{.ServerVersion}}'], { timeoutMs: 20_000 });
  if (!dockerInfo.ok) {
    throw new Error(`Docker engine is not available; \`docker info\` failed (exit ${dockerInfo.code}).`);
  }

  // 2. Build the five application artifacts (no Docker required).
  const build = await run('corepack', ['pnpm', 'build'], { cwd: repoRoot, timeoutMs: 240_000 });
  if (!build.ok) {
    throw new Error(`Application build failed (exit ${build.code}).`);
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

  // 4. Resolve the ephemeral loopback host ports.
  runtime.ports.postgres = await readLoopbackPort(runtime, 'postgres', 5432);
  runtime.ports.redis = await readLoopbackPort(runtime, 'redis', 6379);
  runtime.ports.objectStorage = await readLoopbackPort(runtime, 'object-storage', 8333);

  const credentials = readComposeCredentials(runtime.envFile);
  const postgresPassword = credentials.POSTGRES_PASSWORD;
  const ownerUserId = credentials.CONTENTOS_OWNER_USER_ID;
  const ownerPasswordHash = credentials.CONTENTOS_OWNER_PASSWORD_HASH;
  if (!postgresPassword || !ownerUserId || !ownerPasswordHash) {
    throw new Error('smoke credential setup is incomplete');
  }
  const databaseUrl = `postgresql://smoke_user:${encodeURIComponent(postgresPassword)}@127.0.0.1:${runtime.ports.postgres}/smoke_db`;

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
  const apiLog = openSync(join(SMOKE_DIR, 'api.log'), 'a');
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
    },
    detached: true,
    stdio: ['ignore', apiLog, apiLog],
  });
  apiChild.unref();
  runtime.apiPid = apiChild.pid;
  if (!(await waitForHttpOk(`${runtime.apiOrigin}/health/live`, 40_000))) {
    throw new Error(`api did not become ready on ${runtime.apiOrigin}/health/live`);
  }

  // 8. Start Web on the reserved loopback port; Next honors PORT and binds
  // 127.0.0.1 through the existing skeleton command.
  const webLog = openSync(join(SMOKE_DIR, 'web.log'), 'a');
  const webChild = spawn('corepack', ['pnpm', '--filter', '@contentos/web', 'start'], {
    cwd: repoRoot,
    env: { ...process.env, PORT: String(webPort) },
    detached: true,
    stdio: ['ignore', webLog, webLog],
  });
  webChild.unref();
  runtime.webPid = webChild.pid;
  if (!(await waitForHttpOk(runtime.webOrigin, 40_000))) {
    throw new Error(`web did not become ready on ${runtime.webOrigin}`);
  }

  writeFileSync(STATE_FILE, `${JSON.stringify(toState(runtime), null, 2)}\n`);
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

async function teardown(): Promise<void> {
  const rt = runtime;
  if (!rt || rt.stopped) {
    return;
  }
  rt.stopped = true;

  // Every cleanup step is attempted regardless of prior outcomes; the collected
  // reasons are reported together at the end. Messages intentionally reference
  // only step names, exit codes, and generic reasons — never credential values,
  // env-file contents, or compose stderr.
  const errors: string[] = [];

  try {
    await stopProcessGroup(rt.webPid);
  } catch (error) {
    errors.push(`web process-group stop failed: ${describeError(error)}`);
  }
  try {
    await stopProcessGroup(rt.apiPid);
  } catch (error) {
    errors.push(`api process-group stop failed: ${describeError(error)}`);
  }
  if (rt.composeUp) {
    try {
      const down = await composeDown(toState(rt));
      if (!down.ok) {
        errors.push(`compose down failed (exit ${down.code})`);
      }
    } catch (error) {
      errors.push(`compose down failed: ${describeError(error)}`);
    }
  }
  // The temp directory holds the temporary credential env file, so a failure to
  // remove it is a real cleanup failure rather than best-effort.
  try {
    rmSync(SMOKE_DIR, { recursive: true, force: true });
  } catch (error) {
    errors.push(`smoke temp-directory (credential) removal failed: ${describeError(error)}`);
  }

  // Deterministic verification switch: after all real cleanup has been
  // attempted, record one synthetic cleanup failure so teardown rejects and the
  // command exits non-zero. Real cleanup above still completes, so no runtime
  // residue remains; the message references no credential value.
  if (process.env.CONTENTOS_SMOKE_INJECT_TEARDOWN_FAILURE === '1') {
    errors.push('injected teardown failure: synthesized smoke credential cleanup-step failure for verification');
  }

  runtime = undefined;

  if (errors.length > 0) {
    throw new Error(`contentos smoke harness teardown failed (${errors.length} step(s)): ${errors.join('; ')}`);
  }
}

export const harness = { setup, teardown };
