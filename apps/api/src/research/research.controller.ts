import { Body, Controller, Get, HttpCode, Inject, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  apiErrorSchema,
  approveResearchRequestSchema,
  checkpointResearchRequestSchema,
  editResearchWorkingCopyRequestSchema,
  generateResearchRequestSchema,
  parseApproveResearchRequest,
  parseCheckpointResearchRequest,
  parseEditResearchWorkingCopyRequest,
  parseGenerateResearchRequest,
  researchResponseSchema,
  type ResearchResource,
  type ResearchResponse,
} from '@contentos/contracts';
import type {
  ContentPackageId,
  ContentPackageOwnerId,
  ResearchService,
  ResearchState,
  ResearchVersionId,
} from '@contentos/core';

import { AuthenticationGuard, type AuthenticatedRequest } from '../auth/authentication.guard';
import { ApiHttpError } from '../http/api-http-error';
import { RESEARCH_SERVICE } from '../runtime.tokens';

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

function resource(state: ResearchState): ResearchResource {
  return {
    id: state.researchId,
    contentPackageId: state.contentPackageId,
    outdated: state.outdated,
    reviewCandidateOutdated: state.reviewCandidateOutdated,
    workingCopy: {
      revision: state.workingCopy.revision,
      checkpointedRevision: state.workingCopy.checkpointedRevision,
      baseVersionId: state.workingCopy.baseVersionId,
      body: state.workingCopy.body,
      updatedAt: state.workingCopy.updatedAt.toISOString(),
    },
    latestVersion: {
      id: state.latestVersion.id,
      versionNumber: state.latestVersion.versionNumber,
      body: state.latestVersion.body,
      sourceInputs: state.latestVersion.sourceInputs,
      origin: state.latestVersion.origin,
      createdAt: state.latestVersion.createdAt.toISOString(),
    },
    approvedVersionId: state.head.approvedVersionId,
    approval: state.approval
      ? {
          id: state.approval.id,
          approvedVersionId: state.approval.approvedVersionId,
          approvedAt: state.approval.approvedAt.toISOString(),
          validationSummary: state.approval.validationSummary,
        }
      : null,
  };
}

function response(state: ResearchState): ResearchResponse {
  return { data: { research: resource(state) } };
}

function invalid(errors: readonly { readonly path: string; readonly keyword: string }[]): never {
  throw new ApiHttpError(422, 'INVALID_REQUEST', 'Invalid request', errors);
}

@ApiTags('research')
@ApiCookieAuth('contentos_session')
@UseGuards(AuthenticationGuard)
@Controller('v1/content-packages/:packageId/research')
export class ResearchController {
  constructor(@Inject(RESEARCH_SERVICE) private readonly research: ResearchService) {}

  @Get()
  @ApiOperation({ summary: 'Read the owner-scoped authoritative Research review state' })
  @ApiResponse({ status: 200, schema: researchResponseSchema })
  @ApiResponse({ status: 401, schema: apiErrorSchema })
  @ApiResponse({ status: 404, schema: apiErrorSchema })
  @ApiResponse({ status: 409, schema: apiErrorSchema })
  @ApiResponse({ status: 422, schema: apiErrorSchema })
  @ApiResponse({ status: 500, schema: apiErrorSchema })
  async get(@Req() request: AuthenticatedRequest, @Param('packageId') packageId: string): Promise<ResearchResponse> {
    return response(await this.research.get(requirePackageId(packageId), owner(request)));
  }

  @Post('generations')
  @HttpCode(201)
  @ApiOperation({ summary: 'Generate deterministic Fake Provider Research from exact Approved Sources' })
  @ApiBody({ schema: generateResearchRequestSchema })
  @ApiResponse({ status: 201, schema: researchResponseSchema })
  @ApiResponse({ status: 401, schema: apiErrorSchema })
  @ApiResponse({ status: 404, schema: apiErrorSchema })
  @ApiResponse({ status: 409, schema: apiErrorSchema })
  @ApiResponse({ status: 422, schema: apiErrorSchema })
  @ApiResponse({ status: 500, schema: apiErrorSchema })
  @ApiResponse({ status: 502, schema: apiErrorSchema })
  async generate(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') packageId: string,
    @Body() body: unknown,
  ): Promise<ResearchResponse> {
    const parsed = parseGenerateResearchRequest(body);
    if (!parsed.ok) invalid(parsed.errors);
    return response(
      await this.research.generate({
        packageId: requirePackageId(packageId),
        ownerUserId: owner(request),
        requestId: parsed.value.requestId,
      }),
    );
  }

  @Patch('working-copy')
  @ApiOperation({ summary: 'Edit the Research Review Working Copy with optimistic revision' })
  @ApiBody({ schema: editResearchWorkingCopyRequestSchema })
  @ApiResponse({ status: 200, schema: researchResponseSchema })
  @ApiResponse({ status: 401, schema: apiErrorSchema })
  @ApiResponse({ status: 404, schema: apiErrorSchema })
  @ApiResponse({ status: 409, schema: apiErrorSchema })
  @ApiResponse({ status: 422, schema: apiErrorSchema })
  @ApiResponse({ status: 500, schema: apiErrorSchema })
  async edit(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') packageId: string,
    @Body() body: unknown,
  ): Promise<ResearchResponse> {
    const parsed = parseEditResearchWorkingCopyRequest(body);
    if (!parsed.ok) invalid(parsed.errors);
    return response(
      await this.research.updateWorkingCopy({
        packageId: requirePackageId(packageId),
        ownerUserId: owner(request),
        expectedRevision: parsed.value.expectedRevision,
        body: parsed.value.body,
      }),
    );
  }

  @Post('versions')
  @ApiOperation({ summary: 'Checkpoint one immutable Research Version from the Working Copy' })
  @ApiBody({ schema: checkpointResearchRequestSchema })
  @ApiResponse({ status: 201, schema: researchResponseSchema })
  @ApiResponse({ status: 401, schema: apiErrorSchema })
  @ApiResponse({ status: 404, schema: apiErrorSchema })
  @ApiResponse({ status: 409, schema: apiErrorSchema })
  @ApiResponse({ status: 422, schema: apiErrorSchema })
  @ApiResponse({ status: 500, schema: apiErrorSchema })
  async checkpoint(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') packageId: string,
    @Body() body: unknown,
  ): Promise<ResearchResponse> {
    const parsed = parseCheckpointResearchRequest(body);
    if (!parsed.ok) invalid(parsed.errors);
    return response(
      await this.research.checkpoint({
        packageId: requirePackageId(packageId),
        ownerUserId: owner(request),
        expectedRevision: parsed.value.expectedRevision,
      }),
    );
  }

  @Post('approval')
  @ApiOperation({ summary: 'Approve one exact eligible Research Version' })
  @ApiBody({ schema: approveResearchRequestSchema })
  @ApiResponse({ status: 201, schema: researchResponseSchema })
  @ApiResponse({ status: 401, schema: apiErrorSchema })
  @ApiResponse({ status: 404, schema: apiErrorSchema })
  @ApiResponse({ status: 409, schema: apiErrorSchema })
  @ApiResponse({ status: 422, schema: apiErrorSchema })
  @ApiResponse({ status: 500, schema: apiErrorSchema })
  async approve(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') packageId: string,
    @Body() body: unknown,
  ): Promise<ResearchResponse> {
    const parsed = parseApproveResearchRequest(body);
    if (!parsed.ok) invalid(parsed.errors);
    return response(
      await this.research.approve({
        packageId: requirePackageId(packageId),
        ownerUserId: owner(request),
        versionId: parsed.value.versionId as ResearchVersionId,
      }),
    );
  }
}
