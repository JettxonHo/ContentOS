import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { createWorkflowRepositoryTestBoundary, type WorkflowRepositoryTestBoundary } from '@contentos/database';

import { readComposeCredentials, requireState, type SmokeState } from './env.js';

interface PackageResource {
  readonly id: string;
  readonly revision: number;
}

interface TaskFixture {
  readonly instanceId: string;
  readonly captureNodeId: string;
  readonly taskId: string;
  readonly requestId: string;
  readonly sourceReferenceId: string;
  readonly ownerUserId: string;
}

interface TaskResource {
  readonly kind: 'url_capture';
  readonly state: 'queued' | 'running' | 'succeeded' | 'failed';
  readonly attemptNumber: number;
  readonly updatedAt: string;
  readonly failure: { readonly category: string; readonly code: string } | null;
}

interface TimelineItem {
  readonly sequence: number;
  readonly nodeKey: string | null;
  readonly occurredAt: string;
  readonly kind: string;
  readonly attemptNumber?: number;
  readonly failure?: { readonly category: string; readonly code: string };
}

function databaseUrl(): string {
  const state = requireState();
  const credentials = readComposeCredentials(state.envFile);
  return `postgresql://smoke_user:${encodeURIComponent(credentials.POSTGRES_PASSWORD ?? '')}@127.0.0.1:${state.ports.postgres}/smoke_db`;
}

async function createSession(boundary: WorkflowRepositoryTestBoundary, ownerUserId: string): Promise<string> {
  const credential = randomBytes(32).toString('base64url');
  await boundary.query(
    "INSERT INTO auth_sessions (id, credential_hash, owner_user_id, created_at, expires_at) VALUES ($1, $2, $3, now(), now() + interval '1 hour')",
    [randomUUID(), createHash('sha256').update(credential).digest('hex'), ownerUserId],
  );
  return `contentos_session=${credential}`;
}

async function createPackage(
  state: SmokeState,
  cookie: string,
  title = 'Workflow projection package',
): Promise<PackageResource> {
  const response = await fetch(`${state.apiOrigin}/v1/content-packages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
    body: JSON.stringify({ title, contentMode: 'creator_led', requestedOutputs: ['blog', 'xiaohongshu'] }),
  });
  expect(response.status).toBe(201);
  return ((await response.json()) as { data: { contentPackage: PackageResource } }).data.contentPackage;
}

async function captureUrl(state: SmokeState, cookie: string, contentPackage: PackageResource): Promise<void> {
  const response = await fetch(`${state.apiOrigin}/v1/content-packages/${contentPackage.id}/url-capture-requests`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': randomUUID().replaceAll('-', '').slice(0, 16),
      cookie,
      origin: state.webOrigin,
    },
    body: JSON.stringify({
      expectedPackageRevision: contentPackage.revision,
      role: 'primary',
      submittedUrl: 'https://private.example.test/hidden',
    }),
  });
  expect(response.status).toBe(201);
}

async function cleanupPackage(boundary: WorkflowRepositoryTestBoundary, packageId: string): Promise<void> {
  await boundary.query('BEGIN');
  try {
    for (const table of [
      'url_capture_results',
      'sources',
      'workflow_outbox_records',
      'workflow_tasks',
      'url_capture_requests',
      'url_source_references',
    ]) {
      await boundary.query(`DELETE FROM ${table} WHERE content_package_id = $1`, [packageId]);
    }
    await boundary.query('ALTER TABLE workflow_events DISABLE TRIGGER workflow_events_immutable_trigger');
    await boundary.query('DELETE FROM workflow_events WHERE content_package_id = $1', [packageId]);
    await boundary.query('ALTER TABLE workflow_events ENABLE TRIGGER workflow_events_immutable_trigger');
    await boundary.query('DELETE FROM workflow_nodes WHERE content_package_id = $1', [packageId]);
    await boundary.query('DELETE FROM workflow_instances WHERE content_package_id = $1', [packageId]);
    await boundary.query('DELETE FROM content_packages WHERE id = $1', [packageId]);
    await boundary.query('COMMIT');
  } catch (error) {
    await boundary.query('ROLLBACK');
    throw error;
  }
}

async function cleanupAlternateTemplate(
  boundary: WorkflowRepositoryTestBoundary,
  templateVersion: string,
): Promise<void> {
  await boundary.query('BEGIN');
  try {
    await boundary.query(
      'ALTER TABLE workflow_template_nodes DISABLE TRIGGER workflow_template_nodes_immutable_trigger',
    );
    await boundary.query('ALTER TABLE workflow_templates DISABLE TRIGGER workflow_templates_immutable_trigger');
    await boundary.query(
      "DELETE FROM workflow_template_nodes WHERE template_id = 'content-package-dual-output' AND template_version = $1",
      [templateVersion],
    );
    await boundary.query(
      "DELETE FROM workflow_templates WHERE template_id = 'content-package-dual-output' AND template_version = $1",
      [templateVersion],
    );
    await boundary.query(
      'ALTER TABLE workflow_template_nodes ENABLE TRIGGER workflow_template_nodes_immutable_trigger',
    );
    await boundary.query('ALTER TABLE workflow_templates ENABLE TRIGGER workflow_templates_immutable_trigger');
    await boundary.query('COMMIT');
  } catch (error) {
    await boundary.query('ROLLBACK');
    throw error;
  }
}

async function taskFixture(boundary: WorkflowRepositoryTestBoundary, packageId: string): Promise<TaskFixture> {
  const rows = await boundary.query<{
    instance_id: string;
    node_id: string;
    task_id: string;
    request_id: string;
    source_reference_id: string;
    owner_user_id: string;
  }>(
    `SELECT i.id AS instance_id, n.id AS node_id, task.id AS task_id,
            task.url_capture_request_id AS request_id, request.source_reference_id, task.owner_user_id
     FROM workflow_instances i
     JOIN workflow_nodes n ON n.workflow_instance_id = i.id AND n.template_node_key = 'source_capture'
     JOIN workflow_tasks task ON task.workflow_node_id = n.id
     JOIN url_capture_requests request ON request.id = task.url_capture_request_id
     WHERE i.content_package_id = $1
       AND i.template_id = 'content-package-dual-output'
       AND i.template_version = 'v1'`,
    [packageId],
  );
  const row = rows[0];
  if (!row) throw new Error('workflow task fixture is missing');
  return {
    instanceId: row.instance_id,
    captureNodeId: row.node_id,
    taskId: row.task_id,
    requestId: row.request_id,
    sourceReferenceId: row.source_reference_id,
    ownerUserId: row.owner_user_id,
  };
}

async function stateSnapshot(boundary: WorkflowRepositoryTestBoundary, packageId: string): Promise<string> {
  const rows = await boundary.query<{ snapshot: string }>(
    `SELECT json_build_object(
       'package', (SELECT json_build_object('lifecycle', lifecycle, 'revision', revision) FROM content_packages WHERE id = $1),
       'instances', COALESCE((SELECT json_agg(json_build_object('id', id, 'templateId', template_id, 'templateVersion', template_version, 'lifecycle', lifecycle, 'revision', revision, 'updatedAt', updated_at) ORDER BY id) FROM workflow_instances WHERE content_package_id = $1), '[]'::json),
       'nodes', COALESCE((SELECT json_agg(json_build_object('id', id, 'state', state, 'revision', revision, 'updatedAt', updated_at) ORDER BY id) FROM workflow_nodes WHERE content_package_id = $1), '[]'::json),
       'tasks', COALESCE((SELECT json_agg(json_build_object('id', id, 'state', state, 'attempt', claim_attempt_number, 'updatedAt', updated_at) ORDER BY id) FROM workflow_tasks WHERE content_package_id = $1), '[]'::json),
       'outbox', COALESCE((SELECT json_agg(json_build_object('id', id, 'state', state, 'generation', delivery_generation, 'attempt', dispatch_attempt_count, 'updatedAt', updated_at) ORDER BY id) FROM workflow_outbox_records WHERE content_package_id = $1), '[]'::json),
       'events', (SELECT json_build_object('count', count(*), 'latest', COALESCE(max(sequence), 0)) FROM workflow_events WHERE content_package_id = $1),
       'sourceRows', json_build_object(
         'sources', (SELECT count(*) FROM sources WHERE content_package_id = $1),
         'snapshots', (SELECT count(*) FROM source_raw_snapshots snapshot JOIN sources source ON source.id = snapshot.source_id WHERE source.content_package_id = $1),
         'versions', (SELECT count(*) FROM source_versions version JOIN sources source ON source.id = version.source_id WHERE source.content_package_id = $1),
         'approvals', (SELECT count(*) FROM source_approvals approval JOIN sources source ON source.id = approval.source_id WHERE source.content_package_id = $1)
       )
     )::text AS snapshot`,
    [packageId],
  );
  return rows[0]?.snapshot ?? '';
}

async function fetchWithoutEffects(
  boundary: WorkflowRepositoryTestBoundary,
  packageId: string,
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const before = await stateSnapshot(boundary, packageId);
  const response = await fetch(input, init);
  expect(await stateSnapshot(boundary, packageId)).toBe(before);
  return response;
}

async function projectionTask(
  state: SmokeState,
  boundary: WorkflowRepositoryTestBoundary,
  packageId: string,
  cookie: string,
): Promise<TaskResource> {
  const response = await fetchWithoutEffects(
    boundary,
    packageId,
    `${state.apiOrigin}/v1/content-packages/${packageId}/workflow`,
    { headers: { cookie } },
  );
  expect(response.status).toBe(200);
  const body = (await response.json()) as { data: { workflow: { nodes: Array<{ task: TaskResource | null }> } } };
  const task = body.data.workflow.nodes.find((node) => node.task !== null)?.task;
  if (!task) throw new Error('projection task is missing');
  return task;
}

async function addAlternateWorkflow(
  boundary: WorkflowRepositoryTestBoundary,
  packageId: string,
  templateVersion: string,
): Promise<void> {
  const definition = 'a'.repeat(64);
  const instanceId = randomUUID();
  const nodeId = randomUUID();
  await boundary.query(
    "INSERT INTO workflow_templates (template_id, template_version, definition_sha256, seeded_at) VALUES ('content-package-dual-output', $1, $2, now())",
    [templateVersion, definition],
  );
  await boundary.query(
    "INSERT INTO workflow_template_nodes (template_id, template_version, node_key, ordinal, kind, requires_human_gate) VALUES ('content-package-dual-output', $1, 'alternate_capture', 1, 'work', false)",
    [templateVersion],
  );
  await boundary.query(
    `INSERT INTO workflow_instances (id, content_package_id, owner_user_id, template_id, template_version, definition_sha256, lifecycle, revision, created_at, updated_at)
     SELECT $1, id, owner_user_id, 'content-package-dual-output', $2, $3, 'active', 1, now(), now()
     FROM content_packages WHERE id = $4`,
    [instanceId, templateVersion, definition, packageId],
  );
  await boundary.query(
    `INSERT INTO workflow_nodes (id, workflow_instance_id, content_package_id, owner_user_id, template_id, template_version, template_node_key, state, revision, created_at, updated_at)
     SELECT $1, i.id, i.content_package_id, i.owner_user_id, i.template_id, i.template_version, 'alternate_capture', 'ready', 1, now(), now()
     FROM workflow_instances i WHERE i.id = $2`,
    [nodeId, instanceId],
  );
  await boundary.query(
    `INSERT INTO workflow_events (id, workflow_instance_id, content_package_id, owner_user_id, sequence, event_type, payload, occurred_at, workflow_node_id)
     SELECT $1, i.id, i.content_package_id, i.owner_user_id, 1, 'alternate.private.v1', $2::jsonb, now(), $3
     FROM workflow_instances i WHERE i.id = $4`,
    [randomUUID(), JSON.stringify({ rawAlternateMarker: 'alternate-event-must-not-leak' }), nodeId, instanceId],
  );
}

function safeError(body: unknown): { code: unknown; message: unknown } {
  const error = (body as { error?: { code?: unknown; message?: unknown } }).error;
  return { code: error?.code, message: error?.message };
}

function assertApiLogRedacted(state: SmokeState): void {
  const log = readFileSync(join(state.runDir, 'api.log'), 'utf8');
  for (const marker of [
    'private.example.test',
    'private-claim-must-not-leak',
    'private-object-key-must-not-leak',
    'private-event-field-must-not-leak',
    'alternate-event-must-not-leak',
    'unknown.internal.v1',
    'alternate.private.v1',
  ]) {
    expect(log).not.toContain(marker);
  }
  expect(log).not.toMatch(/postgresql:\/\//i);
  expect(log).not.toMatch(/\b(?:SELECT|INSERT|UPDATE|DELETE)\b/i);
  expect(log).not.toMatch(/\bat\s+[^\n]+:\d+:\d+/i);
}

describe('M2-WF-004A Workflow projection and Timeline API', () => {
  it('returns exact owner-scoped empty shapes without creating state', async () => {
    const state = requireState();
    const boundary = createWorkflowRepositoryTestBoundary(databaseUrl());
    let packageId: string | undefined;
    try {
      const cookie = await createSession(boundary, randomUUID());
      const contentPackage = await createPackage(state, cookie, 'No workflow package');
      packageId = contentPackage.id;
      const projection = await fetchWithoutEffects(
        boundary,
        packageId,
        `${state.apiOrigin}/v1/content-packages/${packageId}/workflow`,
        { headers: { cookie } },
      );
      const timeline = await fetchWithoutEffects(
        boundary,
        packageId,
        `${state.apiOrigin}/v1/content-packages/${packageId}/workflow/events`,
        { headers: { cookie } },
      );
      expect(projection.status).toBe(200);
      expect(await projection.json()).toEqual({ data: { workflow: null } });
      expect(timeline.status).toBe(200);
      expect(await timeline.json()).toEqual({
        data: { workflowInstanceId: null, latestSequence: 0, items: [], nextAfter: null },
      });
    } finally {
      if (packageId) await cleanupPackage(boundary, packageId);
      await boundary.close();
    }
  });

  it('projects every reachable URL-capture Task state and fails closed on an incomplete failed Task', async () => {
    const state = requireState();
    const boundary = createWorkflowRepositoryTestBoundary(databaseUrl());
    let packageId: string | undefined;
    try {
      const cookie = await createSession(boundary, randomUUID());
      const contentPackage = await createPackage(state, cookie, 'Workflow task states');
      packageId = contentPackage.id;
      await captureUrl(state, cookie, contentPackage);
      const fixture = await taskFixture(boundary, packageId);

      expect(await projectionTask(state, boundary, packageId, cookie)).toMatchObject({
        state: 'queued',
        attemptNumber: 0,
        failure: null,
      });
      await boundary.query('UPDATE workflow_tasks SET claim_attempt_number = 2, updated_at = now() WHERE id = $1', [
        fixture.taskId,
      ]);
      expect(await projectionTask(state, boundary, packageId, cookie)).toMatchObject({
        state: 'queued',
        attemptNumber: 2,
        failure: null,
      });
      await boundary.query(
        `UPDATE workflow_tasks
         SET state = 'leased', claim_attempt_number = 3, claim_hash = $2, claimed_by = 'fetcher',
             lease_started_at = clock_timestamp(), lease_heartbeat_at = clock_timestamp(),
             lease_expires_at = clock_timestamp() + interval '1 hour', updated_at = clock_timestamp()
         WHERE id = $1`,
        [fixture.taskId, 'b'.repeat(64)],
      );
      expect(await projectionTask(state, boundary, packageId, cookie)).toMatchObject({
        state: 'running',
        attemptNumber: 3,
        failure: null,
      });
      await boundary.query(
        `UPDATE workflow_tasks
         SET state = 'succeeded', claim_hash = NULL, claimed_by = NULL, lease_started_at = NULL,
             lease_heartbeat_at = NULL, lease_expires_at = NULL, updated_at = now()
         WHERE id = $1`,
        [fixture.taskId],
      );
      expect(await projectionTask(state, boundary, packageId, cookie)).toMatchObject({
        state: 'succeeded',
        attemptNumber: 3,
        failure: null,
      });
      await boundary.query(
        "UPDATE workflow_tasks SET state = 'failed', claim_attempt_number = 4, updated_at = now() WHERE id = $1",
        [fixture.taskId],
      );
      const incompleteFailure = await fetchWithoutEffects(
        boundary,
        packageId,
        `${state.apiOrigin}/v1/content-packages/${packageId}/workflow`,
        { headers: { cookie } },
      );
      expect(incompleteFailure.status).toBe(500);
      const incompleteText = await incompleteFailure.text();
      expect(incompleteText).toContain('INTERNAL_ERROR');
      expect(incompleteText).not.toContain('invalid_workflow_query_row');

      await boundary.query(
        `INSERT INTO url_capture_results
           (id, task_id, url_capture_request_id, source_reference_id, content_package_id, owner_user_id,
            attempt_number, claim_hash, result_version, submitted_payload_sha256,
            submitted_outcome, submitted_category, recorded_outcome, recorded_category, safe_code,
            source_id, snapshot_id, success_evidence, accepted_at)
         VALUES ($1, $2, $3, $4, $5, $6, 4, $7, 'fetcher-result/v1', $8,
                 'failed', 'timeout', 'failed', 'timeout', 'TIMEOUT', NULL, NULL, NULL, now())`,
        [
          randomUUID(),
          fixture.taskId,
          fixture.requestId,
          fixture.sourceReferenceId,
          packageId,
          fixture.ownerUserId,
          'c'.repeat(64),
          'd'.repeat(64),
        ],
      );
      expect(await projectionTask(state, boundary, packageId, cookie)).toMatchObject({
        state: 'failed',
        attemptNumber: 4,
        failure: { category: 'timeout', code: 'TIMEOUT' },
      });
    } finally {
      if (packageId) await cleanupPackage(boundary, packageId);
      await boundary.close();
    }
  });

  it('isolates fixed v1 and returns five exact Timeline items without gaps or duplicates', async () => {
    const state = requireState();
    const boundary = createWorkflowRepositoryTestBoundary(databaseUrl());
    let packageId: string | undefined;
    let alternateVersion: string | undefined;
    try {
      const cookie = await createSession(boundary, randomUUID());
      const contentPackage = await createPackage(state, cookie);
      packageId = contentPackage.id;
      await captureUrl(state, cookie, contentPackage);
      const fixture = await taskFixture(boundary, packageId);
      const reviewNodeId = randomUUID();
      await boundary.query(
        `INSERT INTO workflow_nodes (id, workflow_instance_id, content_package_id, owner_user_id, template_id, template_version, template_node_key, state, revision, created_at, updated_at)
         SELECT $1, i.id, i.content_package_id, i.owner_user_id, i.template_id, i.template_version, 'source_review', 'awaiting_human', 1, now(), now()
         FROM workflow_instances i WHERE i.id = $2`,
        [reviewNodeId, fixture.instanceId],
      );
      const events: readonly [string, Record<string, unknown>][] = [
        ['fetcher_lease_expired.v1', { claimAttemptNumber: 2, claim: 'private-claim-must-not-leak' }],
        ['url_capture_succeeded.v1', { attemptNumber: 3, objectKey: 'private-object-key-must-not-leak' }],
        [
          'url_capture_failed.v1',
          { attemptNumber: 4, category: 'timeout', code: 'TIMEOUT', field: 'private-event-field-must-not-leak' },
        ],
        ['unknown.internal.v1', { rawPayload: 'private-event-field-must-not-leak' }],
      ];
      for (const [offset, [eventType, payload]] of events.entries()) {
        await boundary.query(
          `INSERT INTO workflow_events (id, workflow_instance_id, content_package_id, owner_user_id, sequence, event_type, payload, occurred_at, workflow_node_id)
           SELECT $1, i.id, i.content_package_id, i.owner_user_id, $2, $3, $4::jsonb, now(), $5
           FROM workflow_instances i WHERE i.id = $6`,
          [randomUUID(), offset + 2, eventType, JSON.stringify(payload), fixture.captureNodeId, fixture.instanceId],
        );
      }
      alternateVersion = `review-${randomUUID().slice(0, 8)}`;
      await addAlternateWorkflow(boundary, packageId, alternateVersion);

      const projection = await fetchWithoutEffects(
        boundary,
        packageId,
        `${state.apiOrigin}/v1/content-packages/${packageId}/workflow`,
        { headers: { cookie } },
      );
      expect(projection.status).toBe(200);
      const projectionText = await projection.text();
      expect(projectionText).not.toContain(alternateVersion);
      expect(projectionText).not.toContain('alternate_capture');
      const projectionBody = JSON.parse(projectionText) as {
        data: { workflow: { templateVersion: string; nodes: Array<{ key: string; ordinal: number }> } };
      };
      expect(projectionBody.data.workflow.templateVersion).toBe('v1');
      expect(projectionBody.data.workflow.nodes.map((node) => node.key)).toEqual(['source_capture', 'source_review']);
      expect(projectionBody.data.workflow.nodes.map((node) => node.ordinal)).toEqual([1, 2]);

      const pages: Array<{ latestSequence: number; items: TimelineItem[]; nextAfter: number | null }> = [];
      for (const after of [0, 2, 4]) {
        const response = await fetchWithoutEffects(
          boundary,
          packageId,
          `${state.apiOrigin}/v1/content-packages/${packageId}/workflow/events?after=${after}&limit=2`,
          { headers: { cookie } },
        );
        expect(response.status).toBe(200);
        pages.push(((await response.json()) as { data: (typeof pages)[number] }).data);
      }
      expect(pages.map((page) => page.latestSequence)).toEqual([5, 5, 5]);
      expect(pages.map((page) => page.nextAfter)).toEqual([2, 4, null]);
      const items = pages.flatMap((page) => page.items);
      expect(items).toEqual([
        {
          sequence: 1,
          nodeKey: 'source_capture',
          occurredAt: expect.any(String),
          kind: 'url_capture_requested.v1',
        },
        {
          sequence: 2,
          nodeKey: 'source_capture',
          occurredAt: expect.any(String),
          kind: 'fetcher_lease_expired.v1',
          attemptNumber: 2,
        },
        {
          sequence: 3,
          nodeKey: 'source_capture',
          occurredAt: expect.any(String),
          kind: 'url_capture_succeeded.v1',
          attemptNumber: 3,
        },
        {
          sequence: 4,
          nodeKey: 'source_capture',
          occurredAt: expect.any(String),
          kind: 'url_capture_failed.v1',
          attemptNumber: 4,
          failure: { category: 'timeout', code: 'TIMEOUT' },
        },
        {
          sequence: 5,
          nodeKey: 'source_capture',
          occurredAt: expect.any(String),
          kind: 'workflow_event.v1',
        },
      ]);
      expect(items.map((item) => item.sequence)).toEqual([1, 2, 3, 4, 5]);
      const caughtUp = await fetchWithoutEffects(
        boundary,
        packageId,
        `${state.apiOrigin}/v1/content-packages/${packageId}/workflow/events?after=5&limit=2`,
        { headers: { cookie } },
      );
      expect(await caughtUp.json()).toEqual({
        data: { workflowInstanceId: fixture.instanceId, latestSequence: 5, items: [], nextAfter: null },
      });
      assertApiLogRedacted(state);
    } finally {
      if (packageId) await cleanupPackage(boundary, packageId);
      if (alternateVersion) await cleanupAlternateTemplate(boundary, alternateVersion);
      await boundary.close();
    }
  });

  it('table-drives authentication, owner scope, archive reads, validation, and no-write behavior for both routes', async () => {
    const state = requireState();
    const boundary = createWorkflowRepositoryTestBoundary(databaseUrl());
    let packageId: string | undefined;
    try {
      const cookie = await createSession(boundary, randomUUID());
      const otherCookie = await createSession(boundary, randomUUID());
      const contentPackage = await createPackage(state, cookie, 'Archived workflow package');
      packageId = contentPackage.id;
      await captureUrl(state, cookie, contentPackage);
      const routes = ['workflow', 'workflow/events'] as const;
      const missingId = randomUUID();
      for (const route of routes) {
        const path = `${state.apiOrigin}/v1/content-packages/${packageId}/${route}`;
        const unauthenticated = await fetchWithoutEffects(boundary, packageId, path);
        expect(unauthenticated.status).toBe(401);

        const crossOwner = await fetchWithoutEffects(boundary, packageId, path, { headers: { cookie: otherCookie } });
        expect(crossOwner.status).toBe(404);
        const crossError = safeError(await crossOwner.json());

        const missing = await fetchWithoutEffects(
          boundary,
          packageId,
          `${state.apiOrigin}/v1/content-packages/${missingId}/${route}`,
          { headers: { cookie } },
        );
        expect(missing.status).toBe(404);
        expect(safeError(await missing.json())).toEqual(crossError);
        expect(crossError).toEqual({ code: 'CONTENT_PACKAGE_NOT_FOUND', message: 'Content Package not found' });
      }

      const archive = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/archive`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
        body: JSON.stringify({ expectedRevision: 1 }),
      });
      expect(archive.status).toBe(200);
      for (const route of routes) {
        const archived = await fetchWithoutEffects(
          boundary,
          packageId,
          `${state.apiOrigin}/v1/content-packages/${packageId}/${route}`,
          { headers: { cookie } },
        );
        expect(archived.status).toBe(200);
      }
      const invalidPackage = await fetchWithoutEffects(
        boundary,
        packageId,
        `${state.apiOrigin}/v1/content-packages/not-a-uuid/workflow`,
        { headers: { cookie } },
      );
      expect(invalidPackage.status).toBe(422);
      const invalidQuery = await fetchWithoutEffects(
        boundary,
        packageId,
        `${state.apiOrigin}/v1/content-packages/${packageId}/workflow/events?after=-1`,
        { headers: { cookie } },
      );
      expect(invalidQuery.status).toBe(422);
    } finally {
      if (packageId) await cleanupPackage(boundary, packageId);
      await boundary.close();
    }
  });
});
