import type {
  ApprovedSourceInputPort,
  ContentPackageRepository,
  SessionRepository,
  SourceRepository,
  ResearchRepository,
  BlogRepository,
  UrlCaptureCommandRepository,
  UrlCaptureResultRepository,
  UrlCaptureIntakeQueryPort,
  FetcherLeaseRecoveryCandidate,
  FetcherLeaseRecoveryRequest,
  WorkflowOutboxDeliveryCandidate,
  WorkflowOutboxRecordState,
  FetcherGatewayClaimRepository,
  WorkflowQueryPort,
} from '@contentos/core';

import { DrizzleApprovedSourceInputProjection } from './approved-source-input-projection.js';
import { createDatabaseConnection, DATABASE_UNAVAILABLE_ERROR_CODE } from './client.js';
import { DrizzleContentPackageRepository } from './content-package-repository.js';
import { DrizzleSessionRepository } from './session-repository.js';
import { DrizzleSourceRepository } from './source-repository.js';
import { DrizzleResearchRepository } from './research-repository.js';
import { DrizzleBlogRepository } from './blog-repository.js';
import { DrizzleUrlCaptureResultRepository } from './url-capture-result-repository.js';
import { DrizzleWorkflowCommandRepository } from './workflow-command-repository.js';
import { DrizzleWorkflowDispatchRepository } from './workflow-dispatch-repository.js';
import { DrizzleWorkflowFetcherGatewayRepository } from './workflow-fetcher-gateway-repository.js';
import { DrizzleWorkflowQueryProjection } from './workflow-query-projection.js';
import { DrizzleUrlCaptureIntakeProjection } from './url-capture-intake-projection.js';

export const DISPATCHER_LEASE_MS = 30_000;
export const DISPATCH_BATCH_LIMIT = 10;
export const QUEUE_UNAVAILABLE_ERROR_CODE = 'queue_unavailable' as const;

export interface WorkflowDispatchRepository {
  listExpiredFetcherLeases(limit: number, now: Date): Promise<readonly FetcherLeaseRecoveryCandidate[]>;
  recoverExpiredFetcherLease(input: FetcherLeaseRecoveryRequest): Promise<boolean>;
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
  readonly research: ResearchRepository;
  readonly blog: BlogRepository;
  readonly approvedSourceInputs: ApprovedSourceInputPort;
  readonly workflowQuery: WorkflowQueryPort;
  readonly urlCaptureIntake: UrlCaptureIntakeQueryPort;
  readonly urlCapture: UrlCaptureCommandRepository;
  readonly fetcherGateway: FetcherGatewayClaimRepository;
  readonly urlCaptureResults: UrlCaptureResultRepository;
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
    research: new DrizzleResearchRepository(connection),
    blog: new DrizzleBlogRepository(connection),
    approvedSourceInputs: new DrizzleApprovedSourceInputProjection(connection),
    workflowQuery: new DrizzleWorkflowQueryProjection(connection),
    urlCaptureIntake: new DrizzleUrlCaptureIntakeProjection(connection),
    urlCapture: new DrizzleWorkflowCommandRepository(connection),
    fetcherGateway: new DrizzleWorkflowFetcherGatewayRepository(connection),
    urlCaptureResults: new DrizzleUrlCaptureResultRepository(connection),
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
