import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { apiError } from '@contentos/contracts';
import {
  AuthenticationError,
  ContentPackageApplicationError,
  ContentPackageDomainError,
  SourceApplicationError,
  SourceDomainError,
  UploadQuarantineError,
} from '@contentos/core';

import { ApiHttpError } from './api-http-error';

function ownerToken(request: FastifyRequest): string {
  const candidate = (request as { currentSession?: { principal?: { userId?: unknown } } }).currentSession?.principal
    ?.userId;
  return typeof candidate === 'string' ? candidate : 'unknown';
}

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

    if (exception instanceof SourceApplicationError) {
      const notFound = exception.code === 'SOURCE_NOT_FOUND' || exception.code === 'CONTENT_PACKAGE_NOT_FOUND';
      const infraFailure =
        exception.code === 'SOURCE_CAPTURE_FAILED' ||
        exception.code === 'SOURCE_COMPENSATION_FAILED' ||
        exception.code === 'SOURCE_RECONCILIATION_REQUIRED';
      const bodyInvalid = exception.code === 'SOURCE_BODY_INVALID';
      const status = notFound
        ? 404
        : exception.code === 'SOURCE_VERSION_NOT_FOUND'
          ? 404
          : infraFailure
            ? 500
            : bodyInvalid
              ? 422
              : 409;
      const code = infraFailure
        ? 'INTERNAL_ERROR'
        : bodyInvalid
          ? 'INVALID_REQUEST'
          : exception.code === 'PACKAGE_ARCHIVED'
            ? 'CONTENT_PACKAGE_STATE_CONFLICT'
            : exception.code;
      const message = infraFailure
        ? 'Internal server error'
        : bodyInvalid
          ? 'Invalid request'
          : exception.code === 'SOURCE_NOT_FOUND'
            ? 'Source not found'
            : exception.code === 'CONTENT_PACKAGE_NOT_FOUND'
              ? 'Content Package not found'
              : exception.code === 'PACKAGE_ARCHIVED'
                ? 'Content Package is archived'
                : exception.code === 'SOURCE_REVISION_CONFLICT'
                  ? 'Revision conflict'
                  : exception.code === 'SOURCE_VERSION_NOT_FOUND'
                    ? 'Source version not found'
                    : exception.code === 'SOURCE_VERSION_NOT_ELIGIBLE'
                      ? 'Source version is not eligible for approval'
                      : exception.code === 'SOURCE_ALREADY_APPROVED'
                        ? 'Source version already approved'
                        : exception.code === 'SOURCE_VERSION_ALREADY_EXISTS'
                          ? 'Working Copy revision already has an immutable Version'
                          : 'Source state conflict';
      void reply.status(status).send(apiError(code, message, correlationId));
      return;
    }

    if (exception instanceof SourceDomainError) {
      const status = exception.code === 'INVALID_SOURCE' ? 422 : 409;
      const code = exception.code === 'INVALID_SOURCE' ? 'INVALID_REQUEST' : exception.code;
      const message =
        status === 422
          ? 'Invalid request'
          : exception.code === 'SOURCE_REVISION_CONFLICT'
            ? 'Revision conflict'
            : exception.code === 'SOURCE_ROLE_LIMIT_EXCEEDED'
              ? 'Source role limit exceeded'
              : 'Source state conflict';
      void reply.status(status).send(apiError(code, message, correlationId));
      return;
    }

    if (exception instanceof UploadQuarantineError) {
      // Security Baseline §15 audit category. Safe fields only: no filename
      // text, upload body, path, credential, or object key.
      process.stderr.write(
        `security-audit category=unsafe-upload-denial correlation=${correlationId} owner=${ownerToken(request)} reason=${exception.reason} extension=${exception.safeContext.extensionToken} bytes=${exception.safeContext.byteSize}\n`,
      );
      void reply
        .status(422)
        .send(
          apiError('INVALID_REQUEST', 'Invalid request', correlationId, [{ path: '/file', keyword: exception.reason }]),
        );
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
