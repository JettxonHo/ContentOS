import type { PoolClient } from 'pg';

import {
  FETCHER_RESULT_VERSION,
  FETCHER_FAILURE_CATEGORY_TO_CODE,
  URL_CAPTURE_FAILED_EVENT_TYPE,
  URL_CAPTURE_SUCCEEDED_EVENT_TYPE,
  UrlCaptureResultPersistenceError,
  defineUrlCaptureFailedEventPayload,
  defineUrlCaptureSucceededEventPayload,
  type FetcherFailureCategory,
  type FetcherResultRecordedCategory,
  type FetcherResultSafeCode,
  type UrlCaptureResultPreflight,
  type UrlCaptureResultRecord,
  type UrlCaptureResultRecordCommand,
  type UrlCaptureResultRecordOutcome,
  type UrlCaptureResultReconciliation,
  type UrlCaptureResultRepository,
  type WorkflowTaskId,
} from '@contentos/core';

import type { DatabaseConnection } from './client.js';

interface TaskBindingRow {
  id: string;
  state: string;
  claim_attempt_number: number;
  claim_hash: string | null;
  lease_expires_at: Date | string;
  workflow_instance_id: string;
  workflow_node_id: string;
  url_capture_request_id: string;
  content_package_id: string;
  owner_user_id: string;
}

interface ResultRow {
  attempt_number: number;
  claim_hash: string;
  submitted_payload_sha256: string;
  recorded_outcome: 'succeeded' | 'failed';
  recorded_category: FetcherResultRecordedCategory | null;
  safe_code: FetcherResultSafeCode | null;
  source_id: string | null;
}

interface BindingRow {
  source_reference_id: string;
  role: 'primary' | 'supporting';
  capture_state: string;
  template_node_key: string;
  instance_lifecycle: string;
  template_id: string;
  template_version: string;
}

const TASK_BINDING_QUERY = `SELECT id, state, claim_attempt_number, claim_hash, lease_expires_at,
       workflow_instance_id, workflow_node_id, url_capture_request_id,
       content_package_id, owner_user_id
FROM workflow_tasks
WHERE id = $1 AND kind = 'url_capture'
FOR UPDATE`;

const EXISTING_RESULT_QUERY = `SELECT attempt_number, claim_hash, submitted_payload_sha256, recorded_outcome,
       recorded_category, safe_code, source_id
FROM url_capture_results
WHERE task_id = $1`;

const FULL_BINDING_QUERY = `SELECT c.source_reference_id, r.role, n.state AS capture_state, n.template_node_key,
       i.lifecycle AS instance_lifecycle, i.template_id, i.template_version
FROM url_capture_requests c
JOIN url_source_references r
  ON r.id = c.source_reference_id
 AND r.content_package_id = c.content_package_id
 AND r.owner_user_id = c.owner_user_id
JOIN workflow_nodes n
  ON n.id = c.workflow_node_id
 AND n.workflow_instance_id = c.workflow_instance_id
 AND n.content_package_id = c.content_package_id
 AND n.owner_user_id = c.owner_user_id
JOIN workflow_instances i
  ON i.id = c.workflow_instance_id
 AND i.content_package_id = c.content_package_id
 AND i.owner_user_id = c.owner_user_id
WHERE c.id = $1 AND c.content_package_id = $2 AND c.owner_user_id = $3`;

function toTimestamp(value: Date | string): Date {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error('invalid_result_timestamp');
  return date;
}

function toRecord(taskId: WorkflowTaskId, row: ResultRow): UrlCaptureResultRecord {
  return {
    taskId,
    attemptNumber: row.attempt_number,
    recordedOutcome: row.recorded_outcome,
    recordedCategory: row.recorded_category,
    safeCode: row.safe_code,
    sourceId: row.source_id,
  };
}

function resultMatches(
  row: ResultRow,
  input: { readonly claimHash: string; readonly attemptNumber: number; readonly submittedPayloadSha256: string },
): boolean {
  return (
    row.attempt_number === input.attemptNumber &&
    row.claim_hash === input.claimHash &&
    row.submitted_payload_sha256 === input.submittedPayloadSha256
  );
}

function bindingEligible(binding: BindingRow | undefined): binding is BindingRow {
  return (
    !!binding &&
    binding.template_node_key === 'source_capture' &&
    binding.capture_state === 'ready' &&
    binding.instance_lifecycle === 'active'
  );
}

export interface UrlCaptureResultRepositoryOptions {
  /** Invoked inside recordResult just before the guarded Task/Node transitions. */
  readonly beforeTransitions?: (
    exec: (text: string, values?: readonly unknown[]) => Promise<unknown>,
    taskId: WorkflowTaskId,
  ) => Promise<void> | void;
  /** Invoked inside reconcileResult at named points; throwing simulates a failure. */
  readonly reconcileAt?: (point: 'afterBegin' | 'taskBarrier' | 'resultQuery') => void;
  /** Invoked inside prepareResult at named points; throwing simulates a query fault. */
  readonly prepareAt?: (point: 'taskQuery') => void;
  /**
   * Controllable fault injection: invoked immediately before a best-effort
   * ROLLBACK in any of the three methods; throwing simulates a rollback
   * failure so the poisoned-connection discard path can be verified.
   */
  readonly rollbackFault?: (method: 'prepareResult' | 'recordResult' | 'reconcileResult') => void;
}

export class DrizzleUrlCaptureResultRepository implements UrlCaptureResultRepository {
  constructor(
    private readonly connection: DatabaseConnection,
    private readonly options: UrlCaptureResultRepositoryOptions = {},
  ) {}

  /**
   * Best-effort ROLLBACK. Returns `true` only when the transaction ended via a
   * successful ROLLBACK; `false` means the connection is poisoned and must be
   * destroyed rather than returned to the Pool. Never leaks database detail.
   */
  private async bestEffortRollback(
    client: PoolClient,
    method: 'prepareResult' | 'recordResult' | 'reconcileResult',
  ): Promise<boolean> {
    try {
      this.options.rollbackFault?.(method);
      await client.query('ROLLBACK');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Releases a Pool client. When the transaction did not end cleanly (a
   * committed or rolled-back transaction), the client is destroyed via
   * `release(error)` instead of being returned to the Pool, so a poisoned
   * connection can never serve a later query. The rollback error itself is
   * never written to a log or an HTTP response.
   */
  private releaseResultClient(client: PoolClient, clean: boolean): void {
    if (clean) {
      client.release();
      return;
    }
    client.release(new Error('url_capture_result_connection_poisoned'));
  }

  async prepareResult(input: {
    readonly taskId: WorkflowTaskId;
    readonly claimHash: string;
    readonly attemptNumber: number;
    readonly submittedPayloadSha256: string;
    readonly acceptedAt: Date;
  }): Promise<UrlCaptureResultPreflight> {
    this.connection.assertAvailable();
    const client = await this.connection.pool.connect();
    let cleanRelease = false;
    try {
      await client.query('BEGIN');
      this.options.prepareAt?.('taskQuery');
      const taskResult = await client.query<TaskBindingRow>(TASK_BINDING_QUERY, [input.taskId]);
      const task = taskResult.rows[0];
      if (!task) {
        await client.query('ROLLBACK');
        cleanRelease = true;
        return { kind: 'unavailable' };
      }
      const existingResult = await client.query<ResultRow>(EXISTING_RESULT_QUERY, [input.taskId]);
      const existing = existingResult.rows[0];
      if (existing) {
        await client.query('ROLLBACK');
        cleanRelease = true;
        return resultMatches(existing, input)
          ? { kind: 'duplicate', result: toRecord(input.taskId, existing) }
          : { kind: 'unavailable' };
      }
      const leaseExpiresAt = toTimestamp(task.lease_expires_at);
      if (
        task.state !== 'leased' ||
        task.claim_hash !== input.claimHash ||
        task.claim_attempt_number !== input.attemptNumber ||
        input.acceptedAt.getTime() >= leaseExpiresAt.getTime()
      ) {
        await client.query('ROLLBACK');
        cleanRelease = true;
        return { kind: 'unavailable' };
      }
      const bindingResult = await client.query<BindingRow>(FULL_BINDING_QUERY, [
        task.url_capture_request_id,
        task.content_package_id,
        task.owner_user_id,
      ]);
      if (!bindingEligible(bindingResult.rows[0])) {
        await client.query('ROLLBACK');
        cleanRelease = true;
        return { kind: 'unavailable' };
      }
      await client.query('ROLLBACK');
      cleanRelease = true;
      return { kind: 'eligible' };
    } catch {
      // A thrown query/timestamp/transaction fault is an infrastructure
      // failure, not a business rejection: report prepare_failed so the
      // gateway maps it to a stable internal 500 rather than a 409.
      cleanRelease = await this.bestEffortRollback(client, 'prepareResult');
      return { kind: 'prepare_failed' };
    } finally {
      this.releaseResultClient(client, cleanRelease);
    }
  }

  async recordResult(command: UrlCaptureResultRecordCommand): Promise<UrlCaptureResultRecordOutcome> {
    this.connection.assertAvailable();
    const client = await this.connection.pool.connect();
    let cleanRelease = false;
    let commitAttempted = false;
    try {
      await client.query('BEGIN');

      // 1. Lock the Task row and read its binding.
      const taskResult = await client.query<TaskBindingRow>(TASK_BINDING_QUERY, [command.taskId]);
      const task = taskResult.rows[0];
      if (!task) {
        await client.query('ROLLBACK');
        cleanRelease = true;
        return { kind: 'unavailable' };
      }

      // 2. Replay branch: an existing Result is evaluated before every
      //    first-submission eligibility rule. An exact replay bypasses the
      //    Lease check and returns duplicate.
      const existingResult = await client.query<ResultRow>(EXISTING_RESULT_QUERY, [command.taskId]);
      const existing = existingResult.rows[0];
      if (existing) {
        if (resultMatches(existing, command)) {
          await client.query('ROLLBACK');
          cleanRelease = true;
          return { kind: 'duplicate', result: toRecord(command.taskId, existing) };
        }
        await client.query('ROLLBACK');
        cleanRelease = true;
        return { kind: 'unavailable' };
      }

      // 3. Authoritative final time. Read from PostgreSQL AFTER the Task lock
      //    is held so a Lease that expired during the Object Storage read is
      //    observed here, not at request start. `clock_timestamp()` advances
      //    within the transaction, unlike `now()`.
      const nowResult = await client.query<{ database_now: Date | string }>(`SELECT clock_timestamp() AS database_now`);
      const finalizedAt = toTimestamp(nowResult.rows[0]?.database_now as Date | string);

      // 4. First-submission eligibility, judged with the authoritative time.
      const leaseExpiresAt = toTimestamp(task.lease_expires_at);
      if (
        task.state !== 'leased' ||
        task.claim_hash !== command.claimHash ||
        task.claim_attempt_number !== command.attemptNumber ||
        finalizedAt.getTime() >= leaseExpiresAt.getTime()
      ) {
        await client.query('ROLLBACK');
        cleanRelease = true;
        return { kind: 'unavailable' };
      }

      // 5. Complete Task/Request/Reference/Node/Instance binding.
      const bindingResult = await client.query<BindingRow>(FULL_BINDING_QUERY, [
        task.url_capture_request_id,
        task.content_package_id,
        task.owner_user_id,
      ]);
      const binding = bindingResult.rows[0];
      if (!bindingEligible(binding)) {
        await client.query('ROLLBACK');
        cleanRelease = true;
        return { kind: 'unavailable' };
      }

      // 6. Lock the Package row for the lifecycle/capacity recheck.
      const packageResult = await client.query<{ lifecycle: string }>(
        `SELECT lifecycle FROM content_packages WHERE id = $1 AND owner_user_id = $2 FOR UPDATE`,
        [task.content_package_id, task.owner_user_id],
      );
      const pkg = packageResult.rows[0];
      if (!pkg) {
        await client.query('ROLLBACK');
        cleanRelease = true;
        return { kind: 'unavailable' };
      }

      // 7. Classification.
      let recordedOutcome: 'succeeded' | 'failed';
      let recordedCategory: FetcherResultRecordedCategory | null;
      let safeCode: FetcherResultSafeCode | null;
      if (command.submittedOutcome === 'failed') {
        recordedOutcome = 'failed';
        recordedCategory = command.submittedCategory;
        safeCode = command.submittedCategory
          ? FETCHER_FAILURE_CATEGORY_TO_CODE[command.submittedCategory as FetcherFailureCategory]
          : null;
      } else if (pkg.lifecycle !== 'active') {
        recordedOutcome = 'failed';
        recordedCategory = 'package_archived';
        safeCode = 'PACKAGE_ARCHIVED';
      } else {
        const roleLimit = binding.role === 'primary' ? 1 : 5;
        const capacityResult = await client.query<{ count: number }>(
          `SELECT count(*)::int AS count FROM sources
           WHERE content_package_id = $1 AND owner_user_id = $2 AND role = $3`,
          [task.content_package_id, task.owner_user_id, binding.role],
        );
        const existingCount = Number(capacityResult.rows[0]?.count ?? 0);
        if (existingCount >= roleLimit) {
          recordedOutcome = 'failed';
          recordedCategory = 'source_role_limit';
          safeCode = 'SOURCE_ROLE_LIMIT';
        } else if (!command.objectIntegrityVerified) {
          recordedOutcome = 'failed';
          recordedCategory = 'object_integrity_failed';
          safeCode = 'OBJECT_INTEGRITY_FAILED';
        } else {
          recordedOutcome = 'succeeded';
          recordedCategory = null;
          safeCode = null;
        }
      }

      const success = command.success;
      if (recordedOutcome === 'succeeded' && success === null) {
        await client.query('ROLLBACK');
        cleanRelease = true;
        return { kind: 'unavailable' };
      }

      const sourceId = recordedOutcome === 'succeeded' ? binding.source_reference_id : null;
      const snapshotId = recordedOutcome === 'succeeded' && success ? success.snapshot.snapshotId : null;
      const successEvidence =
        command.submittedOutcome === 'succeeded' && success
          ? JSON.stringify({ snapshot: success.snapshot, capture: success.capture, candidate: success.candidate })
          : null;

      // 8. Insert the unique terminal Result, stamped with the authoritative time.
      await client.query(
        `INSERT INTO url_capture_results
           (id, task_id, url_capture_request_id, source_reference_id, content_package_id, owner_user_id,
            attempt_number, claim_hash, result_version, submitted_payload_sha256,
            submitted_outcome, submitted_category, recorded_outcome, recorded_category, safe_code,
            source_id, snapshot_id, success_evidence, accepted_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18::jsonb, $19)`,
        [
          command.resultId,
          command.taskId,
          task.url_capture_request_id,
          binding.source_reference_id,
          task.content_package_id,
          task.owner_user_id,
          command.attemptNumber,
          command.claimHash,
          FETCHER_RESULT_VERSION,
          command.submittedPayloadSha256,
          command.submittedOutcome,
          command.submittedCategory,
          recordedOutcome,
          recordedCategory,
          safeCode,
          sourceId,
          snapshotId,
          successEvidence,
          finalizedAt,
        ],
      );

      // Fault hook for guarded-transition rollback testing.
      if (this.options.beforeTransitions) {
        await this.options.beforeTransitions((text, values) => client.query(text, values as never), command.taskId);
      }

      // 9. Terminalize the Task and clear the active Lease (guarded).
      const taskUpdate = await client.query(
        `UPDATE workflow_tasks
         SET state = $2, claim_hash = NULL, claimed_by = NULL,
             lease_started_at = NULL, lease_expires_at = NULL, lease_heartbeat_at = NULL,
             updated_at = $3
         WHERE id = $1 AND state = 'leased'`,
        [command.taskId, recordedOutcome, finalizedAt],
      );
      if (taskUpdate.rowCount !== 1) {
        throw new Error('result_task_transition_unapplied');
      }

      // 10. Transition the source_capture Node (guarded).
      const nodeUpdate = await client.query(
        `UPDATE workflow_nodes
         SET state = $2, updated_at = $3
         WHERE id = $1 AND template_node_key = 'source_capture' AND state = 'ready'`,
        [task.workflow_node_id, recordedOutcome === 'succeeded' ? 'completed' : 'failed', finalizedAt],
      );
      if (nodeUpdate.rowCount !== 1) {
        throw new Error('result_node_transition_unapplied');
      }

      // 11. Success: atomically form the Source evidence graph and materialize
      //     source_review once. No Version and no Approval are created. Every
      //     timestamp uses the same authoritative finalizedAt.
      if (recordedOutcome === 'succeeded' && success) {
        await client.query(
          `INSERT INTO sources (id, content_package_id, owner_user_id, source_type, role, label, capture_type, created_at)
           VALUES ($1, $2, $3, 'public_url', $4, NULL, 'public_url', $5)`,
          [binding.source_reference_id, task.content_package_id, task.owner_user_id, binding.role, finalizedAt],
        );
        await client.query(
          `INSERT INTO source_raw_snapshots (id, source_id, owner_user_id, storage_key, sha256, byte_size, content_type, captured_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            success.snapshot.snapshotId,
            binding.source_reference_id,
            task.owner_user_id,
            success.snapshot.storageKey,
            success.snapshot.sha256,
            success.snapshot.byteSize,
            success.snapshot.contentType,
            finalizedAt,
          ],
        );
        await client.query(
          `INSERT INTO source_working_copies
             (id, source_id, owner_user_id, body, schema_version, revision, checkpointed_revision, base_version_id, updated_at, created_at)
           VALUES ($1, $2, $3, $4::jsonb, $5, 1, NULL, NULL, $6, $6)`,
          [
            command.workingCopyId,
            binding.source_reference_id,
            task.owner_user_id,
            JSON.stringify({ text: success.candidate.text }),
            success.candidate.schemaVersion,
            finalizedAt,
          ],
        );
        await client.query(
          `INSERT INTO source_heads
             (source_id, owner_user_id, working_copy_id, latest_version_id, review_candidate_version_id, approved_version_id, updated_at)
           VALUES ($1, $2, $3, NULL, NULL, NULL, $4)`,
          [binding.source_reference_id, task.owner_user_id, command.workingCopyId, finalizedAt],
        );
        const reviewNode = await client.query<{ id: string }>(
          `SELECT id FROM workflow_nodes
           WHERE workflow_instance_id = $1 AND template_node_key = 'source_review'
             AND content_package_id = $2 AND owner_user_id = $3
           FOR UPDATE`,
          [task.workflow_instance_id, task.content_package_id, task.owner_user_id],
        );
        if (reviewNode.rows.length === 0) {
          await client.query(
            `INSERT INTO workflow_nodes
               (id, workflow_instance_id, content_package_id, owner_user_id, template_id, template_version,
                template_node_key, state, revision, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, 'source_review', 'awaiting_human', 1, $7, $7)`,
            [
              command.sourceReviewNodeId,
              task.workflow_instance_id,
              task.content_package_id,
              task.owner_user_id,
              binding.template_id,
              binding.template_version,
              finalizedAt,
            ],
          );
        }
      }

      // 12. Append exactly one safe Event, stamped with the authoritative time.
      const sequenceResult = await client.query<{ next_sequence: number }>(
        `SELECT coalesce(max(sequence), 0) + 1 AS next_sequence
         FROM workflow_events
         WHERE workflow_instance_id = $1 AND content_package_id = $2 AND owner_user_id = $3`,
        [task.workflow_instance_id, task.content_package_id, task.owner_user_id],
      );
      const sequence = Number(sequenceResult.rows[0]?.next_sequence ?? 1);
      let eventType: string;
      let eventPayloadJson: string;
      if (recordedOutcome === 'succeeded' && success) {
        const payload = defineUrlCaptureSucceededEventPayload({
          taskId: command.taskId,
          sourceReferenceId: binding.source_reference_id as never,
          sourceId: binding.source_reference_id,
          snapshotId: success.snapshot.snapshotId,
          attemptNumber: command.attemptNumber,
        });
        eventType = URL_CAPTURE_SUCCEEDED_EVENT_TYPE;
        eventPayloadJson = JSON.stringify(payload);
      } else {
        const payload = defineUrlCaptureFailedEventPayload({
          taskId: command.taskId,
          sourceReferenceId: binding.source_reference_id as never,
          attemptNumber: command.attemptNumber,
          category: recordedCategory as FetcherResultRecordedCategory,
          code: safeCode as FetcherResultSafeCode,
        });
        eventType = URL_CAPTURE_FAILED_EVENT_TYPE;
        eventPayloadJson = JSON.stringify(payload);
      }
      await client.query(
        `INSERT INTO workflow_events
           (id, workflow_instance_id, content_package_id, owner_user_id, sequence,
            event_type, payload, occurred_at, workflow_node_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)`,
        [
          command.eventId,
          task.workflow_instance_id,
          task.content_package_id,
          task.owner_user_id,
          sequence,
          eventType,
          eventPayloadJson,
          finalizedAt,
          task.workflow_node_id,
        ],
      );

      commitAttempted = true;
      await client.query('COMMIT');
      cleanRelease = true;
      return {
        kind: 'recorded',
        result: {
          taskId: command.taskId,
          attemptNumber: command.attemptNumber,
          recordedOutcome,
          recordedCategory,
          safeCode,
          sourceId,
        },
      };
    } catch (error) {
      cleanRelease = await this.bestEffortRollback(client, 'recordResult');
      throw new UrlCaptureResultPersistenceError(commitAttempted ? 'COMMIT_UNKNOWN' : 'NOT_COMMITTED', error);
    } finally {
      this.releaseResultClient(client, cleanRelease);
    }
  }

  async reconcileResult(input: {
    readonly taskId: WorkflowTaskId;
    readonly claimHash: string;
    readonly attemptNumber: number;
    readonly submittedPayloadSha256: string;
  }): Promise<UrlCaptureResultReconciliation> {
    this.connection.assertAvailable();
    const client = await this.connection.pool.connect();
    let cleanRelease = false;
    try {
      await client.query('BEGIN');
      this.options.reconcileAt?.('afterBegin');
      // Cross a fresh lock barrier so any in-flight original transaction has
      // committed or rolled back before absence authorizes compensation.
      const taskResult = await client.query<{ id: string }>(`SELECT id FROM workflow_tasks WHERE id = $1 FOR UPDATE`, [
        input.taskId,
      ]);
      this.options.reconcileAt?.('taskBarrier');
      if (taskResult.rows.length === 0) {
        await client.query('ROLLBACK');
        cleanRelease = true;
        return { outcome: 'UNKNOWN' };
      }
      const resultRows = await client.query<ResultRow>(EXISTING_RESULT_QUERY, [input.taskId]);
      this.options.reconcileAt?.('resultQuery');
      await client.query('ROLLBACK');
      cleanRelease = true;
      const row = resultRows.rows[0];
      if (!row) return { outcome: 'ABSENT' };
      if (resultMatches(row, input)) {
        return { outcome: 'COMMITTED', result: toRecord(input.taskId, row) };
      }
      return { outcome: 'UNKNOWN' };
    } catch {
      cleanRelease = await this.bestEffortRollback(client, 'reconcileResult');
      return { outcome: 'UNKNOWN' };
    } finally {
      this.releaseResultClient(client, cleanRelease);
    }
  }
}
