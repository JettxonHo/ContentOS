import type {
  ContentPackageRepository,
  SessionRepository,
  SourceRepository,
  UrlCaptureCommandRepository,
} from '@contentos/core';

import { createDatabaseConnection } from './client.js';
import { DrizzleContentPackageRepository } from './content-package-repository.js';
import { DrizzleSessionRepository } from './session-repository.js';
import { DrizzleSourceRepository } from './source-repository.js';
import { DrizzleWorkflowCommandRepository } from './workflow-command-repository.js';

export interface DatabaseRuntime {
  readonly sessions: SessionRepository;
  readonly contentPackages: ContentPackageRepository;
  readonly sources: SourceRepository;
  readonly urlCapture: UrlCaptureCommandRepository;
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
