import { type DynamicModule, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { randomBytes, randomUUID } from 'node:crypto';

import type { ApiConfig, ApiSecrets } from '@contentos/config';
import { S3ObjectStore } from '@contentos/object-storage';
import {
  AuthenticationService,
  ContentPackageService,
  type ContentPackageId,
  SourceService,
  UrlCaptureService,
  type SourceId,
  type RawSnapshotId,
  type SourceWorkingCopyId,
  type SourceVersionId,
  type SourceApprovalId,
  type WorkflowInstanceId,
  type WorkflowNodeId,
  type UrlSourceReferenceId,
  type UrlCaptureRequestId,
  type WorkflowTaskId,
  type WorkflowOutboxRecordId,
  type WorkflowEventId,
  FetcherGatewayService,
  type FetcherGatewayClaimGenerator,
  FetcherResultService,
  type WorkflowQueryPort,
  type UrlCaptureIntakeQueryPort,
  type FetcherResultIds,
} from '@contentos/core';
import type { UserId } from '@contentos/core';

import { AuthController } from './auth/auth.controller';
import { ContentPackageController } from './content-package/content-package.controller';
import { NodeSessionCredentialManager, ScryptPasswordVerifier, UuidSessionIdGenerator } from './auth/crypto';
import { LoginAttemptLimiter } from './auth/login-attempt-limiter';
import { DatabaseService } from './database.service';
import { HealthController } from './health.controller';
import { ApiExceptionFilter } from './http/api-exception.filter';
import { TrustedOriginGuard } from './http/trusted-origin.guard';
import { SourceController } from './source/source.controller';
import { UrlCaptureController } from './url-capture/url-capture.controller';
import { FetcherGatewayController } from './fetcher-gateway/fetcher-gateway.controller';
import { WorkflowController } from './workflow/workflow.controller';
import { WorkflowNotificationStream } from './workflow/workflow-notification-stream';
import { FetcherGatewaySecretGuard } from './fetcher-gateway/fetcher-gateway.guard';
import { AjvNormalizedBodyValidator } from './source/ajv-body-validator';
import {
  API_CONFIG,
  API_SECRETS,
  AUTHENTICATION_SERVICE,
  CONTENT_PACKAGE_SERVICE,
  OBJECT_STORE,
  SOURCE_SERVICE,
  URL_CAPTURE_SERVICE,
  FETCHER_GATEWAY_SERVICE,
  FETCHER_RESULT_SERVICE,
  WORKFLOW_QUERY,
  URL_CAPTURE_INTAKE_QUERY,
} from './runtime.tokens';

@Module({})
export class AppModule {
  static register(config: ApiConfig, secrets: ApiSecrets): DynamicModule {
    return {
      module: AppModule,
      controllers: [
        HealthController,
        AuthController,
        ContentPackageController,
        SourceController,
        UrlCaptureController,
        FetcherGatewayController,
        WorkflowController,
      ],
      providers: [
        { provide: API_CONFIG, useValue: config },
        { provide: API_SECRETS, useValue: secrets },
        DatabaseService,
        FetcherGatewaySecretGuard,
        WorkflowNotificationStream,
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
        {
          provide: CONTENT_PACKAGE_SERVICE,
          inject: [DatabaseService],
          useFactory: (database: DatabaseService): ContentPackageService =>
            new ContentPackageService(
              database.contentPackages,
              { generate: () => randomUUID() as ContentPackageId },
              { now: () => new Date() },
            ),
        },
        {
          provide: OBJECT_STORE,
          inject: [API_CONFIG, API_SECRETS],
          useFactory: (apiConfig: ApiConfig, apiSecrets: ApiSecrets): S3ObjectStore =>
            new S3ObjectStore({
              endpoint: apiConfig.objectStorage.endpoint,
              region: apiConfig.objectStorage.region,
              bucket: apiConfig.objectStorage.bucket,
              forcePathStyle: apiConfig.objectStorage.forcePathStyle,
              accessKeyId: apiSecrets.objectStorageAccessKey,
              secretAccessKey: apiSecrets.objectStorageSecretKey,
            }),
        },
        {
          provide: SOURCE_SERVICE,
          inject: [DatabaseService, OBJECT_STORE],
          useFactory: (database: DatabaseService, objectStore: S3ObjectStore): SourceService =>
            new SourceService(
              database.sources,
              objectStore,
              {
                generateSourceId: () => randomUUID() as SourceId,
                generateSnapshotId: () => randomUUID() as RawSnapshotId,
                generateWorkingCopyId: () => randomUUID() as SourceWorkingCopyId,
                generateVersionId: () => randomUUID() as SourceVersionId,
                generateApprovalId: () => randomUUID() as SourceApprovalId,
              },
              { now: () => new Date() },
              new AjvNormalizedBodyValidator(),
            ),
        },
        {
          provide: URL_CAPTURE_SERVICE,
          inject: [DatabaseService],
          useFactory: (database: DatabaseService): UrlCaptureService =>
            new UrlCaptureService(
              database.urlCapture,
              {
                generateWorkflowInstanceId: () => randomUUID() as WorkflowInstanceId,
                generateWorkflowNodeId: () => randomUUID() as WorkflowNodeId,
                generateUrlSourceReferenceId: () => randomUUID() as UrlSourceReferenceId,
                generateUrlCaptureRequestId: () => randomUUID() as UrlCaptureRequestId,
                generateWorkflowTaskId: () => randomUUID() as WorkflowTaskId,
                generateWorkflowOutboxRecordId: () => randomUUID() as WorkflowOutboxRecordId,
                generateWorkflowEventId: () => randomUUID() as WorkflowEventId,
              },
              { now: () => new Date() },
            ),
        },
        {
          provide: FETCHER_GATEWAY_SERVICE,
          inject: [DatabaseService],
          useFactory: (database: DatabaseService): FetcherGatewayService =>
            new FetcherGatewayService(
              database.fetcherGateway,
              {
                generate: (): string => randomBytes(32).toString('base64url'),
              } satisfies FetcherGatewayClaimGenerator,
              { now: () => new Date() },
            ),
        },
        {
          provide: FETCHER_RESULT_SERVICE,
          inject: [DatabaseService, OBJECT_STORE],
          useFactory: (database: DatabaseService, objectStore: S3ObjectStore): FetcherResultService =>
            new FetcherResultService(
              database.urlCaptureResults,
              objectStore,
              {
                generateResultId: () => randomUUID(),
                generateWorkingCopyId: () => randomUUID(),
                generateSourceReviewNodeId: () => randomUUID() as WorkflowNodeId,
                generateResultEventId: () => randomUUID() as WorkflowEventId,
              } satisfies FetcherResultIds,
              { now: () => new Date() },
            ),
        },
        {
          provide: WORKFLOW_QUERY,
          inject: [DatabaseService],
          useFactory: (database: DatabaseService): WorkflowQueryPort => database.workflowQuery,
        },
        {
          provide: URL_CAPTURE_INTAKE_QUERY,
          inject: [DatabaseService],
          useFactory: (database: DatabaseService): UrlCaptureIntakeQueryPort => database.urlCaptureIntake,
        },
        { provide: APP_GUARD, useClass: TrustedOriginGuard },
        { provide: APP_FILTER, useClass: ApiExceptionFilter },
      ],
    };
  }
}
