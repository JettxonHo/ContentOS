import { Queue, type JobsOptions } from 'bullmq';

import {
  rehydrateWorkflowOutboxRecord,
  type WorkflowOutboxDeliveryCandidate,
  type WorkflowOutboxRecordState,
} from '@contentos/core';

export const FETCHER_QUEUE_NAME = 'contentos-fetcher' as const;
export const FETCHER_JOB_NAME = 'fetcher-task' as const;
export const FETCHER_JOB_ATTEMPTS = 1 as const;
const FETCHER_QUEUE_UNAVAILABLE_ERROR_CODE = 'queue_unavailable' as const;

export interface FetcherTaskQueueData {
  readonly taskId: string;
  readonly taskKind: 'url_capture';
  readonly envelopeVersion: 'fetcher-task/v1';
}

export interface FetcherQueueClient {
  waitUntilReady(): Promise<unknown>;
  add(name: string, data: FetcherTaskQueueData, options: JobsOptions): Promise<unknown>;
  getJob(jobId: string): Promise<unknown | undefined>;
  on(event: 'error', listener: (error: unknown) => void): unknown;
  close(): Promise<void>;
}

export interface FetcherQueueTransport {
  ready(): Promise<void>;
  publishFetcherTask(candidate: WorkflowOutboxDeliveryCandidate): Promise<void>;
  hasFetcherTask(record: WorkflowOutboxRecordState): Promise<boolean>;
  close(): Promise<void>;
}

export function fetcherTaskJobId(taskId: string, deliveryGeneration: number): string {
  if (
    taskId.length === 0 ||
    taskId.includes(':') ||
    !Number.isSafeInteger(deliveryGeneration) ||
    deliveryGeneration < 1
  ) {
    throw new Error('invalid_fetcher_job_id');
  }
  return `fetcher-${taskId}-${deliveryGeneration}`;
}

export class BullMQFetcherQueueTransport implements FetcherQueueTransport {
  private readonly queue: FetcherQueueClient;
  private unavailable = false;

  constructor(redisUrl: string, queue?: FetcherQueueClient) {
    this.queue =
      queue ??
      (new Queue<FetcherTaskQueueData>(FETCHER_QUEUE_NAME, {
        connection: { url: redisUrl },
      }) as unknown as FetcherQueueClient);
    this.queue.on('error', () => {
      this.unavailable = true;
    });
  }

  async ready(): Promise<void> {
    this.assertAvailable();
    try {
      await this.queue.waitUntilReady();
    } catch {
      throw queueUnavailable();
    }
    this.assertAvailable();
  }

  async publishFetcherTask(candidate: WorkflowOutboxDeliveryCandidate): Promise<void> {
    this.assertAvailable();
    const jobId = fetcherTaskJobId(candidate.taskId, candidate.deliveryGeneration);
    const data: FetcherTaskQueueData = {
      taskId: candidate.payload.taskId,
      taskKind: candidate.payload.taskKind,
      envelopeVersion: candidate.payload.envelopeVersion,
    };
    try {
      await this.queue.add(FETCHER_JOB_NAME, data, {
        jobId,
        attempts: FETCHER_JOB_ATTEMPTS,
      });
      const storedJob = await this.queue.getJob(jobId);
      if (!matchesFetcherTaskJob(storedJob, jobId, candidate.taskId)) throw queueUnavailable();
      this.assertAvailable();
    } catch {
      throw queueUnavailable();
    }
  }

  async hasFetcherTask(record: WorkflowOutboxRecordState): Promise<boolean> {
    this.assertAvailable();
    const outbox = rehydrateWorkflowOutboxRecord(record);
    const jobId = fetcherTaskJobId(outbox.taskId, outbox.deliveryGeneration);
    try {
      const storedJob = await this.queue.getJob(jobId);
      if (storedJob === undefined) {
        this.assertAvailable();
        return false;
      }
      if (!matchesFetcherTaskJob(storedJob, jobId, outbox.taskId)) throw queueUnavailable();
      this.assertAvailable();
      return true;
    } catch {
      throw queueUnavailable();
    }
  }

  close(): Promise<void> {
    return this.queue.close();
  }

  private assertAvailable(): void {
    if (this.unavailable) throw queueUnavailable();
  }
}

function queueUnavailable(): Error {
  return new Error(FETCHER_QUEUE_UNAVAILABLE_ERROR_CODE);
}

function matchesFetcherTaskJob(job: unknown, jobId: string, taskId: string): boolean {
  if (!isRecord(job) || job.id !== jobId || job.name !== FETCHER_JOB_NAME) return false;
  if (!isRecord(job.opts) || job.opts.attempts !== FETCHER_JOB_ATTEMPTS) return false;
  if (!isRecord(job.data) || Object.keys(job.data).length !== 3) return false;
  return (
    job.data.taskId === taskId && job.data.taskKind === 'url_capture' && job.data.envelopeVersion === 'fetcher-task/v1'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
