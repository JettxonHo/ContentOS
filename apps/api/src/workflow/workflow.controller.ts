import {
  Controller,
  Get,
  Head,
  HttpCode,
  Inject,
  Param,
  Query,
  Req,
  Sse,
  UseGuards,
  type MessageEvent,
} from '@nestjs/common';
import { ApiCookieAuth, ApiExcludeEndpoint, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Observable } from 'rxjs';

import {
  apiErrorSchema,
  parseWorkflowTimelineQuery,
  workflowProjectionResponseSchema,
  workflowTimelinePageResponseSchema,
  type WorkflowProjectionResponse,
  type WorkflowTimelineItemResource,
  type WorkflowTimelinePageResponse,
} from '@contentos/contracts';
import type { ContentPackageId, ContentPackageOwnerId, WorkflowQueryPort, WorkflowTimelineItem } from '@contentos/core';

import { AuthenticationGuard, type AuthenticatedRequest } from '../auth/authentication.guard.js';
import { ApiHttpError } from '../http/api-http-error.js';
import { WORKFLOW_QUERY } from '../runtime.tokens.js';
import { WorkflowNotificationStream, toWorkflowProjectionResource } from './workflow-notification-stream.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requirePackageId(value: string): ContentPackageId {
  if (!UUID_PATTERN.test(value)) {
    throw new ApiHttpError(422, 'INVALID_REQUEST', 'Invalid request', [{ path: '/packageId', keyword: 'format' }]);
  }
  return value as ContentPackageId;
}

function owner(request: AuthenticatedRequest): ContentPackageOwnerId {
  return request.currentSession.principal.userId;
}

function timelineResource(value: WorkflowTimelineItem): WorkflowTimelineItemResource {
  const base = { sequence: value.sequence, nodeKey: value.nodeKey, occurredAt: value.occurredAt.toISOString() };
  switch (value.kind) {
    case 'fetcher_lease_expired.v1':
      return { ...base, kind: value.kind, attemptNumber: value.attemptNumber };
    case 'url_capture_succeeded.v1':
      return { ...base, kind: value.kind, attemptNumber: value.attemptNumber };
    case 'url_capture_failed.v1':
      return { ...base, kind: value.kind, attemptNumber: value.attemptNumber, failure: value.failure };
    case 'url_capture_requested.v1':
      return { ...base, kind: value.kind };
    case 'workflow_event.v1':
      return { ...base, kind: value.kind };
  }
}

@ApiTags('workflow')
@ApiCookieAuth('contentos_session')
@UseGuards(AuthenticationGuard)
@Controller('v1/content-packages/:packageId/workflow')
export class WorkflowController {
  constructor(
    @Inject(WORKFLOW_QUERY) private readonly workflowQuery: WorkflowQueryPort,
    @Inject(WorkflowNotificationStream)
    private readonly notificationStream: WorkflowNotificationStream,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Read the owner-scoped authoritative Workflow projection' })
  @ApiResponse({ status: 200, schema: workflowProjectionResponseSchema })
  @ApiResponse({ status: 401, schema: apiErrorSchema })
  @ApiResponse({ status: 404, schema: apiErrorSchema })
  @ApiResponse({ status: 422, schema: apiErrorSchema })
  @ApiResponse({ status: 500, schema: apiErrorSchema })
  async projection(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') packageId: string,
  ): Promise<WorkflowProjectionResponse> {
    const workflow = await this.workflowQuery.getProjection({
      contentPackageId: requirePackageId(packageId),
      ownerUserId: owner(request),
    });
    return { data: { workflow: workflow === null ? null : toWorkflowProjectionResource(workflow) } };
  }

  @Head('stream')
  @HttpCode(204)
  @ApiExcludeEndpoint()
  async streamHead(@Req() request: AuthenticatedRequest, @Param('packageId') packageId: string): Promise<void> {
    await this.notificationStream.preflight({ packageId: requirePackageId(packageId), ownerUserId: owner(request) });
  }

  @Sse('stream')
  @ApiOperation({ summary: 'Subscribe to bounded Workflow projection change notifications' })
  @ApiResponse({
    status: 200,
    description: 'A private notification-only server-sent event stream',
    content: { 'text/event-stream': { schema: { type: 'string' } } },
  })
  @ApiResponse({ status: 401, schema: apiErrorSchema })
  @ApiResponse({ status: 404, schema: apiErrorSchema })
  @ApiResponse({ status: 422, schema: apiErrorSchema })
  @ApiResponse({ status: 500, schema: apiErrorSchema })
  stream(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') packageId: string,
  ): Promise<Observable<MessageEvent>> {
    return this.notificationStream.open({
      packageId: requirePackageId(packageId),
      ownerUserId: owner(request),
      expiresAt: request.currentSession.expiresAt,
    });
  }

  @Get('events')
  @ApiOperation({ summary: 'Read an owner-scoped bounded Workflow Timeline page' })
  @ApiQuery({
    name: 'after',
    required: false,
    schema: { type: 'integer', default: 0, minimum: 0, maximum: 2_147_483_647 },
  })
  @ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', default: 20, minimum: 1, maximum: 50 } })
  @ApiResponse({ status: 200, schema: workflowTimelinePageResponseSchema })
  @ApiResponse({ status: 401, schema: apiErrorSchema })
  @ApiResponse({ status: 404, schema: apiErrorSchema })
  @ApiResponse({ status: 422, schema: apiErrorSchema })
  @ApiResponse({ status: 500, schema: apiErrorSchema })
  async events(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') packageId: string,
    @Query() query: unknown,
  ): Promise<WorkflowTimelinePageResponse> {
    const parsed = parseWorkflowTimelineQuery(query);
    if (!parsed.ok) throw new ApiHttpError(422, 'INVALID_REQUEST', 'Invalid request', parsed.errors);
    const page = await this.workflowQuery.listTimeline({
      contentPackageId: requirePackageId(packageId),
      ownerUserId: owner(request),
      after: parsed.value.after,
      limit: parsed.value.limit,
    });
    return {
      data: {
        workflowInstanceId: page.workflowInstanceId,
        latestSequence: page.latestSequence,
        items: page.items.map(timelineResource),
        nextAfter: page.nextAfter,
      },
    };
  }
}
