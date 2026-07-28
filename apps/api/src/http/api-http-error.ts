import type { ApiErrorCode, ApiErrorResponse } from '@contentos/contracts';

export class ApiHttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: ApiErrorResponse['error']['details'],
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'ApiHttpError';
  }
}
