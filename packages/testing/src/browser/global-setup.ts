import { spawn, type ChildProcess } from 'node:child_process';
import { join } from 'node:path';

import { SMOKE_STATE_FILE_ENV } from '../integration/env.ts';

const READY_LINE = 'CONTENTOS_BROWSER_HARNESS_READY';
const STARTUP_TIMEOUT_MS = 180_000;
const TEARDOWN_TIMEOUT_MS = 75_000;
const MAX_CLASSIFICATION_OUTPUT = 4_096;

function waitForReady(child: ChildProcess): Promise<string> {
  return new Promise((resolve, reject) => {
    let output = '';
    let killTimer: NodeJS.Timeout | undefined;
    let startupTimedOut = false;
    const timer = setTimeout(() => {
      startupTimedOut = true;
      killTimer = setTimeout(() => child.kill('SIGKILL'), TEARDOWN_TIMEOUT_MS);
      child.kill('SIGTERM');
    }, STARTUP_TIMEOUT_MS);

    const finish = (callback: () => void): void => {
      clearTimeout(timer);
      if (killTimer) clearTimeout(killTimer);
      child.stdout?.removeAllListeners();
      child.removeAllListeners('exit');
      child.removeAllListeners('error');
      callback();
    };

    child.stdout?.on('data', (chunk: Buffer) => {
      output = `${output}${chunk.toString('utf8')}`.slice(-MAX_CLASSIFICATION_OUTPUT);
      const ready = output.split('\n').find((line) => line.startsWith(`${READY_LINE}:`));
      if (ready) {
        const encoded = ready.slice(READY_LINE.length + 1);
        finish(() => resolve(Buffer.from(encoded, 'base64url').toString('utf8')));
      }
    });
    child.once('exit', () => {
      finish(() =>
        reject(
          new Error(
            startupTimedOut
              ? 'Browser smoke harness did not become ready before the startup deadline.'
              : output.includes('CONTENTOS_BROWSER_HARNESS_ERROR:docker-unavailable')
                ? 'Docker engine is not available for the browser smoke harness.'
                : output.includes('CONTENTOS_BROWSER_HARNESS_ERROR:setup-failed')
                  ? 'Browser smoke harness reported a classified setup failure.'
                  : 'Browser smoke harness exited before setup completed.',
          ),
        ),
      );
    });
    child.once('error', () => {
      finish(() => reject(new Error('Browser smoke harness could not be started.')));
    });
  });
}

function stopHarness(child: ChildProcess): Promise<void> {
  return new Promise((resolve, reject) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      if (child.exitCode === 0) resolve();
      else reject(new Error('Browser smoke harness exited with a cleanup failure.'));
      return;
    }

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('Browser smoke harness cleanup exceeded the teardown deadline.'));
    }, TEARDOWN_TIMEOUT_MS);

    child.once('exit', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error('Browser smoke harness exited with a cleanup failure.'));
    });
    child.kill('SIGTERM');
  });
}

export default async function globalSetup(): Promise<() => Promise<void>> {
  const runner = join(process.cwd(), 'packages', 'testing', 'src', 'browser', 'harness-runner.ts');
  const child = spawn(process.execPath, [runner], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  const stateFile = await waitForReady(child);
  process.env[SMOKE_STATE_FILE_ENV] = stateFile;
  return async () => {
    try {
      await stopHarness(child);
    } finally {
      if (process.env[SMOKE_STATE_FILE_ENV] === stateFile) delete process.env[SMOKE_STATE_FILE_ENV];
    }
  };
}
