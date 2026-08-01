import { sql } from 'drizzle-orm';

import {
  defineWorkflowOutboxDeliveryCandidate,
  rehydrateWorkflowOutboxRecord,
  type WorkflowOutboxDeliveryCandidate,
  type WorkflowOutboxRecordState,
  type WorkflowTaskState,
} from '@contentos/core';

import type { DatabaseConnection } from './client.js';
import type { WorkflowDispatchRepository } from './runtime.js';

const DISPATCHER_LEASE_MS = 30_000;
const DISPATCH_BATCH_LIMIT = 10;

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

  constructor(private readonly connection: DatabaseConnection) {}

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
          t.updated_at AS task_updated_at
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
