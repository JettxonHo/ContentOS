import { Body, Controller, Get, Inject, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  apiErrorSchema,
  parseUrlCaptureRequest,
  urlCaptureIntakeCollectionResponseSchema,
  urlCaptureRequestResponseSchema,
  urlCaptureRequestSchema,
  type UrlCaptureRequestResponse,
  type UrlCaptureIntakeCollectionResponse,
} from '@contentos/contracts';
import type {
  ContentPackageId,
  ContentPackageOwnerId,
  UrlCaptureIntake,
  UrlCaptureIntakeQueryPort,
  UrlCaptureService,
} from '@contentos/core';

import { AuthenticationGuard, type AuthenticatedRequest } from '../auth/authentication.guard';
import { ApiHttpError } from '../http/api-http-error';
import { URL_CAPTURE_INTAKE_QUERY, URL_CAPTURE_SERVICE } from '../runtime.tokens';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireId(value: string): ContentPackageId {
  if (!UUID_PATTERN.test(value)) {
    throw new ApiHttpError(422, 'INVALID_REQUEST', 'Invalid request', [{ path: '/packageId', keyword: 'format' }]);
  }
  return value as ContentPackageId;
}

function owner(request: AuthenticatedRequest): ContentPackageOwnerId {
  return request.currentSession.principal.userId;
}

function idempotencyKey(request: AuthenticatedRequest): string {
  const value = request.headers['idempotency-key'];
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/.test(value)) {
    throw new ApiHttpError(422, 'INVALID_REQUEST', 'Invalid request', [
      { path: '/headers/Idempotency-Key', keyword: 'format' },
    ]);
  }
  return value;
}

@ApiTags('url-capture')
@ApiCookieAuth('contentos_session')
@UseGuards(AuthenticationGuard)
@Controller('v1/content-packages/:packageId/url-capture-requests')
export class UrlCaptureController {
  constructor(
    @Inject(URL_CAPTURE_SERVICE) private readonly urlCapture: UrlCaptureService,
    @Inject(URL_CAPTURE_INTAKE_QUERY) private readonly intake: UrlCaptureIntakeQueryPort,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Read the owner-visible durable URL capture intake for a Content Package' })
  @ApiResponse({ status: 200, schema: urlCaptureIntakeCollectionResponseSchema })
  @ApiResponse({ status: 401, schema: apiErrorSchema })
  @ApiResponse({ status: 404, schema: apiErrorSchema })
  @ApiResponse({ status: 422, schema: apiErrorSchema })
  @ApiResponse({ status: 500, schema: apiErrorSchema })
  async list(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') packageId: string,
  ): Promise<UrlCaptureIntakeCollectionResponse> {
    const items = await this.intake.list({
      contentPackageId: requireId(packageId),
      ownerUserId: owner(request),
    });
    return { data: { items: items.map(toIntakeResource) } };
  }

  @Post()
  @ApiOperation({ summary: 'Record one owner-scoped public URL capture request' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    schema: { type: 'string', minLength: 16, maxLength: 128, pattern: '^[A-Za-z0-9_-]{16,128}$' },
  })
  @ApiBody({ schema: urlCaptureRequestSchema })
  @ApiResponse({ status: 201, schema: urlCaptureRequestResponseSchema })
  @ApiResponse({ status: 401, schema: apiErrorSchema })
  @ApiResponse({ status: 404, schema: apiErrorSchema })
  @ApiResponse({ status: 409, schema: apiErrorSchema })
  @ApiResponse({ status: 422, schema: apiErrorSchema })
  async submit(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') packageId: string,
    @Body() body: unknown,
  ): Promise<UrlCaptureRequestResponse> {
    const parsed = parseUrlCaptureRequest(body);
    if (!parsed.ok) throw new ApiHttpError(422, 'INVALID_REQUEST', 'Invalid request', parsed.errors);
    const result = await this.urlCapture.submit({
      contentPackageId: requireId(packageId),
      ownerUserId: owner(request),
      expectedPackageRevision: parsed.value.expectedPackageRevision,
      role: parsed.value.role,
      submittedUrl: parsed.value.submittedUrl,
      idempotencyKey: idempotencyKey(request),
    });
    return {
      data: {
        urlCaptureRequest: {
          id: result.urlCaptureRequestId,
          contentPackageId: result.contentPackageId,
          sourceReferenceId: result.sourceReferenceId,
          workflowInstanceId: result.workflowInstanceId,
          workflowNodeId: result.workflowNodeId,
          taskId: result.taskId,
          taskState: result.taskState,
          createdAt: result.createdAt.toISOString(),
        },
      },
    };
  }
}

function toIntakeResource(value: UrlCaptureIntake): UrlCaptureIntakeCollectionResponse['data']['items'][number] {
  const base = {
    id: value.id,
    role: value.role,
    submittedUrl: value.submittedUrl,
    createdAt: value.createdAt.toISOString(),
    updatedAt: value.updatedAt.toISOString(),
  };
  if (value.status === 'failed') return { ...base, status: 'failed', failure: value.failure, sourceId: null };
  if (value.status === 'succeeded') return { ...base, status: 'succeeded', failure: null, sourceId: value.sourceId };
  return { ...base, status: value.status, failure: null, sourceId: null };
}
