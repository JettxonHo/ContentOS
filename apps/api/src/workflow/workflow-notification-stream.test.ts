import { describe, expect, it, vi } from 'vitest';

import type { WorkflowProjection, WorkflowQueryPort } from '@contentos/core';

import {
  MAX_TIMEOUT_MS,
  WorkflowNotificationStream,
  toWorkflowNotificationData,
} from './workflow-notification-stream.js';

const packageId = '00000000-0000-4000-8000-000000000001' as never;
const ownerUserId = '00000000-0000-4000-8000-000000000002' as never;
const instanceId = '00000000-0000-4000-8000-000000000003';

function projection(overrides: Partial<WorkflowProjection> = {}): WorkflowProjection {
  return {
    instanceId,
    templateId: 'content-package-dual-output',
    templateVersion: 'v1',
    lifecycle: 'active',
    revision: 1,
    latestSequence: 7,
    nodes: [
      {
        key: 'source_capture',
        ordinal: 1,
        kind: 'work',
        requiresHumanGate: false,
        state: 'running',
        revision: 1,
        updatedAt: new Date('2026-08-07T00:00:00.000Z'),
        task: {
          kind: 'url_capture',
          state: 'running',
          attemptNumber: 1,
          updatedAt: new Date('2026-08-07T00:00:00.000Z'),
          failure: null,
        },
      },
    ],
    ...overrides,
  };
}

function port(getProjection: WorkflowQueryPort['getProjection']): WorkflowQueryPort {
  return { getProjection, listTimeline: vi.fn() };
}

async function settle(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('WorkflowNotificationStream', () => {
  it('maps both owned empty and instantiated Workflow projections to the exact bounded notification', () => {
    expect(toWorkflowNotificationData(null)).toEqual({ workflowInstanceId: null, latestSequence: 0 });
    expect(toWorkflowNotificationData(projection())).toEqual({ workflowInstanceId: instanceId, latestSequence: 7 });
  });

  it('emits immediately, observes complete public state every second, and permits same-sequence Task notifications', async () => {
    vi.useFakeTimers();
    try {
      const first = projection();
      const taskOnlyChange = projection({
        nodes: [
          {
            ...first.nodes[0]!,
            task: { ...first.nodes[0]!.task!, attemptNumber: 2, updatedAt: new Date('2026-08-07T00:00:01.000Z') },
          },
        ],
      });
      const getProjection = vi
        .fn()
        .mockResolvedValueOnce(first)
        .mockResolvedValueOnce(first)
        .mockResolvedValue(taskOnlyChange);
      const stream = new WorkflowNotificationStream(port(getProjection));
      const events: Array<{ type?: string; data: unknown }> = [];
      const subscription = (
        await stream.open({ packageId, ownerUserId, expiresAt: new Date(Date.now() + 60_000) })
      ).subscribe({
        next: (event) => events.push(event),
      });

      expect(events).toEqual([
        { type: 'workflow-notification/v1', data: { workflowInstanceId: instanceId, latestSequence: 7 } },
      ]);
      await vi.advanceTimersByTimeAsync(1_000);
      await settle();
      expect(events).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(1_000);
      await settle();
      expect(events).toEqual([
        { type: 'workflow-notification/v1', data: { workflowInstanceId: instanceId, latestSequence: 7 } },
        { type: 'workflow-notification/v1', data: { workflowInstanceId: instanceId, latestSequence: 7 } },
      ]);
      subscription.unsubscribe();
    } finally {
      vi.useRealTimers();
    }
  });

  it('never overlaps reads, emits transport-only keepalive, and drops a late result after disposal', async () => {
    vi.useFakeTimers();
    try {
      let resolveRead: ((value: WorkflowProjection | null) => void) | undefined;
      const delayedRead = new Promise<WorkflowProjection | null>((resolve) => {
        resolveRead = resolve;
      });
      const getProjection = vi.fn().mockResolvedValueOnce(projection()).mockReturnValue(delayedRead);
      const stream = new WorkflowNotificationStream(port(getProjection));
      const events: Array<{ type?: string; data: unknown }> = [];
      const subscription = (
        await stream.open({ packageId, ownerUserId, expiresAt: new Date(Date.now() + 60_000) })
      ).subscribe({
        next: (event) => events.push(event),
      });
      await vi.advanceTimersByTimeAsync(15_000);
      expect(getProjection).toHaveBeenCalledTimes(2);
      expect(events).toContainEqual({ type: 'keepalive', data: {} });
      subscription.unsubscribe();
      resolveRead?.(projection({ revision: 2 }));
      await settle();
      await vi.advanceTimersByTimeAsync(60_000);
      expect(events.filter((event) => event.type === 'workflow-notification/v1')).toHaveLength(1);
      expect(getProjection).toHaveBeenCalledTimes(2);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('completes silently after a post-connect read failure and during module destruction', async () => {
    vi.useFakeTimers();
    try {
      const getProjection = vi
        .fn()
        .mockResolvedValueOnce(projection())
        .mockRejectedValueOnce(new Error('private database detail'));
      const stream = new WorkflowNotificationStream(port(getProjection));
      const complete = vi.fn();
      const error = vi.fn();
      (await stream.open({ packageId, ownerUserId, expiresAt: new Date(Date.now() + 60_000) })).subscribe({
        complete,
        error,
      });
      await vi.advanceTimersByTimeAsync(1_000);
      await settle();
      expect(complete).toHaveBeenCalledOnce();
      expect(error).not.toHaveBeenCalled();

      const second = new WorkflowNotificationStream(port(vi.fn().mockResolvedValue(projection())));
      const secondComplete = vi.fn();
      (await second.open({ packageId, ownerUserId, expiresAt: new Date(Date.now() + 60_000) })).subscribe({
        complete: secondComplete,
      });
      second.onModuleDestroy();
      expect(secondComplete).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it('permanently suppresses a deferred preflight that resolves after module destruction', async () => {
    vi.useFakeTimers();
    try {
      let resolvePreflight: ((value: WorkflowProjection | null) => void) | undefined;
      const deferredPreflight = new Promise<WorkflowProjection | null>((resolve) => {
        resolvePreflight = resolve;
      });
      const getProjection = vi.fn().mockReturnValue(deferredPreflight);
      const stream = new WorkflowNotificationStream(port(getProjection));
      const opening = stream.open({ packageId, ownerUserId, expiresAt: new Date(Date.now() + 60_000) });

      stream.onModuleDestroy();
      resolvePreflight?.(projection());
      const observable = await opening;
      const next = vi.fn();
      const complete = vi.fn();
      observable.subscribe({ next, complete });

      expect(next).not.toHaveBeenCalled();
      expect(complete).toHaveBeenCalledOnce();
      expect(vi.getTimerCount()).toBe(0);
      await vi.advanceTimersByTimeAsync(60_000);
      expect(getProjection).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it('completes without events or timers when the Session expires before Observable subscription', async () => {
    vi.useFakeTimers();
    try {
      const stream = new WorkflowNotificationStream(port(vi.fn().mockResolvedValue(projection())));
      const observable = await stream.open({
        packageId,
        ownerUserId,
        expiresAt: new Date(Date.now() + 1_000),
      });
      await vi.advanceTimersByTimeAsync(1_000);
      const next = vi.fn();
      const complete = vi.fn();

      observable.subscribe({ next, complete });

      expect(next).not.toHaveBeenCalled();
      expect(complete).toHaveBeenCalledOnce();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('gives Session expiry priority when observation and keepalive share its deadline', async () => {
    vi.useFakeTimers();
    try {
      const getProjection = vi.fn().mockResolvedValue(projection());
      const stream = new WorkflowNotificationStream(port(getProjection), {
        observationIntervalMs: 1_000,
        keepaliveIntervalMs: 1_000,
      });
      const events: Array<{ type?: string; data: unknown }> = [];
      const complete = vi.fn();
      (await stream.open({ packageId, ownerUserId, expiresAt: new Date(Date.now() + 1_000) })).subscribe({
        next: (event) => events.push(event),
        complete,
      });

      await vi.advanceTimersByTimeAsync(1_000);
      await settle();

      expect(getProjection).toHaveBeenCalledOnce();
      expect(events).toEqual([
        { type: 'workflow-notification/v1', data: { workflowInstanceId: instanceId, latestSequence: 7 } },
      ]);
      expect(complete).toHaveBeenCalledOnce();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('drops a delayed observation result that settles after Session expiry', async () => {
    vi.useFakeTimers();
    try {
      let resolveRead: ((value: WorkflowProjection | null) => void) | undefined;
      const delayedRead = new Promise<WorkflowProjection | null>((resolve) => {
        resolveRead = resolve;
      });
      const getProjection = vi.fn().mockResolvedValueOnce(projection()).mockReturnValue(delayedRead);
      const stream = new WorkflowNotificationStream(port(getProjection), { keepaliveIntervalMs: 10_000 });
      const events: Array<{ type?: string; data: unknown }> = [];
      const complete = vi.fn();
      (await stream.open({ packageId, ownerUserId, expiresAt: new Date(Date.now() + 1_500) })).subscribe({
        next: (event) => events.push(event),
        complete,
      });

      await vi.advanceTimersByTimeAsync(1_000);
      expect(getProjection).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(500);
      expect(complete).toHaveBeenCalledOnce();
      resolveRead?.(projection({ revision: 2 }));
      await settle();
      await vi.advanceTimersByTimeAsync(10_000);

      expect(events).toEqual([
        { type: 'workflow-notification/v1', data: { workflowInstanceId: instanceId, latestSequence: 7 } },
      ]);
      expect(getProjection).toHaveBeenCalledTimes(2);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('chunks the maximum supported session deadline without overflowing Node timers', async () => {
    vi.useFakeTimers();
    try {
      const stream = new WorkflowNotificationStream(port(vi.fn().mockResolvedValue(null)), {
        observationIntervalMs: MAX_TIMEOUT_MS,
        keepaliveIntervalMs: MAX_TIMEOUT_MS,
      });
      const complete = vi.fn();
      const expiresAt = new Date(Date.now() + 2_592_000_000);
      (await stream.open({ packageId, ownerUserId, expiresAt })).subscribe({ complete });
      await vi.advanceTimersByTimeAsync(MAX_TIMEOUT_MS);
      expect(complete).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(2_592_000_000 - MAX_TIMEOUT_MS);
      expect(complete).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });
});
