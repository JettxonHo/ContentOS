import { Body, Controller, HttpCode, Inject, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';

import {
  FETCHER_GATEWAY_CLAIM_HEADER,
  INVALID_GATEWAY_REQUEST,
  isFetcherGatewayBodyAbsent,
  type FetcherGatewayClaimResponse,
  type FetcherGatewayHeartbeatResponse,
} from '@contentos/contracts';
import type { ApiErrorCode } from '@contentos/contracts';
import type { FetcherGatewayService, WorkflowTaskId } from '@contentos/core';

import { ApiHttpError } from '../http/api-http-error.js';
import { FetcherGatewayServiceTransport } from '../http/trusted-origin.guard.js';
import { FETCHER_GATEWAY_SERVICE } from '../runtime.tokens.js';
import { FetcherGatewaySecretGuard, requestHeaderValues } from './fetcher-gateway.guard.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const OPAQUE_CLAIM_PATTERN = /^[A-Za-z0-9_-]{43}$/;

function invalidGatewayRequest(): never {
  throw new ApiHttpError(422, INVALID_GATEWAY_REQUEST as ApiErrorCode, 'Invalid Gateway request');
}

function taskId(value: string): WorkflowTaskId {
  if (!UUID_PATTERN.test(value)) invalidGatewayRequest();
  return value as WorkflowTaskId;
}

function requireNoBody(request: FastifyRequest, body: unknown): void {
  const contentType = requestHeaderValues(request, 'content-type');
  const transferEncoding = requestHeaderValues(request, 'transfer-encoding');
  const contentLength = requestHeaderValues(request, 'content-length');
  const lengthIsZero = contentLength.length === 0 || (contentLength.length === 1 && contentLength[0] === '0');
  if (!isFetcherGatewayBodyAbsent(body) || contentType.length > 0 || transferEncoding.length > 0 || !lengthIsZero) {
    invalidGatewayRequest();
  }
}

function requireSingleClaimHeader(request: FastifyRequest): string {
  const values = requestHeaderValues(request, FETCHER_GATEWAY_CLAIM_HEADER);
  if (values.length !== 1 || !OPAQUE_CLAIM_PATTERN.test(values[0] ?? '')) invalidGatewayRequest();
  return values[0] as string;
}

@ApiExcludeController()
@FetcherGatewayServiceTransport()
@UseGuards(FetcherGatewaySecretGuard)
@Controller('internal/fetcher/tasks')
export class FetcherGatewayController {
  constructor(@Inject(FETCHER_GATEWAY_SERVICE) private readonly gateway: FetcherGatewayService) {}

  @Post(':taskId/claim')
  @HttpCode(200)
  async claim(
    @Req() request: FastifyRequest,
    @Param('taskId') rawTaskId: string,
    @Body() body: unknown,
  ): Promise<FetcherGatewayClaimResponse> {
    requireNoBody(request, body);
    const result = await this.gateway.claim(taskId(rawTaskId));
    return {
      data: {
        taskId: result.taskId,
        taskKind: result.taskKind,
        submittedUrl: result.submittedUrl,
        connectionPolicyVersion: result.connectionPolicyVersion,
        resourcePolicyVersion: result.resourcePolicyVersion,
        attemptNumber: result.attemptNumber,
        leaseExpiresAt: result.leaseExpiresAt.toISOString(),
        claim: result.claim,
      },
    };
  }

  @Post(':taskId/heartbeat')
  @HttpCode(200)
  async heartbeat(
    @Req() request: FastifyRequest,
    @Param('taskId') rawTaskId: string,
    @Body() body: unknown,
  ): Promise<FetcherGatewayHeartbeatResponse> {
    requireNoBody(request, body);
    const claim = requireSingleClaimHeader(request);
    const result = await this.gateway.heartbeat(taskId(rawTaskId), claim);
    return {
      data: {
        taskId: result.taskId,
        attemptNumber: result.attemptNumber,
        leaseExpiresAt: result.leaseExpiresAt.toISOString(),
        renewed: result.renewed,
      },
    };
  }
}
