import { Inject, Injectable, SetMetadata } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';

import type { ApiConfig } from '@contentos/config';

import { API_CONFIG } from '../runtime.tokens';
import { ApiHttpError } from './api-http-error';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
export const FETCHER_GATEWAY_SERVICE_TRANSPORT = 'contentos.fetcher-gateway.service-transport' as const;

export function FetcherGatewayServiceTransport(): ClassDecorator & MethodDecorator {
  return SetMetadata(FETCHER_GATEWAY_SERVICE_TRANSPORT, true);
}

@Injectable()
export class TrustedOriginGuard implements CanActivate {
  constructor(
    @Inject(API_CONFIG) private readonly config: ApiConfig,
    @Inject(Reflector) private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    if (SAFE_METHODS.has(request.method)) {
      return true;
    }
    const isFetcherGatewayTransport = this.reflector.getAllAndOverride<boolean>(FETCHER_GATEWAY_SERVICE_TRANSPORT, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isFetcherGatewayTransport === true) {
      return true;
    }
    if (request.headers.origin !== this.config.trustedWebOrigin) {
      throw new ApiHttpError(403, 'ORIGIN_DENIED', 'Request origin is not allowed');
    }
    return true;
  }
}
