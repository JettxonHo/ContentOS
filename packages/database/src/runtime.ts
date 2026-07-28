import type { SessionRepository } from '@contentos/core';

import { createDatabaseConnection } from './client.js';
import { DrizzleSessionRepository } from './session-repository.js';

export interface DatabaseRuntime {
  readonly sessions: SessionRepository;
  close(): Promise<void>;
}

export function createDatabaseRuntime(databaseUrl: string): DatabaseRuntime {
  const connection = createDatabaseConnection(databaseUrl);
  return {
    sessions: new DrizzleSessionRepository(connection),
    async close(): Promise<void> {
      await connection.close();
    },
  };
}
