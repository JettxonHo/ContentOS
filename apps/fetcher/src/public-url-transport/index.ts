import { createProductionTransport } from './transport.js';

export type { FetchFailureCategory, FetchFailureCode } from './errors.js';
export { PublicUrlTransportError } from './errors.js';

export interface CaptureBudget {
  readonly startedAtMonotonicMs: number;
  readonly absoluteDeadlineMonotonicMs: number;
  readonly signal: AbortSignal;
  remainingMs(): number;
}

export interface VerifiedFetchResponse {
  readonly budget: CaptureBudget;
  readonly finalUrl: string;
  readonly redirects: readonly { readonly status: 301 | 302 | 303 | 307 | 308; readonly url: string }[];
  readonly responseStatus: 200;
  readonly contentType: 'text/html' | 'text/plain' | 'text/markdown';
  readonly declaredCharset: string | null;
  readonly contentEncoding: 'identity' | 'gzip' | 'deflate' | 'br';
  consume(sinks: {
    onEncoded(chunk: Uint8Array): Promise<void>;
    onDecoded(chunk: Uint8Array): Promise<void>;
  }): Promise<{ encodedByteSize: number; decodedByteSize: number }>;
  dispose(): void;
}

export interface PublicUrlTransport {
  fetch(submittedUrl: string): Promise<VerifiedFetchResponse>;
}

export function createPublicUrlTransport(): PublicUrlTransport {
  return createProductionTransport();
}
