import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';
import type { BlogResource, OpinionResource, ResearchResource, XiaohongshuResource } from '@contentos/contracts';

import { composeExec } from './compose.js';
import { requireState, type SmokeState } from './env.js';

const OWNER = '00000000-0000-4000-8000-000000000005';

async function session(state: SmokeState, ownerId = OWNER): Promise<string> {
  const raw = randomBytes(32).toString('base64url');
  const hash = createHash('sha256').update(raw).digest('hex');
  const result = await composeExec(state, 'postgres', [
    'sh',
    '-c',
    `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -tAc "INSERT INTO auth_sessions (id, credential_hash, owner_user_id, created_at, expires_at) VALUES ('${randomUUID()}', '${hash}', '${ownerId}', now(), now() + interval '1 hour')"`,
  ]);
  expect(result.ok).toBe(true);
  return `contentos_session=${raw}`;
}
const headers = (state: SmokeState, cookie: string): Record<string, string> => ({
  'content-type': 'application/json',
  cookie,
  origin: state.webOrigin,
});

async function approvedResearch(
  state: SmokeState,
  cookie: string,
): Promise<{ packageId: string; research: ResearchResource }> {
  const created = await fetch(`${state.apiOrigin}/v1/content-packages`, {
    method: 'POST',
    headers: headers(state, cookie),
    body: JSON.stringify({ title: `Blog ${randomUUID()}`, contentMode: 'creator_led', requestedOutputs: ['blog'] }),
  });
  expect(created.status).toBe(201);
  const packageId = ((await created.json()) as { data: { contentPackage: { id: string } } }).data.contentPackage.id;
  const sourceResponse = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/sources`, {
    method: 'POST',
    headers: headers(state, cookie),
    body: JSON.stringify({
      sourceType: 'pasted_text',
      role: 'primary',
      label: 'Primary evidence',
      text: 'Evidence supports a careful practical conclusion.',
    }),
  });
  const source = ((await sourceResponse.json()) as { data: { source: { id: string } } }).data.source;
  const sourceVersion = await fetch(
    `${state.apiOrigin}/v1/content-packages/${packageId}/sources/${source.id}/versions`,
    { method: 'POST', headers: headers(state, cookie), body: JSON.stringify({ expectedRevision: 1 }) },
  );
  const sourceVersionId = ((await sourceVersion.json()) as { data: { version: { id: string } } }).data.version.id;
  expect(
    (
      await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/sources/${source.id}/approval`, {
        method: 'POST',
        headers: headers(state, cookie),
        body: JSON.stringify({ versionId: sourceVersionId }),
      })
    ).status,
  ).toBe(200);
  const generatedResponse = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/research/generations`, {
    method: 'POST',
    headers: headers(state, cookie),
    body: JSON.stringify({ requestId: randomUUID() }),
  });
  const generated = ((await generatedResponse.json()) as { data: { research: ResearchResource } }).data.research;
  const reviewed = {
    ...generated.workingCopy.body,
    items: generated.workingCopy.body.items.map((item) => ({ ...item, reviewState: 'accepted' as const })),
  };
  const editedResponse = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/research/working-copy`, {
    method: 'PATCH',
    headers: headers(state, cookie),
    body: JSON.stringify({ expectedRevision: generated.workingCopy.revision, body: reviewed }),
  });
  const edited = ((await editedResponse.json()) as { data: { research: ResearchResource } }).data.research;
  const checkpointResponse = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/research/versions`, {
    method: 'POST',
    headers: headers(state, cookie),
    body: JSON.stringify({ expectedRevision: edited.workingCopy.revision }),
  });
  const checkpointed = ((await checkpointResponse.json()) as { data: { research: ResearchResource } }).data.research;
  const approvalResponse = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/research/approval`, {
    method: 'POST',
    headers: headers(state, cookie),
    body: JSON.stringify({ versionId: checkpointed.latestVersion.id }),
  });
  expect(approvalResponse.status).toBe(201);
  return {
    packageId,
    research: ((await approvalResponse.json()) as { data: { research: ResearchResource } }).data.research,
  };
}

describe('Human Opinion and Blog protected API', () => {
  it('confirms an exact Human Opinion, approves an exact Creator-led Blog, and exports article.md', async () => {
    const state = requireState();
    const cookie = await session(state);
    const { packageId, research } = await approvedResearch(state, cookie);
    const initial = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/opinion`, { headers: { cookie } });
    expect(initial.status).toBe(200);
    expect(((await initial.json()) as { data: { opinion: null } }).data.opinion).toBeNull();
    const interpretedResponse = await fetch(
      `${state.apiOrigin}/v1/content-packages/${packageId}/opinion/interpretation`,
      {
        method: 'POST',
        headers: headers(state, cookie),
        body: JSON.stringify({ rawResponse: 'Readers should apply the evidence carefully.' }),
      },
    );
    expect(interpretedResponse.status).toBe(201);
    const interpreted = ((await interpretedResponse.json()) as { data: { opinion: OpinionResource } }).data.opinion;
    expect(interpreted).toMatchObject({
      question: 'What should readers understand, feel, or do after reading this?',
      confirmedVersionId: null,
      researchVersionId: research.approvedVersionId,
    });
    const confirmedResponse = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/opinion/confirmation`, {
      method: 'POST',
      headers: headers(state, cookie),
      body: JSON.stringify({
        expectedRevision: interpreted.revision,
        confirmedStatement: 'Readers should act on verified evidence.',
      }),
    });
    const confirmed = ((await confirmedResponse.json()) as { data: { opinion: OpinionResource } }).data.opinion;
    expect(confirmed.confirmedVersionId).toMatch(/^[0-9a-f-]{36}$/);
    const xiaohongshuRequestId = randomUUID();
    const [xiaohongshuGeneratedResponse, xiaohongshuDuplicateResponse] = await Promise.all([
      fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/xiaohongshu/generations`, {
        method: 'POST',
        headers: headers(state, cookie),
        body: JSON.stringify({ requestId: xiaohongshuRequestId, contentMode: 'creator_led' }),
      }),
      fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/xiaohongshu/generations`, {
        method: 'POST',
        headers: headers(state, cookie),
        body: JSON.stringify({ requestId: xiaohongshuRequestId, contentMode: 'creator_led' }),
      }),
    ]);
    expect(xiaohongshuGeneratedResponse.status).toBe(201);
    expect(xiaohongshuDuplicateResponse.status).toBe(201);
    const xiaohongshuGenerated = (
      (await xiaohongshuGeneratedResponse.json()) as { data: { xiaohongshu: XiaohongshuResource } }
    ).data.xiaohongshu;
    const xiaohongshuDuplicate = (
      (await xiaohongshuDuplicateResponse.json()) as { data: { xiaohongshu: XiaohongshuResource } }
    ).data.xiaohongshu;
    expect(xiaohongshuGenerated.workingCopy.body.pages).toHaveLength(8);
    expect(xiaohongshuDuplicate.latestVersion.id).toBe(xiaohongshuGenerated.latestVersion.id);
    const reorderedPages = [
      xiaohongshuGenerated.workingCopy.body.pages[1]!,
      xiaohongshuGenerated.workingCopy.body.pages[0]!,
      ...xiaohongshuGenerated.workingCopy.body.pages.slice(2),
    ];
    const xiaohongshuEditedResponse = await fetch(
      `${state.apiOrigin}/v1/content-packages/${packageId}/xiaohongshu/working-copy`,
      {
        method: 'PATCH',
        headers: headers(state, cookie),
        body: JSON.stringify({
          expectedRevision: xiaohongshuGenerated.workingCopy.revision,
          body: {
            ...xiaohongshuGenerated.workingCopy.body,
            selectedPlatformTitle: xiaohongshuGenerated.workingCopy.body.platformTitleCandidates[1],
            pages: reorderedPages,
            caption: 'Owner-reviewed Xiaohongshu caption.',
          },
        }),
      },
    );
    expect(xiaohongshuEditedResponse.status).toBe(200);
    const xiaohongshuEdited = (
      (await xiaohongshuEditedResponse.json()) as { data: { xiaohongshu: XiaohongshuResource } }
    ).data.xiaohongshu;
    expect(xiaohongshuEdited.workingCopy.body.pages[0]!.id).toBe('page-2');
    expect(xiaohongshuEdited.latestVersion.body.caption).not.toBe('Owner-reviewed Xiaohongshu caption.');
    const xiaohongshuCheckpointResponse = await fetch(
      `${state.apiOrigin}/v1/content-packages/${packageId}/xiaohongshu/versions`,
      {
        method: 'POST',
        headers: headers(state, cookie),
        body: JSON.stringify({ expectedRevision: xiaohongshuEdited.workingCopy.revision }),
      },
    );
    expect(xiaohongshuCheckpointResponse.status).toBe(201);
    const xiaohongshuCheckpointed = (
      (await xiaohongshuCheckpointResponse.json()) as { data: { xiaohongshu: XiaohongshuResource } }
    ).data.xiaohongshu;
    const pageOne = xiaohongshuCheckpointed.latestVersion.body.pages.find((page) => page.id === 'page-1')!;
    const tamperXiaohongshu = await composeExec(state, 'postgres', [
      'sh',
      '-c',
      `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -tAc "UPDATE xiaohongshu_versions SET plan=jsonb_set(jsonb_set(plan, '{pages,0,researchItemIds,0}', to_jsonb('bogus'::text)), '{pages,0,opinionVersionId}', to_jsonb('bogus'::text)), body=jsonb_set(body, '{pages,1,researchItemIds,0}', to_jsonb('bogus'::text)) WHERE id='${xiaohongshuCheckpointed.latestVersion.id}'"`,
    ]);
    expect(tamperXiaohongshu.ok).toBe(true);
    const rejectedXiaohongshuApproval = await fetch(
      `${state.apiOrigin}/v1/content-packages/${packageId}/xiaohongshu/approval`,
      {
        method: 'POST',
        headers: headers(state, cookie),
        body: JSON.stringify({ versionId: xiaohongshuCheckpointed.latestVersion.id }),
      },
    );
    expect(rejectedXiaohongshuApproval.status).toBe(409);
    expect((await rejectedXiaohongshuApproval.json()) as { error: { code: string } }).toMatchObject({
      error: { code: 'BLOG_VERSION_NOT_ELIGIBLE' },
    });
    const restoreXiaohongshu = await composeExec(state, 'postgres', [
      'sh',
      '-c',
      `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -tAc "UPDATE xiaohongshu_versions SET plan=jsonb_set(jsonb_set(plan, '{pages,0,researchItemIds,0}', to_jsonb('${pageOne.researchItemIds[0]}'::text)), '{pages,0,opinionVersionId}', to_jsonb('${pageOne.opinionVersionId}'::text)), body=jsonb_set(body, '{pages,1,researchItemIds,0}', to_jsonb('${pageOne.researchItemIds[0]}'::text)) WHERE id='${xiaohongshuCheckpointed.latestVersion.id}'"`,
    ]);
    expect(restoreXiaohongshu.ok).toBe(true);
    const xiaohongshuApprovalResponse = await fetch(
      `${state.apiOrigin}/v1/content-packages/${packageId}/xiaohongshu/approval`,
      {
        method: 'POST',
        headers: headers(state, cookie),
        body: JSON.stringify({ versionId: xiaohongshuCheckpointed.latestVersion.id }),
      },
    );
    expect(xiaohongshuApprovalResponse.status).toBe(201);
    const xiaohongshuApproved = (
      (await xiaohongshuApprovalResponse.json()) as { data: { xiaohongshu: XiaohongshuResource } }
    ).data.xiaohongshu;
    expect(xiaohongshuApproved.approvalValidationSummary).toMatchObject({ result: 'passed', pageCount: 8 });
    const newerXiaohongshuEdit = await fetch(
      `${state.apiOrigin}/v1/content-packages/${packageId}/xiaohongshu/working-copy`,
      {
        method: 'PATCH',
        headers: headers(state, cookie),
        body: JSON.stringify({
          expectedRevision: xiaohongshuApproved.workingCopy.revision,
          body: { ...xiaohongshuApproved.workingCopy.body, caption: 'Unapproved newer Xiaohongshu caption.' },
        }),
      },
    );
    const newerXiaohongshu = ((await newerXiaohongshuEdit.json()) as { data: { xiaohongshu: XiaohongshuResource } })
      .data.xiaohongshu;
    expect(
      (
        await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/xiaohongshu/versions`, {
          method: 'POST',
          headers: headers(state, cookie),
          body: JSON.stringify({ expectedRevision: newerXiaohongshu.workingCopy.revision }),
        })
      ).status,
    ).toBe(201);
    const postExport = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/xiaohongshu/export/post`, {
      headers: { cookie },
    });
    expect(postExport.status).toBe(200);
    expect(postExport.headers.get('content-disposition')).toContain('post.md');
    const postMarkdown = await postExport.text();
    expect(postMarkdown).toContain(`contentosArtifactId: ${xiaohongshuApproved.id}`);
    expect(postMarkdown).toContain(`contentosVersionId: ${xiaohongshuApproved.approvedVersionId}`);
    expect(postMarkdown).toContain('## Page 1:');
    expect(postMarkdown).toContain('Owner-reviewed Xiaohongshu caption.');
    expect(postMarkdown).not.toContain('Unapproved newer Xiaohongshu caption.');
    const pagesExport = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/xiaohongshu/export/pages`, {
      headers: { cookie },
    });
    expect(pagesExport.status).toBe(200);
    expect(pagesExport.headers.get('content-disposition')).toContain('pages.json');
    expect(
      (await pagesExport.json()) as { artifactId: string; versionId: string; body: { pages: unknown[] } },
    ).toMatchObject({
      artifactId: xiaohongshuApproved.id,
      versionId: xiaohongshuApproved.approvedVersionId,
      body: { pages: expect.arrayContaining([expect.objectContaining({ id: 'page-1' })]) },
    });
    const requestId = randomUUID();
    const [generatedResponse, concurrentDuplicateResponse] = await Promise.all([
      fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/blog/generations`, {
        method: 'POST',
        headers: headers(state, cookie),
        body: JSON.stringify({ requestId, contentMode: 'creator_led' }),
      }),
      fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/blog/generations`, {
        method: 'POST',
        headers: headers(state, cookie),
        body: JSON.stringify({ requestId, contentMode: 'creator_led' }),
      }),
    ]);
    expect(generatedResponse.status).toBe(201);
    expect(concurrentDuplicateResponse.status).toBe(201);
    const generated = ((await generatedResponse.json()) as { data: { blog: BlogResource } }).data.blog;
    const concurrentDuplicate = ((await concurrentDuplicateResponse.json()) as { data: { blog: BlogResource } }).data
      .blog;
    expect(concurrentDuplicate.latestVersion.id).toBe(generated.latestVersion.id);
    expect(generated.workingCopy.body.markdown).toContain('Readers should act on verified evidence.');
    expect(generated.latestVersion.opinionVersionId).toBe(confirmed.confirmedVersionId);
    expect(JSON.stringify(generated)).not.toMatch(/rawOutput|providerAlias|safeErrorCode/i);
    const duplicate = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/blog/generations`, {
      method: 'POST',
      headers: headers(state, cookie),
      body: JSON.stringify({ requestId, contentMode: 'creator_led' }),
    });
    expect(((await duplicate.json()) as { data: { blog: BlogResource } }).data.blog.latestVersion.id).toBe(
      generated.latestVersion.id,
    );
    const tamperedReferences = {
      ...generated.workingCopy.body,
      publicReferences: generated.workingCopy.body.publicReferences.map((reference, index) =>
        index === 0 ? { ...reference, sourceVersionId: randomUUID() } : reference,
      ),
    };
    const tamperedReferencesResponse = await fetch(
      `${state.apiOrigin}/v1/content-packages/${packageId}/blog/working-copy`,
      {
        method: 'PATCH',
        headers: headers(state, cookie),
        body: JSON.stringify({ expectedRevision: generated.workingCopy.revision, body: tamperedReferences }),
      },
    );
    expect(tamperedReferencesResponse.status).toBe(422);
    const editedBody = { ...generated.workingCopy.body, summary: 'Owner-reviewed Blog summary.' };
    const editResponse = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/blog/working-copy`, {
      method: 'PATCH',
      headers: headers(state, cookie),
      body: JSON.stringify({ expectedRevision: generated.workingCopy.revision, body: editedBody }),
    });
    const edited = ((await editResponse.json()) as { data: { blog: BlogResource } }).data.blog;
    const checkpointResponse = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/blog/versions`, {
      method: 'POST',
      headers: headers(state, cookie),
      body: JSON.stringify({ expectedRevision: edited.workingCopy.revision }),
    });
    const checkpointed = ((await checkpointResponse.json()) as { data: { blog: BlogResource } }).data.blog;
    const duplicateCheckpoint = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/blog/versions`, {
      method: 'POST',
      headers: headers(state, cookie),
      body: JSON.stringify({ expectedRevision: edited.workingCopy.revision }),
    });
    expect(duplicateCheckpoint.status).toBe(201);
    expect(((await duplicateCheckpoint.json()) as { data: { blog: BlogResource } }).data.blog.latestVersion.id).toBe(
      checkpointed.latestVersion.id,
    );
    const expectedSourceVersionId = checkpointed.latestVersion.body.publicReferences[0]!.sourceVersionId;
    const tamperedSourceVersionId = randomUUID();
    const tamperCandidate = await composeExec(state, 'postgres', [
      'sh',
      '-c',
      `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -tAc "UPDATE blog_versions SET body=jsonb_set(body, '{publicReferences,0,sourceVersionId}', to_jsonb('${tamperedSourceVersionId}'::text)) WHERE id='${checkpointed.latestVersion.id}'"`,
    ]);
    expect(tamperCandidate.ok).toBe(true);
    const rejectedDependencyApproval = await fetch(
      `${state.apiOrigin}/v1/content-packages/${packageId}/blog/approval`,
      {
        method: 'POST',
        headers: headers(state, cookie),
        body: JSON.stringify({ versionId: checkpointed.latestVersion.id }),
      },
    );
    expect(rejectedDependencyApproval.status).toBe(409);
    expect((await rejectedDependencyApproval.json()) as { error: { code: string } }).toMatchObject({
      error: { code: 'BLOG_VERSION_NOT_ELIGIBLE' },
    });
    const restoreCandidate = await composeExec(state, 'postgres', [
      'sh',
      '-c',
      `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -tAc "UPDATE blog_versions SET body=jsonb_set(body, '{publicReferences,0,sourceVersionId}', to_jsonb('${expectedSourceVersionId}'::text)) WHERE id='${checkpointed.latestVersion.id}'"`,
    ]);
    expect(restoreCandidate.ok).toBe(true);
    const approvalResponse = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/blog/approval`, {
      method: 'POST',
      headers: headers(state, cookie),
      body: JSON.stringify({ versionId: checkpointed.latestVersion.id }),
    });
    expect(approvalResponse.status).toBe(201);
    const approved = ((await approvalResponse.json()) as { data: { blog: BlogResource } }).data.blog;
    expect(approved).toMatchObject({
      approvedVersionId: checkpointed.latestVersion.id,
      outdated: false,
      approvalValidationSummary: { schemaVersion: 'blog-validation/v1', result: 'passed' },
    });
    const duplicateApproval = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/blog/approval`, {
      method: 'POST',
      headers: headers(state, cookie),
      body: JSON.stringify({ versionId: checkpointed.latestVersion.id }),
    });
    expect(duplicateApproval.status).toBe(201);
    const exported = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/blog/export`, {
      headers: { cookie },
    });
    expect(exported.status).toBe(200);
    expect(exported.headers.get('content-disposition')).toContain('article.md');
    const article = await exported.text();
    expect(article).toContain(`contentosArtifactId: ${approved.id}`);
    expect(article).toContain(`contentosVersionId: ${approved.approvedVersionId}`);
    expect(article).toContain('# What the evidence means in practice');

    const researchBasedResponse = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/blog/generations`, {
      method: 'POST',
      headers: headers(state, cookie),
      body: JSON.stringify({ requestId: randomUUID(), contentMode: 'research_based' }),
    });
    expect(researchBasedResponse.status).toBe(201);
    const researchBased = ((await researchBasedResponse.json()) as { data: { blog: BlogResource } }).data.blog;
    expect(researchBased.latestVersion.body.contentMode).toBe('research_based');
    expect(researchBased.latestVersion.body.markdown).not.toMatch(/\b(?:I|me|my|we|us|our)\b/i);
    expect(researchBased.latestVersion.opinionVersionId).toBeNull();

    const freshInterpretation = await fetch(
      `${state.apiOrigin}/v1/content-packages/${packageId}/opinion/interpretation`,
      {
        method: 'POST',
        headers: headers(state, cookie),
        body: JSON.stringify({ rawResponse: 'A newer confirmed position.' }),
      },
    );
    const freshDraft = ((await freshInterpretation.json()) as { data: { opinion: OpinionResource } }).data.opinion;
    await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/opinion/confirmation`, {
      method: 'POST',
      headers: headers(state, cookie),
      body: JSON.stringify({
        expectedRevision: freshDraft.revision,
        confirmedStatement: 'A newer confirmed position.',
      }),
    });
    const outdatedResponse = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/blog`, {
      headers: { cookie },
    });
    expect(((await outdatedResponse.json()) as { data: { blog: BlogResource } }).data.blog.outdated).toBe(true);
    const xiaohongshuOutdatedResponse = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/xiaohongshu`, {
      headers: { cookie },
    });
    expect(
      ((await xiaohongshuOutdatedResponse.json()) as { data: { xiaohongshu: XiaohongshuResource } }).data.xiaohongshu
        .outdated,
    ).toBe(true);
    const freshXiaohongshuCandidateResponse = await fetch(
      `${state.apiOrigin}/v1/content-packages/${packageId}/xiaohongshu/generations`,
      {
        method: 'POST',
        headers: headers(state, cookie),
        body: JSON.stringify({ requestId: randomUUID(), contentMode: 'creator_led' }),
      },
    );
    expect(freshXiaohongshuCandidateResponse.status).toBe(201);
    expect(
      ((await freshXiaohongshuCandidateResponse.json()) as { data: { xiaohongshu: XiaohongshuResource } }).data
        .xiaohongshu,
    ).toMatchObject({ outdated: true, reviewCandidateOutdated: false });
    expect(
      (await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/blog/export`, { headers: { cookie } })).status,
    ).toBe(409);
    expect(
      (
        await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/xiaohongshu/export/post`, {
          headers: { cookie },
        })
      ).status,
    ).toBe(409);
    expect(
      (
        await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/xiaohongshu/export/pages`, {
          headers: { cookie },
        })
      ).status,
    ).toBe(409);

    const otherCookie = await session(state, '00000000-0000-4000-8000-000000000099');
    expect(
      (await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/blog`, { headers: { cookie: otherCookie } }))
        .status,
    ).toBe(404);
    expect(
      (
        await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/xiaohongshu`, {
          headers: { cookie: otherCookie },
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/xiaohongshu/export/post`, {
          headers: { cookie: otherCookie },
        })
      ).status,
    ).toBe(404);
    const packageResponse = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}`, { headers: { cookie } });
    const revision = ((await packageResponse.json()) as { data: { contentPackage: { revision: number } } }).data
      .contentPackage.revision;
    expect(
      (
        await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/archive`, {
          method: 'POST',
          headers: headers(state, cookie),
          body: JSON.stringify({ expectedRevision: revision }),
        })
      ).status,
    ).toBe(200);
    expect(
      (await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/blog`, { headers: { cookie } })).status,
    ).toBe(409);
    expect(
      (await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/xiaohongshu`, { headers: { cookie } })).status,
    ).toBe(409);
  });
});
