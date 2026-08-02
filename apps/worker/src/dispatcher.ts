import { randomUUID } from 'node:crypto';

import {
  DISPATCH_BATCH_LIMIT,
  QUEUE_UNAVAILABLE_ERROR_CODE,
  type WorkflowDispatchRepository,
} from '@contentos/database';
import type {
  FetcherLeaseRecoveryCandidate,
  WorkflowOutboxDeliveryCandidate,
  WorkflowOutboxRecordState,
} from '@contentos/core';

import type { FetcherQueueTransport } from './fetcher-queue.js';

export interface DispatcherClock {
  now(): Date;
}

export interface DispatcherLogger {
  info(event: string, fields: Readonly<Record<string, string | number>>): void;
}

export interface DispatcherEventIdGenerator {
  generate(): string;
}

export interface DispatchPassReport {
  readonly inspectedExpiredLeases: number;
  readonly recoveredExpiredLeases: number;
  readonly inspectedDispatched: number;
  readonly repairedMissingJobs: number;
  readonly claimed: number;
  readonly acknowledged: number;
  readonly failed: number;
}

type DispatcherFailurePhase = 'recovery' | 'reconciliation' | 'claim';

const noopLogger: DispatcherLogger = { info: () => undefined };
const defaultEventIdGenerator: DispatcherEventIdGenerator = { generate: () => randomUUID() };

export class OutboxDispatcher {
  private inFlight: Promise<DispatchPassReport> | undefined;

  constructor(
    private readonly repository: WorkflowDispatchRepository,
    private readonly queue: FetcherQueueTransport,
    private readonly clock: DispatcherClock,
    private readonly logger: DispatcherLogger = noopLogger,
    private readonly eventIds: DispatcherEventIdGenerator = defaultEventIdGenerator,
  ) {}

  runPass(): Promise<DispatchPassReport> {
    if (this.inFlight) return this.inFlight;
    this.inFlight = this.runPassInternal().finally(() => {
      this.inFlight = undefined;
    });
    return this.inFlight;
  }

  private async runPassInternal(): Promise<DispatchPassReport> {
    let expiredLeases: readonly FetcherLeaseRecoveryCandidate[];
    try {
      expiredLeases = (await this.repository.listExpiredFetcherLeases(DISPATCH_BATCH_LIMIT, this.clock.now())).slice(
        0,
        DISPATCH_BATCH_LIMIT,
      );
    } catch {
      throw Object.assign(new Error('dispatcher_recovery_unavailable'), {
        dispatcherPhase: 'recovery' as DispatcherFailurePhase,
      });
    }
    let recoveredExpiredLeases = 0;
    try {
      for (const candidate of expiredLeases) {
        const recovered = await this.repository.recoverExpiredFetcherLease({
          candidate,
          eventId: this.eventIds.generate() as never,
          recoveredAt: this.clock.now(),
        });
        if (recovered) {
          recoveredExpiredLeases += 1;
          this.logger.info('lease.recovered', {
            taskId: candidate.taskId,
            attempt: candidate.claimAttemptNumber,
            generation: candidate.deliveryGeneration,
            nextGeneration: candidate.deliveryGeneration + 1,
          });
        }
      }
    } catch {
      throw Object.assign(new Error('dispatcher_recovery_unavailable'), {
        dispatcherPhase: 'recovery' as DispatcherFailurePhase,
      });
    }

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
      inspectedExpiredLeases: expiredLeases.length,
      recoveredExpiredLeases,
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
