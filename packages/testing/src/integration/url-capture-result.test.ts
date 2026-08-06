import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  FetcherGatewayApplicationError,
  FetcherGatewayService,
  FetcherResultInternalError,
  FetcherResultService,
  UrlCaptureResultPersistenceError,
  UrlCaptureService,
  buildUrlCaptureStorageKey,
  hashFetcherGatewayClaim,
  type ContentPackageId,
  type ContentPackageOwnerId,
  type FetcherResultSuccessEvidence,
  type ObjectStore,
  type StoredObject,
  type UrlCaptureIdGenerator,
  type UrlCaptureResultRecordCommand,
  type UrlCaptureResultRepository,
} from '@contentos/core';
import {
  createFetcherGatewayRepositoryTestBoundary,
  createSourceRepositoryTestBoundary,
  createUrlCaptureRepositoryTestBoundary,
  createUrlCaptureResultRepositoryTestBoundary,
  type UrlCaptureRepositoryTestBoundary,
} from '@contentos/database';

import { readComposeCredentials, requireState } from './env.js';

function databaseUrl(): string {
  const state = requireState();
  const credentials = readComposeCredentials(state.envFile);
  return `postgresql://smoke_user:${encodeURIComponent(credentials.POSTGRES_PASSWORD ?? '')}@127.0.0.1:${state.ports.postgres}/smoke_db`;
}

function captureIds(): UrlCaptureIdGenerator {
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

interface LeasedTask {
  readonly packageId: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
  readonly taskId: string;
  readonly claim: string;
  readonly claimHash: string;
  readonly attemptNumber: number;
  readonly sourceReferenceId: string;
}

async function createLeasedTask(commandBoundary: UrlCaptureRepositoryTestBoundary): Promise<LeasedTask> {
  const ownerUserId = randomUUID() as ContentPackageOwnerId;
  const packageId = randomUUID() as ContentPackageId;
  await commandBoundary.query(
    `INSERT INTO content_packages
      (id, owner_user_id, title, description, content_mode, requested_blog, requested_xiaohongshu,
       lifecycle, revision, created_at, updated_at, archived_at)
     VALUES ($1, $2, 'Result repository fixture', NULL, 'creator_led', true, true, 'active', 1, now(), now(), NULL)`,
    [packageId, ownerUserId],
  );
  const submitted = await new UrlCaptureService(commandBoundary.repository, captureIds(), {
    now: () => new Date(),
  }).submit({
    contentPackageId: packageId,
    ownerUserId,
    expectedPackageRevision: 1,
    role: 'primary',
    submittedUrl: 'https://example.com/result-repository/private',
    idempotencyKey: randomUUID().replaceAll('-', '').slice(0, 16),
  });
  await commandBoundary.query(
    `UPDATE workflow_outbox_records
     SET state = 'dispatched', last_dispatch_at = created_at, dispatched_at = created_at
     WHERE task_id = $1`,
    [submitted.taskId],
  );
  const claim = 'A'.repeat(43);
  const gatewayBoundary = createFetcherGatewayRepositoryTestBoundary(databaseUrl());
  let claimed: { attemptNumber: number };
  try {
    const gateway = new FetcherGatewayService(
      gatewayBoundary.repository,
      { generate: () => claim },
      { now: () => new Date() },
    );
    claimed = await gateway.claim(submitted.taskId as never, 1);
  } finally {
    await gatewayBoundary.close();
  }
  const [referenceRow] = await commandBoundary.query<{ source_reference_id: string }>(
    `SELECT c.source_reference_id
     FROM workflow_tasks t JOIN url_capture_requests c ON c.id = t.url_capture_request_id
     WHERE t.id = $1`,
    [submitted.taskId],
  );
  return {
    packageId,
    ownerUserId,
    taskId: submitted.taskId,
    claim,
    claimHash: hashFetcherGatewayClaim(claim),
    attemptNumber: claimed.attemptNumber,
    sourceReferenceId: referenceRow?.source_reference_id ?? '',
  };
}

function successEvidence(taskId: string, attemptNumber: number): FetcherResultSuccessEvidence {
  const snapshotId = randomUUID();
  return {
    snapshot: {
      snapshotId,
      storageKey: buildUrlCaptureStorageKey({ taskId, attemptNumber, snapshotId }),
      sha256: 'a'.repeat(64),
      byteSize: 1234,
      contentType: 'text/html',
      contentEncoding: 'identity',
    },
    capture: {
      finalUrl: 'https://example.com/final',
      redirects: [],
      responseStatus: 200,
      encodedByteSize: 1234,
      decodedByteSize: 5678,
    },
    candidate: { schemaVersion: 'source/normalized/v1', text: 'reviewable normalized text' },
  };
}

function successCommand(
  task: LeasedTask,
  overrides: Partial<UrlCaptureResultRecordCommand> = {},
): UrlCaptureResultRecordCommand {
  return {
    taskId: task.taskId as never,
    claimHash: task.claimHash,
    attemptNumber: task.attemptNumber,
    submittedPayloadSha256: createHash('sha256').update(randomBytes(16)).digest('hex'),
    submittedOutcome: 'succeeded',
    submittedCategory: null,
    objectIntegrityVerified: true,
    success: successEvidence(task.taskId, task.attemptNumber),
    resultId: randomUUID(),
    workingCopyId: randomUUID(),
    sourceReviewNodeId: randomUUID() as never,
    eventId: randomUUID() as never,
    ...overrides,
  };
}

function failureCommand(
  task: LeasedTask,
  category: 'fetch_failed' | 'timeout' = 'fetch_failed',
  overrides: Partial<UrlCaptureResultRecordCommand> = {},
): UrlCaptureResultRecordCommand {
  return {
    taskId: task.taskId as never,
    claimHash: task.claimHash,
    attemptNumber: task.attemptNumber,
    submittedPayloadSha256: createHash('sha256').update(randomBytes(16)).digest('hex'),
    submittedOutcome: 'failed',
    submittedCategory: category,
    objectIntegrityVerified: false,
    success: null,
    resultId: randomUUID(),
    workingCopyId: randomUUID(),
    sourceReviewNodeId: randomUUID() as never,
    eventId: randomUUID() as never,
    ...overrides,
  };
}

async function cleanup(commandBoundary: UrlCaptureRepositoryTestBoundary, packageId: ContentPackageId): Promise<void> {
  await commandBoundary.query('DELETE FROM url_capture_results WHERE content_package_id = $1', [packageId]);
  await commandBoundary.query(
    'DELETE FROM source_heads WHERE owner_user_id IN (SELECT owner_user_id FROM content_packages WHERE id = $1)',
    [packageId],
  );
  await commandBoundary.query(
    'DELETE FROM source_working_copies WHERE source_id IN (SELECT id FROM sources WHERE content_package_id = $1)',
    [packageId],
  );
  await commandBoundary.query(
    'DELETE FROM source_raw_snapshots WHERE source_id IN (SELECT id FROM sources WHERE content_package_id = $1)',
    [packageId],
  );
  await commandBoundary.query('DELETE FROM sources WHERE content_package_id = $1', [packageId]);
  await commandBoundary.query('DELETE FROM workflow_outbox_records WHERE content_package_id = $1', [packageId]);
  await commandBoundary.query('DELETE FROM workflow_tasks WHERE content_package_id = $1', [packageId]);
  await commandBoundary.query('DELETE FROM url_capture_requests WHERE content_package_id = $1', [packageId]);
  await commandBoundary.query('DELETE FROM url_source_references WHERE content_package_id = $1', [packageId]);
  await withWorkflowEventsUnlocked(commandBoundary, async () => {
    await commandBoundary.query('DELETE FROM workflow_events WHERE content_package_id = $1', [packageId]);
  });
  await commandBoundary.query('DELETE FROM workflow_nodes WHERE content_package_id = $1', [packageId]);
  await commandBoundary.query('DELETE FROM workflow_instances WHERE content_package_id = $1', [packageId]);
  await commandBoundary.query('DELETE FROM content_packages WHERE id = $1', [packageId]);
}

async function withWorkflowEventsUnlocked(
  boundary: UrlCaptureRepositoryTestBoundary,
  fn: () => Promise<void>,
): Promise<void> {
  await boundary.query('ALTER TABLE workflow_events DISABLE TRIGGER workflow_events_immutable_trigger');
  try {
    await fn();
  } finally {
    await boundary.query('ALTER TABLE workflow_events ENABLE TRIGGER workflow_events_immutable_trigger');
  }
}

async function waitForResultPackageLock(boundary: UrlCaptureRepositoryTestBoundary): Promise<void> {
  for (let attempt = 0; attempt < 1_000; attempt += 1) {
    const [waiting] = await boundary.query<{ waiting: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM pg_stat_activity
         WHERE datname = current_database()
           AND wait_event_type = 'Lock'
           AND query LIKE 'SELECT lifecycle FROM content_packages%FOR UPDATE%'
       ) AS waiting`,
    );
    if (waiting?.waiting) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('result_package_lock_wait_not_observed');
}

describe('M2-SRC-003 PostgreSQL url_capture_results repository', () => {
  it('records one atomic success graph with a terminal task, source evidence, and one safe event', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const command = successCommand(fixture);
      const outcome = await resultBoundary.repository.recordResult(command);
      expect(outcome.kind).toBe('recorded');
      if (outcome.kind !== 'recorded') return;
      expect(outcome.result).toMatchObject({
        taskId: fixture.taskId,
        attemptNumber: fixture.attemptNumber,
        recordedOutcome: 'succeeded',
        recordedCategory: null,
        safeCode: null,
        sourceId: fixture.sourceReferenceId,
      });

      // Task is terminal and its active lease is cleared.
      const [task] = await commandBoundary.query<{
        state: string;
        claim_hash: string | null;
        claimed_by: string | null;
        lease_started_at: Date | null;
        lease_expires_at: Date | null;
        lease_heartbeat_at: Date | null;
      }>(
        'SELECT state, claim_hash, claimed_by, lease_started_at, lease_expires_at, lease_heartbeat_at FROM workflow_tasks WHERE id = $1',
        [fixture.taskId],
      );
      expect(task).toMatchObject({ state: 'succeeded', claim_hash: null, claimed_by: null });
      expect(task?.lease_started_at).toBeNull();
      expect(task?.lease_expires_at).toBeNull();
      expect(task?.lease_heartbeat_at).toBeNull();

      // Source graph: source.id equals the URL source reference id.
      const [source] = await commandBoundary.query<{
        id: string;
        source_type: string;
        capture_type: string;
        role: string;
        label: string | null;
      }>('SELECT id, source_type, capture_type, role, label FROM sources WHERE id = $1', [fixture.sourceReferenceId]);
      expect(source).toMatchObject({
        id: fixture.sourceReferenceId,
        source_type: 'public_url',
        capture_type: 'public_url',
        role: 'primary',
        label: null,
      });

      const [snapshot] = await commandBoundary.query<{
        id: string;
        source_id: string;
        storage_key: string;
        byte_size: number;
        content_type: string;
      }>('SELECT id, source_id, storage_key, byte_size, content_type FROM source_raw_snapshots WHERE source_id = $1', [
        fixture.sourceReferenceId,
      ]);
      expect(snapshot?.source_id).toBe(fixture.sourceReferenceId);
      expect(snapshot?.content_type).toBe('text/html');

      const [workingCopy] = await commandBoundary.query<{
        revision: number;
        schema_version: string;
        body: { text: string };
      }>('SELECT revision, schema_version, body FROM source_working_copies WHERE source_id = $1', [
        fixture.sourceReferenceId,
      ]);
      expect(workingCopy?.revision).toBe(1);
      expect(workingCopy?.body).toEqual({ text: 'reviewable normalized text' });

      const [head] = await commandBoundary.query<{
        source_id: string;
        latest_version_id: string | null;
        approved_version_id: string | null;
      }>('SELECT source_id, latest_version_id, approved_version_id FROM source_heads WHERE source_id = $1', [
        fixture.sourceReferenceId,
      ]);
      expect(head?.source_id).toBe(fixture.sourceReferenceId);
      expect(head?.latest_version_id).toBeNull();
      expect(head?.approved_version_id).toBeNull();

      // No Version and no Approval are created.
      expect(
        (
          await commandBoundary.query('SELECT id FROM source_versions WHERE source_id = $1', [
            fixture.sourceReferenceId,
          ])
        ).length,
      ).toBe(0);
      expect(
        (
          await commandBoundary.query('SELECT id FROM source_approvals WHERE source_id = $1', [
            fixture.sourceReferenceId,
          ])
        ).length,
      ).toBe(0);

      // source_capture completed and source_review materialized once.
      const nodes = await commandBoundary.query<{ template_node_key: string; state: string }>(
        'SELECT template_node_key, state FROM workflow_nodes WHERE content_package_id = $1 ORDER BY template_node_key',
        [fixture.packageId],
      );
      expect(nodes).toEqual([
        { template_node_key: 'source_capture', state: 'completed' },
        { template_node_key: 'source_review', state: 'awaiting_human' },
      ]);

      // Exactly one success event with the exact safe payload.
      const events = await commandBoundary.query<{ event_type: string; payload: Record<string, unknown> }>(
        "SELECT event_type, payload FROM workflow_events WHERE content_package_id = $1 AND event_type IN ('url_capture_succeeded.v1', 'url_capture_failed.v1')",
        [fixture.packageId],
      );
      expect(events).toHaveLength(1);
      expect(events[0]?.event_type).toBe('url_capture_succeeded.v1');
      expect(events[0]?.payload).toEqual({
        taskId: fixture.taskId,
        sourceReferenceId: fixture.sourceReferenceId,
        sourceId: fixture.sourceReferenceId,
        snapshotId: command.success?.snapshot.snapshotId,
        attemptNumber: fixture.attemptNumber,
      });
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('records one atomic failure graph with no source evidence and one safe failure event', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const outcome = await resultBoundary.repository.recordResult(failureCommand(fixture, 'fetch_failed'));
      expect(outcome.kind).toBe('recorded');
      if (outcome.kind !== 'recorded') return;
      expect(outcome.result).toMatchObject({
        recordedOutcome: 'failed',
        recordedCategory: 'fetch_failed',
        safeCode: 'FETCH_FAILED',
        sourceId: null,
      });

      const [task] = await commandBoundary.query<{ state: string; claim_hash: string | null }>(
        'SELECT state, claim_hash FROM workflow_tasks WHERE id = $1',
        [fixture.taskId],
      );
      expect(task).toMatchObject({ state: 'failed', claim_hash: null });

      expect(
        (await commandBoundary.query('SELECT id FROM sources WHERE content_package_id = $1', [fixture.packageId]))
          .length,
      ).toBe(0);
      const nodes = await commandBoundary.query<{ template_node_key: string; state: string }>(
        'SELECT template_node_key, state FROM workflow_nodes WHERE content_package_id = $1 ORDER BY template_node_key',
        [fixture.packageId],
      );
      expect(nodes).toEqual([{ template_node_key: 'source_capture', state: 'failed' }]);

      const events = await commandBoundary.query<{ event_type: string; payload: Record<string, unknown> }>(
        "SELECT event_type, payload FROM workflow_events WHERE content_package_id = $1 AND event_type = 'url_capture_failed.v1'",
        [fixture.packageId],
      );
      expect(events).toHaveLength(1);
      expect(events[0]?.payload).toEqual({
        taskId: fixture.taskId,
        sourceReferenceId: fixture.sourceReferenceId,
        attemptNumber: fixture.attemptNumber,
        category: 'fetch_failed',
        code: 'FETCH_FAILED',
      });
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('rejects a Task whose Node binding does not match its URL Capture Request', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const [task] = await commandBoundary.query<{
        workflow_instance_id: string;
        content_package_id: string;
        owner_user_id: string;
      }>(
        `SELECT workflow_instance_id, content_package_id, owner_user_id
         FROM workflow_tasks WHERE id = $1`,
        [fixture.taskId],
      );
      const mismatchedNodeId = randomUUID();
      await commandBoundary.query(
        `INSERT INTO workflow_nodes
           (id, workflow_instance_id, content_package_id, owner_user_id, template_id, template_version,
            template_node_key, state, revision, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'content-package-dual-output', 'v1',
                 'source_review', 'awaiting_human', 1, now(), now())`,
        [mismatchedNodeId, task?.workflow_instance_id, task?.content_package_id, task?.owner_user_id],
      );
      await commandBoundary.query('ALTER TABLE workflow_tasks DISABLE TRIGGER ALL');
      try {
        await commandBoundary.query('UPDATE workflow_tasks SET workflow_node_id = $2 WHERE id = $1', [
          fixture.taskId,
          mismatchedNodeId,
        ]);
      } finally {
        await commandBoundary.query('ALTER TABLE workflow_tasks ENABLE TRIGGER ALL');
      }

      const command = successCommand(fixture);
      await expect(
        resultBoundary.repository.prepareResult({
          taskId: fixture.taskId as never,
          claimHash: fixture.claimHash,
          attemptNumber: fixture.attemptNumber,
          submittedPayloadSha256: command.submittedPayloadSha256,
          acceptedAt: new Date(),
        }),
      ).resolves.toEqual({ kind: 'unavailable' });
      await expect(resultBoundary.repository.recordResult(command)).resolves.toEqual({ kind: 'unavailable' });
      await expect(
        resultBoundary.repository.reconcileResult({
          taskId: fixture.taskId as never,
          claimHash: fixture.claimHash,
          attemptNumber: fixture.attemptNumber,
          submittedPayloadSha256: command.submittedPayloadSha256,
        }),
      ).resolves.toEqual({ outcome: 'UNKNOWN' });

      expect(
        (await commandBoundary.query('SELECT id FROM url_capture_results WHERE task_id = $1', [fixture.taskId])).length,
      ).toBe(0);
      expect(
        (await commandBoundary.query('SELECT id FROM sources WHERE content_package_id = $1', [fixture.packageId]))
          .length,
      ).toBe(0);
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('records server-derived integrity, archive, and capacity failures without a source', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());

    // Object integrity failure.
    let integrityFixture: LeasedTask | undefined;
    try {
      integrityFixture = await createLeasedTask(commandBoundary);
      const outcome = await resultBoundary.repository.recordResult(
        successCommand(integrityFixture, { objectIntegrityVerified: false }),
      );
      expect(outcome.kind).toBe('recorded');
      if (outcome.kind === 'recorded') {
        expect(outcome.result.recordedCategory).toBe('object_integrity_failed');
        expect(outcome.result.safeCode).toBe('OBJECT_INTEGRITY_FAILED');
        expect(outcome.result.sourceId).toBeNull();
      }
      expect(
        (
          await commandBoundary.query('SELECT id FROM sources WHERE content_package_id = $1', [
            integrityFixture.packageId,
          ])
        ).length,
      ).toBe(0);
    } finally {
      if (integrityFixture) await cleanup(commandBoundary, integrityFixture.packageId);
    }

    // Package archived.
    let archiveFixture: LeasedTask | undefined;
    try {
      archiveFixture = await createLeasedTask(commandBoundary);
      await commandBoundary.query(
        'UPDATE content_packages SET lifecycle = $2, archived_at = now(), updated_at = now() WHERE id = $1',
        [archiveFixture.packageId, 'archived'],
      );
      const outcome = await resultBoundary.repository.recordResult(successCommand(archiveFixture));
      expect(outcome.kind).toBe('recorded');
      if (outcome.kind === 'recorded') {
        expect(outcome.result.recordedCategory).toBe('package_archived');
        expect(outcome.result.safeCode).toBe('PACKAGE_ARCHIVED');
      }
    } finally {
      if (archiveFixture) {
        await commandBoundary.query(
          'UPDATE content_packages SET lifecycle = $2, archived_at = NULL, updated_at = now() WHERE id = $1',
          [archiveFixture.packageId, 'active'],
        );
        await cleanup(commandBoundary, archiveFixture.packageId);
      }
    }

    // Role capacity full.
    let capacityFixture: LeasedTask | undefined;
    try {
      capacityFixture = await createLeasedTask(commandBoundary);
      await commandBoundary.query(
        `INSERT INTO sources (id, content_package_id, owner_user_id, source_type, role, label, capture_type, created_at)
         VALUES ($1, $2, $3, 'pasted_text', 'primary', NULL, 'pasted_text', now())`,
        [randomUUID(), capacityFixture.packageId, capacityFixture.ownerUserId],
      );
      const outcome = await resultBoundary.repository.recordResult(successCommand(capacityFixture));
      expect(outcome.kind).toBe('recorded');
      if (outcome.kind === 'recorded') {
        expect(outcome.result.recordedCategory).toBe('source_role_limit');
        expect(outcome.result.safeCode).toBe('SOURCE_ROLE_LIMIT');
        expect(outcome.result.sourceId).toBeNull();
      }
    } finally {
      if (capacityFixture) await cleanup(commandBoundary, capacityFixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('serializes a concurrent Package archive before Result promotion', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    const lockClient = await resultBoundary.pool.connect();
    let recording: ReturnType<UrlCaptureResultRepository['recordResult']> | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      await lockClient.query('BEGIN');
      await lockClient.query('SELECT id FROM content_packages WHERE id = $1 FOR UPDATE', [fixture.packageId]);
      await lockClient.query(
        `UPDATE content_packages
         SET lifecycle = 'archived', archived_at = now(), updated_at = now()
         WHERE id = $1`,
        [fixture.packageId],
      );

      recording = resultBoundary.repository.recordResult(successCommand(fixture));
      await waitForResultPackageLock(commandBoundary);
      await lockClient.query('COMMIT');

      const outcome = await recording;
      expect(outcome.kind).toBe('recorded');
      if (outcome.kind === 'recorded') {
        expect(outcome.result).toMatchObject({
          recordedOutcome: 'failed',
          recordedCategory: 'package_archived',
          safeCode: 'PACKAGE_ARCHIVED',
          sourceId: null,
        });
      }
    } finally {
      await lockClient.query('ROLLBACK').catch(() => undefined);
      lockClient.release();
      if (recording) await recording.catch(() => undefined);
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('serializes a concurrent Source capacity fill before Result promotion', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    const lockClient = await resultBoundary.pool.connect();
    let recording: ReturnType<UrlCaptureResultRepository['recordResult']> | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      await lockClient.query('BEGIN');
      await lockClient.query('SELECT id FROM content_packages WHERE id = $1 FOR UPDATE', [fixture.packageId]);
      await lockClient.query(
        `INSERT INTO sources
           (id, content_package_id, owner_user_id, source_type, role, label, capture_type, created_at)
         VALUES ($1, $2, $3, 'pasted_text', 'primary', NULL, 'pasted_text', now())`,
        [randomUUID(), fixture.packageId, fixture.ownerUserId],
      );

      recording = resultBoundary.repository.recordResult(successCommand(fixture));
      await waitForResultPackageLock(commandBoundary);
      await lockClient.query('COMMIT');

      const outcome = await recording;
      expect(outcome.kind).toBe('recorded');
      if (outcome.kind === 'recorded') {
        expect(outcome.result).toMatchObject({
          recordedOutcome: 'failed',
          recordedCategory: 'source_role_limit',
          safeCode: 'SOURCE_ROLE_LIMIT',
          sourceId: null,
        });
      }
      expect(
        (await commandBoundary.query('SELECT id FROM sources WHERE content_package_id = $1', [fixture.packageId]))
          .length,
      ).toBe(1);
    } finally {
      await lockClient.query('ROLLBACK').catch(() => undefined);
      lockClient.release();
      if (recording) await recording.catch(() => undefined);
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('returns duplicate=true for an exact replay and unavailable for a mismatched replay', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const command = successCommand(fixture);
      const first = await resultBoundary.repository.recordResult(command);
      expect(first.kind).toBe('recorded');

      // Exact replay (same attempt/claim/payload) returns duplicate with the same projection.
      const replay = await resultBoundary.repository.recordResult({ ...command, resultId: randomUUID() });
      expect(replay.kind).toBe('duplicate');
      if (replay.kind === 'duplicate' && first.kind === 'recorded') {
        expect(replay.result).toEqual(first.result);
      }

      // The task is terminal and the lease is cleared; replay still returns.
      const [task] = await commandBoundary.query<{ state: string }>('SELECT state FROM workflow_tasks WHERE id = $1', [
        fixture.taskId,
      ]);
      expect(task?.state).toBe('succeeded');

      // Exactly one result row and one success event after the replay.
      expect(
        (await commandBoundary.query('SELECT id FROM url_capture_results WHERE task_id = $1', [fixture.taskId])).length,
      ).toBe(1);
      expect(
        (
          await commandBoundary.query(
            "SELECT id FROM workflow_events WHERE content_package_id = $1 AND event_type = 'url_capture_succeeded.v1'",
            [fixture.packageId],
          )
        ).length,
      ).toBe(1);

      // Mismatched payload replay has no side effect.
      const mismatch = await resultBoundary.repository.recordResult({
        ...command,
        submittedPayloadSha256: createHash('sha256').update('different').digest('hex'),
      });
      expect(mismatch.kind).toBe('unavailable');
      expect(
        (await commandBoundary.query('SELECT id FROM url_capture_results WHERE task_id = $1', [fixture.taskId])).length,
      ).toBe(1);
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('rejects wrong claim, wrong attempt, and expired first submissions without side effects', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);

      const wrongClaim = await resultBoundary.repository.recordResult(
        successCommand(fixture, { claimHash: 'f'.repeat(64) }),
      );
      expect(wrongClaim.kind).toBe('unavailable');

      const wrongAttempt = await resultBoundary.repository.recordResult(
        successCommand(fixture, { attemptNumber: fixture.attemptNumber + 1 }),
      );
      expect(wrongAttempt.kind).toBe('unavailable');

      // Expire the lease, then a first submission must fail.
      await commandBoundary.query(
        `UPDATE workflow_tasks SET lease_started_at = $2, lease_heartbeat_at = $2, lease_expires_at = $3, updated_at = now() WHERE id = $1`,
        [fixture.taskId, new Date('2020-01-01T00:00:00.000Z'), new Date('2020-01-01T00:00:01.000Z')],
      );
      const expired = await resultBoundary.repository.recordResult(successCommand(fixture));
      expect(expired.kind).toBe('unavailable');

      expect(
        (await commandBoundary.query('SELECT id FROM url_capture_results WHERE task_id = $1', [fixture.taskId])).length,
      ).toBe(0);
      expect(
        (await commandBoundary.query('SELECT id FROM sources WHERE content_package_id = $1', [fixture.packageId]))
          .length,
      ).toBe(0);
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('selects exactly one winner across two concurrent first submissions', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const first = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    const second = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const base = successCommand(fixture);
      const outcomes = await Promise.allSettled([
        first.repository.recordResult({ ...base, resultId: randomUUID(), eventId: randomUUID() as never }),
        second.repository.recordResult({ ...base, resultId: randomUUID(), eventId: randomUUID() as never }),
      ]);
      const results = outcomes
        .map((outcome) => (outcome.status === 'fulfilled' ? outcome.value : undefined))
        .filter((value): value is NonNullable<typeof value> => value !== undefined);
      // At most one first effect: exactly one writer records the terminal
      // Result; the serialized loser replays it (duplicate) or is fenced out.
      expect(results.filter((result) => result.kind === 'recorded')).toHaveLength(1);
      for (const result of results) {
        expect(['recorded', 'duplicate', 'unavailable']).toContain(result.kind);
      }
      expect(
        (await commandBoundary.query('SELECT id FROM url_capture_results WHERE task_id = $1', [fixture.taskId])).length,
      ).toBe(1);
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await first.close();
      await second.close();
    }
  });
});

describe('M2-SRC-003 Object Storage read ordering (service over the real repository)', () => {
  function countingObjectStore(integrity: boolean): ObjectStore & { reads: string[]; deletes: string[] } {
    const reads: string[] = [];
    const deletes: string[] = [];
    return {
      reads,
      deletes,
      putImmutable: async (): Promise<StoredObject> => {
        throw new Error('M2-SRC-003 does not write fetcher objects');
      },
      readForIntegrity: async (expected: StoredObject) => {
        reads.push(expected.storageKey);
        return integrity;
      },
      deleteForCompensation: async (storageKey: string) => {
        deletes.push(storageKey);
      },
    };
  }

  function serviceFor(objectStore: ObjectStore, repository: never): FetcherResultService {
    return new FetcherResultService(
      repository,
      objectStore,
      {
        generateResultId: () => randomUUID(),
        generateWorkingCopyId: () => randomUUID(),
        generateSourceReviewNodeId: () => randomUUID() as never,
        generateResultEventId: () => randomUUID() as never,
      },
      { now: () => new Date() },
    );
  }

  function successBodyFor(taskId: string, attemptNumber: number): Record<string, unknown> {
    const snapshotId = randomUUID();
    return {
      resultVersion: 'fetcher-result/v1',
      attemptNumber,
      outcome: 'succeeded',
      snapshot: {
        snapshotId,
        storageKey: buildUrlCaptureStorageKey({ taskId, attemptNumber, snapshotId }),
        sha256: 'a'.repeat(64),
        byteSize: 1234,
        contentType: 'text/html',
        contentEncoding: 'identity',
      },
      capture: {
        finalUrl: 'https://example.com/final',
        redirects: [],
        responseStatus: 200,
        encodedByteSize: 1234,
        decodedByteSize: 5678,
      },
      candidate: { schemaVersion: 'source/normalized/v1', text: 'reviewable normalized text' },
    };
  }

  it('an eligible first success reads the object exactly once', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const store = countingObjectStore(true);
      const service = serviceFor(store, resultBoundary.repository as never);
      const outcome = await service.submitResult(
        fixture.taskId as never,
        fixture.claim,
        successBodyFor(fixture.taskId, fixture.attemptNumber),
      );
      expect(outcome.taskState).toBe('succeeded');
      expect(outcome.duplicate).toBe(false);
      expect(store.reads).toHaveLength(1);
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('wrong claim, wrong attempt, and unknown task do not read the object', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const store = countingObjectStore(true);
      const service = serviceFor(store, resultBoundary.repository as never);

      await expect(
        service.submitResult(
          fixture.taskId as never,
          'B'.repeat(43),
          successBodyFor(fixture.taskId, fixture.attemptNumber),
        ),
      ).rejects.toEqual(new FetcherGatewayApplicationError('FETCHER_RESULT_UNAVAILABLE'));

      await expect(
        service.submitResult(
          fixture.taskId as never,
          fixture.claim,
          successBodyFor(fixture.taskId, fixture.attemptNumber + 1),
        ),
      ).rejects.toEqual(new FetcherGatewayApplicationError('FETCHER_RESULT_UNAVAILABLE'));

      const unknownTaskId = randomUUID();
      await expect(
        service.submitResult(
          unknownTaskId as never,
          fixture.claim,
          successBodyFor(unknownTaskId, fixture.attemptNumber),
        ),
      ).rejects.toEqual(new FetcherGatewayApplicationError('FETCHER_RESULT_UNAVAILABLE'));

      expect(store.reads).toHaveLength(0);
      expect(store.deletes).toHaveLength(0);
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('an expired lease and a non-ready node do not read the object', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const store = countingObjectStore(true);
      const service = serviceFor(store, resultBoundary.repository as never);

      // Expire the lease.
      await commandBoundary.query(
        `UPDATE workflow_tasks SET lease_started_at = $2, lease_heartbeat_at = $2, lease_expires_at = $3, updated_at = now() WHERE id = $1`,
        [fixture.taskId, new Date('2020-01-01T00:00:00.000Z'), new Date('2020-01-01T00:00:01.000Z')],
      );
      await expect(
        service.submitResult(
          fixture.taskId as never,
          fixture.claim,
          successBodyFor(fixture.taskId, fixture.attemptNumber),
        ),
      ).rejects.toEqual(new FetcherGatewayApplicationError('FETCHER_RESULT_UNAVAILABLE'));

      // Restore lease, then make the node non-ready.
      await commandBoundary.query(
        `UPDATE workflow_tasks SET lease_started_at = now(), lease_heartbeat_at = now(), lease_expires_at = now() + interval '1 hour', updated_at = now() WHERE id = $1`,
        [fixture.taskId],
      );
      await commandBoundary.query(
        `UPDATE workflow_nodes SET state = 'running', updated_at = now() WHERE id = (SELECT workflow_node_id FROM workflow_tasks WHERE id = $1)`,
        [fixture.taskId],
      );
      await expect(
        service.submitResult(
          fixture.taskId as never,
          fixture.claim,
          successBodyFor(fixture.taskId, fixture.attemptNumber),
        ),
      ).rejects.toEqual(new FetcherGatewayApplicationError('FETCHER_RESULT_UNAVAILABLE'));

      expect(store.reads).toHaveLength(0);
      expect(store.deletes).toHaveLength(0);
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('an exact replay and a mismatched replay do not read the object', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const store = countingObjectStore(true);
      const service = serviceFor(store, resultBoundary.repository as never);
      const body = successBodyFor(fixture.taskId, fixture.attemptNumber);

      const first = await service.submitResult(fixture.taskId as never, fixture.claim, body);
      expect(first.taskState).toBe('succeeded');
      expect(first.duplicate).toBe(false);
      expect(store.reads).toHaveLength(1);

      // Exact replay: same claim/attempt/payload -> duplicate, no additional read.
      const replay = await service.submitResult(fixture.taskId as never, fixture.claim, body);
      expect(replay.duplicate).toBe(true);
      expect(store.reads).toHaveLength(1);

      // Mismatched replay (different payload): unavailable, no additional read.
      const altered = successBodyFor(fixture.taskId, fixture.attemptNumber);
      (altered.candidate as Record<string, unknown>).text = 'a different reviewable text';
      await expect(service.submitResult(fixture.taskId as never, fixture.claim, altered)).rejects.toEqual(
        new FetcherGatewayApplicationError('FETCHER_RESULT_UNAVAILABLE'),
      );
      expect(store.reads).toHaveLength(1);
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('a Fetcher-reported failure never reads the object', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const store = countingObjectStore(true);
      const service = serviceFor(store, resultBoundary.repository as never);
      const body = {
        resultVersion: 'fetcher-result/v1',
        attemptNumber: fixture.attemptNumber,
        outcome: 'failed',
        category: 'fetch_failed',
        code: 'FETCH_FAILED',
      };
      const outcome = await service.submitResult(fixture.taskId as never, fixture.claim, body);
      expect(outcome.taskState).toBe('failed');
      expect(outcome.resultCategory).toBe('fetch_failed');
      expect(store.reads).toHaveLength(0);
      expect(store.deletes).toHaveLength(0);
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });
});

const RESULT_INSERT_COLUMNS =
  'id, task_id, url_capture_request_id, source_reference_id, content_package_id, owner_user_id, attempt_number, claim_hash, result_version, submitted_payload_sha256, submitted_outcome, submitted_category, recorded_outcome, recorded_category, safe_code, source_id, snapshot_id, success_evidence, accepted_at';

async function tryInsertResult(
  commandBoundary: UrlCaptureRepositoryTestBoundary,
  v: Record<string, unknown>,
): Promise<{ ok: boolean; constraint?: string }> {
  try {
    await commandBoundary.query(
      `INSERT INTO url_capture_results (${RESULT_INSERT_COLUMNS})
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18::jsonb, now())`,
      [
        v.id,
        v.taskId,
        v.requestId,
        v.sourceReferenceId,
        v.packageId,
        v.ownerUserId,
        v.attemptNumber,
        v.claimHash,
        v.resultVersion,
        v.payloadSha,
        v.submittedOutcome,
        v.submittedCategory,
        v.recordedOutcome,
        v.recordedCategory,
        v.safeCode,
        v.sourceId,
        v.snapshotId,
        v.evidenceJson,
      ],
    );
    return { ok: true };
  } catch (error) {
    const err = error as { constraint?: string; cause?: { constraint?: string } };
    const constraint = err.constraint ?? err.cause?.constraint;
    return constraint === undefined ? { ok: false } : { ok: false, constraint };
  }
}

function validEvidenceJson(taskId: string, attemptNumber: number, snapshotId: string): string {
  return JSON.stringify({
    snapshot: {
      snapshotId,
      storageKey: buildUrlCaptureStorageKey({ taskId, attemptNumber, snapshotId }),
      sha256: 'a'.repeat(64),
      byteSize: 1234,
      contentType: 'text/html',
      contentEncoding: 'identity',
    },
    capture: {
      finalUrl: 'https://example.com/final',
      redirects: [],
      responseStatus: 200,
      encodedByteSize: 1234,
      decodedByteSize: 5678,
    },
    candidate: { schemaVersion: 'source/normalized/v1', text: 'reviewable normalized text' },
  });
}

function mutateEvidence(
  taskId: string,
  attemptNumber: number,
  mutate: (evidence: Record<string, unknown>) => void,
): string {
  const snapshotId = randomUUID();
  const evidence = JSON.parse(validEvidenceJson(taskId, attemptNumber, snapshotId)) as Record<string, unknown>;
  mutate(evidence);
  return JSON.stringify(evidence);
}

describe('M2-SRC-003 url_capture_results database constraints (direct SQL)', () => {
  async function setup() {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const fixture = await createLeasedTask(commandBoundary);
    const [requestRow] = await commandBoundary.query<{ url_capture_request_id: string }>(
      'SELECT url_capture_request_id FROM workflow_tasks WHERE id = $1',
      [fixture.taskId],
    );
    const requestId = requestRow?.url_capture_request_id ?? '';
    const snapshotId = randomUUID();
    const baseSuccess: Record<string, unknown> = {
      id: randomUUID(),
      taskId: fixture.taskId,
      requestId,
      sourceReferenceId: fixture.sourceReferenceId,
      packageId: fixture.packageId,
      ownerUserId: fixture.ownerUserId,
      attemptNumber: fixture.attemptNumber,
      claimHash: fixture.claimHash,
      resultVersion: 'fetcher-result/v1',
      payloadSha: 'a'.repeat(64),
      submittedOutcome: 'succeeded',
      submittedCategory: null,
      recordedOutcome: 'succeeded',
      recordedCategory: null,
      safeCode: null,
      sourceId: fixture.sourceReferenceId,
      snapshotId,
      evidenceJson: validEvidenceJson(fixture.taskId, fixture.attemptNumber, snapshotId),
    };
    const baseFailure: Record<string, unknown> = {
      ...baseSuccess,
      id: randomUUID(),
      submittedOutcome: 'failed',
      submittedCategory: 'fetch_failed',
      recordedOutcome: 'failed',
      recordedCategory: 'fetch_failed',
      safeCode: 'FETCH_FAILED',
      sourceId: null,
      snapshotId: null,
      evidenceJson: null,
    };
    return { commandBoundary, fixture, baseSuccess, baseFailure };
  }

  it('accepts a valid success row and a valid failure row on distinct tasks', async () => {
    const { commandBoundary, fixture, baseSuccess } = await setup();
    const fixture2 = await createLeasedTask(commandBoundary);
    try {
      expect((await tryInsertResult(commandBoundary, baseSuccess)).ok).toBe(true);

      const [requestRow2] = await commandBoundary.query<{ url_capture_request_id: string }>(
        'SELECT url_capture_request_id FROM workflow_tasks WHERE id = $1',
        [fixture2.taskId],
      );
      const validFailure: Record<string, unknown> = {
        id: randomUUID(),
        taskId: fixture2.taskId,
        requestId: requestRow2?.url_capture_request_id ?? '',
        sourceReferenceId: fixture2.sourceReferenceId,
        packageId: fixture2.packageId,
        ownerUserId: fixture2.ownerUserId,
        attemptNumber: fixture2.attemptNumber,
        claimHash: fixture2.claimHash,
        resultVersion: 'fetcher-result/v1',
        payloadSha: 'a'.repeat(64),
        submittedOutcome: 'failed',
        submittedCategory: 'fetch_failed',
        recordedOutcome: 'failed',
        recordedCategory: 'fetch_failed',
        safeCode: 'FETCH_FAILED',
        sourceId: null,
        snapshotId: null,
        evidenceJson: null,
      };
      expect((await tryInsertResult(commandBoundary, validFailure)).ok).toBe(true);
    } finally {
      await cleanup(commandBoundary, fixture.packageId);
      await cleanup(commandBoundary, fixture2.packageId);
      await commandBoundary.close();
    }
  });

  it('rejects cross-bound Task/Request and Request/Reference Result rows', async () => {
    const { commandBoundary, fixture, baseFailure } = await setup();
    try {
      const [task] = await commandBoundary.query<{ workflow_instance_id: string }>(
        'SELECT workflow_instance_id FROM workflow_tasks WHERE id = $1',
        [fixture.taskId],
      );
      const alternateNodeId = randomUUID();
      const alternateReferenceId = randomUUID();
      const alternateRequestId = randomUUID();
      await commandBoundary.query(
        `INSERT INTO workflow_nodes
           (id, workflow_instance_id, content_package_id, owner_user_id, template_id, template_version,
            template_node_key, state, revision, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'content-package-dual-output', 'v1',
                 'source_review', 'awaiting_human', 1, now(), now())`,
        [alternateNodeId, task?.workflow_instance_id, fixture.packageId, fixture.ownerUserId],
      );
      await commandBoundary.query(
        `INSERT INTO url_source_references
           (id, content_package_id, owner_user_id, role, submitted_url, created_at)
         VALUES ($1, $2, $3, 'supporting', 'https://example.com/alternate', now())`,
        [alternateReferenceId, fixture.packageId, fixture.ownerUserId],
      );
      await commandBoundary.query(
        `INSERT INTO url_capture_requests
           (id, source_reference_id, workflow_instance_id, workflow_node_id, content_package_id, owner_user_id,
            expected_package_revision, command_kind, idempotency_key, request_fingerprint, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 1, 'url_capture_request', $7, $8, now())`,
        [
          alternateRequestId,
          alternateReferenceId,
          task?.workflow_instance_id,
          alternateNodeId,
          fixture.packageId,
          fixture.ownerUserId,
          randomUUID().replaceAll('-', '').slice(0, 16),
          'b'.repeat(64),
        ],
      );

      const taskRequestMismatch = await tryInsertResult(commandBoundary, {
        ...baseFailure,
        id: randomUUID(),
        requestId: alternateRequestId,
        sourceReferenceId: alternateReferenceId,
      });
      expect(taskRequestMismatch).toEqual({ ok: false, constraint: 'url_capture_results_task_binding_fk' });

      const requestReferenceMismatch = await tryInsertResult(commandBoundary, {
        ...baseFailure,
        id: randomUUID(),
        sourceReferenceId: alternateReferenceId,
      });
      expect(requestReferenceMismatch).toEqual({ ok: false, constraint: 'url_capture_results_request_binding_fk' });
    } finally {
      await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
    }
  });

  it('rejects category/code mismatches through the exact mapping check', async () => {
    const { commandBoundary, fixture, baseFailure } = await setup();
    try {
      const fetchFailedWithTimeout = await tryInsertResult(commandBoundary, {
        ...baseFailure,
        recordedCategory: 'fetch_failed',
        safeCode: 'TIMEOUT',
      });
      expect(fetchFailedWithTimeout.ok).toBe(false);
      expect(fetchFailedWithTimeout.constraint).toBe('url_capture_results_category_code_mapping_check');

      const timeoutWithFetchFailed = await tryInsertResult(commandBoundary, {
        ...baseFailure,
        submittedCategory: 'timeout',
        recordedCategory: 'timeout',
        safeCode: 'FETCH_FAILED',
      });
      expect(timeoutWithFetchFailed.ok).toBe(false);
      expect(timeoutWithFetchFailed.constraint).toBe('url_capture_results_category_code_mapping_check');
    } finally {
      await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
    }
  });

  it('rejects a submitted failure recorded under a different category', async () => {
    const { commandBoundary, fixture, baseFailure } = await setup();
    try {
      const result = await tryInsertResult(commandBoundary, {
        ...baseFailure,
        submittedCategory: 'fetch_failed',
        recordedCategory: 'timeout',
        safeCode: 'TIMEOUT',
      });
      expect(result.ok).toBe(false);
      expect(result.constraint).toBe('url_capture_results_submission_classification_check');
    } finally {
      await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
    }
  });

  it('rejects a submitted success recorded as a Fetcher-supplied failure', async () => {
    const { commandBoundary, fixture, baseSuccess } = await setup();
    try {
      const result = await tryInsertResult(commandBoundary, {
        ...baseSuccess,
        recordedOutcome: 'failed',
        recordedCategory: 'fetch_failed',
        safeCode: 'FETCH_FAILED',
        sourceId: null,
        snapshotId: null,
        evidenceJson: null,
      });
      expect(result.ok).toBe(false);
      expect(result.constraint).toBe('url_capture_results_submission_classification_check');
    } finally {
      await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
    }
  });

  it('rejects malformed JSONB evidence value types', async () => {
    const { commandBoundary, fixture } = await setup();
    try {
      const cases: Array<(taskId: string, attempt: number) => string> = [
        (taskId, attempt) =>
          mutateEvidence(taskId, attempt, (e) => ((e.snapshot as Record<string, unknown>).snapshotId = 123)),
        (taskId, attempt) =>
          mutateEvidence(taskId, attempt, (e) => ((e.snapshot as Record<string, unknown>).byteSize = '1234')),
        (taskId, attempt) =>
          mutateEvidence(taskId, attempt, (e) => ((e.capture as Record<string, unknown>).redirects = {})),
        (taskId, attempt) =>
          mutateEvidence(taskId, attempt, (e) => ((e.capture as Record<string, unknown>).responseStatus = '200')),
        (taskId, attempt) =>
          mutateEvidence(taskId, attempt, (e) => ((e.candidate as Record<string, unknown>).text = 123)),
      ];
      for (const build of cases) {
        const snapshotId = randomUUID();
        const evidenceJson = build(fixture.taskId, fixture.attemptNumber);
        const result = await tryInsertResult(commandBoundary, {
          id: randomUUID(),
          taskId: fixture.taskId,
          requestId: (
            await commandBoundary.query<{ url_capture_request_id: string }>(
              'SELECT url_capture_request_id FROM workflow_tasks WHERE id = $1',
              [fixture.taskId],
            )
          )[0]?.url_capture_request_id,
          sourceReferenceId: fixture.sourceReferenceId,
          packageId: fixture.packageId,
          ownerUserId: fixture.ownerUserId,
          attemptNumber: fixture.attemptNumber,
          claimHash: fixture.claimHash,
          resultVersion: 'fetcher-result/v1',
          payloadSha: 'a'.repeat(64),
          submittedOutcome: 'succeeded',
          submittedCategory: null,
          recordedOutcome: 'succeeded',
          recordedCategory: null,
          safeCode: null,
          sourceId: fixture.sourceReferenceId,
          snapshotId,
          evidenceJson,
        });
        expect(result.ok).toBe(false);
        expect(result.constraint).toBeDefined();
      }
    } finally {
      await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
    }
  });

  it('rejects snapshot binding mismatch, missing nested key, and extra nested key', async () => {
    const { commandBoundary, fixture, baseSuccess } = await setup();
    try {
      // snapshot_id column differs from evidence.snapshot.snapshotId.
      const bindingMismatch = await tryInsertResult(commandBoundary, {
        ...baseSuccess,
        id: randomUUID(),
        snapshotId: randomUUID(),
      });
      expect(bindingMismatch.ok).toBe(false);
      expect(bindingMismatch.constraint).toBe('url_capture_results_evidence_snapshot_binding_check');

      // Missing nested key.
      const snapshotIdA = randomUUID();
      const missingKeyEvidence = JSON.stringify({
        snapshot: {
          snapshotId: snapshotIdA,
          storageKey: buildUrlCaptureStorageKey({
            taskId: fixture.taskId,
            attemptNumber: fixture.attemptNumber,
            snapshotId: snapshotIdA,
          }),
          byteSize: 1234,
          contentType: 'text/html',
          contentEncoding: 'identity',
        },
        capture: {
          finalUrl: 'https://example.com/final',
          redirects: [],
          responseStatus: 200,
          encodedByteSize: 1234,
          decodedByteSize: 5678,
        },
        candidate: { schemaVersion: 'source/normalized/v1', text: 'reviewable normalized text' },
      });
      const missingKey = await tryInsertResult(commandBoundary, {
        ...baseSuccess,
        id: randomUUID(),
        snapshotId: snapshotIdA,
        evidenceJson: missingKeyEvidence,
      });
      expect(missingKey.ok).toBe(false);
      expect(missingKey.constraint).toBe('url_capture_results_evidence_shape_check');

      // Extra nested key.
      const extraKeyEvidence = mutateEvidence(
        fixture.taskId,
        fixture.attemptNumber,
        (e) => ((e.snapshot as Record<string, unknown>).extra = 'x'),
      );
      const parsedExtra = JSON.parse(extraKeyEvidence) as { snapshot: { snapshotId: string } };
      const extraKey = await tryInsertResult(commandBoundary, {
        ...baseSuccess,
        id: randomUUID(),
        snapshotId: parsedExtra.snapshot.snapshotId,
        evidenceJson: extraKeyEvidence,
      });
      expect(extraKey.ok).toBe(false);
      expect(extraKey.constraint).toBe('url_capture_results_evidence_shape_check');
    } finally {
      await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
    }
  });

  async function insertMutatedEvidence(
    commandBoundary: UrlCaptureRepositoryTestBoundary,
    baseSuccess: Record<string, unknown>,
    fixture: LeasedTask,
    mutate: (evidence: Record<string, unknown>) => void,
  ): Promise<{ ok: boolean; constraint?: string }> {
    const evidenceJson = mutateEvidence(fixture.taskId, fixture.attemptNumber, mutate);
    const parsed = JSON.parse(evidenceJson) as { snapshot: { snapshotId: string } };
    return tryInsertResult(commandBoundary, {
      ...baseSuccess,
      id: randomUUID(),
      snapshotId: parsed.snapshot.snapshotId,
      evidenceJson,
    });
  }

  it('rejects a submitted failure whose submitted_category is NULL through the closed classification check', async () => {
    const { commandBoundary, fixture, baseFailure } = await setup();
    try {
      const result = await tryInsertResult(commandBoundary, {
        ...baseFailure,
        submittedCategory: null,
        recordedCategory: 'fetch_failed',
        safeCode: 'FETCH_FAILED',
      });
      expect(result.ok).toBe(false);
      expect(result.constraint).toBe('url_capture_results_submission_classification_check');
    } finally {
      await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
    }
  });

  it('rejects a success submission carrying a Fetcher category', async () => {
    const { commandBoundary, fixture, baseSuccess } = await setup();
    try {
      const result = await tryInsertResult(commandBoundary, {
        ...baseSuccess,
        submittedCategory: 'fetch_failed',
      });
      expect(result.ok).toBe(false);
      expect(result.constraint).toBe('url_capture_results_submission_classification_check');
    } finally {
      await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
    }
  });

  it('rejects a failure with a null recorded_category', async () => {
    const { commandBoundary, fixture, baseFailure } = await setup();
    try {
      const result = await tryInsertResult(commandBoundary, {
        ...baseFailure,
        recordedCategory: null,
      });
      expect(result.ok).toBe(false);
      expect(result.constraint).toBeDefined();
    } finally {
      await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
    }
  });

  it('rejects a failure with a null safe_code', async () => {
    const { commandBoundary, fixture, baseFailure } = await setup();
    try {
      const result = await tryInsertResult(commandBoundary, {
        ...baseFailure,
        safeCode: null,
      });
      expect(result.ok).toBe(false);
      expect(result.constraint).toBeDefined();
    } finally {
      await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
    }
  });

  it('rejects fractional snapshot byteSize / capture encodedByteSize through the integer check', async () => {
    const { commandBoundary, fixture, baseSuccess } = await setup();
    try {
      const result = await insertMutatedEvidence(commandBoundary, baseSuccess, fixture, (e) => {
        (e.snapshot as Record<string, unknown>).byteSize = 1.5;
        (e.capture as Record<string, unknown>).encodedByteSize = 1.5;
      });
      expect(result.ok).toBe(false);
      expect(result.constraint).toBe('url_capture_results_evidence_integer_check');
    } finally {
      await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
    }
  });

  it('rejects a fractional capture decodedByteSize through the integer check', async () => {
    const { commandBoundary, fixture, baseSuccess } = await setup();
    try {
      const result = await insertMutatedEvidence(commandBoundary, baseSuccess, fixture, (e) => {
        (e.capture as Record<string, unknown>).decodedByteSize = 2.5;
      });
      expect(result.ok).toBe(false);
      expect(result.constraint).toBe('url_capture_results_evidence_integer_check');
    } finally {
      await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
    }
  });

  it('rejects a fractional capture responseStatus', async () => {
    const { commandBoundary, fixture, baseSuccess } = await setup();
    try {
      const result = await insertMutatedEvidence(commandBoundary, baseSuccess, fixture, (e) => {
        (e.capture as Record<string, unknown>).responseStatus = 200.5;
      });
      expect(result.ok).toBe(false);
      expect(result.constraint).toBeDefined();
    } finally {
      await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
    }
  });

  it('rejects malformed redirect evidence through the exact redirect shape check', async () => {
    const { commandBoundary, fixture, baseSuccess } = await setup();
    try {
      const cases: Array<(evidence: Record<string, unknown>) => void> = [
        (e) => ((e.capture as Record<string, unknown>).redirects = [1]),
        (e) => ((e.capture as Record<string, unknown>).redirects = [{ status: 200, url: 'https://a.example/' }]),
        (e) => ((e.capture as Record<string, unknown>).redirects = [{ status: 301, url: 123 }]),
        (e) => ((e.capture as Record<string, unknown>).redirects = [{ status: 301.5, url: 'https://a.example/' }]),
        (e) =>
          ((e.capture as Record<string, unknown>).redirects = [{ status: 301, url: 'https://a.example/', extra: 'x' }]),
        (e) => ((e.capture as Record<string, unknown>).redirects = [{ url: 'https://a.example/' }]),
      ];
      for (const mutate of cases) {
        const result = await insertMutatedEvidence(commandBoundary, baseSuccess, fixture, mutate);
        expect(result.ok).toBe(false);
        expect(result.constraint).toBe('url_capture_results_evidence_redirects_shape_check');
      }
    } finally {
      await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
    }
  });

  it('accepts a valid multi-redirect evidence', async () => {
    const { commandBoundary, fixture, baseSuccess } = await setup();
    try {
      const result = await insertMutatedEvidence(commandBoundary, baseSuccess, fixture, (e) => {
        (e.capture as Record<string, unknown>).redirects = [
          { status: 301, url: 'https://a.example/one' },
          { status: 302, url: 'https://b.example/two' },
        ];
      });
      expect(result.ok).toBe(true);
    } finally {
      await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
    }
  });
});

describe('M2-SRC-003 reconciliation transaction cleanup', () => {
  it('returns UNKNOWN on an injected mid-transaction failure and leaves the pool usable', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const faultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl(), {
      reconcileAt: (point) => {
        if (point === 'resultQuery') throw new Error('injected-reconcile-failure');
      },
    });
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const reconciliation = await faultBoundary.repository.reconcileResult({
        taskId: fixture.taskId as never,
        claimHash: fixture.claimHash,
        attemptNumber: fixture.attemptNumber,
        submittedPayloadSha256: 'a'.repeat(64),
      });
      expect(reconciliation.outcome).toBe('UNKNOWN');

      // The same pool must run a fresh query without open-transaction residue.
      const rows = await faultBoundary.query<{ one: number }>('SELECT 1 AS one');
      expect(rows[0]?.one).toBe(1);

      // A subsequent legal Result operation on the same boundary succeeds.
      const outcome = await faultBoundary.repository.recordResult(successCommand(fixture));
      expect(outcome.kind).toBe('recorded');
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await faultBoundary.close();
    }
  });
});

describe('M2-SRC-003 guarded transition rollback', () => {
  it('rolls back the entire transaction when the guarded node transition is not applied', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const faultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl(), {
      beforeTransitions: async (exec, taskId) => {
        await exec(
          `UPDATE workflow_nodes SET state = 'running', updated_at = now()
           WHERE id = (SELECT workflow_node_id FROM workflow_tasks WHERE id = $1) AND template_node_key = 'source_capture'`,
          [taskId],
        );
      },
    });
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      await expect(faultBoundary.repository.recordResult(successCommand(fixture))).rejects.toBeDefined();

      // No Result, Source, or Event was persisted; the Task remains leased and the node returns to ready.
      expect(
        (await commandBoundary.query('SELECT id FROM url_capture_results WHERE task_id = $1', [fixture.taskId])).length,
      ).toBe(0);
      expect(
        (await commandBoundary.query('SELECT id FROM sources WHERE content_package_id = $1', [fixture.packageId]))
          .length,
      ).toBe(0);
      const [task] = await commandBoundary.query<{ state: string }>('SELECT state FROM workflow_tasks WHERE id = $1', [
        fixture.taskId,
      ]);
      expect(task?.state).toBe('leased');
      const [node] = await commandBoundary.query<{ state: string }>(
        `SELECT state FROM workflow_nodes WHERE id = (SELECT workflow_node_id FROM workflow_tasks WHERE id = $1)`,
        [fixture.taskId],
      );
      expect(node?.state).toBe('ready');
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await faultBoundary.close();
    }
  });
});

describe('M2-SRC-003 Source compatibility through the existing Source repository', () => {
  it('reads and lists a public_url Source after a recorded success', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    const sourceBoundary = createSourceRepositoryTestBoundary(databaseUrl(), { hit: async () => {} });
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const outcome = await resultBoundary.repository.recordResult(successCommand(fixture));
      expect(outcome.kind).toBe('recorded');

      const state = await sourceBoundary.repository.findByIdForPackageOwner(
        fixture.sourceReferenceId as never,
        fixture.packageId,
        fixture.ownerUserId,
      );
      expect(state).not.toBeNull();
      expect(state?.reference.sourceType).toBe('public_url');
      expect(state?.reference.captureType).toBe('public_url');
      expect(state?.reference.role).toBe('primary');
      expect(state?.workingCopy.revision).toBe(1);
      expect(state?.workingCopy.body.text).toBe('reviewable normalized text');
      expect(state?.rawSnapshot.contentType).toBe('text/html');
      expect(state?.head.latestVersionId).toBeNull();
      expect(state?.head.approvedVersionId).toBeNull();

      const list = await sourceBoundary.repository.listForPackage({
        contentPackageId: fixture.packageId,
        ownerUserId: fixture.ownerUserId,
        limit: 50,
      });
      expect(
        list.items.some((item) => item.id === fixture?.sourceReferenceId && item.sourceType === 'public_url'),
      ).toBe(true);
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
      await sourceBoundary.close();
    }
  });
});

describe('M2-SRC-003 rollback-failure connection destruction', () => {
  it('prepareResult: destroys the client when rollback fails and keeps the pool usable', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    let armed = true;
    const faultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl(), {
      prepareAt: () => {
        if (armed) throw new Error('injected-prepare-query-fault');
      },
      rollbackFault: () => {
        if (armed) throw new Error('injected-rollback-fault');
      },
    });
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const preflight = await faultBoundary.repository.prepareResult({
        taskId: fixture.taskId as never,
        claimHash: fixture.claimHash,
        attemptNumber: fixture.attemptNumber,
        submittedPayloadSha256: 'a'.repeat(64),
        acceptedAt: new Date(),
      });
      expect(preflight.kind).toBe('prepare_failed');
      // The poisoned client was destroyed, not returned to the idle pool.
      expect(faultBoundary.pool.idleCount).toBe(0);
      // The pool remains usable for a fresh query.
      const rows = await faultBoundary.query<{ one: number }>('SELECT 1 AS one');
      expect(rows[0]?.one).toBe(1);
      // A subsequent legal preflight on the same boundary succeeds.
      armed = false;
      const retry = await faultBoundary.repository.prepareResult({
        taskId: fixture.taskId as never,
        claimHash: fixture.claimHash,
        attemptNumber: fixture.attemptNumber,
        submittedPayloadSha256: 'a'.repeat(64),
        acceptedAt: new Date(),
      });
      expect(retry.kind).toBe('eligible');
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await faultBoundary.close();
    }
  });

  it('reconcileResult: destroys the client when rollback fails and keeps the pool usable', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    let armed = true;
    const faultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl(), {
      reconcileAt: (point) => {
        if (armed && point === 'resultQuery') throw new Error('injected-reconcile-query-fault');
      },
      rollbackFault: () => {
        if (armed) throw new Error('injected-rollback-fault');
      },
    });
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const reconciliation = await faultBoundary.repository.reconcileResult({
        taskId: fixture.taskId as never,
        claimHash: fixture.claimHash,
        attemptNumber: fixture.attemptNumber,
        submittedPayloadSha256: 'a'.repeat(64),
      });
      expect(reconciliation.outcome).toBe('UNKNOWN');
      expect(faultBoundary.pool.idleCount).toBe(0);
      const rows = await faultBoundary.query<{ one: number }>('SELECT 1 AS one');
      expect(rows[0]?.one).toBe(1);
      // A subsequent legal Result operation on the same boundary succeeds.
      armed = false;
      const outcome = await faultBoundary.repository.recordResult(successCommand(fixture));
      expect(outcome.kind).toBe('recorded');
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await faultBoundary.close();
    }
  });

  it('recordResult: destroys the client when rollback fails and leaves no residue', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    let armed = true;
    const faultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl(), {
      beforeTransitions: () => {
        if (armed) throw new Error('injected-transition-fault');
      },
      rollbackFault: () => {
        if (armed) throw new Error('injected-rollback-fault');
      },
    });
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      await expect(faultBoundary.repository.recordResult(successCommand(fixture))).rejects.toBeInstanceOf(
        UrlCaptureResultPersistenceError,
      );
      expect(faultBoundary.pool.idleCount).toBe(0);
      const rows = await faultBoundary.query<{ one: number }>('SELECT 1 AS one');
      expect(rows[0]?.one).toBe(1);
      // No Result or Source residue from the aborted transaction.
      expect(
        (await commandBoundary.query('SELECT id FROM url_capture_results WHERE task_id = $1', [fixture.taskId])).length,
      ).toBe(0);
      expect(
        (await commandBoundary.query('SELECT id FROM sources WHERE content_package_id = $1', [fixture.packageId]))
          .length,
      ).toBe(0);
      // A subsequent legal Result operation on the same boundary succeeds.
      armed = false;
      const outcome = await faultBoundary.repository.recordResult(successCommand(fixture));
      expect(outcome.kind).toBe('recorded');
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await faultBoundary.close();
    }
  });
});

describe('M2-SRC-003 final Lease authority over the Object Storage read window', () => {
  function blockingObjectStore(): ObjectStore & {
    reads: string[];
    readStarted: Promise<void>;
    releaseRead: (integrity: boolean) => void;
  } {
    const reads: string[] = [];
    let resolveRead: ((integrity: boolean) => void) | undefined;
    let notifyStarted: (() => void) | undefined;
    const readGate = new Promise<boolean>((resolve) => {
      resolveRead = resolve;
    });
    const readStarted = new Promise<void>((resolve) => {
      notifyStarted = resolve;
    });
    return {
      reads,
      readStarted,
      releaseRead: (integrity) => resolveRead?.(integrity),
      putImmutable: async (): Promise<StoredObject> => {
        throw new Error('M2-SRC-003 does not write fetcher objects');
      },
      readForIntegrity: async (expected: StoredObject) => {
        reads.push(expected.storageKey);
        notifyStarted?.();
        return readGate;
      },
      deleteForCompensation: async () => {},
    };
  }

  function serviceFor(objectStore: ObjectStore, repository: never): FetcherResultService {
    return new FetcherResultService(
      repository,
      objectStore,
      {
        generateResultId: () => randomUUID(),
        generateWorkingCopyId: () => randomUUID(),
        generateSourceReviewNodeId: () => randomUUID() as never,
        generateResultEventId: () => randomUUID() as never,
      },
      { now: () => new Date() },
    );
  }

  function successBodyFor(taskId: string, attemptNumber: number): Record<string, unknown> {
    const snapshotId = randomUUID();
    return {
      resultVersion: 'fetcher-result/v1',
      attemptNumber,
      outcome: 'succeeded',
      snapshot: {
        snapshotId,
        storageKey: buildUrlCaptureStorageKey({ taskId, attemptNumber, snapshotId }),
        sha256: 'a'.repeat(64),
        byteSize: 1234,
        contentType: 'text/html',
        contentEncoding: 'identity',
      },
      capture: {
        finalUrl: 'https://example.com/final',
        redirects: [],
        responseStatus: 200,
        encodedByteSize: 1234,
        decodedByteSize: 5678,
      },
      candidate: { schemaVersion: 'source/normalized/v1', text: 'reviewable normalized text' },
    };
  }

  it('rejects a result whose Lease expires during the Object Storage read', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const store = blockingObjectStore();
      const service = serviceFor(store, resultBoundary.repository as never);

      // 1. Preflight sees a valid Lease and begins the integrity read (blocked).
      const submission = service.submitResult(
        fixture.taskId as never,
        fixture.claim,
        successBodyFor(fixture.taskId, fixture.attemptNumber),
      );
      await store.readStarted;
      expect(store.reads).toHaveLength(1);

      // 2. Expire the Lease while the read is still blocked.
      await commandBoundary.query(
        `UPDATE workflow_tasks SET lease_started_at = $2, lease_heartbeat_at = $2, lease_expires_at = $3, updated_at = now() WHERE id = $1`,
        [fixture.taskId, new Date('2020-01-01T00:00:00.000Z'), new Date('2020-01-01T00:00:01.000Z')],
      );

      // 3. Release the read; the final transaction re-checks with the authoritative
      //    database time and rejects without falsely claiming success.
      store.releaseRead(true);
      await expect(submission).rejects.toEqual(new FetcherGatewayApplicationError('FETCHER_RESULT_UNAVAILABLE'));

      // 4. The object was read exactly once (it was still eligible at preflight).
      expect(store.reads).toHaveLength(1);

      // 5. No Result, Source evidence, or Event was created; the Task is not
      //    terminal and the Node remains ready. No Owner Retry is created.
      expect(
        (await commandBoundary.query('SELECT id FROM url_capture_results WHERE task_id = $1', [fixture.taskId])).length,
      ).toBe(0);
      expect(
        (await commandBoundary.query('SELECT id FROM sources WHERE content_package_id = $1', [fixture.packageId]))
          .length,
      ).toBe(0);
      expect(
        (
          await commandBoundary.query(
            `SELECT id FROM workflow_events
             WHERE content_package_id = $1 AND event_type IN ('url_capture_succeeded.v1', 'url_capture_failed.v1')`,
            [fixture.packageId],
          )
        ).length,
      ).toBe(0);
      const [task] = await commandBoundary.query<{ state: string }>('SELECT state FROM workflow_tasks WHERE id = $1', [
        fixture.taskId,
      ]);
      expect(task?.state).toBe('leased');
      const [node] = await commandBoundary.query<{ state: string }>(
        `SELECT state FROM workflow_nodes WHERE id = (SELECT workflow_node_id FROM workflow_tasks WHERE id = $1)`,
        [fixture.taskId],
      );
      expect(node?.state).toBe('ready');
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('an exact replay still bypasses the Lease check and returns duplicate=true', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const reads: string[] = [];
      const store: ObjectStore = {
        putImmutable: async (): Promise<StoredObject> => {
          throw new Error('M2-SRC-003 does not write fetcher objects');
        },
        readForIntegrity: async (expected: StoredObject) => {
          reads.push(expected.storageKey);
          return true;
        },
        deleteForCompensation: async () => {},
      };
      const service = serviceFor(store, resultBoundary.repository as never);
      const body = successBodyFor(fixture.taskId, fixture.attemptNumber);

      const first = await service.submitResult(fixture.taskId as never, fixture.claim, body);
      expect(first.taskState).toBe('succeeded');
      expect(first.duplicate).toBe(false);
      expect(reads).toHaveLength(1);

      // The recorded Result terminalized the Task and cleared the Lease, so the
      // Lease is no longer valid. An exact replay must still be answered as a
      // duplicate from the durable Result, bypassing every lease rule.
      const [terminalTask] = await commandBoundary.query<{ state: string; lease_expires_at: Date | null }>(
        `SELECT state, lease_expires_at FROM workflow_tasks WHERE id = $1`,
        [fixture.taskId],
      );
      expect(terminalTask?.state).toBe('succeeded');
      expect(terminalTask?.lease_expires_at).toBeNull();

      const replay = await service.submitResult(fixture.taskId as never, fixture.claim, body);
      expect(replay.duplicate).toBe(true);
      // The replay is answered from the durable Result; it does not re-read the object.
      expect(reads).toHaveLength(1);
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('maps a prepareResult infrastructure fault to a stable internal error, never a 409, and reads nothing', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const faultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl(), {
      prepareAt: () => {
        throw new Error('injected-prepare-fault');
      },
    });
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const store = blockingObjectStore();
      const service = serviceFor(store, faultBoundary.repository as never);
      await expect(
        service.submitResult(
          fixture.taskId as never,
          fixture.claim,
          successBodyFor(fixture.taskId, fixture.attemptNumber),
        ),
      ).rejects.toEqual(new FetcherResultInternalError('PREPARE_FAILED'));
      expect(store.reads).toHaveLength(0);
      expect(
        (await commandBoundary.query('SELECT id FROM url_capture_results WHERE task_id = $1', [fixture.taskId])).length,
      ).toBe(0);
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await faultBoundary.close();
    }
  });
});

describe('M2-SRC-003 recordResult connection-acquisition failure (NOT_COMMITTED)', () => {
  function blockingObjectStore(): ObjectStore & {
    reads: string[];
    deletes: string[];
    readStarted: Promise<void>;
    releaseRead: (integrity: boolean) => void;
  } {
    const reads: string[] = [];
    const deletes: string[] = [];
    let resolveRead: ((integrity: boolean) => void) | undefined;
    let notifyStarted: (() => void) | undefined;
    const readGate = new Promise<boolean>((resolve) => {
      resolveRead = resolve;
    });
    const readStarted = new Promise<void>((resolve) => {
      notifyStarted = resolve;
    });
    return {
      reads,
      deletes,
      readStarted,
      releaseRead: (integrity) => resolveRead?.(integrity),
      putImmutable: async (): Promise<StoredObject> => {
        throw new Error('M2-SRC-003 does not write fetcher objects');
      },
      readForIntegrity: async (expected: StoredObject) => {
        reads.push(expected.storageKey);
        notifyStarted?.();
        return readGate;
      },
      deleteForCompensation: async (storageKey: string) => {
        deletes.push(storageKey);
      },
    };
  }

  function serviceFor(objectStore: ObjectStore, repository: never): FetcherResultService {
    return new FetcherResultService(
      repository,
      objectStore,
      {
        generateResultId: () => randomUUID(),
        generateWorkingCopyId: () => randomUUID(),
        generateSourceReviewNodeId: () => randomUUID() as never,
        generateResultEventId: () => randomUUID() as never,
      },
      { now: () => new Date() },
    );
  }

  function successBodyFor(taskId: string, attemptNumber: number): Record<string, unknown> {
    const snapshotId = randomUUID();
    return {
      resultVersion: 'fetcher-result/v1',
      attemptNumber,
      outcome: 'succeeded',
      snapshot: {
        snapshotId,
        storageKey: buildUrlCaptureStorageKey({ taskId, attemptNumber, snapshotId }),
        sha256: 'a'.repeat(64),
        byteSize: 1234,
        contentType: 'text/html',
        contentEncoding: 'identity',
      },
      capture: {
        finalUrl: 'https://example.com/final',
        redirects: [],
        responseStatus: 200,
        encodedByteSize: 1234,
        decodedByteSize: 5678,
      },
      candidate: { schemaVersion: 'source/normalized/v1', text: 'reviewable normalized text' },
    };
  }

  it('compensates the object exactly once and returns a stable NOT_COMMITTED when the Result connection is unavailable', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    let poolEnded = false;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const store = blockingObjectStore();
      const service = serviceFor(store, resultBoundary.repository as never);

      // 1. Preflight is eligible and the integrity read begins (blocked).
      const submission = service.submitResult(
        fixture.taskId as never,
        fixture.claim,
        successBodyFor(fixture.taskId, fixture.attemptNumber),
      );
      await store.readStarted;
      expect(store.reads).toHaveLength(1);

      // 2. Make the Result Repository connection unavailable before recordResult
      //    acquires a client, then release the read (integrity succeeds).
      await resultBoundary.pool.end();
      poolEnded = true;
      store.releaseRead(true);

      // 3. recordResult cannot connect: it must surface NOT_COMMITTED and the
      //    service must compensate the task-scoped object exactly once.
      await expect(submission).rejects.toEqual(new FetcherResultInternalError('NOT_COMMITTED'));
      expect(store.reads).toHaveLength(1);
      expect(store.deletes).toHaveLength(1);

      // 4. Zero durable effects.
      expect(
        (await commandBoundary.query('SELECT id FROM url_capture_results WHERE task_id = $1', [fixture.taskId])).length,
      ).toBe(0);
      expect(
        (await commandBoundary.query('SELECT id FROM sources WHERE content_package_id = $1', [fixture.packageId]))
          .length,
      ).toBe(0);
      expect(
        (
          await commandBoundary.query('SELECT id FROM source_raw_snapshots WHERE owner_user_id = $1', [
            fixture.ownerUserId,
          ])
        ).length,
      ).toBe(0);
      expect(
        (
          await commandBoundary.query('SELECT id FROM source_working_copies WHERE owner_user_id = $1', [
            fixture.ownerUserId,
          ])
        ).length,
      ).toBe(0);
      expect(
        (
          await commandBoundary.query('SELECT source_id FROM source_heads WHERE owner_user_id = $1', [
            fixture.ownerUserId,
          ])
        ).length,
      ).toBe(0);
      expect(
        (
          await commandBoundary.query(
            `SELECT id FROM workflow_events
             WHERE content_package_id = $1 AND event_type IN ('url_capture_succeeded.v1', 'url_capture_failed.v1')`,
            [fixture.packageId],
          )
        ).length,
      ).toBe(0);
      const [task] = await commandBoundary.query<{ state: string }>('SELECT state FROM workflow_tasks WHERE id = $1', [
        fixture.taskId,
      ]);
      expect(task?.state).toBe('leased');
      const [node] = await commandBoundary.query<{ state: string }>(
        `SELECT state FROM workflow_nodes WHERE id = (SELECT workflow_node_id FROM workflow_tasks WHERE id = $1)`,
        [fixture.taskId],
      );
      expect(node?.state).toBe('ready');
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      if (!poolEnded) await resultBoundary.close();
    }
  });
});

describe('M2-SRC-003 full identity reconciliation (COMMIT_UNKNOWN)', () => {
  function reconcileInput(
    fixture: LeasedTask,
    payloadSha: string,
  ): {
    taskId: never;
    claimHash: string;
    attemptNumber: number;
    submittedPayloadSha256: string;
  } {
    return {
      taskId: fixture.taskId as never,
      claimHash: fixture.claimHash,
      attemptNumber: fixture.attemptNumber,
      submittedPayloadSha256: payloadSha,
    };
  }

  async function commitSuccess(
    resultBoundary: { repository: UrlCaptureResultRepository },
    fixture: LeasedTask,
  ): Promise<{ payloadSha: string; snapshotId: string }> {
    const cmd = successCommand(fixture);
    const outcome = await resultBoundary.repository.recordResult(cmd);
    expect(outcome.kind).toBe('recorded');
    return { payloadSha: cmd.submittedPayloadSha256, snapshotId: cmd.success?.snapshot.snapshotId ?? '' };
  }

  async function commitFailure(
    resultBoundary: { repository: UrlCaptureResultRepository },
    fixture: LeasedTask,
  ): Promise<{ payloadSha: string }> {
    const cmd = failureCommand(fixture, 'fetch_failed');
    const outcome = await resultBoundary.repository.recordResult(cmd);
    expect(outcome.kind).toBe('recorded');
    return { payloadSha: cmd.submittedPayloadSha256 };
  }

  async function withEventsUnlocked(
    boundary: UrlCaptureRepositoryTestBoundary,
    fn: () => Promise<void>,
  ): Promise<void> {
    await boundary.query('ALTER TABLE workflow_events DISABLE TRIGGER workflow_events_immutable_trigger');
    try {
      await fn();
    } finally {
      await boundary.query('ALTER TABLE workflow_events ENABLE TRIGGER workflow_events_immutable_trigger');
    }
  }

  async function taskInstanceId(boundary: UrlCaptureRepositoryTestBoundary, taskId: string): Promise<string> {
    const [row] = await boundary.query<{ workflow_instance_id: string }>(
      'SELECT workflow_instance_id FROM workflow_tasks WHERE id = $1',
      [taskId],
    );
    return row?.workflow_instance_id ?? '';
  }

  it('returns COMMITTED for a complete success graph', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const { payloadSha } = await commitSuccess(resultBoundary, fixture);
      const reconciliation = await resultBoundary.repository.reconcileResult(reconcileInput(fixture, payloadSha));
      expect(reconciliation.outcome).toBe('COMMITTED');
      if (reconciliation.outcome === 'COMMITTED') {
        expect(reconciliation.result.recordedOutcome).toBe('succeeded');
        expect(reconciliation.result.sourceId).toBe(fixture.sourceReferenceId);
      }
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('returns COMMITTED for a complete failure graph', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const { payloadSha } = await commitFailure(resultBoundary, fixture);
      const reconciliation = await resultBoundary.repository.reconcileResult(reconcileInput(fixture, payloadSha));
      expect(reconciliation.outcome).toBe('COMMITTED');
      if (reconciliation.outcome === 'COMMITTED') {
        expect(reconciliation.result.recordedOutcome).toBe('failed');
        expect(reconciliation.result.recordedCategory).toBe('fetch_failed');
      }
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('returns ABSENT when nothing has been committed and there are no effects', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const reconciliation = await resultBoundary.repository.reconcileResult(reconcileInput(fixture, 'a'.repeat(64)));
      expect(reconciliation.outcome).toBe('ABSENT');
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('returns UNKNOWN for a Result-only row with an un-terminalized Task', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const [requestRow] = await commandBoundary.query<{ url_capture_request_id: string }>(
        'SELECT url_capture_request_id FROM workflow_tasks WHERE id = $1',
        [fixture.taskId],
      );
      const snapshotId = randomUUID();
      const payloadSha = 'c'.repeat(64);
      await commandBoundary.query(
        `INSERT INTO url_capture_results (${RESULT_INSERT_COLUMNS})
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18::jsonb, now())`,
        [
          randomUUID(),
          fixture.taskId,
          requestRow?.url_capture_request_id,
          fixture.sourceReferenceId,
          fixture.packageId,
          fixture.ownerUserId,
          fixture.attemptNumber,
          fixture.claimHash,
          'fetcher-result/v1',
          payloadSha,
          'succeeded',
          null,
          'succeeded',
          null,
          null,
          fixture.sourceReferenceId,
          snapshotId,
          validEvidenceJson(fixture.taskId, fixture.attemptNumber, snapshotId),
        ],
      );
      const reconciliation = await resultBoundary.repository.reconcileResult(reconcileInput(fixture, payloadSha));
      expect(reconciliation.outcome).toBe('UNKNOWN');
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('returns UNKNOWN when a success graph is missing its Head', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const { payloadSha } = await commitSuccess(resultBoundary, fixture);
      await commandBoundary.query('DELETE FROM source_heads WHERE source_id = $1', [fixture.sourceReferenceId]);
      const reconciliation = await resultBoundary.repository.reconcileResult(reconcileInput(fixture, payloadSha));
      expect(reconciliation.outcome).toBe('UNKNOWN');
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('returns UNKNOWN when a success graph is missing its Event', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const { payloadSha } = await commitSuccess(resultBoundary, fixture);
      const instanceId = await taskInstanceId(commandBoundary, fixture.taskId);
      await withEventsUnlocked(commandBoundary, async () => {
        await commandBoundary.query(
          `DELETE FROM workflow_events WHERE workflow_instance_id = $1 AND event_type = 'url_capture_succeeded.v1'`,
          [instanceId],
        );
      });
      const reconciliation = await resultBoundary.repository.reconcileResult(reconcileInput(fixture, payloadSha));
      expect(reconciliation.outcome).toBe('UNKNOWN');
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('returns UNKNOWN when the success Event payload does not match the Result graph', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const { payloadSha } = await commitSuccess(resultBoundary, fixture);
      const instanceId = await taskInstanceId(commandBoundary, fixture.taskId);
      await withEventsUnlocked(commandBoundary, async () => {
        await commandBoundary.query(
          `UPDATE workflow_events SET payload = jsonb_set(payload, '{snapshotId}', to_jsonb($2::text))
           WHERE workflow_instance_id = $1 AND event_type = 'url_capture_succeeded.v1'`,
          [instanceId, randomUUID()],
        );
      });
      const reconciliation = await resultBoundary.repository.reconcileResult(reconcileInput(fixture, payloadSha));
      expect(reconciliation.outcome).toBe('UNKNOWN');
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('returns UNKNOWN when the success Task is not terminal-succeeded', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const { payloadSha } = await commitSuccess(resultBoundary, fixture);
      await commandBoundary.query(`UPDATE workflow_tasks SET state = 'failed', updated_at = now() WHERE id = $1`, [
        fixture.taskId,
      ]);
      const reconciliation = await resultBoundary.repository.reconcileResult(reconcileInput(fixture, payloadSha));
      expect(reconciliation.outcome).toBe('UNKNOWN');
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('returns UNKNOWN when the success Task still holds Lease fields', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const { payloadSha } = await commitSuccess(resultBoundary, fixture);
      await commandBoundary.query(
        `UPDATE workflow_tasks SET state = 'leased', claim_hash = $2, claimed_by = 'fetcher',
           lease_started_at = now(), lease_heartbeat_at = now(), lease_expires_at = now() + interval '1 hour',
           updated_at = now()
         WHERE id = $1`,
        [fixture.taskId, fixture.claimHash],
      );
      const reconciliation = await resultBoundary.repository.reconcileResult(reconcileInput(fixture, payloadSha));
      expect(reconciliation.outcome).toBe('UNKNOWN');
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('returns UNKNOWN when the source_capture Node is not completed', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const { payloadSha } = await commitSuccess(resultBoundary, fixture);
      await commandBoundary.query(
        `UPDATE workflow_nodes SET state = 'ready', updated_at = now()
         WHERE id = (SELECT workflow_node_id FROM workflow_tasks WHERE id = $1)`,
        [fixture.taskId],
      );
      const reconciliation = await resultBoundary.repository.reconcileResult(reconcileInput(fixture, payloadSha));
      expect(reconciliation.outcome).toBe('UNKNOWN');
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('returns UNKNOWN when the source_review Node is missing', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const { payloadSha } = await commitSuccess(resultBoundary, fixture);
      const instanceId = await taskInstanceId(commandBoundary, fixture.taskId);
      await commandBoundary.query(
        `DELETE FROM workflow_nodes WHERE workflow_instance_id = $1 AND template_node_key = 'source_review'`,
        [instanceId],
      );
      const reconciliation = await resultBoundary.repository.reconcileResult(reconcileInput(fixture, payloadSha));
      expect(reconciliation.outcome).toBe('UNKNOWN');
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('returns UNKNOWN when there is more than one success Result Event', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const { payloadSha } = await commitSuccess(resultBoundary, fixture);
      const instanceId = await taskInstanceId(commandBoundary, fixture.taskId);
      const [event] = await commandBoundary.query<{
        content_package_id: string;
        owner_user_id: string;
        sequence: number;
        payload: Record<string, unknown>;
        workflow_node_id: string;
      }>(
        `SELECT content_package_id, owner_user_id, sequence, payload, workflow_node_id
         FROM workflow_events WHERE workflow_instance_id = $1 AND event_type = 'url_capture_succeeded.v1'`,
        [instanceId],
      );
      await withEventsUnlocked(commandBoundary, async () => {
        await commandBoundary.query(
          `INSERT INTO workflow_events
             (id, workflow_instance_id, content_package_id, owner_user_id, sequence, event_type, payload, occurred_at, workflow_node_id)
           VALUES ($1, $2, $3, $4, $5, 'url_capture_succeeded.v1', $6::jsonb, now(), $7)`,
          [
            randomUUID(),
            instanceId,
            event?.content_package_id,
            event?.owner_user_id,
            (event?.sequence ?? 1) + 1,
            JSON.stringify(event?.payload ?? {}),
            event?.workflow_node_id,
          ],
        );
      });
      const reconciliation = await resultBoundary.repository.reconcileResult(reconcileInput(fixture, payloadSha));
      expect(reconciliation.outcome).toBe('UNKNOWN');
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('returns UNKNOWN when a committed success graph also has a failure terminal Event', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const { payloadSha } = await commitSuccess(resultBoundary, fixture);
      const instanceId = await taskInstanceId(commandBoundary, fixture.taskId);
      const [event] = await commandBoundary.query<{
        content_package_id: string;
        owner_user_id: string;
        sequence: number;
        workflow_node_id: string;
      }>(
        `SELECT content_package_id, owner_user_id, sequence, workflow_node_id
         FROM workflow_events WHERE workflow_instance_id = $1 AND event_type = 'url_capture_succeeded.v1'`,
        [instanceId],
      );
      await withEventsUnlocked(commandBoundary, async () => {
        await commandBoundary.query(
          `INSERT INTO workflow_events
             (id, workflow_instance_id, content_package_id, owner_user_id, sequence, event_type, payload, occurred_at, workflow_node_id)
           VALUES ($1, $2, $3, $4, $5, 'url_capture_failed.v1', $6::jsonb, now(), $7)`,
          [
            randomUUID(),
            instanceId,
            event?.content_package_id,
            event?.owner_user_id,
            (event?.sequence ?? 1) + 1,
            JSON.stringify({
              taskId: fixture?.taskId,
              sourceReferenceId: fixture?.sourceReferenceId,
              attemptNumber: fixture?.attemptNumber,
              category: 'fetch_failed',
              code: 'FETCH_FAILED',
            }),
            event?.workflow_node_id,
          ],
        );
      });
      const reconciliation = await resultBoundary.repository.reconcileResult(reconcileInput(fixture, payloadSha));
      expect(reconciliation.outcome).toBe('UNKNOWN');
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('returns UNKNOWN when a success graph has a Source Version', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const { payloadSha, snapshotId } = await commitSuccess(resultBoundary, fixture);
      await commandBoundary.query(
        `INSERT INTO source_versions
           (id, source_id, owner_user_id, version_number, parent_version_id, body, content_hash, schema_version, raw_snapshot_id, created_by_id, created_at)
         VALUES ($1, $2, $3, 1, NULL, $4::jsonb, $5, 'source/normalized/v1', $6, $3, now())`,
        [
          randomUUID(),
          fixture.sourceReferenceId,
          fixture.ownerUserId,
          JSON.stringify({ text: 'versioned text' }),
          'b'.repeat(64),
          snapshotId,
        ],
      );
      const reconciliation = await resultBoundary.repository.reconcileResult(reconcileInput(fixture, payloadSha));
      expect(reconciliation.outcome).toBe('UNKNOWN');
    } finally {
      if (fixture) {
        await commandBoundary.query('DELETE FROM source_approvals WHERE source_id = $1', [fixture.sourceReferenceId]);
        await commandBoundary.query('DELETE FROM source_versions WHERE source_id = $1', [fixture.sourceReferenceId]);
        await cleanup(commandBoundary, fixture.packageId);
      }
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('returns UNKNOWN when a success graph has a Source Approval', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const { payloadSha, snapshotId } = await commitSuccess(resultBoundary, fixture);
      const versionId = randomUUID();
      await commandBoundary.query(
        `INSERT INTO source_versions
           (id, source_id, owner_user_id, version_number, parent_version_id, body, content_hash, schema_version, raw_snapshot_id, created_by_id, created_at)
         VALUES ($1, $2, $3, 1, NULL, $4::jsonb, $5, 'source/normalized/v1', $6, $3, now())`,
        [
          versionId,
          fixture.sourceReferenceId,
          fixture.ownerUserId,
          JSON.stringify({ text: 'versioned text' }),
          'b'.repeat(64),
          snapshotId,
        ],
      );
      await commandBoundary.query(
        `INSERT INTO source_approvals
           (id, source_id, owner_user_id, approved_version_id, approved_by_id, approved_at, validation_summary)
         VALUES ($1, $2, $3, $4, $3, now(), 'gate passed')`,
        [randomUUID(), fixture.sourceReferenceId, fixture.ownerUserId, versionId],
      );
      const reconciliation = await resultBoundary.repository.reconcileResult(reconcileInput(fixture, payloadSha));
      expect(reconciliation.outcome).toBe('UNKNOWN');
    } finally {
      if (fixture) {
        await commandBoundary.query('DELETE FROM source_approvals WHERE source_id = $1', [fixture.sourceReferenceId]);
        await commandBoundary.query('DELETE FROM source_versions WHERE source_id = $1', [fixture.sourceReferenceId]);
        await cleanup(commandBoundary, fixture.packageId);
      }
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('returns UNKNOWN when a failure graph has residual Source evidence', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const { payloadSha } = await commitFailure(resultBoundary, fixture);
      await commandBoundary.query(
        `INSERT INTO sources (id, content_package_id, owner_user_id, source_type, role, label, capture_type, created_at)
         VALUES ($1, $2, $3, 'public_url', 'primary', NULL, 'public_url', now())`,
        [fixture.sourceReferenceId, fixture.packageId, fixture.ownerUserId],
      );
      const reconciliation = await resultBoundary.repository.reconcileResult(reconcileInput(fixture, payloadSha));
      expect(reconciliation.outcome).toBe('UNKNOWN');
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('returns UNKNOWN when a failure graph is missing its Event', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const { payloadSha } = await commitFailure(resultBoundary, fixture);
      const instanceId = await taskInstanceId(commandBoundary, fixture.taskId);
      await withEventsUnlocked(commandBoundary, async () => {
        await commandBoundary.query(
          `DELETE FROM workflow_events WHERE workflow_instance_id = $1 AND event_type = 'url_capture_failed.v1'`,
          [instanceId],
        );
      });
      const reconciliation = await resultBoundary.repository.reconcileResult(reconcileInput(fixture, payloadSha));
      expect(reconciliation.outcome).toBe('UNKNOWN');
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('returns UNKNOWN when a committed failure graph also has a success terminal Event', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const { payloadSha } = await commitFailure(resultBoundary, fixture);
      const instanceId = await taskInstanceId(commandBoundary, fixture.taskId);
      const [event] = await commandBoundary.query<{
        content_package_id: string;
        owner_user_id: string;
        sequence: number;
        workflow_node_id: string;
      }>(
        `SELECT content_package_id, owner_user_id, sequence, workflow_node_id
         FROM workflow_events WHERE workflow_instance_id = $1 AND event_type = 'url_capture_failed.v1'`,
        [instanceId],
      );
      await withEventsUnlocked(commandBoundary, async () => {
        await commandBoundary.query(
          `INSERT INTO workflow_events
             (id, workflow_instance_id, content_package_id, owner_user_id, sequence, event_type, payload, occurred_at, workflow_node_id)
           VALUES ($1, $2, $3, $4, $5, 'url_capture_succeeded.v1', $6::jsonb, now(), $7)`,
          [
            randomUUID(),
            instanceId,
            event?.content_package_id,
            event?.owner_user_id,
            (event?.sequence ?? 1) + 1,
            JSON.stringify({
              taskId: fixture?.taskId,
              sourceReferenceId: fixture?.sourceReferenceId,
              sourceId: fixture?.sourceReferenceId,
              snapshotId: randomUUID(),
              attemptNumber: fixture?.attemptNumber,
            }),
            event?.workflow_node_id,
          ],
        );
      });
      const reconciliation = await resultBoundary.repository.reconcileResult(reconcileInput(fixture, payloadSha));
      expect(reconciliation.outcome).toBe('UNKNOWN');
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('returns UNKNOWN when the failure Task state is wrong', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const { payloadSha } = await commitFailure(resultBoundary, fixture);
      await commandBoundary.query(`UPDATE workflow_tasks SET state = 'succeeded', updated_at = now() WHERE id = $1`, [
        fixture.taskId,
      ]);
      const reconciliation = await resultBoundary.repository.reconcileResult(reconcileInput(fixture, payloadSha));
      expect(reconciliation.outcome).toBe('UNKNOWN');
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('returns UNKNOWN when the Result identity does not match', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const { payloadSha } = await commitSuccess(resultBoundary, fixture);
      const reconciliation = await resultBoundary.repository.reconcileResult({
        ...reconcileInput(fixture, payloadSha),
        attemptNumber: fixture.attemptNumber + 1,
      });
      expect(reconciliation.outcome).toBe('UNKNOWN');
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('returns UNKNOWN when the Result is absent but a partial Source effect exists', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const resultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl());
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      await commandBoundary.query(
        `INSERT INTO sources (id, content_package_id, owner_user_id, source_type, role, label, capture_type, created_at)
         VALUES ($1, $2, $3, 'public_url', 'primary', NULL, 'public_url', now())`,
        [fixture.sourceReferenceId, fixture.packageId, fixture.ownerUserId],
      );
      const reconciliation = await resultBoundary.repository.reconcileResult(reconcileInput(fixture, 'd'.repeat(64)));
      expect(reconciliation.outcome).toBe('UNKNOWN');
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await resultBoundary.close();
    }
  });

  it('returns UNKNOWN on a reconciliation query fault and leaves the pool usable', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const faultBoundary = createUrlCaptureResultRepositoryTestBoundary(databaseUrl(), {
      reconcileAt: (point) => {
        if (point === 'resultQuery') throw new Error('injected-reconcile-fault');
      },
    });
    let fixture: LeasedTask | undefined;
    try {
      fixture = await createLeasedTask(commandBoundary);
      const reconciliation = await faultBoundary.repository.reconcileResult(reconcileInput(fixture, 'a'.repeat(64)));
      expect(reconciliation.outcome).toBe('UNKNOWN');
      const rows = await faultBoundary.query<{ one: number }>('SELECT 1 AS one');
      expect(rows[0]?.one).toBe(1);
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await faultBoundary.close();
    }
  });
});
