import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  FetcherGatewayService,
  UrlCaptureService,
  type ContentPackageId,
  type ContentPackageOwnerId,
  type UrlCaptureIdGenerator,
} from '@contentos/core';
import {
  createFetcherGatewayRepositoryTestBoundary,
  createUrlCaptureRepositoryTestBoundary,
  type FetcherGatewayRepositoryTestBoundary,
  type UrlCaptureRepositoryTestBoundary,
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

async function createTask(boundary: UrlCaptureRepositoryTestBoundary): Promise<{
  readonly packageId: ContentPackageId;
  readonly taskId: string;
}> {
  const ownerUserId = randomUUID() as ContentPackageOwnerId;
  const packageId = randomUUID() as ContentPackageId;
  await boundary.query(
    `INSERT INTO content_packages
      (id, owner_user_id, title, description, content_mode, requested_blog, requested_xiaohongshu,
       lifecycle, revision, created_at, updated_at, archived_at)
     VALUES ($1, $2, 'Gateway repository fixture', NULL, 'creator_led', true, true, 'active', 1, now(), now(), NULL)`,
    [packageId, ownerUserId],
  );
  const result = await new UrlCaptureService(boundary.repository, ids(), { now: () => new Date() }).submit({
    contentPackageId: packageId,
    ownerUserId,
    expectedPackageRevision: 1,
    role: 'primary',
    submittedUrl: 'https://example.com/repository/private',
    idempotencyKey: randomUUID().replaceAll('-', '').slice(0, 16),
  });
  await boundary.query(
    `UPDATE workflow_outbox_records
     SET state = 'dispatched', last_dispatch_at = created_at, dispatched_at = created_at
     WHERE task_id = $1`,
    [result.taskId],
  );
  return { packageId, taskId: result.taskId };
}

async function cleanup(
  boundary: UrlCaptureRepositoryTestBoundary | FetcherGatewayRepositoryTestBoundary,
  packageId: ContentPackageId,
): Promise<void> {
  await boundary.query('DELETE FROM workflow_outbox_records WHERE content_package_id = $1', [packageId]);
  await boundary.query('DELETE FROM workflow_tasks WHERE content_package_id = $1', [packageId]);
  await boundary.query('DELETE FROM url_capture_requests WHERE content_package_id = $1', [packageId]);
  await boundary.query('DELETE FROM url_source_references WHERE content_package_id = $1', [packageId]);
  await boundary.query('ALTER TABLE workflow_events DISABLE TRIGGER workflow_events_immutable_trigger');
  await boundary.query('DELETE FROM workflow_events WHERE content_package_id = $1', [packageId]);
  await boundary.query('ALTER TABLE workflow_events ENABLE TRIGGER workflow_events_immutable_trigger');
  await boundary.query('DELETE FROM workflow_nodes WHERE content_package_id = $1', [packageId]);
  await boundary.query('DELETE FROM workflow_instances WHERE content_package_id = $1', [packageId]);
  await boundary.query('DELETE FROM content_packages WHERE id = $1', [packageId]);
}

describe('M2-WF-003B PostgreSQL Fetcher Gateway repository', () => {
  it('selects exactly one concurrent claim winner, stores only the hash, and enforces bounded heartbeat cadence/cap', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const first = createFetcherGatewayRepositoryTestBoundary(databaseUrl());
    const second = createFetcherGatewayRepositoryTestBoundary(databaseUrl());
    let fixture: { readonly packageId: ContentPackageId; readonly taskId: string } | undefined;
    const claim = 'A'.repeat(43);
    const startedAt = new Date('2026-08-02T00:00:00.000Z');
    const now = { value: startedAt };
    try {
      fixture = await createTask(commandBoundary);
      const serviceOne = new FetcherGatewayService(
        first.repository,
        { generate: () => claim },
        { now: () => now.value },
      );
      const serviceTwo = new FetcherGatewayService(
        second.repository,
        { generate: () => claim },
        { now: () => now.value },
      );
      const outcomes = await Promise.allSettled([
        serviceOne.claim(fixture.taskId as never),
        serviceTwo.claim(fixture.taskId as never),
      ]);
      const fulfilled = outcomes.filter((outcome) => outcome.status === 'fulfilled');
      const rejected = outcomes.filter((outcome) => outcome.status === 'rejected');
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      const claimResponse = fulfilled[0]?.status === 'fulfilled' ? fulfilled[0].value : undefined;
      if (!claimResponse) throw new Error('claim winner missing');
      expect(claimResponse.attemptNumber).toBe(1);
      expect(claimResponse.leaseExpiresAt).toEqual(new Date(startedAt.getTime() + 60_000));

      const rows = await first.query<{
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
      expect(rows[0]).toMatchObject({
        state: 'leased',
        claim_attempt_number: 1,
        claim_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
        claimed_by: 'fetcher',
      });
      expect(rows[0]?.claim_hash).not.toBe(claim);
      expect(rows[0]?.lease_heartbeat_at?.getTime()).toBe(startedAt.getTime());

      now.value = new Date(startedAt.getTime() + 10_000);
      await expect(serviceOne.heartbeat(fixture.taskId as never, claim)).resolves.toMatchObject({ renewed: false });
      now.value = new Date(startedAt.getTime() + 20_000);
      await expect(serviceOne.heartbeat(fixture.taskId as never, claim)).resolves.toMatchObject({ renewed: true });
      now.value = new Date(startedAt.getTime() + 80_000);
      await expect(serviceOne.heartbeat(fixture.taskId as never, claim)).rejects.toMatchObject({
        code: 'FETCHER_CLAIM_UNAVAILABLE',
      });
      now.value = new Date(startedAt.getTime() + 121_000);
      await expect(serviceOne.heartbeat(fixture.taskId as never, claim)).rejects.toMatchObject({
        code: 'FETCHER_CLAIM_UNAVAILABLE',
      });
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await first.close();
      await second.close();
    }
  });

  it('rejects wrong claim and ineligible dispatched state without changing lease facts', async () => {
    const commandBoundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const gatewayBoundary = createFetcherGatewayRepositoryTestBoundary(databaseUrl());
    let fixture: { readonly packageId: ContentPackageId; readonly taskId: string } | undefined;
    try {
      fixture = await createTask(commandBoundary);
      const service = new FetcherGatewayService(
        gatewayBoundary.repository,
        { generate: () => 'B'.repeat(43) },
        { now: () => new Date('2026-08-02T00:00:00.000Z') },
      );
      await expect(service.heartbeat(fixture.taskId as never, 'B'.repeat(43))).rejects.toMatchObject({
        code: 'FETCHER_CLAIM_UNAVAILABLE',
      });
      await commandBoundary.query(
        `UPDATE workflow_outbox_records
         SET state = 'pending', last_dispatch_at = NULL, dispatched_at = NULL
         WHERE task_id = $1`,
        [fixture.taskId],
      );
      await expect(service.claim(fixture.taskId as never)).rejects.toMatchObject({
        code: 'FETCHER_TASK_UNAVAILABLE',
      });
      const rows = await gatewayBoundary.query<{ state: string; claim_hash: string | null }>(
        'SELECT state, claim_hash FROM workflow_tasks WHERE id = $1',
        [fixture.taskId],
      );
      expect(rows[0]).toEqual({ state: 'queued', claim_hash: null });
    } finally {
      if (fixture) await cleanup(commandBoundary, fixture.packageId);
      await commandBoundary.close();
      await gatewayBoundary.close();
    }
  });
});
