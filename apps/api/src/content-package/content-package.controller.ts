import { Buffer } from 'node:buffer';

import { Body, Controller, Get, HttpCode, Inject, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  apiErrorSchema,
  archiveContentPackageRequestSchema,
  contentPackageListResponseSchema,
  contentPackageResponseSchema,
  createContentPackageRequestSchema,
  parseArchiveContentPackageRequest,
  parseContentPackageListQuery,
  parseCreateContentPackageRequest,
  parseUpdateContentPackageRequest,
  updateContentPackageRequestSchema,
  type ContentPackageListResponse,
  type ContentPackageResource,
  type ContentPackageResponse,
} from '@contentos/contracts';
import type {
  ContentPackageId,
  ContentPackageListPosition,
  ContentPackageOwnerId,
  ContentPackageService,
  ContentPackageState,
} from '@contentos/core';

import { AuthenticationGuard, type AuthenticatedRequest } from '../auth/authentication.guard';
import { ApiHttpError } from '../http/api-http-error';
import { CONTENT_PACKAGE_SERVICE } from '../runtime.tokens';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireId(value: string): ContentPackageId {
  if (!UUID_PATTERN.test(value)) {
    throw new ApiHttpError(422, 'INVALID_REQUEST', 'Invalid request', [{ path: '/id', keyword: 'format' }]);
  }
  return value as ContentPackageId;
}

function toResource(state: ContentPackageState): ContentPackageResource {
  return {
    id: state.id,
    title: state.title,
    description: state.description,
    contentMode: state.contentMode,
    requestedOutputs: state.requestedOutputs,
    lifecycle: state.lifecycle,
    revision: state.revision,
    createdAt: state.createdAt.toISOString(),
    updatedAt: state.updatedAt.toISOString(),
    archivedAt: state.archivedAt?.toISOString() ?? null,
  };
}

function response(state: ContentPackageState): ContentPackageResponse {
  return { data: { contentPackage: toResource(state) } };
}

function encodeCursor(position: ContentPackageListPosition): string {
  return Buffer.from(JSON.stringify({ v: 1, createdAt: position.createdAt.toISOString(), id: position.id })).toString(
    'base64url',
  );
}

function decodeCursor(value: string | undefined): ContentPackageListPosition | undefined {
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
    return { createdAt, id: parsed.id as ContentPackageId };
  } catch {
    throw new ApiHttpError(422, 'INVALID_REQUEST', 'Invalid request', [{ path: '/cursor', keyword: 'format' }]);
  }
}

function owner(request: AuthenticatedRequest): ContentPackageOwnerId {
  return request.currentSession.principal.userId;
}

@ApiTags('content-packages')
@ApiCookieAuth('contentos_session')
@UseGuards(AuthenticationGuard)
@Controller('v1/content-packages')
export class ContentPackageController {
  constructor(@Inject(CONTENT_PACKAGE_SERVICE) private readonly contentPackages: ContentPackageService) {}

  @Post()
  @ApiOperation({ summary: 'Create an owner-scoped Content Package' })
  @ApiBody({ schema: createContentPackageRequestSchema })
  @ApiResponse({ status: 201, schema: contentPackageResponseSchema })
  @ApiResponse({ status: 401, schema: apiErrorSchema })
  @ApiResponse({ status: 422, schema: apiErrorSchema })
  async create(@Req() request: AuthenticatedRequest, @Body() body: unknown): Promise<ContentPackageResponse> {
    const parsed = parseCreateContentPackageRequest(body);
    if (!parsed.ok) {
      throw new ApiHttpError(422, 'INVALID_REQUEST', 'Invalid request', parsed.errors);
    }
    return response(
      await this.contentPackages.create({
        ownerUserId: owner(request),
        title: parsed.value.title,
        description: parsed.value.description ?? null,
        contentMode: parsed.value.contentMode ?? 'deferred',
        requestedOutputs: parsed.value.requestedOutputs,
      }),
    );
  }

  @Get()
  @ApiOperation({ summary: 'List owner-scoped Content Packages using an opaque keyset cursor' })
  @ApiResponse({ status: 200, schema: contentPackageListResponseSchema })
  @ApiResponse({ status: 401, schema: apiErrorSchema })
  @ApiResponse({ status: 422, schema: apiErrorSchema })
  async list(
    @Req() request: AuthenticatedRequest,
    @Query() query: Record<string, string>,
  ): Promise<ContentPackageListResponse> {
    const parsed = parseContentPackageListQuery(query);
    if (!parsed.ok) {
      throw new ApiHttpError(422, 'INVALID_REQUEST', 'Invalid request', parsed.errors);
    }
    const after = decodeCursor(parsed.value.cursor);
    const result = await this.contentPackages.list({
      ownerUserId: owner(request),
      filter: parsed.value.status,
      limit: parsed.value.limit,
      ...(after === undefined ? {} : { after }),
    });
    return {
      data: {
        items: result.items.map(toResource),
        nextCursor: result.nextPosition ? encodeCursor(result.nextPosition) : null,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one owner-scoped Content Package' })
  @ApiResponse({ status: 200, schema: contentPackageResponseSchema })
  @ApiResponse({ status: 404, schema: apiErrorSchema })
  async get(@Req() request: AuthenticatedRequest, @Param('id') id: string): Promise<ContentPackageResponse> {
    return response(await this.contentPackages.get(requireId(id), owner(request)));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update active Content Package metadata using an expected revision' })
  @ApiBody({ schema: updateContentPackageRequestSchema })
  @ApiResponse({ status: 200, schema: contentPackageResponseSchema })
  @ApiResponse({ status: 404, schema: apiErrorSchema })
  @ApiResponse({ status: 409, schema: apiErrorSchema })
  @ApiResponse({ status: 422, schema: apiErrorSchema })
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<ContentPackageResponse> {
    const parsed = parseUpdateContentPackageRequest(body);
    if (!parsed.ok) {
      throw new ApiHttpError(422, 'INVALID_REQUEST', 'Invalid request', parsed.errors);
    }
    return response(
      await this.contentPackages.updateMetadata({
        id: requireId(id),
        ownerUserId: owner(request),
        ...parsed.value,
      }),
    );
  }

  @Post(':id/archive')
  @HttpCode(200)
  @ApiOperation({ summary: 'Archive an active Content Package using an expected revision' })
  @ApiBody({ schema: archiveContentPackageRequestSchema })
  @ApiResponse({ status: 200, schema: contentPackageResponseSchema })
  @ApiResponse({ status: 404, schema: apiErrorSchema })
  @ApiResponse({ status: 409, schema: apiErrorSchema })
  async archive(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<ContentPackageResponse> {
    const parsed = parseArchiveContentPackageRequest(body);
    if (!parsed.ok) {
      throw new ApiHttpError(422, 'INVALID_REQUEST', 'Invalid request', parsed.errors);
    }
    return response(
      await this.contentPackages.archive({
        id: requireId(id),
        ownerUserId: owner(request),
        expectedRevision: parsed.value.expectedRevision,
      }),
    );
  }
}
