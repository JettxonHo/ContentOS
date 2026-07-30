import type { SourceRepository } from '@contentos/core';

import { createDatabaseConnection } from './client.js';
import { DrizzleSourceRepository } from './source-repository.js';

export type SourceRepositoryFaultPoint =
  | 'capture.afterSourceInsert'
  | 'capture.afterSnapshotInsert'
  | 'capture.afterWorkingCopyInsert'
  | 'capture.afterHeadInsert'
  | 'capture.afterRollback'
  | 'capture.afterCommit'
  | 'reconcile.beforeBarrier'
  | 'reconcile.beforeRead'
  | 'version.afterVersionInsert'
  | 'version.afterHeadUpdate'
  | 'version.afterWorkingCopyUpdate'
  | 'approval.afterApprovalInsert'
  | 'approval.afterHeadUpdate';

export interface SourceRepositoryFaultInjector {
  hit(point: SourceRepositoryFaultPoint): void | Promise<void>;
}

/** Disposable-PostgreSQL boundary that always constructs the production Drizzle repository. */
export interface SourceRepositoryTestBoundary {
  readonly repository: SourceRepository;
  query<TRow extends Record<string, unknown>>(text: string, values?: readonly unknown[]): Promise<readonly TRow[]>;
  close(): Promise<void>;
}

export function createSourceRepositoryTestBoundary(
  databaseUrl: string,
  faultInjector: SourceRepositoryFaultInjector,
): SourceRepositoryTestBoundary {
  const connection = createDatabaseConnection(databaseUrl);
  return {
    repository: new DrizzleSourceRepository(connection, faultInjector),
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
