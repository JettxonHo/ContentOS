import { describe, expect, it } from 'vitest';

import { FetcherCandidateError, defineFetcherCandidate } from './fetcher-candidate.js';

describe('Fetcher Candidate', () => {
  it('returns the fixed normalized-source shape for reviewable text', () => {
    expect(defineFetcherCandidate('A review candidate.')).toEqual({
      schemaVersion: 'source/normalized/v1',
      text: 'A review candidate.',
    });
  });

  it.each([
    ['', 'extraction_failed'],
    [' \n\t ', 'extraction_failed'],
    ['contains\u0000nul', 'extraction_failed'],
    ['a'.repeat(100_001), 'too_large'],
  ] as const)('classifies invalid candidate text as %s', (text, category) => {
    expect(() => defineFetcherCandidate(text)).toThrow(new FetcherCandidateError(category));
  });

  it('accepts an exact 100,000-byte candidate', () => {
    expect(defineFetcherCandidate('a'.repeat(100_000)).text).toHaveLength(100_000);
  });
});
