import type { FetcherGatewayClaimRecord, FetcherGatewayHeartbeatRecord, WorkflowTaskId } from '@contentos/core';
import {
  FETCHER_GATEWAY_CLAIMED_BY,
  FETCHER_GATEWAY_HEARTBEAT_CADENCE_MS,
  FETCHER_GATEWAY_INITIAL_LEASE_MS,
  FETCHER_GATEWAY_MAX_LEASE_MS,
} from '@contentos/core';

import type { DatabaseConnection } from './client.js';

interface ClaimRow {
  task_id: string;
  task_kind: string;
  submitted_url: string;
  claim_attempt_number: number;
  lease_expires_at: Date;
}

interface HeartbeatRow {
  task_id: string;
  claim_attempt_number: number;
  claim_hash: string;
  claimed_by: string;
  lease_started_at: Date;
  lease_expires_at: Date;
  lease_heartbeat_at: Date;
}

function validDate(value: Date): Date {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error('invalid_gateway_timestamp');
  return new Date(value.getTime());
}

function timestamp(value: unknown): Date {
  return validDate(value instanceof Date ? value : new Date(String(value)));
}

function claimRecord(row: ClaimRow): FetcherGatewayClaimRecord {
  if (row.task_kind !== 'url_capture') throw new Error('invalid_gateway_task_kind');
  return {
    taskId: row.task_id as WorkflowTaskId,
    taskKind: 'url_capture',
    submittedUrl: row.submitted_url,
    attemptNumber: row.claim_attempt_number,
    leaseExpiresAt: timestamp(row.lease_expires_at),
  };
}

function heartbeatRecord(row: HeartbeatRow, renewed: boolean): FetcherGatewayHeartbeatRecord {
  if (row.claimed_by !== FETCHER_GATEWAY_CLAIMED_BY || row.claim_hash.length !== 64) {
    throw new Error('invalid_gateway_lease_shape');
  }
  return {
    taskId: row.task_id as WorkflowTaskId,
    attemptNumber: row.claim_attempt_number,
    leaseExpiresAt: timestamp(row.lease_expires_at),
    renewed,
  };
}

const claimEligibility = `
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
    AND t.state = 'queued'
    AND i.lifecycle = 'active'
    AND n.template_node_key = 'source_capture'
    AND n.state = 'ready'
    AND p.lifecycle = 'active'
    AND c.command_kind = 'url_capture_request'
    AND o.category = 'fetcher'
    AND o.envelope_version = 'fetcher-task/v1'
    AND o.state = 'dispatched'
    AND o.delivery_generation = $2
    AND o.dispatched_at IS NOT NULL
    AND o.last_dispatch_at IS NOT NULL
    AND o.payload->>'taskId' = t.id::text
    AND o.payload->>'taskKind' = 'url_capture'
    AND o.payload->>'envelopeVersion' = 'fetcher-task/v1'
`;

export class DrizzleWorkflowFetcherGatewayRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  async claimTask(input: {
    readonly taskId: WorkflowTaskId;
    readonly deliveryGeneration: number;
    readonly claimHash: string;
    readonly now: Date;
  }): Promise<FetcherGatewayClaimRecord | null> {
    this.connection.assertAvailable();
    const now = validDate(input.now);
    const leaseExpiresAt = new Date(now.getTime() + FETCHER_GATEWAY_INITIAL_LEASE_MS);
    const client = await this.connection.pool.connect();
    try {
      await client.query('BEGIN');
      const eligible = await client.query<ClaimRow>(
        `SELECT t.id AS task_id, t.kind AS task_kind, r.submitted_url,
                t.claim_attempt_number, t.lease_expires_at
         ${claimEligibility}
         FOR UPDATE OF t, i, n, p, c, r, o`,
        [input.taskId, input.deliveryGeneration],
      );
      const row = eligible.rows[0];
      if (!row) {
        await client.query('ROLLBACK');
        return null;
      }
      const updated = await client.query<ClaimRow>(
        `UPDATE workflow_tasks
         SET state = 'leased',
             claim_attempt_number = claim_attempt_number + 1,
             claim_hash = $2,
             claimed_by = 'fetcher',
             lease_started_at = $3,
             lease_expires_at = $4,
             lease_heartbeat_at = $3,
             updated_at = $3
         WHERE id = $1 AND state = 'queued'
         RETURNING id AS task_id, kind AS task_kind, $4::timestamptz AS lease_expires_at,
                   claim_attempt_number, ''::text AS submitted_url`,
        [input.taskId, input.claimHash, now, leaseExpiresAt],
      );
      const updatedRow = updated.rows[0];
      if (!updatedRow) {
        await client.query('ROLLBACK');
        return null;
      }
      updatedRow.submitted_url = row.submitted_url;
      await client.query('COMMIT');
      return claimRecord(updatedRow);
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

  async heartbeatTask(input: {
    readonly taskId: WorkflowTaskId;
    readonly claimHash: string;
    readonly now: Date;
  }): Promise<FetcherGatewayHeartbeatRecord | null> {
    this.connection.assertAvailable();
    const now = validDate(input.now);
    const client = await this.connection.pool.connect();
    try {
      await client.query('BEGIN');
      const current = await client.query<HeartbeatRow>(
        `SELECT id AS task_id, claim_attempt_number, claim_hash, claimed_by,
                lease_started_at, lease_expires_at, lease_heartbeat_at
         FROM workflow_tasks
         WHERE id = $1
           AND state = 'leased'
           AND claim_hash = $2
           AND claimed_by = 'fetcher'
         FOR UPDATE`,
        [input.taskId, input.claimHash],
      );
      const row = current.rows[0];
      if (!row) {
        await client.query('ROLLBACK');
        return null;
      }
      const expiresAt = timestamp(row.lease_expires_at);
      const heartbeatAt = timestamp(row.lease_heartbeat_at);
      const startedAt = timestamp(row.lease_started_at);
      if (now.getTime() >= expiresAt.getTime()) {
        await client.query('ROLLBACK');
        return null;
      }
      if (now.getTime() < heartbeatAt.getTime() + FETCHER_GATEWAY_HEARTBEAT_CADENCE_MS) {
        await client.query('COMMIT');
        return heartbeatRecord(row, false);
      }
      const candidateExpiry = new Date(
        Math.min(now.getTime() + FETCHER_GATEWAY_INITIAL_LEASE_MS, startedAt.getTime() + FETCHER_GATEWAY_MAX_LEASE_MS),
      );
      if (candidateExpiry.getTime() <= expiresAt.getTime()) {
        await client.query('ROLLBACK');
        return null;
      }
      const updated = await client.query<HeartbeatRow>(
        `UPDATE workflow_tasks
         SET lease_heartbeat_at = $3,
             lease_expires_at = $4,
             updated_at = $3
         WHERE id = $1
           AND state = 'leased'
           AND claim_hash = $2
           AND claimed_by = 'fetcher'
           AND lease_expires_at > $3
         RETURNING id AS task_id, claim_attempt_number, claim_hash, claimed_by,
                   lease_started_at, lease_expires_at, lease_heartbeat_at`,
        [input.taskId, input.claimHash, now, candidateExpiry],
      );
      const updatedRow = updated.rows[0];
      if (!updatedRow) {
        await client.query('ROLLBACK');
        return null;
      }
      await client.query('COMMIT');
      return heartbeatRecord(updatedRow, true);
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
}
