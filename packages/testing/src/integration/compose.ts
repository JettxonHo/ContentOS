import type { SmokeState } from './env.ts';
import { run, type RunResult } from './process.ts';

const DEFAULT_TIMEOUT = 60_000;

function composeArgs(state: SmokeState): string[] {
  return [
    'compose',
    '-p',
    state.projectName,
    '--env-file',
    state.envFile,
    '-f',
    state.baseFile,
    '-f',
    state.overrideFile,
  ];
}

export function composeUp(state: SmokeState, timeoutMs = 180_000): Promise<RunResult> {
  return run('docker', [...composeArgs(state), 'up', '-d', '--wait'], { cwd: state.repoRoot, timeoutMs });
}

export function composeDown(state: SmokeState, timeoutMs = 90_000): Promise<RunResult> {
  return run('docker', [...composeArgs(state), 'down'], { cwd: state.repoRoot, timeoutMs });
}

export function parseComposeProjectNames(stdout: string): ReadonlySet<string> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout) as unknown;
  } catch {
    throw new Error('Compose project listing JSON is invalid.');
  }
  if (!Array.isArray(parsed)) throw new Error('Compose project listing JSON is invalid.');
  const names = new Set<string>();
  for (const entry of parsed) {
    if (typeof entry !== 'object' || entry === null || typeof (entry as { Name?: unknown }).Name !== 'string') {
      throw new Error('Compose project listing JSON is invalid.');
    }
    names.add((entry as { Name: string }).Name);
  }
  return names;
}

export async function listComposeProjectNames(): Promise<
  | { readonly ok: true; readonly names: ReadonlySet<string> }
  | { readonly ok: false; readonly names: ReadonlySet<string> }
> {
  const result = await run('docker', ['compose', 'ls', '--all', '--format', 'json'], { timeoutMs: 20_000 });
  if (!result.ok) return { ok: false, names: new Set() };
  try {
    return { ok: true, names: parseComposeProjectNames(result.stdout) };
  } catch {
    return { ok: false, names: new Set() };
  }
}

export function composePort(state: SmokeState, service: string, containerPort: number): Promise<RunResult> {
  return run('docker', [...composeArgs(state), 'port', service, String(containerPort)], {
    cwd: state.repoRoot,
    timeoutMs: DEFAULT_TIMEOUT,
  });
}

export function composeExec(
  state: SmokeState,
  service: string,
  args: string[],
  timeoutMs = DEFAULT_TIMEOUT,
): Promise<RunResult> {
  return run('docker', [...composeArgs(state), 'exec', '-T', service, ...args], {
    cwd: state.repoRoot,
    timeoutMs,
  });
}

export async function composeHealth(state: SmokeState, service: string): Promise<string> {
  const ps = await run('docker', [...composeArgs(state), 'ps', '-q', service], {
    cwd: state.repoRoot,
    timeoutMs: DEFAULT_TIMEOUT,
  });
  const containerId = ps.stdout.trim();
  if (containerId === '') {
    return 'missing';
  }
  const inspect = await run('docker', ['inspect', '--format', '{{.State.Health.Status}}', containerId], {
    cwd: state.repoRoot,
    timeoutMs: DEFAULT_TIMEOUT,
  });
  return inspect.stdout.trim();
}
