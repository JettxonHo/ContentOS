import { describe, expect, it } from 'vitest';
import {
  parseConfirmOpinionRequest,
  parseEditBlogRequest,
  parseGenerateBlogRequest,
  parseInterpretOpinionRequest,
} from './blog-contracts.js';

describe('Opinion and Blog HTTP contracts', () => {
  it('accepts only the bounded fixed command shapes', () => {
    expect(parseInterpretOpinionRequest({ rawResponse: 'Owner position' }).ok).toBe(true);
    expect(parseInterpretOpinionRequest({ rawResponse: 'Owner position', extra: true }).ok).toBe(false);
    expect(parseConfirmOpinionRequest({ expectedRevision: 1, confirmedStatement: 'Confirmed position' }).ok).toBe(true);
    expect(
      parseGenerateBlogRequest({ requestId: '00000000-0000-4000-8000-000000000001', contentMode: 'research_based' }).ok,
    ).toBe(true);
    expect(parseGenerateBlogRequest({ requestId: 'bad', contentMode: 'creator_led' }).ok).toBe(false);
  });

  it('defers the complete Blog body invariant to Core while requiring body and optimistic revision at transport', () => {
    expect(parseEditBlogRequest({ expectedRevision: 1, body: { title: 'Candidate' } }).ok).toBe(true);
    expect(parseEditBlogRequest({ expectedRevision: 0, body: {} }).ok).toBe(false);
  });
});
