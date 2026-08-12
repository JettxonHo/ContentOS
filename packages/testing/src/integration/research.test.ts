import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import type { ResearchResource } from '@contentos/contracts';

import { composeExec } from './compose.js';
import { requireState, type SmokeState } from './env.js';

const OWNER = '00000000-0000-4000-8000-000000000005';

async function session(state: SmokeState, ownerUserId = OWNER): Promise<string> {
  const raw = randomBytes(32).toString('base64url');
  const hash = createHash('sha256').update(raw).digest('hex');
  const result = await composeExec(state, 'postgres', [
    'sh',
    '-c',
    `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -tAc "INSERT INTO auth_sessions (id, credential_hash, owner_user_id, created_at, expires_at) VALUES ('${randomUUID()}', '${hash}', '${ownerUserId}', now(), now() + interval '1 hour')"`,
  ]);
  expect(result.ok).toBe(true);
  return `contentos_session=${raw}`;
}

function headers(state: SmokeState, cookie: string): Record<string, string> {
  return { 'content-type': 'application/json', cookie, origin: state.webOrigin };
}

async function approvedPackage(state: SmokeState, cookie: string): Promise<{ packageId: string; sourceId: string }> {
  const packageResponse = await fetch(`${state.apiOrigin}/v1/content-packages`, {
    method: 'POST',
    headers: headers(state, cookie),
    body: JSON.stringify({
      title: `Research ${randomUUID()}`,
      contentMode: 'creator_led',
      requestedOutputs: ['blog', 'xiaohongshu'],
    }),
  });
  expect(packageResponse.status).toBe(201);
  const packageId = ((await packageResponse.json()) as { data: { contentPackage: { id: string } } }).data.contentPackage
    .id;
  const sourceResponse = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/sources`, {
    method: 'POST',
    headers: headers(state, cookie),
    body: JSON.stringify({
      sourceType: 'pasted_text',
      role: 'primary',
      label: 'Primary evidence',
      text: 'ContentOS preserves exact approved evidence.\n\nReview remains a human responsibility.',
    }),
  });
  expect(sourceResponse.status).toBe(201);
  const source = ((await sourceResponse.json()) as { data: { source: { id: string } } }).data.source;
  const versionResponse = await fetch(
    `${state.apiOrigin}/v1/content-packages/${packageId}/sources/${source.id}/versions`,
    {
      method: 'POST',
      headers: headers(state, cookie),
      body: JSON.stringify({ expectedRevision: 1 }),
    },
  );
  expect(versionResponse.status).toBe(201);
  const versionId = ((await versionResponse.json()) as { data: { version: { id: string } } }).data.version.id;
  const approval = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/sources/${source.id}/approval`, {
    method: 'POST',
    headers: headers(state, cookie),
    body: JSON.stringify({ versionId }),
  });
  expect(approval.status).toBe(200);
  return { packageId, sourceId: source.id };
}

describe('Research protected API', () => {
  it('moves exact Approved Sources through review, checkpoint, and exact Approval', async () => {
    const state = requireState();
    const cookie = await session(state);
    const { packageId, sourceId } = await approvedPackage(state, cookie);

    const requestId = randomUUID();
    const generate = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/research/generations`, {
      method: 'POST',
      headers: headers(state, cookie),
      body: JSON.stringify({ requestId }),
    });
    expect(generate.status).toBe(201);
    const generated = ((await generate.json()) as { data: { research: ResearchResource } }).data.research;
    expect(generated.latestVersion.sourceInputs).toHaveLength(1);
    expect(generated.workingCopy.body.items[0]).toMatchObject({ reviewState: 'unreviewed' });
    expect(generated.workingCopy.body.items[0]?.evidence[0]?.snippet).toContain('ContentOS preserves');
    expect(JSON.stringify(generated)).not.toMatch(/rawOutput|providerAlias/i);

    const duplicate = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/research/generations`, {
      method: 'POST',
      headers: headers(state, cookie),
      body: JSON.stringify({ requestId }),
    });
    expect(duplicate.status).toBe(201);
    expect(((await duplicate.json()) as { data: { research: ResearchResource } }).data.research.latestVersion.id).toBe(
      generated.latestVersion.id,
    );

    const approvedItems = generated.workingCopy.body.items.map((item, index) => ({
      ...item,
      text: index === 0 ? 'Corrected evidence-backed conclusion.' : item.text,
      reviewState: index === 0 ? ('corrected' as const) : ('accepted' as const),
    }));
    const edit = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/research/working-copy`, {
      method: 'PATCH',
      headers: headers(state, cookie),
      body: JSON.stringify({
        expectedRevision: generated.workingCopy.revision,
        body: { ...generated.workingCopy.body, summary: 'Owner-reviewed summary.', items: approvedItems },
      }),
    });
    expect(edit.status).toBe(200);
    const edited = ((await edit.json()) as { data: { research: ResearchResource } }).data.research;
    expect(edited.workingCopy.revision).toBe(generated.workingCopy.revision + 1);

    const staleEdit = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/research/working-copy`, {
      method: 'PATCH',
      headers: headers(state, cookie),
      body: JSON.stringify({ expectedRevision: generated.workingCopy.revision, body: edited.workingCopy.body }),
    });
    expect(staleEdit.status).toBe(409);
    expect(await staleEdit.json()).toMatchObject({ error: { code: 'RESEARCH_REVISION_CONFLICT' } });

    const checkpoint = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/research/versions`, {
      method: 'POST',
      headers: headers(state, cookie),
      body: JSON.stringify({ expectedRevision: edited.workingCopy.revision }),
    });
    expect(checkpoint.status).toBe(201);
    const checkpointed = ((await checkpoint.json()) as { data: { research: ResearchResource } }).data.research;
    expect(checkpointed.latestVersion.origin).toBe('user_checkpoint');
    expect(checkpointed.latestVersion.body.summary).toBe('Owner-reviewed summary.');

    const approval = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/research/approval`, {
      method: 'POST',
      headers: headers(state, cookie),
      body: JSON.stringify({ versionId: checkpointed.latestVersion.id }),
    });
    expect(approval.status).toBe(201);
    const approved = ((await approval.json()) as { data: { research: ResearchResource } }).data.research;
    expect(approved.approvedVersionId).toBe(checkpointed.latestVersion.id);
    expect(approved.outdated).toBe(false);
    expect(approved.approval?.validationSummary).toEqual({
      schemaVersion: 'research-validation/v1',
      result: 'passed',
      reviewedItemCount: 1,
      usableEvidenceBackedItemCount: 1,
      sourceInputCount: 1,
      warningAcknowledgements: [],
    });
    const sourceEdit = await fetch(
      `${state.apiOrigin}/v1/content-packages/${packageId}/sources/${sourceId}/working-copy`,
      {
        method: 'PATCH',
        headers: headers(state, cookie),
        body: JSON.stringify({
          expectedRevision: 1,
          body: { text: 'A newly reviewed Source Version makes prior Research outdated.' },
        }),
      },
    );
    expect(sourceEdit.status).toBe(200);
    const sourceVersion = await fetch(
      `${state.apiOrigin}/v1/content-packages/${packageId}/sources/${sourceId}/versions`,
      {
        method: 'POST',
        headers: headers(state, cookie),
        body: JSON.stringify({ expectedRevision: 2 }),
      },
    );
    expect(sourceVersion.status).toBe(201);
    const sourceVersionId = ((await sourceVersion.json()) as { data: { version: { id: string } } }).data.version.id;
    const sourceApproval = await fetch(
      `${state.apiOrigin}/v1/content-packages/${packageId}/sources/${sourceId}/approval`,
      {
        method: 'POST',
        headers: headers(state, cookie),
        body: JSON.stringify({ versionId: sourceVersionId }),
      },
    );
    expect(sourceApproval.status).toBe(200);

    const outdatedResponse = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/research`, {
      headers: { cookie },
    });
    expect(outdatedResponse.status).toBe(200);
    const outdated = ((await outdatedResponse.json()) as { data: { research: ResearchResource } }).data.research;
    expect(outdated).toMatchObject({
      approvedVersionId: checkpointed.latestVersion.id,
      outdated: true,
      reviewCandidateOutdated: true,
    });

    const staleApproval = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/research/approval`, {
      method: 'POST',
      headers: headers(state, cookie),
      body: JSON.stringify({ versionId: checkpointed.latestVersion.id }),
    });
    expect(staleApproval.status).toBe(409);
    expect(await staleApproval.json()).toMatchObject({ error: { code: 'RESEARCH_VERSION_NOT_ELIGIBLE' } });

    const regenerate = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/research/generations`, {
      method: 'POST',
      headers: headers(state, cookie),
      body: JSON.stringify({ requestId: randomUUID() }),
    });
    expect(regenerate.status).toBe(201);
    const regenerated = ((await regenerate.json()) as { data: { research: ResearchResource } }).data.research;
    expect(regenerated).toMatchObject({
      approvedVersionId: checkpointed.latestVersion.id,
      outdated: true,
      reviewCandidateOutdated: false,
    });
    expect(regenerated.latestVersion.id).not.toBe(checkpointed.latestVersion.id);

    const rereview = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/research/working-copy`, {
      method: 'PATCH',
      headers: headers(state, cookie),
      body: JSON.stringify({
        expectedRevision: regenerated.workingCopy.revision,
        body: {
          ...regenerated.workingCopy.body,
          summary: 'Reviewed against the current Approved Source.',
          items: regenerated.workingCopy.body.items.map((item) => ({ ...item, reviewState: 'accepted' })),
        },
      }),
    });
    expect(rereview.status).toBe(200);
    const rereviewed = ((await rereview.json()) as { data: { research: ResearchResource } }).data.research;
    const recheckpoint = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/research/versions`, {
      method: 'POST',
      headers: headers(state, cookie),
      body: JSON.stringify({ expectedRevision: rereviewed.workingCopy.revision }),
    });
    expect(recheckpoint.status).toBe(201);
    const recheckpointed = ((await recheckpoint.json()) as { data: { research: ResearchResource } }).data.research;
    const reapproval = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/research/approval`, {
      method: 'POST',
      headers: headers(state, cookie),
      body: JSON.stringify({ versionId: recheckpointed.latestVersion.id }),
    });
    expect(reapproval.status).toBe(201);
    expect(((await reapproval.json()) as { data: { research: ResearchResource } }).data.research).toMatchObject({
      approvedVersionId: recheckpointed.latestVersion.id,
      outdated: false,
      reviewCandidateOutdated: false,
    });

    const rawCount = await composeExec(state, 'postgres', [
      'sh',
      '-c',
      `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT count(*) FROM research_runs WHERE content_package_id='${packageId}' AND raw_output <> ''"`,
    ]);
    expect(rawCount.ok).toBe(true);
    expect(rawCount.stdout.trim()).toBe('2');
  });

  it('requires owner-scoped Approved Sources and rejects unreviewed approval', async () => {
    const state = requireState();
    const cookie = await session(state);
    const packageResponse = await fetch(`${state.apiOrigin}/v1/content-packages`, {
      method: 'POST',
      headers: headers(state, cookie),
      body: JSON.stringify({
        title: `No source ${randomUUID()}`,
        contentMode: 'creator_led',
        requestedOutputs: ['blog'],
      }),
    });
    const packageId = ((await packageResponse.json()) as { data: { contentPackage: { id: string } } }).data
      .contentPackage.id;
    const missing = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/research/generations`, {
      method: 'POST',
      headers: headers(state, cookie),
      body: JSON.stringify({ requestId: randomUUID() }),
    });
    expect(missing.status).toBe(409);
    expect(await missing.json()).toMatchObject({ error: { code: 'APPROVED_SOURCE_REQUIRED' } });

    const approvedFixture = await approvedPackage(state, cookie);
    const generatedResponse = await fetch(
      `${state.apiOrigin}/v1/content-packages/${approvedFixture.packageId}/research/generations`,
      {
        method: 'POST',
        headers: headers(state, cookie),
        body: JSON.stringify({ requestId: randomUUID() }),
      },
    );
    const generated = ((await generatedResponse.json()) as { data: { research: ResearchResource } }).data.research;
    const tamperedEvidence = await fetch(
      `${state.apiOrigin}/v1/content-packages/${approvedFixture.packageId}/research/working-copy`,
      {
        method: 'PATCH',
        headers: headers(state, cookie),
        body: JSON.stringify({
          expectedRevision: generated.workingCopy.revision,
          body: {
            ...generated.workingCopy.body,
            items: generated.workingCopy.body.items.map((item) => ({
              ...item,
              evidence: item.evidence.map((evidence) => ({ ...evidence, snippet: 'Fabricated evidence text.' })),
            })),
          },
        }),
      },
    );
    expect(tamperedEvidence.status).toBe(422);
    expect(await tamperedEvidence.json()).toMatchObject({ error: { code: 'INVALID_REQUEST' } });

    const blocked = await fetch(
      `${state.apiOrigin}/v1/content-packages/${approvedFixture.packageId}/research/approval`,
      {
        method: 'POST',
        headers: headers(state, cookie),
        body: JSON.stringify({ versionId: generated.latestVersion.id }),
      },
    );
    expect(blocked.status).toBe(409);
    expect(await blocked.json()).toMatchObject({ error: { code: 'RESEARCH_VERSION_NOT_ELIGIBLE' } });

    const otherCookie = await session(state, '00000000-0000-4000-8000-000000000006');
    const crossOwner = await fetch(`${state.apiOrigin}/v1/content-packages/${approvedFixture.packageId}/research`, {
      headers: { cookie: otherCookie },
    });
    expect(crossOwner.status).toBe(404);
  });
});
