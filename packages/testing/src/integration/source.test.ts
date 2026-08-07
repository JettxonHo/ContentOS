import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';
import { Ajv2020 } from 'ajv/dist/2020.js';
import { Client } from 'pg';

import {
  apiErrorSchema,
  sourceApprovalResponseSchema,
  sourceListResponseSchema,
  sourceResponseSchema,
  sourceVersionDetailResponseSchema,
  sourceVersionListResponseSchema,
  sourceVersionResponseSchema,
  sourceWorkingCopyResponseSchema,
} from '@contentos/contracts';
import { S3ObjectStore } from '@contentos/object-storage';

import { composeExec } from './compose.js';
import { requireState, readComposeCredentials, type SmokeState } from './env.js';
import { signedFetch, type AwsCredentials } from './sigv4.js';

interface PackageResource {
  id: string;
  title: string;
  lifecycle: 'active' | 'archived';
  revision: number;
}

interface SourceResource {
  id: string;
  contentPackageId: string;
  sourceType: string;
  role: string;
  label: string | null;
  captureType: string;
  createdAt: string;
  workingCopy: { revision: number; schemaVersion: string; updatedAt: string };
  rawSnapshot: { sha256: string; byteSize: number; contentType: string; capturedAt: string };
  latestVersionId: string | null;
  reviewCandidateVersionId: string | null;
  approvedVersionId: string | null;
}

interface SourceListItem {
  id: string;
  contentPackageId: string;
  sourceType: string;
  role: string;
  label: string | null;
  captureType: string;
  createdAt: string;
}

interface SourceVersionResource {
  id: string;
  versionNumber: number;
  parentVersionId: string | null;
  contentHash: string;
  schemaVersion: string;
  rawSnapshotId: string;
  createdById: string;
  createdAt: string;
}

interface SourceApprovalResource {
  approval: {
    id: string;
    approvedVersionId: string;
    approvedById: string;
    approvedAt: string;
    validationSummary: string;
  };
  head: {
    approvedVersionId: string;
    latestVersionId: string | null;
    reviewCandidateVersionId: string | null;
  };
}

// Distinct from the Content Package smoke owner (...001) so Source package data
// never perturbs that suite's owner-scoped pagination counts (order-independent).
const OWNER_USER_ID = '00000000-0000-4000-8000-000000000003';
const responseAjv = new Ajv2020({ allErrors: true, strict: true });
const validateSourceResponse = responseAjv.compile(sourceResponseSchema);
const validateSourceListResponse = responseAjv.compile(sourceListResponseSchema);
const validateWorkingCopyResponse = responseAjv.compile(sourceWorkingCopyResponseSchema);
const validateVersionResponse = responseAjv.compile(sourceVersionResponseSchema);
const validateVersionDetailResponse = responseAjv.compile(sourceVersionDetailResponseSchema);
const validateVersionListResponse = responseAjv.compile(sourceVersionListResponseSchema);
const validateApprovalResponse = responseAjv.compile(sourceApprovalResponseSchema);
const validateErrorResponse = responseAjv.compile(apiErrorSchema);

function directPostgresClient(state: SmokeState): Client {
  const credentials = readComposeCredentials(state.envFile);
  return new Client({
    host: '127.0.0.1',
    port: state.ports.postgres,
    user: 'smoke_user',
    password: credentials.POSTGRES_PASSWORD,
    database: 'smoke_db',
  });
}

async function archiveAfterMutationWaits(
  state: SmokeState,
  packageId: string,
  startMutation: () => Promise<Response>,
): Promise<Response> {
  const client = directPostgresClient(state);
  await client.connect();
  await client.query('BEGIN');
  try {
    await client.query('SELECT id FROM content_packages WHERE id=$1 FOR UPDATE', [packageId]);
    const responsePromise = startMutation();
    let blocked = false;
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const result = await client.query<{ blocked: boolean }>(
        `SELECT EXISTS (
           SELECT 1 FROM pg_stat_activity AS waiting
           WHERE waiting.pid <> pg_backend_pid()
             AND pg_backend_pid() = ANY(pg_blocking_pids(waiting.pid))
         ) AS blocked`,
      );
      if (result.rows[0]?.blocked) {
        blocked = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    expect(blocked).toBe(true);
    await client.query(
      `UPDATE content_packages
       SET lifecycle='archived', archived_at=now(), updated_at=now(), revision=revision+1
       WHERE id=$1`,
      [packageId],
    );
    await client.query('COMMIT');
    return await responsePromise;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
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

async function bucketObjectCount(state: SmokeState): Promise<number> {
  const credentials = readComposeCredentials(state.envFile);
  const response = await signedFetch({
    method: 'GET',
    url: `http://127.0.0.1:${state.ports.objectStorage}/${state.objectStorageBucket}?list-type=2`,
    credentials: {
      accessKeyId: credentials.OBJECT_STORAGE_ACCESS_KEY ?? '',
      secretAccessKey: credentials.OBJECT_STORAGE_SECRET_KEY ?? '',
    },
  });
  expect(response.status).toBe(200);
  const xml = await response.text();
  return Number.parseInt(/<KeyCount>(\d+)<\/KeyCount>/.exec(xml)?.[1] ?? '0', 10);
}

async function archivePackage(state: SmokeState, cookie: string, pkg: PackageResource): Promise<void> {
  const response = await fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/archive`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
    body: JSON.stringify({ expectedRevision: pkg.revision }),
  });
  expect(response.status).toBe(200);
}

async function captureSource(
  state: SmokeState,
  cookie: string,
  packageId: string,
  role: 'primary' | 'supporting',
  text: string,
  label?: string,
): Promise<SourceResource> {
  const response = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/sources`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
    body: JSON.stringify({ sourceType: 'pasted_text', role, text, ...(label === undefined ? {} : { label }) }),
  });
  expect(response.status).toBe(201);
  const body = (await response.json()) as { data: { source: SourceResource } };
  expect(validateSourceResponse(body), JSON.stringify(validateSourceResponse.errors)).toBe(true);
  return body.data.source;
}

async function uploadSourceRequest(
  state: SmokeState,
  cookie: string,
  packageId: string,
  options: {
    readonly fileName?: string;
    readonly bytes?: Uint8Array;
    readonly fileType?: string;
    readonly role?: string;
    readonly label?: string;
    readonly omitRole?: boolean;
    readonly extraFields?: Record<string, string>;
    readonly omitFile?: boolean;
  },
): Promise<Response> {
  const form = new FormData();
  if (options.omitFile !== true) {
    const payload = options.bytes ?? new TextEncoder().encode('placeholder upload body');
    // BlobPart requires an ArrayBuffer-backed view under the strict TS 5.9 lib.
    const copy = new Uint8Array(payload.byteLength);
    copy.set(payload);
    const blob =
      options.fileType === undefined
        ? new Blob([copy.buffer as ArrayBuffer])
        : new Blob([copy.buffer as ArrayBuffer], { type: options.fileType });
    form.set('file', blob, options.fileName ?? 'notes.md');
  }
  if (options.omitRole !== true) {
    form.set('role', options.role ?? 'primary');
  }
  if (options.label !== undefined) {
    form.set('label', options.label);
  }
  for (const [key, value] of Object.entries(options.extraFields ?? {})) {
    form.set(key, value);
  }
  return fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/sources/upload`, {
    method: 'POST',
    headers: { cookie, origin: state.webOrigin },
    body: form,
  });
}

/**
 * Posts a hand-rolled multipart body so adversarial filenames reach the
 * server exactly as written in the Content-Disposition header (spec-compliant
 * FormData clients sanitize such filenames before sending).
 */
async function rawMultipartUploadWithRole(
  state: SmokeState,
  cookie: string,
  packageId: string,
  fileNameInHeader: string,
  role: string,
): Promise<Response> {
  const boundary = `contentos${randomUUID().replace(/-/g, '')}`;
  const body = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="file"; filename="${fileNameInHeader}"`,
    'Content-Type: text/plain',
    '',
    'safe upload body',
    `--${boundary}`,
    'Content-Disposition: form-data; name="role"',
    '',
    role,
    `--${boundary}--`,
    '',
  ].join('\r\n');
  return fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/sources/upload`, {
    method: 'POST',
    headers: {
      cookie,
      origin: state.webOrigin,
      'content-type': `multipart/form-data; boundary=${boundary}`,
    },
    body,
  });
}

async function rawMultipartUpload(
  state: SmokeState,
  cookie: string,
  packageId: string,
  fileNameInHeader: string,
): Promise<Response> {
  return rawMultipartUploadWithRole(state, cookie, packageId, fileNameInHeader, 'primary');
}

async function expectUploadDenial(response: Response, keyword: string): Promise<void> {
  expect(response.status).toBe(422);
  const body = (await response.json()) as {
    error: { code: string; details?: ReadonlyArray<{ path: string; keyword: string }> };
  };
  expect(validateErrorResponse(body), JSON.stringify(validateErrorResponse.errors)).toBe(true);
  expect(body.error.code).toBe('INVALID_REQUEST');
  expect(
    body.error.details?.some((detail) => detail.keyword === keyword),
    `expected keyword '${keyword}', received details: ${JSON.stringify(body.error.details)}`,
  ).toBe(true);
}

describe('Source protected API smoke', () => {
  it('requires a Session and validates input', async () => {
    const state = requireState();

    // Unauthenticated
    const unauth = await fetch(`${state.apiOrigin}/v1/content-packages/00000000-0000-4000-8000-000000000001/sources`);
    expect(unauth.status).toBe(401);

    const cookie = await createSession(state, OWNER_USER_ID);
    const pkg = await createPackage(state, cookie, 'Source validation package');

    // Empty text
    const empty = await fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
      body: JSON.stringify({ sourceType: 'pasted_text', role: 'primary', text: '' }),
    });
    expect(empty.status).toBe(422);
    expect(await empty.json()).toMatchObject({ error: { code: 'INVALID_REQUEST' } });

    const malformed = await fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
      body: '{',
    });
    expect(malformed.status).toBe(400);
    expect(validateErrorResponse(await malformed.json()), JSON.stringify(validateErrorResponse.errors)).toBe(true);

    const deniedOrigin = await fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie, origin: 'https://denied.invalid' },
      body: JSON.stringify({ sourceType: 'pasted_text', role: 'primary', text: 'denied' }),
    });
    expect(deniedOrigin.status).toBe(403);
    expect(validateErrorResponse(await deniedOrigin.json()), JSON.stringify(validateErrorResponse.errors)).toBe(true);

    // Invalid sourceType
    const badType = await fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
      body: JSON.stringify({ sourceType: 'url', role: 'primary', text: 'hello' }),
    });
    expect(badType.status).toBe(422);

    // Invalid role
    const badRole = await fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
      body: JSON.stringify({ sourceType: 'pasted_text', role: 'reference', text: 'hello' }),
    });
    expect(badRole.status).toBe(422);
  });

  it('rejects NUL and lone surrogates with 422 and no database or Object Store side effect', async () => {
    const state = requireState();
    const cookie = await createSession(state, OWNER_USER_ID);
    const pkg = await createPackage(state, cookie, 'Unicode validation package');
    const objectCountBefore = await bucketObjectCount(state);

    for (const [text, label] of [
      ['before\u0000after', undefined],
      ['lone high \ud800', undefined],
      ['lone low \udc00', undefined],
      ['valid body', 'bad\u0000label'],
    ] as const) {
      const response = await fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
        body: JSON.stringify({
          sourceType: 'pasted_text',
          role: 'primary',
          text,
          ...(label === undefined ? {} : { label }),
        }),
      });
      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({ error: { code: 'INVALID_REQUEST' } });
    }

    const rowCount = await composeExec(state, 'postgres', [
      'sh',
      '-c',
      `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT count(*) FROM sources WHERE content_package_id='${pkg.id}'"`,
    ]);
    expect(rowCount.ok).toBe(true);
    expect(rowCount.stdout.trim()).toBe('0');
    expect(await bucketObjectCount(state)).toBe(objectCountBefore);

    const supplementary = await captureSource(state, cookie, pkg.id, 'primary', 'valid \u{1f680} text');
    expect(supplementary.rawSnapshot.byteSize).toBe(Buffer.byteLength('valid \u{1f680} text', 'utf8'));
  });

  it('enforces the Source label boundary by Unicode scalar values over HTTP', async () => {
    const state = requireState();
    const cookie = await createSession(state, OWNER_USER_ID);
    const pkg = await createPackage(state, cookie, 'Unicode label boundary package');
    const supplementary = '\u{1f680}';
    const acceptedLabels = [
      supplementary.repeat(100),
      supplementary.repeat(200),
      `${'a'.repeat(100)}${supplementary.repeat(100)}`,
    ];
    for (const [index, label] of acceptedLabels.entries()) {
      const source = await captureSource(state, cookie, pkg.id, 'supporting', `label boundary ${index}`, label);
      expect(source.label).toBe(label);
      expect([...source.label!]).toHaveLength(index === 0 ? 100 : 200);
    }

    for (const label of [supplementary.repeat(201), `${'a'.repeat(101)}${supplementary.repeat(100)}`]) {
      const response = await fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
        body: JSON.stringify({ sourceType: 'pasted_text', role: 'supporting', text: 'invalid label', label }),
      });
      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({ error: { code: 'INVALID_REQUEST' } });
    }

    const persisted = await directPostgresClient(state);
    await persisted.connect();
    try {
      const lengths = await persisted.query<{ length: number }>(
        'SELECT char_length(label)::int AS length FROM sources WHERE content_package_id=$1 ORDER BY created_at, id',
        [pkg.id],
      );
      expect(lengths.rows.map((row) => row.length).sort((left, right) => left - right)).toEqual([100, 200, 200]);
    } finally {
      await persisted.end();
    }
  });

  it('captures a primary Source, enforces role limits, and never leaks storage keys', async () => {
    const state = requireState();
    const cookie = await createSession(state, OWNER_USER_ID);
    const pkg = await createPackage(state, cookie, 'Source capture package');

    const primary = await captureSource(state, cookie, pkg.id, 'primary', 'Primary source text');
    expect(primary.role).toBe('primary');
    expect(primary.sourceType).toBe('pasted_text');
    expect(primary.captureType).toBe('pasted_text');
    expect(primary.workingCopy.revision).toBe(1);
    expect(primary.latestVersionId).toBeNull();
    expect(primary.approvedVersionId).toBeNull();
    expect(primary.rawSnapshot.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(primary.rawSnapshot.byteSize).toBeGreaterThan(0);
    expect(primary.rawSnapshot.contentType).toBe('text/plain; charset=utf-8');

    // The response body must not contain any storage key or credential field
    const rawBody = JSON.stringify(primary);
    expect(rawBody).not.toContain('storageKey');
    expect(rawBody).not.toContain('accessKey');
    expect(rawBody).not.toContain('secret');

    // Second primary Source must be rejected
    const secondPrimary = await fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
      body: JSON.stringify({ sourceType: 'pasted_text', role: 'primary', text: 'Second primary' }),
    });
    expect(secondPrimary.status).toBe(409);
    expect(await secondPrimary.json()).toMatchObject({ error: { code: 'SOURCE_ROLE_LIMIT_EXCEEDED' } });

    // Supporting Sources up to 5 are allowed
    for (let i = 0; i < 5; i++) {
      await captureSource(state, cookie, pkg.id, 'supporting', `Supporting ${i + 1}`);
    }

    // Sixth supporting must be rejected
    const sixth = await fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
      body: JSON.stringify({ sourceType: 'pasted_text', role: 'supporting', text: 'Sixth supporting' }),
    });
    expect(sixth.status).toBe(409);
    expect(await sixth.json()).toMatchObject({ error: { code: 'SOURCE_ROLE_LIMIT_EXCEEDED' } });

    const roleCounts = await composeExec(state, 'postgres', [
      'sh',
      '-c',
      `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT count(*) FILTER (WHERE role='primary') || ':' || count(*) FILTER (WHERE role='supporting') FROM sources WHERE content_package_id='${pkg.id}'"`,
    ]);
    expect(roleCounts.ok).toBe(true);
    expect(roleCounts.stdout.trim()).toBe('1:5');

    const firstPage = await fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources?limit=2`, {
      headers: { cookie },
    });
    expect(firstPage.status).toBe(200);
    const firstPageBody = (await firstPage.json()) as { data: { items: SourceListItem[]; nextCursor: string | null } };
    expect(validateSourceListResponse(firstPageBody), JSON.stringify(validateSourceListResponse.errors)).toBe(true);
    expect(firstPageBody.data.items).toHaveLength(2);
    expect(firstPageBody.data.nextCursor).not.toBeNull();
    const secondPage = await fetch(
      `${state.apiOrigin}/v1/content-packages/${pkg.id}/sources?limit=2&cursor=${encodeURIComponent(firstPageBody.data.nextCursor!)}`,
      { headers: { cookie } },
    );
    expect(secondPage.status).toBe(200);
    const secondPageBody = (await secondPage.json()) as {
      data: { items: SourceListItem[]; nextCursor: string | null };
    };
    expect(validateSourceListResponse(secondPageBody), JSON.stringify(validateSourceListResponse.errors)).toBe(true);
    expect(secondPageBody.data.items).toHaveLength(2);
    expect(secondPageBody.data.items.map((item) => item.id)).not.toEqual(
      expect.arrayContaining(firstPageBody.data.items.map((item) => item.id)),
    );
  });

  it('rejects every Source read and mutation against an archived or unknown package', async () => {
    const state = requireState();
    const cookie = await createSession(state, OWNER_USER_ID);
    const pkg = await createPackage(state, cookie, 'Archived package');
    const source = await captureSource(state, cookie, pkg.id, 'primary', 'Archived source body');
    const versionResponse = await fetch(
      `${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/versions`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
        body: JSON.stringify({ expectedRevision: 1 }),
      },
    );
    expect(versionResponse.status).toBe(201);
    const version = (await versionResponse.json()) as { data: { version: SourceVersionResource } };
    await archivePackage(state, cookie, pkg);

    const archivedResponse = await fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
      body: JSON.stringify({ sourceType: 'pasted_text', role: 'primary', text: 'Should fail' }),
    });
    expect(archivedResponse.status).toBe(409);
    expect(await archivedResponse.json()).toMatchObject({ error: { code: 'CONTENT_PACKAGE_STATE_CONFLICT' } });

    const archivedRequests = [
      fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources`, { headers: { cookie } }),
      fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}`, { headers: { cookie } }),
      fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/working-copy`, {
        headers: { cookie },
      }),
      fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/versions`, { headers: { cookie } }),
      fetch(
        `${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/versions/${version.data.version.id}`,
        { headers: { cookie } },
      ),
      fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/working-copy`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
        body: JSON.stringify({ expectedRevision: 1, body: { text: 'archived edit' } }),
      }),
      fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/versions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
        body: JSON.stringify({ expectedRevision: 1 }),
      }),
      fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/approval`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
        body: JSON.stringify({ versionId: version.data.version.id }),
      }),
    ];
    const archivedResults = await Promise.all(archivedRequests);
    expect(archivedResults.map((response) => response.status)).toEqual(Array(archivedRequests.length).fill(409));

    const unknownId = '00000000-0000-4000-8000-000000000099';
    const unknownResponse = await fetch(`${state.apiOrigin}/v1/content-packages/${unknownId}/sources`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
      body: JSON.stringify({ sourceType: 'pasted_text', role: 'primary', text: 'Should fail' }),
    });
    expect(unknownResponse.status).toBe(404);
  });

  it('serializes archive races before capture, edit, Version, and Approval commits', async () => {
    const state = requireState();
    const cookie = await createSession(state, OWNER_USER_ID);
    const headers = { 'content-type': 'application/json', cookie, origin: state.webOrigin };

    const capturePackage = await createPackage(state, cookie, 'Capture archive race');
    const capture = await archiveAfterMutationWaits(state, capturePackage.id, () =>
      fetch(`${state.apiOrigin}/v1/content-packages/${capturePackage.id}/sources`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ sourceType: 'pasted_text', role: 'primary', text: 'race capture' }),
      }),
    );

    const editPackage = await createPackage(state, cookie, 'Edit archive race');
    const editSource = await captureSource(state, cookie, editPackage.id, 'primary', 'edit race body');
    const edit = await archiveAfterMutationWaits(state, editPackage.id, () =>
      fetch(`${state.apiOrigin}/v1/content-packages/${editPackage.id}/sources/${editSource.id}/working-copy`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ expectedRevision: 1, body: { text: 'blocked edit' } }),
      }),
    );

    const versionPackage = await createPackage(state, cookie, 'Version archive race');
    const versionSource = await captureSource(state, cookie, versionPackage.id, 'primary', 'version race body');
    const version = await archiveAfterMutationWaits(state, versionPackage.id, () =>
      fetch(`${state.apiOrigin}/v1/content-packages/${versionPackage.id}/sources/${versionSource.id}/versions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ expectedRevision: 1 }),
      }),
    );

    const approvalPackage = await createPackage(state, cookie, 'Approval archive race');
    const approvalSource = await captureSource(state, cookie, approvalPackage.id, 'primary', 'approval race body');
    const approvalVersion = await fetch(
      `${state.apiOrigin}/v1/content-packages/${approvalPackage.id}/sources/${approvalSource.id}/versions`,
      { method: 'POST', headers, body: JSON.stringify({ expectedRevision: 1 }) },
    );
    expect(approvalVersion.status).toBe(201);
    const approvalVersionBody = (await approvalVersion.json()) as { data: { version: SourceVersionResource } };
    const approval = await archiveAfterMutationWaits(state, approvalPackage.id, () =>
      fetch(`${state.apiOrigin}/v1/content-packages/${approvalPackage.id}/sources/${approvalSource.id}/approval`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ versionId: approvalVersionBody.data.version.id }),
      }),
    );

    for (const response of [capture, edit, version, approval]) {
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({ error: { code: 'CONTENT_PACKAGE_STATE_CONFLICT' } });
    }
  });

  it('supports the full edit → version → approve lifecycle with append-only re-approval and lists sources', async () => {
    const state = requireState();
    const cookie = await createSession(state, OWNER_USER_ID);
    const pkg = await createPackage(state, cookie, 'Source lifecycle package');

    const source = await captureSource(state, cookie, pkg.id, 'primary', 'Initial source text');

    // List Sources — items must be truthful list items without fake placeholder fields
    const list = await fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources`, {
      headers: { cookie },
    });
    expect(list.status).toBe(200);
    const listBody = (await list.json()) as { data: { items: SourceListItem[]; nextCursor: string | null } };
    expect(validateSourceListResponse(listBody), JSON.stringify(validateSourceListResponse.errors)).toBe(true);
    expect(listBody.data.items.length).toBeGreaterThanOrEqual(1);
    const firstItem = listBody.data.items[0]!;
    expect(firstItem.id).toBe(source.id);
    expect(firstItem.sourceType).toBe('pasted_text');
    // List items must not contain fake workingCopy or rawSnapshot fields
    const itemKeys = Object.keys(firstItem);
    expect(itemKeys).not.toContain('workingCopy');
    expect(itemKeys).not.toContain('rawSnapshot');
    expect(itemKeys).not.toContain('latestVersionId');

    // Get the working copy
    const wc = await fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/working-copy`, {
      headers: { cookie },
    });
    expect(wc.status).toBe(200);
    const wcBody = (await wc.json()) as {
      data: {
        workingCopy: { revision: number; checkpointedRevision: number | null; body: { text: string } };
        rawSnapshot: { sha256: string; contentType: string };
      };
    };
    expect(validateWorkingCopyResponse(wcBody), JSON.stringify(validateWorkingCopyResponse.errors)).toBe(true);
    expect(wcBody.data.workingCopy.revision).toBe(1);
    expect(wcBody.data.workingCopy.checkpointedRevision).toBeNull();
    expect(wcBody.data.workingCopy.body.text).toBe('Initial source text');
    expect(wcBody.data.rawSnapshot.contentType).toBe('text/plain; charset=utf-8');

    // Edit the working copy
    const edit = await fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/working-copy`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
      body: JSON.stringify({ expectedRevision: 1, body: { text: 'Edited source text' } }),
    });
    expect(edit.status).toBe(200);
    const editBody = (await edit.json()) as {
      data: { workingCopy: { revision: number; checkpointedRevision: number | null; body: { text: string } } };
    };
    expect(validateWorkingCopyResponse(editBody), JSON.stringify(validateWorkingCopyResponse.errors)).toBe(true);
    expect(editBody.data.workingCopy.revision).toBe(2);
    expect(editBody.data.workingCopy.checkpointedRevision).toBeNull();

    // Stale revision must be rejected
    const stale = await fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/working-copy`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
      body: JSON.stringify({ expectedRevision: 1, body: { text: 'Stale edit' } }),
    });
    expect(stale.status).toBe(409);
    expect(await stale.json()).toMatchObject({ error: { code: 'SOURCE_REVISION_CONFLICT' } });

    // Create Version 1 from the working copy
    const version = await fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/versions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
      body: JSON.stringify({ expectedRevision: 2 }),
    });
    expect(version.status).toBe(201);
    const versionBody = (await version.json()) as { data: { version: SourceVersionResource } };
    expect(validateVersionResponse(versionBody), JSON.stringify(validateVersionResponse.errors)).toBe(true);
    expect(versionBody.data.version.versionNumber).toBe(1);
    expect(versionBody.data.version.parentVersionId).toBeNull();
    expect(versionBody.data.version.contentHash).toMatch(/^[0-9a-f]{64}$/);

    const checkpointed = await fetch(
      `${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/working-copy`,
      {
        headers: { cookie },
      },
    );
    expect(checkpointed.status).toBe(200);
    const checkpointedBody = (await checkpointed.json()) as {
      data: { workingCopy: { revision: number; checkpointedRevision: number | null } };
    };
    expect(checkpointedBody.data.workingCopy).toMatchObject({ revision: 2, checkpointedRevision: 2 });

    const duplicateCheckpoint = await fetch(
      `${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/versions`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
        body: JSON.stringify({ expectedRevision: 2 }),
      },
    );
    expect(duplicateCheckpoint.status).toBe(409);
    expect(await duplicateCheckpoint.json()).toMatchObject({ error: { code: 'SOURCE_VERSION_ALREADY_EXISTS' } });

    // Verify the exact Version body is queryable for human review (Correction 6)
    const versionDetail = await fetch(
      `${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/versions/${versionBody.data.version.id}`,
      { headers: { cookie } },
    );
    expect(versionDetail.status).toBe(200);
    const versionDetailBody = (await versionDetail.json()) as {
      data: { version: { body: { text: string }; contentHash: string } };
    };
    expect(validateVersionDetailResponse(versionDetailBody), JSON.stringify(validateVersionDetailResponse.errors)).toBe(
      true,
    );
    expect(versionDetailBody.data.version.body.text).toBe('Edited source text');
    expect(versionDetailBody.data.version.contentHash).toBe(versionBody.data.version.contentHash);

    // Unknown version ID must return 404
    const unknownVersionDetail = await fetch(
      `${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/versions/${randomUUID()}`,
      { headers: { cookie } },
    );
    expect(unknownVersionDetail.status).toBe(404);

    // Cross-package version detail must return 404
    const crossPackageDetail = await fetch(
      `${state.apiOrigin}/v1/content-packages/${randomUUID()}/sources/${source.id}/versions/${versionBody.data.version.id}`,
      { headers: { cookie } },
    );
    expect(crossPackageDetail.status).toBe(404);

    // List Versions
    const versionList = await fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/versions`, {
      headers: { cookie },
    });
    expect(versionList.status).toBe(200);
    const versionListBody = (await versionList.json()) as { data: { items: SourceVersionResource[] } };
    expect(validateVersionListResponse(versionListBody), JSON.stringify(validateVersionListResponse.errors)).toBe(true);
    expect(versionListBody.data.items).toHaveLength(1);
    expect(versionListBody.data.items[0]?.id).toBe(versionBody.data.version.id);

    // Approve Version 1
    const approve = await fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/approval`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
      body: JSON.stringify({ versionId: versionBody.data.version.id }),
    });
    expect(approve.status).toBe(200);
    const approveBody = (await approve.json()) as { data: SourceApprovalResource };
    expect(validateApprovalResponse(approveBody), JSON.stringify(validateApprovalResponse.errors)).toBe(true);
    expect(approveBody.data.approval.approvedVersionId).toBe(versionBody.data.version.id);
    expect(approveBody.data.approval.validationSummary).toMatch(
      /^schema=source\/normalized\/v1;valid=true;contentHash=[0-9a-f]{64}$/,
    );
    expect(approveBody.data.approval.validationSummary).toBe(
      `schema=source/normalized/v1;valid=true;contentHash=${versionBody.data.version.contentHash}`,
    );
    expect(approveBody.data.head.approvedVersionId).toBe(versionBody.data.version.id);

    // Duplicate approval of the same version must be rejected as already approved
    const dupApproval = await fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/approval`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
      body: JSON.stringify({ versionId: versionBody.data.version.id }),
    });
    expect(dupApproval.status).toBe(409);
    expect(await dupApproval.json()).toMatchObject({ error: { code: 'SOURCE_ALREADY_APPROVED' } });

    // Edit the working copy and create Version 2
    const edit2 = await fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/working-copy`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
      body: JSON.stringify({ expectedRevision: 2, body: { text: 'Second edit for version 2' } }),
    });
    expect(edit2.status).toBe(200);

    const editedAfterCheckpoint = await fetch(
      `${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/working-copy`,
      { headers: { cookie } },
    );
    expect(editedAfterCheckpoint.status).toBe(200);
    expect(
      (
        (await editedAfterCheckpoint.json()) as {
          data: { workingCopy: { revision: number; checkpointedRevision: number | null } };
        }
      ).data.workingCopy,
    ).toMatchObject({ revision: 3, checkpointedRevision: 2 });

    const version2 = await fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/versions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
      body: JSON.stringify({ expectedRevision: 3 }),
    });
    expect(version2.status).toBe(201);
    const version2Body = (await version2.json()) as { data: { version: SourceVersionResource } };
    expect(version2Body.data.version.versionNumber).toBe(2);
    expect(version2Body.data.version.parentVersionId).toBe(versionBody.data.version.id);

    // Approve Version 2 — the historical approval for Version 1 remains, and head moves forward
    const approve2 = await fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/approval`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
      body: JSON.stringify({ versionId: version2Body.data.version.id }),
    });
    expect(approve2.status).toBe(200);
    const approve2Body = (await approve2.json()) as { data: SourceApprovalResource };
    expect(approve2Body.data.approval.approvedVersionId).toBe(version2Body.data.version.id);
    expect(approve2Body.data.head.approvedVersionId).toBe(version2Body.data.version.id);

    // Version 1 is no longer the current review candidate — must be rejected as ineligible
    const staleApproval = await fetch(
      `${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/approval`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
        body: JSON.stringify({ versionId: versionBody.data.version.id }),
      },
    );
    expect(staleApproval.status).toBe(409);
    expect(await staleApproval.json()).toMatchObject({ error: { code: 'SOURCE_VERSION_NOT_ELIGIBLE' } });

    // Approving an unknown version must fail
    const unknownVersion = await fetch(
      `${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/approval`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
        body: JSON.stringify({ versionId: randomUUID() }),
      },
    );
    expect(unknownVersion.status).toBe(404);
    expect(await unknownVersion.json()).toMatchObject({ error: { code: 'SOURCE_VERSION_NOT_FOUND' } });

    // Non-UUID versionId must be rejected at the contract boundary
    const badUuid = await fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/approval`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
      body: JSON.stringify({ versionId: 'not-a-uuid' }),
    });
    expect(badUuid.status).toBe(422);

    // The source head must reflect the latest approved version
    const getSource = await fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}`, {
      headers: { cookie },
    });
    expect(getSource.status).toBe(200);
    const getSourceBody = (await getSource.json()) as { data: { source: SourceResource } };
    expect(getSourceBody.data.source.approvedVersionId).toBe(version2Body.data.version.id);
    expect(getSourceBody.data.source.latestVersionId).toBe(version2Body.data.version.id);
  });

  it('serializes concurrent role limits, Version checkpoints, and Approval uniqueness', async () => {
    const state = requireState();
    const cookie = await createSession(state, OWNER_USER_ID);

    const primaryPackage = await createPackage(state, cookie, 'Concurrent primary role package');
    const primaryResponses = await Promise.all(
      ['first', 'second'].map((text) =>
        fetch(`${state.apiOrigin}/v1/content-packages/${primaryPackage.id}/sources`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
          body: JSON.stringify({ sourceType: 'pasted_text', role: 'primary', text }),
        }),
      ),
    );
    expect(primaryResponses.map((response) => response.status).sort()).toEqual([201, 409]);

    const supportingPackage = await createPackage(state, cookie, 'Concurrent supporting role package');
    const supportingResponses = await Promise.all(
      Array.from({ length: 6 }, (_, index) =>
        fetch(`${state.apiOrigin}/v1/content-packages/${supportingPackage.id}/sources`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
          body: JSON.stringify({ sourceType: 'pasted_text', role: 'supporting', text: `supporting-${index}` }),
        }),
      ),
    );
    expect(supportingResponses.filter((response) => response.status === 201)).toHaveLength(5);
    expect(supportingResponses.filter((response) => response.status === 409)).toHaveLength(1);

    const packageResource = await createPackage(state, cookie, 'Concurrent checkpoint package');
    const source = await captureSource(state, cookie, packageResource.id, 'primary', 'checkpoint body');
    const versionResponses = await Promise.all(
      [0, 1].map(() =>
        fetch(`${state.apiOrigin}/v1/content-packages/${packageResource.id}/sources/${source.id}/versions`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
          body: JSON.stringify({ expectedRevision: 1 }),
        }),
      ),
    );
    expect(versionResponses.map((response) => response.status).sort()).toEqual([201, 409]);
    const createdVersionResponse = versionResponses.find((response) => response.status === 201)!;
    const createdVersion = (await createdVersionResponse.json()) as { data: { version: SourceVersionResource } };
    const rejectedVersionResponse = versionResponses.find((response) => response.status === 409)!;
    expect(await rejectedVersionResponse.json()).toMatchObject({ error: { code: 'SOURCE_VERSION_ALREADY_EXISTS' } });

    const approvalResponses = await Promise.all(
      [0, 1].map(() =>
        fetch(`${state.apiOrigin}/v1/content-packages/${packageResource.id}/sources/${source.id}/approval`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
          body: JSON.stringify({ versionId: createdVersion.data.version.id }),
        }),
      ),
    );
    expect(approvalResponses.map((response) => response.status).sort()).toEqual([200, 409]);

    const counts = await composeExec(state, 'postgres', [
      'sh',
      '-c',
      `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT (SELECT count(*) FROM source_versions WHERE source_id = '${source.id}') || ':' || (SELECT count(*) FROM source_approvals WHERE source_id = '${source.id}') || ':' || (latest_version_id = '${createdVersion.data.version.id}' AND review_candidate_version_id = '${createdVersion.data.version.id}' AND approved_version_id = '${createdVersion.data.version.id}') FROM source_heads WHERE source_id = '${source.id}'"`,
    ]);
    expect(counts.ok).toBe(true);
    expect(counts.stdout.trim()).toBe('1:1:true');
  });

  it('does not disclose or mutate another owner scope', async () => {
    const state = requireState();
    const ownerCookie = await createSession(state, OWNER_USER_ID);
    const otherCookie = await createSession(state, '00000000-0000-4000-8000-000000000002');

    const pkg = await createPackage(state, ownerCookie, 'Owner isolation package');
    const source = await captureSource(state, ownerCookie, pkg.id, 'primary', 'Private source text');
    const versionResponse = await fetch(
      `${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/versions`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: ownerCookie, origin: state.webOrigin },
        body: JSON.stringify({ expectedRevision: 1 }),
      },
    );
    expect(versionResponse.status).toBe(201);
    const version = (await versionResponse.json()) as { data: { version: SourceVersionResource } };
    const pkg2 = await createPackage(state, ownerCookie, 'Second package');

    const scopedRequests = (
      routePackageId: string,
      scopedCookie: string,
      includeCapture: boolean,
    ): Promise<Response>[] => [
      fetch(`${state.apiOrigin}/v1/content-packages/${routePackageId}/sources`, { headers: { cookie: scopedCookie } }),
      fetch(`${state.apiOrigin}/v1/content-packages/${routePackageId}/sources/${source.id}`, {
        headers: { cookie: scopedCookie },
      }),
      fetch(`${state.apiOrigin}/v1/content-packages/${routePackageId}/sources/${source.id}/working-copy`, {
        headers: { cookie: scopedCookie },
      }),
      fetch(`${state.apiOrigin}/v1/content-packages/${routePackageId}/sources/${source.id}/working-copy`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: scopedCookie, origin: state.webOrigin },
        body: JSON.stringify({ expectedRevision: 1, body: { text: 'Forbidden edit' } }),
      }),
      fetch(`${state.apiOrigin}/v1/content-packages/${routePackageId}/sources/${source.id}/versions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: scopedCookie, origin: state.webOrigin },
        body: JSON.stringify({ expectedRevision: 1 }),
      }),
      fetch(`${state.apiOrigin}/v1/content-packages/${routePackageId}/sources/${source.id}/versions`, {
        headers: { cookie: scopedCookie },
      }),
      fetch(
        `${state.apiOrigin}/v1/content-packages/${routePackageId}/sources/${source.id}/versions/${version.data.version.id}`,
        { headers: { cookie: scopedCookie } },
      ),
      fetch(`${state.apiOrigin}/v1/content-packages/${routePackageId}/sources/${source.id}/approval`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: scopedCookie, origin: state.webOrigin },
        body: JSON.stringify({ versionId: version.data.version.id }),
      }),
      ...(includeCapture
        ? [
            fetch(`${state.apiOrigin}/v1/content-packages/${routePackageId}/sources`, {
              method: 'POST',
              headers: { 'content-type': 'application/json', cookie: scopedCookie, origin: state.webOrigin },
              body: JSON.stringify({ sourceType: 'pasted_text', role: 'supporting', text: 'Forbidden capture' }),
            }),
          ]
        : []),
    ];

    for (const [routePackageId, scopedCookie, includeCapture] of [
      [pkg.id, otherCookie, true],
      [pkg2.id, ownerCookie, false],
    ] as const) {
      const results = await Promise.all(scopedRequests(routePackageId, scopedCookie, includeCapture));
      const expectedStatuses =
        routePackageId === pkg2.id ? [200, ...Array(results.length - 1).fill(404)] : Array(results.length).fill(404);
      expect(results.map((response) => response.status)).toEqual(expectedStatuses);
    }
  });

  it('verifies S3 object integrity, access denial, and conditional immutability', async () => {
    const state = requireState();
    const cookie = await createSession(state, OWNER_USER_ID);
    const pkg = await createPackage(state, cookie, 'S3 verification package');
    const text = 'S3 integrity verification source text';

    const source = await captureSource(state, cookie, pkg.id, 'primary', text);

    // Read the object key from the database (not exposed via API)
    const keyResult = await composeExec(state, 'postgres', [
      'sh',
      '-c',
      `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT storage_key FROM source_raw_snapshots WHERE source_id = '${source.id}'"`,
    ]);
    expect(keyResult.ok).toBe(true);
    const objectKey = keyResult.stdout.trim();
    expect(objectKey.length).toBeGreaterThan(0);

    // Read the bucket name from harness state (the API config uses this bucket)
    const creds = readComposeCredentials(state.envFile);
    const s3Credentials: AwsCredentials = {
      accessKeyId: creds.OBJECT_STORAGE_ACCESS_KEY ?? '',
      secretAccessKey: creds.OBJECT_STORAGE_SECRET_KEY ?? '',
    };
    const s3Endpoint = `http://127.0.0.1:${state.ports.objectStorage}`;

    // Retrieve the object through an authenticated SigV4 request. The path-style
    // URL requires the task-owned bucket before the opaque storage key.
    const objectUrl = `${s3Endpoint}/${state.objectStorageBucket}/${objectKey}`;
    const authResponse = await signedFetch({
      method: 'GET',
      url: objectUrl,
      credentials: s3Credentials,
    });
    expect(authResponse.status).toBe(200);
    const retrievedBytes = new Uint8Array(await authResponse.arrayBuffer());

    // Verify SHA-256
    const retrievedSha256 = createHash('sha256').update(retrievedBytes).digest('hex');
    expect(retrievedSha256).toBe(source.rawSnapshot.sha256);

    // Verify byte size
    expect(retrievedBytes.byteLength).toBe(source.rawSnapshot.byteSize);

    // Verify content type
    const contentType = authResponse.headers.get('content-type');
    expect(contentType).toBe('text/plain; charset=utf-8');

    // Verify original content matches (without printing the body or key)
    const retrievedText = new TextDecoder().decode(retrievedBytes);
    expect(retrievedText).toBe(text);

    // Anonymous (unauthenticated) access must be denied
    const anonResponse = await fetch(objectUrl);
    expect(anonResponse.status).toBe(403);

    const adapter = new S3ObjectStore({
      endpoint: s3Endpoint,
      region: 'us-east-1',
      bucket: state.objectStorageBucket,
      forcePathStyle: true,
      accessKeyId: s3Credentials.accessKeyId,
      secretAccessKey: s3Credentials.secretAccessKey,
    });
    const immutableInput = {
      ownerUserId: OWNER_USER_ID as never,
      contentPackageId: pkg.id as never,
      sourceId: randomUUID() as never,
      snapshotId: randomUUID() as never,
      bytes: new TextEncoder().encode('adapter conditional-write proof'),
      contentType: 'text/plain; charset=utf-8',
    };
    await expect(
      adapter.putImmutable({
        ...immutableInput,
        sourceId: randomUUID() as never,
        snapshotId: randomUUID() as never,
        contentType: 'text/html',
      }),
    ).rejects.toMatchObject({ reason: 'WRITE_FAILED' });
    const stored = await adapter.putImmutable(immutableInput);
    await expect(adapter.putImmutable(immutableInput)).rejects.toMatchObject({ reason: 'WRITE_FAILED' });
    expect(await adapter.readForIntegrity(stored)).toBe(true);

    const wrongCredentialAdapter = new S3ObjectStore({
      endpoint: s3Endpoint,
      region: 'us-east-1',
      bucket: state.objectStorageBucket,
      forcePathStyle: true,
      accessKeyId: s3Credentials.accessKeyId,
      secretAccessKey: `${s3Credentials.secretAccessKey}x`,
    });
    expect(await wrongCredentialAdapter.readForIntegrity(stored)).toBe(false);

    const adapterObjectUrl = `${s3Endpoint}/${state.objectStorageBucket}/${stored.storageKey}`;
    expect((await fetch(adapterObjectUrl)).status).toBe(403);
    const adapterGet = await signedFetch({ method: 'GET', url: adapterObjectUrl, credentials: s3Credentials });
    expect(adapterGet.status).toBe(200);
    const adapterBytes = new Uint8Array(await adapterGet.arrayBuffer());
    expect(createHash('sha256').update(adapterBytes).digest('hex')).toBe(stored.sha256);
    expect(adapterBytes.byteLength).toBe(stored.byteSize);
    expect(adapterGet.headers.get('content-type')).toBe(stored.contentType);
    expect(adapterGet.headers.get('x-amz-meta-sha256')).toBe(stored.sha256);
    expect(adapterGet.headers.get('x-amz-meta-bytesize')).toBe(String(stored.byteSize));

    // Original bytes must be unchanged after the rejected re-PUT
    const reRead = await signedFetch({
      method: 'GET',
      url: objectUrl,
      credentials: s3Credentials,
    });
    expect(reRead.status).toBe(200);
    const reReadSha256 = createHash('sha256')
      .update(new Uint8Array(await reRead.arrayBuffer()))
      .digest('hex');
    expect(reReadSha256).toBe(source.rawSnapshot.sha256);
  });
});

describe('Source file-upload capture and quarantine (M2-SRC-002)', () => {
  it('captures a .txt upload as an uploaded_text Source with an immutable text/plain snapshot', async () => {
    const state = requireState();
    const cookie = await createSession(state, OWNER_USER_ID);
    const pkg = await createPackage(state, cookie, 'Upload txt package');
    const fileBytes = new TextEncoder().encode('Field notes from the trail.');

    const response = await uploadSourceRequest(state, cookie, pkg.id, {
      fileName: 'trail-notes.txt',
      bytes: fileBytes,
      fileType: 'text/plain',
    });
    expect(response.status).toBe(201);
    const body = (await response.json()) as { data: { source: SourceResource } };
    expect(validateSourceResponse(body), JSON.stringify(validateSourceResponse.errors)).toBe(true);
    const source = body.data.source;

    expect(source.sourceType).toBe('uploaded_text');
    expect(source.captureType).toBe('uploaded_text');
    expect(source.role).toBe('primary');
    expect(source.label).toBe('trail-notes');
    expect(source.rawSnapshot.contentType).toBe('text/plain; charset=utf-8');
    expect(source.rawSnapshot.byteSize).toBe(fileBytes.byteLength);
    expect(source.rawSnapshot.sha256).toBe(createHash('sha256').update(fileBytes).digest('hex'));
    expect(source.approvedVersionId).toBeNull();

    // The Working Copy review body equals the validated decoded text.
    const wcResponse = await fetch(
      `${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/working-copy`,
      { headers: { cookie, origin: state.webOrigin } },
    );
    expect(wcResponse.status).toBe(200);
    const wcBody = (await wcResponse.json()) as { data: { workingCopy: { body: { text: string } } } };
    expect(wcBody.data.workingCopy.body.text).toBe('Field notes from the trail.');
  });

  it('captures a .md upload with text/markdown snapshot and supports edit, version, and approval', async () => {
    const state = requireState();
    const cookie = await createSession(state, OWNER_USER_ID);
    const pkg = await createPackage(state, cookie, 'Upload md lifecycle package');
    const fileBytes = new TextEncoder().encode('# Draft\n\nOriginal upload body.');

    const response = await uploadSourceRequest(state, cookie, pkg.id, {
      fileName: 'draft.md',
      bytes: fileBytes,
      fileType: 'text/markdown',
      role: 'primary',
      label: 'Explicit label',
    });
    expect(response.status).toBe(201);
    const body = (await response.json()) as { data: { source: SourceResource } };
    const source = body.data.source;
    expect(source.rawSnapshot.contentType).toBe('text/markdown; charset=utf-8');
    expect(source.label).toBe('Explicit label');

    // Edit the Working Copy.
    const editResponse = await fetch(
      `${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/working-copy`,
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
        body: JSON.stringify({ expectedRevision: 1, body: { text: '# Draft\n\nReviewed upload body.' } }),
      },
    );
    expect(editResponse.status).toBe(200);

    // Create an immutable Version.
    const versionResponse = await fetch(
      `${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/versions`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
        body: JSON.stringify({ expectedRevision: 2 }),
      },
    );
    expect(versionResponse.status).toBe(201);
    const versionBody = (await versionResponse.json()) as { data: { version: SourceVersionResource } };
    expect(versionBody.data.version.versionNumber).toBe(1);
    expect(versionBody.data.version.schemaVersion).toBe('source/normalized/v1');
    expect(versionBody.data.version.contentHash).toMatch(/^[0-9a-f]{64}$/);

    // Approve the exact Version.
    const approveResponse = await fetch(
      `${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/approval`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
        body: JSON.stringify({ versionId: versionBody.data.version.id }),
      },
    );
    expect(approveResponse.status).toBe(200);
    const approveBody = (await approveResponse.json()) as { data: SourceApprovalResource };
    expect(validateApprovalResponse(approveBody), JSON.stringify(validateApprovalResponse.errors)).toBe(true);
    expect(approveBody.data.head.approvedVersionId).toBe(versionBody.data.version.id);

    // Duplicate approval fails closed.
    const duplicate = await fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/approval`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
      body: JSON.stringify({ versionId: versionBody.data.version.id }),
    });
    expect(duplicate.status).toBe(409);
  });

  it('preserves exact original bytes in the snapshot while stripping only the BOM from the review text', async () => {
    const state = requireState();
    const cookie = await createSession(state, OWNER_USER_ID);
    const pkg = await createPackage(state, cookie, 'Upload BOM CRLF package');
    const fileBytes = new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode('bom line\r\nsecond line')]);

    const response = await uploadSourceRequest(state, cookie, pkg.id, {
      fileName: 'bom.txt',
      bytes: fileBytes,
      fileType: 'application/octet-stream',
    });
    expect(response.status).toBe(201);
    const body = (await response.json()) as { data: { source: SourceResource } };
    const source = body.data.source;
    // Snapshot covers the exact original bytes including BOM and CRLF.
    expect(source.rawSnapshot.byteSize).toBe(fileBytes.byteLength);
    expect(source.rawSnapshot.sha256).toBe(createHash('sha256').update(fileBytes).digest('hex'));

    const wcResponse = await fetch(
      `${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/${source.id}/working-copy`,
      { headers: { cookie, origin: state.webOrigin } },
    );
    const wcBody = (await wcResponse.json()) as { data: { workingCopy: { body: { text: string } } } };
    // BOM stripped from the normalized text; CRLF preserved.
    expect(wcBody.data.workingCopy.body.text).toBe('bom line\r\nsecond line');
  });

  it('denies every quarantine violation with a stable keyword and zero Object Store side effect', async () => {
    const state = requireState();
    const cookie = await createSession(state, OWNER_USER_ID);
    const pkg = await createPackage(state, cookie, 'Upload quarantine package');
    const objectCountBefore = await bucketObjectCount(state);

    const denialCases: ReadonlyArray<{
      readonly name: string;
      readonly options: Parameters<typeof uploadSourceRequest>[3];
      readonly keyword: string;
    }> = [
      {
        name: 'disallowed extension',
        options: { fileName: 'virus.exe', bytes: new TextEncoder().encode('x') },
        keyword: 'upload-file-extension',
      },
      {
        name: 'double extension ending disallowed',
        options: { fileName: 'notes.md.exe', bytes: new TextEncoder().encode('x') },
        keyword: 'upload-file-extension',
      },
      {
        name: 'missing extension',
        options: { fileName: 'notes', bytes: new TextEncoder().encode('x') },
        keyword: 'upload-file-extension',
      },
      {
        name: 'overlong filename',
        options: { fileName: `${'n'.repeat(252)}.txt`, bytes: new TextEncoder().encode('x') },
        keyword: 'upload-file-name',
      },
      {
        name: 'inconsistent declared media type',
        options: { fileName: 'page.md', fileType: 'text/html', bytes: new TextEncoder().encode('x') },
        keyword: 'upload-media-type',
      },
      {
        name: 'invalid UTF-8 bytes',
        options: { fileName: 'bad.txt', bytes: new Uint8Array([0xff, 0xfe, 0x41]) },
        keyword: 'upload-encoding',
      },
      {
        name: 'NUL byte in content',
        options: { fileName: 'nul.txt', bytes: new Uint8Array([0x61, 0x00, 0x62]) },
        keyword: 'upload-encoding',
      },
      {
        name: 'empty file',
        options: { fileName: 'empty.txt', bytes: new Uint8Array(0) },
        keyword: 'upload-file-empty',
      },
      {
        name: 'whitespace-only file',
        options: { fileName: 'ws.txt', bytes: new TextEncoder().encode('  \n\t ') },
        keyword: 'upload-file-empty',
      },
      {
        name: 'oversized file',
        options: { fileName: 'big.txt', bytes: new TextEncoder().encode('a'.repeat(100_001)) },
        keyword: 'upload-file-size',
      },
      {
        name: 'invalid role field',
        options: { fileName: 'ok.txt', role: 'reference' },
        keyword: 'upload-field-invalid',
      },
      {
        name: 'unknown extra field',
        options: { fileName: 'ok.txt', extraFields: { sourceType: 'pasted_text' } },
        keyword: 'upload-field-invalid',
      },
      {
        name: 'overlong label field',
        options: { fileName: 'ok.txt', label: 'x'.repeat(201) },
        keyword: 'upload-field-invalid',
      },
    ];

    for (const testCase of denialCases) {
      const response = await uploadSourceRequest(state, cookie, pkg.id, testCase.options);
      expect(response.status, `quarantine case unexpectedly accepted: ${testCase.name}`).toBe(422);
      await expectUploadDenial(response, testCase.keyword);
    }

    // Adversarial filenames that a spec-compliant client (undici FormData)
    // sanitizes away before sending must be posted as raw multipart so the
    // SERVER-side quarantine is exercised. (Path separators in both directions
    // are additionally stripped at the transport boundary by busboy's basename
    // rule and are asserted separately; NUL/control-character filenames
    // cannot traverse HTTP headers at all and remain Core unit coverage.)
    const rawFilenameCases: ReadonlyArray<{ readonly name: string; readonly fileName: string }> = [
      { name: 'empty filename', fileName: '' },
    ];
    for (const testCase of rawFilenameCases) {
      const response = await rawMultipartUpload(state, cookie, pkg.id, testCase.fileName);
      expect(response.status, `raw quarantine case unexpectedly accepted: ${testCase.name}`).toBe(422);
      await expectUploadDenial(response, 'upload-file-name');
    }

    // Missing file part.
    await expectUploadDenial(
      await uploadSourceRequest(state, cookie, pkg.id, { omitFile: true }),
      'upload-file-missing',
    );
    // Missing role field.
    await expectUploadDenial(
      await uploadSourceRequest(state, cookie, pkg.id, { fileName: 'ok.txt', omitRole: true }),
      'upload-field-invalid',
    );
    // Two file parts.
    const twoFiles = new FormData();
    twoFiles.set('file', new Blob([new TextEncoder().encode('one')]), 'one.txt');
    twoFiles.append('file', new Blob([new TextEncoder().encode('two')]), 'two.txt');
    twoFiles.set('role', 'primary');
    await expectUploadDenial(
      await fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/upload`, {
        method: 'POST',
        headers: { cookie, origin: state.webOrigin },
        body: twoFiles,
      }),
      'upload-too-many-files',
    );
    // Non-multipart body against the upload route.
    await expectUploadDenial(
      await fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources/upload`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
        body: JSON.stringify({ role: 'primary' }),
      }),
      'upload-media-type',
    );

    // Denied uploads leave no Object Store objects and no Sources behind.
    expect(await bucketObjectCount(state)).toBe(objectCountBefore);
    const listResponse = await fetch(`${state.apiOrigin}/v1/content-packages/${pkg.id}/sources`, {
      headers: { cookie, origin: state.webOrigin },
    });
    const listBody = (await listResponse.json()) as { data: { items: ReadonlyArray<SourceListItem> } };
    expect(listBody.data.items).toHaveLength(0);
  });

  it('never honors path traversal: the transport basename rule yields safe basename labels for both separators', async () => {
    const state = requireState();
    const cookie = await createSession(state, OWNER_USER_ID);
    const pkg = await createPackage(state, cookie, 'Upload traversal probe package');

    const forward = await rawMultipartUpload(state, cookie, pkg.id, '../evil.txt');
    expect(forward.status).toBe(201);
    const forwardBody = (await forward.json()) as { data: { source: SourceResource } };
    expect(forwardBody.data.source.label).toBe('evil');
    expect(forwardBody.data.source.captureType).toBe('uploaded_text');

    const backslash = await rawMultipartUploadWithRole(state, cookie, pkg.id, 'dir\\evil2.txt', 'supporting');
    expect(backslash.status).toBe(201);
    const backslashJson = (await backslash.json()) as { data: { source: SourceResource } };
    expect(backslashJson.data.source.label).toBe('evil2');
    expect(backslashJson.data.source.role).toBe('supporting');
  });

  it('requires a Session, enforces owner scope, and rejects archived packages on upload', async () => {
    const state = requireState();
    const cookie = await createSession(state, OWNER_USER_ID);
    const pkg = await createPackage(state, cookie, 'Upload auth package');

    const unauthenticated = await uploadSourceRequest(state, 'contentos_session=invalid-credential', pkg.id, {
      fileName: 'ok.txt',
    });
    expect(unauthenticated.status).toBe(401);

    const otherOwnerCookie = await createSession(state, '00000000-0000-4000-8000-000000000004');
    const crossOwner = await uploadSourceRequest(state, otherOwnerCookie, pkg.id, { fileName: 'ok.txt' });
    expect(crossOwner.status).toBe(404);

    await archivePackage(state, cookie, pkg);
    const archived = await uploadSourceRequest(state, cookie, pkg.id, { fileName: 'ok.txt' });
    expect(archived.status).toBe(409);
    expect(((await archived.json()) as { error: { code: string } }).error.code).toBe('CONTENT_PACKAGE_STATE_CONFLICT');
  });

  it('enforces role limits across mixed capture types', async () => {
    const state = requireState();
    const cookie = await createSession(state, OWNER_USER_ID);
    const pkg = await createPackage(state, cookie, 'Upload mixed role package');

    await captureSource(state, cookie, pkg.id, 'primary', 'Pasted primary body');
    const secondPrimary = await uploadSourceRequest(state, cookie, pkg.id, {
      fileName: 'second.md',
      role: 'primary',
    });
    expect(secondPrimary.status).toBe(409);
    expect(((await secondPrimary.json()) as { error: { code: string } }).error.code).toBe('SOURCE_ROLE_LIMIT_EXCEEDED');

    const supporting = await uploadSourceRequest(state, cookie, pkg.id, {
      fileName: 'supporting.md',
      role: 'supporting',
    });
    expect(supporting.status).toBe(201);
  });
});
