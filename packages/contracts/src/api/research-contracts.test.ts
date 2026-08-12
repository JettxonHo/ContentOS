import { describe, expect, it } from 'vitest';

import {
  parseApproveResearchRequest,
  parseEditResearchWorkingCopyRequest,
  parseGenerateResearchRequest,
} from './research-contracts.js';

describe('Research HTTP contracts', () => {
  it('accepts the exact bounded review body', () => {
    expect(
      parseEditResearchWorkingCopyRequest({
        expectedRevision: 2,
        body: {
          summary: 'Reviewed summary',
          items: [
            {
              id: 'item-1',
              kind: 'fact',
              text: 'A supported fact',
              reviewState: 'accepted',
              evidence: [
                {
                  sourceId: '00000000-0000-4000-8000-000000000001',
                  sourceVersionId: '00000000-0000-4000-8000-000000000002',
                  paragraphIndex: 0,
                  snippet: 'Evidence',
                },
              ],
            },
          ],
          openQuestions: [],
        },
      }).ok,
    ).toBe(true);
  });

  it('rejects extra fields, invalid review states, and invalid UUID commands', () => {
    expect(parseGenerateResearchRequest({ requestId: 'not-a-uuid' }).ok).toBe(false);
    expect(parseApproveResearchRequest({ versionId: 'not-a-uuid' }).ok).toBe(false);
    expect(
      parseEditResearchWorkingCopyRequest({
        expectedRevision: 1,
        body: {
          summary: 'Summary',
          items: [{ id: 'item-1', kind: 'fact', text: 'Text', reviewState: 'trusted', evidence: [], extra: true }],
          openQuestions: [],
        },
      }).ok,
    ).toBe(false);
    expect(
      parseEditResearchWorkingCopyRequest({
        expectedRevision: 1,
        body: {
          summary: 'invalid\uD83D',
          items: [{ id: 'item-1', kind: 'fact', text: 'Text', reviewState: 'accepted', evidence: [] }],
          openQuestions: [],
        },
      }).ok,
    ).toBe(false);
  });
});
