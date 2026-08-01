import type { UrlCaptureCommandRepository, WorkflowRepository } from '@contentos/core';

import { createDatabaseConnection } from './client.js';
import { DrizzleWorkflowRepository } from './workflow-repository.js';
import { DrizzleWorkflowCommandRepository } from './workflow-command-repository.js';

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
