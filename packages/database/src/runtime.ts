import type {
  ContentPackageRepository,
  SessionRepository,
  SourceRepository,
  UrlCaptureCommandRepository,
  WorkflowOutboxDeliveryCandidate,
  WorkflowOutboxRecordState,
} from '@contentos/core';

import { createDatabaseConnection, DATABASE_UNAVAILABLE_ERROR_CODE } from './client.js';
import { DrizzleContentPackageRepository } from './content-package-repository.js';
import { DrizzleSessionRepository } from './session-repository.js';
import { DrizzleSourceRepository } from './source-repository.js';
import { DrizzleWorkflowCommandRepository } from './workflow-command-repository.js';
import { DrizzleWorkflowDispatchRepository } from './workflow-dispatch-repository.js';

export const DISPATCHER_LEASE_MS = 30_000;
export const DISPATCH_BATCH_LIMIT = 10;
export const QUEUE_UNAVAILABLE_ERROR_CODE = 'queue_unavailable' as const;

export interface WorkflowDispatchRepository {
  claimDispatchBatch(limit: number, now: Date): Promise<readonly WorkflowOutboxDeliveryCandidate[]>;
  acknowledgeDispatch(candidate: WorkflowOutboxDeliveryCandidate, acknowledgedAt: Date): Promise<boolean>;
  failDispatch(candidate: WorkflowOutboxDeliveryCandidate, failedAt: Date): Promise<boolean>;
  listDispatchedForReconciliation(limit: number): Promise<readonly WorkflowOutboxRecordState[]>;
  resetMissingDispatched(record: WorkflowOutboxRecordState, resetAt: Date): Promise<boolean>;
}

export interface DatabaseRuntime {
  readonly sessions: SessionRepository;
  readonly contentPackages: ContentPackageRepository;
  readonly sources: SourceRepository;
  readonly urlCapture: UrlCaptureCommandRepository;
  close(): Promise<void>;
}

export interface WorkerDatabaseRuntime {
  readonly workflowDispatch: WorkflowDispatchRepository;
  ready(): Promise<void>;
  close(): Promise<void>;
}

export function createDatabaseRuntime(databaseUrl: string): DatabaseRuntime {
  const connection = createDatabaseConnection(databaseUrl);
  return {
    sessions: new DrizzleSessionRepository(connection),
    contentPackages: new DrizzleContentPackageRepository(connection),
    sources: new DrizzleSourceRepository(connection),
    urlCapture: new DrizzleWorkflowCommandRepository(connection),
    async close(): Promise<void> {
      await connection.close();
    },
  };
}

export function createWorkerDatabaseRuntime(databaseUrl: string): WorkerDatabaseRuntime {
  const connection = createDatabaseConnection(databaseUrl);
  return {
    workflowDispatch: new DrizzleWorkflowDispatchRepository(connection),
    async ready(): Promise<void> {
      connection.assertAvailable();
      try {
        await connection.pool.query('SELECT 1');
      } catch {
        throw new Error(DATABASE_UNAVAILABLE_ERROR_CODE);
      }
    },
    async close(): Promise<void> {
      await connection.close();
    },
  };
}
