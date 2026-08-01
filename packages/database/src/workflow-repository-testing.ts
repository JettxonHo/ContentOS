import type { WorkflowRepository } from '@contentos/core';

import { createDatabaseConnection } from './client.js';
import { DrizzleWorkflowRepository } from './workflow-repository.js';

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
