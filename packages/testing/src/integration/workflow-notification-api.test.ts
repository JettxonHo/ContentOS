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

interface SseFrame {
  readonly event: string | null;
  readonly data: string;
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

async function createPackage(state: SmokeState, cookie: string, title: string): Promise<PackageResource> {
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
      cookie,
      origin: state.webOrigin,
      'idempotency-key': randomUUID().replaceAll('-', '').slice(0, 16),
    },
    body: JSON.stringify({
      expectedPackageRevision: contentPackage.revision,
      role: 'primary',
      submittedUrl: 'https://private.example.test/notification-marker',
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

function openFrames(response: Response): { next(): Promise<SseFrame>; eof(): Promise<string>; close(): Promise<void> } {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('SSE response body is unavailable');
  const decoder = new TextDecoder();
  let pending = '';
  const next = async (): Promise<SseFrame> => {
    for (;;) {
      const separator = pending.indexOf('\n\n');
      if (separator >= 0) {
        const frame = pending.slice(0, separator);
        pending = pending.slice(separator + 2);
        const normalized = frame.replace(/^\n+/, '');
        const event = normalized.match(/^event: (.+)$/m)?.[1] ?? null;
        const data = normalized
          .split('\n')
          .filter((line) => line.startsWith('data: '))
          .map((line) => line.slice(6))
          .join('\n');
        if (event || data) return { event, data };
        continue;
      }
      const chunk = await reader.read();
      if (chunk.done) throw new Error('SSE stream closed before the expected notification');
      pending += decoder.decode(chunk.value, { stream: true });
    }
  };
  const eof = async (): Promise<string> => {
    let trailing = pending;
    pending = '';
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) return trailing + decoder.decode();
      trailing += decoder.decode(chunk.value, { stream: true });
    }
  };
  return { next, eof, close: () => reader.cancel() };
}

async function nextWithin(frames: { next(): Promise<SseFrame> }, milliseconds = 4_000): Promise<SseFrame> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      frames.next(),
      new Promise<SseFrame>((_, reject) => {
        timer = setTimeout(() => reject(new Error('SSE notification timed out')), milliseconds);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

async function eofWithin(frames: { eof(): Promise<string> }, milliseconds = 5_000): Promise<string> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      frames.eof(),
      new Promise<string>((_, reject) => {
        timer = setTimeout(() => reject(new Error('SSE stream did not complete silently')), milliseconds);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

async function openStream(
  state: SmokeState,
  packageId: string,
  cookie: string,
  controller: AbortController,
): Promise<Response> {
  return fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/workflow/stream`, {
    headers: { accept: 'text/event-stream', cookie, origin: state.webOrigin },
    signal: controller.signal,
  });
}

async function stateSnapshot(boundary: WorkflowRepositoryTestBoundary, packageId: string): Promise<string> {
  const result = await boundary.query<{ readonly snapshot: string }>(
    `SELECT json_build_object(
       'package', (SELECT row_to_json(package_row) FROM (SELECT id, owner_user_id, revision, lifecycle FROM content_packages WHERE id = $1) package_row),
       'workflow', (SELECT json_agg(json_build_object('id', id, 'revision', revision, 'updatedAt', updated_at) ORDER BY id) FROM workflow_instances WHERE content_package_id = $1),
       'nodes', (SELECT json_agg(json_build_object('id', id, 'state', state, 'revision', revision, 'updatedAt', updated_at) ORDER BY id) FROM workflow_nodes WHERE content_package_id = $1),
       'tasks', (SELECT json_agg(json_build_object('id', id, 'state', state, 'attempt', claim_attempt_number, 'updatedAt', updated_at) ORDER BY id) FROM workflow_tasks WHERE content_package_id = $1),
       'events', (SELECT json_build_object('count', count(*), 'latest', COALESCE(max(sequence), 0)) FROM workflow_events WHERE content_package_id = $1)
     )::text AS snapshot`,
    [packageId],
  );
  return result[0]?.snapshot ?? '';
}

describe('M2-WF-004B Workflow notification API', () => {
  it('authenticates and owner-scopes bounded streams, including archived and no-Instance Packages, without writes', async () => {
    const state = requireState();
    const boundary = createWorkflowRepositoryTestBoundary(databaseUrl());
    let packageId: string | undefined;
    let reader: { close(): Promise<void> } | undefined;
    let abort: AbortController | undefined;
    try {
      const cookie = await createSession(boundary, randomUUID());
      const otherCookie = await createSession(boundary, randomUUID());
      const contentPackage = await createPackage(state, cookie, 'SSE empty Package');
      packageId = contentPackage.id;
      const before = await stateSnapshot(boundary, packageId);
      const managedProcessesBefore = readFileSync(state.processFile, 'utf8');
      abort = new AbortController();
      const stream = await openStream(state, packageId, cookie, abort);
      expect(stream.status).toBe(200);
      expect(stream.headers.get('content-type')).toContain('text/event-stream');
      expect(stream.headers.get('cache-control')).toContain('private');
      expect(stream.headers.get('cache-control')).toContain('no-cache');
      expect(stream.headers.get('cache-control')).toContain('no-store');
      expect(stream.headers.get('cache-control')).toContain('no-transform');
      expect(stream.headers.get('x-accel-buffering')).toBe('no');
      expect(stream.headers.get('access-control-allow-origin')).toBe(state.webOrigin);
      expect(stream.headers.get('access-control-allow-credentials')).toBe('true');
      const frames = openFrames(stream);
      reader = frames;
      expect(await nextWithin(frames)).toEqual({
        event: 'workflow-notification/v1',
        data: JSON.stringify({ workflowInstanceId: null, latestSequence: 0 }),
      });
      expect(await stateSnapshot(boundary, packageId)).toBe(before);

      await reader.close();
      abort.abort();
      reader = undefined;
      abort = undefined;
      await new Promise((resolve) => setTimeout(resolve, 1_200));
      const healthAfterAbort = await fetch(`${state.apiOrigin}/health/live`);
      expect(healthAfterAbort.status).toBe(200);
      expect(await healthAfterAbort.json()).toEqual({ status: 'ok', service: 'api' });
      expect(readFileSync(state.processFile, 'utf8')).toBe(managedProcessesBefore);

      const head = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/workflow/stream`, {
        method: 'HEAD',
        headers: { cookie },
      });
      expect(head.status).toBe(204);
      expect(head.headers.get('content-type') ?? '').not.toContain('text/event-stream');

      for (const [id, headers, status] of [
        [packageId, undefined, 401],
        [packageId, { cookie: otherCookie }, 404],
        [randomUUID(), { cookie }, 404],
        ['not-a-uuid', { cookie }, 422],
      ] as const) {
        const response = await fetch(
          `${state.apiOrigin}/v1/content-packages/${id}/workflow/stream`,
          headers === undefined ? {} : { headers },
        );
        expect(response.status).toBe(status);
        await response.text();
      }

      const archive = await fetch(`${state.apiOrigin}/v1/content-packages/${packageId}/archive`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
        body: JSON.stringify({ expectedRevision: 1 }),
      });
      expect(archive.status).toBe(200);
      abort = new AbortController();
      const archivedStream = await openStream(state, packageId, cookie, abort);
      const archivedFrames = openFrames(archivedStream);
      reader = archivedFrames;
      expect(await nextWithin(archivedFrames)).toEqual({
        event: 'workflow-notification/v1',
        data: JSON.stringify({ workflowInstanceId: null, latestSequence: 0 }),
      });
    } finally {
      await reader?.close().catch(() => undefined);
      abort?.abort();
      if (packageId) await cleanupPackage(boundary, packageId);
      await boundary.close();
    }
  });

  it('emits exact Event and Task-only projection changes without exposing private state', async () => {
    const state = requireState();
    const boundary = createWorkflowRepositoryTestBoundary(databaseUrl());
    let packageId: string | undefined;
    let reader: { close(): Promise<void> } | undefined;
    let abort: AbortController | undefined;
    try {
      const cookie = await createSession(boundary, randomUUID());
      const contentPackage = await createPackage(state, cookie, 'SSE changing Package');
      packageId = contentPackage.id;
      await captureUrl(state, cookie, contentPackage);
      const fixture = await boundary.query<{
        readonly instance_id: string;
        readonly task_id: string;
        readonly node_id: string;
      }>(
        `SELECT instance.id AS instance_id, task.id AS task_id, node.id AS node_id
         FROM workflow_instances instance
         JOIN workflow_nodes node ON node.workflow_instance_id = instance.id AND node.template_node_key = 'source_capture'
         JOIN workflow_tasks task ON task.workflow_node_id = node.id
         WHERE instance.content_package_id = $1 AND instance.template_id = 'content-package-dual-output' AND instance.template_version = 'v1'`,
        [packageId],
      );
      const task = fixture[0];
      if (!task) throw new Error('Workflow task fixture is missing');

      abort = new AbortController();
      const stream = await openStream(state, packageId, cookie, abort);
      const frames = openFrames(stream);
      reader = frames;
      expect(JSON.parse((await nextWithin(frames)).data)).toEqual({
        workflowInstanceId: task.instance_id,
        latestSequence: 1,
      });

      await boundary.query(
        'UPDATE workflow_tasks SET claim_attempt_number = 2, updated_at = clock_timestamp() WHERE id = $1',
        [task.task_id],
      );
      const taskOnly = await nextWithin(frames);
      expect(taskOnly.event).toBe('workflow-notification/v1');
      expect(JSON.parse(taskOnly.data)).toEqual({ workflowInstanceId: task.instance_id, latestSequence: 1 });

      await boundary.query(
        `INSERT INTO workflow_events (id, workflow_instance_id, content_package_id, owner_user_id, sequence, event_type, payload, occurred_at, workflow_node_id)
         SELECT $1, id, content_package_id, owner_user_id, 2, 'workflow_event.v1', $2::jsonb, clock_timestamp(), $3
         FROM workflow_instances WHERE id = $4`,
        [
          randomUUID(),
          JSON.stringify({ privateMarker: 'sse-private-event-must-not-leak' }),
          task.node_id,
          task.instance_id,
        ],
      );
      const eventBacked = await nextWithin(frames);
      expect(eventBacked.event).toBe('workflow-notification/v1');
      expect(eventBacked.data).not.toContain('sse-private-event-must-not-leak');
      expect(JSON.parse(eventBacked.data)).toEqual({ workflowInstanceId: task.instance_id, latestSequence: 2 });
    } finally {
      await reader?.close().catch(() => undefined);
      abort?.abort();
      if (packageId) await cleanupPackage(boundary, packageId);
      await boundary.close();
    }
  });

  it('silently completes after a real post-connect repository failure and leaves the API healthy and redacted', async () => {
    const state = requireState();
    const boundary = createWorkflowRepositoryTestBoundary(databaseUrl());
    const privateMarker = 'sse-post-connect-private-marker-must-not-leak';
    let packageId: string | undefined;
    let reader: { eof(): Promise<string>; close(): Promise<void> } | undefined;
    let abort: AbortController | undefined;
    try {
      const cookie = await createSession(boundary, randomUUID());
      const contentPackage = await createPackage(state, cookie, privateMarker);
      packageId = contentPackage.id;
      const managedProcessesBefore = readFileSync(state.processFile, 'utf8');
      abort = new AbortController();
      const stream = await openStream(state, packageId, cookie, abort);
      const frames = openFrames(stream);
      reader = frames;
      expect(await nextWithin(frames)).toEqual({
        event: 'workflow-notification/v1',
        data: JSON.stringify({ workflowInstanceId: null, latestSequence: 0 }),
      });

      await boundary.query('DELETE FROM content_packages WHERE id = $1', [packageId]);
      expect(await eofWithin(frames)).toBe('');

      const health = await fetch(`${state.apiOrigin}/health/live`);
      expect(health.status).toBe(200);
      expect(await health.json()).toEqual({ status: 'ok', service: 'api' });
      expect(readFileSync(state.processFile, 'utf8')).toBe(managedProcessesBefore);
      const apiLog = readFileSync(join(state.runDir, 'api.log'), 'utf8');
      expect(apiLog).not.toContain(privateMarker);
      expect(apiLog).not.toMatch(/postgresql:\/\//i);
      expect(apiLog).not.toMatch(/\b(?:SELECT|INSERT|UPDATE|DELETE)\b/i);
      expect(apiLog).not.toMatch(/\bat\s+[^\n]+:\d+:\d+/i);
    } finally {
      await reader?.close().catch(() => undefined);
      abort?.abort();
      if (packageId) await cleanupPackage(boundary, packageId);
      await boundary.close();
    }
  });
});
