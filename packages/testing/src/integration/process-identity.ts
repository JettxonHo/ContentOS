import { createHash } from 'node:crypto';

import { run } from './process.ts';

export type ManagedProcessRole = 'api' | 'web';

export interface ManagedProcessIdentity {
  readonly role: ManagedProcessRole;
  readonly pid: number;
  readonly pgid: number;
  readonly startIdentity: string;
  readonly executableFingerprint: string;
  readonly commandFingerprint: string;
}

type GroupProbe = 'alive' | 'gone' | 'error';

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

function fingerprint(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

async function readPsField(pid: number, field: 'pid' | 'pgid' | 'lstart' | 'comm' | 'args'): Promise<string> {
  const result = await run('ps', ['-ww', '-p', String(pid), '-o', `${field}=`], { timeoutMs: 5_000 });
  return result.ok ? result.stdout.trim() : '';
}

/**
 * Reads a process through portable `ps` fields available on local macOS and
 * Linux CI. Raw commands and executable paths are hashed immediately and are
 * never persisted or included in diagnostics.
 */
export async function inspectManagedProcess(
  pid: number,
  role: ManagedProcessRole,
): Promise<ManagedProcessIdentity | undefined> {
  if (!Number.isSafeInteger(pid) || pid <= 0) return undefined;
  const firstStart = await readPsField(pid, 'lstart');
  if (firstStart === '') return undefined;
  const [pidText, pgidText, executable, command, secondStart] = await Promise.all([
    readPsField(pid, 'pid'),
    readPsField(pid, 'pgid'),
    readPsField(pid, 'comm'),
    readPsField(pid, 'args'),
    readPsField(pid, 'lstart'),
  ]);
  const observedPid = Number.parseInt(pidText, 10);
  const pgid = Number.parseInt(pgidText, 10);
  if (
    observedPid !== pid ||
    !Number.isSafeInteger(pgid) ||
    pgid <= 0 ||
    firstStart !== secondStart ||
    executable === '' ||
    command === ''
  ) {
    return undefined;
  }
  return {
    role,
    pid,
    pgid,
    startIdentity: fingerprint(firstStart),
    executableFingerprint: fingerprint(executable),
    commandFingerprint: fingerprint(command),
  };
}

export function sameManagedProcessIdentity(left: ManagedProcessIdentity, right: ManagedProcessIdentity): boolean {
  return (
    left.role === right.role &&
    left.pid === right.pid &&
    left.pgid === right.pgid &&
    left.startIdentity === right.startIdentity &&
    left.executableFingerprint === right.executableFingerprint &&
    left.commandFingerprint === right.commandFingerprint
  );
}

function probeProcessGroup(pgid: number): GroupProbe {
  try {
    process.kill(-pgid, 0);
    return 'alive';
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'ESRCH' ? 'gone' : 'error';
  }
}

function signalProcessGroup(pgid: number, signal: NodeJS.Signals): 'ok' | 'gone' | 'error' {
  try {
    process.kill(-pgid, signal);
    return 'ok';
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'ESRCH' ? 'gone' : 'error';
  }
}

async function waitForGroupGone(pgid: number, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() <= deadline) {
    const probe = probeProcessGroup(pgid);
    if (probe === 'gone') return true;
    // 'alive' and transient probe errors (e.g. macOS EPERM while the group is
    // being reaped) both mean the group is not yet confirmed gone, so keep
    // polling until the deadline. A persistent problem times out here, after
    // which stopManagedProcess escalates to SIGKILL and ultimately fails closed
    // as still-alive. Fail-closed identity verification happens separately,
    // before each signal, in stopManagedProcess.
    await sleep(100);
  }
  return false;
}

export interface ManagedProcessOperations {
  readonly inspect?: typeof inspectManagedProcess;
  readonly probeGroup?: (pgid: number) => GroupProbe;
  readonly signalGroup?: (pgid: number, signal: NodeJS.Signals) => 'ok' | 'gone' | 'error';
  readonly waitForGone?: (pgid: number, timeoutMs: number) => Promise<boolean>;
}

/**
 * Stops only the exact non-reusable identity recorded by the authenticated
 * recovery capsule. Identity is re-read immediately before both TERM and KILL.
 */
export async function stopManagedProcess(
  expected: ManagedProcessIdentity,
  operations: ManagedProcessOperations = {},
): Promise<void> {
  const inspect = operations.inspect ?? inspectManagedProcess;
  const probe = operations.probeGroup ?? probeProcessGroup;
  const signal = operations.signalGroup ?? signalProcessGroup;
  const waitForGone = operations.waitForGone ?? waitForGroupGone;
  const initialProbe = probe(expected.pgid);
  if (initialProbe === 'gone') return;
  if (initialProbe === 'error') throw new Error('managed-process-probe-failed');

  const beforeTerm = await inspect(expected.pid, expected.role);
  if (!beforeTerm || !sameManagedProcessIdentity(beforeTerm, expected)) {
    throw new Error('managed-process-identity-mismatch');
  }
  const term = signal(expected.pgid, 'SIGTERM');
  if (term === 'error') throw new Error('managed-process-term-failed');
  if (term === 'gone' || (await waitForGone(expected.pgid, 7_000))) return;

  const beforeKill = await inspect(expected.pid, expected.role);
  if (!beforeKill || !sameManagedProcessIdentity(beforeKill, expected)) {
    throw new Error('managed-process-identity-mismatch');
  }
  const kill = signal(expected.pgid, 'SIGKILL');
  if (kill === 'error') throw new Error('managed-process-kill-failed');
  if (kill === 'gone' || (await waitForGone(expected.pgid, 5_000))) return;
  throw new Error('managed-process-still-alive');
}

export async function captureManagedProcessIdentity(
  pid: number | undefined,
  role: ManagedProcessRole,
): Promise<ManagedProcessIdentity> {
  if (pid === undefined) throw new Error('managed-process-spawn-missing-pid');
  const deadline = Date.now() + 2_000;
  do {
    const identity = await inspectManagedProcess(pid, role);
    if (identity && identity.pgid === pid) return identity;
    await sleep(25);
  } while (Date.now() <= deadline);
  throw new Error('managed-process-identity-capture-failed');
}
