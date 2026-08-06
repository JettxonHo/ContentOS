import { describe, expect, it, vi } from 'vitest';

import { shutdownFetcherResources } from './fetcher-shutdown.js';

function deferred(): { readonly promise: Promise<void>; readonly resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe('Fetcher bounded shutdown', () => {
  it('stops intake immediately and lets the active Job finish before graceful close', async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(0);
      const active = deferred();
      const calls: string[] = [];
      const shutdown = shutdownFetcherResources({
        queue: {
          stopIntake: vi.fn(async () => {
            calls.push('stop-intake');
          }),
          waitForIdle: vi.fn(async () => active.promise),
          close: vi.fn(async (force = false) => {
            calls.push(force ? 'force-close' : 'graceful-close');
          }),
        },
        gateway: { close: () => calls.push('gateway-close') },
        snapshots: { close: () => calls.push('snapshots-close') },
      });
      await Promise.resolve();
      expect(calls).toEqual(['stop-intake']);
      active.resolve();
      await expect(shutdown).resolves.toBe('clean');
      expect(calls).toEqual(['stop-intake', 'graceful-close', 'gateway-close', 'snapshots-close']);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('forces Queue closure and closes providers inside the global 40-second bound', async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(0);
      const forced = deferred();
      const calls: string[] = [];
      const shutdown = shutdownFetcherResources({
        queue: {
          stopIntake: vi.fn(async () => {
            calls.push('stop-intake');
          }),
          waitForIdle: vi.fn(async () => new Promise<never>(() => undefined)),
          close: vi.fn(async (force = false) => {
            calls.push(force ? 'force-close' : 'graceful-close');
            if (force) await forced.promise;
          }),
        },
        gateway: { close: () => calls.push('gateway-close') },
        snapshots: { close: () => calls.push('snapshots-close') },
      });
      await vi.advanceTimersByTimeAsync(39_500);
      expect(calls).toEqual(['stop-intake', 'force-close']);
      forced.resolve();
      await expect(shutdown).resolves.toBe('shutdown_timeout');
      expect(calls).toEqual(['stop-intake', 'force-close', 'gateway-close', 'snapshots-close']);
      expect(Date.now()).toBeLessThanOrEqual(40_000);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('returns at the hard bound even when forced Queue closure does not settle', async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(0);
      const closeGateway = vi.fn();
      const closeSnapshots = vi.fn();
      const shutdown = shutdownFetcherResources({
        queue: {
          stopIntake: vi.fn(async () => undefined),
          waitForIdle: vi.fn(async () => new Promise<never>(() => undefined)),
          close: vi.fn(async () => new Promise<never>(() => undefined)),
        },
        gateway: { close: closeGateway },
        snapshots: { close: closeSnapshots },
      });
      await vi.advanceTimersByTimeAsync(40_000);
      await expect(shutdown).resolves.toBe('shutdown_timeout');
      expect(closeGateway).toHaveBeenCalledOnce();
      expect(closeSnapshots).toHaveBeenCalledOnce();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
