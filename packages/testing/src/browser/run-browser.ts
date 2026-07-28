import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const smokeDir = join(tmpdir(), 'contentos-smoke-harness');
const child = spawn('corepack', ['pnpm', 'exec', 'playwright', 'test', '--config', 'playwright.config.ts'], {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
});

function cleanup(): void {
  if (join(tmpdir(), 'contentos-smoke-harness') !== smokeDir) {
    throw new Error('Refusing to remove an unexpected browser smoke directory.');
  }
  rmSync(smokeDir, { recursive: true, force: true });
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    child.kill(signal);
  });
}

child.once('error', () => {
  cleanup();
  process.exitCode = 1;
});

child.once('exit', (code, signal) => {
  cleanup();
  process.exitCode = signal ? 1 : (code ?? 1);
});
