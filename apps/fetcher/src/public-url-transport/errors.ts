export const FETCH_FAILURE_CATEGORIES = [
  'validation_blocked',
  'redirect_blocked',
  'unsupported_content',
  'too_large',
  'timeout',
  'fetch_failed',
] as const;

export type FetchFailureCategory = (typeof FETCH_FAILURE_CATEGORIES)[number];

export const FETCH_FAILURE_CODES = {
  validation_blocked: 'VALIDATION_BLOCKED',
  redirect_blocked: 'REDIRECT_BLOCKED',
  unsupported_content: 'UNSUPPORTED_CONTENT',
  too_large: 'TOO_LARGE',
  timeout: 'TIMEOUT',
  fetch_failed: 'FETCH_FAILED',
} as const;

export type FetchFailureCode = (typeof FETCH_FAILURE_CODES)[FetchFailureCategory];

/** A redacted Fetcher-private failure that is safe to map at the Gateway boundary. */
export class PublicUrlTransportError extends Error {
  readonly code: FetchFailureCode;

  constructor(readonly category: FetchFailureCategory) {
    super(FETCH_FAILURE_CODES[category]);
    this.code = FETCH_FAILURE_CODES[category];
    this.name = 'PublicUrlTransportError';
  }
}
