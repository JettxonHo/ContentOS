import { spawn, type ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { createServer, type Server } from 'node:http';
import { createConnection } from 'node:net';
import { join } from 'node:path';

import { buildFetcherTaskJobId, FETCHER_JOB_ATTEMPTS, FETCHER_JOB_NAME } from '@contentos/contracts';
import {
  type ContentPackageId,
  type ContentPackageOwnerId,
  UrlCaptureService,
  type UrlCaptureIdGenerator,
} from '@contentos/core';
import { createUrlCaptureRepositoryTestBoundary, type UrlCaptureRepositoryTestBoundary } from '@contentos/database';
import { FetcherS3SnapshotStore } from '@contentos/object-storage';
import { Queue } from 'bullmq';
import { describe, expect, it } from 'vitest';

import {
  FetcherGatewayClientError,
  NodeFetcherGatewayClient,
  type FetcherGatewayClient,
} from '../../../../apps/fetcher/src/fetcher-gateway-client.js';
import { createFetcherOrchestrator } from '../../../../apps/fetcher/src/fetcher-orchestrator.js';
import { createFetcherQueueConsumer } from '../../../../apps/fetcher/src/fetcher-queue.js';
import type { PublicUrlTransport } from '../../../../apps/fetcher/src/public-url-transport/index.js';
import { createPublicUrlTransportForTesting } from '../../../../apps/fetcher/src/public-url-transport/test-support.js';
import { cleanupOwnedFetcherQueue } from './harness.js';
import { readComposeCredentials, requireState } from './env.js';

function databaseUrl(): string {
  const state = requireState();
  const credentials = readComposeCredentials(state.envFile);
  return `postgresql://smoke_user:${encodeURIComponent(credentials.POSTGRES_PASSWORD ?? '')}@127.0.0.1:${state.ports.postgres}/smoke_db`;
}

function redisUrl(): string {
  const state = requireState();
  const credentials = readComposeCredentials(state.envFile);
  return `redis://:${encodeURIComponent(credentials.REDIS_PASSWORD ?? '')}@127.0.0.1:${state.ports.redis}`;
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

interface Fixture {
  readonly packageId: ContentPackageId;
  readonly taskId: string;
}

interface StartedWorker {
  readonly child: ChildProcess;
  readonly stdout: string[];
  readonly stderr: string[];
}

function startWorker(): StartedWorker {
  const state = requireState();
  const child = spawn(process.execPath, [join(state.repoRoot, 'apps', 'worker', 'dist', 'main.js')], {
    cwd: join(state.repoRoot, 'apps', 'worker'),
    env: {
      ...process.env,
      CONTENTOS_ENV: 'test',
      DATABASE_URL: databaseUrl(),
      REDIS_URL: redisUrl(),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const stdout: string[] = [];
  const stderr: string[] = [];
  child.stdout?.setEncoding('utf8');
  child.stderr?.setEncoding('utf8');
  child.stdout?.on('data', (chunk: string) => stdout.push(chunk));
  child.stderr?.on('data', (chunk: string) => stderr.push(chunk));
  return { child, stdout, stderr };
}

async function stopWorker(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const closed = new Promise<void>((resolve) => child.once('close', () => resolve()));
  let timer: NodeJS.Timeout | undefined;
  child.kill('SIGTERM');
  try {
    await Promise.race([
      closed,
      new Promise<void>((resolve) => {
        timer = setTimeout(() => {
          child.kill('SIGKILL');
          resolve();
        }, 10_000);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
  if (child.exitCode === null && child.signalCode === null) await closed;
  expect(child.exitCode).toBe(0);
}

async function readTaskEffects(
  boundary: UrlCaptureRepositoryTestBoundary,
  fixture: Fixture,
): Promise<{ readonly resultCount: number; readonly sourceCount: number; readonly eventCount: number }> {
  const [counts] = await boundary.query<{ result_count: string; source_count: string; event_count: string }>(
    `SELECT
       (SELECT count(*) FROM url_capture_results WHERE content_package_id = $1)::text AS result_count,
       (SELECT count(*) FROM sources WHERE content_package_id = $1)::text AS source_count,
       (SELECT count(*) FROM workflow_events WHERE content_package_id = $1)::text AS event_count`,
    [fixture.packageId],
  );
  if (!counts) throw new Error('fetcher orchestration effects are missing');
  return {
    resultCount: Number(counts.result_count),
    sourceCount: Number(counts.source_count),
    eventCount: Number(counts.event_count),
  };
}

async function createFixture(
  boundary: UrlCaptureRepositoryTestBoundary,
  submittedUrl = 'http://fixture.test/article',
): Promise<Fixture> {
  const ownerUserId = randomUUID() as ContentPackageOwnerId;
  const packageId = randomUUID() as ContentPackageId;
  await boundary.query(
    `INSERT INTO content_packages
      (id, owner_user_id, title, description, content_mode, requested_blog, requested_xiaohongshu,
       lifecycle, revision, created_at, updated_at, archived_at)
     VALUES ($1, $2, 'Fetcher orchestration fixture', NULL, 'creator_led', true, true, 'active', 1, now(), now(), NULL)`,
    [packageId, ownerUserId],
  );
  const submitted = await new UrlCaptureService(boundary.repository, captureIds(), { now: () => new Date() }).submit({
    contentPackageId: packageId,
    ownerUserId,
    expectedPackageRevision: 1,
    role: 'primary',
    submittedUrl,
    idempotencyKey: randomUUID().replaceAll('-', '').slice(0, 16),
  });
  await boundary.query(
    `UPDATE workflow_outbox_records
     SET state = 'dispatched', last_dispatch_at = created_at, dispatched_at = created_at
     WHERE task_id = $1`,
    [submitted.taskId],
  );
  return { packageId, taskId: submitted.taskId };
}

async function waitFor<T>(read: () => Promise<T | undefined>, predicate: (value: T) => boolean): Promise<T> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const value = await read();
    if (value !== undefined && predicate(value)) return value;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('fetcher_orchestration_wait_timed_out');
}

async function waitForMissing(read: () => Promise<unknown | undefined>): Promise<void> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if ((await read()) === undefined) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('fetcher_orchestration_wait_timed_out');
}

async function startPublicTransportFixture(): Promise<{
  readonly server: Server;
  readonly transport: PublicUrlTransport;
  readonly requests: string[];
}> {
  const requests: string[] = [];
  const server = createServer((request, response) => {
    requests.push(request.url ?? '');
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end('<main>Fetcher integration evidence</main>');
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (address === null || typeof address === 'string') throw new Error('public transport fixture did not bind');
  const transport = createPublicUrlTransportForTesting({
    resolver: { resolve: async () => [{ address: '8.8.8.8', family: 4 }] },
    connector: {
      async connect(selection) {
        const socket = createConnection({ host: '127.0.0.1', port: address.port });
        await once(socket, 'connect');
        return { socket, peer: selection };
      },
    },
  });
  return { server, transport, requests };
}

function validationBlockedTransport(): PublicUrlTransport {
  return createPublicUrlTransportForTesting({
    resolver: { resolve: async () => [{ address: '127.0.0.1', family: 4 }] },
  });
}

async function closeServer(server: Server | undefined): Promise<void> {
  if (!server) return;
  server.close();
  await once(server, 'close');
}

async function cleanup(boundary: UrlCaptureRepositoryTestBoundary, fixture: Fixture): Promise<void> {
  await boundary.query('DELETE FROM url_capture_results WHERE content_package_id = $1', [fixture.packageId]);
  await boundary.query(
    'DELETE FROM source_heads WHERE source_id IN (SELECT id FROM sources WHERE content_package_id = $1)',
    [fixture.packageId],
  );
  await boundary.query(
    'DELETE FROM source_working_copies WHERE source_id IN (SELECT id FROM sources WHERE content_package_id = $1)',
    [fixture.packageId],
  );
  await boundary.query(
    'DELETE FROM source_raw_snapshots WHERE source_id IN (SELECT id FROM sources WHERE content_package_id = $1)',
    [fixture.packageId],
  );
  await boundary.query('DELETE FROM sources WHERE content_package_id = $1', [fixture.packageId]);
  await boundary.query('DELETE FROM workflow_outbox_records WHERE content_package_id = $1', [fixture.packageId]);
  await boundary.query('DELETE FROM workflow_tasks WHERE content_package_id = $1', [fixture.packageId]);
  await boundary.query('DELETE FROM url_capture_requests WHERE content_package_id = $1', [fixture.packageId]);
  await boundary.query('DELETE FROM url_source_references WHERE content_package_id = $1', [fixture.packageId]);
  await boundary.query('ALTER TABLE workflow_events DISABLE TRIGGER workflow_events_immutable_trigger');
  try {
    await boundary.query('DELETE FROM workflow_events WHERE content_package_id = $1', [fixture.packageId]);
  } finally {
    await boundary.query('ALTER TABLE workflow_events ENABLE TRIGGER workflow_events_immutable_trigger');
  }
  await boundary.query('DELETE FROM workflow_nodes WHERE content_package_id = $1', [fixture.packageId]);
  await boundary.query('DELETE FROM workflow_instances WHERE content_package_id = $1', [fixture.packageId]);
  await boundary.query('DELETE FROM content_packages WHERE id = $1', [fixture.packageId]);
}

describe('M2-FETCH-001C Queue-to-Gateway orchestration', () => {
  it('fences a stale generation, executes the current Job once, and no-ops terminal redelivery', async () => {
    const state = requireState();
    const credentials = readComposeCredentials(state.envFile);
    const boundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const queue = new Queue('contentos-fetcher', { connection: { url: redisUrl() } });
    const snapshots = new FetcherS3SnapshotStore({
      endpoint: `http://127.0.0.1:${state.ports.objectStorage}`,
      region: 'us-east-1',
      bucket: state.objectStorageBucket,
      forcePathStyle: true,
      accessKeyId: credentials.OBJECT_STORAGE_ACCESS_KEY ?? '',
      secretAccessKey: credentials.OBJECT_STORAGE_SECRET_KEY ?? '',
    });
    let fixture: Fixture | undefined;
    let snapshotId: string | undefined;
    let consumer: ReturnType<typeof createFetcherQueueConsumer> | undefined;
    let gateway: NodeFetcherGatewayClient | undefined;
    let publicFixture: Awaited<ReturnType<typeof startPublicTransportFixture>> | undefined;
    try {
      fixture = await createFixture(boundary);
      const currentFixture = fixture;
      await boundary.query('UPDATE workflow_outbox_records SET delivery_generation = 2 WHERE task_id = $1', [
        fixture.taskId,
      ]);
      publicFixture = await startPublicTransportFixture();
      gateway = new NodeFetcherGatewayClient(state.apiOrigin, credentials.CONTENTOS_FETCHER_GATEWAY_SECRET ?? '');
      const orchestrator = createFetcherOrchestrator({
        gateway,
        transport: publicFixture.transport,
        snapshots,
      });
      consumer = createFetcherQueueConsumer(
        redisUrl(),
        async (job) => orchestrator.process(job),
        () => undefined,
      );
      await Promise.all([queue.waitUntilReady(), consumer.ready()]);
      const data = {
        taskId: fixture.taskId,
        taskKind: 'url_capture' as const,
        envelopeVersion: 'fetcher-task/v1' as const,
      };
      await queue.add(FETCHER_JOB_NAME, data, {
        jobId: buildFetcherTaskJobId(fixture.taskId, 1),
        attempts: FETCHER_JOB_ATTEMPTS,
        removeOnComplete: true,
        removeOnFail: true,
      });
      await waitForMissing(async () => queue.getJob(buildFetcherTaskJobId(currentFixture.taskId, 1)));
      expect(publicFixture.requests).toEqual([]);
      await expect(
        boundary.query<{ state: string }>('SELECT state FROM workflow_tasks WHERE id = $1', [fixture.taskId]),
      ).resolves.toEqual([{ state: 'queued' }]);

      await queue.add(FETCHER_JOB_NAME, data, {
        jobId: buildFetcherTaskJobId(fixture.taskId, 2),
        attempts: FETCHER_JOB_ATTEMPTS,
        removeOnComplete: true,
        removeOnFail: true,
      });

      const task = await waitFor(
        async () =>
          (
            await boundary.query<{ state: string }>('SELECT state FROM workflow_tasks WHERE id = $1', [
              currentFixture.taskId,
            ])
          )[0],
        (value) => value.state === 'succeeded',
      );
      expect(task).toEqual({ state: 'succeeded' });
      expect(publicFixture.requests).toEqual(['/article']);
      const [source] = await boundary.query<{ id: string }>('SELECT id FROM sources WHERE content_package_id = $1', [
        fixture.packageId,
      ]);
      expect(source?.id).toBeDefined();
      const [snapshot] = await boundary.query<{ id: string }>(
        'SELECT id FROM source_raw_snapshots WHERE source_id = $1',
        [source?.id],
      );
      snapshotId = snapshot?.id;
      expect(snapshotId).toBeDefined();
      await waitForMissing(async () => queue.getJob(buildFetcherTaskJobId(currentFixture.taskId, 2)));

      await queue.add(FETCHER_JOB_NAME, data, {
        jobId: buildFetcherTaskJobId(fixture.taskId, 2),
        attempts: FETCHER_JOB_ATTEMPTS,
        removeOnComplete: true,
        removeOnFail: true,
      });
      await waitForMissing(async () => queue.getJob(buildFetcherTaskJobId(currentFixture.taskId, 2)));
      expect(publicFixture.requests).toEqual(['/article']);
    } finally {
      await consumer?.close(true);
      await queue.close();
      if (fixture && !snapshotId) {
        const [snapshot] = await boundary.query<{ id: string }>(
          `SELECT r.id
           FROM source_raw_snapshots r
           JOIN sources s ON s.id = r.source_id
           WHERE s.content_package_id = $1`,
          [fixture.packageId],
        );
        snapshotId = snapshot?.id;
      }
      if (fixture && snapshotId) {
        await snapshots
          .deleteForCompensation({
            taskId: fixture.taskId,
            attemptNumber: 1,
            snapshotId,
            signal: AbortSignal.timeout(5_000),
          })
          .catch(() => undefined);
      }
      if (fixture) await cleanup(boundary, fixture);
      gateway?.close();
      snapshots.close();
      await closeServer(publicFixture?.server);
      await boundary.close();
      await cleanupOwnedFetcherQueue(state);
    }
  });

  it('submits an exact Fetcher failure without creating Source evidence', async () => {
    const state = requireState();
    const credentials = readComposeCredentials(state.envFile);
    const boundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const queue = new Queue('contentos-fetcher', { connection: { url: redisUrl() } });
    const snapshots = new FetcherS3SnapshotStore({
      endpoint: `http://127.0.0.1:${state.ports.objectStorage}`,
      region: 'us-east-1',
      bucket: state.objectStorageBucket,
      forcePathStyle: true,
      accessKeyId: credentials.OBJECT_STORAGE_ACCESS_KEY ?? '',
      secretAccessKey: credentials.OBJECT_STORAGE_SECRET_KEY ?? '',
    });
    let fixture: Fixture | undefined;
    let consumer: ReturnType<typeof createFetcherQueueConsumer> | undefined;
    let gateway: NodeFetcherGatewayClient | undefined;
    try {
      fixture = await createFixture(boundary);
      const currentFixture = fixture;
      gateway = new NodeFetcherGatewayClient(state.apiOrigin, credentials.CONTENTOS_FETCHER_GATEWAY_SECRET ?? '');
      const orchestrator = createFetcherOrchestrator({
        gateway,
        transport: validationBlockedTransport(),
        snapshots,
      });
      consumer = createFetcherQueueConsumer(
        redisUrl(),
        async (job) => orchestrator.process(job),
        () => undefined,
      );
      await Promise.all([queue.waitUntilReady(), consumer.ready()]);
      await queue.add(
        FETCHER_JOB_NAME,
        { taskId: fixture.taskId, taskKind: 'url_capture', envelopeVersion: 'fetcher-task/v1' },
        {
          jobId: buildFetcherTaskJobId(fixture.taskId, 1),
          attempts: FETCHER_JOB_ATTEMPTS,
          removeOnComplete: true,
          removeOnFail: true,
        },
      );

      const task = await waitFor(
        async () =>
          (
            await boundary.query<{ state: string; claim_hash: string | null }>(
              'SELECT state, claim_hash FROM workflow_tasks WHERE id = $1',
              [currentFixture.taskId],
            )
          )[0],
        (value) => value.state === 'failed',
      );
      expect(task).toEqual({ state: 'failed', claim_hash: null });
      await expect(
        boundary.query('SELECT id FROM sources WHERE content_package_id = $1', [fixture.packageId]),
      ).resolves.toEqual([]);
    } finally {
      await consumer?.close(true);
      await queue.close();
      if (fixture) await cleanup(boundary, fixture);
      gateway?.close();
      snapshots.close();
      await boundary.close();
      await cleanupOwnedFetcherQueue(state);
    }
  });

  it('repairs the same current Job after a real pre-Claim Gateway identity failure', async () => {
    const state = requireState();
    const credentials = readComposeCredentials(state.envFile);
    const boundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const queue = new Queue('contentos-fetcher', { connection: { url: redisUrl() } });
    const snapshots = new FetcherS3SnapshotStore({
      endpoint: `http://127.0.0.1:${state.ports.objectStorage}`,
      region: 'us-east-1',
      bucket: state.objectStorageBucket,
      forcePathStyle: true,
      accessKeyId: credentials.OBJECT_STORAGE_ACCESS_KEY ?? '',
      secretAccessKey: credentials.OBJECT_STORAGE_SECRET_KEY ?? '',
    });
    let fixture: Fixture | undefined;
    let consumer: ReturnType<typeof createFetcherQueueConsumer> | undefined;
    let worker: StartedWorker | undefined;
    let gateway: NodeFetcherGatewayClient | undefined;
    try {
      fixture = await createFixture(boundary);
      const currentFixture = fixture;
      const before = await readTaskEffects(boundary, fixture);
      let fetchCalls = 0;
      gateway = new NodeFetcherGatewayClient(state.apiOrigin, 'Z'.repeat(43));
      const orchestrator = createFetcherOrchestrator({
        gateway,
        transport: {
          async fetch() {
            fetchCalls += 1;
            throw new Error('pre-claim transport must not run');
          },
        },
        snapshots,
      });
      consumer = createFetcherQueueConsumer(
        redisUrl(),
        async (job) => orchestrator.process(job),
        () => undefined,
      );
      await Promise.all([queue.waitUntilReady(), consumer.ready()]);
      const jobId = buildFetcherTaskJobId(fixture.taskId, 1);
      const data = {
        taskId: fixture.taskId,
        taskKind: 'url_capture' as const,
        envelopeVersion: 'fetcher-task/v1' as const,
      };
      await queue.add(FETCHER_JOB_NAME, data, {
        jobId,
        attempts: FETCHER_JOB_ATTEMPTS,
        removeOnComplete: true,
        removeOnFail: true,
      });
      await waitForMissing(async () => queue.getJob(jobId));
      await consumer.close(true);
      consumer = undefined;

      expect(fetchCalls).toBe(0);
      await expect(
        boundary.query<{
          state: string;
          claim_attempt_number: number;
          claim_hash: string | null;
          lease_expires_at: Date | null;
        }>(
          `SELECT state, claim_attempt_number, claim_hash, lease_expires_at
           FROM workflow_tasks WHERE id = $1`,
          [fixture.taskId],
        ),
      ).resolves.toEqual([{ state: 'queued', claim_attempt_number: 0, claim_hash: null, lease_expires_at: null }]);
      await expect(readTaskEffects(boundary, fixture)).resolves.toEqual(before);

      worker = startWorker();
      const repaired = await waitFor(
        () => queue.getJob(jobId),
        (value) => value !== undefined,
      );
      expect(repaired.id).toBe(jobId);
      expect(repaired.data).toEqual(data);
      expect(repaired.opts.removeOnComplete).toBe(true);
      expect(repaired.opts.removeOnFail).toBe(true);
      await expect(
        boundary.query<{ state: string; delivery_generation: number }>(
          `SELECT state, delivery_generation FROM workflow_outbox_records WHERE task_id = $1`,
          [currentFixture.taskId],
        ),
      ).resolves.toEqual([{ state: 'dispatched', delivery_generation: 1 }]);
      await expect(readTaskEffects(boundary, fixture)).resolves.toEqual(before);
    } finally {
      await consumer?.close(true);
      if (worker) {
        await stopWorker(worker.child).catch(() => {
          if (worker?.child.exitCode === null && worker.child.signalCode === null) worker.child.kill('SIGKILL');
        });
      }
      if (fixture) {
        const job = await queue.getJob(buildFetcherTaskJobId(fixture.taskId, 1));
        if (job) await job.remove();
      }
      await queue.close();
      if (fixture) await cleanup(boundary, fixture);
      gateway?.close();
      snapshots.close();
      await boundary.close();
      await cleanupOwnedFetcherQueue(state);
    }
  });

  it('recovers the same post-Claim Task as generation N+1 after ambiguous Result delivery', async () => {
    const state = requireState();
    const credentials = readComposeCredentials(state.envFile);
    const boundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const queue = new Queue('contentos-fetcher', { connection: { url: redisUrl() } });
    const snapshots = new FetcherS3SnapshotStore({
      endpoint: `http://127.0.0.1:${state.ports.objectStorage}`,
      region: 'us-east-1',
      bucket: state.objectStorageBucket,
      forcePathStyle: true,
      accessKeyId: credentials.OBJECT_STORAGE_ACCESS_KEY ?? '',
      secretAccessKey: credentials.OBJECT_STORAGE_SECRET_KEY ?? '',
    });
    const client = new NodeFetcherGatewayClient(state.apiOrigin, credentials.CONTENTOS_FETCHER_GATEWAY_SECRET ?? '');
    let fixture: Fixture | undefined;
    let consumer: ReturnType<typeof createFetcherQueueConsumer> | undefined;
    let worker: StartedWorker | undefined;
    let publicFixture: Awaited<ReturnType<typeof startPublicTransportFixture>> | undefined;
    let storedSnapshot:
      | {
          readonly snapshotId: string;
          readonly storageKey: string;
          readonly sha256: string;
          readonly byteSize: number;
          readonly contentType: 'text/html' | 'text/plain' | 'text/markdown';
        }
      | undefined;
    try {
      fixture = await createFixture(boundary);
      const currentFixture = fixture;
      const before = await readTaskEffects(boundary, fixture);
      publicFixture = await startPublicTransportFixture();
      const gateway: FetcherGatewayClient = {
        claim: (taskId, deliveryGeneration) => client.claim(taskId, deliveryGeneration),
        heartbeat: (taskId, opaqueClaim, attemptNumber) => client.heartbeat(taskId, opaqueClaim, attemptNumber),
        async submitResult(_taskId, _opaqueClaim, result) {
          if (result.outcome === 'succeeded') storedSnapshot = result.snapshot;
          throw new FetcherGatewayClientError('transient');
        },
      };
      const orchestrator = createFetcherOrchestrator({ gateway, transport: publicFixture.transport, snapshots });
      consumer = createFetcherQueueConsumer(
        redisUrl(),
        async (job) => orchestrator.process(job),
        () => undefined,
      );
      await Promise.all([queue.waitUntilReady(), consumer.ready()]);
      const oldJobId = buildFetcherTaskJobId(fixture.taskId, 1);
      await queue.add(
        FETCHER_JOB_NAME,
        { taskId: fixture.taskId, taskKind: 'url_capture', envelopeVersion: 'fetcher-task/v1' },
        {
          jobId: oldJobId,
          attempts: FETCHER_JOB_ATTEMPTS,
          removeOnComplete: true,
          removeOnFail: true,
        },
      );
      await waitForMissing(async () => queue.getJob(oldJobId));
      await consumer.close(true);
      consumer = undefined;

      expect(storedSnapshot).toBeDefined();
      if (!storedSnapshot) throw new Error('post-claim recovery snapshot was not prepared');
      await expect(snapshots.readForIntegrity(storedSnapshot, AbortSignal.timeout(5_000))).resolves.toBe(true);
      const [leased] = await boundary.query<{
        state: string;
        claim_attempt_number: number;
        claim_hash: string | null;
        lease_expires_at: Date | null;
      }>(
        `SELECT state, claim_attempt_number, claim_hash, lease_expires_at
         FROM workflow_tasks WHERE id = $1`,
        [fixture.taskId],
      );
      expect(leased).toMatchObject({ state: 'leased', claim_attempt_number: 1, claim_hash: expect.any(String) });
      expect(leased?.lease_expires_at).toBeInstanceOf(Date);
      await expect(readTaskEffects(boundary, fixture)).resolves.toEqual(before);

      const expiredAt = new Date(Date.now() - 1_000);
      const heartbeatAt = new Date(expiredAt.getTime() - 1_000);
      const startedAt = new Date(expiredAt.getTime() - 60_000);
      await boundary.query(
        `UPDATE workflow_tasks
         SET lease_started_at = $2, lease_heartbeat_at = $3, lease_expires_at = $4, updated_at = $4
         WHERE id = $1 AND state = 'leased'`,
        [fixture.taskId, startedAt, heartbeatAt, expiredAt],
      );
      worker = startWorker();
      const nextJobId = buildFetcherTaskJobId(fixture.taskId, 2);
      const next = await waitFor(
        () => queue.getJob(nextJobId),
        (value) => value !== undefined,
      );
      expect(next.id).toBe(nextJobId);
      expect(next.data).toEqual({
        taskId: fixture.taskId,
        taskKind: 'url_capture',
        envelopeVersion: 'fetcher-task/v1',
      });
      expect(await queue.getJob(oldJobId)).toBeUndefined();
      await expect(client.claim(fixture.taskId, 1)).resolves.toEqual({ kind: 'unavailable' });
      await expect(
        boundary.query<{
          state: string;
          claim_attempt_number: number;
          claim_hash: string | null;
          delivery_generation: number;
        }>(
          `SELECT t.state, t.claim_attempt_number, t.claim_hash, o.delivery_generation
           FROM workflow_tasks t
           JOIN workflow_outbox_records o ON o.task_id = t.id
           WHERE t.id = $1`,
          [currentFixture.taskId],
        ),
      ).resolves.toEqual([{ state: 'queued', claim_attempt_number: 1, claim_hash: null, delivery_generation: 2 }]);
      await expect(readTaskEffects(boundary, fixture)).resolves.toEqual({
        ...before,
        eventCount: before.eventCount + 1,
      });
    } finally {
      await consumer?.close(true);
      if (worker) {
        await stopWorker(worker.child).catch(() => {
          if (worker?.child.exitCode === null && worker.child.signalCode === null) worker.child.kill('SIGKILL');
        });
      }
      if (fixture) {
        for (const generation of [1, 2]) {
          const queued = await queue.getJob(buildFetcherTaskJobId(fixture.taskId, generation));
          if (queued) await queued.remove();
        }
      }
      await queue.close();
      if (fixture && storedSnapshot) {
        await snapshots
          .deleteForCompensation({
            taskId: fixture.taskId,
            attemptNumber: 1,
            snapshotId: storedSnapshot.snapshotId,
            signal: AbortSignal.timeout(5_000),
          })
          .catch(() => undefined);
      }
      if (fixture) await cleanup(boundary, fixture);
      client.close();
      snapshots.close();
      await closeServer(publicFixture?.server);
      await boundary.close();
      await cleanupOwnedFetcherQueue(state);
    }
  });

  it('accepts and removes one real pre-001C Job with both retention options absent', async () => {
    const state = requireState();
    const credentials = readComposeCredentials(state.envFile);
    const queue = new Queue('contentos-fetcher', { connection: { url: redisUrl() } });
    const gateway = new NodeFetcherGatewayClient(state.apiOrigin, credentials.CONTENTOS_FETCHER_GATEWAY_SECRET ?? '');
    const snapshots = new FetcherS3SnapshotStore({
      endpoint: `http://127.0.0.1:${state.ports.objectStorage}`,
      region: 'us-east-1',
      bucket: state.objectStorageBucket,
      forcePathStyle: true,
      accessKeyId: credentials.OBJECT_STORAGE_ACCESS_KEY ?? '',
      secretAccessKey: credentials.OBJECT_STORAGE_SECRET_KEY ?? '',
    });
    let consumer: ReturnType<typeof createFetcherQueueConsumer> | undefined;
    let captureCalls = 0;
    const taskId = randomUUID();
    try {
      const actualTransport = validationBlockedTransport();
      const orchestrator = createFetcherOrchestrator({
        gateway,
        transport: {
          async fetch(url) {
            captureCalls += 1;
            return actualTransport.fetch(url);
          },
        },
        snapshots,
      });
      consumer = createFetcherQueueConsumer(
        redisUrl(),
        async (job) => orchestrator.process(job),
        () => undefined,
      );
      await Promise.all([queue.waitUntilReady(), consumer.ready()]);
      const job = await queue.add(
        FETCHER_JOB_NAME,
        { taskId, taskKind: 'url_capture', envelopeVersion: 'fetcher-task/v1' },
        { jobId: buildFetcherTaskJobId(taskId, 1), attempts: FETCHER_JOB_ATTEMPTS },
      );
      expect(job.opts.removeOnComplete).toBeUndefined();
      expect(job.opts.removeOnFail).toBeUndefined();
      await waitForMissing(async () => queue.getJob(buildFetcherTaskJobId(taskId, 1)));
      expect(captureCalls).toBe(0);
    } finally {
      await consumer?.close(true);
      await queue.close();
      gateway.close();
      snapshots.close();
      await cleanupOwnedFetcherQueue(state);
    }
  });

  it.each([
    { label: 'definitive Result rejection', definitive: true, expectedPresent: false, expectedSubmissions: 1 },
    { label: 'ambiguous Result delivery', definitive: false, expectedPresent: true, expectedSubmissions: 2 },
  ])(
    '$label applies the scoped Snapshot ownership rule',
    async ({ definitive, expectedPresent, expectedSubmissions }) => {
      const state = requireState();
      const credentials = readComposeCredentials(state.envFile);
      const boundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
      const queue = new Queue('contentos-fetcher', { connection: { url: redisUrl() } });
      const snapshots = new FetcherS3SnapshotStore({
        endpoint: `http://127.0.0.1:${state.ports.objectStorage}`,
        region: 'us-east-1',
        bucket: state.objectStorageBucket,
        forcePathStyle: true,
        accessKeyId: credentials.OBJECT_STORAGE_ACCESS_KEY ?? '',
        secretAccessKey: credentials.OBJECT_STORAGE_SECRET_KEY ?? '',
      });
      const client = new NodeFetcherGatewayClient(state.apiOrigin, credentials.CONTENTOS_FETCHER_GATEWAY_SECRET ?? '');
      let fixture: Fixture | undefined;
      let consumer: ReturnType<typeof createFetcherQueueConsumer> | undefined;
      let publicFixture: Awaited<ReturnType<typeof startPublicTransportFixture>> | undefined;
      let storedSnapshot:
        | {
            readonly snapshotId: string;
            readonly storageKey: string;
            readonly sha256: string;
            readonly byteSize: number;
            readonly contentType: 'text/html' | 'text/plain' | 'text/markdown';
          }
        | undefined;
      let submissions = 0;
      try {
        fixture = await createFixture(boundary);
        publicFixture = await startPublicTransportFixture();
        const gateway: FetcherGatewayClient = {
          claim: (taskId, deliveryGeneration) => client.claim(taskId, deliveryGeneration),
          heartbeat: (taskId, opaqueClaim, attemptNumber) => client.heartbeat(taskId, opaqueClaim, attemptNumber),
          async submitResult(taskId, opaqueClaim, result) {
            submissions += 1;
            if (result.outcome === 'succeeded') storedSnapshot = result.snapshot;
            if (!definitive) throw new FetcherGatewayClientError('transient');
            return client.submitResult(taskId, 'B'.repeat(opaqueClaim.length), result);
          },
        };
        const orchestrator = createFetcherOrchestrator({ gateway, transport: publicFixture.transport, snapshots });
        consumer = createFetcherQueueConsumer(
          redisUrl(),
          async (job) => orchestrator.process(job),
          () => undefined,
        );
        await Promise.all([queue.waitUntilReady(), consumer.ready()]);
        await queue.add(
          FETCHER_JOB_NAME,
          { taskId: fixture.taskId, taskKind: 'url_capture', envelopeVersion: 'fetcher-task/v1' },
          {
            jobId: buildFetcherTaskJobId(fixture.taskId, 1),
            attempts: FETCHER_JOB_ATTEMPTS,
            removeOnComplete: true,
            removeOnFail: true,
          },
        );
        await waitForMissing(async () => queue.getJob(buildFetcherTaskJobId(fixture?.taskId ?? '', 1)));
        expect(storedSnapshot).toBeDefined();
        expect(submissions).toBe(expectedSubmissions);
        if (!storedSnapshot) throw new Error('snapshot fixture was not prepared');
        await expect(snapshots.readForIntegrity(storedSnapshot, AbortSignal.timeout(5_000))).resolves.toBe(
          expectedPresent,
        );
        await expect(
          boundary.query('SELECT id FROM sources WHERE content_package_id = $1', [fixture.packageId]),
        ).resolves.toEqual([]);
      } finally {
        await consumer?.close(true);
        await queue.close();
        if (fixture && storedSnapshot) {
          await snapshots
            .deleteForCompensation({
              taskId: fixture.taskId,
              attemptNumber: 1,
              snapshotId: storedSnapshot.snapshotId,
              signal: AbortSignal.timeout(5_000),
            })
            .catch(() => undefined);
        }
        if (fixture) await cleanup(boundary, fixture);
        client.close();
        snapshots.close();
        await closeServer(publicFixture?.server);
        await boundary.close();
        await cleanupOwnedFetcherQueue(state);
      }
    },
  );
});
