import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { apiError } from '@contentos/contracts';
import { AuthenticationError, ContentPackageApplicationError, ContentPackageDomainError } from '@contentos/core';

import { ApiHttpError } from './api-http-error';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const request = host.switchToHttp().getRequest<FastifyRequest>();
    const reply = host.switchToHttp().getResponse<FastifyReply>();
    const correlationId = String(request.id);

    if (exception instanceof ApiHttpError) {
      if (exception.retryAfterSeconds !== undefined) {
        reply.header('retry-after', String(exception.retryAfterSeconds));
      }
      void reply
        .status(exception.status)
        .send(apiError(exception.code, exception.message, correlationId, exception.details));
      return;
    }

    if (exception instanceof AuthenticationError) {
      const code = exception.code === 'INVALID_CREDENTIALS' ? 'INVALID_CREDENTIALS' : 'UNAUTHENTICATED';
      const message = code === 'INVALID_CREDENTIALS' ? 'Invalid credentials' : 'Authentication required';
      void reply.status(401).send(apiError(code, message, correlationId));
      return;
    }

    if (exception instanceof ContentPackageApplicationError) {
      const status = exception.code === 'CONTENT_PACKAGE_NOT_FOUND' ? 404 : 409;
      const message =
        exception.code === 'CONTENT_PACKAGE_NOT_FOUND' ? 'Content Package not found' : 'Revision conflict';
      void reply.status(status).send(apiError(exception.code, message, correlationId));
      return;
    }

    if (exception instanceof ContentPackageDomainError) {
      const status = exception.code === 'INVALID_CONTENT_PACKAGE' ? 422 : 409;
      const code = exception.code === 'INVALID_CONTENT_PACKAGE' ? 'INVALID_REQUEST' : exception.code;
      const message =
        status === 422
          ? 'Invalid request'
          : exception.code === 'REVISION_CONFLICT'
            ? 'Revision conflict'
            : 'Content Package state conflict';
      void reply.status(status).send(apiError(code, message, correlationId));
      return;
    }

    if (exception instanceof HttpException && exception.getStatus() < 500) {
      void reply
        .status(exception.getStatus())
        .send(apiError('INVALID_REQUEST', 'Request could not be processed', correlationId));
      return;
    }

    process.stderr.write(`Unhandled API error (${correlationId}).\n`);
    void reply.status(500).send(apiError('INTERNAL_ERROR', 'Internal server error', correlationId));
  }
}
