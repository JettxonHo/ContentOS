import { Worker, type Job } from 'bullmq';

import {
  FETCHER_JOB_NAME,
  FETCHER_QUEUE_NAME,
  parseFetcherTaskJobContract,
  type FetcherTaskJobContract,
} from '@contentos/contracts';

export class FetcherQueueContractError extends Error {
  constructor() {
    super('invalid_fetcher_job');
    this.name = 'FetcherQueueContractError';
  }
}

export interface FetcherQueueConsumer {
  ready(): Promise<void>;
  stopIntake(): Promise<void>;
  waitForIdle(): Promise<void>;
  close(force?: boolean): Promise<void>;
}

export function createFetcherQueueConsumer(
  redisUrl: string,
  processJob: (job: Job) => Promise<void>,
  onError: () => void,
): FetcherQueueConsumer {
  let activeJobs = 0;
  const idleWaiters = new Set<() => void>();
  const worker = new Worker(
    FETCHER_QUEUE_NAME,
    async (job): Promise<void> => {
      const parsed = parseFetcherTaskJobContract(job);
      if (parsed === null || job.name !== FETCHER_JOB_NAME) throw new FetcherQueueContractError();
      activeJobs += 1;
      try {
        await processJob(job);
      } finally {
        activeJobs -= 1;
        if (activeJobs === 0) {
          for (const resolve of idleWaiters) resolve();
          idleWaiters.clear();
        }
      }
    },
    {
      connection: { url: redisUrl },
      concurrency: 1,
      removeOnComplete: { count: 0 },
      removeOnFail: { count: 0 },
    },
  );
  worker.on('error', onError);
  return {
    async ready(): Promise<void> {
      await worker.waitUntilReady();
    },
    async stopIntake(): Promise<void> {
      await worker.pause(true);
    },
    async waitForIdle(): Promise<void> {
      if (activeJobs === 0) return;
      await new Promise<void>((resolve) => idleWaiters.add(resolve));
    },
    async close(force = false): Promise<void> {
      await worker.close(force);
    },
  };
}

export function fetcherJobContract(job: Pick<Job, 'id' | 'name' | 'data' | 'opts'>): FetcherTaskJobContract {
  const contract = parseFetcherTaskJobContract(job);
  if (contract === null) throw new FetcherQueueContractError();
  return contract;
}
