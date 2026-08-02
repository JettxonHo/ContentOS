import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  UrlCaptureService,
  type ContentPackageId,
  type ContentPackageOwnerId,
  type UrlCaptureIdGenerator,
} from '@contentos/core';
import {
  createUrlCaptureRepositoryTestBoundary,
  createWorkflowDispatchRepositoryTestBoundary,
  type UrlCaptureRepositoryTestBoundary,
  type WorkflowDispatchRepositoryTestBoundary,
} from '@contentos/database';

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

async function insertPackage(
  boundary: UrlCaptureRepositoryTestBoundary,
  ownerUserId: ContentPackageOwnerId,
): Promise<ContentPackageId> {
  const packageId = randomUUID() as ContentPackageId;
  await boundary.query(
    `INSERT INTO content_packages
      (id, owner_user_id, title, description, content_mode, requested_blog, requested_xiaohongshu,
       lifecycle, revision, created_at, updated_at, archived_at)
     VALUES ($1, $2, 'Dispatcher integration package', NULL, 'creator_led', true, true, 'active', 1, now(), now(), NULL)`,
    [packageId, ownerUserId],
  );
  return packageId;
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
    await boundary.query('DELETE FROM workflow_nodes WHERE content_package_id = $1', [packageId]);
    await boundary.query('DELETE FROM workflow_instances WHERE content_package_id = $1', [packageId]);
    await boundary.query('DELETE FROM content_packages WHERE id = $1', [packageId]);
    await boundary.query('COMMIT');
  } catch (error) {
    await boundary.query('ROLLBACK');
    throw error;
  }
}

async function createTask(): Promise<{
  readonly packageId: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
  readonly taskId: string;
  readonly outboxId: string;
  readonly commandBoundary: UrlCaptureRepositoryTestBoundary;
}> {
  const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
  const ownerUserId = randomUUID() as ContentPackageOwnerId;
  const packageId = await insertPackage(commandBoundary, ownerUserId);
  const result = await new UrlCaptureService(commandBoundary.repository, ids(), {
    now: () => new Date('2026-08-02T00:00:00.000Z'),
  }).submit({
    contentPackageId: packageId,
    ownerUserId,
    expectedPackageRevision: 1,
    role: 'primary',
    submittedUrl: 'https://example.com/dispatcher',
    idempotencyKey: randomUUID().replaceAll('-', '').slice(0, 16),
  });
  const rows = await commandBoundary.query<{ id: string }>(
    'SELECT id FROM workflow_outbox_records WHERE task_id = $1',
    [result.taskId],
  );
  if (!rows[0]) throw new Error('dispatcher fixture outbox is missing');
  return { packageId, ownerUserId, taskId: result.taskId, outboxId: rows[0].id, commandBoundary };
}

async function closeFixtures(
  fixture: Awaited<ReturnType<typeof createTask>>,
  dispatchBoundaries: readonly WorkflowDispatchRepositoryTestBoundary[],
): Promise<void> {
  for (const boundary of dispatchBoundaries) await boundary.close();
  await cleanupPackage(fixture.commandBoundary, fixture.packageId);
  await fixture.commandBoundary.close();
}

describe('M2-WF-003A PostgreSQL Outbox Dispatcher repository', () => {
  it('leases one pending row across concurrent Dispatchers and fences duplicate acknowledgement', async () => {
    const fixture = await createTask();
    const first = createWorkflowDispatchRepositoryTestBoundary(databaseUrl());
    const second = createWorkflowDispatchRepositoryTestBoundary(databaseUrl());
    const now = new Date('2026-08-02T00:00:00.000Z');
    try {
      const [firstClaims, secondClaims] = await Promise.all([
        first.repository.claimDispatchBatch(10, now),
        second.repository.claimDispatchBatch(10, now),
      ]);
      expect(firstClaims.length + secondClaims.length).toBe(1);
      const winner = firstClaims[0] ?? secondClaims[0];
      if (!winner) throw new Error('concurrent dispatcher did not claim a candidate');
      expect(await first.repository.acknowledgeDispatch(winner, now)).toBe(true);
      expect(await second.repository.acknowledgeDispatch(winner, now)).toBe(false);

      const rows = await first.query<{
        task_id: string;
        state: string;
        delivery_generation: number;
        dispatch_attempt_count: number;
        dispatch_lease_expires_at: Date | null;
        last_dispatch_at: Date | null;
        dispatched_at: Date | null;
      }>(
        `SELECT task_id, state, delivery_generation, dispatch_attempt_count, dispatch_lease_expires_at,
                last_dispatch_at, dispatched_at
         FROM workflow_outbox_records WHERE id = $1`,
        [fixture.outboxId],
      );
      expect(rows[0]).toMatchObject({
        task_id: fixture.taskId,
        state: 'dispatched',
        delivery_generation: 1,
        dispatch_attempt_count: 1,
        dispatch_lease_expires_at: null,
        last_dispatch_at: now,
        dispatched_at: now,
      });
    } finally {
      await closeFixtures(fixture, [first, second]);
    }
  });

  it('recovers an expired dispatch lease with the same generation and rejects the stale owner', async () => {
    const fixture = await createTask();
    const first = createWorkflowDispatchRepositoryTestBoundary(databaseUrl());
    const second = createWorkflowDispatchRepositoryTestBoundary(databaseUrl());
    const initial = new Date('2026-08-02T00:00:00.000Z');
    const afterLease = new Date(initial.getTime() + 30_001);
    try {
      const firstClaim = (await first.repository.claimDispatchBatch(10, initial))[0];
      if (!firstClaim) throw new Error('initial dispatcher did not claim a candidate');
      const secondClaim = (await second.repository.claimDispatchBatch(10, afterLease))[0];
      if (!secondClaim) throw new Error('expired dispatcher lease was not reclaimed');
      expect(secondClaim.deliveryGeneration).toBe(firstClaim.deliveryGeneration);
      expect(secondClaim.dispatchAttemptCount).toBe(2);
      expect(await first.repository.acknowledgeDispatch(firstClaim, afterLease)).toBe(false);
      expect(await second.repository.acknowledgeDispatch(secondClaim, afterLease)).toBe(true);
    } finally {
      await closeFixtures(fixture, [first, second]);
    }
  });

  it('returns a matching queue failure to pending without persisting an error diagnostic', async () => {
    const fixture = await createTask();
    const boundary = createWorkflowDispatchRepositoryTestBoundary(databaseUrl());
    const now = new Date('2026-08-02T00:00:00.000Z');
    try {
      const claim = (await boundary.repository.claimDispatchBatch(10, now))[0];
      if (!claim) throw new Error('dispatcher did not claim a candidate');
      expect(await boundary.repository.failDispatch(claim, now)).toBe(true);
      const rows = await boundary.query<{
        state: string;
        dispatch_lease_expires_at: Date | null;
        last_dispatch_at: Date | null;
        dispatched_at: Date | null;
      }>(
        `SELECT state, dispatch_lease_expires_at, last_dispatch_at, dispatched_at
         FROM workflow_outbox_records WHERE id = $1`,
        [fixture.outboxId],
      );
      expect(rows[0]).toEqual({
        state: 'pending',
        dispatch_lease_expires_at: null,
        last_dispatch_at: null,
        dispatched_at: null,
      });
    } finally {
      await closeFixtures(fixture, [boundary]);
    }
  });

  it('does not dispatch or repair a Task that is no longer queued', async () => {
    const fixture = await createTask();
    const boundary = createWorkflowDispatchRepositoryTestBoundary(databaseUrl());
    const now = new Date('2026-08-02T00:00:00.000Z');
    let taskStateCheckDropped = false;
    let taskLeaseStateCheckDropped = false;
    try {
      const claim = (await boundary.repository.claimDispatchBatch(10, now))[0];
      if (!claim) throw new Error('dispatcher did not claim a candidate');
      expect(await boundary.repository.acknowledgeDispatch(claim, now)).toBe(true);
      const dispatched = (await boundary.repository.listDispatchedForReconciliation(10))[0];
      if (!dispatched) throw new Error('dispatched fixture is missing');

      await boundary.query('ALTER TABLE workflow_tasks DROP CONSTRAINT workflow_tasks_state_check');
      taskStateCheckDropped = true;
      await boundary.query('ALTER TABLE workflow_tasks DROP CONSTRAINT workflow_tasks_lease_state_check');
      taskLeaseStateCheckDropped = true;
      await boundary.query("UPDATE workflow_tasks SET state = 'completed' WHERE id = $1", [fixture.taskId]);
      expect(await boundary.repository.listDispatchedForReconciliation(10)).toHaveLength(0);
      expect(await boundary.repository.resetMissingDispatched(dispatched, now)).toBe(false);

      await boundary.query(
        `UPDATE workflow_outbox_records
         SET state = 'pending', last_dispatch_at = NULL, dispatched_at = NULL
         WHERE id = $1`,
        [fixture.outboxId],
      );
      expect(await boundary.repository.claimDispatchBatch(10, now)).toHaveLength(0);
    } finally {
      if (taskStateCheckDropped) {
        await boundary.query("UPDATE workflow_tasks SET state = 'queued' WHERE id = $1", [fixture.taskId]);
        await boundary.query(
          "ALTER TABLE workflow_tasks ADD CONSTRAINT workflow_tasks_state_check CHECK (state IN ('queued', 'leased'))",
        );
      }
      if (taskLeaseStateCheckDropped) {
        await boundary.query(
          `ALTER TABLE workflow_tasks
           ADD CONSTRAINT workflow_tasks_lease_state_check CHECK (
             (state = 'queued'
               AND claim_hash IS NULL
               AND claimed_by IS NULL
               AND lease_started_at IS NULL
               AND lease_expires_at IS NULL
               AND lease_heartbeat_at IS NULL)
             OR
             (state = 'leased'
               AND claim_attempt_number >= 1
               AND claim_hash IS NOT NULL
               AND claimed_by = 'fetcher'
               AND lease_started_at IS NOT NULL
               AND lease_expires_at IS NOT NULL
               AND lease_heartbeat_at IS NOT NULL
               AND lease_started_at <= lease_heartbeat_at
               AND lease_heartbeat_at < lease_expires_at)
           )`,
        );
      }
      await closeFixtures(fixture, [boundary]);
    }
  });
});
