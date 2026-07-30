import { harness } from '../integration/harness.ts';

const READY_LINE = 'CONTENTOS_BROWSER_HARNESS_READY';
let stopping = false;
const keepAlive = setInterval(() => undefined, 1_000);

async function stop(exitCode: number): Promise<void> {
  if (stopping) return;
  stopping = true;
  let finalExitCode = exitCode;
  try {
    await harness.teardown();
  } catch {
    finalExitCode = 1;
  }
  clearInterval(keepAlive);
  process.exit(finalExitCode);
}

process.once('SIGTERM', () => void stop(0));
process.once('SIGINT', () => void stop(1));

try {
  const state = await harness.setup();
  process.stdout.write(`${READY_LINE}:${Buffer.from(state.stateFile, 'utf8').toString('base64url')}\n`);
} catch (error) {
  const code =
    error instanceof Error && error.message.includes('setup=docker-unavailable')
      ? 'docker-unavailable'
      : 'setup-failed';
  process.stdout.write(`CONTENTOS_BROWSER_HARNESS_ERROR:${code}\n`);
  await stop(1);
}
