import { EventEmitter } from 'node:events';

import { describe, expect, it, vi } from 'vitest';

import {
  defineWorkflowOutboxDeliveryCandidate,
  type WorkflowOutboxRecordState,
  type WorkflowTaskState,
} from '@contentos/core';

import {
  BullMQFetcherQueueTransport,
  FETCHER_JOB_ATTEMPTS,
  FETCHER_JOB_NAME,
  FETCHER_QUEUE_NAME,
  fetcherTaskJobId,
  type FetcherQueueClient,
  type FetcherTaskQueueData,
} from './fetcher-queue.js';

const now = new Date('2026-08-02T00:00:00.000Z');

function record(): WorkflowOutboxRecordState {
  return {
    id: 'outbox-1' as never,
    taskId: 'task-1' as never,
    contentPackageId: 'package-1' as never,
    ownerUserId: 'owner-1' as never,
    category: 'fetcher',
    envelopeVersion: 'fetcher-task/v1',
    payload: { taskId: 'task-1' as never, taskKind: 'url_capture', envelopeVersion: 'fetcher-task/v1' },
    state: 'dispatching',
    createdAt: now,
    deliveryGeneration: 1,
    dispatchAttemptCount: 1,
    dispatchLeaseExpiresAt: new Date(now.getTime() + 30_000),
    lastDispatchAt: null,
    dispatchedAt: null,
    updatedAt: now,
  };
}

function candidate() {
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
  return defineWorkflowOutboxDeliveryCandidate(record(), task);
}

describe('Fetcher BullMQ adapter', () => {
  it('constructs the fixed job ID and rejects the forbidden colon delimiter', () => {
    expect(fetcherTaskJobId('task-1', 1)).toBe('fetcher-task-1-1');
    expect(fetcherTaskJobId('task-1', 1)).not.toContain(':');
    expect(() => fetcherTaskJobId('task:1', 1)).toThrow('invalid_fetcher_job_id');
  });

  it('publishes only the exact envelope with fixed Queue metadata', async () => {
    let added: { name: string; data: FetcherTaskQueueData; options: Record<string, unknown> } | undefined;
    const jobs = new Map<string, unknown>();
    const fake: FetcherQueueClient = {
      async waitUntilReady(): Promise<void> {},
      async add(name, data, options): Promise<void> {
        added = { name, data, options: { ...options } };
        jobs.set(String(options.jobId), {
          id: String(options.jobId),
          name,
          data,
          opts: { attempts: options.attempts },
        });
      },
      async getJob(jobId): Promise<unknown | undefined> {
        return jobs.get(jobId);
      },
      on(event, listener): unknown {
        if (event === 'error') {
          // The fake emits no asynchronous error in this happy-path test.
          void listener;
        }
        return undefined;
      },
      async close(): Promise<void> {},
    };
    const transport = new BullMQFetcherQueueTransport('redis://:secret@127.0.0.1:6379', fake);

    await transport.ready();
    await transport.publishFetcherTask(candidate());

    expect(added).toEqual({
      name: FETCHER_JOB_NAME,
      data: { taskId: 'task-1', taskKind: 'url_capture', envelopeVersion: 'fetcher-task/v1' },
      options: { jobId: 'fetcher-task-1-1', attempts: FETCHER_JOB_ATTEMPTS },
    });
    expect(added && JSON.stringify(added)).not.toContain('secret');
    expect(
      await transport.hasFetcherTask({
        ...record(),
        state: 'dispatched',
        dispatchLeaseExpiresAt: null,
        lastDispatchAt: now,
        dispatchedAt: now,
      }),
    ).toBe(true);
    expect(FETCHER_QUEUE_NAME).toBe('contentos-fetcher');
  });

  it('owns the Queue error listener and converts asynchronous Redis errors to a safe failure', async () => {
    const emitter = new EventEmitter();
    const fake: FetcherQueueClient = {
      async waitUntilReady(): Promise<void> {},
      async add(): Promise<void> {},
      async getJob(): Promise<unknown | undefined> {
        return undefined;
      },
      on(event, listener): unknown {
        emitter.on(event, listener);
        return undefined;
      },
      async close(): Promise<void> {},
    };
    const transport = new BullMQFetcherQueueTransport('redis://:secret@127.0.0.1:6379', fake);
    const rawError = new Error('Redis URL redis://:secret@127.0.0.1:6379 failed with stack details');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      expect(() => emitter.emit('error', rawError)).not.toThrow();
      const readyError = await transport.ready().catch((error: unknown) => error);
      expect(readyError).toMatchObject({ message: 'queue_unavailable' });
      expect(JSON.stringify(readyError)).not.toContain(rawError.message);
      const publishError = await transport.publishFetcherTask(candidate()).catch((error: unknown) => error);
      expect(publishError).toMatchObject({ message: 'queue_unavailable' });
      expect(JSON.stringify(publishError)).not.toContain(rawError.message);
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }
  });

  it.each([
    {
      label: 'wrong name',
      job: {
        id: 'fetcher-task-1-1',
        name: 'wrong-name',
        data: { taskId: 'task-1', taskKind: 'url_capture', envelopeVersion: 'fetcher-task/v1' },
        opts: { attempts: 1 },
      },
    },
    {
      label: 'extra payload field',
      job: {
        id: 'fetcher-task-1-1',
        name: FETCHER_JOB_NAME,
        data: { taskId: 'task-1', taskKind: 'url_capture', envelopeVersion: 'fetcher-task/v1', extra: 'nope' },
        opts: { attempts: 1 },
      },
    },
    {
      label: 'wrong envelope',
      job: {
        id: 'fetcher-task-1-1',
        name: FETCHER_JOB_NAME,
        data: { taskId: 'task-1', taskKind: 'url_capture', envelopeVersion: 'fetcher-task/v2' },
        opts: { attempts: 1 },
      },
    },
    {
      label: 'wrong attempts',
      job: {
        id: 'fetcher-task-1-1',
        name: FETCHER_JOB_NAME,
        data: { taskId: 'task-1', taskKind: 'url_capture', envelopeVersion: 'fetcher-task/v1' },
        opts: { attempts: 2 },
      },
    },
    {
      label: 'wrong id',
      job: {
        id: 'wrong-job-id',
        name: FETCHER_JOB_NAME,
        data: { taskId: 'task-1', taskKind: 'url_capture', envelopeVersion: 'fetcher-task/v1' },
        opts: { attempts: 1 },
      },
    },
  ])('rejects a duplicate Job ID with a $label contract mismatch and keeps it untouched', async ({ job }) => {
    const storedJob: unknown = job;
    const fake: FetcherQueueClient = {
      async waitUntilReady(): Promise<void> {},
      async add(): Promise<void> {},
      async getJob(): Promise<unknown | undefined> {
        return storedJob;
      },
      on(): unknown {
        return undefined;
      },
      async close(): Promise<void> {},
    };
    const transport = new BullMQFetcherQueueTransport('redis://:secret@127.0.0.1:6379', fake);

    await expect(transport.publishFetcherTask(candidate())).rejects.toMatchObject({ message: 'queue_unavailable' });
    expect(storedJob).toBe(job);
    await expect(
      transport.hasFetcherTask({
        ...record(),
        state: 'dispatched',
        dispatchLeaseExpiresAt: null,
        lastDispatchAt: now,
        dispatchedAt: now,
      }),
    ).rejects.toMatchObject({ message: 'queue_unavailable' });
  });
});
