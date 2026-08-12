import { describe, expect, it } from 'vitest';
import {
  FakePackagingProvider,
  validatePackagingPlan,
  validateXiaohongshu,
  validateXiaohongshuBody,
  xiaohongshuBoundToFoundation,
} from './xiaohongshu.js';
import type { ApprovedBlogFoundation } from './blog.js';

const foundation: ApprovedBlogFoundation = {
  researchVersionId: 'research' as never,
  researchBody: {
    summary: 'Summary',
    items: [
      {
        id: 'claim-1',
        kind: 'claim',
        text: 'Verified evidence supports a practical conclusion.',
        reviewState: 'accepted',
        evidence: [
          {
            sourceId: 'source' as never,
            sourceVersionId: 'source-version' as never,
            paragraphIndex: 0,
            snippet: 'Verified evidence',
          },
        ],
      },
    ],
    openQuestions: [],
  },
  sourceInputs: [{ sourceVersionId: 'source-version', label: 'Primary' }],
  opinionVersionId: 'opinion-version' as never,
  confirmedOpinion: 'I recommend applying only verified evidence.',
};

describe('Xiaohongshu v1', () => {
  it('produces a deterministic independent eight-page Creator-led Artifact', async () => {
    const provider = new FakePackagingProvider();
    const first = await provider.generate(foundation, 'creator_led');
    expect(await provider.generate(foundation, 'creator_led')).toBe(first);
    const parsed = JSON.parse(first) as { plan: unknown; body: unknown };
    const plan = validatePackagingPlan(parsed.plan);
    const body = validateXiaohongshuBody(parsed.body);
    expect(plan.pages).toHaveLength(8);
    expect(body.pages).toHaveLength(8);
    expect(body.pages[4]!.content).toContain(foundation.confirmedOpinion!);
    expect(validateXiaohongshu(body, plan).result).toBe('passed');
  });

  it('keeps Research-based content free of Opinion provenance and first-person claims', async () => {
    const parsed = JSON.parse(await new FakePackagingProvider().generate(foundation, 'research_based')) as {
      plan: unknown;
      body: unknown;
    };
    const body = validateXiaohongshuBody(parsed.body);
    expect(body.pages.every((page) => page.opinionVersionId === null)).toBe(true);
    expect(JSON.stringify(body)).not.toMatch(/\b(?:I|me|my|we|us|our)\b/i);
    expect(() =>
      validateXiaohongshuBody({
        ...body,
        pages: body.pages.map((page, index) => (index === 0 ? { ...page, content: '我认为这值得尝试。' } : page)),
      }),
    ).toThrow('INVALID_BLOG');
  });

  it('rejects duplicate page identity and a selected title outside the candidates', async () => {
    const parsed = JSON.parse(await new FakePackagingProvider().generate(foundation, 'creator_led')) as {
      plan: unknown;
      body: Record<string, unknown>;
    };
    const body = validateXiaohongshuBody(parsed.body);
    expect(() => validateXiaohongshuBody({ ...body, selectedPlatformTitle: 'Other' })).toThrow('INVALID_BLOG');
    expect(() =>
      validateXiaohongshuBody({ ...body, pages: body.pages.map((page) => ({ ...page, id: 'same' })) }),
    ).toThrow('INVALID_BLOG');
  });

  it('rejects duplicate or overloaded pages and a caption that repeats a page', async () => {
    const parsed = JSON.parse(await new FakePackagingProvider().generate(foundation, 'creator_led')) as {
      plan: unknown;
      body: unknown;
    };
    const plan = validatePackagingPlan(parsed.plan);
    const body = validateXiaohongshuBody(parsed.body);
    expect(() =>
      validateXiaohongshu(
        { ...body, pages: body.pages.map((page) => ({ ...page, content: body.pages[0]!.content })) },
        plan,
      ),
    ).toThrow('INVALID_BLOG');
    expect(() =>
      validateXiaohongshu(
        {
          ...body,
          pages: body.pages.map((page, index) =>
            index === 0 ? { ...page, density: 'low' as const, content: 'x'.repeat(401) } : page,
          ),
        },
        plan,
      ),
    ).toThrow('INVALID_BLOG');
    expect(() => validateXiaohongshu({ ...body, caption: `Caption ${body.pages[0]!.content}` }, plan)).toThrow(
      'INVALID_BLOG',
    );
  });

  it('binds body and plan provenance to the exact eligible foundation', async () => {
    const parsed = JSON.parse(await new FakePackagingProvider().generate(foundation, 'creator_led')) as {
      plan: unknown;
      body: unknown;
    };
    const plan = validatePackagingPlan(parsed.plan);
    const body = validateXiaohongshuBody(parsed.body);
    expect(xiaohongshuBoundToFoundation(body, plan, foundation)).toBe(true);
    expect(
      xiaohongshuBoundToFoundation(
        {
          ...body,
          pages: body.pages.map((page, index) => (index === 0 ? { ...page, researchItemIds: ['bogus'] } : page)),
        },
        plan,
        foundation,
      ),
    ).toBe(false);
    expect(
      xiaohongshuBoundToFoundation(
        body,
        {
          ...plan,
          pages: plan.pages.map((page, index) =>
            index === 0 ? { ...page, opinionVersionId: 'bogus' as never } : page,
          ),
        },
        foundation,
      ),
    ).toBe(false);
  });

  it('uses corrected Research and safely condenses valid long inputs to page density', async () => {
    const correctedFoundation: ApprovedBlogFoundation = {
      ...foundation,
      researchBody: {
        ...foundation.researchBody,
        items: foundation.researchBody.items.map((item) => ({
          ...item,
          reviewState: 'corrected' as const,
          text: 'R'.repeat(2_000),
          evidence: item.evidence.map((entry) => ({ ...entry, snippet: 'E'.repeat(1_200) })),
        })),
      },
      confirmedOpinion: 'O'.repeat(2_000),
    };
    const parsed = JSON.parse(await new FakePackagingProvider().generate(correctedFoundation, 'creator_led')) as {
      plan: unknown;
      body: unknown;
    };
    const plan = validatePackagingPlan(parsed.plan);
    const body = validateXiaohongshuBody(parsed.body);
    expect(body.pages.every((page) => Buffer.byteLength(page.content) <= 800)).toBe(true);
    expect(xiaohongshuBoundToFoundation(body, plan, correctedFoundation)).toBe(true);
    expect(validateXiaohongshu(body, plan).result).toBe('passed');
  });
});
