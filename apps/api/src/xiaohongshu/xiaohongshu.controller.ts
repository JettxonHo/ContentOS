import { Body, Controller, Get, HttpCode, Inject, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import {
  approveXiaohongshuRequestSchema,
  checkpointXiaohongshuRequestSchema,
  editXiaohongshuRequestSchema,
  generateXiaohongshuRequestSchema,
  parseApproveXiaohongshuRequest,
  parseCheckpointXiaohongshuRequest,
  parseEditXiaohongshuRequest,
  parseGenerateXiaohongshuRequest,
  xiaohongshuResponseSchema,
  type XiaohongshuResource,
  type XiaohongshuResponse,
} from '@contentos/contracts';
import type {
  ContentPackageId,
  ContentPackageOwnerId,
  XiaohongshuService,
  XiaohongshuState,
  XiaohongshuVersionId,
} from '@contentos/core';
import { AuthenticationGuard, type AuthenticatedRequest } from '../auth/authentication.guard';
import { ApiHttpError } from '../http/api-http-error';
import { XIAOHONGSHU_SERVICE } from '../runtime.tokens';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function packageId(value: string): ContentPackageId {
  if (!UUID.test(value)) throw new ApiHttpError(422, 'INVALID_REQUEST', 'Invalid request');
  return value as ContentPackageId;
}
function owner(request: AuthenticatedRequest): ContentPackageOwnerId {
  return request.currentSession.principal.userId;
}
function invalid(): never {
  throw new ApiHttpError(422, 'INVALID_REQUEST', 'Invalid request');
}
function resource(state: XiaohongshuState): XiaohongshuResource {
  return {
    id: state.artifactId,
    contentPackageId: state.packageId,
    outdated: state.outdated,
    reviewCandidateOutdated: state.reviewCandidateOutdated,
    workingCopy: state.workingCopy,
    latestVersion: { ...state.latestVersion, createdAt: state.latestVersion.createdAt.toISOString() },
    approvedVersionId: state.approvedVersionId,
    approvalValidationSummary: state.approvalValidationSummary,
  };
}

@ApiTags('xiaohongshu')
@ApiCookieAuth('contentos_session')
@UseGuards(AuthenticationGuard)
@Controller('v1/content-packages/:packageId/xiaohongshu')
export class XiaohongshuController {
  constructor(@Inject(XIAOHONGSHU_SERVICE) private readonly service: XiaohongshuService) {}
  @Get() @ApiResponse({ status: 200, schema: xiaohongshuResponseSchema }) async state(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') id: string,
  ): Promise<XiaohongshuResponse> {
    return { data: { xiaohongshu: resource(await this.service.state(packageId(id), owner(request))) } };
  }
  @Post('generations') @HttpCode(201) @ApiBody({ schema: generateXiaohongshuRequestSchema }) async generate(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') id: string,
    @Body() body: unknown,
  ): Promise<XiaohongshuResponse> {
    const parsed = parseGenerateXiaohongshuRequest(body);
    if (!parsed.ok) invalid();
    return {
      data: {
        xiaohongshu: resource(
          await this.service.generate({
            packageId: packageId(id),
            ownerId: owner(request),
            requestId: parsed.value.requestId,
            contentMode: parsed.value.contentMode,
          }),
        ),
      },
    };
  }
  @Patch('working-copy') @ApiBody({ schema: editXiaohongshuRequestSchema }) async edit(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') id: string,
    @Body() body: unknown,
  ): Promise<XiaohongshuResponse> {
    const parsed = parseEditXiaohongshuRequest(body);
    if (!parsed.ok) invalid();
    return {
      data: {
        xiaohongshu: resource(
          await this.service.update({
            packageId: packageId(id),
            ownerId: owner(request),
            expectedRevision: parsed.value.expectedRevision,
            body: parsed.value.body,
          }),
        ),
      },
    };
  }
  @Post('versions') @HttpCode(201) @ApiBody({ schema: checkpointXiaohongshuRequestSchema }) async checkpoint(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') id: string,
    @Body() body: unknown,
  ): Promise<XiaohongshuResponse> {
    const parsed = parseCheckpointXiaohongshuRequest(body);
    if (!parsed.ok) invalid();
    return {
      data: {
        xiaohongshu: resource(
          await this.service.checkpoint({
            packageId: packageId(id),
            ownerId: owner(request),
            expectedRevision: parsed.value.expectedRevision,
          }),
        ),
      },
    };
  }
  @Post('approval') @HttpCode(201) @ApiBody({ schema: approveXiaohongshuRequestSchema }) async approve(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') id: string,
    @Body() body: unknown,
  ): Promise<XiaohongshuResponse> {
    const parsed = parseApproveXiaohongshuRequest(body);
    if (!parsed.ok) invalid();
    return {
      data: {
        xiaohongshu: resource(
          await this.service.approve({
            packageId: packageId(id),
            ownerId: owner(request),
            versionId: parsed.value.versionId as XiaohongshuVersionId,
          }),
        ),
      },
    };
  }
  @Get('export/post')
  async exportPost(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') id: string,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<string> {
    const result = await this.service.exportMarkdown(packageId(id), owner(request));
    reply.header('content-type', 'text/markdown; charset=utf-8');
    reply.header('content-disposition', 'attachment; filename="post.md"');
    return result;
  }
  @Get('export/pages')
  async exportPages(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') id: string,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<string> {
    const result = await this.service.exportJson(packageId(id), owner(request));
    reply.header('content-type', 'application/json; charset=utf-8');
    reply.header('content-disposition', 'attachment; filename="pages.json"');
    return result;
  }
}
