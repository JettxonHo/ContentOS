import { Body, Controller, Get, HttpCode, Inject, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';

import {
  apiErrorSchema,
  approveBlogRequestSchema,
  blogResponseSchema,
  checkpointBlogRequestSchema,
  confirmOpinionRequestSchema,
  editBlogRequestSchema,
  generateBlogRequestSchema,
  interpretOpinionRequestSchema,
  opinionResponseSchema,
  parseApproveBlogRequest,
  parseCheckpointBlogRequest,
  parseConfirmOpinionRequest,
  parseEditBlogRequest,
  parseGenerateBlogRequest,
  parseInterpretOpinionRequest,
  type BlogResource,
  type BlogResponse,
  type OpinionResource,
  type OpinionResponse,
} from '@contentos/contracts';
import type {
  BlogService,
  BlogState,
  BlogVersionId,
  ContentPackageId,
  ContentPackageOwnerId,
  OpinionState,
} from '@contentos/core';

import { AuthenticationGuard, type AuthenticatedRequest } from '../auth/authentication.guard';
import { ApiHttpError } from '../http/api-http-error';
import { BLOG_SERVICE } from '../runtime.tokens';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function packageId(value: string): ContentPackageId {
  if (!UUID_PATTERN.test(value)) throw new ApiHttpError(422, 'INVALID_REQUEST', 'Invalid request');
  return value as ContentPackageId;
}
function owner(request: AuthenticatedRequest): ContentPackageOwnerId {
  return request.currentSession.principal.userId;
}
function invalid(errors: readonly { readonly path: string; readonly keyword: string }[]): never {
  throw new ApiHttpError(422, 'INVALID_REQUEST', 'Invalid request', errors);
}
function opinionResource(state: OpinionState): OpinionResource {
  return {
    question: state.question,
    rawResponse: state.rawResponse,
    interpretation: state.interpretation,
    revision: state.revision,
    confirmedVersionId: state.confirmedVersionId,
    confirmedStatement: state.confirmedStatement,
    researchVersionId: state.researchVersionId,
    outdated: state.outdated,
  };
}
function blogResource(state: BlogState): BlogResource {
  return {
    id: state.blogId,
    contentPackageId: state.packageId,
    outdated: state.outdated,
    reviewCandidateOutdated: state.reviewCandidateOutdated,
    workingCopy: state.workingCopy,
    latestVersion: {
      id: state.latestVersion.id,
      versionNumber: state.latestVersion.versionNumber,
      body: state.latestVersion.body,
      researchVersionId: state.latestVersion.researchVersionId,
      opinionVersionId: state.latestVersion.opinionVersionId,
      createdAt: state.latestVersion.createdAt.toISOString(),
    },
    approvedVersionId: state.approvedVersionId,
    approvalValidationSummary: state.approvalValidationSummary,
  };
}

@ApiTags('opinion-blog')
@ApiCookieAuth('contentos_session')
@UseGuards(AuthenticationGuard)
@Controller('v1/content-packages/:packageId')
export class BlogController {
  constructor(@Inject(BLOG_SERVICE) private readonly service: BlogService) {}

  @Get('opinion')
  @ApiResponse({ status: 200, schema: opinionResponseSchema })
  async opinion(@Req() request: AuthenticatedRequest, @Param('packageId') id: string): Promise<OpinionResponse> {
    const state = await this.service.opinion(packageId(id), owner(request));
    return { data: { opinion: state ? opinionResource(state) : null } };
  }

  @Post('opinion/interpretation')
  @HttpCode(201)
  @ApiBody({ schema: interpretOpinionRequestSchema })
  @ApiResponse({ status: 201, schema: opinionResponseSchema })
  async interpret(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') id: string,
    @Body() body: unknown,
  ): Promise<OpinionResponse> {
    const parsed = parseInterpretOpinionRequest(body);
    if (!parsed.ok) invalid(parsed.errors);
    return {
      data: {
        opinion: opinionResource(
          await this.service.interpret({
            packageId: packageId(id),
            ownerId: owner(request),
            rawResponse: parsed.value.rawResponse,
          }),
        ),
      },
    };
  }

  @Post('opinion/confirmation')
  @HttpCode(201)
  @ApiBody({ schema: confirmOpinionRequestSchema })
  @ApiResponse({ status: 201, schema: opinionResponseSchema })
  async confirm(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') id: string,
    @Body() body: unknown,
  ): Promise<OpinionResponse> {
    const parsed = parseConfirmOpinionRequest(body);
    if (!parsed.ok) invalid(parsed.errors);
    return {
      data: {
        opinion: opinionResource(
          await this.service.confirmOpinion({
            packageId: packageId(id),
            ownerId: owner(request),
            expectedRevision: parsed.value.expectedRevision,
            confirmedStatement: parsed.value.confirmedStatement,
          }),
        ),
      },
    };
  }

  @Get('blog')
  @ApiResponse({ status: 200, schema: blogResponseSchema })
  async blog(@Req() request: AuthenticatedRequest, @Param('packageId') id: string): Promise<BlogResponse> {
    return { data: { blog: blogResource(await this.service.blog(packageId(id), owner(request))) } };
  }

  @Post('blog/generations')
  @HttpCode(201)
  @ApiBody({ schema: generateBlogRequestSchema })
  @ApiResponse({ status: 201, schema: blogResponseSchema })
  async generate(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') id: string,
    @Body() body: unknown,
  ): Promise<BlogResponse> {
    const parsed = parseGenerateBlogRequest(body);
    if (!parsed.ok) invalid(parsed.errors);
    return {
      data: {
        blog: blogResource(
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

  @Patch('blog/working-copy')
  @ApiBody({ schema: editBlogRequestSchema })
  @ApiResponse({ status: 200, schema: blogResponseSchema })
  async edit(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') id: string,
    @Body() body: unknown,
  ): Promise<BlogResponse> {
    const parsed = parseEditBlogRequest(body);
    if (!parsed.ok) invalid(parsed.errors);
    return {
      data: {
        blog: blogResource(
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

  @Post('blog/versions')
  @HttpCode(201)
  @ApiBody({ schema: checkpointBlogRequestSchema })
  @ApiResponse({ status: 201, schema: blogResponseSchema })
  async checkpoint(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') id: string,
    @Body() body: unknown,
  ): Promise<BlogResponse> {
    const parsed = parseCheckpointBlogRequest(body);
    if (!parsed.ok) invalid(parsed.errors);
    return {
      data: {
        blog: blogResource(
          await this.service.checkpoint({
            packageId: packageId(id),
            ownerId: owner(request),
            expectedRevision: parsed.value.expectedRevision,
          }),
        ),
      },
    };
  }

  @Post('blog/approval')
  @HttpCode(201)
  @ApiBody({ schema: approveBlogRequestSchema })
  @ApiResponse({ status: 201, schema: blogResponseSchema })
  async approve(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') id: string,
    @Body() body: unknown,
  ): Promise<BlogResponse> {
    const parsed = parseApproveBlogRequest(body);
    if (!parsed.ok) invalid(parsed.errors);
    return {
      data: {
        blog: blogResource(
          await this.service.approve({
            packageId: packageId(id),
            ownerId: owner(request),
            versionId: parsed.value.versionId as BlogVersionId,
          }),
        ),
      },
    };
  }

  @Get('blog/export')
  @ApiOperation({ summary: 'Download the eligible Approved Blog as article.md' })
  @ApiResponse({ status: 200, description: 'Approved Blog Markdown' })
  @ApiResponse({ status: 409, schema: apiErrorSchema })
  async export(
    @Req() request: AuthenticatedRequest,
    @Param('packageId') id: string,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<string> {
    const markdown = await this.service.exportMarkdown(packageId(id), owner(request));
    reply.header('content-type', 'text/markdown; charset=utf-8');
    reply.header('content-disposition', 'attachment; filename="article.md"');
    return markdown;
  }
}
