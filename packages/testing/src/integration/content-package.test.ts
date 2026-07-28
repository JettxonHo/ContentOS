import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { composeExec } from './compose.js';
import { requireState, type SmokeState } from './env.js';

interface PackageResource {
  id: string;
  title: string;
  lifecycle: 'active' | 'archived';
  revision: number;
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

async function createPackage(state: SmokeState, cookie: string, title: string): Promise<PackageResource> {
  const response = await fetch(`${state.apiOrigin}/v1/content-packages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
    body: JSON.stringify({ title, contentMode: 'creator_led', requestedOutputs: ['blog', 'xiaohongshu'] }),
  });
  expect(response.status).toBe(201);
  const body = (await response.json()) as { data: { contentPackage: PackageResource } };
  return body.data.contentPackage;
}

describe('Content Package protected API smoke', () => {
  it('requires a Session, validates input, and supports create, get, update, pagination, and archive', async () => {
    const state = requireState();
    const unauthenticated = await fetch(`${state.apiOrigin}/v1/content-packages`);
    expect(unauthenticated.status).toBe(401);

    const cookie = await createSession(state, '00000000-0000-4000-8000-000000000001');
    const invalid = await fetch(`${state.apiOrigin}/v1/content-packages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
      body: JSON.stringify({ title: '', requestedOutputs: [], ownerUserId: randomUUID() }),
    });
    expect(invalid.status).toBe(422);
    expect(await invalid.json()).toMatchObject({ error: { code: 'INVALID_REQUEST' } });

    const first = await createPackage(state, cookie, 'First package');
    await createPackage(state, cookie, 'Second package');
    await createPackage(state, cookie, 'Third package');

    const get = await fetch(`${state.apiOrigin}/v1/content-packages/${first.id}`, { headers: { cookie } });
    expect(get.status).toBe(200);
    expect(await get.json()).toMatchObject({ data: { contentPackage: { id: first.id, revision: 1 } } });

    const update = await fetch(`${state.apiOrigin}/v1/content-packages/${first.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
      body: JSON.stringify({ expectedRevision: 1, title: 'Updated package' }),
    });
    expect(update.status).toBe(200);
    expect(await update.json()).toMatchObject({
      data: { contentPackage: { title: 'Updated package', revision: 2 } },
    });

    const stale = await fetch(`${state.apiOrigin}/v1/content-packages/${first.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
      body: JSON.stringify({ expectedRevision: 1, title: 'Stale overwrite' }),
    });
    expect(stale.status).toBe(409);
    expect(await stale.json()).toMatchObject({ error: { code: 'REVISION_CONFLICT' } });

    const pageOne = await fetch(`${state.apiOrigin}/v1/content-packages?limit=2`, { headers: { cookie } });
    expect(pageOne.status).toBe(200);
    const pageOneBody = (await pageOne.json()) as {
      data: { items: PackageResource[]; nextCursor: string | null };
    };
    expect(pageOneBody.data.items).toHaveLength(2);
    expect(pageOneBody.data.nextCursor).not.toBeNull();
    const pageTwo = await fetch(
      `${state.apiOrigin}/v1/content-packages?limit=2&cursor=${encodeURIComponent(pageOneBody.data.nextCursor ?? '')}`,
      { headers: { cookie } },
    );
    const pageTwoBody = (await pageTwo.json()) as { data: { items: PackageResource[] } };
    expect(pageTwo.status).toBe(200);
    expect(pageTwoBody.data.items).toHaveLength(1);
    expect(new Set([...pageOneBody.data.items, ...pageTwoBody.data.items].map((item) => item.id)).size).toBe(3);

    const archive = await fetch(`${state.apiOrigin}/v1/content-packages/${first.id}/archive`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
      body: JSON.stringify({ expectedRevision: 2 }),
    });
    expect(archive.status).toBe(200);
    expect(await archive.json()).toMatchObject({
      data: { contentPackage: { lifecycle: 'archived', revision: 3 } },
    });

    const active = await fetch(`${state.apiOrigin}/v1/content-packages`, { headers: { cookie } });
    const activeBody = (await active.json()) as { data: { items: PackageResource[] } };
    expect(activeBody.data.items.some((item) => item.id === first.id)).toBe(false);
    const archived = await fetch(`${state.apiOrigin}/v1/content-packages?status=archived`, { headers: { cookie } });
    const archivedBody = (await archived.json()) as { data: { items: PackageResource[] } };
    expect(archivedBody.data.items.map((item) => item.id)).toContain(first.id);

    const archivedGet = await fetch(`${state.apiOrigin}/v1/content-packages/${first.id}`, { headers: { cookie } });
    expect(archivedGet.status).toBe(200);
    const noDelete = await fetch(`${state.apiOrigin}/v1/content-packages/${first.id}`, {
      method: 'DELETE',
      headers: { cookie, origin: state.webOrigin },
    });
    expect(noDelete.status).toBe(404);
  });

  it('does not disclose or mutate another owner scope', async () => {
    const state = requireState();
    const ownerCookie = await createSession(state, '00000000-0000-4000-8000-000000000001');
    const owned = await createPackage(state, ownerCookie, 'Owner-only package');
    const otherOwnerId = '00000000-0000-4000-8000-000000000002';
    const otherCookie = await createSession(state, otherOwnerId);

    const list = await fetch(`${state.apiOrigin}/v1/content-packages?status=all`, { headers: { cookie: otherCookie } });
    expect(list.status).toBe(200);
    expect(await list.json()).toMatchObject({ data: { items: [] } });

    for (const request of [
      { method: 'GET' },
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', origin: state.webOrigin },
        body: JSON.stringify({ expectedRevision: 1, title: 'Forbidden change' }),
      },
      {
        method: 'POST',
        path: '/archive',
        headers: { 'content-type': 'application/json', origin: state.webOrigin },
        body: JSON.stringify({ expectedRevision: 1 }),
      },
    ]) {
      const response = await fetch(`${state.apiOrigin}/v1/content-packages/${owned.id}${request.path ?? ''}`, {
        method: request.method,
        headers: { cookie: otherCookie, ...request.headers },
        ...(request.body === undefined ? {} : { body: request.body }),
      });
      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({ error: { code: 'CONTENT_PACKAGE_NOT_FOUND' } });
    }

    const unchanged = await fetch(`${state.apiOrigin}/v1/content-packages/${owned.id}`, {
      headers: { cookie: ownerCookie },
    });
    expect(await unchanged.json()).toMatchObject({
      data: { contentPackage: { title: 'Owner-only package', revision: 1, lifecycle: 'active' } },
    });
  });
});
