import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Client } from 'pg';

import { describe, expect, it } from 'vitest';

import {
  CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE,
  defineWorkflowEvent,
  defineWorkflowInstance,
  defineWorkflowNode,
  type ContentPackageId,
  type ContentPackageOwnerId,
  type WorkflowEventId,
  type WorkflowInstanceId,
  type WorkflowNodeId,
  type WorkflowNodeKey,
  type WorkflowEventState,
  type WorkflowInstanceState,
  type WorkflowNodeState,
  type WorkflowTemplateId,
  type WorkflowTemplateVersion,
} from '@contentos/core';
import {
  createWorkflowRepositoryTestBoundary,
  type WorkflowRepositoryTestBoundary as DatabaseWorkflowRepositoryTestBoundary,
} from '@contentos/database';

import { readComposeCredentials, requireState } from './env.js';

function databaseUrl(): string {
  const state = requireState();
  const credentials = readComposeCredentials(state.envFile);
  return `postgresql://smoke_user:${encodeURIComponent(credentials.POSTGRES_PASSWORD ?? '')}@127.0.0.1:${state.ports.postgres}/smoke_db`;
}

function postgresConfig(database: string): {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
} {
  const state = requireState();
  const credentials = readComposeCredentials(state.envFile);
  return {
    host: '127.0.0.1',
    port: state.ports.postgres,
    user: 'smoke_user',
    password: credentials.POSTGRES_PASSWORD ?? '',
    database,
  };
}

const MIGRATIONS_DIRECTORY = fileURLToPath(new URL('../../../../migrations/', import.meta.url));
const PRE_WORKFLOW_MIGRATIONS = [
  '0000_unusual_midnight.sql',
  '0001_large_donald_blake.sql',
  '0002_soft_war_machine.sql',
  '0003_absent_prism.sql',
] as const;

function quoteTaskDatabase(database: string): string {
  if (!/^m2wf001_[0-9a-f]{32}$/.test(database)) throw new Error('unexpected migration test database name');
  return `"${database}"`;
}

async function applySqlMigration(client: Client, filename: string): Promise<void> {
  const sql = await readFile(join(MIGRATIONS_DIRECTORY, filename), 'utf8');
  for (const statement of sql.split('--> statement-breakpoint')) {
    const trimmed = statement.trim();
    if (trimmed.length > 0) await client.query(trimmed);
  }
}

async function insertHistoricalSource(client: Client): Promise<{
  packageId: string;
  sourceId: string;
  sourceVersionId: string;
}> {
  const ownerUserId = randomUUID();
  const packageId = randomUUID();
  const sourceId = randomUUID();
  const snapshotId = randomUUID();
  const workingCopyId = randomUUID();
  const sourceVersionId = randomUUID();
  await client.query(
    `INSERT INTO content_packages
      (id, owner_user_id, title, description, content_mode, requested_blog, requested_xiaohongshu,
       lifecycle, revision, created_at, updated_at, archived_at)
     VALUES ($1, $2, 'pre-workflow package', NULL, 'creator_led', true, true, 'active', 1, now(), now(), NULL)`,
    [packageId, ownerUserId],
  );
  await client.query(
    `INSERT INTO sources
      (id, content_package_id, owner_user_id, source_type, role, label, capture_type, created_at)
     VALUES ($1, $2, $3, 'pasted_text', 'primary', 'pre-workflow source', 'pasted_text', now())`,
    [sourceId, packageId, ownerUserId],
  );
  await client.query(
    `INSERT INTO source_raw_snapshots
      (id, source_id, owner_user_id, storage_key, sha256, byte_size, content_type, captured_at)
     VALUES ($1, $2, $3, $4, $5, 18, 'text/plain; charset=utf-8', now())`,
    [snapshotId, sourceId, ownerUserId, `workflow-migration/${randomUUID()}`, 'a'.repeat(64)],
  );
  await client.query(
    `INSERT INTO source_working_copies
      (id, source_id, owner_user_id, body, schema_version, revision, checkpointed_revision,
       base_version_id, updated_at, created_at)
     VALUES ($1, $2, $3, $4::jsonb, 'source/normalized/v1', 1, NULL, NULL, now(), now())`,
    [workingCopyId, sourceId, ownerUserId, JSON.stringify({ text: 'historical source body' })],
  );
  await client.query(
    `INSERT INTO source_versions
      (id, source_id, owner_user_id, version_number, parent_version_id, body, content_hash,
       schema_version, raw_snapshot_id, created_by_id, created_at)
     VALUES ($1, $2, $3, 1, NULL, $4::jsonb, $5, 'source/normalized/v1', $6, $3, now())`,
    [
      sourceVersionId,
      sourceId,
      ownerUserId,
      JSON.stringify({ text: 'historical source body' }),
      'b'.repeat(64),
      snapshotId,
    ],
  );
  await client.query(
    `INSERT INTO source_heads
      (source_id, owner_user_id, working_copy_id, latest_version_id, review_candidate_version_id,
       approved_version_id, updated_at)
     VALUES ($1, $2, $3, $4, $4, $4, now())`,
    [sourceId, ownerUserId, workingCopyId, sourceVersionId],
  );
  await client.query(
    `INSERT INTO source_approvals
      (id, source_id, owner_user_id, approved_version_id, approved_by_id, approved_at, validation_summary)
     VALUES ($1, $2, $3, $4, $3, now(), 'historical fixture valid')`,
    [randomUUID(), sourceId, ownerUserId, sourceVersionId],
  );
  return { packageId, sourceId, sourceVersionId };
}

async function withIsolatedMigrationDatabase(
  action: (client: Client, database: string) => Promise<void>,
): Promise<void> {
  const database = `m2wf001_${randomUUID().replaceAll('-', '')}`;
  const maintenance = new Client(postgresConfig('postgres'));
  let created = false;
  await maintenance.connect();
  try {
    await maintenance.query(`CREATE DATABASE ${quoteTaskDatabase(database)}`);
    created = true;
  } finally {
    await maintenance.end();
  }

  const target = new Client(postgresConfig(database));
  try {
    await target.connect();
    await action(target, database);
  } finally {
    await target.end();
    if (created) {
      const cleanup = new Client(postgresConfig('postgres'));
      try {
        await cleanup.connect();
        await cleanup.query(`DROP DATABASE ${quoteTaskDatabase(database)}`);
      } finally {
        await cleanup.end();
      }
    }
  }
}

function owner(): ContentPackageOwnerId {
  return randomUUID() as ContentPackageOwnerId;
}

function packageId(): ContentPackageId {
  return randomUUID() as ContentPackageId;
}

async function insertPackage(
  boundary: DatabaseWorkflowRepositoryTestBoundary,
  contentPackageId: ContentPackageId,
  ownerUserId: ContentPackageOwnerId,
): Promise<void> {
  await boundary.query(
    `INSERT INTO content_packages
      (id, owner_user_id, title, description, content_mode, requested_blog, requested_xiaohongshu,
       lifecycle, revision, created_at, updated_at, archived_at)
     VALUES ($1,$2,'workflow repository fixture',NULL,'creator_led',true,true,'active',1,now(),now(),NULL)`,
    [contentPackageId, ownerUserId],
  );
}

function instance(contentPackageId: ContentPackageId, ownerUserId: ContentPackageOwnerId): WorkflowInstanceState {
  const timestamp = new Date('2026-08-01T00:10:00.000Z');
  return defineWorkflowInstance({
    id: randomUUID() as WorkflowInstanceId,
    contentPackageId,
    ownerUserId,
    template: CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE,
    lifecycle: 'active',
    revision: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

function node(
  workflowInstance: WorkflowInstanceState,
  key: WorkflowNodeKey = 'source_capture' as WorkflowNodeKey,
): WorkflowNodeState {
  const timestamp = new Date('2026-08-01T00:11:00.000Z');
  return defineWorkflowNode({
    id: randomUUID() as WorkflowNodeId,
    workflowInstance,
    template: CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE,
    templateNodeKey: key,
    state: 'ready',
    revision: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

function event(
  workflowInstance: WorkflowInstanceState,
  sequence: number,
  workflowNode?: WorkflowNodeState | null,
): WorkflowEventState {
  return defineWorkflowEvent({
    id: randomUUID() as WorkflowEventId,
    workflowInstance,
    sequence,
    eventType: 'fixture.created',
    payload: {},
    occurredAt: new Date('2026-08-01T00:12:00.000Z'),
    ...(workflowNode === undefined ? {} : { workflowNode }),
  });
}

async function expectConstraint(
  boundary: DatabaseWorkflowRepositoryTestBoundary,
  text: string,
  values: readonly unknown[],
  expectedConstraint: string,
): Promise<void> {
  try {
    await boundary.query(text, values);
    throw new Error(`expected constraint ${expectedConstraint} to reject the statement`);
  } catch (error) {
    expect((error as { constraint?: string }).constraint).toBe(expectedConstraint);
  }
}

async function expectRepositoryConstraint(operation: Promise<void>, expectedConstraint: string): Promise<void> {
  try {
    await operation;
    throw new Error(`expected constraint ${expectedConstraint} to reject the repository operation`);
  } catch (error) {
    const wrapped = error as { constraint?: string; cause?: { constraint?: string } };
    expect(wrapped.constraint ?? wrapped.cause?.constraint).toBe(expectedConstraint);
  }
}

function constraintName(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const value = error as { constraint?: unknown; cause?: { constraint?: unknown } };
  if (typeof value.constraint === 'string') return value.constraint;
  return typeof value.cause?.constraint === 'string' ? value.cause.constraint : undefined;
}

describe('M2-WF-001 PostgreSQL workflow persistence', () => {
  it('loads the seeded catalog by ordinal and leaves an empty migrated database without workflow history', async () => {
    const boundary = createWorkflowRepositoryTestBoundary(databaseUrl());
    try {
      expect(await boundary.repository.loadCatalog()).toEqual([CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE]);
      const counts = await Promise.all([
        boundary.query<{ count: number }>('SELECT count(*)::int AS count FROM workflow_instances'),
        boundary.query<{ count: number }>('SELECT count(*)::int AS count FROM workflow_nodes'),
        boundary.query<{ count: number }>('SELECT count(*)::int AS count FROM workflow_events'),
      ]);
      expect(counts.map((rows) => rows[0]?.count)).toEqual([0, 0, 0]);
    } finally {
      await boundary.close();
    }
  });

  it('upgrades an isolated 0003 database to 0004 without rewriting existing Content Package or Source history', async () => {
    await withIsolatedMigrationDatabase(async (client, database) => {
      for (const migration of PRE_WORKFLOW_MIGRATIONS) await applySqlMigration(client, migration);
      const history = await insertHistoricalSource(client);
      expect(
        (
          await client.query<{ table_name: string | null }>('SELECT to_regclass($1)::text AS table_name', [
            'public.workflow_instances',
          ])
        ).rows[0]?.table_name,
      ).toBeNull();

      await applySqlMigration(client, '0004_long_morph.sql');

      expect(
        (
          await client.query<{ id: string; title: string }>('SELECT id, title FROM content_packages WHERE id=$1', [
            history.packageId,
          ])
        ).rows,
      ).toEqual([{ id: history.packageId, title: 'pre-workflow package' }]);
      expect(
        (
          await client.query<{ id: string; source_type: string }>('SELECT id, source_type FROM sources WHERE id=$1', [
            history.sourceId,
          ])
        ).rows,
      ).toEqual([{ id: history.sourceId, source_type: 'pasted_text' }]);
      expect(
        (
          await client.query<{ count: number }>('SELECT count(*)::int AS count FROM source_versions WHERE id=$1', [
            history.sourceVersionId,
          ])
        ).rows,
      ).toEqual([{ count: 1 }]);
      const workflowCounts: Array<number | undefined> = [];
      for (const table of ['workflow_instances', 'workflow_nodes', 'workflow_events']) {
        const rows = await client.query<{ count: number }>(`SELECT count(*)::int AS count FROM ${table}`);
        workflowCounts.push(rows.rows[0]?.count);
      }
      expect(workflowCounts).toEqual([0, 0, 0]);
      expect(database).toMatch(/^m2wf001_[0-9a-f]{32}$/);
    });
  });

  it('enforces owner/package binding, exact template hash, one v1 instance, and neutral Node/Event primitives', async () => {
    const boundary = createWorkflowRepositoryTestBoundary(databaseUrl());
    const packageA = packageId();
    const packageB = packageId();
    const ownerA = owner();
    const ownerB = owner();
    try {
      await insertPackage(boundary, packageA, ownerA);
      await insertPackage(boundary, packageB, ownerB);
      const instanceA = instance(packageA, ownerA);
      await boundary.repository.insertInstance(instanceA);
      expect(await boundary.repository.findInstanceByIdForOwner(instanceA.id, packageA, ownerA)).toEqual(instanceA);
      expect(await boundary.repository.findInstanceByIdForOwner(instanceA.id, packageA, ownerB)).toBeNull();
      expect(
        await boundary.repository.findInstanceForPackageOwner(
          packageA,
          ownerA,
          CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE.definition.templateId as WorkflowTemplateId,
          CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE.definition.templateVersion as WorkflowTemplateVersion,
        ),
      ).toEqual(instanceA);

      await expectRepositoryConstraint(
        boundary.repository.insertInstance({ ...instanceA, id: randomUUID() as WorkflowInstanceId }),
        'workflow_instances_package_template_unique',
      );
      await expectRepositoryConstraint(
        boundary.repository.insertInstance({
          ...instanceA,
          contentPackageId: packageB,
          id: randomUUID() as WorkflowInstanceId,
        }),
        'workflow_instances_package_owner_fk',
      );
      await expect(
        boundary.repository.insertInstance({
          ...instanceA,
          definitionSha256: '0'.repeat(64),
          id: randomUUID() as WorkflowInstanceId,
        }),
      ).rejects.toThrow('INVALID_WORKFLOW_INSTANCE');
      await expect(
        boundary.repository.insertInstance({ ...instanceA, revision: 0, id: randomUUID() as WorkflowInstanceId }),
      ).rejects.toThrow('INVALID_WORKFLOW_INSTANCE');

      const nodeA = node(instanceA);
      await boundary.repository.insertNode(nodeA);
      expect(
        await boundary.query<{ count: number }>(
          'SELECT count(*)::int AS count FROM workflow_nodes WHERE workflow_instance_id=$1',
          [instanceA.id],
        ),
      ).toEqual([{ count: 1 }]);
      await expectRepositoryConstraint(
        boundary.repository.insertNode({ ...nodeA, id: randomUUID() as WorkflowNodeId }),
        'workflow_nodes_instance_key_unique',
      );
      await expect(
        boundary.repository.insertNode({
          ...nodeA,
          templateNodeKey: 'unknown' as WorkflowNodeKey,
          id: randomUUID() as WorkflowNodeId,
        }),
      ).rejects.toThrow('INVALID_WORKFLOW_NODE');
      await expect(
        boundary.repository.insertNode({ ...nodeA, state: 'unknown' as never, id: randomUUID() as WorkflowNodeId }),
      ).rejects.toThrow('INVALID_WORKFLOW_NODE');

      const eventA = event(instanceA, 1, nodeA);
      await boundary.repository.appendEvent(eventA);
      await boundary.repository.appendEvent(event(instanceA, 2));
      await expectRepositoryConstraint(
        boundary.repository.appendEvent({ ...eventA, id: randomUUID() as WorkflowEventId }),
        'workflow_events_instance_sequence_unique',
      );
      await expect(
        boundary.repository.appendEvent({ ...eventA, id: randomUUID() as WorkflowEventId, payload: [] as never }),
      ).rejects.toThrow('INVALID_WORKFLOW_EVENT');
      await expect(
        boundary.repository.appendEvent({
          ...eventA,
          id: randomUUID() as WorkflowEventId,
          workflowNodeId: randomUUID() as WorkflowNodeId,
        }),
      ).rejects.toThrow('INVALID_WORKFLOW_EVENT');
    } finally {
      await boundary.close();
    }
  });

  it('proves workflow relational constraints directly with parameterized SQL and named PostgreSQL constraints', async () => {
    const boundary = createWorkflowRepositoryTestBoundary(databaseUrl());
    const packageA = packageId();
    const packageB = packageId();
    const packageC = packageId();
    const ownerA = owner();
    const ownerB = owner();
    const ownerC = owner();
    try {
      await insertPackage(boundary, packageA, ownerA);
      await insertPackage(boundary, packageB, ownerB);
      await insertPackage(boundary, packageC, ownerC);
      const instanceA = instance(packageA, ownerA);
      const instanceB = instance(packageB, ownerB);
      await boundary.repository.insertInstance(instanceA);
      await boundary.repository.insertInstance(instanceB);
      const nodeA = node(instanceA);
      const nodeB = node(instanceB);
      await boundary.repository.insertNode(nodeA);
      await boundary.repository.insertNode(nodeB);
      const templateId = CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE.definition.templateId;
      const templateVersion = CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE.definition.templateVersion;
      const definitionSha256 = CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE.definitionSha256;

      await expectConstraint(
        boundary,
        `INSERT INTO workflow_instances
          (id, content_package_id, owner_user_id, template_id, template_version, definition_sha256,
           lifecycle, revision, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now(),now())`,
        [randomUUID(), packageC, ownerC, templateId, templateVersion, '0'.repeat(64), 'active', 1],
        'workflow_instances_template_binding_fk',
      );
      await expectConstraint(
        boundary,
        `INSERT INTO workflow_instances
          (id, content_package_id, owner_user_id, template_id, template_version, definition_sha256,
           lifecycle, revision, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now(),now())`,
        [randomUUID(), packageC, ownerA, templateId, templateVersion, definitionSha256, 'active', 1],
        'workflow_instances_package_owner_fk',
      );
      await expectConstraint(
        boundary,
        `INSERT INTO workflow_instances
          (id, content_package_id, owner_user_id, template_id, template_version, definition_sha256,
           lifecycle, revision, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now(),now())`,
        [randomUUID(), packageA, ownerA, templateId, templateVersion, definitionSha256, 'invalid', 1],
        'workflow_instances_lifecycle_check',
      );
      await expectConstraint(
        boundary,
        `INSERT INTO workflow_instances
          (id, content_package_id, owner_user_id, template_id, template_version, definition_sha256,
           lifecycle, revision, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now(),now())`,
        [randomUUID(), packageA, ownerA, templateId, templateVersion, definitionSha256, 'active', 0],
        'workflow_instances_revision_check',
      );

      await expectConstraint(
        boundary,
        `INSERT INTO workflow_nodes
          (id, workflow_instance_id, content_package_id, owner_user_id, template_id, template_version,
           template_node_key, state, revision, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),now())`,
        [randomUUID(), instanceA.id, packageB, ownerB, templateId, templateVersion, 'research', 'ready', 1],
        'workflow_nodes_instance_binding_fk',
      );
      await expectConstraint(
        boundary,
        `INSERT INTO workflow_nodes
          (id, workflow_instance_id, content_package_id, owner_user_id, template_id, template_version,
           template_node_key, state, revision, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),now())`,
        [randomUUID(), instanceA.id, packageA, ownerA, templateId, templateVersion, 'not_a_template_node', 'ready', 1],
        'workflow_nodes_template_node_fk',
      );
      await expectConstraint(
        boundary,
        `INSERT INTO workflow_nodes
          (id, workflow_instance_id, content_package_id, owner_user_id, template_id, template_version,
           template_node_key, state, revision, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),now())`,
        [randomUUID(), instanceA.id, packageA, ownerA, templateId, templateVersion, 'research', 'invalid', 1],
        'workflow_nodes_state_check',
      );
      await expectConstraint(
        boundary,
        `INSERT INTO workflow_nodes
          (id, workflow_instance_id, content_package_id, owner_user_id, template_id, template_version,
           template_node_key, state, revision, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),now())`,
        [randomUUID(), instanceA.id, packageA, ownerA, templateId, templateVersion, 'research', 'ready', 0],
        'workflow_nodes_revision_check',
      );

      await expectConstraint(
        boundary,
        `INSERT INTO workflow_events
          (id, workflow_instance_id, content_package_id, owner_user_id, sequence, event_type, payload,
           occurred_at, workflow_node_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,now(),$8)`,
        [randomUUID(), instanceA.id, packageA, ownerA, 99, 'fixture.other-node', '{}', nodeB.id],
        'workflow_events_node_instance_owner_fk',
      );
      await expectConstraint(
        boundary,
        `INSERT INTO workflow_events
          (id, workflow_instance_id, content_package_id, owner_user_id, sequence, event_type, payload,
           occurred_at, workflow_node_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,now(),$8)`,
        [randomUUID(), instanceA.id, packageA, ownerA, 0, 'fixture.invalid-sequence', '{}', null],
        'workflow_events_sequence_check',
      );
      await expectConstraint(
        boundary,
        `INSERT INTO workflow_events
          (id, workflow_instance_id, content_package_id, owner_user_id, sequence, event_type, payload,
           occurred_at, workflow_node_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,now(),$8)`,
        [randomUUID(), instanceA.id, packageA, ownerA, 98, 'fixture.invalid-payload', '[]', null],
        'workflow_events_payload_object_check',
      );
      await expectConstraint(
        boundary,
        `INSERT INTO workflow_events
          (id, workflow_instance_id, content_package_id, owner_user_id, sequence, event_type, payload,
           occurred_at, workflow_node_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,now(),$8)`,
        [randomUUID(), instanceA.id, packageA, ownerA, 97, '   ', '{}', null],
        'workflow_events_type_nonempty_check',
      );
    } finally {
      await boundary.close();
    }
  });

  it('rejects catalog and Event UPDATE/DELETE through ordinary application connections', async () => {
    const boundary = createWorkflowRepositoryTestBoundary(databaseUrl());
    const packageA = packageId();
    const ownerA = owner();
    try {
      await insertPackage(boundary, packageA, ownerA);
      const instanceA = instance(packageA, ownerA);
      await boundary.repository.insertInstance(instanceA);
      const nodeA = node(instanceA);
      await boundary.repository.insertNode(nodeA);
      const eventA = event(instanceA, 1, nodeA);
      await boundary.repository.appendEvent(eventA);

      await expectConstraint(
        boundary,
        `UPDATE workflow_templates SET seeded_at=seeded_at WHERE template_id='content-package-dual-output' AND template_version='v1'`,
        [],
        'workflow_catalog_immutable',
      );
      await expectConstraint(
        boundary,
        `DELETE FROM workflow_template_nodes WHERE template_id='content-package-dual-output' AND template_version='v1' AND node_key='source_capture'`,
        [],
        'workflow_catalog_immutable',
      );
      await expectConstraint(
        boundary,
        `UPDATE workflow_template_edges SET ordinal=ordinal WHERE template_id='content-package-dual-output' AND template_version='v1' AND ordinal=1`,
        [],
        'workflow_catalog_immutable',
      );
      await expectConstraint(
        boundary,
        'UPDATE workflow_events SET payload=$1::jsonb WHERE id=$2',
        ['{}', eventA.id],
        'workflow_events_immutable',
      );
      await expectConstraint(
        boundary,
        'DELETE FROM workflow_events WHERE id=$1',
        [eventA.id],
        'workflow_events_immutable',
      );
      expect(await boundary.query('SELECT id FROM workflow_events WHERE id=$1', [eventA.id])).toHaveLength(1);
    } finally {
      await boundary.close();
    }
  });

  it('serializes concurrent duplicate Package/v1 insertion to one Instance without Node/Event side effects', async () => {
    const packageA = packageId();
    const ownerA = owner();
    const setup = createWorkflowRepositoryTestBoundary(databaseUrl());
    const first = createWorkflowRepositoryTestBoundary(databaseUrl());
    const second = createWorkflowRepositoryTestBoundary(databaseUrl());
    try {
      await insertPackage(setup, packageA, ownerA);
      const firstInstance = instance(packageA, ownerA);
      const secondInstance = instance(packageA, ownerA);
      const results = await Promise.allSettled([
        first.repository.insertInstance(firstInstance),
        second.repository.insertInstance(secondInstance),
      ]);
      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      const rejected = results.find((result): result is PromiseRejectedResult => result.status === 'rejected');
      expect(rejected).toBeDefined();
      expect(constraintName(rejected?.reason)).toBe('workflow_instances_package_template_unique');
      expect(
        await setup.query<{ count: number }>(
          'SELECT count(*)::int AS count FROM workflow_instances WHERE content_package_id=$1 AND template_id=$2 AND template_version=$3',
          [packageA, 'content-package-dual-output', 'v1'],
        ),
      ).toEqual([{ count: 1 }]);
      expect(
        await setup.query<{ count: number }>(
          'SELECT count(*)::int AS count FROM workflow_nodes WHERE content_package_id=$1',
          [packageA],
        ),
      ).toEqual([{ count: 0 }]);
      expect(
        await setup.query<{ count: number }>(
          'SELECT count(*)::int AS count FROM workflow_events WHERE content_package_id=$1',
          [packageA],
        ),
      ).toEqual([{ count: 0 }]);
    } finally {
      await Promise.all([setup.close(), first.close(), second.close()]);
    }
  });
});
