import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';

import type { ApiConfig } from '@contentos/config';
import {
  apiErrorSchema,
  authLoginRequestSchema,
  authSessionResponseSchema,
  parseAuthLoginRequest,
  type AuthSessionResponse,
} from '@contentos/contracts';
import type { AuthenticationService } from '@contentos/core';
import { AuthenticationError } from '@contentos/core';

import { API_CONFIG, AUTHENTICATION_SERVICE } from '../runtime.tokens';
import { ApiHttpError } from '../http/api-http-error';
import { AuthenticationGuard, type AuthenticatedRequest, sessionCredential } from './authentication.guard';
import { LoginAttemptLimiter } from './login-attempt-limiter';

@ApiTags('authentication')
@Controller('v1/auth')
export class AuthController {
  constructor(
    @Inject(API_CONFIG) private readonly config: ApiConfig,
    @Inject(AUTHENTICATION_SERVICE) private readonly authentication: AuthenticationService,
    @Inject(LoginAttemptLimiter) private readonly limiter: LoginAttemptLimiter,
  ) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Create an expiring single-user server-side session' })
  @ApiBody({
    schema: authLoginRequestSchema,
  })
  @ApiResponse({ status: 200, description: 'Authenticated owner session', schema: authSessionResponseSchema })
  @ApiResponse({ status: 403, description: 'Request origin denied', schema: apiErrorSchema })
  @ApiResponse({ status: 401, description: 'Invalid credentials', schema: apiErrorSchema })
  @ApiResponse({ status: 422, description: 'Invalid request', schema: apiErrorSchema })
  @ApiResponse({ status: 429, description: 'Login attempt limit reached', schema: apiErrorSchema })
  async login(
    @Body() body: unknown,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthSessionResponse> {
    const parsed = parseAuthLoginRequest(body);
    if (!parsed.ok) {
      throw new ApiHttpError(422, 'INVALID_REQUEST', 'Invalid request', parsed.errors);
    }

    const decision = this.limiter.check(request.ip);
    if (!decision.allowed) {
      throw new ApiHttpError(429, 'RATE_LIMITED', 'Too many login attempts', undefined, decision.retryAfterSeconds);
    }

    try {
      const session = await this.authentication.login(parsed.value.password);
      this.limiter.reset(request.ip);
      reply.setCookie(this.config.sessionCookieName, session.rawCredential, {
        expires: session.expiresAt,
        httpOnly: true,
        path: '/',
        sameSite: 'strict',
        secure: this.config.secureCookies,
      });
      return {
        data: {
          principal: session.principal,
          expiresAt: session.expiresAt.toISOString(),
        },
      };
    } catch (error) {
      if (error instanceof AuthenticationError && error.code === 'INVALID_CREDENTIALS') {
        this.limiter.recordFailure(request.ip);
        throw new ApiHttpError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
      }
      throw error;
    }
  }

  @Get('session')
  @UseGuards(AuthenticationGuard)
  @ApiCookieAuth('contentos_session')
  @ApiOperation({ summary: 'Inspect the current authenticated Session' })
  @ApiResponse({ status: 200, description: 'Current owner Session', schema: authSessionResponseSchema })
  @ApiResponse({ status: 401, description: 'Authentication required', schema: apiErrorSchema })
  session(@Req() request: AuthenticatedRequest): AuthSessionResponse {
    return {
      data: {
        principal: request.currentSession.principal,
        expiresAt: request.currentSession.expiresAt.toISOString(),
      },
    };
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(AuthenticationGuard)
  @ApiCookieAuth('contentos_session')
  @ApiOperation({ summary: 'Revoke the current server-side Session' })
  @ApiResponse({ status: 204, description: 'Session revoked' })
  @ApiResponse({ status: 403, description: 'Request origin denied', schema: apiErrorSchema })
  @ApiResponse({ status: 401, description: 'Authentication required', schema: apiErrorSchema })
  async logout(@Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply): Promise<void> {
    const credential = sessionCredential(request, this.config.sessionCookieName);
    if (!credential) {
      throw new ApiHttpError(401, 'UNAUTHENTICATED', 'Authentication required');
    }
    await this.authentication.logout(credential);
    reply.clearCookie(this.config.sessionCookieName, {
      httpOnly: true,
      path: '/',
      sameSite: 'strict',
      secure: this.config.secureCookies,
    });
  }
}
