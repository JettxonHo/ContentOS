import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  FetcherGatewayService,
  hashFetcherGatewayClaim,
  UrlCaptureService,
  type ContentPackageId,
  type ContentPackageOwnerId,
  type UrlCaptureIdGenerator,
} from '@contentos/core';
import {
  createFetcherGatewayRepositoryTestBoundary,
  createUrlCaptureRepositoryTestBoundary,
  createWorkflowDispatchRepositoryTestBoundary,
  type FetcherGatewayRepositoryTestBoundary,
  type UrlCaptureRepositoryTestBoundary,
  type WorkflowDispatchRepositoryTestBoundary,
} from '@contentos/database';
import type { FetcherLeaseRecoveryCandidate } from '@contentos/core';

import { readComposeCredentials, requireState } from './env.js';

function databaseUrl(): string {
  const state = requireState();
  const credentials = readComposeCredentials(state.envFile);
  return `postgresql://smoke_user:${encodeURIComponent(credentials.POSTGRES_PASSWORD ?? '')}@127.0.0.1:${state.ports.postgres}/smoke_db`;
}

const LEASE_CLAIM = 'A'.repeat(43);

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
  dispatchBoundaries: readonly (WorkflowDispatchRepositoryTestBoundary | FetcherGatewayRepositoryTestBoundary)[],
): Promise<void> {
  for (const boundary of dispatchBoundaries) await boundary.close();
  await cleanupPackage(fixture.commandBoundary, fixture.packageId);
  await fixture.commandBoundary.close();
}

async function leaseTask(
  boundary: WorkflowDispatchRepositoryTestBoundary,
  fixture: Awaited<ReturnType<typeof createTask>>,
  startedAt: Date,
  expiresAt: Date,
): Promise<void> {
  await boundary.query(
    `UPDATE workflow_outbox_records
     SET state = 'dispatched',
         last_dispatch_at = $2,
         dispatched_at = $2,
         updated_at = $2
     WHERE id = $1`,
    [fixture.outboxId, startedAt],
  );
  await boundary.query(
    `UPDATE workflow_tasks
     SET state = 'leased',
         claim_attempt_number = 1,
         claim_hash = $2,
         claimed_by = 'fetcher',
         lease_started_at = $3,
         lease_expires_at = $4,
         lease_heartbeat_at = $3,
         updated_at = $3
     WHERE id = $1`,
    [fixture.taskId, hashFetcherGatewayClaim(LEASE_CLAIM), startedAt, expiresAt],
  );
}

function recoveryCandidate(fixture: Awaited<ReturnType<typeof createTask>>): FetcherLeaseRecoveryCandidate {
  return {
    taskId: fixture.taskId as never,
    claimAttemptNumber: 1,
    deliveryGeneration: 1,
  };
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

  it('atomically recovers an expired lease, appends the exact Event, and fences replay', async () => {
    const fixture = await createTask();
    const boundary = createWorkflowDispatchRepositoryTestBoundary(databaseUrl());
    const startedAt = new Date('2026-08-02T00:00:00.000Z');
    const recoveredAt = new Date(startedAt.getTime() + 60_000);
    const eventId = randomUUID();
    try {
      await leaseTask(boundary, fixture, startedAt, recoveredAt);
      const candidates = await boundary.repository.listExpiredFetcherLeases(10, recoveredAt);
      expect(candidates).toEqual([recoveryCandidate(fixture)]);
      await expect(
        boundary.repository.recoverExpiredFetcherLease({
          candidate: candidates[0] as FetcherLeaseRecoveryCandidate,
          eventId: eventId as never,
          recoveredAt,
        }),
      ).resolves.toBe(true);

      const taskRows = await boundary.query<{
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
        [fixture.taskId],
      );
      expect(taskRows[0]).toMatchObject({
        state: 'queued',
        claim_attempt_number: 1,
        claim_hash: null,
        claimed_by: null,
        lease_started_at: null,
        lease_expires_at: null,
        lease_heartbeat_at: null,
      });

      const outboxRows = await boundary.query<{
        state: string;
        delivery_generation: number;
        last_dispatch_at: Date | null;
        dispatched_at: Date | null;
      }>(
        `SELECT state, delivery_generation, last_dispatch_at, dispatched_at
         FROM workflow_outbox_records WHERE id = $1`,
        [fixture.outboxId],
      );
      expect(outboxRows[0]).toEqual({
        state: 'pending',
        delivery_generation: 2,
        last_dispatch_at: null,
        dispatched_at: null,
      });

      const events = await boundary.query<{
        sequence: number;
        event_type: string;
        workflow_node_id: string;
        payload: Record<string, unknown>;
      }>(
        `SELECT sequence, event_type, workflow_node_id, payload
         FROM workflow_events WHERE id = $1`,
        [eventId],
      );
      expect(events[0]).toEqual({
        sequence: 2,
        event_type: 'fetcher_lease_expired.v1',
        workflow_node_id: expect.any(String),
        payload: {
          taskId: fixture.taskId,
          claimAttemptNumber: 1,
          previousDeliveryGeneration: 1,
          nextDeliveryGeneration: 2,
        },
      });
      expect(JSON.stringify(events[0]?.payload)).not.toContain('https://example.com');

      await expect(
        boundary.repository.recoverExpiredFetcherLease({
          candidate: recoveryCandidate(fixture),
          eventId: randomUUID() as never,
          recoveredAt,
        }),
      ).resolves.toBe(false);
      expect(await boundary.repository.listExpiredFetcherLeases(10, recoveredAt)).toHaveLength(0);
      await expect(
        boundary.query(`UPDATE workflow_events SET payload = '{"tampered":true}'::jsonb WHERE id = $1`, [eventId]),
      ).rejects.toThrow();
    } finally {
      await closeFixtures(fixture, [boundary]);
    }
  });

  it('returns no effect for non-expired, wrong-Outbox, and already-queued work', async () => {
    const fixture = await createTask();
    const boundary = createWorkflowDispatchRepositoryTestBoundary(databaseUrl());
    const now = new Date('2026-08-02T00:00:00.000Z');
    const future = new Date(now.getTime() + 60_000);
    try {
      await leaseTask(boundary, fixture, now, future);
      expect(await boundary.repository.listExpiredFetcherLeases(10, now)).toHaveLength(0);
      expect(
        await boundary.repository.recoverExpiredFetcherLease({
          candidate: recoveryCandidate(fixture),
          eventId: randomUUID() as never,
          recoveredAt: now,
        }),
      ).toBe(false);

      await boundary.query(
        `UPDATE workflow_outbox_records
         SET state = 'pending',
             last_dispatch_at = NULL,
             dispatched_at = NULL
         WHERE id = $1`,
        [fixture.outboxId],
      );
      await boundary.query('UPDATE workflow_tasks SET lease_expires_at = $2 WHERE id = $1', [fixture.taskId, now]);
      expect(await boundary.repository.listExpiredFetcherLeases(10, now)).toHaveLength(0);
      expect(
        await boundary.repository.recoverExpiredFetcherLease({
          candidate: recoveryCandidate(fixture),
          eventId: randomUUID() as never,
          recoveredAt: now,
        }),
      ).toBe(false);

      await boundary.query(
        `UPDATE workflow_outbox_records
         SET state = 'dispatched',
             last_dispatch_at = $2,
             dispatched_at = $2,
             payload = payload || '{"extra":"malformed"}'::jsonb
         WHERE id = $1`,
        [fixture.outboxId, now],
      );
      const malformedExpiry = new Date(now.getTime() + 90_000);
      expect(await boundary.repository.listExpiredFetcherLeases(10, malformedExpiry)).toHaveLength(0);
      expect(
        await boundary.repository.recoverExpiredFetcherLease({
          candidate: recoveryCandidate(fixture),
          eventId: randomUUID() as never,
          recoveredAt: malformedExpiry,
        }),
      ).toBe(false);

      await boundary.query('DELETE FROM workflow_outbox_records WHERE id = $1', [fixture.outboxId]);
      expect(await boundary.repository.listExpiredFetcherLeases(10, malformedExpiry)).toHaveLength(0);
      expect(
        await boundary.repository.recoverExpiredFetcherLease({
          candidate: recoveryCandidate(fixture),
          eventId: randomUUID() as never,
          recoveredAt: malformedExpiry,
        }),
      ).toBe(false);

      await boundary.query(
        `UPDATE workflow_tasks
         SET state = 'queued', claim_hash = NULL, claimed_by = NULL,
             lease_started_at = NULL, lease_expires_at = NULL, lease_heartbeat_at = NULL
         WHERE id = $1`,
        [fixture.taskId],
      );
      expect(await boundary.repository.listExpiredFetcherLeases(10, malformedExpiry)).toHaveLength(0);
      expect(
        await boundary.repository.recoverExpiredFetcherLease({
          candidate: recoveryCandidate(fixture),
          eventId: randomUUID() as never,
          recoveredAt: malformedExpiry,
        }),
      ).toBe(false);
      expect(
        await boundary.query<{ count: string }>(
          'SELECT count(*)::text AS count FROM workflow_events WHERE content_package_id = $1',
          [fixture.packageId],
        ),
      ).toEqual([{ count: '1' }]);
    } finally {
      await closeFixtures(fixture, [boundary]);
    }
  });

  it('rolls back Task, Outbox, and Event together at every transactional stage', async () => {
    for (const failedStage of ['task', 'outbox', 'event'] as const) {
      const fixture = await createTask();
      const boundary = createWorkflowDispatchRepositoryTestBoundary(databaseUrl(), {
        afterLeaseRecoveryStage(stage): void {
          if (stage === failedStage) throw new Error(`injected_${failedStage}`);
        },
      });
      const startedAt = new Date('2026-08-02T00:00:00.000Z');
      const recoveredAt = new Date(startedAt.getTime() + 60_000);
      try {
        await leaseTask(boundary, fixture, startedAt, recoveredAt);
        await expect(
          boundary.repository.recoverExpiredFetcherLease({
            candidate: recoveryCandidate(fixture),
            eventId: randomUUID() as never,
            recoveredAt,
          }),
        ).rejects.toThrow(`injected_${failedStage}`);
        expect(
          await boundary.query<{ state: string; claim_hash: string | null }>(
            'SELECT state, claim_hash FROM workflow_tasks WHERE id = $1',
            [fixture.taskId],
          ),
        ).toEqual([{ state: 'leased', claim_hash: hashFetcherGatewayClaim(LEASE_CLAIM) }]);
        expect(
          await boundary.query<{ state: string; delivery_generation: number; dispatched_at: Date | null }>(
            'SELECT state, delivery_generation, dispatched_at FROM workflow_outbox_records WHERE id = $1',
            [fixture.outboxId],
          ),
        ).toEqual([{ state: 'dispatched', delivery_generation: 1, dispatched_at: startedAt }]);
        expect(
          await boundary.query<{ event_type: string }>(
            'SELECT event_type FROM workflow_events WHERE content_package_id = $1 ORDER BY sequence',
            [fixture.packageId],
          ),
        ).toEqual([{ event_type: 'url_capture_requested.v1' }]);
      } finally {
        await closeFixtures(fixture, [boundary]);
      }
    }
  });

  it('fences concurrent Recovery against Heartbeat so only one legal transition wins', async () => {
    const fixture = await createTask();
    const dispatchBoundary = createWorkflowDispatchRepositoryTestBoundary(databaseUrl());
    const gatewayBoundary = createFetcherGatewayRepositoryTestBoundary(databaseUrl());
    const startedAt = new Date('2026-08-02T00:00:00.000Z');
    const heartbeatAt = new Date(startedAt.getTime() + 20_000);
    const recoveryAt = new Date(startedAt.getTime() + 60_000);
    try {
      await leaseTask(dispatchBoundary, fixture, startedAt, new Date(startedAt.getTime() + 30_000));
      const candidate = (await dispatchBoundary.repository.listExpiredFetcherLeases(10, recoveryAt))[0];
      if (!candidate) throw new Error('expired lease candidate is missing');
      const heartbeat = new FetcherGatewayService(
        gatewayBoundary.repository,
        { generate: () => LEASE_CLAIM },
        { now: () => heartbeatAt },
      );
      const [recoveryResult, heartbeatResult] = await Promise.all([
        dispatchBoundary.repository.recoverExpiredFetcherLease({
          candidate,
          eventId: randomUUID() as never,
          recoveredAt: recoveryAt,
        }),
        heartbeat.heartbeat(fixture.taskId as never, LEASE_CLAIM).then(
          (value) => value,
          () => null,
        ),
      ]);
      expect(
        (recoveryResult && heartbeatResult === null) ||
          (!recoveryResult && heartbeatResult !== null && heartbeatResult.renewed === true),
      ).toBe(true);
      const events = await dispatchBoundary.query<{ event_type: string }>(
        'SELECT event_type FROM workflow_events WHERE content_package_id = $1 AND event_type = $2',
        [fixture.packageId, 'fetcher_lease_expired.v1'],
      );
      expect(events).toHaveLength(recoveryResult ? 1 : 0);
      const state = await dispatchBoundary.query<{ state: string; lease_expires_at: Date | null }>(
        'SELECT state, lease_expires_at FROM workflow_tasks WHERE id = $1',
        [fixture.taskId],
      );
      expect(state[0]?.state).toBe(recoveryResult ? 'queued' : 'leased');
    } finally {
      await gatewayBoundary.close();
      await closeFixtures(fixture, [dispatchBoundary]);
    }
  });
});
