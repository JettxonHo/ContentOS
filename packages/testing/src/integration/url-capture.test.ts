import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE,
  UrlCaptureApplicationError,
  UrlCaptureService,
  type ContentPackageId,
  type ContentPackageOwnerId,
  type UrlCaptureIdGenerator,
} from '@contentos/core';
import { createUrlCaptureRepositoryTestBoundary, type UrlCaptureRepositoryTestBoundary } from '@contentos/database';

import { readComposeCredentials, requireState } from './env.js';

function databaseUrl(): string {
  const state = requireState();
  const credentials = readComposeCredentials(state.envFile);
  return `postgresql://smoke_user:${encodeURIComponent(credentials.POSTGRES_PASSWORD ?? '')}@127.0.0.1:${state.ports.postgres}/smoke_db`;
}

function ids(): UrlCaptureIdGenerator {
  return {
    generateWorkflowInstanceId: () => randomUUID() as never,
    generateWorkflowNodeId: () => randomUUID() as never,
    generateUrlSourceReferenceId: () => randomUUID() as never,
    generateUrlCaptureRequestId: () => randomUUID() as never,
    generateWorkflowTaskId: () => randomUUID() as never,
    generateWorkflowOutboxRecordId: () => randomUUID() as never,
    generateWorkflowEventId: () => randomUUID() as never,
  };
}

function command(packageId: ContentPackageId, ownerUserId: ContentPackageOwnerId, key: string, url: string) {
  return {
    contentPackageId: packageId,
    ownerUserId,
    expectedPackageRevision: 1,
    role: 'primary' as const,
    submittedUrl: url,
    idempotencyKey: key,
  };
}

async function insertPackage(
  boundary: UrlCaptureRepositoryTestBoundary,
  ownerUserId: string,
): Promise<ContentPackageId> {
  const packageId = randomUUID() as ContentPackageId;
  await boundary.query(
    `INSERT INTO content_packages
      (id, owner_user_id, title, description, content_mode, requested_blog, requested_xiaohongshu,
       lifecycle, revision, created_at, updated_at, archived_at)
     VALUES ($1, $2, 'URL capture integration package', NULL, 'creator_led', true, true, 'active', 1, now(), now(), NULL)`,
    [packageId, ownerUserId],
  );
  return packageId;
}

async function insertWorkflowFixture(
  boundary: UrlCaptureRepositoryTestBoundary,
  packageId: ContentPackageId,
  ownerUserId: ContentPackageOwnerId,
  lifecycle: 'active' | 'paused' | 'completed' | 'failed' | 'cancelled',
  nodeState: 'not_ready' | 'ready' | 'running' | 'awaiting_human' | 'completed' | 'failed' | 'skipped' | 'cancelled',
): Promise<{ instanceId: string; nodeId: string }> {
  const instanceId = randomUUID();
  const nodeId = randomUUID();
  const createdAt = '2026-08-01T02:00:00.000Z';
  const templateId = CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE.definition.templateId;
  const templateVersion = CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE.definition.templateVersion;
  const definitionSha256 = CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE.definitionSha256;
  await boundary.query(
    `INSERT INTO workflow_instances
      (id, content_package_id, owner_user_id, template_id, template_version, definition_sha256,
       lifecycle, revision, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8, $8)`,
    [instanceId, packageId, ownerUserId, templateId, templateVersion, definitionSha256, lifecycle, createdAt],
  );
  await boundary.query(
    `INSERT INTO workflow_nodes
      (id, workflow_instance_id, content_package_id, owner_user_id, template_id, template_version,
       template_node_key, state, revision, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'source_capture', $7, 1, $8, $8)`,
    [nodeId, instanceId, packageId, ownerUserId, templateId, templateVersion, nodeState, createdAt],
  );
  return { instanceId, nodeId };
}

async function workflowFixtureRows(
  boundary: UrlCaptureRepositoryTestBoundary,
  instanceId: string,
  nodeId: string,
): Promise<{ instance: Record<string, unknown>; node: Record<string, unknown> }> {
  const rows = await boundary.query<{ instance: Record<string, unknown>; node: Record<string, unknown> }>(
    `SELECT row_to_json(instance_row) AS instance, row_to_json(node_row) AS node
     FROM workflow_instances AS instance_row
     JOIN workflow_nodes AS node_row ON node_row.workflow_instance_id = instance_row.id
     WHERE instance_row.id = $1 AND node_row.id = $2`,
    [instanceId, nodeId],
  );
  if (!rows[0]) throw new Error('workflow fixture rows not found');
  return rows[0];
}

async function counts(
  boundary: UrlCaptureRepositoryTestBoundary,
  packageId: ContentPackageId,
): Promise<Record<string, number>> {
  const rows = await boundary.query<{ table_name: string; count: number }>(
    `SELECT table_name, count::int
     FROM (
       SELECT 'instances' AS table_name, count(*) FROM workflow_instances WHERE content_package_id = $1
       UNION ALL SELECT 'nodes', count(*) FROM workflow_nodes WHERE content_package_id = $1
       UNION ALL SELECT 'references', count(*) FROM url_source_references WHERE content_package_id = $1
       UNION ALL SELECT 'requests', count(*) FROM url_capture_requests WHERE content_package_id = $1
       UNION ALL SELECT 'tasks', count(*) FROM workflow_tasks WHERE content_package_id = $1
       UNION ALL SELECT 'outbox', count(*) FROM workflow_outbox_records WHERE content_package_id = $1
       UNION ALL SELECT 'events', count(*) FROM workflow_events WHERE content_package_id = $1
       UNION ALL SELECT 'sources', count(*) FROM sources WHERE content_package_id = $1
     ) counts(table_name, count)`,
    [packageId],
  );
  return Object.fromEntries(rows.map((row) => [row.table_name, row.count]));
}

async function cleanupPackage(boundary: UrlCaptureRepositoryTestBoundary, packageId: ContentPackageId): Promise<void> {
  await boundary.query('BEGIN');
  try {
    for (const table of [
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
    for (const table of ['workflow_nodes', 'workflow_instances']) {
      await boundary.query(`DELETE FROM ${table} WHERE content_package_id = $1`, [packageId]);
    }
    await boundary.query('DELETE FROM content_packages WHERE id = $1', [packageId]);
    await boundary.query('COMMIT');
  } catch (error) {
    await boundary.query('ROLLBACK');
    throw error;
  }
}

describe('M2-WF-002 atomic URL-capture repository', () => {
  it('creates the exact six durable effects atomically and replays without a new timestamp or row', async () => {
    const boundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    let packageId: ContentPackageId | undefined;
    try {
      const ownerUserId = randomUUID() as ContentPackageOwnerId;
      packageId = await insertPackage(boundary, ownerUserId);
      const service = new UrlCaptureService(boundary.repository, ids(), {
        now: () => new Date('2026-08-01T01:00:00.000Z'),
      });
      const first = await service.submit(
        command(packageId, ownerUserId, 'A'.repeat(16), 'https://example.com/private?q=1#top'),
      );
      expect(first.taskState).toBe('queued');
      expect(await counts(boundary, packageId)).toEqual({
        instances: 1,
        nodes: 1,
        references: 1,
        requests: 1,
        tasks: 1,
        outbox: 1,
        events: 1,
        sources: 0,
      });
      const safeRows = await boundary.query<{ payload: Record<string, unknown> }>(
        `SELECT payload FROM workflow_outbox_records WHERE task_id = $1`,
        [first.taskId],
      );
      expect(safeRows[0]?.payload).toEqual({
        taskId: first.taskId,
        taskKind: 'url_capture',
        envelopeVersion: 'fetcher-task/v1',
      });
      const eventRows = await boundary.query<{ payload: Record<string, unknown> }>(
        `SELECT payload FROM workflow_events WHERE workflow_node_id = $1`,
        [first.workflowNodeId],
      );
      expect(eventRows[0]?.payload).toEqual({
        captureRequestId: first.urlCaptureRequestId,
        sourceReferenceId: first.sourceReferenceId,
        taskId: first.taskId,
      });
      expect(JSON.stringify({ outbox: safeRows[0]?.payload, event: eventRows[0]?.payload })).not.toContain('private');

      const replay = await service.submit(
        command(packageId, ownerUserId, 'A'.repeat(16), 'https://example.com/private?q=1#top'),
      );
      expect(replay).toEqual(first);

      await boundary.query("UPDATE workflow_instances SET lifecycle = 'paused' WHERE id = $1", [
        first.workflowInstanceId,
      ]);
      await boundary.query("UPDATE workflow_nodes SET state = 'running' WHERE id = $1", [first.workflowNodeId]);
      const replayAfterStateChange = await service.submit(
        command(packageId, ownerUserId, 'A'.repeat(16), 'https://example.com/private?q=1#top'),
      );
      expect(replayAfterStateChange).toEqual(first);
      expect(await counts(boundary, packageId)).toEqual({
        instances: 1,
        nodes: 1,
        references: 1,
        requests: 1,
        tasks: 1,
        outbox: 1,
        events: 1,
        sources: 0,
      });

      await expect(
        service.submit(command(packageId, ownerUserId, 'A'.repeat(16), 'https://example.com/different')),
      ).rejects.toEqual(new UrlCaptureApplicationError('URL_CAPTURE_IDEMPOTENCY_CONFLICT'));
      expect(await counts(boundary, packageId)).toEqual({
        instances: 1,
        nodes: 1,
        references: 1,
        requests: 1,
        tasks: 1,
        outbox: 1,
        events: 1,
        sources: 0,
      });
    } finally {
      if (packageId !== undefined) await cleanupPackage(boundary, packageId);
      await boundary.close();
    }
  });

  it('rejects a new Command for an existing non-active Instance without changing workflow state or creating rows', async () => {
    const boundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    let packageId: ContentPackageId | undefined;
    try {
      const ownerUserId = randomUUID() as ContentPackageOwnerId;
      packageId = await insertPackage(boundary, ownerUserId);
      const fixture = await insertWorkflowFixture(boundary, packageId, ownerUserId, 'paused', 'ready');
      const before = await workflowFixtureRows(boundary, fixture.instanceId, fixture.nodeId);
      const service = new UrlCaptureService(boundary.repository, ids(), { now: () => new Date() });

      await expect(
        service.submit(command(packageId, ownerUserId, 'H'.repeat(16), 'https://example.com/new')),
      ).rejects.toEqual(new UrlCaptureApplicationError('URL_CAPTURE_ALREADY_EXISTS'));

      expect(await counts(boundary, packageId)).toEqual({
        instances: 1,
        nodes: 1,
        references: 0,
        requests: 0,
        tasks: 0,
        outbox: 0,
        events: 0,
        sources: 0,
      });
      expect(await workflowFixtureRows(boundary, fixture.instanceId, fixture.nodeId)).toEqual(before);
    } finally {
      if (packageId !== undefined) await cleanupPackage(boundary, packageId);
      await boundary.close();
    }
  });

  it('rejects a new Command for an existing active Instance with a non-ready source_capture Node without changing workflow state or creating rows', async () => {
    const boundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    let packageId: ContentPackageId | undefined;
    try {
      const ownerUserId = randomUUID() as ContentPackageOwnerId;
      packageId = await insertPackage(boundary, ownerUserId);
      const fixture = await insertWorkflowFixture(boundary, packageId, ownerUserId, 'active', 'running');
      const before = await workflowFixtureRows(boundary, fixture.instanceId, fixture.nodeId);
      const service = new UrlCaptureService(boundary.repository, ids(), { now: () => new Date() });

      await expect(
        service.submit(command(packageId, ownerUserId, 'I'.repeat(16), 'https://example.com/new')),
      ).rejects.toEqual(new UrlCaptureApplicationError('URL_CAPTURE_ALREADY_EXISTS'));

      expect(await counts(boundary, packageId)).toEqual({
        instances: 1,
        nodes: 1,
        references: 0,
        requests: 0,
        tasks: 0,
        outbox: 0,
        events: 0,
        sources: 0,
      });
      expect(await workflowFixtureRows(boundary, fixture.instanceId, fixture.nodeId)).toEqual(before);
    } finally {
      if (packageId !== undefined) await cleanupPackage(boundary, packageId);
      await boundary.close();
    }
  });

  it('serializes concurrent duplicate Commands and rejects the distinct second initial request', async () => {
    const firstBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const secondBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    let packageId: ContentPackageId | undefined;
    try {
      const ownerUserId = randomUUID() as ContentPackageOwnerId;
      packageId = await insertPackage(firstBoundary, ownerUserId);
      const firstService = new UrlCaptureService(firstBoundary.repository, ids(), { now: () => new Date() });
      const secondService = new UrlCaptureService(secondBoundary.repository, ids(), { now: () => new Date() });
      const duplicate = await Promise.all([
        firstService.submit(command(packageId, ownerUserId, 'B'.repeat(16), 'https://example.com/one')),
        secondService.submit(command(packageId, ownerUserId, 'B'.repeat(16), 'https://example.com/one')),
      ]);
      expect(duplicate[0]).toEqual(duplicate[1]);
      await expect(
        secondService.submit(command(packageId, ownerUserId, 'C'.repeat(16), 'https://example.com/two')),
      ).rejects.toEqual(new UrlCaptureApplicationError('URL_CAPTURE_ALREADY_EXISTS'));
    } finally {
      if (packageId !== undefined) await cleanupPackage(firstBoundary, packageId);
      await firstBoundary.close();
      await secondBoundary.close();
    }
  });

  it('rolls back every row when failure is injected after each persistence stage', async () => {
    const stages = [
      'workflow_instance',
      'workflow_node',
      'url_source_reference',
      'url_capture_request',
      'workflow_task',
      'workflow_outbox',
      'workflow_event',
    ] as const;
    for (const stage of stages) {
      const boundary = createUrlCaptureRepositoryTestBoundary(databaseUrl(), {
        afterStage: (observed) => {
          if (observed === stage) throw new Error(`injected-${stage}`);
        },
      });
      let packageId: ContentPackageId | undefined;
      try {
        const ownerUserId = randomUUID() as ContentPackageOwnerId;
        packageId = await insertPackage(boundary, ownerUserId);
        const service = new UrlCaptureService(boundary.repository, ids(), { now: () => new Date() });
        await expect(
          service.submit(
            command(packageId, ownerUserId, randomUUID().replaceAll('-', '').slice(0, 16), 'https://example.com'),
          ),
        ).rejects.toThrow(`injected-${stage}`);
        expect(await counts(boundary, packageId)).toEqual({
          instances: 0,
          nodes: 0,
          references: 0,
          requests: 0,
          tasks: 0,
          outbox: 0,
          events: 0,
          sources: 0,
        });
      } finally {
        if (packageId !== undefined) await cleanupPackage(boundary, packageId);
        await boundary.close();
      }
    }
  });

  it('preserves existing Sources and rejects a role with no current formal capacity', async () => {
    const boundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    let packageId: ContentPackageId | undefined;
    try {
      const ownerUserId = randomUUID() as ContentPackageOwnerId;
      packageId = await insertPackage(boundary, ownerUserId);
      const sourceId = randomUUID();
      await boundary.query(
        `INSERT INTO sources
          (id, content_package_id, owner_user_id, source_type, role, label, capture_type, created_at)
         VALUES ($1, $2, $3, 'pasted_text', 'primary', 'existing', 'pasted_text', now())`,
        [sourceId, packageId, ownerUserId],
      );
      const service = new UrlCaptureService(boundary.repository, ids(), { now: () => new Date() });
      await expect(
        service.submit(command(packageId, ownerUserId, 'D'.repeat(16), 'https://example.com')),
      ).rejects.toEqual(new UrlCaptureApplicationError('SOURCE_ROLE_LIMIT_EXCEEDED'));
      expect(await counts(boundary, packageId)).toMatchObject({ sources: 1, instances: 0, requests: 0 });
    } finally {
      if (packageId !== undefined) {
        await boundary.query('DELETE FROM sources WHERE content_package_id = $1', [packageId]);
        await cleanupPackage(boundary, packageId);
      }
      await boundary.close();
    }
  });

  it('fails closed for owner scope, stale revision, and archived Packages before bootstrap', async () => {
    const boundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    let packageId: ContentPackageId | undefined;
    try {
      const ownerUserId = randomUUID() as ContentPackageOwnerId;
      packageId = await insertPackage(boundary, ownerUserId);
      const service = new UrlCaptureService(boundary.repository, ids(), { now: () => new Date() });
      await expect(
        service.submit(
          command(packageId, randomUUID() as ContentPackageOwnerId, 'E'.repeat(16), 'https://example.com'),
        ),
      ).rejects.toEqual(new UrlCaptureApplicationError('CONTENT_PACKAGE_NOT_FOUND'));

      await boundary.query('UPDATE content_packages SET revision = 2 WHERE id = $1', [packageId]);
      await expect(
        service.submit(command(packageId, ownerUserId, 'F'.repeat(16), 'https://example.com')),
      ).rejects.toEqual(new UrlCaptureApplicationError('REVISION_CONFLICT'));

      await boundary.query("UPDATE content_packages SET lifecycle = 'archived', archived_at = now() WHERE id = $1", [
        packageId,
      ]);
      await expect(
        service.submit({
          ...command(packageId, ownerUserId, 'G'.repeat(16), 'https://example.com'),
          expectedPackageRevision: 2,
        }),
      ).rejects.toEqual(new UrlCaptureApplicationError('PACKAGE_ARCHIVED'));
      expect(await counts(boundary, packageId)).toEqual({
        instances: 0,
        nodes: 0,
        references: 0,
        requests: 0,
        tasks: 0,
        outbox: 0,
        events: 0,
        sources: 0,
      });
    } finally {
      if (packageId !== undefined) await cleanupPackage(boundary, packageId);
      await boundary.close();
    }
  });
});
