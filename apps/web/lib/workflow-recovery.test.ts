import { describe, expect, it, vi } from 'vitest';

import type { WorkflowProjectionResponse } from '@contentos/contracts';

import { WebApiError } from './api-client';
import type { ContentOsApiClient } from './api-client';
import { WorkflowRecoveryController, type WorkflowEventSource } from './workflow-recovery';

const packageId = '00000000-0000-4000-8000-000000000001';
const projection: WorkflowProjectionResponse = { data: { workflow: null } };

class FakeEventSource implements WorkflowEventSource {
  readonly listeners = new Map<string, (event: { data?: string }) => void>();
  readonly close = vi.fn();

  addEventListener(type: string, listener: (event: { data?: string }) => void): void {
    this.listeners.set(type, listener);
  }

  emit(type: string, data?: string): void {
    this.listeners.get(type)?.({ data });
  }
}

function controller(workflow: ReturnType<typeof vi.fn>, source = new FakeEventSource()) {
  const factory = vi.fn(() => source);
  return {
    source,
    factory,
    controller: new WorkflowRecoveryController(
      { workflow } as Pick<ContentOsApiClient, 'workflow'>,
      'http://127.0.0.1:3001',
      factory,
    ),
  };
}

async function settle(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('WorkflowRecoveryController', () => {
  it('publishes an initial authoritative projection before opening credentialed EventSource', async () => {
    const workflow = vi.fn().mockResolvedValue(projection);
    const { controller: recovery, factory } = controller(workflow);
    const notices: unknown[] = [];
    const dispose = recovery.subscribe(packageId, (notice) => notices.push(notice));
    await settle();

    expect(notices).toEqual([{ kind: 'projection', response: projection }]);
    expect(factory).toHaveBeenCalledWith(`http://127.0.0.1:3001/v1/content-packages/${packageId}/workflow/stream`, {
      withCredentials: true,
    });
    dispose();
  });

  it('returns exact terminal notices without opening a stream', async () => {
    for (const [status, code] of [
      [401, 'UNAUTHENTICATED'],
      [404, 'CONTENT_PACKAGE_NOT_FOUND'],
      [422, 'INVALID_REQUEST'],
    ] as const) {
      const workflow = vi.fn().mockRejectedValue(new WebApiError(status, code));
      const { controller: recovery, factory } = controller(workflow);
      const notices: unknown[] = [];
      recovery.subscribe(packageId, (notice) => notices.push(notice));
      await settle();
      expect(notices).toEqual([{ kind: 'terminal', status, code }]);
      expect(factory).not.toHaveBeenCalled();
    }
  });

  it('keeps the EventSource-error Poll deadline while aborting an unresolved notification refresh', async () => {
    vi.useFakeTimers();
    try {
      let refreshSignal: AbortSignal | undefined;
      const workflow = vi
        .fn<ContentOsApiClient['workflow']>()
        .mockResolvedValueOnce(projection)
        .mockImplementationOnce(
          (_id, signal) =>
            new Promise<WorkflowProjectionResponse>((_resolve, reject) => {
              refreshSignal = signal;
              signal?.addEventListener('abort', () => reject(new WebApiError(0, 'NETWORK_ERROR')), { once: true });
            }),
        )
        .mockResolvedValueOnce(projection);
      const { controller: recovery, source } = controller(workflow);
      const notices: unknown[] = [];
      const dispose = recovery.subscribe(packageId, (notice) => notices.push(notice));
      await settle();

      source.emit('workflow-notification/v1', JSON.stringify({ workflowInstanceId: null, latestSequence: 0 }));
      expect(workflow).toHaveBeenCalledTimes(2);
      source.emit('error');
      expect(source.close).toHaveBeenCalledOnce();
      expect(refreshSignal?.aborted).toBe(true);
      await settle();

      await vi.advanceTimersByTimeAsync(4_999);
      expect(workflow).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(1);
      await settle();
      expect(workflow).toHaveBeenCalledTimes(3);
      expect(notices).toEqual([
        { kind: 'projection', response: projection },
        { kind: 'projection', response: projection },
      ]);
      dispose();
    } finally {
      vi.useRealTimers();
    }
  });

  it('runs one due Poll after a timer-first abort-ignoring refresh settles, then resumes the five-second cadence', async () => {
    vi.useFakeTimers();
    try {
      let resolveRefresh: ((value: WorkflowProjectionResponse) => void) | undefined;
      let refreshSignal: AbortSignal | undefined;
      const delayedRefresh = new Promise<WorkflowProjectionResponse>((resolve) => {
        resolveRefresh = resolve;
      });
      const workflow = vi
        .fn<ContentOsApiClient['workflow']>()
        .mockResolvedValueOnce(projection)
        .mockImplementationOnce((_id, signal) => {
          refreshSignal = signal;
          return delayedRefresh;
        })
        .mockResolvedValue(projection);
      const { controller: recovery, source } = controller(workflow);
      const notices: unknown[] = [];
      const dispose = recovery.subscribe(packageId, (notice) => notices.push(notice));
      await settle();

      source.emit('workflow-notification/v1', JSON.stringify({ workflowInstanceId: null, latestSequence: 0 }));
      source.emit('error');
      expect(refreshSignal?.aborted).toBe(true);
      await vi.advanceTimersByTimeAsync(5_000);
      expect(workflow).toHaveBeenCalledTimes(2);
      expect(vi.getTimerCount()).toBe(0);
      await vi.advanceTimersByTimeAsync(15_000);
      expect(workflow).toHaveBeenCalledTimes(2);
      expect(vi.getTimerCount()).toBe(0);

      resolveRefresh?.(projection);
      await settle();
      await vi.advanceTimersByTimeAsync(0);
      expect(workflow).toHaveBeenCalledTimes(3);
      expect(notices).toEqual([
        { kind: 'projection', response: projection },
        { kind: 'projection', response: projection },
      ]);
      expect(vi.getTimerCount()).toBe(1);
      await vi.advanceTimersByTimeAsync(4_999);
      expect(workflow).toHaveBeenCalledTimes(3);
      await vi.advanceTimersByTimeAsync(1);
      await settle();
      expect(workflow).toHaveBeenCalledTimes(4);
      expect(vi.getTimerCount()).toBe(1);
      dispose();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('cancels a refresh-first stale timer before one immediate due Poll and starts the next five-second cadence', async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date(0));
      let resolveRefresh: ((value: WorkflowProjectionResponse) => void) | undefined;
      const delayedRefresh = new Promise<WorkflowProjectionResponse>((resolve) => {
        resolveRefresh = resolve;
      });
      const workflow = vi
        .fn<ContentOsApiClient['workflow']>()
        .mockResolvedValueOnce(projection)
        .mockReturnValueOnce(delayedRefresh)
        .mockResolvedValue(projection);
      const { controller: recovery, source } = controller(workflow);
      const notices: unknown[] = [];
      const dispose = recovery.subscribe(packageId, (notice) => notices.push(notice));
      await settle();

      source.emit('workflow-notification/v1', JSON.stringify({ workflowInstanceId: null, latestSequence: 0 }));
      source.emit('error');
      expect(workflow).toHaveBeenCalledTimes(2);
      expect(vi.getTimerCount()).toBe(1);

      vi.setSystemTime(new Date(5_000));
      resolveRefresh?.(projection);
      await settle();
      await vi.advanceTimersByTimeAsync(0);

      expect(workflow).toHaveBeenCalledTimes(3);
      expect(notices).toEqual([
        { kind: 'projection', response: projection },
        { kind: 'projection', response: projection },
      ]);
      expect(vi.getTimerCount()).toBe(1);

      await vi.advanceTimersByTimeAsync(4_999);
      expect(workflow).toHaveBeenCalledTimes(3);
      await vi.advanceTimersByTimeAsync(1);
      await settle();
      expect(workflow).toHaveBeenCalledTimes(4);

      dispose();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('stops with the exact terminal notice when a notification refresh is unauthorized', async () => {
    vi.useFakeTimers();
    try {
      const workflow = vi
        .fn<ContentOsApiClient['workflow']>()
        .mockResolvedValueOnce(projection)
        .mockRejectedValueOnce(new WebApiError(401, 'UNAUTHENTICATED'));
      const { controller: recovery, source } = controller(workflow);
      const notices: unknown[] = [];
      recovery.subscribe(packageId, (notice) => notices.push(notice));
      await settle();

      source.emit('workflow-notification/v1', JSON.stringify({ workflowInstanceId: null, latestSequence: 0 }));
      await settle();
      await vi.advanceTimersByTimeAsync(5_000);

      expect(notices).toEqual([
        { kind: 'projection', response: projection },
        { kind: 'terminal', status: 401, code: 'UNAUTHENTICATED' },
      ]);
      expect(source.close).toHaveBeenCalledOnce();
      expect(workflow).toHaveBeenCalledTimes(2);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('closes the stream and Polls five seconds after a recoverable notification refresh failure', async () => {
    vi.useFakeTimers();
    try {
      const workflow = vi
        .fn<ContentOsApiClient['workflow']>()
        .mockResolvedValueOnce(projection)
        .mockRejectedValueOnce(new WebApiError(500, 'INTERNAL_ERROR'))
        .mockResolvedValueOnce(projection);
      const { controller: recovery, source } = controller(workflow);
      const notices: unknown[] = [];
      const dispose = recovery.subscribe(packageId, (notice) => notices.push(notice));
      await settle();

      source.emit('workflow-notification/v1', JSON.stringify({ workflowInstanceId: null, latestSequence: 0 }));
      await settle();
      expect(source.close).toHaveBeenCalledOnce();
      await vi.advanceTimersByTimeAsync(4_999);
      expect(workflow).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(1);
      await settle();

      expect(workflow).toHaveBeenCalledTimes(3);
      expect(notices).toEqual([
        { kind: 'projection', response: projection },
        { kind: 'projection', response: projection },
      ]);
      dispose();
    } finally {
      vi.useRealTimers();
    }
  });

  it('falls back after five seconds on a malformed notification, coalesces refreshes, and ignores keepalive', async () => {
    vi.useFakeTimers();
    try {
      let resolveRefresh: ((value: WorkflowProjectionResponse) => void) | undefined;
      const delayedRefresh = new Promise<WorkflowProjectionResponse>((resolve) => {
        resolveRefresh = resolve;
      });
      const workflow = vi
        .fn()
        .mockResolvedValueOnce(projection)
        .mockReturnValueOnce(delayedRefresh)
        .mockResolvedValue(projection);
      const { controller: recovery, source } = controller(workflow);
      const notices: unknown[] = [];
      const dispose = recovery.subscribe(packageId, (notice) => notices.push(notice));
      await settle();
      source.emit('keepalive', '{}');
      source.emit('workflow-notification/v1', JSON.stringify({ workflowInstanceId: null, latestSequence: 0 }));
      source.emit('workflow-notification/v1', JSON.stringify({ workflowInstanceId: null, latestSequence: 0 }));
      expect(workflow).toHaveBeenCalledTimes(2);
      resolveRefresh?.(projection);
      await settle();
      expect(workflow).toHaveBeenCalledTimes(3);

      source.emit('workflow-notification/v1', '{malformed');
      expect(source.close).toHaveBeenCalledOnce();
      await vi.advanceTimersByTimeAsync(4_999);
      expect(workflow).toHaveBeenCalledTimes(3);
      await vi.advanceTimersByTimeAsync(1);
      await settle();
      expect(workflow).toHaveBeenCalledTimes(4);
      expect(notices).toEqual([
        { kind: 'projection', response: projection },
        { kind: 'projection', response: projection },
        { kind: 'projection', response: projection },
        { kind: 'projection', response: projection },
      ]);
      dispose();
    } finally {
      vi.useRealTimers();
    }
  });

  it('starts polling after initial recoverable failure, stops terminal polls, and never overlaps them', async () => {
    vi.useFakeTimers();
    try {
      let resolvePoll: ((value: WorkflowProjectionResponse) => void) | undefined;
      const delayedPoll = new Promise<WorkflowProjectionResponse>((resolve) => {
        resolvePoll = resolve;
      });
      const workflow = vi
        .fn()
        .mockRejectedValueOnce(new WebApiError(0, 'NETWORK_ERROR'))
        .mockReturnValueOnce(delayedPoll)
        .mockRejectedValueOnce(new WebApiError(404, 'CONTENT_PACKAGE_NOT_FOUND'));
      const { controller: recovery, factory } = controller(workflow);
      const notices: unknown[] = [];
      recovery.subscribe(packageId, (notice) => notices.push(notice));
      await settle();
      expect(factory).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(5_000);
      expect(workflow).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(10_000);
      expect(workflow).toHaveBeenCalledTimes(2);
      resolvePoll?.(projection);
      await settle();
      await vi.advanceTimersByTimeAsync(5_000);
      await settle();
      expect(notices).toEqual([
        { kind: 'projection', response: projection },
        { kind: 'terminal', status: 404, code: 'CONTENT_PACKAGE_NOT_FOUND' },
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('continues five-second Polling across repeated network and server failures', async () => {
    vi.useFakeTimers();
    try {
      const workflow = vi
        .fn<ContentOsApiClient['workflow']>()
        .mockRejectedValueOnce(new WebApiError(0, 'NETWORK_ERROR'))
        .mockRejectedValueOnce(new WebApiError(500, 'INTERNAL_ERROR'))
        .mockRejectedValueOnce(new WebApiError(0, 'NETWORK_ERROR'))
        .mockResolvedValueOnce(projection);
      const { controller: recovery, factory } = controller(workflow);
      const notices: unknown[] = [];
      const dispose = recovery.subscribe(packageId, (notice) => notices.push(notice));
      await settle();
      expect(factory).not.toHaveBeenCalled();

      for (const expectedCalls of [2, 3, 4]) {
        await vi.advanceTimersByTimeAsync(4_999);
        expect(workflow).toHaveBeenCalledTimes(expectedCalls - 1);
        await vi.advanceTimersByTimeAsync(1);
        await settle();
        expect(workflow).toHaveBeenCalledTimes(expectedCalls);
      }

      expect(notices).toEqual([{ kind: 'projection', response: projection }]);
      dispose();
    } finally {
      vi.useRealTimers();
    }
  });

  it('closes resources and suppresses late REST callbacks after disposal', async () => {
    let resolveInitial: ((value: WorkflowProjectionResponse) => void) | undefined;
    let initialSignal: AbortSignal | undefined;
    const initial = new Promise<WorkflowProjectionResponse>((resolve) => {
      resolveInitial = resolve;
    });
    const workflow = vi.fn<ContentOsApiClient['workflow']>().mockImplementation((_id, signal) => {
      initialSignal = signal;
      return initial;
    });
    const { controller: recovery, source, factory } = controller(workflow);
    const notices: unknown[] = [];
    const dispose = recovery.subscribe(packageId, (notice) => notices.push(notice));
    dispose();
    expect(initialSignal?.aborted).toBe(true);
    resolveInitial?.(projection);
    await settle();
    expect(notices).toEqual([]);
    expect(factory).not.toHaveBeenCalled();
    expect(source.close).not.toHaveBeenCalled();
  });

  it('disposes an opened EventSource and in-flight notification refresh without late callbacks', async () => {
    let resolveRefresh: ((value: WorkflowProjectionResponse) => void) | undefined;
    let refreshSignal: AbortSignal | undefined;
    const delayedRefresh = new Promise<WorkflowProjectionResponse>((resolve) => {
      resolveRefresh = resolve;
    });
    const workflow = vi
      .fn<ContentOsApiClient['workflow']>()
      .mockResolvedValueOnce(projection)
      .mockImplementationOnce((_id, signal) => {
        refreshSignal = signal;
        return delayedRefresh;
      });
    const { controller: recovery, source } = controller(workflow);
    const notices: unknown[] = [];
    const dispose = recovery.subscribe(packageId, (notice) => notices.push(notice));
    await settle();
    source.emit('workflow-notification/v1', JSON.stringify({ workflowInstanceId: null, latestSequence: 0 }));

    dispose();
    expect(source.close).toHaveBeenCalledOnce();
    expect(refreshSignal?.aborted).toBe(true);
    resolveRefresh?.(projection);
    await settle();

    expect(notices).toEqual([{ kind: 'projection', response: projection }]);
  });

  it('clears an already scheduled Poll when disposed', async () => {
    vi.useFakeTimers();
    try {
      const workflow = vi.fn<ContentOsApiClient['workflow']>().mockRejectedValue(new WebApiError(0, 'NETWORK_ERROR'));
      const { controller: recovery, source, factory } = controller(workflow);
      const notices: unknown[] = [];
      const dispose = recovery.subscribe(packageId, (notice) => notices.push(notice));
      await settle();
      expect(factory).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(1);

      dispose();
      await vi.advanceTimersByTimeAsync(5_000);

      expect(workflow).toHaveBeenCalledOnce();
      expect(notices).toEqual([]);
      expect(source.close).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
