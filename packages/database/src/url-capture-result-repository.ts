import type { PoolClient } from 'pg';

import {
  FETCHER_RESULT_VERSION,
  FETCHER_FAILURE_CATEGORY_TO_CODE,
  SERVER_DERIVED_FAILURE_CATEGORY_TO_CODE,
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

/** Full Task projection needed by the identity reconciliation. */
interface ReconcileTaskRow {
  id: string;
  state: string;
  claim_attempt_number: number;
  claim_hash: string | null;
  claimed_by: string | null;
  lease_started_at: Date | string | null;
  lease_expires_at: Date | string | null;
  lease_heartbeat_at: Date | string | null;
  workflow_instance_id: string;
  workflow_node_id: string;
  url_capture_request_id: string;
  content_package_id: string;
  owner_user_id: string;
}

interface ReconcileEvidenceSnapshot {
  readonly snapshotId?: string;
  readonly storageKey?: string;
  readonly sha256?: string;
  readonly byteSize?: number;
  readonly contentType?: string;
}

interface ReconcileEvidenceCandidate {
  readonly text?: string;
}

interface ReconcileEvidence {
  readonly snapshot?: ReconcileEvidenceSnapshot;
  readonly capture?: unknown;
  readonly candidate?: ReconcileEvidenceCandidate;
}

/** Full Result projection needed by the identity reconciliation. */
interface ReconcileResultRow {
  attempt_number: number;
  claim_hash: string;
  submitted_payload_sha256: string;
  recorded_outcome: 'succeeded' | 'failed';
  recorded_category: FetcherResultRecordedCategory | null;
  safe_code: FetcherResultSafeCode | null;
  source_id: string | null;
  snapshot_id: string | null;
  source_reference_id: string;
  success_evidence: ReconcileEvidence | null;
}

const RECONCILE_TASK_QUERY = `SELECT id, state, claim_attempt_number, claim_hash, claimed_by,
       lease_started_at, lease_expires_at, lease_heartbeat_at,
       workflow_instance_id, workflow_node_id, url_capture_request_id,
       content_package_id, owner_user_id
FROM workflow_tasks
WHERE id = $1
FOR UPDATE`;

const RECONCILE_RESULT_QUERY = `SELECT attempt_number, claim_hash, submitted_payload_sha256, recorded_outcome,
       recorded_category, safe_code, source_id, snapshot_id, source_reference_id, success_evidence
FROM url_capture_results
WHERE task_id = $1`;

/** True only when `category` maps exactly to `safeCode` in either mapping. */
function safeCodeMatchesCategory(
  category: FetcherResultRecordedCategory | null,
  safeCode: FetcherResultSafeCode | null,
): boolean {
  if (category === null || safeCode === null) return false;
  if (category in FETCHER_FAILURE_CATEGORY_TO_CODE) {
    return FETCHER_FAILURE_CATEGORY_TO_CODE[category as FetcherFailureCategory] === safeCode;
  }
  return (
    SERVER_DERIVED_FAILURE_CATEGORY_TO_CODE[category as keyof typeof SERVER_DERIVED_FAILURE_CATEGORY_TO_CODE] ===
    safeCode
  );
}

async function singleCount(client: PoolClient, text: string, values: readonly unknown[]): Promise<number> {
  const result = await client.query<{ count: number }>(text, [...values]);
  return Number(result.rows[0]?.count ?? 0);
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
    // Connection acquisition happens before any transaction. A failure here
    // (unavailable connection, refused connect, or any pre-BEGIN boundary
    // fault) means nothing was committed, so it must surface as a stable
    // NOT_COMMITTED persistence error: the service then performs the bounded
    // object compensation and returns a stable internal error. It is never
    // COMMIT_UNKNOWN because no Commit was attempted.
    let client: PoolClient;
    try {
      this.connection.assertAvailable();
      client = await this.connection.pool.connect();
    } catch (error) {
      throw new UrlCaptureResultPersistenceError('NOT_COMMITTED', error);
    }

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

  /**
   * Post-COMMIT_UNKNOWN identity reconciliation.
   *
   * Reconciliation opens a fresh read-only PostgreSQL transaction, takes a
   * commit-barrier lock on the Task row, reads the Result, and then verifies
   * the complete persisted identity graph for the Result's recorded outcome.
   * It returns `COMMITTED` only when the entire graph is exactly right,
   * `ABSENT` only when there is no Result and no partial effect at all, and
   * `UNKNOWN` for every mismatch, partial effect, or query/cleanup fault. An
   * `UNKNOWN` outcome retains the immutable object and never claims success.
   */
  async reconcileResult(input: {
    readonly taskId: WorkflowTaskId;
    readonly claimHash: string;
    readonly attemptNumber: number;
    readonly submittedPayloadSha256: string;
  }): Promise<UrlCaptureResultReconciliation> {
    let client: PoolClient;
    try {
      this.connection.assertAvailable();
      client = await this.connection.pool.connect();
    } catch {
      // An acquisition fault means reconciliation cannot prove commitment.
      return { outcome: 'UNKNOWN' };
    }
    let cleanRelease = false;
    try {
      await client.query('BEGIN');
      this.options.reconcileAt?.('afterBegin');

      // 1. Commit-barrier lock on the Task row: any in-flight original
      //    transaction has committed or rolled back before we read the graph.
      const taskResult = await client.query<ReconcileTaskRow>(RECONCILE_TASK_QUERY, [input.taskId]);
      this.options.reconcileAt?.('taskBarrier');
      const task = taskResult.rows[0];
      if (!task) {
        await client.query('ROLLBACK');
        cleanRelease = true;
        return { outcome: 'UNKNOWN' };
      }

      const sourceReferenceId = await this.lookupSourceReferenceId(client, task);

      // 2. Read the Result.
      const resultQueryResult = await client.query<ReconcileResultRow>(RECONCILE_RESULT_QUERY, [input.taskId]);
      this.options.reconcileAt?.('resultQuery');
      const result = resultQueryResult.rows[0];

      // 3. No Result: ABSENT only when there is no partial effect whatsoever.
      if (!result) {
        const absent = sourceReferenceId !== null && (await this.verifyAbsent(client, task, sourceReferenceId));
        await client.query('ROLLBACK');
        cleanRelease = true;
        return absent ? { outcome: 'ABSENT' } : { outcome: 'UNKNOWN' };
      }

      // 4. Result identity must match exactly.
      if (!resultMatches(result, input)) {
        await client.query('ROLLBACK');
        cleanRelease = true;
        return { outcome: 'UNKNOWN' };
      }
      if (sourceReferenceId === null || result.source_reference_id !== sourceReferenceId) {
        await client.query('ROLLBACK');
        cleanRelease = true;
        return { outcome: 'UNKNOWN' };
      }

      // 5. Verify the complete persisted graph for the recorded outcome.
      const committed =
        result.recorded_outcome === 'succeeded'
          ? await this.verifySuccessGraph(client, task, result, sourceReferenceId)
          : await this.verifyFailureGraph(client, task, result, sourceReferenceId);

      await client.query('ROLLBACK');
      cleanRelease = true;
      return committed ? { outcome: 'COMMITTED', result: toRecord(input.taskId, result) } : { outcome: 'UNKNOWN' };
    } catch {
      cleanRelease = await this.bestEffortRollback(client, 'reconcileResult');
      return { outcome: 'UNKNOWN' };
    } finally {
      this.releaseResultClient(client, cleanRelease);
    }
  }

  private async lookupSourceReferenceId(client: PoolClient, task: ReconcileTaskRow): Promise<string | null> {
    const rows = await client.query<{ source_reference_id: string }>(
      `SELECT source_reference_id FROM url_capture_requests
       WHERE id = $1 AND content_package_id = $2 AND owner_user_id = $3`,
      [task.url_capture_request_id, task.content_package_id, task.owner_user_id],
    );
    return rows.rows[0]?.source_reference_id ?? null;
  }

  /**
   * ABSENT is only valid when the Task remains in a legitimate non-terminal
   * state and there is no Result Event, no Source evidence from the URL Source
   * Reference, and the source_capture Node has not been terminalized. Any
   * partial effect turns the outcome into UNKNOWN.
   */
  private async verifyAbsent(client: PoolClient, task: ReconcileTaskRow, sourceReferenceId: string): Promise<boolean> {
    if (task.state !== 'leased' && task.state !== 'queued') return false;
    const eventCount = await singleCount(
      client,
      `SELECT count(*)::int AS count FROM workflow_events
       WHERE workflow_instance_id = $1 AND event_type IN ($2, $3)`,
      [task.workflow_instance_id, URL_CAPTURE_SUCCEEDED_EVENT_TYPE, URL_CAPTURE_FAILED_EVENT_TYPE],
    );
    if (eventCount !== 0) return false;
    const sourceCount = await singleCount(client, `SELECT count(*)::int AS count FROM sources WHERE id = $1`, [
      sourceReferenceId,
    ]);
    if (sourceCount !== 0) return false;
    const captureState = await this.queryNodeState(client, task.workflow_node_id);
    return captureState === 'ready';
  }

  private async queryNodeState(client: PoolClient, nodeId: string): Promise<string | null> {
    const rows = await client.query<{ state: string }>(`SELECT state FROM workflow_nodes WHERE id = $1`, [nodeId]);
    return rows.rows[0]?.state ?? null;
  }

  /** Verify the full persisted graph of a COMMITTED success Result. */
  private async verifySuccessGraph(
    client: PoolClient,
    task: ReconcileTaskRow,
    result: ReconcileResultRow,
    sourceReferenceId: string,
  ): Promise<boolean> {
    // Result invariants for a success.
    if (result.recorded_category !== null || result.safe_code !== null) return false;
    if (result.source_id !== sourceReferenceId) return false;
    if (result.snapshot_id === null) return false;
    const evidence = result.success_evidence;
    if (!evidence || !evidence.snapshot || !evidence.candidate) return false;

    // Task terminalized and Lease fully cleared.
    if (task.state !== 'succeeded') return false;
    if (
      task.claim_hash !== null ||
      task.claimed_by !== null ||
      task.lease_started_at !== null ||
      task.lease_expires_at !== null ||
      task.lease_heartbeat_at !== null
    ) {
      return false;
    }

    // source_capture completed.
    if ((await this.queryNodeState(client, task.workflow_node_id)) !== 'completed') return false;

    // Source: exactly one row, bound to the URL Source Reference.
    const sourceRows = await client.query<{
      content_package_id: string;
      owner_user_id: string;
      source_type: string;
      capture_type: string;
      role: string;
    }>(`SELECT content_package_id, owner_user_id, source_type, capture_type, role FROM sources WHERE id = $1`, [
      sourceReferenceId,
    ]);
    if (sourceRows.rows.length !== 1) return false;
    const source = sourceRows.rows[0];
    if (!source) return false;
    if (source.content_package_id !== task.content_package_id || source.owner_user_id !== task.owner_user_id) {
      return false;
    }
    if (source.source_type !== 'public_url' || source.capture_type !== 'public_url') return false;

    // URL Source Reference role/owner/package must agree with the Source.
    const referenceRows = await client.query<{ role: string; owner_user_id: string; content_package_id: string }>(
      `SELECT role, owner_user_id, content_package_id FROM url_source_references WHERE id = $1`,
      [sourceReferenceId],
    );
    if (referenceRows.rows.length !== 1) return false;
    const reference = referenceRows.rows[0];
    if (!reference) return false;
    if (
      reference.role !== source.role ||
      reference.owner_user_id !== source.owner_user_id ||
      reference.content_package_id !== source.content_package_id
    ) {
      return false;
    }

    // Raw Snapshot: exactly one row, id = Result.snapshot_id, fields match evidence.
    const snapshotRows = await client.query<{
      source_id: string;
      owner_user_id: string;
      storage_key: string;
      sha256: string;
      byte_size: number;
      content_type: string;
    }>(
      `SELECT source_id, owner_user_id, storage_key, sha256, byte_size, content_type FROM source_raw_snapshots WHERE id = $1`,
      [result.snapshot_id],
    );
    if (snapshotRows.rows.length !== 1) return false;
    const snapshot = snapshotRows.rows[0];
    if (!snapshot) return false;
    const evidenceSnapshot = evidence.snapshot;
    if (snapshot.source_id !== result.source_id || snapshot.owner_user_id !== task.owner_user_id) return false;
    if (
      snapshot.storage_key !== evidenceSnapshot.storageKey ||
      snapshot.sha256 !== evidenceSnapshot.sha256 ||
      Number(snapshot.byte_size) !== evidenceSnapshot.byteSize ||
      snapshot.content_type !== evidenceSnapshot.contentType
    ) {
      return false;
    }

    // Working Copy: exactly one row, revision 1, normalized schema, text matches.
    const workingCopyRows = await client.query<{
      id: string;
      revision: number;
      schema_version: string;
      body: { text?: string };
    }>(`SELECT id, revision, schema_version, body FROM source_working_copies WHERE source_id = $1`, [
      sourceReferenceId,
    ]);
    if (workingCopyRows.rows.length !== 1) return false;
    const workingCopy = workingCopyRows.rows[0];
    if (!workingCopy) return false;
    if (workingCopy.revision !== 1 || workingCopy.schema_version !== 'source/normalized/v1') return false;
    if (workingCopy.body?.text !== evidence.candidate.text) return false;

    // Head: exactly one row, pointing at the Working Copy with no Versions.
    const headRows = await client.query<{
      working_copy_id: string;
      latest_version_id: string | null;
      review_candidate_version_id: string | null;
      approved_version_id: string | null;
    }>(
      `SELECT working_copy_id, latest_version_id, review_candidate_version_id, approved_version_id
       FROM source_heads WHERE source_id = $1`,
      [sourceReferenceId],
    );
    if (headRows.rows.length !== 1) return false;
    const head = headRows.rows[0];
    if (!head) return false;
    if (head.working_copy_id !== workingCopy.id) return false;
    if (
      head.latest_version_id !== null ||
      head.review_candidate_version_id !== null ||
      head.approved_version_id !== null
    ) {
      return false;
    }

    // source_review: exactly one row, awaiting_human.
    const reviewRows = await client.query<{ state: string }>(
      `SELECT state FROM workflow_nodes
       WHERE workflow_instance_id = $1 AND template_node_key = 'source_review'
         AND content_package_id = $2 AND owner_user_id = $3`,
      [task.workflow_instance_id, task.content_package_id, task.owner_user_id],
    );
    if (reviewRows.rows.length !== 1) return false;
    const reviewNode = reviewRows.rows[0];
    if (!reviewNode || reviewNode.state !== 'awaiting_human') return false;

    // Event: exactly one url_capture_succeeded.v1 with a matching payload.
    const eventRows = await client.query<{ payload: Record<string, unknown> }>(
      `SELECT payload FROM workflow_events WHERE workflow_instance_id = $1 AND event_type = $2`,
      [task.workflow_instance_id, URL_CAPTURE_SUCCEEDED_EVENT_TYPE],
    );
    const payload = eventRows.rows[0]?.payload;
    if (!payload || eventRows.rows.length !== 1) return false;
    if (
      payload.taskId !== task.id ||
      payload.sourceReferenceId !== sourceReferenceId ||
      payload.sourceId !== sourceReferenceId ||
      payload.snapshotId !== result.snapshot_id ||
      payload.attemptNumber !== result.attempt_number
    ) {
      return false;
    }

    // No Version and no Approval may exist for this Source.
    const versionCount = await singleCount(
      client,
      `SELECT count(*)::int AS count FROM source_versions WHERE source_id = $1`,
      [sourceReferenceId],
    );
    if (versionCount !== 0) return false;
    const approvalCount = await singleCount(
      client,
      `SELECT count(*)::int AS count FROM source_approvals WHERE source_id = $1`,
      [sourceReferenceId],
    );
    return approvalCount === 0;
  }

  /** Verify the full persisted graph of a COMMITTED failure Result. */
  private async verifyFailureGraph(
    client: PoolClient,
    task: ReconcileTaskRow,
    result: ReconcileResultRow,
    sourceReferenceId: string,
  ): Promise<boolean> {
    // Result invariants for a failure.
    if (result.recorded_category === null) return false;
    if (!safeCodeMatchesCategory(result.recorded_category, result.safe_code)) return false;
    if (result.source_id !== null || result.snapshot_id !== null) return false;

    // Task terminalized to failed and Lease fully cleared.
    if (task.state !== 'failed') return false;
    if (
      task.claim_hash !== null ||
      task.claimed_by !== null ||
      task.lease_started_at !== null ||
      task.lease_expires_at !== null ||
      task.lease_heartbeat_at !== null
    ) {
      return false;
    }

    // source_capture failed.
    if ((await this.queryNodeState(client, task.workflow_node_id)) !== 'failed') return false;

    // No Source evidence may exist for the URL Source Reference.
    const sourceCount = await singleCount(client, `SELECT count(*)::int AS count FROM sources WHERE id = $1`, [
      sourceReferenceId,
    ]);
    if (sourceCount !== 0) return false;
    const snapshotCount = await singleCount(
      client,
      `SELECT count(*)::int AS count FROM source_raw_snapshots WHERE source_id = $1`,
      [sourceReferenceId],
    );
    if (snapshotCount !== 0) return false;
    const workingCopyCount = await singleCount(
      client,
      `SELECT count(*)::int AS count FROM source_working_copies WHERE source_id = $1`,
      [sourceReferenceId],
    );
    if (workingCopyCount !== 0) return false;
    const headCount = await singleCount(
      client,
      `SELECT count(*)::int AS count FROM source_heads WHERE source_id = $1`,
      [sourceReferenceId],
    );
    if (headCount !== 0) return false;
    const reviewCount = await singleCount(
      client,
      `SELECT count(*)::int AS count FROM workflow_nodes
       WHERE workflow_instance_id = $1 AND template_node_key = 'source_review'
         AND content_package_id = $2 AND owner_user_id = $3`,
      [task.workflow_instance_id, task.content_package_id, task.owner_user_id],
    );
    if (reviewCount !== 0) return false;

    // Event: exactly one url_capture_failed.v1 with a matching payload.
    const eventRows = await client.query<{ payload: Record<string, unknown> }>(
      `SELECT payload FROM workflow_events WHERE workflow_instance_id = $1 AND event_type = $2`,
      [task.workflow_instance_id, URL_CAPTURE_FAILED_EVENT_TYPE],
    );
    const payload = eventRows.rows[0]?.payload;
    if (!payload || eventRows.rows.length !== 1) return false;
    return (
      payload.taskId === task.id &&
      payload.sourceReferenceId === sourceReferenceId &&
      payload.attemptNumber === result.attempt_number &&
      payload.category === result.recorded_category &&
      payload.code === result.safe_code
    );
  }
}
