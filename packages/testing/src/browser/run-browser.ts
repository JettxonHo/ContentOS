import { spawn } from 'node:child_process';
const child = spawn('corepack', ['pnpm', 'exec', 'playwright', 'test', '--config', 'playwright.config.ts'], {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    child.kill(signal);
  });
}

child.once('error', () => {
  process.exitCode = 1;
});

child.once('exit', (code, signal) => {
  process.exitCode = signal ? 1 : (code ?? 1);
});
