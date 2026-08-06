import type { UrlCaptureCommandRepository, UrlCaptureResultRepository, WorkflowRepository } from '@contentos/core';
import type { FetcherGatewayClaimRepository } from '@contentos/core';
import type { Pool } from 'pg';

import { createDatabaseConnection } from './client.js';
import { DrizzleWorkflowRepository } from './workflow-repository.js';
import { DrizzleWorkflowCommandRepository } from './workflow-command-repository.js';
import { DrizzleWorkflowDispatchRepository } from './workflow-dispatch-repository.js';
import { DrizzleWorkflowFetcherGatewayRepository } from './workflow-fetcher-gateway-repository.js';
import { DrizzleUrlCaptureResultRepository } from './url-capture-result-repository.js';
import type { WorkflowDispatchRepository } from './runtime.js';

/** Disposable PostgreSQL boundary for Workflow persistence and migration tests. */
export interface WorkflowRepositoryTestBoundary {
  readonly repository: WorkflowRepository;
  query<TRow extends Record<string, unknown>>(text: string, values?: readonly unknown[]): Promise<readonly TRow[]>;
  close(): Promise<void>;
}

export function createWorkflowRepositoryTestBoundary(databaseUrl: string): WorkflowRepositoryTestBoundary {
  const connection = createDatabaseConnection(databaseUrl);
  return {
    repository: new DrizzleWorkflowRepository(connection),
    async query<TRow extends Record<string, unknown>>(
      text: string,
      values: readonly unknown[] = [],
    ): Promise<readonly TRow[]> {
      const result = await connection.pool.query<TRow>(text, [...values]);
      return result.rows;
    },
    close: () => connection.close(),
  };
}

/** Disposable PostgreSQL boundary for the atomic URL-capture Command tests. */
export interface UrlCaptureRepositoryTestBoundary {
  readonly repository: UrlCaptureCommandRepository;
  query<TRow extends Record<string, unknown>>(text: string, values?: readonly unknown[]): Promise<readonly TRow[]>;
  close(): Promise<void>;
}

export interface UrlCaptureRepositoryTestOptions {
  readonly afterStage?: (stage: string) => void | Promise<void>;
}

export function createUrlCaptureRepositoryTestBoundary(
  databaseUrl: string,
  options?: UrlCaptureRepositoryTestOptions,
): UrlCaptureRepositoryTestBoundary {
  const connection = createDatabaseConnection(databaseUrl);
  return {
    repository: new DrizzleWorkflowCommandRepository(connection, options),
    async query<TRow extends Record<string, unknown>>(
      text: string,
      values: readonly unknown[] = [],
    ): Promise<readonly TRow[]> {
      const result = await connection.pool.query<TRow>(text, [...values]);
      return result.rows;
    },
    close: () => connection.close(),
  };
}

/** Disposable PostgreSQL boundary for the Worker Outbox Dispatcher tests. */
export interface WorkflowDispatchRepositoryTestBoundary {
  readonly repository: WorkflowDispatchRepository;
  query<TRow extends Record<string, unknown>>(text: string, values?: readonly unknown[]): Promise<readonly TRow[]>;
  close(): Promise<void>;
}

/**
 * Local structural test-options type, kept distinct from the repository's
 * internal options: referencing that type in this helper's public signature
 * would pull the Drizzle client declaration surface into the emitted `.d.ts`
 * and leak third-party optional-peer declarations into consumer builds.
 */
export interface WorkflowDispatchRepositoryTestOptions {
  readonly afterLeaseRecoveryStage?: (stage: 'task' | 'outbox' | 'event') => void | Promise<void>;
}

export function createWorkflowDispatchRepositoryTestBoundary(
  databaseUrl: string,
  options?: WorkflowDispatchRepositoryTestOptions,
): WorkflowDispatchRepositoryTestBoundary {
  const connection = createDatabaseConnection(databaseUrl);
  return {
    repository: new DrizzleWorkflowDispatchRepository(connection, options),
    async query<TRow extends Record<string, unknown>>(
      text: string,
      values: readonly unknown[] = [],
    ): Promise<readonly TRow[]> {
      const result = await connection.pool.query<TRow>(text, [...values]);
      return result.rows;
    },
    close: () => connection.close(),
  };
}

/** Disposable PostgreSQL boundary for private Fetcher Gateway Claim/Heartbeat tests. */
export interface FetcherGatewayRepositoryTestBoundary {
  readonly repository: FetcherGatewayClaimRepository;
  query<TRow extends Record<string, unknown>>(text: string, values?: readonly unknown[]): Promise<readonly TRow[]>;
  close(): Promise<void>;
}

export function createFetcherGatewayRepositoryTestBoundary(databaseUrl: string): FetcherGatewayRepositoryTestBoundary {
  const connection = createDatabaseConnection(databaseUrl);
  return {
    repository: new DrizzleWorkflowFetcherGatewayRepository(connection),
    async query<TRow extends Record<string, unknown>>(
      text: string,
      values: readonly unknown[] = [],
    ): Promise<readonly TRow[]> {
      const result = await connection.pool.query<TRow>(text, [...values]);
      return result.rows;
    },
    close: () => connection.close(),
  };
}

/** Disposable PostgreSQL boundary for the URL-capture Result repository tests. */
export interface UrlCaptureResultRepositoryTestBoundary {
  readonly repository: UrlCaptureResultRepository;
  /** Exposed so tests can assert poisoned-connection destruction via Pool counts. */
  readonly pool: Pool;
  query<TRow extends Record<string, unknown>>(text: string, values?: readonly unknown[]): Promise<readonly TRow[]>;
  close(): Promise<void>;
}

/**
 * Local structural test-options type, kept distinct from the repository's
 * internal options: referencing that type in this helper's public signature
 * would pull the Drizzle client declaration surface into the emitted `.d.ts`
 * and leak third-party optional-peer declarations into consumer builds.
 */
export interface UrlCaptureResultRepositoryTestOptions {
  readonly beforeTransitions?: (
    exec: (text: string, values?: readonly unknown[]) => Promise<unknown>,
    taskId: string,
  ) => Promise<void> | void;
  readonly reconcileAt?: (point: 'afterBegin' | 'taskBarrier' | 'resultQuery') => void;
  readonly prepareAt?: (point: 'taskQuery') => void;
  readonly rollbackFault?: (method: 'prepareResult' | 'recordResult' | 'reconcileResult') => void;
}

export function createUrlCaptureResultRepositoryTestBoundary(
  databaseUrl: string,
  options?: UrlCaptureResultRepositoryTestOptions,
): UrlCaptureResultRepositoryTestBoundary {
  const connection = createDatabaseConnection(databaseUrl);
  return {
    repository: new DrizzleUrlCaptureResultRepository(connection, options),
    pool: connection.pool,
    async query<TRow extends Record<string, unknown>>(
      text: string,
      values: readonly unknown[] = [],
    ): Promise<readonly TRow[]> {
      const result = await connection.pool.query<TRow>(text, [...values]);
      return result.rows;
    },
    close: () => connection.close(),
  };
}
