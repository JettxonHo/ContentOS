import { PASTED_TEXT_MAX_BYTES, SOURCE_SCHEMA_VERSION } from './source-values.js';
import { isWellFormedUnicode } from './source.js';

export type FetcherCandidateFailureCategory = 'extraction_failed' | 'too_large';

/** A stable, Fetcher-facing classification for deterministic Candidate validation. */
export class FetcherCandidateError extends Error {
  constructor(readonly category: FetcherCandidateFailureCategory) {
    super(category);
    this.name = 'FetcherCandidateError';
  }
}

export interface FetcherCandidate {
  readonly schemaVersion: typeof SOURCE_SCHEMA_VERSION;
  readonly text: string;
}

/**
 * Validates the already extracted review text at the Domain boundary.
 * Parser and transport policy deliberately stay outside Core.
 */
export function defineFetcherCandidate(text: string): FetcherCandidate {
  if (typeof text !== 'string' || !isWellFormedUnicode(text) || text.trim().length === 0) {
    throw new FetcherCandidateError('extraction_failed');
  }
  if (Buffer.byteLength(text, 'utf8') > PASTED_TEXT_MAX_BYTES) {
    throw new FetcherCandidateError('too_large');
  }
  return Object.freeze({ schemaVersion: SOURCE_SCHEMA_VERSION, text });
}
