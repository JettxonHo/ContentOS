import { type DynamicModule, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';

import type { ApiConfig, ApiSecrets } from '@contentos/config';
import { AuthenticationService, type UserId } from '@contentos/core';

import { AuthController } from './auth/auth.controller';
import { NodeSessionCredentialManager, ScryptPasswordVerifier, UuidSessionIdGenerator } from './auth/crypto';
import { LoginAttemptLimiter } from './auth/login-attempt-limiter';
import { DatabaseService } from './database.service';
import { HealthController } from './health.controller';
import { ApiExceptionFilter } from './http/api-exception.filter';
import { TrustedOriginGuard } from './http/trusted-origin.guard';
import { API_CONFIG, API_SECRETS, AUTHENTICATION_SERVICE } from './runtime.tokens';

@Module({})
export class AppModule {
  static register(config: ApiConfig, secrets: ApiSecrets): DynamicModule {
    return {
      module: AppModule,
      controllers: [HealthController, AuthController],
      providers: [
        { provide: API_CONFIG, useValue: config },
        { provide: API_SECRETS, useValue: secrets },
        DatabaseService,
        LoginAttemptLimiter,
        {
          provide: AUTHENTICATION_SERVICE,
          inject: [DatabaseService],
          useFactory: (database: DatabaseService): AuthenticationService =>
            new AuthenticationService(
              database.sessions,
              new ScryptPasswordVerifier(secrets.ownerPasswordHash),
              new NodeSessionCredentialManager(),
              { now: () => new Date() },
              new UuidSessionIdGenerator(),
              {
                ownerUserId: config.ownerUserId as UserId,
                sessionTtlMs: config.sessionTtlSeconds * 1000,
              },
            ),
        },
        { provide: APP_GUARD, useClass: TrustedOriginGuard },
        { provide: APP_FILTER, useClass: ApiExceptionFilter },
      ],
    };
  }
}
