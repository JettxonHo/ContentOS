import { spawn, type ChildProcess } from 'node:child_process';
import { join } from 'node:path';

const READY_LINE = 'CONTENTOS_BROWSER_HARNESS_READY';
const STARTUP_TIMEOUT_MS = 180_000;
const TEARDOWN_TIMEOUT_MS = 75_000;

function waitForReady(child: ChildProcess): Promise<void> {
  return new Promise((resolve, reject) => {
    let output = '';
    let killTimer: NodeJS.Timeout | undefined;
    const timer = setTimeout(() => {
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
      output += chunk.toString('utf8');
      if (output.split('\n').includes(READY_LINE)) {
        finish(resolve);
      }
    });
    child.once('exit', () => {
      finish(() =>
        reject(
          new Error(
            killTimer
              ? 'Browser smoke harness did not become ready before the startup deadline.'
              : output.includes('CONTENTOS_BROWSER_HARNESS_ERROR:docker-unavailable')
                ? 'Docker engine is not available for the browser smoke harness.'
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
  await waitForReady(child);
  return () => stopHarness(child);
}
