import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  FetcherGatewayService,
  UrlCaptureService,
  buildUrlCaptureStorageKey,
  hashFetcherGatewayClaim,
  type ContentPackageId,
  type ContentPackageOwnerId,
  type FetcherResultSuccessEvidence,
  type UrlCaptureIdGenerator,
  type UrlCaptureResultRecordCommand,
} from '@contentos/core';
import {
  createFetcherGatewayRepositoryTestBoundary,
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
    claimed = await gateway.claim(submitted.taskId as never);
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
    acceptedAt: new Date(),
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
    acceptedAt: new Date(),
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
  await commandBoundary.query('ALTER TABLE workflow_events DISABLE TRIGGER workflow_events_immutable_trigger');
  await commandBoundary.query('DELETE FROM workflow_events WHERE content_package_id = $1', [packageId]);
  await commandBoundary.query('ALTER TABLE workflow_events ENABLE TRIGGER workflow_events_immutable_trigger');
  await commandBoundary.query('DELETE FROM workflow_nodes WHERE content_package_id = $1', [packageId]);
  await commandBoundary.query('DELETE FROM workflow_instances WHERE content_package_id = $1', [packageId]);
  await commandBoundary.query('DELETE FROM content_packages WHERE id = $1', [packageId]);
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
