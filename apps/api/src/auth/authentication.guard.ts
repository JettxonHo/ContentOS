import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

import type { ApiConfig } from '@contentos/config';
import type { AuthenticationService, CurrentSession } from '@contentos/core';
import { AuthenticationError } from '@contentos/core';

import { API_CONFIG, AUTHENTICATION_SERVICE } from '../runtime.tokens';
import { ApiHttpError } from '../http/api-http-error';

export interface AuthenticatedRequest extends FastifyRequest {
  currentSession: CurrentSession;
}

function requestCookies(request: FastifyRequest): Record<string, string | undefined> {
  return (request as FastifyRequest & { cookies?: Record<string, string> }).cookies ?? {};
}

export function sessionCredential(request: FastifyRequest, cookieName: string): string | undefined {
  return requestCookies(request)[cookieName];
}

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    @Inject(API_CONFIG) private readonly config: ApiConfig,
    @Inject(AUTHENTICATION_SERVICE) private readonly authentication: AuthenticationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    try {
      const currentSession = await this.authentication.authenticate(
        sessionCredential(request, this.config.sessionCookieName),
      );
      (request as AuthenticatedRequest).currentSession = currentSession;
      return true;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw new ApiHttpError(401, 'UNAUTHENTICATED', 'Authentication required');
      }
      throw error;
    }
  }
}
