import type { ContentPackageRepository, SessionRepository } from '@contentos/core';

import { createDatabaseConnection } from './client.js';
import { DrizzleContentPackageRepository } from './content-package-repository.js';
import { DrizzleSessionRepository } from './session-repository.js';

export interface DatabaseRuntime {
  readonly sessions: SessionRepository;
  readonly contentPackages: ContentPackageRepository;
  close(): Promise<void>;
}

export function createDatabaseRuntime(databaseUrl: string): DatabaseRuntime {
  const connection = createDatabaseConnection(databaseUrl);
  return {
    sessions: new DrizzleSessionRepository(connection),
    contentPackages: new DrizzleContentPackageRepository(connection),
    async close(): Promise<void> {
      await connection.close();
    },
  };
}
