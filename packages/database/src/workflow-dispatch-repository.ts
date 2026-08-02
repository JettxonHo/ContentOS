import { sql } from 'drizzle-orm';

import {
  defineFetcherLeaseExpiredEventValue,
  defineWorkflowOutboxDeliveryCandidate,
  rehydrateWorkflowOutboxRecord,
  type FetcherLeaseRecoveryCandidate,
  type FetcherLeaseRecoveryRequest,
  type WorkflowOutboxDeliveryCandidate,
  type WorkflowOutboxRecordState,
  type WorkflowTaskState,
} from '@contentos/core';

import type { DatabaseConnection } from './client.js';
import type { WorkflowDispatchRepository } from './runtime.js';

const DISPATCHER_LEASE_MS = 30_000;
const DISPATCH_BATCH_LIMIT = 10;

export type WorkflowLeaseRecoveryStage = 'task' | 'outbox' | 'event';

export interface WorkflowDispatchRepositoryOptions {
  readonly afterLeaseRecoveryStage?: (stage: WorkflowLeaseRecoveryStage) => void | Promise<void>;
}

interface RecoveryRow {
  [key: string]: unknown;
  task_id: string;
  workflow_instance_id: string;
  workflow_node_id: string;
  content_package_id: string;
  owner_user_id: string;
  outbox_id: string;
  claim_attempt_number: number;
  delivery_generation: number;
}

interface DispatchRow {
  [key: string]: unknown;
  id: string;
  task_id: string;
  content_package_id: string;
  owner_user_id: string;
  category: string;
  envelope_version: string;
  payload: unknown;
  state: string;
  created_at: Date;
  delivery_generation: number;
  dispatch_attempt_count: number;
  dispatch_lease_expires_at: Date | null;
  last_dispatch_at: Date | null;
  dispatched_at: Date | null;
  updated_at: Date;
  workflow_instance_id: string;
  workflow_node_id: string;
  url_capture_request_id: string;
  task_kind: string;
  task_state: string;
  task_created_at: Date;
  task_updated_at: Date;
  task_claim_attempt_number: number;
}

interface OutboxRow {
  [key: string]: unknown;
  id: string;
  task_id: string;
  content_package_id: string;
  owner_user_id: string;
  category: string;
  envelope_version: string;
  payload: unknown;
  state: string;
  created_at: Date;
  delivery_generation: number;
  dispatch_attempt_count: number;
  dispatch_lease_expires_at: Date | null;
  last_dispatch_at: Date | null;
  dispatched_at: Date | null;
  updated_at: Date;
}

interface ReconciliationCursor {
  readonly dispatchedAt: Date;
  readonly id: string;
}

function boundedLimit(limit: number): number {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > DISPATCH_BATCH_LIMIT) {
    throw new Error('invalid_dispatch_batch_limit');
  }
  return limit;
}

function validTimestamp(value: Date): Date {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error('invalid_dispatch_timestamp');
  return new Date(value.getTime());
}

function databaseTimestamp(value: unknown): Date {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(String(value));
  if (!Number.isFinite(date.getTime())) throw new Error('invalid_dispatch_database_timestamp');
  return date;
}

function databaseNullableTimestamp(value: unknown): Date | null {
  return value === null ? null : databaseTimestamp(value);
}

function outboxState(row: OutboxRow): WorkflowOutboxRecordState {
  return rehydrateWorkflowOutboxRecord({
    id: row.id as never,
    taskId: row.task_id as never,
    contentPackageId: row.content_package_id as never,
    ownerUserId: row.owner_user_id as never,
    category: row.category as 'fetcher',
    envelopeVersion: row.envelope_version as 'fetcher-task/v1',
    payload: row.payload as never,
    state: row.state as 'pending' | 'dispatching' | 'dispatched',
    createdAt: databaseTimestamp(row.created_at),
    deliveryGeneration: row.delivery_generation,
    dispatchAttemptCount: row.dispatch_attempt_count,
    dispatchLeaseExpiresAt: databaseNullableTimestamp(row.dispatch_lease_expires_at),
    lastDispatchAt: databaseNullableTimestamp(row.last_dispatch_at),
    dispatchedAt: databaseNullableTimestamp(row.dispatched_at),
    updatedAt: databaseTimestamp(row.updated_at),
  });
}

function candidateFromRow(row: DispatchRow): WorkflowOutboxDeliveryCandidate {
  const task: WorkflowTaskState = {
    id: row.task_id as never,
    workflowInstanceId: row.workflow_instance_id as never,
    workflowNodeId: row.workflow_node_id as never,
    urlCaptureRequestId: row.url_capture_request_id as never,
    contentPackageId: row.content_package_id as never,
    ownerUserId: row.owner_user_id as never,
    kind: row.task_kind as 'url_capture',
    state: row.task_state as 'queued',
    claimAttemptNumber: row.task_claim_attempt_number,
    claimHash: null,
    claimedBy: null,
    leaseStartedAt: null,
    leaseExpiresAt: null,
    leaseHeartbeatAt: null,
    createdAt: databaseTimestamp(row.task_created_at),
    updatedAt: databaseTimestamp(row.task_updated_at),
  };
  return defineWorkflowOutboxDeliveryCandidate(
    {
      id: row.id as never,
      taskId: row.task_id as never,
      contentPackageId: row.content_package_id as never,
      ownerUserId: row.owner_user_id as never,
      category: row.category as 'fetcher',
      envelopeVersion: row.envelope_version as 'fetcher-task/v1',
      payload: row.payload as never,
      state: row.state as 'dispatching',
      createdAt: databaseTimestamp(row.created_at),
      deliveryGeneration: row.delivery_generation,
      dispatchAttemptCount: row.dispatch_attempt_count,
      dispatchLeaseExpiresAt: databaseNullableTimestamp(row.dispatch_lease_expires_at),
      lastDispatchAt: databaseNullableTimestamp(row.last_dispatch_at),
      dispatchedAt: databaseNullableTimestamp(row.dispatched_at),
      updatedAt: databaseTimestamp(row.updated_at),
    },
    task,
  );
}

function acknowledgementIdentity(candidate: WorkflowOutboxDeliveryCandidate): {
  readonly id: string;
  readonly generation: number;
  readonly attempt: number;
  readonly leaseExpiresAt: Date;
} {
  return {
    id: candidate.outboxRecordId,
    generation: candidate.deliveryGeneration,
    attempt: candidate.dispatchAttemptCount,
    leaseExpiresAt: candidate.dispatchLeaseExpiresAt,
  };
}

export class DrizzleWorkflowDispatchRepository implements WorkflowDispatchRepository {
  private reconciliationCursor: ReconciliationCursor | undefined;

  constructor(
    private readonly connection: DatabaseConnection,
    private readonly options: WorkflowDispatchRepositoryOptions = {},
  ) {}

  async listExpiredFetcherLeases(limit: number, now: Date): Promise<readonly FetcherLeaseRecoveryCandidate[]> {
    this.connection.assertAvailable();
    const bounded = boundedLimit(limit);
    const currentTime = validTimestamp(now);
    const result = await this.connection.pool.query<FetcherLeaseRecoveryCandidate>(
      `SELECT t.id AS "taskId",
              t.claim_attempt_number AS "claimAttemptNumber",
              o.delivery_generation AS "deliveryGeneration"
       FROM workflow_tasks t
       JOIN workflow_instances i
         ON i.id = t.workflow_instance_id
        AND i.content_package_id = t.content_package_id
        AND i.owner_user_id = t.owner_user_id
       JOIN workflow_nodes n
         ON n.id = t.workflow_node_id
        AND n.workflow_instance_id = t.workflow_instance_id
        AND n.content_package_id = t.content_package_id
        AND n.owner_user_id = t.owner_user_id
       JOIN content_packages p
         ON p.id = t.content_package_id
        AND p.owner_user_id = t.owner_user_id
       JOIN url_capture_requests c
         ON c.id = t.url_capture_request_id
        AND c.workflow_instance_id = t.workflow_instance_id
        AND c.workflow_node_id = t.workflow_node_id
        AND c.content_package_id = t.content_package_id
        AND c.owner_user_id = t.owner_user_id
       JOIN url_source_references r
         ON r.id = c.source_reference_id
        AND r.content_package_id = c.content_package_id
        AND r.owner_user_id = c.owner_user_id
       JOIN workflow_outbox_records o
         ON o.task_id = t.id
        AND o.content_package_id = t.content_package_id
        AND o.owner_user_id = t.owner_user_id
       WHERE t.kind = 'url_capture'
         AND t.state = 'leased'
         AND t.claim_attempt_number >= 1
         AND t.claim_hash IS NOT NULL
         AND t.claimed_by = 'fetcher'
         AND t.lease_started_at IS NOT NULL
         AND t.lease_heartbeat_at IS NOT NULL
         AND t.lease_expires_at <= $1
         AND i.lifecycle = 'active'
         AND n.template_node_key = 'source_capture'
         AND n.state = 'ready'
         AND p.lifecycle = 'active'
         AND c.command_kind = 'url_capture_request'
         AND o.category = 'fetcher'
         AND o.envelope_version = 'fetcher-task/v1'
         AND o.state = 'dispatched'
         AND o.dispatch_lease_expires_at IS NULL
         AND o.last_dispatch_at IS NOT NULL
         AND o.dispatched_at IS NOT NULL
         AND o.last_dispatch_at = o.dispatched_at
         AND o.payload = jsonb_build_object(
           'taskId', t.id::text,
           'taskKind', 'url_capture',
           'envelopeVersion', 'fetcher-task/v1'
         )
       ORDER BY t.lease_expires_at, t.id
       LIMIT $2`,
      [currentTime, bounded],
    );
    return result.rows.map((row) => ({
      taskId: row.taskId as never,
      claimAttemptNumber: row.claimAttemptNumber,
      deliveryGeneration: row.deliveryGeneration,
    }));
  }

  async recoverExpiredFetcherLease(input: FetcherLeaseRecoveryRequest): Promise<boolean> {
    this.connection.assertAvailable();
    const recoveredAt = validTimestamp(input.recoveredAt);
    const candidate = input.candidate;
    if (
      typeof candidate.taskId !== 'string' ||
      candidate.taskId.length === 0 ||
      !Number.isSafeInteger(candidate.claimAttemptNumber) ||
      candidate.claimAttemptNumber < 1 ||
      !Number.isSafeInteger(candidate.deliveryGeneration) ||
      candidate.deliveryGeneration < 1
    ) {
      throw new Error('invalid_fetcher_lease_recovery_candidate');
    }

    const client = await this.connection.pool.connect();
    try {
      await client.query('BEGIN');
      const eligible = await client.query<RecoveryRow>(
        `SELECT t.id AS task_id,
                t.workflow_instance_id,
                t.workflow_node_id,
                t.content_package_id,
                t.owner_user_id,
                o.id AS outbox_id,
                t.claim_attempt_number,
                o.delivery_generation
         FROM workflow_tasks t
         JOIN workflow_instances i
           ON i.id = t.workflow_instance_id
          AND i.content_package_id = t.content_package_id
          AND i.owner_user_id = t.owner_user_id
         JOIN workflow_nodes n
           ON n.id = t.workflow_node_id
          AND n.workflow_instance_id = t.workflow_instance_id
          AND n.content_package_id = t.content_package_id
          AND n.owner_user_id = t.owner_user_id
         JOIN content_packages p
           ON p.id = t.content_package_id
          AND p.owner_user_id = t.owner_user_id
         JOIN url_capture_requests c
           ON c.id = t.url_capture_request_id
          AND c.workflow_instance_id = t.workflow_instance_id
          AND c.workflow_node_id = t.workflow_node_id
          AND c.content_package_id = t.content_package_id
          AND c.owner_user_id = t.owner_user_id
         JOIN url_source_references r
           ON r.id = c.source_reference_id
          AND r.content_package_id = c.content_package_id
          AND r.owner_user_id = c.owner_user_id
         JOIN workflow_outbox_records o
           ON o.task_id = t.id
          AND o.content_package_id = t.content_package_id
          AND o.owner_user_id = t.owner_user_id
         WHERE t.id = $1
           AND t.kind = 'url_capture'
           AND t.state = 'leased'
           AND t.claim_attempt_number >= 1
           AND t.claim_hash IS NOT NULL
           AND t.claimed_by = 'fetcher'
           AND t.lease_started_at IS NOT NULL
           AND t.lease_heartbeat_at IS NOT NULL
           AND t.claim_attempt_number = $2
           AND t.lease_expires_at <= $4
           AND i.lifecycle = 'active'
           AND n.template_node_key = 'source_capture'
           AND n.state = 'ready'
           AND p.lifecycle = 'active'
           AND c.command_kind = 'url_capture_request'
           AND o.category = 'fetcher'
           AND o.envelope_version = 'fetcher-task/v1'
           AND o.state = 'dispatched'
           AND o.dispatch_lease_expires_at IS NULL
           AND o.delivery_generation = $3
           AND o.last_dispatch_at IS NOT NULL
           AND o.dispatched_at IS NOT NULL
           AND o.last_dispatch_at = o.dispatched_at
           AND o.payload = jsonb_build_object(
             'taskId', t.id::text,
             'taskKind', 'url_capture',
             'envelopeVersion', 'fetcher-task/v1'
           )
         FOR UPDATE OF t, i, n, p, c, r, o`,
        [candidate.taskId, candidate.claimAttemptNumber, candidate.deliveryGeneration, recoveredAt],
      );
      const row = eligible.rows[0];
      if (!row) {
        await client.query('ROLLBACK');
        return false;
      }

      const event = defineFetcherLeaseExpiredEventValue({
        taskId: row.task_id as never,
        claimAttemptNumber: row.claim_attempt_number,
        previousDeliveryGeneration: row.delivery_generation,
        nextDeliveryGeneration: row.delivery_generation + 1,
      });

      const taskUpdated = await client.query(
        `UPDATE workflow_tasks
         SET state = 'queued',
             claim_hash = NULL,
             claimed_by = NULL,
             lease_started_at = NULL,
             lease_expires_at = NULL,
             lease_heartbeat_at = NULL,
             updated_at = $2
         WHERE id = $1
           AND state = 'leased'
           AND claim_attempt_number = $3
           AND lease_expires_at <= $2
         RETURNING id`,
        [row.task_id, recoveredAt, row.claim_attempt_number],
      );
      if (taskUpdated.rows.length !== 1) {
        await client.query('ROLLBACK');
        return false;
      }
      await this.options.afterLeaseRecoveryStage?.('task');

      const outboxUpdated = await client.query(
        `UPDATE workflow_outbox_records
         SET state = 'pending',
             delivery_generation = delivery_generation + 1,
             dispatch_lease_expires_at = NULL,
             last_dispatch_at = NULL,
             dispatched_at = NULL,
             updated_at = $2
         WHERE id = $1
           AND task_id = $3
           AND content_package_id = $4
           AND owner_user_id = $5
           AND category = 'fetcher'
           AND envelope_version = 'fetcher-task/v1'
           AND state = 'dispatched'
           AND delivery_generation = $6
           AND last_dispatch_at IS NOT NULL
           AND dispatched_at IS NOT NULL
           AND last_dispatch_at = dispatched_at
         RETURNING id`,
        [row.outbox_id, recoveredAt, row.task_id, row.content_package_id, row.owner_user_id, row.delivery_generation],
      );
      if (outboxUpdated.rows.length !== 1) {
        await client.query('ROLLBACK');
        return false;
      }
      await this.options.afterLeaseRecoveryStage?.('outbox');

      const sequenceResult = await client.query<{ next_sequence: number }>(
        `SELECT coalesce(max(sequence), 0) + 1 AS next_sequence
         FROM workflow_events
         WHERE workflow_instance_id = $1
           AND content_package_id = $2
           AND owner_user_id = $3`,
        [row.workflow_instance_id, row.content_package_id, row.owner_user_id],
      );
      const sequence = Number(sequenceResult.rows[0]?.next_sequence ?? 1);
      await client.query(
        `INSERT INTO workflow_events
          (id, workflow_instance_id, content_package_id, owner_user_id, sequence,
           event_type, payload, occurred_at, workflow_node_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)`,
        [
          input.eventId,
          row.workflow_instance_id,
          row.content_package_id,
          row.owner_user_id,
          sequence,
          event.eventType,
          JSON.stringify(event.payload),
          recoveredAt,
          row.workflow_node_id,
        ],
      );
      await this.options.afterLeaseRecoveryStage?.('event');
      await client.query('COMMIT');
      return true;
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // Preserve the stable outer error boundary; never emit database details.
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async claimDispatchBatch(limit: number, now: Date): Promise<readonly WorkflowOutboxDeliveryCandidate[]> {
    this.connection.assertAvailable();
    const bounded = boundedLimit(limit);
    const currentTime = validTimestamp(now);
    const leaseExpiresAt = new Date(currentTime.getTime() + DISPATCHER_LEASE_MS);
    return this.connection.db.transaction(async (tx) => {
      const rows = await tx.execute<DispatchRow>(sql`
        SELECT
          o.id,
          o.task_id,
          o.content_package_id,
          o.owner_user_id,
          o.category,
          o.envelope_version,
          o.payload,
          o.state,
          o.created_at,
          o.delivery_generation,
          o.dispatch_attempt_count,
          o.dispatch_lease_expires_at,
          o.last_dispatch_at,
          o.dispatched_at,
          o.updated_at,
          t.workflow_instance_id,
          t.workflow_node_id,
          t.url_capture_request_id,
          t.kind AS task_kind,
          t.state AS task_state,
          t.created_at AS task_created_at,
          t.updated_at AS task_updated_at,
          t.claim_attempt_number AS task_claim_attempt_number
        FROM workflow_outbox_records o
        JOIN workflow_tasks t
          ON t.id = o.task_id
         AND t.content_package_id = o.content_package_id
         AND t.owner_user_id = o.owner_user_id
        WHERE o.category = 'fetcher'
          AND o.envelope_version = 'fetcher-task/v1'
          AND o.payload->>'taskId' = o.task_id::text
          AND o.payload->>'taskKind' = 'url_capture'
          AND o.payload->>'envelopeVersion' = 'fetcher-task/v1'
          AND t.kind = 'url_capture'
          AND t.state = 'queued'
          AND (
            o.state = 'pending'
            OR (o.state = 'dispatching' AND o.dispatch_lease_expires_at <= ${currentTime})
          )
        ORDER BY o.created_at, o.id
        LIMIT ${bounded}
        FOR UPDATE OF o, t SKIP LOCKED
      `);
      const candidates: WorkflowOutboxDeliveryCandidate[] = [];
      for (const row of rows.rows) {
        const updated = await tx.execute<DispatchRow>(sql`
          UPDATE workflow_outbox_records
          SET state = 'dispatching',
              dispatch_attempt_count = dispatch_attempt_count + 1,
              dispatch_lease_expires_at = ${leaseExpiresAt},
              updated_at = ${currentTime}
          WHERE id = ${row.id}
          RETURNING
            id,
            task_id,
            content_package_id,
            owner_user_id,
            category,
            envelope_version,
            payload,
            state,
            created_at,
            delivery_generation,
            dispatch_attempt_count,
            dispatch_lease_expires_at,
            last_dispatch_at,
            dispatched_at,
            updated_at
        `);
        const updatedRow = updated.rows[0];
        if (!updatedRow) throw new Error('dispatch_claim_missing');
        candidates.push(
          candidateFromRow({
            ...updatedRow,
            workflow_instance_id: row.workflow_instance_id,
            workflow_node_id: row.workflow_node_id,
            url_capture_request_id: row.url_capture_request_id,
            task_kind: row.task_kind,
            task_state: row.task_state,
            task_created_at: row.task_created_at,
            task_updated_at: row.task_updated_at,
          }),
        );
      }
      return candidates;
    });
  }

  async acknowledgeDispatch(candidate: WorkflowOutboxDeliveryCandidate, acknowledgedAt: Date): Promise<boolean> {
    this.connection.assertAvailable();
    const at = validTimestamp(acknowledgedAt);
    const identity = acknowledgementIdentity(candidate);
    const result = await this.connection.db.execute(sql`
      UPDATE workflow_outbox_records o
      SET state = 'dispatched',
          dispatch_lease_expires_at = NULL,
          last_dispatch_at = ${at},
          dispatched_at = ${at},
          updated_at = ${at}
      FROM workflow_tasks t
      WHERE o.id = ${identity.id}
        AND o.task_id = t.id
        AND o.content_package_id = t.content_package_id
        AND o.owner_user_id = t.owner_user_id
        AND t.kind = 'url_capture'
        AND t.state = 'queued'
        AND o.state = 'dispatching'
        AND o.delivery_generation = ${identity.generation}
        AND o.dispatch_attempt_count = ${identity.attempt}
        AND o.dispatch_lease_expires_at = ${identity.leaseExpiresAt}
      RETURNING o.id
    `);
    return result.rows.length === 1;
  }

  async failDispatch(candidate: WorkflowOutboxDeliveryCandidate, failedAt: Date): Promise<boolean> {
    this.connection.assertAvailable();
    const at = validTimestamp(failedAt);
    const identity = acknowledgementIdentity(candidate);
    const result = await this.connection.db.execute(sql`
      UPDATE workflow_outbox_records o
      SET state = 'pending',
          dispatch_lease_expires_at = NULL,
          updated_at = ${at}
      FROM workflow_tasks t
      WHERE o.id = ${identity.id}
        AND o.task_id = t.id
        AND o.content_package_id = t.content_package_id
        AND o.owner_user_id = t.owner_user_id
        AND t.kind = 'url_capture'
        AND t.state = 'queued'
        AND o.state = 'dispatching'
        AND o.delivery_generation = ${identity.generation}
        AND o.dispatch_attempt_count = ${identity.attempt}
        AND o.dispatch_lease_expires_at = ${identity.leaseExpiresAt}
      RETURNING o.id
    `);
    return result.rows.length === 1;
  }

  async listDispatchedForReconciliation(limit: number): Promise<readonly WorkflowOutboxRecordState[]> {
    this.connection.assertAvailable();
    const bounded = boundedLimit(limit);
    const afterCursor = this.reconciliationCursor
      ? sql`AND (o.dispatched_at, o.id) > (${this.reconciliationCursor.dispatchedAt}, ${this.reconciliationCursor.id}::uuid)`
      : sql``;
    const result = await this.connection.db.execute<OutboxRow>(sql`
      SELECT
        o.id,
        o.task_id,
        o.content_package_id,
        o.owner_user_id,
        o.category,
        o.envelope_version,
        o.payload,
        o.state,
        o.created_at,
        o.delivery_generation,
        o.dispatch_attempt_count,
        o.dispatch_lease_expires_at,
        o.last_dispatch_at,
        o.dispatched_at,
        o.updated_at
      FROM workflow_outbox_records o
      JOIN workflow_tasks t
        ON t.id = o.task_id
       AND t.content_package_id = o.content_package_id
       AND t.owner_user_id = o.owner_user_id
      WHERE o.state = 'dispatched'
        AND o.category = 'fetcher'
        AND o.envelope_version = 'fetcher-task/v1'
        AND o.payload->>'taskId' = o.task_id::text
        AND o.payload->>'taskKind' = 'url_capture'
        AND o.payload->>'envelopeVersion' = 'fetcher-task/v1'
        AND t.kind = 'url_capture'
        AND t.state = 'queued'
        ${afterCursor}
      ORDER BY o.dispatched_at, o.id
      LIMIT ${bounded}
    `);
    const last = result.rows.at(-1);
    this.reconciliationCursor = last ? { dispatchedAt: databaseTimestamp(last.dispatched_at), id: last.id } : undefined;
    return result.rows.map(outboxState);
  }

  async resetMissingDispatched(record: WorkflowOutboxRecordState, resetAt: Date): Promise<boolean> {
    this.connection.assertAvailable();
    const at = validTimestamp(resetAt);
    const dispatchedAt = record.dispatchedAt;
    if (record.state !== 'dispatched' || dispatchedAt === null) return false;
    const result = await this.connection.db.execute(sql`
      UPDATE workflow_outbox_records o
      SET state = 'pending',
          dispatch_lease_expires_at = NULL,
          last_dispatch_at = NULL,
          dispatched_at = NULL,
          updated_at = ${at}
      FROM workflow_tasks t
      WHERE o.id = ${record.id}
        AND o.task_id = t.id
        AND o.content_package_id = t.content_package_id
        AND o.owner_user_id = t.owner_user_id
        AND t.kind = 'url_capture'
        AND t.state = 'queued'
        AND o.state = 'dispatched'
        AND o.delivery_generation = ${record.deliveryGeneration}
        AND o.dispatch_attempt_count = ${record.dispatchAttemptCount}
        AND o.dispatched_at = ${dispatchedAt}
        AND o.last_dispatch_at = ${record.lastDispatchAt}
      RETURNING o.id
    `);
    return result.rows.length === 1;
  }
}
