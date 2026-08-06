import { performance } from 'node:perf_hooks';

import type { CaptureBudget } from './index.js';
import { PublicUrlTransportError } from './errors.js';

export const TOTAL_CAPTURE_DEADLINE_MS = 30_000;

export interface MonotonicClock {
  now(): number;
}

export interface TimerScheduler {
  set(callback: () => void, delayMs: number): ReturnType<typeof setTimeout>;
  clear(timer: ReturnType<typeof setTimeout>): void;
}

export const productionClock: MonotonicClock = { now: () => performance.now() };
export const productionTimers: TimerScheduler = {
  set: (callback, delayMs) => setTimeout(callback, delayMs),
  clear: (timer) => clearTimeout(timer),
};

export interface InternalCaptureBudget extends CaptureBudget {
  abort(error: PublicUrlTransportError): void;
  finish(): void;
  readonly scheduler: TimerScheduler;
}

export function createCaptureBudget(
  clock: MonotonicClock = productionClock,
  scheduler: TimerScheduler = productionTimers,
): InternalCaptureBudget {
  const controller = new AbortController();
  const startedAtMonotonicMs = clock.now();
  const absoluteDeadlineMonotonicMs = startedAtMonotonicMs + TOTAL_CAPTURE_DEADLINE_MS;
  let deadlineTimer: ReturnType<typeof setTimeout> | undefined;
  const abort = (error: PublicUrlTransportError): void => {
    if (!controller.signal.aborted) controller.abort(error);
  };
  deadlineTimer = scheduler.set(() => abort(new PublicUrlTransportError('timeout')), TOTAL_CAPTURE_DEADLINE_MS);

  return {
    startedAtMonotonicMs,
    absoluteDeadlineMonotonicMs,
    signal: controller.signal,
    scheduler,
    remainingMs: () => Math.max(0, absoluteDeadlineMonotonicMs - clock.now()),
    abort,
    finish: () => {
      if (deadlineTimer !== undefined) {
        scheduler.clear(deadlineTimer);
        deadlineTimer = undefined;
      }
    },
  };
}

export async function withinDeadline<T>(
  budget: InternalCaptureBudget,
  deadlineMs: number,
  operation: () => Promise<T>,
): Promise<T> {
  if (budget.signal.aborted || budget.remainingMs() <= 0) {
    const error = timeoutError(budget);
    budget.abort(error);
    throw error;
  }
  const expiryMs = Math.min(deadlineMs, budget.remainingMs());
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const settle = (callback: () => void): void => {
      if (settled) return;
      settled = true;
      budget.scheduler.clear(timer);
      budget.signal.removeEventListener('abort', onAbort);
      callback();
    };
    const onAbort = (): void => settle(() => reject(abortError(budget)));
    const timer = budget.scheduler.set(() => {
      const error = new PublicUrlTransportError('timeout');
      budget.abort(error);
      settle(() => reject(error));
    }, expiryMs);
    budget.signal.addEventListener('abort', onAbort, { once: true });
    void operation().then(
      (value) => settle(() => resolve(value)),
      (error: unknown) => settle(() => reject(safeError(error, budget, 'fetch_failed'))),
    );
  });
}

export function safeError(
  error: unknown,
  budget: InternalCaptureBudget,
  fallback: 'fetch_failed' | 'validation_blocked' = 'fetch_failed',
): PublicUrlTransportError {
  if (error instanceof PublicUrlTransportError) return error;
  if (budget.signal.aborted) return abortError(budget);
  return new PublicUrlTransportError(fallback);
}

function timeoutError(budget: InternalCaptureBudget): PublicUrlTransportError {
  return budget.signal.aborted ? abortError(budget) : new PublicUrlTransportError('timeout');
}

function abortError(budget: InternalCaptureBudget): PublicUrlTransportError {
  return budget.signal.reason instanceof PublicUrlTransportError
    ? budget.signal.reason
    : new PublicUrlTransportError('fetch_failed');
}
