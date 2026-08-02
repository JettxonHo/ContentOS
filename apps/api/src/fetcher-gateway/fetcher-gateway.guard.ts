import { createHash, timingSafeEqual } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

import type { ApiSecrets } from '@contentos/config';
import { FETCHER_GATEWAY_SECRET_HEADER, FETCHER_GATEWAY_UNAUTHENTICATED } from '@contentos/contracts';
import type { ApiErrorCode } from '@contentos/contracts';

import { ApiHttpError } from '../http/api-http-error.js';
import { API_SECRETS } from '../runtime.tokens.js';

export function requestHeaderValues(request: FastifyRequest, name: string): readonly string[] {
  const values: string[] = [];
  const rawHeaders = request.raw.rawHeaders;
  for (let index = 0; index + 1 < rawHeaders.length; index += 2) {
    if (rawHeaders[index]?.toLowerCase() === name.toLowerCase()) {
      values.push(rawHeaders[index + 1] ?? '');
    }
  }
  if (values.length > 0) return values;
  const header = request.headers[name.toLowerCase()];
  if (typeof header === 'string') return [header];
  if (Array.isArray(header)) return header;
  return [];
}

@Injectable()
export class FetcherGatewaySecretGuard implements CanActivate {
  private readonly expectedDigest: Buffer;

  constructor(@Inject(API_SECRETS) secrets: ApiSecrets) {
    this.expectedDigest = createHash('sha256').update(secrets.fetcherGatewaySecret, 'utf8').digest();
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const values = requestHeaderValues(request, FETCHER_GATEWAY_SECRET_HEADER);
    const candidate = values.length === 1 ? values[0] : '';
    const candidateDigest = createHash('sha256')
      .update(candidate ?? '', 'utf8')
      .digest();
    if (!timingSafeEqual(this.expectedDigest, candidateDigest)) {
      throw new ApiHttpError(
        401,
        FETCHER_GATEWAY_UNAUTHENTICATED as ApiErrorCode,
        'Fetcher Gateway authentication required',
      );
    }
    return true;
  }
}
