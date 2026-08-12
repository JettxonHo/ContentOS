import { describe, expect, it, vi } from 'vitest';

import {
  FakeResearchProvider,
  ResearchError,
  ResearchService,
  createResearchValidationSummary,
  researchApprovalEligible,
  researchEvidenceBoundToSources,
  researchReviewShapePreserved,
  validateResearchBody,
  type ApprovedResearchSource,
  type ResearchRepository,
} from './research.js';

const sources: readonly ApprovedResearchSource[] = [
  {
    sourceId: '00000000-0000-4000-8000-000000000001' as never,
    sourceVersionId: '00000000-0000-4000-8000-000000000002' as never,
    role: 'primary',
    label: 'Primary',
    text: 'First supported paragraph.\n\nSecond paragraph.',
  },
];

describe('Research v1', () => {
  it('produces deterministic reviewable Fake Provider output with exact evidence', async () => {
    const provider = new FakeResearchProvider();
    const first = await provider.generate(sources);
    const second = await provider.generate(sources);

    expect(second).toBe(first);
    expect(validateResearchBody(JSON.parse(first))).toMatchObject({
      items: [
        {
          id: 'item-1',
          reviewState: 'unreviewed',
          evidence: [
            {
              sourceId: sources[0]?.sourceId,
              sourceVersionId: sources[0]?.sourceVersionId,
              paragraphIndex: 0,
            },
          ],
        },
      ],
    });
  });

  it('truncates Fake Provider text by Unicode code point and rejects lone surrogates', async () => {
    const unicodeSources: readonly ApprovedResearchSource[] = [
      { ...sources[0]!, text: `${'a'.repeat(499)}😀supported tail` },
    ];
    const body = validateResearchBody(JSON.parse(await new FakeResearchProvider().generate(unicodeSources)));
    expect(Array.from(body.items[0]!.text)).toHaveLength(500);
    expect(body.items[0]!.text.endsWith('😀')).toBe(true);
    expect(() => validateResearchBody({ ...body, summary: 'invalid\uD83D' })).toThrow('INVALID_RESEARCH');
  });

  it('requires every item to be reviewed and one evidence-backed usable item before approval', () => {
    const generated = validateResearchBody({
      summary: 'Summary',
      items: [
        {
          id: 'item-1',
          kind: 'claim',
          text: 'Claim',
          reviewState: 'unreviewed',
          evidence: [],
        },
      ],
      openQuestions: [],
    });
    expect(researchApprovalEligible(generated)).toBe(false);
    const reviewed = {
      ...generated,
      items: [
        {
          ...generated.items[0]!,
          reviewState: 'corrected' as const,
          evidence: [
            {
              sourceId: sources[0]!.sourceId,
              sourceVersionId: sources[0]!.sourceVersionId,
              paragraphIndex: 0,
              snippet: 'Evidence',
            },
          ],
        },
      ],
    };
    expect(researchApprovalEligible(reviewed)).toBe(true);
    expect(createResearchValidationSummary(reviewed, sources)).toEqual({
      schemaVersion: 'research-validation/v1',
      result: 'passed',
      reviewedItemCount: 1,
      usableEvidenceBackedItemCount: 1,
      sourceInputCount: 1,
      warningAcknowledgements: [],
    });
  });

  it('rejects unknown fields and duplicate item identities', () => {
    expect(() =>
      validateResearchBody({
        summary: 'Summary',
        items: [
          { id: 'same', kind: 'fact', text: 'One', reviewState: 'excluded', evidence: [] },
          { id: 'same', kind: 'fact', text: 'Two', reviewState: 'excluded', evidence: [] },
        ],
        openQuestions: [],
      }),
    ).toThrowError(ResearchError);
    expect(() => validateResearchBody({ summary: 'Summary', items: [], openQuestions: [], extra: true })).toThrow(
      'INVALID_RESEARCH',
    );
  });

  it('keeps item identity, kind, and generated evidence immutable during direct review', async () => {
    const body = validateResearchBody(JSON.parse(await new FakeResearchProvider().generate(sources)));
    expect(
      researchReviewShapePreserved(body, {
        ...body,
        summary: 'Owner summary',
        items: body.items.map((item) => ({ ...item, text: 'Owner correction', reviewState: 'corrected' as const })),
      }),
    ).toBe(true);
    expect(
      researchReviewShapePreserved(body, {
        ...body,
        items: body.items.map((item) => ({ ...item, evidence: [{ ...item.evidence[0]!, snippet: 'fabricated' }] })),
      }),
    ).toBe(false);
    expect(researchEvidenceBoundToSources(body, sources)).toBe(true);
    expect(
      researchEvidenceBoundToSources(
        {
          ...body,
          items: body.items.map((item) => ({
            ...item,
            evidence: [{ ...item.evidence[0]!, sourceVersionId: '00000000-0000-4000-8000-000000000099' as never }],
          })),
        },
        sources,
      ),
    ).toBe(false);
  });

  it('records malformed Provider output as a failed run without creating a Version', async () => {
    const recordFailedGeneration = vi.fn(async () => undefined);
    const createGenerated = vi.fn();
    const repository: ResearchRepository = {
      approvedSources: async () => sources,
      isPackageOwned: async () => true,
      isPackageActive: async () => true,
      find: async () => null,
      createGenerated,
      recordFailedGeneration,
      updateWorkingCopy: vi.fn(),
      checkpoint: vi.fn(),
      approve: vi.fn(),
    };
    const service = new ResearchService(
      repository,
      { alias: 'malformed-test', generate: async () => '' },
      {
        generateResearchId: () => 'research' as never,
        generateWorkingCopyId: () => 'working-copy' as never,
        generateVersionId: () => 'version' as never,
        generateApprovalId: () => 'approval' as never,
        generateRunId: () => 'run' as never,
      },
      { now: () => new Date('2026-08-13T00:00:00.000Z') },
    );

    await expect(
      service.generate({
        packageId: '00000000-0000-4000-8000-000000000010' as never,
        ownerUserId: '00000000-0000-4000-8000-000000000011' as never,
        requestId: 'request-1',
      }),
    ).rejects.toMatchObject({ code: 'RESEARCH_PROVIDER_OUTPUT_INVALID' });
    expect(recordFailedGeneration).toHaveBeenCalledWith(
      expect.objectContaining({ providerAlias: 'malformed-test', rawOutput: '', sources }),
    );
    expect(createGenerated).not.toHaveBeenCalled();
  });
});
