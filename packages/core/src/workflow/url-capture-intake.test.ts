import { describe, expect, it } from 'vitest';

import type { UrlCaptureIntake, UrlCaptureIntakeQueryPort } from './url-capture-intake.js';

describe('URL capture intake read seam', () => {
  it('keeps the owner-scoped projection discriminated by its durable state', async () => {
    const port: UrlCaptureIntakeQueryPort = {
      async list() {
        return [
          {
            id: 'request-1',
            sourceReferenceId: 'reference-1',
            role: 'supporting',
            submittedUrl: 'https://example.test/article',
            status: 'failed',
            failure: { category: 'timeout', code: 'TIMEOUT' },
            sourceId: null,
            createdAt: new Date('2026-08-07T00:00:00.000Z'),
            updatedAt: new Date('2026-08-07T00:00:01.000Z'),
          },
        ] satisfies readonly UrlCaptureIntake[];
      },
    };

    const intake = await port.list({ contentPackageId: 'package-1' as never, ownerUserId: 'owner-1' as never });
    expect(intake[0]).toMatchObject({ status: 'failed', sourceId: null, failure: { code: 'TIMEOUT' } });
  });
});
