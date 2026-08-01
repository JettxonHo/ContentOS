import { describe, expect, it } from 'vitest';

import type { WorkflowOutboxDeliveryCandidate, WorkflowOutboxRecordState, WorkflowTaskState } from '@contentos/core';
import { defineWorkflowOutboxDeliveryCandidate } from '@contentos/core';
import type { WorkflowDispatchRepository } from '@contentos/database';

import { OutboxDispatcher } from './dispatcher.js';
import type { FetcherQueueTransport } from './fetcher-queue.js';
import { closeWorkerResources } from './main.js';

const now = new Date('2026-08-02T00:00:00.000Z');

function candidate(): WorkflowOutboxDeliveryCandidate {
  const task: WorkflowTaskState = {
    id: 'task-1' as never,
    workflowInstanceId: 'instance-1' as never,
    workflowNodeId: 'node-1' as never,
    urlCaptureRequestId: 'request-1' as never,
    contentPackageId: 'package-1' as never,
    ownerUserId: 'owner-1' as never,
    kind: 'url_capture',
    state: 'queued',
    createdAt: now,
    updatedAt: now,
  };
  return defineWorkflowOutboxDeliveryCandidate(
    {
      id: 'outbox-1' as never,
      taskId: task.id,
      contentPackageId: task.contentPackageId,
      ownerUserId: task.ownerUserId,
      category: 'fetcher',
      envelopeVersion: 'fetcher-task/v1',
      payload: { taskId: task.id, taskKind: 'url_capture', envelopeVersion: 'fetcher-task/v1' },
      state: 'dispatching',
      createdAt: now,
      deliveryGeneration: 1,
      dispatchAttemptCount: 1,
      dispatchLeaseExpiresAt: new Date(now.getTime() + 30_000),
      lastDispatchAt: null,
      dispatchedAt: null,
      updatedAt: now,
    },
    task,
  );
}

function dispatchedRecord(): WorkflowOutboxRecordState {
  return {
    id: 'outbox-1' as never,
    taskId: 'task-1' as never,
    contentPackageId: 'package-1' as never,
    ownerUserId: 'owner-1' as never,
    category: 'fetcher',
    envelopeVersion: 'fetcher-task/v1',
    payload: { taskId: 'task-1' as never, taskKind: 'url_capture', envelopeVersion: 'fetcher-task/v1' },
    state: 'dispatched',
    createdAt: now,
    deliveryGeneration: 1,
    dispatchAttemptCount: 1,
    dispatchLeaseExpiresAt: null,
    lastDispatchAt: now,
    dispatchedAt: now,
    updatedAt: now,
  };
}

function repository(overrides: Partial<WorkflowDispatchRepository> = {}): WorkflowDispatchRepository {
  return {
    async claimDispatchBatch(): Promise<readonly WorkflowOutboxDeliveryCandidate[]> {
      return [candidate()];
    },
    async acknowledgeDispatch(): Promise<boolean> {
      return true;
    },
    async failDispatch(): Promise<boolean> {
      return true;
    },
    async listDispatchedForReconciliation(): Promise<readonly WorkflowOutboxRecordState[]> {
      return [];
    },
    async resetMissingDispatched(): Promise<boolean> {
      return true;
    },
    ...overrides,
  };
}

function queue(overrides: Partial<FetcherQueueTransport> = {}): FetcherQueueTransport {
  return {
    async ready(): Promise<void> {},
    async publishFetcherTask(): Promise<void> {},
    async hasFetcherTask(): Promise<boolean> {
      return true;
    },
    async close(): Promise<void> {},
    ...overrides,
  };
}

describe('Outbox Dispatcher', () => {
  it('publishes, acknowledges, and never overlaps passes', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let listCalls = 0;
    const target = new OutboxDispatcher(
      repository({
        async listDispatchedForReconciliation(): Promise<readonly WorkflowOutboxRecordState[]> {
          listCalls += 1;
          await gate;
          return [];
        },
      }),
      queue(),
      { now: () => now },
    );

    const first = target.runPass();
    const second = target.runPass();
    expect(second).toBe(first);
    release();
    await expect(first).resolves.toMatchObject({ claimed: 1, acknowledged: 1, failed: 0 });
    expect(listCalls).toBe(1);
  });

  it('normalizes queue add failure through the matching lease holder only', async () => {
    let failed = 0;
    const target = new OutboxDispatcher(
      repository({
        async failDispatch(): Promise<boolean> {
          failed += 1;
          return true;
        },
      }),
      queue({
        async publishFetcherTask(): Promise<void> {
          throw new Error('secret redis diagnostic must not escape');
        },
      }),
      { now: () => now },
    );

    await expect(target.runPass()).resolves.toMatchObject({ claimed: 1, acknowledged: 0, failed: 1 });
    expect(failed).toBe(1);
  });

  it('keeps the full claim capacity when reconciliation inspects ten dispatched rows', async () => {
    let claimLimit = 0;
    const target = new OutboxDispatcher(
      repository({
        async listDispatchedForReconciliation(): Promise<readonly WorkflowOutboxRecordState[]> {
          return Array.from({ length: 10 }, () => dispatchedRecord());
        },
        async claimDispatchBatch(limit: number): Promise<readonly WorkflowOutboxDeliveryCandidate[]> {
          claimLimit = limit;
          return [candidate()];
        },
      }),
      queue(),
      { now: () => now },
    );

    await expect(target.runPass()).resolves.toMatchObject({ inspectedDispatched: 10, claimed: 1 });
    expect(claimLimit).toBe(10);
  });

  it('advances reconciliation beyond the first bounded page', async () => {
    let page = 0;
    const target = new OutboxDispatcher(
      repository({
        async listDispatchedForReconciliation(): Promise<readonly WorkflowOutboxRecordState[]> {
          page += 1;
          return page === 1 ? Array.from({ length: 10 }, () => dispatchedRecord()) : [dispatchedRecord()];
        },
        async resetMissingDispatched(): Promise<boolean> {
          return true;
        },
      }),
      queue({
        async hasFetcherTask(): Promise<boolean> {
          return page === 1;
        },
      }),
      { now: () => now },
    );

    await target.runPass();
    await expect(target.runPass()).resolves.toMatchObject({ inspectedDispatched: 1, repairedMissingJobs: 1 });
    expect(page).toBe(2);
  });

  it('repairs one missing Redis Job and republishes the same generation', async () => {
    let reset = 0;
    const target = new OutboxDispatcher(
      repository({
        async listDispatchedForReconciliation(): Promise<readonly WorkflowOutboxRecordState[]> {
          return [dispatchedRecord()];
        },
        async resetMissingDispatched(): Promise<boolean> {
          reset += 1;
          return true;
        },
      }),
      queue({
        async hasFetcherTask(): Promise<boolean> {
          return false;
        },
      }),
      { now: () => now },
    );

    await expect(target.runPass()).resolves.toMatchObject({
      inspectedDispatched: 1,
      repairedMissingJobs: 1,
      claimed: 1,
      acknowledged: 1,
    });
    expect(reset).toBe(1);
  });

  it('fails closed when reconciliation finds an existing Job with an invalid contract', async () => {
    let reset = 0;
    let claimed = 0;
    const target = new OutboxDispatcher(
      repository({
        async listDispatchedForReconciliation(): Promise<readonly WorkflowOutboxRecordState[]> {
          return [dispatchedRecord()];
        },
        async resetMissingDispatched(): Promise<boolean> {
          reset += 1;
          return true;
        },
        async claimDispatchBatch(): Promise<readonly WorkflowOutboxDeliveryCandidate[]> {
          claimed += 1;
          return [candidate()];
        },
      }),
      queue({
        async hasFetcherTask(): Promise<boolean> {
          throw new Error('queue_unavailable');
        },
      }),
      { now: () => now },
    );

    await expect(target.runPass()).rejects.toMatchObject({
      message: 'dispatcher_reconciliation_unavailable',
      dispatcherPhase: 'reconciliation',
    });
    expect(reset).toBe(0);
    expect(claimed).toBe(0);
  });

  it('attempts both resource closures and reports a non-clean result when one fails', async () => {
    const closed: string[] = [];
    const closeFailed = await closeWorkerResources({
      queue: {
        async close(): Promise<void> {
          closed.push('queue');
          throw new Error('secret queue diagnostic');
        },
      },
      database: {
        async close(): Promise<void> {
          closed.push('database');
        },
      },
    });

    expect(closed).toEqual(['queue', 'database']);
    expect(closeFailed).toBe(true);
  });

  it('reports a clean result when both resources close successfully', async () => {
    const closed: string[] = [];
    const closeFailed = await closeWorkerResources({
      queue: {
        async close(): Promise<void> {
          closed.push('queue');
        },
      },
      database: {
        async close(): Promise<void> {
          closed.push('database');
        },
      },
    });

    expect(closed).toEqual(['queue', 'database']);
    expect(closeFailed).toBe(false);
  });
});
