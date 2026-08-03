import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Client } from 'pg';
import { describe, expect, it } from 'vitest';

import { CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE } from '@contentos/core';

import { readComposeCredentials, requireState } from './env.js';

const MIGRATIONS_DIRECTORY = fileURLToPath(new URL('../../../../migrations/', import.meta.url));
const MIGRATIONS = [
  '0000_unusual_midnight.sql',
  '0001_large_donald_blake.sql',
  '0002_soft_war_machine.sql',
  '0003_absent_prism.sql',
  '0004_long_morph.sql',
  '0005_mixed_doctor_strange.sql',
  '0006_special_triton.sql',
] as const;
const LEASE_MIGRATION = '0007_silent_alex_power.sql';
const RESULT_MIGRATION = '0008_mixed_warstar.sql';

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

function quoteDatabase(database: string): string {
  if (!/^m2wf002_[0-9a-f]{32}$/.test(database)) throw new Error('unexpected migration test database name');
  return `"${database}"`;
}

async function applyMigration(client: Client, filename: string): Promise<void> {
  const sql = await readFile(join(MIGRATIONS_DIRECTORY, filename), 'utf8');
  for (const statement of sql.split('--> statement-breakpoint')) {
    const trimmed = statement.trim();
    if (trimmed.length > 0) await client.query(trimmed);
  }
}

async function withIsolatedDatabase(action: (client: Client) => Promise<void>): Promise<void> {
  const database = `m2wf002_${randomUUID().replaceAll('-', '')}`;
  const maintenance = new Client(postgresConfig('postgres'));
  let created = false;
  await maintenance.connect();
  try {
    await maintenance.query(`CREATE DATABASE ${quoteDatabase(database)}`);
    created = true;
  } finally {
    await maintenance.end();
  }

  const target = new Client(postgresConfig(database));
  try {
    await target.connect();
    await action(target);
  } finally {
    await target.end();
    if (created) {
      const cleanup = new Client(postgresConfig('postgres'));
      try {
        await cleanup.connect();
        await cleanup.query(`DROP DATABASE ${quoteDatabase(database)}`);
      } finally {
        await cleanup.end();
      }
    }
  }
}

async function insertPackageAndSource(client: Client): Promise<{
  packageId: string;
  ownerUserId: string;
  sourceId: string;
}> {
  const packageId = randomUUID();
  const ownerUserId = randomUUID();
  const sourceId = randomUUID();
  await client.query(
    `INSERT INTO content_packages
      (id, owner_user_id, title, description, content_mode, requested_blog, requested_xiaohongshu,
       lifecycle, revision, created_at, updated_at, archived_at)
     VALUES ($1, $2, 'migration preservation package', NULL, 'creator_led', true, true, 'active', 1, now(), now(), NULL)`,
    [packageId, ownerUserId],
  );
  await client.query(
    `INSERT INTO sources
      (id, content_package_id, owner_user_id, source_type, role, label, capture_type, created_at)
     VALUES ($1, $2, $3, 'pasted_text', 'primary', 'preserved source', 'pasted_text', now())`,
    [sourceId, packageId, ownerUserId],
  );
  return { packageId, ownerUserId, sourceId };
}

async function insertWorkflowHistory(
  client: Client,
  packageId: string,
  ownerUserId: string,
): Promise<{ instanceId: string; nodeId: string }> {
  const instanceId = randomUUID();
  const nodeId = randomUUID();
  await client.query(
    `INSERT INTO workflow_instances
      (id, content_package_id, owner_user_id, template_id, template_version, definition_sha256,
       lifecycle, revision, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'active', 1, now(), now())`,
    [
      instanceId,
      packageId,
      ownerUserId,
      CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE.definition.templateId,
      CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE.definition.templateVersion,
      CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE.definitionSha256,
    ],
  );
  await client.query(
    `INSERT INTO workflow_nodes
      (id, workflow_instance_id, content_package_id, owner_user_id, template_id, template_version,
       template_node_key, state, revision, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'source_capture', 'ready', 1, now(), now())`,
    [
      nodeId,
      instanceId,
      packageId,
      ownerUserId,
      CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE.definition.templateId,
      CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE.definition.templateVersion,
    ],
  );
  await client.query(
    `INSERT INTO workflow_events
      (id, workflow_instance_id, content_package_id, owner_user_id, sequence, event_type, payload,
       occurred_at, workflow_node_id)
     VALUES ($1, $2, $3, $4, 1, 'fixture.migration_history', $5::jsonb, now(), $6)`,
    [randomUUID(), instanceId, packageId, ownerUserId, JSON.stringify({ preserved: true }), nodeId],
  );
  return { instanceId, nodeId };
}

async function expectConstraint(
  client: Client,
  sql: string,
  values: readonly unknown[],
  expected: string,
): Promise<void> {
  try {
    await client.query(sql, [...values]);
    throw new Error(`expected constraint ${expected} to reject the statement`);
  } catch (error) {
    expect((error as { constraint?: string }).constraint).toBe(expected);
  }
}

describe('M2-WF-002 additive migration', () => {
  it('installs an empty database without URL-capture backfill', async () => {
    await withIsolatedDatabase(async (client) => {
      for (const migration of MIGRATIONS) await applyMigration(client, migration);
      await applyMigration(client, LEASE_MIGRATION);
      await applyMigration(client, RESULT_MIGRATION);
      const counts = await Promise.all(
        [
          'url_source_references',
          'url_capture_requests',
          'workflow_tasks',
          'workflow_outbox_records',
          'workflow_instances',
          'workflow_nodes',
          'workflow_events',
          'url_capture_results',
        ].map(
          async (table) =>
            (await client.query<{ count: number }>(`SELECT count(*)::int AS count FROM ${table}`)).rows[0]?.count,
        ),
      );
      expect(counts).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
      expect(
        (await client.query<{ count: number }>('SELECT count(*)::int AS count FROM workflow_templates')).rows[0]?.count,
      ).toBe(1);
    });
  });

  it('upgrades 0004 to 0005 without rewriting Package, Source, or Workflow history', async () => {
    await withIsolatedDatabase(async (client) => {
      for (const migration of MIGRATIONS.slice(0, 4)) await applyMigration(client, migration);
      const history = await insertPackageAndSource(client);
      await applyMigration(client, MIGRATIONS[4]);
      const workflow = await insertWorkflowHistory(client, history.packageId, history.ownerUserId);

      await applyMigration(client, MIGRATIONS[5]);

      expect(
        (await client.query('SELECT id FROM content_packages WHERE id=$1', [history.packageId])).rows,
      ).toHaveLength(1);
      expect((await client.query('SELECT id FROM sources WHERE id=$1', [history.sourceId])).rows).toHaveLength(1);
      expect(
        (await client.query('SELECT id FROM workflow_instances WHERE id=$1', [workflow.instanceId])).rows,
      ).toHaveLength(1);
      expect((await client.query('SELECT id FROM workflow_nodes WHERE id=$1', [workflow.nodeId])).rows).toHaveLength(1);
      expect(
        (
          await client.query('SELECT event_type FROM workflow_events WHERE workflow_instance_id=$1', [
            workflow.instanceId,
          ])
        ).rows,
      ).toEqual([{ event_type: 'fixture.migration_history' }]);

      const newTableCounts = await Promise.all(
        ['url_source_references', 'url_capture_requests', 'workflow_tasks', 'workflow_outbox_records'].map(
          async (table) =>
            (await client.query<{ count: number }>(`SELECT count(*)::int AS count FROM ${table}`)).rows[0]?.count,
        ),
      );
      expect(newTableCounts).toEqual([0, 0, 0, 0]);

      const referenceId = randomUUID();
      const requestId = randomUUID();
      const taskId = randomUUID();
      await client.query(
        `INSERT INTO url_source_references
          (id, content_package_id, owner_user_id, role, submitted_url, created_at)
         VALUES ($1, $2, $3, 'primary', 'https://example.com/article?private=1#section', now())`,
        [referenceId, history.packageId, history.ownerUserId],
      );
      await client.query(
        `INSERT INTO url_capture_requests
          (id, source_reference_id, workflow_instance_id, workflow_node_id, content_package_id, owner_user_id,
           expected_package_revision, command_kind, idempotency_key, request_fingerprint, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 1, 'url_capture_request', 'migration-key-0001', $7, now())`,
        [
          requestId,
          referenceId,
          workflow.instanceId,
          workflow.nodeId,
          history.packageId,
          history.ownerUserId,
          'a'.repeat(64),
        ],
      );
      await client.query(
        `INSERT INTO workflow_tasks
          (id, workflow_instance_id, workflow_node_id, url_capture_request_id, content_package_id, owner_user_id,
           kind, state, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'url_capture', 'queued', now(), now())`,
        [taskId, workflow.instanceId, workflow.nodeId, requestId, history.packageId, history.ownerUserId],
      );
      await client.query(
        `INSERT INTO workflow_outbox_records
          (id, task_id, content_package_id, owner_user_id, category, envelope_version, payload, state, created_at)
         VALUES ($1, $2, $3, $4, 'fetcher', 'fetcher-task/v1', $5::jsonb, 'pending', now())`,
        [
          randomUUID(),
          taskId,
          history.packageId,
          history.ownerUserId,
          JSON.stringify({ taskId, taskKind: 'url_capture', envelopeVersion: 'fetcher-task/v1' }),
        ],
      );
      const secondReferenceId = randomUUID();
      await client.query(
        `INSERT INTO url_source_references
          (id, content_package_id, owner_user_id, role, submitted_url, created_at)
         VALUES ($1, $2, $3, 'supporting', 'https://example.com/second', now())`,
        [secondReferenceId, history.packageId, history.ownerUserId],
      );

      await expectConstraint(
        client,
        `INSERT INTO url_source_references
          (id, content_package_id, owner_user_id, role, submitted_url, created_at)
         VALUES ($1, $2, $3, 'invalid', 'https://example.com', now())`,
        [randomUUID(), history.packageId, history.ownerUserId],
        'url_source_references_role_check',
      );
      await expectConstraint(
        client,
        `INSERT INTO url_capture_requests
          (id, source_reference_id, workflow_instance_id, workflow_node_id, content_package_id, owner_user_id,
           expected_package_revision, command_kind, idempotency_key, request_fingerprint, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, 1, 'url_capture_request', 'migration-key-0002', $7, now())`,
        [
          randomUUID(),
          secondReferenceId,
          workflow.instanceId,
          workflow.nodeId,
          history.packageId,
          history.ownerUserId,
          'b'.repeat(64),
        ],
        'url_capture_requests_node_unique',
      );
      await expectConstraint(
        client,
        `INSERT INTO workflow_outbox_records
          (id, task_id, content_package_id, owner_user_id, category, envelope_version, payload, state, created_at)
         VALUES ($1, $2, $3, $4, 'fetcher', 'fetcher-task/v1', $5::jsonb, 'pending', now())`,
        [
          randomUUID(),
          taskId,
          history.packageId,
          history.ownerUserId,
          JSON.stringify({ taskId, taskKind: 'url_capture' }),
        ],
        'workflow_outbox_records_payload_shape_check',
      );
      await expectConstraint(
        client,
        `INSERT INTO url_capture_requests
          (id, source_reference_id, workflow_instance_id, workflow_node_id, content_package_id, owner_user_id,
           expected_package_revision, command_kind, idempotency_key, request_fingerprint, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 1, 'url_capture_request', 'migration-key-0003', $7, now())`,
        [
          randomUUID(),
          randomUUID(),
          workflow.instanceId,
          randomUUID(),
          history.packageId,
          history.ownerUserId,
          'c'.repeat(64),
        ],
        'url_capture_requests_source_reference_binding_fk',
      );
    });
  });

  it('upgrades 0005 to 0006 and 0007 with safe lease defaults, no history rewrite, and named checks', async () => {
    await withIsolatedDatabase(async (client) => {
      for (const migration of MIGRATIONS.slice(0, 6)) await applyMigration(client, migration);
      const history = await insertPackageAndSource(client);
      const workflow = await insertWorkflowHistory(client, history.packageId, history.ownerUserId);

      const referenceId = randomUUID();
      const requestId = randomUUID();
      const taskId = randomUUID();
      const outboxId = randomUUID();
      await client.query(
        `INSERT INTO url_source_references
          (id, content_package_id, owner_user_id, role, submitted_url, created_at)
         VALUES ($1, $2, $3, 'primary', 'https://example.com/migration', now())`,
        [referenceId, history.packageId, history.ownerUserId],
      );
      await client.query(
        `INSERT INTO url_capture_requests
          (id, source_reference_id, workflow_instance_id, workflow_node_id, content_package_id, owner_user_id,
           expected_package_revision, command_kind, idempotency_key, request_fingerprint, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 1, 'url_capture_request', 'migration-key-0004', $7, now())`,
        [
          requestId,
          referenceId,
          workflow.instanceId,
          workflow.nodeId,
          history.packageId,
          history.ownerUserId,
          'd'.repeat(64),
        ],
      );
      await client.query(
        `INSERT INTO workflow_tasks
          (id, workflow_instance_id, workflow_node_id, url_capture_request_id, content_package_id, owner_user_id,
           kind, state, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'url_capture', 'queued', now(), now())`,
        [taskId, workflow.instanceId, workflow.nodeId, requestId, history.packageId, history.ownerUserId],
      );
      await client.query(
        `INSERT INTO workflow_outbox_records
          (id, task_id, content_package_id, owner_user_id, category, envelope_version, payload, state, created_at)
         VALUES ($1, $2, $3, $4, 'fetcher', 'fetcher-task/v1', $5::jsonb, 'pending', now())`,
        [
          outboxId,
          taskId,
          history.packageId,
          history.ownerUserId,
          JSON.stringify({ taskId, taskKind: 'url_capture', envelopeVersion: 'fetcher-task/v1' }),
        ],
      );

      await applyMigration(client, MIGRATIONS[6]);
      await applyMigration(client, LEASE_MIGRATION);

      const preservedCounts = await Promise.all(
        ['content_packages', 'sources', 'workflow_instances', 'workflow_nodes', 'workflow_events'].map(
          async (table) =>
            (await client.query<{ count: number }>(`SELECT count(*)::int AS count FROM ${table}`)).rows[0]?.count,
        ),
      );
      expect(preservedCounts).toEqual([1, 1, 1, 1, 1]);

      const taskDefaults = await client.query<{
        state: string;
        claim_attempt_number: number;
        claim_hash: string | null;
        claimed_by: string | null;
        lease_started_at: Date | null;
        lease_expires_at: Date | null;
        lease_heartbeat_at: Date | null;
      }>(
        `SELECT state, claim_attempt_number, claim_hash, claimed_by, lease_started_at,
                lease_expires_at, lease_heartbeat_at
         FROM workflow_tasks WHERE id = $1`,
        [taskId],
      );
      expect(taskDefaults.rows[0]).toEqual({
        state: 'queued',
        claim_attempt_number: 0,
        claim_hash: null,
        claimed_by: null,
        lease_started_at: null,
        lease_expires_at: null,
        lease_heartbeat_at: null,
      });
      await expectConstraint(
        client,
        'UPDATE workflow_tasks SET claim_attempt_number = -1 WHERE id = $1',
        [taskId],
        'workflow_tasks_claim_attempt_number_check',
      );
      await expectConstraint(
        client,
        "UPDATE workflow_tasks SET claim_hash = 'not-a-hash' WHERE id = $1",
        [taskId],
        'workflow_tasks_claim_hash_format_check',
      );
      await expectConstraint(
        client,
        "UPDATE workflow_tasks SET state = 'leased' WHERE id = $1",
        [taskId],
        'workflow_tasks_lease_state_check',
      );

      await expectConstraint(
        client,
        `UPDATE workflow_outbox_records SET delivery_generation = 0 WHERE id = $1`,
        [outboxId],
        'workflow_outbox_records_delivery_generation_check',
      );
      await expectConstraint(
        client,
        `UPDATE workflow_outbox_records SET dispatch_attempt_count = -1 WHERE id = $1`,
        [outboxId],
        'workflow_outbox_records_dispatch_attempt_count_check',
      );
      await expectConstraint(
        client,
        `UPDATE workflow_outbox_records SET state = 'dispatching', dispatch_lease_expires_at = NULL WHERE id = $1`,
        [outboxId],
        'workflow_outbox_records_dispatch_lease_check',
      );
      await expectConstraint(
        client,
        `UPDATE workflow_outbox_records SET dispatch_lease_expires_at = now() WHERE id = $1`,
        [outboxId],
        'workflow_outbox_records_dispatch_lease_check',
      );
      await expectConstraint(
        client,
        `UPDATE workflow_outbox_records SET state = 'dispatched' WHERE id = $1`,
        [outboxId],
        'workflow_outbox_records_acknowledgement_state_check',
      );
      await expectConstraint(
        client,
        `UPDATE workflow_outbox_records
         SET state = 'dispatched', last_dispatch_at = now(), dispatched_at = now() + interval '1 second'
         WHERE id = $1`,
        [outboxId],
        'workflow_outbox_records_acknowledgement_timestamp_check',
      );
      await expectConstraint(
        client,
        `UPDATE workflow_outbox_records SET updated_at = created_at - interval '1 second' WHERE id = $1`,
        [outboxId],
        'workflow_outbox_records_updated_at_check',
      );
      await expectConstraint(
        client,
        `UPDATE workflow_outbox_records SET state = 'invalid' WHERE id = $1`,
        [outboxId],
        'workflow_outbox_records_state_check',
      );

      const after = await client.query<{
        id: string;
        task_id: string;
        content_package_id: string;
        owner_user_id: string;
        category: string;
        envelope_version: string;
        payload: Record<string, unknown>;
        state: string;
        delivery_generation: number;
        dispatch_attempt_count: number;
        dispatch_lease_expires_at: Date | null;
        last_dispatch_at: Date | null;
        dispatched_at: Date | null;
        created_at: Date;
        updated_at: Date;
      }>(
        `SELECT id, task_id, content_package_id, owner_user_id, category, envelope_version, payload,
                state, delivery_generation, dispatch_attempt_count, dispatch_lease_expires_at,
                last_dispatch_at, dispatched_at, created_at, updated_at
         FROM workflow_outbox_records WHERE id = $1`,
        [outboxId],
      );
      expect(after.rows[0]).toMatchObject({
        id: outboxId,
        task_id: taskId,
        content_package_id: history.packageId,
        owner_user_id: history.ownerUserId,
        category: 'fetcher',
        envelope_version: 'fetcher-task/v1',
        payload: { taskId, taskKind: 'url_capture', envelopeVersion: 'fetcher-task/v1' },
        state: 'pending',
        delivery_generation: 1,
        dispatch_attempt_count: 0,
        dispatch_lease_expires_at: null,
        last_dispatch_at: null,
        dispatched_at: null,
      });
      expect(after.rows[0]?.updated_at.getTime()).toBe(after.rows[0]?.created_at.getTime());
    });
  });

  it('upgrades 0007 to 0008 keeping queued/leased tasks valid and adding the Result boundary', async () => {
    await withIsolatedDatabase(async (client) => {
      for (const migration of MIGRATIONS) await applyMigration(client, migration);
      await applyMigration(client, LEASE_MIGRATION);

      const makeTaskFixture = async (
        state: 'queued' | 'leased',
      ): Promise<{ packageId: string; ownerUserId: string; taskId: string }> => {
        const packageId = randomUUID();
        const ownerUserId = randomUUID();
        await client.query(
          `INSERT INTO content_packages
            (id, owner_user_id, title, description, content_mode, requested_blog, requested_xiaohongshu,
             lifecycle, revision, created_at, updated_at, archived_at)
           VALUES ($1, $2, 'result migration package', NULL, 'creator_led', true, true, 'active', 1, now(), now(), NULL)`,
          [packageId, ownerUserId],
        );
        const templateSha = CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE.definitionSha256;
        const instanceId = randomUUID();
        await client.query(
          `INSERT INTO workflow_instances
            (id, content_package_id, owner_user_id, template_id, template_version, definition_sha256,
             lifecycle, revision, created_at, updated_at)
           VALUES ($1, $2, $3, 'content-package-dual-output', 'v1', $4, 'active', 1, now(), now())`,
          [instanceId, packageId, ownerUserId, templateSha],
        );
        const nodeId = randomUUID();
        await client.query(
          `INSERT INTO workflow_nodes
            (id, workflow_instance_id, content_package_id, owner_user_id, template_id, template_version,
             template_node_key, state, revision, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'content-package-dual-output', 'v1', 'source_capture', 'ready', 1, now(), now())`,
          [nodeId, instanceId, packageId, ownerUserId],
        );
        const referenceId = randomUUID();
        const requestId = randomUUID();
        const taskId = randomUUID();
        const outboxId = randomUUID();
        await client.query(
          `INSERT INTO url_source_references
            (id, content_package_id, owner_user_id, role, submitted_url, created_at)
           VALUES ($1, $2, $3, 'primary', 'https://example.com/result-migration', now())`,
          [referenceId, packageId, ownerUserId],
        );
        await client.query(
          `INSERT INTO url_capture_requests
            (id, source_reference_id, workflow_instance_id, workflow_node_id, content_package_id, owner_user_id,
             expected_package_revision, command_kind, idempotency_key, request_fingerprint, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, 1, 'url_capture_request', $7, $8, now())`,
          [
            requestId,
            referenceId,
            instanceId,
            nodeId,
            packageId,
            ownerUserId,
            randomUUID().replaceAll('-', '').slice(0, 16),
            'a'.repeat(64),
          ],
        );
        const taskParams: unknown[] =
          state === 'leased'
            ? [
                taskId,
                instanceId,
                nodeId,
                requestId,
                packageId,
                ownerUserId,
                state,
                1,
                'b'.repeat(64),
                'fetcher',
                '2026-08-01T00:00:00Z',
                '2026-08-01T00:01:00Z',
                '2026-08-01T00:00:30Z',
              ]
            : [taskId, instanceId, nodeId, requestId, packageId, ownerUserId, state, 0, null, null, null, null, null];
        await client.query(
          `INSERT INTO workflow_tasks
            (id, workflow_instance_id, workflow_node_id, url_capture_request_id, content_package_id, owner_user_id,
             kind, state, claim_attempt_number, claim_hash, claimed_by, lease_started_at, lease_expires_at,
             lease_heartbeat_at, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, 'url_capture', $7, $8, $9, $10, $11, $12, $13, now(), now())`,
          taskParams,
        );
        await client.query(
          `INSERT INTO workflow_outbox_records
            (id, task_id, content_package_id, owner_user_id, category, envelope_version, payload, state,
             delivery_generation, dispatch_attempt_count, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'fetcher', 'fetcher-task/v1', $5::jsonb, 'pending', 1, 0, now(), now())`,
          [
            outboxId,
            taskId,
            packageId,
            ownerUserId,
            JSON.stringify({ taskId, taskKind: 'url_capture', envelopeVersion: 'fetcher-task/v1' }),
          ],
        );
        return { packageId, ownerUserId, taskId };
      };
      const leasedFixture = await makeTaskFixture('leased');
      const queuedFixture = await makeTaskFixture('queued');
      const packageId = leasedFixture.packageId;
      const ownerUserId = leasedFixture.ownerUserId;
      const queuedTaskId = queuedFixture.taskId;
      const leasedTaskId = leasedFixture.taskId;

      await applyMigration(client, RESULT_MIGRATION);

      // Existing queued/leased tasks remain valid with unchanged state/lease facts.
      const [queuedRow] = (
        await client.query(
          `SELECT id, state, claim_attempt_number, claim_hash, claimed_by FROM workflow_tasks WHERE id = $1`,
          [queuedTaskId],
        )
      ).rows;
      const [leasedRow] = (
        await client.query(
          `SELECT id, state, claim_attempt_number, claim_hash, claimed_by FROM workflow_tasks WHERE id = $1`,
          [leasedTaskId],
        )
      ).rows;
      expect(queuedRow).toMatchObject({ id: queuedTaskId, state: 'queued', claim_hash: null, claimed_by: null });
      expect(leasedRow).toMatchObject({
        id: leasedTaskId,
        state: 'leased',
        claim_attempt_number: 1,
        claim_hash: 'b'.repeat(64),
        claimed_by: 'fetcher',
      });

      // The Result table exists and is empty: no backfill, no fabricated results.
      expect(
        (await client.query<{ count: number }>('SELECT count(*)::int AS count FROM url_capture_results')).rows[0]
          ?.count,
      ).toBe(0);

      // public_url source type is accepted by the widened check.
      const urlSourceId = randomUUID();
      await client.query(
        `INSERT INTO sources (id, content_package_id, owner_user_id, source_type, role, label, capture_type, created_at)
         VALUES ($1, $2, $3, 'public_url', 'primary', NULL, 'public_url', now())`,
        [urlSourceId, packageId, ownerUserId],
      );

      // The Raw Snapshot bound accepts 2 MiB and the URL media types.
      const snapshotId = randomUUID();
      await client.query(
        `INSERT INTO source_raw_snapshots
          (id, source_id, owner_user_id, storage_key, sha256, byte_size, content_type, captured_at)
         VALUES ($1, $2, $3, $4, $5, 2097152, 'text/html', now())`,
        [
          snapshotId,
          urlSourceId,
          ownerUserId,
          `fetcher/url-capture/${queuedTaskId}/1/raw/${snapshotId}`,
          'c'.repeat(64),
        ],
      );
      const oversizedSnapshotId = randomUUID();
      await expect(
        client.query(
          `INSERT INTO source_raw_snapshots
            (id, source_id, owner_user_id, storage_key, sha256, byte_size, content_type, captured_at)
           VALUES ($1, $2, $3, $4, $5, 2097153, 'text/html', now())`,
          [
            oversizedSnapshotId,
            urlSourceId,
            ownerUserId,
            `fetcher/url-capture/${queuedTaskId}/2/raw/${oversizedSnapshotId}`,
            'd'.repeat(64),
          ],
        ),
      ).rejects.toThrow();

      // A terminal transition clears the lease and satisfies the widened check.
      await client.query(
        `UPDATE workflow_tasks
         SET state = 'succeeded', claim_hash = NULL, claimed_by = NULL, lease_started_at = NULL,
             lease_expires_at = NULL, lease_heartbeat_at = NULL, updated_at = now()
         WHERE id = $1`,
        [leasedTaskId],
      );
      const terminal = await client.query('SELECT state, claim_hash FROM workflow_tasks WHERE id = $1', [leasedTaskId]);
      expect(terminal.rows[0]).toEqual({ state: 'succeeded', claim_hash: null });

      // A terminal task that retains lease fields is rejected by the check.
      await expect(
        client.query(
          `UPDATE workflow_tasks
           SET state = 'failed', claim_hash = $2, updated_at = now()
           WHERE id = $1`,
          [queuedTaskId, 'e'.repeat(64)],
        ),
      ).rejects.toThrow();
    });
  });
});
