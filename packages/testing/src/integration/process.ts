import { spawn } from 'node:child_process';
import { createConnection, createServer } from 'node:net';

export interface RunOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
}

export interface RunResult {
  ok: boolean;
  code: number;
  stdout: string;
  stderr: string;
}

/**
 * Spawns a process, accumulates its output, and resolves when it exits. Secrets
 * are never passed through `args` by callers; credential-bearing Compose calls
 * use `--env-file` against a file outside the repository.
 */
export function run(cmd: string, args: string[], options: RunOptions = {}): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let timer: NodeJS.Timeout | undefined;
    if (options.timeoutMs !== undefined) {
      timer = setTimeout(() => {
        try {
          child.kill('SIGKILL');
        } catch {
          // already exited
        }
      }, options.timeoutMs);
    }
    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.stderr?.on('data', (chunk: string) => {
      stderr += chunk;
    });
    child.on('error', (error) => {
      if (timer) {
        clearTimeout(timer);
      }
      resolve({ ok: false, code: -1, stdout, stderr: `${stderr}${error.message}` });
    });
    child.on('close', (code) => {
      if (timer) {
        clearTimeout(timer);
      }
      resolve({ ok: code === 0, code: code ?? -1, stdout, stderr });
    });
  });
}

/** Allocates an ephemeral, currently-free port bound to IPv4 loopback. */
export async function allocateLoopbackPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address !== null ? address.port : undefined;
      server.close(() => {
        if (port === undefined) {
          reject(new Error('failed to allocate a loopback port'));
          return;
        }
        resolve(port);
      });
    });
  });
}

/** Returns true when a TCP connection to 127.0.0.1:port succeeds. */
export function loopbackReachable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host: '127.0.0.1', port }, () => {
      socket.end();
      resolve(true);
    });
    socket.on('error', () => {
      resolve(false);
    });
  });
}

/** Polls a URL until it returns an ok HTTP response or the deadline elapses. */
export async function waitForHttpOk(url: string, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return true;
      }
    } catch {
      // not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
}
