import {
  DISPATCH_BATCH_LIMIT,
  QUEUE_UNAVAILABLE_ERROR_CODE,
  type WorkflowDispatchRepository,
} from '@contentos/database';
import type { WorkflowOutboxDeliveryCandidate, WorkflowOutboxRecordState } from '@contentos/core';

import type { FetcherQueueTransport } from './fetcher-queue.js';

export interface DispatcherClock {
  now(): Date;
}

export interface DispatcherLogger {
  info(event: string, fields: Readonly<Record<string, string | number>>): void;
}

export interface DispatchPassReport {
  readonly inspectedDispatched: number;
  readonly repairedMissingJobs: number;
  readonly claimed: number;
  readonly acknowledged: number;
  readonly failed: number;
}

type DispatcherFailurePhase = 'reconciliation' | 'claim';

const noopLogger: DispatcherLogger = { info: () => undefined };

export class OutboxDispatcher {
  private inFlight: Promise<DispatchPassReport> | undefined;

  constructor(
    private readonly repository: WorkflowDispatchRepository,
    private readonly queue: FetcherQueueTransport,
    private readonly clock: DispatcherClock,
    private readonly logger: DispatcherLogger = noopLogger,
  ) {}

  runPass(): Promise<DispatchPassReport> {
    if (this.inFlight) return this.inFlight;
    this.inFlight = this.runPassInternal().finally(() => {
      this.inFlight = undefined;
    });
    return this.inFlight;
  }

  private async runPassInternal(): Promise<DispatchPassReport> {
    let dispatched: readonly WorkflowOutboxRecordState[];
    try {
      dispatched = await this.repository.listDispatchedForReconciliation(DISPATCH_BATCH_LIMIT);
    } catch {
      throw Object.assign(new Error('dispatcher_reconciliation_unavailable'), {
        dispatcherPhase: 'reconciliation' as DispatcherFailurePhase,
      });
    }
    let repairedMissingJobs = 0;
    try {
      for (const record of dispatched) {
        if (await this.queue.hasFetcherTask(record)) continue;
        if (await this.repository.resetMissingDispatched(record, this.clock.now())) {
          repairedMissingJobs += 1;
          this.logger.info('outbox.repaired', deliveryFields(record));
        }
      }
    } catch {
      throw Object.assign(new Error('dispatcher_reconciliation_unavailable'), {
        dispatcherPhase: 'reconciliation' as DispatcherFailurePhase,
      });
    }

    let candidates: readonly WorkflowOutboxDeliveryCandidate[];
    try {
      candidates = await this.repository.claimDispatchBatch(DISPATCH_BATCH_LIMIT, this.clock.now());
    } catch {
      throw Object.assign(new Error('dispatcher_claim_unavailable'), {
        dispatcherPhase: 'claim' as DispatcherFailurePhase,
      });
    }
    let acknowledged = 0;
    let failed = 0;
    for (const candidate of candidates) {
      try {
        await this.queue.publishFetcherTask(candidate);
        if (await this.repository.acknowledgeDispatch(candidate, this.clock.now())) {
          acknowledged += 1;
          this.logger.info('outbox.dispatched', {
            outboxId: candidate.outboxRecordId,
            taskId: candidate.taskId,
            generation: candidate.deliveryGeneration,
            attempt: candidate.dispatchAttemptCount,
          });
        }
      } catch {
        try {
          if (await this.repository.failDispatch(candidate, this.clock.now())) {
            failed += 1;
            this.logger.info('outbox.dispatch_failed', {
              ...deliveryFields(candidate),
              errorCode: QUEUE_UNAVAILABLE_ERROR_CODE,
            });
          }
        } catch {
          throw Object.assign(new Error('dispatcher_claim_unavailable'), {
            dispatcherPhase: 'claim' as DispatcherFailurePhase,
          });
        }
      }
    }

    return {
      inspectedDispatched: dispatched.length,
      repairedMissingJobs,
      claimed: candidates.length,
      acknowledged,
      failed,
    };
  }
}

function deliveryFields(
  value:
    | WorkflowOutboxRecordState
    | {
        readonly outboxRecordId: string;
        readonly taskId: string;
        readonly deliveryGeneration: number;
        readonly dispatchAttemptCount: number;
      },
): Readonly<Record<string, string | number>> {
  if ('outboxRecordId' in value) {
    return {
      outboxId: value.outboxRecordId,
      taskId: value.taskId,
      generation: value.deliveryGeneration,
      attempt: value.dispatchAttemptCount,
    };
  }
  return {
    outboxId: value.id,
    taskId: value.taskId,
    generation: value.deliveryGeneration,
    attempt: value.dispatchAttemptCount,
  };
}
