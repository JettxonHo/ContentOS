import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();
const blogPrompt = readFileSync(resolve(root, 'docs/quality/evals/blog-external-prompt-v1.md'), 'utf8');
const xhsPrompt = readFileSync(resolve(root, 'docs/quality/evals/xiaohongshu-external-prompt-v1.md'), 'utf8');
const manifest = JSON.parse(
  readFileSync(resolve(root, 'docs/quality/evals/publishing-v0.1-contract.json'), 'utf8'),
) as {
  readonly schemaVersion: string;
  readonly purpose: string;
  readonly foundationSufficiency: readonly string[];
  readonly blog: {
    readonly editableFields: readonly string[];
    readonly bodySectionRange: readonly number[];
    readonly requiredFinalHeading: string;
    readonly researchBasedEnglishFirstPerson: readonly string[];
    readonly researchBasedChineseFirstPerson: readonly string[];
  };
  readonly xiaohongshu: {
    readonly editableFields: readonly string[];
    readonly pageCount: number;
    readonly preservePageOrder: boolean;
    readonly requiredNarrativeRoles: readonly string[];
    readonly researchBasedEnglishFirstPerson: readonly string[];
    readonly researchBasedChineseFirstPerson: readonly string[];
  };
  readonly criticalFailures: readonly string[];
};

const englishFirstPerson = ['I', 'me', 'my', 'mine', 'myself', 'we', 'us', 'our', 'ours', 'ourselves'];

describe('Publishing V0.1 external manual validation contract', () => {
  it('pins Foundation Sufficiency and explicitly has no runtime Provider effect', () => {
    expect(manifest.schemaVersion).toBe('contentos-publishing-manual-eval/v0.1');
    expect(manifest.foundationSufficiency).toEqual([
      'fact_or_claim',
      'why_it_matters',
      'limit_or_tradeoff',
      'actionable_judgment',
    ]);
    expect(manifest.purpose).toContain('no current Fake Provider or product integration effect');
    expect(blogPrompt).toContain('Never pad missing evidence.');
    expect(xhsPrompt).toContain('Never pad.');
  });

  it('limits Blog output to editable fields and a 4–6 functionally distinct section contract', () => {
    expect(manifest.blog).toMatchObject({
      editableFields: ['title', 'summary', 'markdown'],
      bodySectionRange: [4, 6],
      requiredFinalHeading: '## References',
    });
    expect(blogPrompt).toContain('4–6 functionally distinct body `##` sections');
    expect(blogPrompt).toContain('fact or claim → meaning → limit or tradeoff → action');
    expect(blogPrompt).toContain('do not generate, replace, or infer them');
  });

  it('limits Xiaohongshu output to eight existing IDs in Plan order with distinct roles', () => {
    expect(manifest.xiaohongshu.editableFields).toEqual([
      'selectedPlatformTitle',
      'coverTitle',
      'coverSubtitle',
      'pages',
      'caption',
      'cta',
      'hashtags',
    ]);
    expect(manifest.xiaohongshu.pageCount).toBe(8);
    expect(manifest.xiaohongshu.preservePageOrder).toBe(true);
    expect(new Set(manifest.xiaohongshu.requiredNarrativeRoles).size).toBe(8);
    expect(xhsPrompt).toContain('not a Blog split into eight cards');
  });

  it('keeps the exact mode-specific first-person lists synchronized', () => {
    expect(manifest.blog.researchBasedEnglishFirstPerson).toEqual(englishFirstPerson);
    expect(manifest.blog.researchBasedChineseFirstPerson).toEqual(['我', '我们', '咱们', '本人']);
    expect(manifest.xiaohongshu.researchBasedEnglishFirstPerson).toEqual(englishFirstPerson);
    expect(manifest.xiaohongshu.researchBasedChineseFirstPerson).toEqual(['我', '我们']);
    expect(manifest.criticalFailures).toContain('research_based_first_person');
    expect(manifest.criticalFailures).toContain('creator_led_opinion_violation');
  });
});
