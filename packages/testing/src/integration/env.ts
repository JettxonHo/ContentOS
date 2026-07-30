import { randomBytes } from 'node:crypto';
import { chmodSync, existsSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';

import type { ManagedProcessIdentity } from './process-identity.ts';

/**
 * Integration smoke harness state.
 *
 * The harness runs under an isolated `contentos-smoke-*` Compose project with
 * temporary credentials that live only outside the repository. This module reads
 * the non-secret connection state that the global setup writes to the OS temp
 * directory; it never reads, writes, or prints a credential value into the
 * repository. The S3 probe reads credentials from the temporary Compose env file
 * on demand (see {@link readComposeCredentials}).
 */

export interface SmokePorts {
  postgres: number;
  redis: number;
  objectStorage: number;
  web: number;
  api: number;
}

export interface SmokeState {
  runDir: string;
  claimFile: string;
  processFile: string;
  stateFile: string;
  projectName: string;
  repoRoot: string;
  baseFile: string;
  overrideFile: string;
  envFile: string;
  ports: SmokePorts;
  webOrigin: string;
  apiOrigin: string;
  objectStorageBucket: string;
  ownership: { readonly parentToken: string; readonly childToken: string } | null;
}

export interface SmokeOwnershipClaim {
  readonly schemaVersion: 'contentos/smoke-ownership-claim/v1';
  readonly mode: 'ordinary' | 'concurrent';
  readonly parentRoot: string;
  readonly runDir: string;
  readonly claimFile: string;
  readonly processFile: string;
  readonly stateFile: string;
  readonly projectName: string;
  readonly ownership: { readonly parentToken: string; readonly childToken: string };
}

export interface SmokeManagedProcessControl {
  readonly schemaVersion: 'contentos/smoke-managed-processes/v1';
  readonly claimFile: string;
  readonly processFile: string;
  readonly runDir: string;
  readonly ownership: { readonly parentToken: string; readonly childToken: string };
  readonly processes: readonly ManagedProcessIdentity[];
}

export const SMOKE_STATE_FILE_ENV = 'CONTENTOS_SMOKE_STATE_FILE';
export const SMOKE_PARENT_TOKEN_ENV = 'CONTENTOS_SMOKE_PARENT_TOKEN';
export const SMOKE_CHILD_TOKEN_ENV = 'CONTENTOS_SMOKE_CHILD_TOKEN';
export const SMOKE_CLAIM_FILE_ENV = 'CONTENTOS_SMOKE_CLAIM_FILE';

function assertPrivateFile(path: string, label: string): void {
  const mode = statSync(path).mode & 0o777;
  if (mode !== 0o600) throw new Error(`${label} permissions are invalid.`);
}

export function validateOwnershipClaim(value: unknown, expectedClaimFile?: string): SmokeOwnershipClaim {
  if (typeof value !== 'object' || value === null) throw new Error('Smoke ownership claim is invalid.');
  const claim = value as Partial<SmokeOwnershipClaim>;
  const absolutePaths = [claim.parentRoot, claim.runDir, claim.claimFile, claim.processFile, claim.stateFile];
  if (
    claim.schemaVersion !== 'contentos/smoke-ownership-claim/v1' ||
    (claim.mode !== 'ordinary' && claim.mode !== 'concurrent') ||
    absolutePaths.some((path) => typeof path !== 'string' || !isAbsolute(path)) ||
    typeof claim.projectName !== 'string' ||
    !/^contentos-smoke-[0-9a-f]{8}$/.test(claim.projectName) ||
    !claim.ownership ||
    !/^[0-9a-f]{32}$/.test(claim.ownership.parentToken ?? '') ||
    !/^[0-9a-f]{32}$/.test(claim.ownership.childToken ?? '')
  ) {
    throw new Error('Smoke ownership claim is invalid.');
  }
  const typed = claim as SmokeOwnershipClaim;
  if (
    typed.claimFile !== join(typed.runDir, 'ownership-claim.json') ||
    typed.processFile !== join(typed.runDir, 'managed-processes.json') ||
    typed.stateFile !== join(typed.runDir, 'ready-state.json') ||
    dirname(typed.claimFile) !== typed.runDir ||
    (typed.mode === 'ordinary' ? typed.parentRoot !== typed.runDir : dirname(typed.runDir) !== typed.parentRoot) ||
    (expectedClaimFile !== undefined && typed.claimFile !== expectedClaimFile)
  ) {
    throw new Error('Smoke ownership claim identity is invalid.');
  }
  return typed;
}

export function managedProcessControlForClaim(
  claim: SmokeOwnershipClaim,
  processes: SmokeManagedProcessControl['processes'] = [],
): SmokeManagedProcessControl {
  return {
    schemaVersion: 'contentos/smoke-managed-processes/v1',
    claimFile: claim.claimFile,
    processFile: claim.processFile,
    runDir: claim.runDir,
    ownership: claim.ownership,
    processes,
  };
}

export function validateManagedProcessControl(value: unknown, claim: SmokeOwnershipClaim): SmokeManagedProcessControl {
  if (typeof value !== 'object' || value === null) throw new Error('Smoke managed-process control is invalid.');
  const control = value as Partial<SmokeManagedProcessControl>;
  if (
    control.schemaVersion !== 'contentos/smoke-managed-processes/v1' ||
    control.claimFile !== claim.claimFile ||
    control.processFile !== claim.processFile ||
    control.runDir !== claim.runDir ||
    control.ownership?.parentToken !== claim.ownership.parentToken ||
    control.ownership.childToken !== claim.ownership.childToken ||
    !Array.isArray(control.processes)
  ) {
    throw new Error('Smoke managed-process control identity is invalid.');
  }
  const roles = new Set<string>();
  for (const processEntry of control.processes) {
    if (
      typeof processEntry !== 'object' ||
      processEntry === null ||
      (processEntry.role !== 'api' && processEntry.role !== 'web') ||
      !Number.isSafeInteger(processEntry.pid) ||
      processEntry.pid <= 0 ||
      !Number.isSafeInteger(processEntry.pgid) ||
      processEntry.pgid <= 0 ||
      processEntry.pgid !== processEntry.pid ||
      !/^[0-9a-f]{64}$/.test(processEntry.startIdentity ?? '') ||
      !/^[0-9a-f]{64}$/.test(processEntry.executableFingerprint ?? '') ||
      !/^[0-9a-f]{64}$/.test(processEntry.commandFingerprint ?? '') ||
      roles.has(processEntry.role)
    ) {
      throw new Error('Smoke managed-process control content is invalid.');
    }
    roles.add(processEntry.role);
  }
  return control as SmokeManagedProcessControl;
}

export function readManagedProcessControl(claim: SmokeOwnershipClaim): SmokeManagedProcessControl {
  if (!existsSync(claim.processFile)) throw new Error('Expected smoke managed-process control is missing.');
  assertPrivateFile(claim.processFile, 'Smoke managed-process control');
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(claim.processFile, 'utf8')) as unknown;
  } catch {
    throw new Error('Smoke managed-process control is unreadable.');
  }
  return validateManagedProcessControl(parsed, claim);
}

export function writeManagedProcessControl(
  claim: SmokeOwnershipClaim,
  processes: SmokeManagedProcessControl['processes'],
): void {
  const candidate = join(claim.runDir, `.managed-processes-${randomBytes(8).toString('hex')}.tmp`);
  try {
    writeFileSync(candidate, `${JSON.stringify(managedProcessControlForClaim(claim, processes), null, 2)}\n`, {
      flag: 'wx',
      mode: 0o600,
    });
    chmodSync(candidate, 0o600);
    renameSync(candidate, claim.processFile);
  } finally {
    rmSync(candidate, { force: true });
  }
}

export function readOwnershipClaim(claimFile: string): SmokeOwnershipClaim {
  if (!isAbsolute(claimFile) || !existsSync(claimFile)) throw new Error('Expected smoke ownership claim is missing.');
  assertPrivateFile(claimFile, 'Smoke ownership claim');
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(claimFile, 'utf8')) as unknown;
  } catch {
    throw new Error('Smoke ownership claim is unreadable.');
  }
  return validateOwnershipClaim(parsed, claimFile);
}

function configuredStateFile(): string | undefined {
  const stateFile = process.env[SMOKE_STATE_FILE_ENV];
  return stateFile && isAbsolute(stateFile) ? stateFile : undefined;
}

export function readState(): SmokeState | undefined {
  const stateFile = configuredStateFile();
  if (!stateFile || !existsSync(stateFile)) {
    return undefined;
  }
  const state = JSON.parse(readFileSync(stateFile, 'utf8')) as SmokeState;
  if (state.stateFile !== stateFile) {
    throw new Error('Integration smoke state identity does not match the configured run.');
  }
  if (state.claimFile !== join(state.runDir, 'ownership-claim.json')) {
    throw new Error('Integration smoke state claim identity does not match the configured run.');
  }
  const claim = readOwnershipClaim(state.claimFile);
  if (
    state.runDir !== claim.runDir ||
    state.processFile !== claim.processFile ||
    state.stateFile !== claim.stateFile ||
    state.projectName !== claim.projectName ||
    state.ownership?.parentToken !== claim.ownership.parentToken ||
    state.ownership.childToken !== claim.ownership.childToken
  ) {
    throw new Error('Integration smoke ready state does not match its ownership claim.');
  }
  return state;
}

export function requireState(): SmokeState {
  const state = readState();
  if (!state) {
    throw new Error(
      `Integration smoke state not found. ${SMOKE_STATE_FILE_ENV} must identify the active run; ordinary \`pnpm test\` does not start the harness.`,
    );
  }
  return state;
}

/**
 * Reads the temporary Compose env file written outside the repository and returns
 * its KEY=VALUE entries. Used only by probes that must deliver a credential to an
 * in-process signer; the values stay in process memory and are never logged.
 */
export function readComposeCredentials(envFile: string): Record<string, string> {
  const credentials: Record<string, string> = {};
  const text = readFileSync(envFile, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }
    const separator = trimmed.indexOf('=');
    if (separator === -1) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    const value =
      rawValue.length >= 2 && rawValue.startsWith("'") && rawValue.endsWith("'") ? rawValue.slice(1, -1) : rawValue;
    if (key !== '') {
      credentials[key] = value;
    }
  }
  return credentials;
}
