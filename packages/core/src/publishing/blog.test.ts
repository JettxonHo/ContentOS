import { describe, expect, it, vi } from 'vitest';

import {
  BlogError,
  BlogService,
  FakeBlogProvider,
  blogBoundToFoundation,
  validateBlog,
  validateBlogBody,
  type ApprovedBlogFoundation,
  type BlogRepository,
} from './blog.js';

const foundation: ApprovedBlogFoundation = {
  researchVersionId: '00000000-0000-4000-8000-000000000001' as never,
  researchBody: {
    summary: 'Evidence summary',
    items: [
      {
        id: 'item-1',
        kind: 'claim',
        text: 'Supported claim',
        reviewState: 'accepted',
        evidence: [
          {
            sourceId: '00000000-0000-4000-8000-000000000002' as never,
            sourceVersionId: '00000000-0000-4000-8000-000000000003' as never,
            paragraphIndex: 0,
            snippet: 'Supported claim',
          },
        ],
      },
    ],
    openQuestions: [],
  },
  sourceInputs: [{ sourceVersionId: '00000000-0000-4000-8000-000000000003', label: 'Primary source' }],
  opinionVersionId: '00000000-0000-4000-8000-000000000004' as never,
  confirmedOpinion: 'Readers should apply the evidence carefully.',
};

describe('Human Opinion and Blog v1', () => {
  it('generates deterministic Creator-led Markdown bound to exact Research and Opinion Versions', async () => {
    const provider = new FakeBlogProvider();
    const first = await provider.generate(foundation, 'creator_led');
    expect(await provider.generate(foundation, 'creator_led')).toBe(first);
    const body = validateBlogBody(JSON.parse(first));
    expect(body.markdown).toContain('## Creator perspective');
    expect(body.internalProvenance[0]).toEqual({
      researchItemId: 'item-1',
      sourceVersionIds: ['00000000-0000-4000-8000-000000000003'],
      opinionVersionId: foundation.opinionVersionId,
    });
    expect(validateBlog(body)).toMatchObject({ result: 'passed', contentMode: 'creator_led' });
    expect(blogBoundToFoundation(body, foundation)).toBe(true);
  });

  it('records malformed or unbound Provider output as a failed run without creating a Blog Version', async () => {
    const recordFailedBlog = vi.fn(async () => undefined);
    const createBlog = vi.fn();
    const repository: BlogRepository = {
      requireActivePackage: async () => undefined,
      foundation: async () => foundation,
      opinion: async () => null,
      saveOpinionDraft: vi.fn(),
      confirmOpinion: vi.fn(),
      blog: async () => null,
      recordFailedBlog,
      createBlog,
      updateBlog: vi.fn(),
      checkpointBlog: vi.fn(),
      approveBlog: vi.fn(),
    };
    const valid = validateBlogBody(JSON.parse(await new FakeBlogProvider().generate(foundation, 'research_based')));
    const service = new BlogService(
      repository,
      {
        alias: 'unbound-test',
        generate: async () =>
          JSON.stringify({
            ...valid,
            publicReferences: [
              { ...valid.publicReferences[0]!, sourceVersionId: '00000000-0000-4000-8000-000000000099' },
            ],
          }),
      },
      {
        blog: () => '' as never,
        blogVersion: () => '' as never,
        blogWorkingCopy: () => '' as never,
        blogApproval: () => '' as never,
        blogRun: () => 'run' as never,
        opinion: () => '' as never,
        opinionVersion: () => '' as never,
      },
      { now: () => new Date('2026-08-13T00:00:00.000Z') },
    );
    await expect(
      service.generate({
        packageId: '00000000-0000-4000-8000-000000000010' as never,
        ownerId: '00000000-0000-4000-8000-000000000011' as never,
        requestId: 'request',
        contentMode: 'research_based',
      }),
    ).rejects.toMatchObject({ code: 'BLOG_PROVIDER_OUTPUT_INVALID' });
    expect(recordFailedBlog).toHaveBeenCalledWith(
      expect.objectContaining({ providerAlias: 'unbound-test', runId: 'run' }),
    );
    expect(createBlog).not.toHaveBeenCalled();
  });

  it('generates a Research-based article without fabricated first-person language', async () => {
    const body = validateBlogBody(JSON.parse(await new FakeBlogProvider().generate(foundation, 'research_based')));
    expect(body.markdown).not.toMatch(/\b(?:I|me|my|we|us|our)\b/i);
    expect(body.internalProvenance.every((entry) => entry.opinionVersionId === null)).toBe(true);

    for (const fabricated of ['我认为这值得尝试。', '我们亲自验证了这个结论。', '咱们都知道答案。', '本人推荐照做。']) {
      expect(() =>
        validateBlogBody({ ...body, markdown: `# Title\n\n${fabricated}\n\n## References\n\n- Source` }),
      ).toThrow('INVALID_BLOG');
    }
  });

  it('fails closed on direct-quote syntax until exact Evidence quote binding exists', async () => {
    const body = validateBlogBody(JSON.parse(await new FakeBlogProvider().generate(foundation, 'research_based')));
    for (const quoted of [
      '# Title\n\n> Supported claim\n\n## References\n\n- Source',
      '# Title\n\n“Supported claim”\n\n## References\n\n- Source',
      '# Title\n\n‘Supported claim’\n\n## References\n\n- Source',
      '# Title\n\n「Supported claim」\n\n## References\n\n- Source',
      '# Title\n\n『Supported claim』\n\n## References\n\n- Source',
      '# Title\n\n"Supported claim"\n\n## References\n\n- Source',
      '# Title\n\n<blockquote>Supported claim</blockquote>\n\n## References\n\n- Source',
    ]) {
      expect(() => validateBlogBody({ ...body, markdown: quoted })).toThrow('INVALID_BLOG');
    }
  });

  it('rejects unknown fields, lone surrogates, and creator content without Opinion provenance', () => {
    const valid = validateBlogBody(
      JSON.parse(
        JSON.stringify({
          title: 'Title',
          summary: 'Summary',
          markdown: '# Title\n\nBody\n\n## References\n\n- Source',
          contentMode: 'creator_led',
          publicReferences: [{ label: 'Source', sourceVersionId: '00000000-0000-4000-8000-000000000003' }],
          internalProvenance: [
            {
              researchItemId: 'item-1',
              sourceVersionIds: ['00000000-0000-4000-8000-000000000003'],
              opinionVersionId: foundation.opinionVersionId,
            },
          ],
        }),
      ),
    );
    expect(() => validateBlogBody({ ...valid, extra: true })).toThrow(BlogError);
    expect(() => validateBlogBody({ ...valid, title: 'invalid\uD83D' })).toThrow('INVALID_BLOG');
    expect(() =>
      validateBlogBody({ ...valid, internalProvenance: [{ ...valid.internalProvenance[0]!, opinionVersionId: null }] }),
    ).toThrow('INVALID_BLOG');
  });
});
