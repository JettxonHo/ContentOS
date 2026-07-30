import { Buffer } from 'node:buffer';

import { Body, Controller, Get, HttpCode, Inject, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  apiErrorSchema,
  approveSourceVersionRequestSchema,
  createSourceRequestSchema,
  createSourceVersionRequestSchema,
  editSourceWorkingCopyRequestSchema,
  parseApproveSourceVersionRequest,
  parseCreateSourceRequest,
  parseCreateSourceVersionRequest,
  parseEditSourceWorkingCopyRequest,
  parseSourceListQuery,
  sourceApprovalResponseSchema,
  sourceListResponseSchema,
  sourceResponseSchema,
  sourceVersionDetailResponseSchema,
  sourceVersionListResponseSchema,
  sourceVersionResponseSchema,
  sourceWorkingCopyResponseSchema,
  type SourceApprovalResponse,
  type SourceListItemResource,
  type SourceListResponse,
  type SourceResource,
  type SourceResponse,
  type SourceVersionDetailResponse,
  type SourceVersionListResponse,
  type SourceVersionResponse,
  type SourceWorkingCopyResponse,
} from '@contentos/contracts';
import type {
  ContentPackageId,
  ContentPackageOwnerId,
  SourceId,
  SourceService,
  SourceState,
  SourceVersionId,
} from '@contentos/core';

import { AuthenticationGuard, type AuthenticatedRequest } from '../auth/authentication.guard';
import { ApiHttpError } from '../http/api-http-error';
import { SOURCE_SERVICE } from '../runtime.tokens';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireId(value: string, path: string): string {
  if (!UUID_PATTERN.test(value)) {
    throw new ApiHttpError(422, 'INVALID_REQUEST', 'Invalid request', [{ path, keyword: 'format' }]);
  }
  return value;
}

function owner(request: AuthenticatedRequest): ContentPackageOwnerId {
  return request.currentSession.principal.userId;
}

function toResource(state: SourceState): SourceResource {
  return {
    id: state.reference.id,
    contentPackageId: state.reference.contentPackageId,
    sourceType: state.reference.sourceType,
    role: state.reference.role,
    label: state.reference.label,
    captureType: state.reference.captureType,
    createdAt: state.reference.createdAt.toISOString(),
    workingCopy: {
      revision: state.workingCopy.revision,
      schemaVersion: state.workingCopy.schemaVersion,
      updatedAt: state.workingCopy.updatedAt.toISOString(),
    },
    rawSnapshot: {
      sha256: state.rawSnapshot.sha256,
      byteSize: state.rawSnapshot.byteSize,
      contentType: state.rawSnapshot.contentType,
      capturedAt: state.rawSnapshot.capturedAt.toISOString(),
    },
    latestVersionId: state.head.latestVersionId,
    reviewCandidateVersionId: state.head.reviewCandidateVersionId,
    approvedVersionId: state.head.approvedVersionId,
  };
}

function encodeCursor(position: { createdAt: Date; id: SourceId }): string {
  return Buffer.from(JSON.stringify({ v: 1, createdAt: position.createdAt.toISOString(), id: position.id })).toString(
    'base64url',
  );
}

function decodeCursor(value: string | undefined): { createdAt: Date; id: SourceId } | undefined {
  if (value === undefined) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Record<string, unknown>;
    if (
      parsed.v !== 1 ||
      typeof parsed.createdAt !== 'string' ||
      typeof parsed.id !== 'string' ||
      !UUID_PATTERN.test(parsed.id)
    ) {
      throw new Error('invalid cursor');
    }
    const createdAt = new Date(parsed.createdAt);
    if (Number.isNaN(createdAt.getTime())) {
      throw new Error('invalid cursor');
    }
    return { createdAt, id: parsed.id as SourceId };
  } catch {
    throw new ApiHttpError(422, 'INVALID_REQUEST', 'Invalid request', [{ path: '/cursor', keyword: 'format' }]);
  }
}

@ApiTags('sources')
@ApiCookieAuth('contentos_session')
@UseGuards(AuthenticationGuard)
@Controller('v1/content-packages/:packageId/sources')
export class SourceController {
  constructor(@Inject(SOURCE_SERVICE) private readonly sources: SourceService) {}

  @Post()
  @ApiOperation({ summary: 'Capture a Pasted Text Source for an active Content Package' })
  @ApiBody({ schema: createSourceRequestSchema })
  @ApiResponse({ status: 201, schema: sourceResponseSchema })
  @ApiResponse({ status: 400, schema: apiErrorSchema })
  @ApiResponse({ status: 401, schema: apiErrorSchema })
  @ApiResponse({ status: 403, schema: apiErrorSchema })
  @ApiResponse({ status: 404, schema: apiErrorSchema })
  @ApiResponse({ status: 409, schema: apiErrorSchema })
  @ApiResponse({ status: 422, schema: apiErrorSchema })
  @ApiResponse({ status: 500, schema: apiErrorSchema })
  async capture(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') packageId: string,
    @Body() body: unknown,
  ): Promise<SourceResponse> {
    const parsed = parseCreateSourceRequest(body);
    if (!parsed.ok) {
      throw new ApiHttpError(422, 'INVALID_REQUEST', 'Invalid request', parsed.errors);
    }
    const state = await this.sources.capture({
      contentPackageId: requireId(packageId, '/packageId') as ContentPackageId,
      ownerUserId: owner(request),
      sourceType: parsed.value.sourceType,
      role: parsed.value.role,
      label: parsed.value.label ?? null,
      text: parsed.value.text,
    });
    return { data: { source: toResource(state) } };
  }

  @Get()
  @ApiOperation({ summary: 'List Sources for a Content Package using an opaque keyset cursor' })
  @ApiResponse({ status: 200, schema: sourceListResponseSchema })
  @ApiResponse({ status: 401, schema: apiErrorSchema })
  @ApiResponse({ status: 404, schema: apiErrorSchema })
  @ApiResponse({ status: 409, schema: apiErrorSchema })
  @ApiResponse({ status: 422, schema: apiErrorSchema })
  async list(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') packageId: string,
    @Query() query: Record<string, string>,
  ): Promise<SourceListResponse> {
    const parsed = parseSourceListQuery(query);
    if (!parsed.ok) {
      throw new ApiHttpError(422, 'INVALID_REQUEST', 'Invalid request', parsed.errors);
    }
    const after = decodeCursor(parsed.value.cursor);
    const result = await this.sources.list({
      contentPackageId: requireId(packageId, '/packageId') as ContentPackageId,
      ownerUserId: owner(request),
      limit: parsed.value.limit,
      ...(after === undefined ? {} : { after }),
    });
    return {
      data: {
        items: result.items.map((ref): SourceListItemResource => ({
          id: ref.id,
          contentPackageId: ref.contentPackageId,
          sourceType: ref.sourceType,
          role: ref.role,
          label: ref.label,
          captureType: ref.captureType,
          createdAt: ref.createdAt.toISOString(),
        })),
        nextCursor: result.nextPosition ? encodeCursor(result.nextPosition) : null,
      },
    };
  }

  @Get(':sourceId')
  @ApiOperation({ summary: 'Get one Source with head state' })
  @ApiResponse({ status: 200, schema: sourceResponseSchema })
  @ApiResponse({ status: 401, schema: apiErrorSchema })
  @ApiResponse({ status: 404, schema: apiErrorSchema })
  @ApiResponse({ status: 409, schema: apiErrorSchema })
  @ApiResponse({ status: 422, schema: apiErrorSchema })
  async get(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') packageId: string,
    @Param('sourceId') sourceId: string,
  ): Promise<SourceResponse> {
    const pid = requireId(packageId, '/packageId') as ContentPackageId;
    const state = await this.sources.get(requireId(sourceId, '/sourceId') as SourceId, pid, owner(request));
    return { data: { source: toResource(state) } };
  }

  @Get(':sourceId/working-copy')
  @ApiOperation({ summary: 'Get the Normalized Source Working Copy review body' })
  @ApiResponse({ status: 200, schema: sourceWorkingCopyResponseSchema })
  @ApiResponse({ status: 401, schema: apiErrorSchema })
  @ApiResponse({ status: 404, schema: apiErrorSchema })
  @ApiResponse({ status: 409, schema: apiErrorSchema })
  @ApiResponse({ status: 422, schema: apiErrorSchema })
  async getWorkingCopy(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') packageId: string,
    @Param('sourceId') sourceId: string,
  ): Promise<SourceWorkingCopyResponse> {
    const pid = requireId(packageId, '/packageId') as ContentPackageId;
    const result = await this.sources.getWorkingCopy(requireId(sourceId, '/sourceId') as SourceId, pid, owner(request));
    return {
      data: {
        workingCopy: {
          revision: result.workingCopy.revision,
          schemaVersion: result.workingCopy.schemaVersion,
          body: result.workingCopy.body,
          updatedAt: result.workingCopy.updatedAt.toISOString(),
        },
        rawSnapshot: {
          sha256: result.snapshot.sha256,
          byteSize: result.snapshot.byteSize,
          contentType: result.snapshot.contentType,
          capturedAt: result.snapshot.capturedAt.toISOString(),
        },
      },
    };
  }

  @Patch(':sourceId/working-copy')
  @ApiOperation({ summary: 'Edit the Normalized Working Copy body using an expected revision' })
  @ApiBody({ schema: editSourceWorkingCopyRequestSchema })
  @ApiResponse({ status: 200, schema: sourceWorkingCopyResponseSchema })
  @ApiResponse({ status: 400, schema: apiErrorSchema })
  @ApiResponse({ status: 401, schema: apiErrorSchema })
  @ApiResponse({ status: 403, schema: apiErrorSchema })
  @ApiResponse({ status: 404, schema: apiErrorSchema })
  @ApiResponse({ status: 409, schema: apiErrorSchema })
  @ApiResponse({ status: 422, schema: apiErrorSchema })
  async editWorkingCopy(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') packageId: string,
    @Param('sourceId') sourceId: string,
    @Body() body: unknown,
  ): Promise<SourceWorkingCopyResponse> {
    const pid = requireId(packageId, '/packageId') as ContentPackageId;
    const sid = requireId(sourceId, '/sourceId') as SourceId;
    const parsed = parseEditSourceWorkingCopyRequest(body);
    if (!parsed.ok) {
      throw new ApiHttpError(422, 'INVALID_REQUEST', 'Invalid request', parsed.errors);
    }
    const result = await this.sources.editWorkingCopy({
      sourceId: sid,
      contentPackageId: pid,
      ownerUserId: owner(request),
      body: parsed.value.body,
      expectedRevision: parsed.value.expectedRevision,
    });
    return {
      data: {
        workingCopy: {
          revision: result.workingCopy.revision,
          schemaVersion: result.workingCopy.schemaVersion,
          body: result.workingCopy.body,
          updatedAt: result.workingCopy.updatedAt.toISOString(),
        },
        rawSnapshot: {
          sha256: result.snapshot.sha256,
          byteSize: result.snapshot.byteSize,
          contentType: result.snapshot.contentType,
          capturedAt: result.snapshot.capturedAt.toISOString(),
        },
      },
    };
  }

  @Post(':sourceId/versions')
  @ApiOperation({ summary: 'Create an immutable Normalized Source Version from the Working Copy' })
  @ApiBody({ schema: createSourceVersionRequestSchema })
  @ApiResponse({ status: 201, schema: sourceVersionResponseSchema })
  @ApiResponse({ status: 400, schema: apiErrorSchema })
  @ApiResponse({ status: 401, schema: apiErrorSchema })
  @ApiResponse({ status: 403, schema: apiErrorSchema })
  @ApiResponse({ status: 404, schema: apiErrorSchema })
  @ApiResponse({ status: 409, schema: apiErrorSchema })
  @ApiResponse({ status: 422, schema: apiErrorSchema })
  async createVersion(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') packageId: string,
    @Param('sourceId') sourceId: string,
    @Body() body: unknown,
  ): Promise<SourceVersionResponse> {
    const pid = requireId(packageId, '/packageId') as ContentPackageId;
    const parsed = parseCreateSourceVersionRequest(body);
    if (!parsed.ok) {
      throw new ApiHttpError(422, 'INVALID_REQUEST', 'Invalid request', parsed.errors);
    }
    const result = await this.sources.createVersion({
      sourceId: requireId(sourceId, '/sourceId') as SourceId,
      contentPackageId: pid,
      ownerUserId: owner(request),
      expectedRevision: parsed.value.expectedRevision,
    });
    return {
      data: {
        version: {
          id: result.version.id,
          versionNumber: result.version.versionNumber,
          parentVersionId: result.version.parentVersionId,
          contentHash: result.version.contentHash,
          schemaVersion: result.version.schemaVersion,
          rawSnapshotId: result.version.rawSnapshotId,
          createdById: result.version.createdById,
          createdAt: result.version.createdAt.toISOString(),
        },
      },
    };
  }

  @Get(':sourceId/versions')
  @ApiOperation({ summary: 'List immutable Normalized Source Versions' })
  @ApiResponse({ status: 200, schema: sourceVersionListResponseSchema })
  @ApiResponse({ status: 401, schema: apiErrorSchema })
  @ApiResponse({ status: 404, schema: apiErrorSchema })
  @ApiResponse({ status: 409, schema: apiErrorSchema })
  @ApiResponse({ status: 422, schema: apiErrorSchema })
  async listVersions(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') packageId: string,
    @Param('sourceId') sourceId: string,
  ): Promise<SourceVersionListResponse> {
    const pid = requireId(packageId, '/packageId') as ContentPackageId;
    const versions = await this.sources.listVersions(requireId(sourceId, '/sourceId') as SourceId, pid, owner(request));
    return {
      data: {
        items: versions.map((v) => ({
          id: v.id,
          versionNumber: v.versionNumber,
          parentVersionId: v.parentVersionId,
          contentHash: v.contentHash,
          schemaVersion: v.schemaVersion,
          rawSnapshotId: v.rawSnapshotId,
          createdById: v.createdById,
          createdAt: v.createdAt.toISOString(),
        })),
      },
    };
  }

  @Get(':sourceId/versions/:versionId')
  @ApiOperation({ summary: 'Get the exact immutable Version body for human review' })
  @ApiResponse({ status: 200, schema: sourceVersionDetailResponseSchema })
  @ApiResponse({ status: 401, schema: apiErrorSchema })
  @ApiResponse({ status: 404, schema: apiErrorSchema })
  @ApiResponse({ status: 409, schema: apiErrorSchema })
  @ApiResponse({ status: 422, schema: apiErrorSchema })
  async getVersion(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') packageId: string,
    @Param('sourceId') sourceId: string,
    @Param('versionId') versionId: string,
  ): Promise<SourceVersionDetailResponse> {
    const pid = requireId(packageId, '/packageId') as ContentPackageId;
    const version = await this.sources.getVersion(
      requireId(sourceId, '/sourceId') as SourceId,
      requireId(versionId, '/versionId') as SourceVersionId,
      pid,
      owner(request),
    );
    return {
      data: {
        version: {
          id: version.id,
          versionNumber: version.versionNumber,
          parentVersionId: version.parentVersionId,
          body: version.body,
          contentHash: version.contentHash,
          schemaVersion: version.schemaVersion,
          rawSnapshotId: version.rawSnapshotId,
          createdById: version.createdById,
          createdAt: version.createdAt.toISOString(),
        },
      },
    };
  }

  @Post(':sourceId/approval')
  @HttpCode(200)
  @ApiOperation({ summary: 'Approve one exact Normalized Source Version for future Research' })
  @ApiBody({ schema: approveSourceVersionRequestSchema })
  @ApiResponse({ status: 200, schema: sourceApprovalResponseSchema })
  @ApiResponse({ status: 400, schema: apiErrorSchema })
  @ApiResponse({ status: 401, schema: apiErrorSchema })
  @ApiResponse({ status: 403, schema: apiErrorSchema })
  @ApiResponse({ status: 404, schema: apiErrorSchema })
  @ApiResponse({ status: 409, schema: apiErrorSchema })
  @ApiResponse({ status: 422, schema: apiErrorSchema })
  async approve(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') packageId: string,
    @Param('sourceId') sourceId: string,
    @Body() body: unknown,
  ): Promise<SourceApprovalResponse> {
    const pid = requireId(packageId, '/packageId') as ContentPackageId;
    const parsed = parseApproveSourceVersionRequest(body);
    if (!parsed.ok) {
      throw new ApiHttpError(422, 'INVALID_REQUEST', 'Invalid request', parsed.errors);
    }
    const result = await this.sources.approve({
      sourceId: requireId(sourceId, '/sourceId') as SourceId,
      contentPackageId: pid,
      ownerUserId: owner(request),
      versionId: parsed.value.versionId as SourceVersionId,
    });
    const approvedVersionId = result.head.approvedVersionId;
    if (!approvedVersionId) {
      throw new Error('Approval succeeded but head has no approved version');
    }
    return {
      data: {
        approval: {
          id: result.approval.id,
          approvedVersionId: result.approval.approvedVersionId,
          approvedById: result.approval.approvedById,
          approvedAt: result.approval.approvedAt.toISOString(),
          validationSummary: result.approval.validationSummary,
        },
        head: {
          approvedVersionId,
          latestVersionId: result.head.latestVersionId,
          reviewCandidateVersionId: result.head.reviewCandidateVersionId,
        },
      },
    };
  }
}
