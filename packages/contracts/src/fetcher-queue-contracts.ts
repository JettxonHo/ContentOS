/** Provider-neutral contract shared by the Worker publisher and Fetcher consumer. */
export const FETCHER_QUEUE_NAME = 'contentos-fetcher' as const;
export const FETCHER_JOB_NAME = 'fetcher-task' as const;
export const FETCHER_JOB_ATTEMPTS = 1 as const;
export const FETCHER_JOB_REMOVE_ON_COMPLETE = true as const;
export const FETCHER_JOB_REMOVE_ON_FAIL = true as const;
export const FETCHER_DELIVERY_GENERATION_MAX = 2_147_483_647;

export interface FetcherTaskQueueData {
  readonly taskId: string;
  readonly taskKind: 'url_capture';
  readonly envelopeVersion: 'fetcher-task/v1';
}

export interface ParsedFetcherTaskJobId {
  readonly taskId: string;
  readonly deliveryGeneration: number;
}

const JOB_ID = /^fetcher-(.+)-([1-9][0-9]*)$/u;

function isFetcherTaskId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && !value.includes(':');
}

export function buildFetcherTaskJobId(taskId: string, deliveryGeneration: number): string {
  if (
    !isFetcherTaskId(taskId) ||
    !Number.isSafeInteger(deliveryGeneration) ||
    deliveryGeneration < 1 ||
    deliveryGeneration > FETCHER_DELIVERY_GENERATION_MAX
  ) {
    throw new Error('invalid_fetcher_job_id');
  }
  return `fetcher-${taskId}-${deliveryGeneration}`;
}

export function parseFetcherTaskJobId(value: unknown): ParsedFetcherTaskJobId | null {
  if (typeof value !== 'string') return null;
  const match = JOB_ID.exec(value);
  if (!match) return null;
  const taskId = match[1];
  const deliveryGeneration = Number(match[2]);
  if (
    !isFetcherTaskId(taskId) ||
    !Number.isSafeInteger(deliveryGeneration) ||
    deliveryGeneration < 1 ||
    deliveryGeneration > FETCHER_DELIVERY_GENERATION_MAX
  ) {
    return null;
  }
  return { taskId, deliveryGeneration };
}

export function isFetcherTaskQueueData(value: unknown): value is FetcherTaskQueueData {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  return (
    keys.length === 3 &&
    keys.includes('taskId') &&
    keys.includes('taskKind') &&
    keys.includes('envelopeVersion') &&
    isFetcherTaskId(record.taskId) &&
    record.taskKind === 'url_capture' &&
    record.envelopeVersion === 'fetcher-task/v1'
  );
}

export interface FetcherTaskJobContract {
  readonly taskId: string;
  readonly deliveryGeneration: number;
  readonly retention: 'current' | 'legacy';
}

/**
 * Validates the only two supported retention profiles. New publisher Jobs have
 * both explicit booleans; Jobs written before this Work Item omit both.
 */
export function parseFetcherTaskJobContract(value: unknown): FetcherTaskJobContract | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const job = value as Record<string, unknown>;
  const parsedId = parseFetcherTaskJobId(job.id);
  if (parsedId === null || job.name !== FETCHER_JOB_NAME || !isFetcherTaskQueueData(job.data)) return null;
  const data = job.data;
  if (data.taskId !== parsedId.taskId) return null;
  if (typeof job.opts !== 'object' || job.opts === null || Array.isArray(job.opts)) return null;
  const opts = job.opts as Record<string, unknown>;
  if (opts.attempts !== FETCHER_JOB_ATTEMPTS) return null;
  const complete = opts.removeOnComplete;
  const failed = opts.removeOnFail;
  const retention =
    complete === FETCHER_JOB_REMOVE_ON_COMPLETE && failed === FETCHER_JOB_REMOVE_ON_FAIL
      ? 'current'
      : complete === undefined && failed === undefined
        ? 'legacy'
        : null;
  return retention === null ? null : { ...parsedId, retention };
}
