import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';

import type { ApiSecrets } from '@contentos/config';
import type { SessionRepository } from '@contentos/core';
import { createDatabaseRuntime, type DatabaseRuntime } from '@contentos/database';

import { API_SECRETS } from './runtime.tokens';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly runtime: DatabaseRuntime;
  readonly sessions: SessionRepository;

  constructor(@Inject(API_SECRETS) secrets: ApiSecrets) {
    this.runtime = createDatabaseRuntime(secrets.databaseUrl);
    this.sessions = this.runtime.sessions;
  }

  async onModuleDestroy(): Promise<void> {
    await this.runtime.close();
  }
}
