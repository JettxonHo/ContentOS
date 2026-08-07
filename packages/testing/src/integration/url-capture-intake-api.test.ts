import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { composeExec } from './compose.js';
import { readComposeCredentials, requireState, type SmokeState } from './env.js';
import { signedFetch } from './sigv4.js';

const GATEWAY_SECRET_HEADER = 'x-contentos-fetcher-gateway-secret';
const CLAIM_HEADER = 'x-contentos-fetcher-claim';

async function session(state: SmokeState, ownerUserId: string): Promise<string> {
  const credential = randomBytes(32).toString('base64url');
  const hash = createHash('sha256').update(credential).digest('hex');
  const inserted = await composeExec(state, 'postgres', [
    'sh',
    '-c',
    `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -tAc "INSERT INTO auth_sessions (id, credential_hash, owner_user_id, created_at, expires_at) VALUES ('${randomUUID()}', '${hash}', '${ownerUserId}', now(), now() + interval '1 hour')"`,
  ]);
  expect(inserted.ok).toBe(true);
  return `contentos_session=${credential}`;
}

async function packageFor(state: SmokeState, cookie: string): Promise<{ id: string; revision: number }> {
  const response = await fetch(`${state.apiOrigin}/v1/content-packages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
    body: JSON.stringify({ title: 'URL intake projection', contentMode: 'deferred', requestedOutputs: ['blog'] }),
  });
  expect(response.status).toBe(201);
  return ((await response.json()) as { data: { contentPackage: { id: string; revision: number } } }).data
    .contentPackage;
}

async function cleanup(state: SmokeState, packageId: string): Promise<void> {
  const result = await composeExec(state, 'postgres', [
    'sh',
    '-c',
    `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "BEGIN; DELETE FROM url_capture_results WHERE content_package_id = '${packageId}'; DELETE FROM source_approvals WHERE source_id IN (SELECT id FROM sources WHERE content_package_id = '${packageId}'); DELETE FROM source_versions WHERE source_id IN (SELECT id FROM sources WHERE content_package_id = '${packageId}'); DELETE FROM source_heads WHERE source_id IN (SELECT id FROM sources WHERE content_package_id = '${packageId}'); DELETE FROM source_working_copies WHERE source_id IN (SELECT id FROM sources WHERE content_package_id = '${packageId}'); DELETE FROM source_raw_snapshots WHERE source_id IN (SELECT id FROM sources WHERE content_package_id = '${packageId}'); DELETE FROM sources WHERE content_package_id = '${packageId}'; DELETE FROM workflow_outbox_records WHERE content_package_id = '${packageId}'; DELETE FROM workflow_tasks WHERE content_package_id = '${packageId}'; DELETE FROM url_capture_requests WHERE content_package_id = '${packageId}'; DELETE FROM url_source_references WHERE content_package_id = '${packageId}'; ALTER TABLE workflow_events DISABLE TRIGGER workflow_events_immutable_trigger; DELETE FROM workflow_events WHERE content_package_id = '${packageId}'; ALTER TABLE workflow_events ENABLE TRIGGER workflow_events_immutable_trigger; DELETE FROM workflow_nodes WHERE content_package_id = '${packageId}'; DELETE FROM workflow_instances WHERE content_package_id = '${packageId}'; DELETE FROM content_packages WHERE id = '${packageId}'; COMMIT;"`,
  ]);
  if (!result.ok) throw new Error(`owned URL intake cleanup failed: ${result.stderr}`);
}

async function credentials(state: SmokeState): Promise<{ readonly gatewaySecret: string }> {
  const values = readComposeCredentials(state.envFile);
  const gatewaySecret = values.CONTENTOS_FETCHER_GATEWAY_SECRET;
  if (!gatewaySecret) throw new Error('gateway credential is absent from the owned test environment');
  return { gatewaySecret };
}

async function claim(
  state: SmokeState,
  taskId: string,
  gatewaySecret: string,
): Promise<{ readonly claim: string; readonly attemptNumber: number }> {
  const response = await fetch(`${state.apiOrigin}/internal/fetcher/tasks/${taskId}/claim`, {
    method: 'POST',
    headers: { [GATEWAY_SECRET_HEADER]: gatewaySecret, 'x-contentos-fetcher-delivery-generation': '1' },
  });
  expect(response.status).toBe(200);
  return ((await response.json()) as { data: { claim: string; attemptNumber: number } }).data;
}

async function submitResult(
  state: SmokeState,
  taskId: string,
  claimValue: string,
  gatewaySecret: string,
  body: Record<string, unknown>,
): Promise<Response> {
  return fetch(`${state.apiOrigin}/internal/fetcher/tasks/${taskId}/result`, {
    method: 'POST',
    headers: {
      [GATEWAY_SECRET_HEADER]: gatewaySecret,
      [CLAIM_HEADER]: claimValue,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

async function placeSnapshotObject(
  state: SmokeState,
  taskId: string,
  attemptNumber: number,
): Promise<{
  readonly snapshotId: string;
  readonly storageKey: string;
  readonly sha256: string;
  readonly byteSize: number;
}> {
  const objectCredentials = readComposeCredentials(state.envFile);
  const accessKeyId = objectCredentials.OBJECT_STORAGE_ACCESS_KEY;
  const secretAccessKey = objectCredentials.OBJECT_STORAGE_SECRET_KEY;
  if (!accessKeyId || !secretAccessKey)
    throw new Error('object storage credentials are absent from the owned test environment');
  const snapshotId = randomUUID();
  const storageKey = `fetcher/url-capture/${taskId}/${attemptNumber}/raw/${snapshotId}`;
  const object = '<html><body>intake projection success fixture</body></html>';
  const sha256 = createHash('sha256').update(object).digest('hex');
  const byteSize = Buffer.byteLength(object);
  const put = await signedFetch({
    method: 'PUT',
    url: `http://127.0.0.1:${state.ports.objectStorage}/${state.objectStorageBucket}/${storageKey}`,
    credentials: { accessKeyId, secretAccessKey },
    body: object,
    headers: {
      'content-type': 'text/html',
      'x-amz-meta-sha256': sha256,
      'x-amz-meta-bytesize': String(byteSize),
      'x-amz-meta-immutable': 'true',
    },
  });
  expect(put.status).toBeLessThan(300);
  return { snapshotId, storageKey, sha256, byteSize };
}

async function deleteSnapshotObject(state: SmokeState, storageKey: string | undefined): Promise<void> {
  if (!storageKey) return;
  const objectCredentials = readComposeCredentials(state.envFile);
  const accessKeyId = objectCredentials.OBJECT_STORAGE_ACCESS_KEY;
  const secretAccessKey = objectCredentials.OBJECT_STORAGE_SECRET_KEY;
  if (!accessKeyId || !secretAccessKey) return;
  await signedFetch({
    method: 'DELETE',
    url: `http://127.0.0.1:${state.ports.objectStorage}/${state.objectStorageBucket}/${storageKey}`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

async function readFacts(state: SmokeState, packageId: string): Promise<string> {
  const result = await composeExec(state, 'postgres', [
    'sh',
    '-c',
    `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT json_build_object('packages',(SELECT count(*) FROM content_packages WHERE id='${packageId}'),'requests',(SELECT count(*) FROM url_capture_requests WHERE content_package_id='${packageId}'),'tasks',(SELECT count(*) FROM workflow_tasks WHERE content_package_id='${packageId}'),'results',(SELECT count(*) FROM url_capture_results WHERE content_package_id='${packageId}'),'sources',(SELECT count(*) FROM sources WHERE content_package_id='${packageId}'),'events',(SELECT count(*) FROM workflow_events WHERE content_package_id='${packageId}'))::text"`,
  ]);
  expect(result.ok).toBe(true);
  return result.stdout.trim();
}

describe('M2-WEB-001A durable URL intake API', () => {
  it('reads zero or one owner-scoped queued intake without mutating package state', async () => {
    const state = requireState();
    const owner = '00000000-0000-4000-8000-000000000001';
    const cookie = await session(state, owner);
    const contentPackage = await packageFor(state, cookie);
    const endpoint = `${state.apiOrigin}/v1/content-packages/${contentPackage.id}/url-capture-requests`;
    const beforeEmpty = await readFacts(state, contentPackage.id);
    const empty = await fetch(endpoint, { headers: { cookie } });
    expect(empty.status).toBe(200);
    expect(await empty.json()).toEqual({ data: { items: [] } });
    expect(await readFacts(state, contentPackage.id)).toBe(beforeEmpty);
    const privateUrl = 'https://example.test/owner-only-path';
    const submit = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie,
        origin: state.webOrigin,
        'idempotency-key': 'intake-key-000001',
      },
      body: JSON.stringify({
        expectedPackageRevision: contentPackage.revision,
        role: 'primary',
        submittedUrl: privateUrl,
      }),
    });
    expect(submit.status).toBe(201);
    const read = await fetch(endpoint, { headers: { cookie } });
    expect(read.status).toBe(200);
    expect(await read.json()).toEqual({
      data: {
        items: [
          {
            id: expect.any(String),
            role: 'primary',
            submittedUrl: privateUrl,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            status: 'queued',
            failure: null,
            sourceId: null,
          },
        ],
      },
    });
    const other = await session(state, '00000000-0000-4000-8000-000000000002');
    const crossOwner = await fetch(endpoint, { headers: { cookie: other } });
    const missing = await fetch(`${state.apiOrigin}/v1/content-packages/${randomUUID()}/url-capture-requests`, {
      headers: { cookie },
    });
    expect(crossOwner.status).toBe(404);
    expect(missing.status).toBe(404);
    const crossBody = (await crossOwner.json()) as { error: Record<string, unknown> };
    const missingBody = (await missing.json()) as { error: Record<string, unknown> };
    expect({ ...crossBody.error, correlationId: undefined }).toEqual({
      ...missingBody.error,
      correlationId: undefined,
    });
    expect((await fetch(endpoint)).status).toBe(401);
    expect(
      (await fetch(`${state.apiOrigin}/v1/content-packages/not-a-uuid/url-capture-requests`, { headers: { cookie } }))
        .status,
    ).toBe(422);
    await cleanup(state, contentPackage.id);
  });

  it('projects legitimate running, failed, and succeeded Gateway results and keeps archived history owner-scoped', async () => {
    const state = requireState();
    const owner = '00000000-0000-4000-8000-000000000001';
    const cookie = await session(state, owner);
    const contentPackage = await packageFor(state, cookie);
    const endpoint = `${state.apiOrigin}/v1/content-packages/${contentPackage.id}/url-capture-requests`;
    let storageKey: string | undefined;
    try {
      const submittedUrl = 'https://example.test/owner-only-lifecycle';
      const create = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          cookie,
          origin: state.webOrigin,
          'idempotency-key': 'intake-lifecycle-1',
        },
        body: JSON.stringify({ expectedPackageRevision: contentPackage.revision, role: 'primary', submittedUrl }),
      });
      expect(create.status).toBe(201);
      const taskId = ((await create.json()) as { data: { urlCaptureRequest: { taskId: string } } }).data
        .urlCaptureRequest.taskId;
      const dispatched = await composeExec(state, 'postgres', [
        'sh',
        '-c',
        `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "UPDATE workflow_outbox_records SET state = 'dispatched', last_dispatch_at = created_at, dispatched_at = created_at WHERE task_id = '${taskId}'"`,
      ]);
      expect(dispatched.ok).toBe(true);
      const { gatewaySecret } = await credentials(state);
      const leased = await claim(state, taskId, gatewaySecret);
      const running = await fetch(endpoint, { headers: { cookie } });
      expect(running.status).toBe(200);
      expect(await running.json()).toEqual({
        data: {
          items: [
            {
              id: expect.any(String),
              role: 'primary',
              submittedUrl,
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              status: 'running',
              failure: null,
              sourceId: null,
            },
          ],
        },
      });

      const failed = await submitResult(state, taskId, leased.claim, gatewaySecret, {
        resultVersion: 'fetcher-result/v1',
        attemptNumber: leased.attemptNumber,
        outcome: 'failed',
        category: 'fetch_failed',
        code: 'FETCH_FAILED',
      });
      expect(failed.status).toBe(200);
      const failedProjection = await fetch(endpoint, { headers: { cookie } });
      expect(await failedProjection.json()).toEqual({
        data: {
          items: [
            {
              submittedUrl,
              id: expect.any(String),
              role: 'primary',
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              status: 'failed',
              failure: { category: 'fetch_failed', code: 'FETCH_FAILED' },
              sourceId: null,
            },
          ],
        },
      });

      const archived = await fetch(`${state.apiOrigin}/v1/content-packages/${contentPackage.id}/archive`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
        body: JSON.stringify({ expectedRevision: contentPackage.revision }),
      });
      expect(archived.status).toBe(200);
      const archivedProjection = await fetch(endpoint, { headers: { cookie } });
      expect(archivedProjection.status).toBe(200);
      expect(await archivedProjection.json()).toMatchObject({ data: { items: [{ status: 'failed', submittedUrl }] } });
    } finally {
      await deleteSnapshotObject(state, storageKey);
      await cleanup(state, contentPackage.id);
    }
  });

  it('projects a legitimate successful Result once with its formal public URL Source binding', async () => {
    const state = requireState();
    const cookie = await session(state, '00000000-0000-4000-8000-000000000001');
    const contentPackage = await packageFor(state, cookie);
    const endpoint = `${state.apiOrigin}/v1/content-packages/${contentPackage.id}/url-capture-requests`;
    let storageKey: string | undefined;
    try {
      const submittedUrl = 'https://example.test/owner-only-success';
      const create = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          cookie,
          origin: state.webOrigin,
          'idempotency-key': 'intake-success-1',
        },
        body: JSON.stringify({ expectedPackageRevision: contentPackage.revision, role: 'primary', submittedUrl }),
      });
      expect(create.status).toBe(201);
      const taskId = ((await create.json()) as { data: { urlCaptureRequest: { taskId: string } } }).data
        .urlCaptureRequest.taskId;
      const dispatched = await composeExec(state, 'postgres', [
        'sh',
        '-c',
        `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "UPDATE workflow_outbox_records SET state = 'dispatched', last_dispatch_at = created_at, dispatched_at = created_at WHERE task_id = '${taskId}'"`,
      ]);
      expect(dispatched.ok).toBe(true);
      const { gatewaySecret } = await credentials(state);
      const leased = await claim(state, taskId, gatewaySecret);
      const snapshot = await placeSnapshotObject(state, taskId, leased.attemptNumber);
      storageKey = snapshot.storageKey;
      const completed = await submitResult(state, taskId, leased.claim, gatewaySecret, {
        resultVersion: 'fetcher-result/v1',
        attemptNumber: leased.attemptNumber,
        outcome: 'succeeded',
        snapshot: {
          snapshotId: snapshot.snapshotId,
          storageKey: snapshot.storageKey,
          sha256: snapshot.sha256,
          byteSize: snapshot.byteSize,
          contentType: 'text/html',
          contentEncoding: 'identity',
        },
        capture: {
          finalUrl: 'https://example.test/final',
          redirects: [],
          responseStatus: 200,
          encodedByteSize: snapshot.byteSize,
          decodedByteSize: snapshot.byteSize,
        },
        candidate: { schemaVersion: 'source/normalized/v1', text: 'source intake success candidate' },
      });
      expect(completed.status).toBe(200);
      const result = (await completed.json()) as { data: { sourceId: string } };
      const projection = await fetch(endpoint, { headers: { cookie } });
      expect(projection.status).toBe(200);
      expect(await projection.json()).toEqual({
        data: {
          items: [
            {
              id: expect.any(String),
              role: 'primary',
              submittedUrl,
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              status: 'succeeded',
              failure: null,
              sourceId: result.data.sourceId,
            },
          ],
        },
      });
      const sources = await fetch(`${state.apiOrigin}/v1/content-packages/${contentPackage.id}/sources?limit=20`, {
        headers: { cookie },
      });
      expect(await sources.json()).toMatchObject({
        data: { items: [{ id: result.data.sourceId, sourceType: 'public_url', role: 'primary' }] },
      });
      const malformed = await composeExec(state, 'postgres', [
        'sh',
        '-c',
        `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "UPDATE workflow_tasks SET state = 'failed', updated_at = now() WHERE id = '${taskId}'"`,
      ]);
      expect(malformed.ok).toBe(true);
      const inconsistent = await fetch(endpoint, { headers: { cookie } });
      expect(inconsistent.status).toBe(500);
      const inconsistentBody = await inconsistent.text();
      expect(inconsistentBody).not.toContain(submittedUrl);
      expect(inconsistentBody).not.toMatch(/workflow_tasks|SELECT|stack/i);
      const apiLog = readFileSync(join(state.runDir, 'api.log'), 'utf8');
      expect(apiLog).not.toContain(submittedUrl);
      expect(apiLog).not.toMatch(/workflow_tasks|postgresql:\/\/|\bSELECT\b|stack/i);
      const repaired = await composeExec(state, 'postgres', [
        'sh',
        '-c',
        `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "UPDATE workflow_tasks SET state = 'succeeded', updated_at = now() WHERE id = '${taskId}'"`,
      ]);
      expect(repaired.ok).toBe(true);
    } finally {
      await deleteSnapshotObject(state, storageKey);
      await cleanup(state, contentPackage.id);
    }
  });
});
