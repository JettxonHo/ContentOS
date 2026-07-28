import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

import type { ApiConfig } from '@contentos/config';

import { API_CONFIG } from '../runtime.tokens';
import { ApiHttpError } from './api-http-error';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class TrustedOriginGuard implements CanActivate {
  constructor(@Inject(API_CONFIG) private readonly config: ApiConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    if (SAFE_METHODS.has(request.method)) {
      return true;
    }
    if (request.headers.origin !== this.config.trustedWebOrigin) {
      throw new ApiHttpError(403, 'ORIGIN_DENIED', 'Request origin is not allowed');
    }
    return true;
  }
}
