import type { FetcherQueueConsumer } from './fetcher-queue.js';

const SHUTDOWN_TIMEOUT_MS = 40_000;
const FORCE_CLOSE_RESERVE_MS = 500;

export type FetcherShutdownOutcome = 'clean' | 'shutdown_timeout' | 'resource_close_failed';

interface CloseableProvider {
  close(): void;
}

interface ShutdownResources {
  readonly queue: Pick<FetcherQueueConsumer, 'stopIntake' | 'waitForIdle' | 'close'> | undefined;
  readonly gateway: CloseableProvider | undefined;
  readonly snapshots: CloseableProvider | undefined;
  readonly timeoutMs?: number;
}

type SettleOutcome = 'completed' | 'failed' | 'timed_out';

async function settleBefore(promise: Promise<void>, deadlineMs: number): Promise<SettleOutcome> {
  const remainingMs = Math.max(0, deadlineMs - Date.now());
  if (remainingMs === 0) return 'timed_out';
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise.then(
        () => 'completed' as const,
        () => 'failed' as const,
      ),
      new Promise<'timed_out'>((resolve) => {
        timeout = setTimeout(() => resolve('timed_out'), remainingMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function outcomeFor(settled: SettleOutcome): FetcherShutdownOutcome | undefined {
  if (settled === 'completed') return undefined;
  return settled === 'timed_out' ? 'shutdown_timeout' : 'resource_close_failed';
}

/**
 * Closes only Fetcher-owned resources under one absolute deadline. Intake is
 * paused without waiting for the active Job; the separate idle wait is the
 * only graceful phase that may consume the remaining bound.
 */
export async function shutdownFetcherResources(input: ShutdownResources): Promise<FetcherShutdownOutcome> {
  const timeoutMs = input.timeoutMs ?? SHUTDOWN_TIMEOUT_MS;
  const hardDeadlineMs = Date.now() + timeoutMs;
  const reserveMs = Math.min(FORCE_CLOSE_RESERVE_MS, Math.max(1, Math.floor(timeoutMs / 4)));
  const gracefulDeadlineMs = hardDeadlineMs - reserveMs;
  let outcome: FetcherShutdownOutcome | undefined;

  if (input.queue) {
    for (const operation of [
      () => input.queue?.stopIntake() ?? Promise.resolve(),
      () => input.queue?.waitForIdle() ?? Promise.resolve(),
      () => input.queue?.close(false) ?? Promise.resolve(),
    ]) {
      const settled = await settleBefore(operation(), gracefulDeadlineMs);
      const failure = outcomeFor(settled);
      if (failure) {
        outcome = failure;
        break;
      }
    }

    if (outcome) {
      const forced = await settleBefore(input.queue.close(true), hardDeadlineMs);
      if (forced === 'timed_out') outcome = 'shutdown_timeout';
      else if (forced === 'failed' && outcome !== 'shutdown_timeout') outcome = 'resource_close_failed';
    }
  }

  for (const provider of [input.gateway, input.snapshots]) {
    try {
      provider?.close();
    } catch {
      outcome ??= 'resource_close_failed';
    }
  }

  return outcome ?? 'clean';
}
