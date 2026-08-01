import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { composeExec } from './compose.js';
import { requireState, type SmokeState } from './env.js';

interface PackageResource {
  readonly id: string;
  readonly revision: number;
}

async function createSession(state: SmokeState, ownerUserId: string): Promise<string> {
  const rawCredential = randomBytes(32).toString('base64url');
  const credentialHash = createHash('sha256').update(rawCredential).digest('hex');
  const inserted = await composeExec(state, 'postgres', [
    'sh',
    '-c',
    `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -tAc "INSERT INTO auth_sessions (id, credential_hash, owner_user_id, created_at, expires_at) VALUES ('${randomUUID()}', '${credentialHash}', '${ownerUserId}', now(), now() + interval '1 hour')"`,
  ]);
  expect(inserted.ok).toBe(true);
  return `contentos_session=${rawCredential}`;
}

async function createPackage(state: SmokeState, cookie: string): Promise<PackageResource> {
  const response = await fetch(`${state.apiOrigin}/v1/content-packages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
    body: JSON.stringify({
      title: 'URL capture API package',
      contentMode: 'creator_led',
      requestedOutputs: ['blog', 'xiaohongshu'],
    }),
  });
  expect(response.status).toBe(201);
  const body = (await response.json()) as { data: { contentPackage: PackageResource } };
  return body.data.contentPackage;
}

async function cleanupPackage(state: SmokeState, packageId: string): Promise<void> {
  const deleted = await composeExec(state, 'postgres', [
    'sh',
    '-c',
    `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "BEGIN; DELETE FROM workflow_outbox_records WHERE content_package_id = '${packageId}'; DELETE FROM workflow_tasks WHERE content_package_id = '${packageId}'; DELETE FROM url_capture_requests WHERE content_package_id = '${packageId}'; DELETE FROM url_source_references WHERE content_package_id = '${packageId}'; ALTER TABLE workflow_events DISABLE TRIGGER workflow_events_immutable_trigger; DELETE FROM workflow_events WHERE content_package_id = '${packageId}'; ALTER TABLE workflow_events ENABLE TRIGGER workflow_events_immutable_trigger; DELETE FROM workflow_nodes WHERE content_package_id = '${packageId}'; DELETE FROM workflow_instances WHERE content_package_id = '${packageId}'; DELETE FROM content_packages WHERE id = '${packageId}'; COMMIT;"`,
  ]);
  expect(deleted.ok).toBe(true);
}

describe('M2-WF-002 protected URL capture API', () => {
  it('requires authentication and creates a safe idempotent 201 response without Source evidence', async () => {
    const state = requireState();
    const path = '/v1/content-packages/00000000-0000-4000-8000-000000000001/url-capture-requests';
    const unauthenticated = await fetch(`${state.apiOrigin}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: state.webOrigin },
      body: JSON.stringify({ expectedPackageRevision: 1, role: 'primary', submittedUrl: 'https://example.com' }),
    });
    expect(unauthenticated.status).toBe(401);

    const cookie = await createSession(state, '00000000-0000-4000-8000-000000000001');
    const contentPackage = await createPackage(state, cookie);
    const key = 'E'.repeat(16);
    const input = {
      expectedPackageRevision: contentPackage.revision,
      role: 'primary',
      submittedUrl: 'https://example.com/private?q=secret#section',
    };
    const first = await fetch(`${state.apiOrigin}/v1/content-packages/${contentPackage.id}/url-capture-requests`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': key, cookie, origin: state.webOrigin },
      body: JSON.stringify(input),
    });
    expect(first.status).toBe(201);
    const firstText = await first.text();
    expect(firstText).not.toContain('secret');
    expect(firstText).not.toContain('section');
    const firstBody = JSON.parse(firstText) as { data: { urlCaptureRequest: { taskState: string } } };
    expect(firstBody.data.urlCaptureRequest.taskState).toBe('queued');

    const replay = await fetch(`${state.apiOrigin}/v1/content-packages/${contentPackage.id}/url-capture-requests`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': key, cookie, origin: state.webOrigin },
      body: JSON.stringify(input),
    });
    expect(replay.status).toBe(201);
    expect(await replay.text()).toBe(firstText);

    const mismatch = await fetch(`${state.apiOrigin}/v1/content-packages/${contentPackage.id}/url-capture-requests`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': key, cookie, origin: state.webOrigin },
      body: JSON.stringify({ ...input, submittedUrl: 'https://example.com/other' }),
    });
    expect(mismatch.status).toBe(409);
    const mismatchText = await mismatch.text();
    expect(mismatchText).not.toContain('secret');
    expect(mismatchText).not.toContain(key);

    const sources = await fetch(`${state.apiOrigin}/v1/content-packages/${contentPackage.id}/sources`, {
      headers: { cookie },
    });
    expect(sources.status).toBe(200);
    expect(await sources.json()).toMatchObject({ data: { items: [] } });
    await cleanupPackage(state, contentPackage.id);
  });

  it('maps malformed input and missing/other-owner packages without URL or key disclosure', async () => {
    const state = requireState();
    const ownerCookie = await createSession(state, '00000000-0000-4000-8000-000000000001');
    const otherCookie = await createSession(state, '00000000-0000-4000-8000-000000000002');
    const owned = await createPackage(state, ownerCookie);
    const missing = await fetch(`${state.apiOrigin}/v1/content-packages/${randomUUID()}/url-capture-requests`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': 'F'.repeat(16),
        cookie: ownerCookie,
        origin: state.webOrigin,
      },
      body: JSON.stringify({
        expectedPackageRevision: 1,
        role: 'primary',
        submittedUrl: 'https://example.com/private',
      }),
    });
    expect(missing.status).toBe(404);

    const otherOwner = await fetch(`${state.apiOrigin}/v1/content-packages/${owned.id}/url-capture-requests`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': 'G'.repeat(16),
        cookie: otherCookie,
        origin: state.webOrigin,
      },
      body: JSON.stringify({
        expectedPackageRevision: 1,
        role: 'primary',
        submittedUrl: 'https://example.com/private',
      }),
    });
    expect(otherOwner.status).toBe(404);

    const malformed = await fetch(`${state.apiOrigin}/v1/content-packages/${owned.id}/url-capture-requests`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': 'short',
        cookie: ownerCookie,
        origin: state.webOrigin,
      },
      body: JSON.stringify({
        expectedPackageRevision: 1,
        role: 'primary',
        submittedUrl: 'ftp://example.com',
        extra: true,
      }),
    });
    expect(malformed.status).toBe(422);
    const malformedText = await malformed.text();
    expect(malformedText).not.toContain('ftp://example.com');
    expect(malformedText).not.toContain('short');
    await cleanupPackage(state, owned.id);
  });
});
