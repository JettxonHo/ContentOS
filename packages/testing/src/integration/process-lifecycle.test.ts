import { spawn, type ChildProcess } from 'node:child_process';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { requireState } from './env.js';

interface LifecycleRecord {
  event?: string;
  service?: string;
}

const SERVICES = ['worker', 'fetcher', 'renderer'] as const;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

interface LineParser {
  push(chunk: string): void;
  flush(): void;
}

// Node stream chunks may split a single JSON record across two 'data' events,
// so buffer partial lines and parse only complete newline-terminated lines.
function createLineParser(emit: (record: LifecycleRecord) => void): LineParser {
  let buffer = '';
  const parseLine = (line: string): void => {
    const trimmed = line.trim();
    if (trimmed === '') {
      return;
    }
    try {
      emit(JSON.parse(trimmed) as LifecycleRecord);
    } catch {
      // ignore non-JSON lines (e.g. framework noise)
    }
  };
  return {
    push(chunk: string): void {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        parseLine(line);
      }
    },
    flush(): void {
      parseLine(buffer);
      buffer = '';
    },
  };
}

// Send SIGTERM, wait up to timeoutMs, then escalate to SIGKILL. The escalation
// timer is always cleared, and the function returns only after the child has
// actually closed, so no process is left running.
async function terminate(child: ChildProcess, timeoutMs: number): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  const closed = new Promise<void>((resolve) => {
    child.once('close', () => resolve());
  });
  const escalation = new Promise<void>((resolve) => {
    timer = setTimeout(() => {
      try {
        child.kill('SIGKILL');
      } catch {
        // already gone
      }
      resolve();
    }, timeoutMs);
  });
  try {
    try {
      child.kill('SIGTERM');
    } catch {
      // already gone
    }
    await Promise.race([closed, escalation]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
  if (child.exitCode === null && child.signalCode === null) {
    await closed;
  }
}

async function reclaim(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }
  // The skeleton logs process.started before registering its SIGTERM handler
  // (see apps/{worker,fetcher,renderer}/src/main.ts). Wait briefly so the
  // handler is installed before signaling; this accommodates startup ordering
  // without weakening any assertion or changing app behavior.
  await sleep(500);
  await terminate(child, 10_000);
}

describe('process lifecycle', () => {
  for (const service of SERVICES) {
    it(`${service} emits process.started, then process.stopping on SIGTERM, and exits 0`, async () => {
      const state = requireState();
      const appDir = join(state.repoRoot, 'apps', service);
      const child = spawn(process.execPath, [join(appDir, 'dist', 'main.js')], {
        cwd: appDir,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      const records: LifecycleRecord[] = [];
      let stdout = '';
      let stderr = '';
      const parser = createLineParser((record) => {
        records.push(record);
      });

      let resolveStarted!: () => void;
      let rejectStarted!: (error: Error) => void;
      const started = new Promise<void>((resolve, reject) => {
        resolveStarted = resolve;
        rejectStarted = reject;
      });
      let startedTimer: NodeJS.Timeout | undefined = setTimeout(
        () =>
          rejectStarted(
            new Error(`${service} did not emit process.started within 15s\nstdout=${stdout}\nstderr=${stderr}`),
          ),
        15_000,
      );

      child.stdout?.setEncoding('utf8');
      child.stderr?.setEncoding('utf8');
      child.stdout?.on('data', (chunk: string) => {
        stdout += chunk;
        parser.push(chunk);
        if (
          startedTimer &&
          records.some((record) => record.event === 'process.started' && record.service === service)
        ) {
          clearTimeout(startedTimer);
          startedTimer = undefined;
          resolveStarted();
        }
      });
      child.stderr?.on('data', (chunk: string) => {
        stderr += chunk;
      });

      const exitCode = new Promise<number>((resolve) => {
        child.once('close', (code) => resolve(code ?? -1));
      });

      try {
        await started;
        await reclaim(child);
        const code = await exitCode;

        const events = records.map((record) => record.event ?? '<none>');
        const diag = `${service} exit=${code} events=${JSON.stringify(events)} stdout=${stdout.trim()} stderr=${stderr.trim()}`;
        expect(
          records.some((record) => record.event === 'process.stopping' && record.service === service),
          diag,
        ).toBe(true);
        expect(code, diag).toBe(0);
      } finally {
        if (startedTimer) {
          clearTimeout(startedTimer);
        }
        // Guarantee no child is left running on any exit path (startup
        // timeout, SIGTERM timeout, parse failure, or assertion failure).
        if (child.exitCode === null && child.signalCode === null) {
          await reclaim(child);
        }
        parser.flush();
      }
    });
  }
});
