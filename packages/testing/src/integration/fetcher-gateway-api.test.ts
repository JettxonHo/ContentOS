import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import net from 'node:net';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { composeExec } from './compose.js';
import { readComposeCredentials, requireState, type SmokeState } from './env.js';

const SECRET_HEADER = 'x-contentos-fetcher-gateway-secret';
const CLAIM_HEADER = 'x-contentos-fetcher-claim';
const OWNER_USER_ID = '00000000-0000-4000-8000-000000000001';

interface GatewayFixture {
  readonly packageId: string;
  readonly taskId: string;
  readonly outboxId: string;
  readonly submittedUrl: string;
  readonly cookie: string;
}

interface RawHttpResponse {
  readonly status: number;
  readonly body: string;
}

function credentials(state: SmokeState): { readonly gatewaySecret: string } {
  const values = readComposeCredentials(state.envFile);
  if (!values.CONTENTOS_FETCHER_GATEWAY_SECRET) {
    throw new Error('gateway integration credentials are incomplete');
  }
  return { gatewaySecret: values.CONTENTOS_FETCHER_GATEWAY_SECRET };
}

async function createSession(state: SmokeState): Promise<string> {
  const rawCredential = randomBytes(32).toString('base64url');
  const credentialHash = createHash('sha256').update(rawCredential).digest('hex');
  const inserted = await composeExec(state, 'postgres', [
    'sh',
    '-c',
    `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -tAc "INSERT INTO auth_sessions (id, credential_hash, owner_user_id, created_at, expires_at) VALUES ('${randomUUID()}', '${credentialHash}', '${OWNER_USER_ID}', now(), now() + interval '1 hour')"`,
  ]);
  expect(inserted.ok).toBe(true);
  return `contentos_session=${rawCredential}`;
}

async function createFixture(state: SmokeState): Promise<GatewayFixture> {
  const cookie = await createSession(state);
  const packageResponse = await fetch(`${state.apiOrigin}/v1/content-packages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
    body: JSON.stringify({ title: 'Fetcher Gateway package', requestedOutputs: ['blog', 'xiaohongshu'] }),
  });
  expect(packageResponse.status).toBe(201);
  const packageBody = (await packageResponse.json()) as { data: { contentPackage: { id: string; revision: number } } };
  const packageId = packageBody.data.contentPackage.id;
  const submittedUrl = 'https://example.com/gateway/private';
  const taskResponse = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/url-capture-requests`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': randomUUID().replaceAll('-', '').slice(0, 16),
      cookie,
      origin: state.webOrigin,
    },
    body: JSON.stringify({
      expectedPackageRevision: packageBody.data.contentPackage.revision,
      role: 'primary',
      submittedUrl,
    }),
  });
  expect(taskResponse.status).toBe(201);
  const taskBody = (await taskResponse.json()) as { data: { urlCaptureRequest: { taskId: string } } };
  const dispatched = await composeExec(state, 'postgres', [
    'sh',
    '-c',
    `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "UPDATE workflow_outbox_records SET state = 'dispatched', last_dispatch_at = created_at, dispatched_at = created_at WHERE task_id = '${taskBody.data.urlCaptureRequest.taskId}'"`,
  ]);
  expect(dispatched.ok).toBe(true);
  const outbox = await composeExec(state, 'postgres', [
    'sh',
    '-c',
    `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -tAc "SELECT id FROM workflow_outbox_records WHERE task_id = '${taskBody.data.urlCaptureRequest.taskId}'"`,
  ]);
  expect(outbox.ok).toBe(true);
  const outboxId = outbox.stdout.trim();
  expect(outboxId).toMatch(/^[0-9a-f-]{36}$/);
  return { packageId, taskId: taskBody.data.urlCaptureRequest.taskId, outboxId, submittedUrl, cookie };
}

async function cleanup(state: SmokeState, packageId: string): Promise<void> {
  const deleted = await composeExec(state, 'postgres', [
    'sh',
    '-c',
    `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "BEGIN; DELETE FROM workflow_outbox_records WHERE content_package_id = '${packageId}'; DELETE FROM workflow_tasks WHERE content_package_id = '${packageId}'; DELETE FROM url_capture_requests WHERE content_package_id = '${packageId}'; DELETE FROM url_source_references WHERE content_package_id = '${packageId}'; ALTER TABLE workflow_events DISABLE TRIGGER workflow_events_immutable_trigger; DELETE FROM workflow_events WHERE content_package_id = '${packageId}'; ALTER TABLE workflow_events ENABLE TRIGGER workflow_events_immutable_trigger; DELETE FROM workflow_nodes WHERE content_package_id = '${packageId}'; DELETE FROM workflow_instances WHERE content_package_id = '${packageId}'; DELETE FROM content_packages WHERE id = '${packageId}'; COMMIT;"`,
  ]);
  expect(deleted.ok).toBe(true);
}

async function gatewayRequest(
  state: SmokeState,
  path: string,
  headers: Record<string, string> = {},
  body?: string,
): Promise<Response> {
  return fetch(`${state.apiOrigin}${path}`, {
    method: 'POST',
    headers,
    ...(body === undefined ? {} : { body }),
  });
}

function responseStatus(rawResponse: string): number {
  const status = /^HTTP\/\d(?:\.\d)?\s+(\d{3})/m.exec(rawResponse)?.[1];
  if (status === undefined) throw new Error('raw Gateway response status is missing');
  return Number(status);
}

async function rawHttpPost(
  state: SmokeState,
  path: string,
  headers: readonly (readonly [string, string])[],
  body = '',
): Promise<RawHttpResponse> {
  const origin = new URL(state.apiOrigin);
  if (origin.protocol !== 'http:') throw new Error('Gateway integration requires loopback HTTP');
  const hasTransferEncoding = headers.some(([name]) => name.toLowerCase() === 'transfer-encoding');
  const hasContentLength = headers.some(([name]) => name.toLowerCase() === 'content-length');
  const wireBody = hasTransferEncoding
    ? body.length === 0
      ? '0\r\n\r\n'
      : `${Buffer.byteLength(body).toString(16)}\r\n${body}\r\n0\r\n\r\n`
    : body;
  const requestHeaders = [
    `Host: ${origin.host}`,
    'Connection: close',
    ...headers.map(([name, value]) => `${name}: ${value}`),
    ...(hasTransferEncoding || hasContentLength ? [] : [`Content-Length: ${Buffer.byteLength(body)}`]),
  ];
  const request = `POST ${path} HTTP/1.1\r\n${requestHeaders.join('\r\n')}\r\n\r\n${wireBody}`;

  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: origin.hostname, port: Number(origin.port) }, () => {
      socket.write(request);
    });
    let response = '';
    socket.setEncoding('utf8');
    socket.setTimeout(10_000, () => socket.destroy(new Error('raw Gateway request timed out')));
    socket.on('data', (chunk: string) => {
      response += chunk;
    });
    socket.on('error', reject);
    socket.on('end', () => {
      const separator = response.indexOf('\r\n\r\n');
      resolve({
        status: responseStatus(response),
        body: separator === -1 ? response : response.slice(separator + 4),
      });
    });
  });
}

async function gatewayFacts(state: SmokeState, fixture: GatewayFixture): Promise<string> {
  const databaseFacts = await composeExec(state, 'postgres', [
    'sh',
    '-c',
    `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT json_build_object('task', (SELECT json_build_object('state', state, 'attempt', claim_attempt_number, 'claimHashLength', length(claim_hash::text), 'claimedBy', claimed_by, 'leaseStartedAt', lease_started_at, 'leaseExpiresAt', lease_expires_at, 'leaseHeartbeatAt', lease_heartbeat_at, 'updatedAt', updated_at) FROM workflow_tasks WHERE id = '${fixture.taskId}'), 'outbox', (SELECT json_build_object('state', state, 'generation', delivery_generation, 'attempts', dispatch_attempt_count, 'dispatchLeaseExpiresAt', dispatch_lease_expires_at, 'lastDispatchAt', last_dispatch_at, 'dispatchedAt', dispatched_at, 'updatedAt', updated_at) FROM workflow_outbox_records WHERE task_id = '${fixture.taskId}'), 'references', (SELECT count(*) FROM url_source_references WHERE content_package_id = '${fixture.packageId}'), 'requests', (SELECT count(*) FROM url_capture_requests WHERE content_package_id = '${fixture.packageId}'), 'sources', (SELECT count(*) FROM sources WHERE content_package_id = '${fixture.packageId}'), 'events', (SELECT count(*) FROM workflow_events WHERE content_package_id = '${fixture.packageId}'))::text"`,
  ]);
  expect(databaseFacts.ok).toBe(true);
  const queueFacts = await composeExec(state, 'redis', [
    'sh',
    '-c',
    `redis-cli --no-auth-warning -a "$REDIS_PASSWORD" --scan --pattern 'bull:contentos-fetcher:*'`,
  ]);
  expect(queueFacts.ok).toBe(true);
  const queueKeys = queueFacts.stdout
    .split('\n')
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .sort();
  return JSON.stringify({ database: databaseFacts.stdout.trim(), queueKeys });
}

function apiLog(state: SmokeState): string {
  return readFileSync(join(state.runDir, 'api.log'), 'utf8');
}

function expectRedactedApiLog(state: SmokeState, forbiddenValues: readonly string[]): void {
  const log = apiLog(state);
  for (const value of forbiddenValues) {
    expect(log).not.toContain(value);
  }
  expect(log).not.toContain(SECRET_HEADER);
  expect(log).not.toContain(CLAIM_HEADER);
  expect(log).not.toMatch(/postgresql:\/\//i);
  expect(log).not.toMatch(/\b(?:SELECT|INSERT|UPDATE|DELETE)\b/i);
  expect(log).not.toMatch(/stack/i);
}

async function expectRejectedWithoutEffects(
  state: SmokeState,
  fixture: GatewayFixture,
  before: string,
  responsePromise: Promise<Response | RawHttpResponse>,
  status: number,
  code: string,
  forbiddenValues: readonly string[] = [],
): Promise<void> {
  const response = await responsePromise;
  expect(response.status).toBe(status);
  const responseBody = response instanceof Response ? await response.text() : response.body;
  expect(responseBody).toContain(code);
  expect(responseBody).toContain(status === 422 ? 'Invalid Gateway request' : 'Fetcher operation is unavailable');
  for (const value of [
    fixture.submittedUrl,
    fixture.packageId,
    fixture.outboxId,
    OWNER_USER_ID,
    fixture.taskId,
    ...forbiddenValues,
  ]) {
    expect(responseBody).not.toContain(value);
  }
  expect(responseBody).not.toMatch(/workflow_(?:tasks|outbox_records)|owner_user_id|postgresql:\/\//i);
  expect(await gatewayFacts(state, fixture)).toBe(before);
}

describe('M2-WF-003B private Fetcher Gateway API', () => {
  it('rejects real malformed or duplicate-header Claim requests before any state write', async () => {
    const state = requireState();
    const { gatewaySecret } = credentials(state);
    const fixture = await createFixture(state);
    const path = `/internal/fetcher/tasks/${fixture.taskId}/claim`;
    const wrongSecretMarker = 'wrong-fetcher-gateway-secret-marker';
    const malformedBodyMarker = 'malformed-fetcher-gateway-body-marker';
    const malformedJson = `{"payload":"${malformedBodyMarker}"`;
    try {
      const before = await gatewayFacts(state, fixture);
      const unauthorized = await Promise.all([
        gatewayRequest(state, path),
        gatewayRequest(state, path, { [SECRET_HEADER]: wrongSecretMarker }),
        gatewayRequest(state, path, { [SECRET_HEADER]: 'malformed value' }),
        gatewayRequest(state, path, { cookie: fixture.cookie }),
      ]);
      for (const response of unauthorized) {
        expect(response.status).toBe(401);
        const body = await response.text();
        expect(body).toContain('FETCHER_GATEWAY_UNAUTHENTICATED');
        expect(body).not.toContain(fixture.submittedUrl);
        expect(await gatewayFacts(state, fixture)).toBe(before);
      }

      await expectRejectedWithoutEffects(
        state,
        fixture,
        before,
        rawHttpPost(
          state,
          path,
          [
            [SECRET_HEADER, gatewaySecret],
            ['content-type', 'application/json'],
          ],
          malformedJson,
        ),
        422,
        'INVALID_GATEWAY_REQUEST',
        [gatewaySecret, malformedBodyMarker],
      );

      const duplicateSecret = await rawHttpPost(state, path, [
        [SECRET_HEADER, gatewaySecret],
        [SECRET_HEADER, gatewaySecret],
      ]);
      expect(duplicateSecret.status).toBe(401);
      expect(duplicateSecret.body).toContain('FETCHER_GATEWAY_UNAUTHENTICATED');
      expect(duplicateSecret.body).not.toContain(fixture.submittedUrl);
      expect(await gatewayFacts(state, fixture)).toBe(before);

      await expectRejectedWithoutEffects(
        state,
        fixture,
        before,
        gatewayRequest(state, path, { [SECRET_HEADER]: gatewaySecret, 'content-type': 'application/json' }, '{}'),
        422,
        'INVALID_GATEWAY_REQUEST',
      );
      await expectRejectedWithoutEffects(
        state,
        fixture,
        before,
        gatewayRequest(state, path, { [SECRET_HEADER]: gatewaySecret, 'content-type': 'text/plain' }),
        422,
        'INVALID_GATEWAY_REQUEST',
      );
      await expectRejectedWithoutEffects(
        state,
        fixture,
        before,
        rawHttpPost(
          state,
          path,
          [
            [SECRET_HEADER, gatewaySecret],
            ['content-type', 'application/json'],
            ['transfer-encoding', 'chunked'],
          ],
          '{}',
        ),
        422,
        'INVALID_GATEWAY_REQUEST',
      );
      await expectRejectedWithoutEffects(
        state,
        fixture,
        before,
        rawHttpPost(
          state,
          path,
          [
            [SECRET_HEADER, gatewaySecret],
            ['content-type', 'application/json'],
            ['content-length', '2'],
          ],
          '{}',
        ),
        422,
        'INVALID_GATEWAY_REQUEST',
      );
      await expectRejectedWithoutEffects(
        state,
        fixture,
        before,
        gatewayRequest(state, '/internal/fetcher/tasks/not-a-uuid/claim', { [SECRET_HEADER]: gatewaySecret }),
        422,
        'INVALID_GATEWAY_REQUEST',
      );
      await expectRejectedWithoutEffects(
        state,
        fixture,
        before,
        gatewayRequest(state, `/internal/fetcher/tasks/${randomUUID()}/claim`, { [SECRET_HEADER]: gatewaySecret }),
        409,
        'FETCHER_TASK_UNAVAILABLE',
      );

      expectRedactedApiLog(state, [
        gatewaySecret,
        wrongSecretMarker,
        malformedBodyMarker,
        fixture.submittedUrl,
        fixture.packageId,
        fixture.outboxId,
      ]);
    } finally {
      await cleanup(state, fixture.packageId);
    }
  });

  it('returns the exact flat Claim and Heartbeat shapes and keeps private URL disclosure success-only', async () => {
    const state = requireState();
    const { gatewaySecret } = credentials(state);
    const fixture = await createFixture(state);
    const claimPath = `/internal/fetcher/tasks/${fixture.taskId}/claim`;
    try {
      const openApi = await fetch(`${state.apiOrigin}/openapi.json`);
      const openApiBody = (await openApi.json()) as { paths?: Record<string, unknown> };
      expect(openApiBody.paths).not.toHaveProperty('/internal/fetcher/tasks/{taskId}/claim');
      expect(openApiBody.paths).not.toHaveProperty('/internal/fetcher/tasks/{taskId}/heartbeat');

      const claimed = await gatewayRequest(state, claimPath, { [SECRET_HEADER]: gatewaySecret });
      expect(claimed.status).toBe(200);
      const claimBody = (await claimed.json()) as {
        data: {
          taskId: string;
          taskKind: string;
          submittedUrl: string;
          connectionPolicyVersion: string;
          resourcePolicyVersion: string;
          attemptNumber: number;
          leaseExpiresAt: string;
          claim: string;
        };
      };
      expect(claimBody).toEqual({
        data: {
          taskId: fixture.taskId,
          taskKind: 'url_capture',
          submittedUrl: fixture.submittedUrl,
          connectionPolicyVersion: 'public-url-connection/v1',
          resourcePolicyVersion: 'public-url-resource/v1',
          attemptNumber: 1,
          leaseExpiresAt: expect.any(String),
          claim: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
        },
      });
      expect(new Date(claimBody.data.leaseExpiresAt).getTime()).toBeGreaterThan(Date.now());

      const taskFacts = await composeExec(state, 'postgres', [
        'sh',
        '-c',
        `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT state || ':' || claim_attempt_number || ':' || length(claim_hash::text) || ':' || claimed_by FROM workflow_tasks WHERE id = '${fixture.taskId}'"`,
      ]);
      expect(taskFacts.ok).toBe(true);
      expect(taskFacts.stdout.trim()).toBe('leased:1:64:fetcher');
      expect(taskFacts.stdout).not.toContain(claimBody.data.claim);

      const heartbeat = await gatewayRequest(state, `/internal/fetcher/tasks/${fixture.taskId}/heartbeat`, {
        [SECRET_HEADER]: gatewaySecret,
        [CLAIM_HEADER]: claimBody.data.claim,
      });
      expect(heartbeat.status).toBe(200);
      expect(await heartbeat.json()).toEqual({
        data: {
          taskId: fixture.taskId,
          attemptNumber: 1,
          leaseExpiresAt: expect.any(String),
          renewed: false,
        },
      });
      expectRedactedApiLog(state, [
        gatewaySecret,
        claimBody.data.claim,
        fixture.submittedUrl,
        fixture.packageId,
        fixture.outboxId,
      ]);
    } finally {
      await cleanup(state, fixture.packageId);
    }
  });

  it('rejects every legal ineligible database state without disclosure or side effects', async () => {
    const state = requireState();
    const { gatewaySecret } = credentials(state);
    const scenarios: readonly { readonly name: string; readonly sql: (fixture: GatewayFixture) => string }[] = [
      {
        name: 'leased task',
        sql: (fixture) =>
          `UPDATE workflow_tasks SET state = 'leased', claim_attempt_number = 1, claim_hash = repeat('a', 64), claimed_by = 'fetcher', lease_started_at = TIMESTAMPTZ '2000-01-01 00:00:00+00', lease_heartbeat_at = TIMESTAMPTZ '2000-01-01 00:00:01+00', lease_expires_at = TIMESTAMPTZ '2099-01-01 00:00:00+00', updated_at = now() WHERE id = '${fixture.taskId}'`,
      },
      {
        name: 'archived content package',
        sql: (fixture) =>
          `UPDATE content_packages SET lifecycle = 'archived', archived_at = now(), updated_at = now() WHERE id = '${fixture.packageId}'`,
      },
      {
        name: 'paused workflow instance',
        sql: (fixture) =>
          `UPDATE workflow_instances SET lifecycle = 'paused', updated_at = now() WHERE id = (SELECT workflow_instance_id FROM workflow_tasks WHERE id = '${fixture.taskId}')`,
      },
      {
        name: 'running workflow node',
        sql: (fixture) =>
          `UPDATE workflow_nodes SET state = 'running', updated_at = now() WHERE id = (SELECT workflow_node_id FROM workflow_tasks WHERE id = '${fixture.taskId}')`,
      },
      {
        name: 'missing outbox',
        sql: (fixture) => `DELETE FROM workflow_outbox_records WHERE task_id = '${fixture.taskId}'`,
      },
      {
        name: 'pending outbox',
        sql: (fixture) =>
          `UPDATE workflow_outbox_records SET state = 'pending', dispatch_lease_expires_at = NULL, last_dispatch_at = NULL, dispatched_at = NULL, updated_at = now() WHERE task_id = '${fixture.taskId}'`,
      },
    ];

    for (const scenario of scenarios) {
      const fixture = await createFixture(state);
      try {
        const updated = await composeExec(state, 'postgres', [
          'sh',
          '-c',
          `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "${scenario.sql(fixture)}"`,
        ]);
        expect(updated.ok, scenario.name).toBe(true);

        const before = await gatewayFacts(state, fixture);
        await expectRejectedWithoutEffects(
          state,
          fixture,
          before,
          gatewayRequest(state, `/internal/fetcher/tasks/${fixture.taskId}/claim`, {
            [SECRET_HEADER]: gatewaySecret,
          }),
          409,
          'FETCHER_TASK_UNAVAILABLE',
        );
      } finally {
        await cleanup(state, fixture.packageId);
      }
    }
  });

  it('rejects missing, duplicate, malformed, wrong, expired, and mismatched Heartbeat claims without effects', async () => {
    const state = requireState();
    const { gatewaySecret } = credentials(state);
    const fixture = await createFixture(state);
    const claimPath = `/internal/fetcher/tasks/${fixture.taskId}/claim`;
    try {
      const claimed = await gatewayRequest(state, claimPath, { [SECRET_HEADER]: gatewaySecret });
      expect(claimed.status).toBe(200);
      const claimBody = (await claimed.json()) as { data: { claim: string } };
      const claim = claimBody.data.claim;
      const heartbeatPath = `/internal/fetcher/tasks/${fixture.taskId}/heartbeat`;
      const malformedBodyMarker = 'malformed-heartbeat-body-marker';
      const malformedJson = `{"heartbeat":"${malformedBodyMarker}"`;

      const malformedBefore = await gatewayFacts(state, fixture);
      await expectRejectedWithoutEffects(
        state,
        fixture,
        malformedBefore,
        rawHttpPost(
          state,
          heartbeatPath,
          [
            [SECRET_HEADER, gatewaySecret],
            [CLAIM_HEADER, claim],
            ['content-type', 'application/json'],
          ],
          malformedJson,
        ),
        422,
        'INVALID_GATEWAY_REQUEST',
        [gatewaySecret, claim, malformedBodyMarker],
      );

      const missingBefore = await gatewayFacts(state, fixture);
      await expectRejectedWithoutEffects(
        state,
        fixture,
        missingBefore,
        gatewayRequest(state, heartbeatPath, { [SECRET_HEADER]: gatewaySecret }),
        422,
        'INVALID_GATEWAY_REQUEST',
      );

      const duplicateClaim = await rawHttpPost(state, heartbeatPath, [
        [SECRET_HEADER, gatewaySecret],
        [CLAIM_HEADER, claim],
        [CLAIM_HEADER, claim],
      ]);
      expect(duplicateClaim.status).toBe(422);
      expect(duplicateClaim.body).toContain('INVALID_GATEWAY_REQUEST');
      expect(await gatewayFacts(state, fixture)).toBe(missingBefore);

      await expectRejectedWithoutEffects(
        state,
        fixture,
        missingBefore,
        gatewayRequest(state, heartbeatPath, { [SECRET_HEADER]: gatewaySecret, [CLAIM_HEADER]: 'invalid' }),
        422,
        'INVALID_GATEWAY_REQUEST',
      );
      await expectRejectedWithoutEffects(
        state,
        fixture,
        missingBefore,
        gatewayRequest(state, heartbeatPath, {
          [SECRET_HEADER]: gatewaySecret,
          [CLAIM_HEADER]: 'A'.repeat(43),
        }),
        409,
        'FETCHER_CLAIM_UNAVAILABLE',
      );
      await expectRejectedWithoutEffects(
        state,
        fixture,
        missingBefore,
        gatewayRequest(state, `/internal/fetcher/tasks/${randomUUID()}/heartbeat`, {
          [SECRET_HEADER]: gatewaySecret,
          [CLAIM_HEADER]: claim,
        }),
        409,
        'FETCHER_CLAIM_UNAVAILABLE',
      );

      const expired = await composeExec(state, 'postgres', [
        'sh',
        '-c',
        `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "UPDATE workflow_tasks SET lease_started_at = TIMESTAMPTZ '2000-01-01 00:00:00+00', lease_heartbeat_at = TIMESTAMPTZ '2000-01-01 00:00:01+00', lease_expires_at = TIMESTAMPTZ '2000-01-01 00:00:02+00', updated_at = now() WHERE id = '${fixture.taskId}'"`,
      ]);
      expect(expired.ok).toBe(true);
      const expiredBefore = await gatewayFacts(state, fixture);
      await expectRejectedWithoutEffects(
        state,
        fixture,
        expiredBefore,
        gatewayRequest(state, heartbeatPath, { [SECRET_HEADER]: gatewaySecret, [CLAIM_HEADER]: claim }),
        409,
        'FETCHER_CLAIM_UNAVAILABLE',
      );
      expectRedactedApiLog(state, [
        gatewaySecret,
        claim,
        malformedBodyMarker,
        fixture.submittedUrl,
        fixture.packageId,
        fixture.outboxId,
      ]);
    } finally {
      await cleanup(state, fixture.packageId);
    }
  });
});
