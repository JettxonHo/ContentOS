import { describe, expect, it } from 'vitest';

import {
  buildFetcherTaskJobId,
  FETCHER_JOB_ATTEMPTS,
  FETCHER_JOB_NAME,
  FETCHER_JOB_REMOVE_ON_COMPLETE,
  FETCHER_JOB_REMOVE_ON_FAIL,
  FETCHER_QUEUE_NAME,
  parseFetcherTaskJobContract,
  parseFetcherTaskJobId,
} from './fetcher-queue-contracts.js';

const taskId = '00000000-0000-4000-8000-000000000001';

describe('Fetcher Queue contract', () => {
  it('owns the exact Queue envelope and deterministic delivery ID', () => {
    const id = buildFetcherTaskJobId(taskId, 2);
    expect(FETCHER_QUEUE_NAME).toBe('contentos-fetcher');
    expect(FETCHER_JOB_NAME).toBe('fetcher-task');
    expect(FETCHER_JOB_ATTEMPTS).toBe(1);
    expect(id).toBe(`fetcher-${taskId}-2`);
    expect(parseFetcherTaskJobId(id)).toEqual({ taskId, deliveryGeneration: 2 });
  });

  it('uses the same task ID boundary when building and parsing Job IDs', () => {
    expect(() => buildFetcherTaskJobId('task:1', 1)).toThrow('invalid_fetcher_job_id');
    expect(parseFetcherTaskJobId('fetcher-task:1-1')).toBeNull();
  });

  it('accepts exactly current retention and the both-absent legacy profile', () => {
    const base = {
      id: buildFetcherTaskJobId(taskId, 1),
      name: FETCHER_JOB_NAME,
      data: { taskId, taskKind: 'url_capture', envelopeVersion: 'fetcher-task/v1' },
    };
    expect(
      parseFetcherTaskJobContract({
        ...base,
        opts: {
          attempts: FETCHER_JOB_ATTEMPTS,
          removeOnComplete: FETCHER_JOB_REMOVE_ON_COMPLETE,
          removeOnFail: FETCHER_JOB_REMOVE_ON_FAIL,
        },
      }),
    ).toMatchObject({ taskId, deliveryGeneration: 1, retention: 'current' });
    expect(parseFetcherTaskJobContract({ ...base, opts: { attempts: FETCHER_JOB_ATTEMPTS } })).toMatchObject({
      taskId,
      deliveryGeneration: 1,
      retention: 'legacy',
    });
    expect(
      parseFetcherTaskJobContract({
        ...base,
        opts: { attempts: FETCHER_JOB_ATTEMPTS, removeOnComplete: true },
      }),
    ).toBeNull();
  });
});
