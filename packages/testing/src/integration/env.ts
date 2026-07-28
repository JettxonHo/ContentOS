import { existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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
  projectName: string;
  repoRoot: string;
  baseFile: string;
  overrideFile: string;
  envFile: string;
  ports: SmokePorts;
  webOrigin: string;
  apiOrigin: string;
}

export const SMOKE_DIR = join(tmpdir(), 'contentos-smoke-harness');
export const STATE_FILE = join(SMOKE_DIR, 'state.json');
export const ENV_FILE = join(SMOKE_DIR, 'compose.env');

export function readState(): SmokeState | undefined {
  if (!existsSync(STATE_FILE)) {
    return undefined;
  }
  return JSON.parse(readFileSync(STATE_FILE, 'utf8')) as SmokeState;
}

export function requireState(): SmokeState {
  const state = readState();
  if (!state) {
    throw new Error(
      'Integration smoke state not found. The global setup must run `corepack pnpm test:integration`; ordinary `pnpm test` does not start the harness.',
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
