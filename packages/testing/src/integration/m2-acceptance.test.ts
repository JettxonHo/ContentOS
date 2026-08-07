import { spawn, type ChildProcess } from 'node:child_process';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { createServer, type Server } from 'node:http';
import { createConnection } from 'node:net';
import { join } from 'node:path';

import { buildFetcherTaskJobId, FETCHER_JOB_ATTEMPTS, FETCHER_JOB_NAME } from '@contentos/contracts';
import {
  createDatabaseRuntime,
  createUrlCaptureRepositoryTestBoundary,
  type UrlCaptureRepositoryTestBoundary,
} from '@contentos/database';
import { FetcherS3SnapshotStore } from '@contentos/object-storage';
import { Queue } from 'bullmq';
import { describe, expect, it } from 'vitest';

import { NodeFetcherGatewayClient } from '../../../../apps/fetcher/src/fetcher-gateway-client.js';
import { createFetcherOrchestrator } from '../../../../apps/fetcher/src/fetcher-orchestrator.js';
import { createFetcherQueueConsumer } from '../../../../apps/fetcher/src/fetcher-queue.js';
import type { PublicUrlTransport } from '../../../../apps/fetcher/src/public-url-transport/index.js';
import { createPublicUrlTransportForTesting } from '../../../../apps/fetcher/src/public-url-transport/test-support.js';
import { composeExec } from './compose.js';
import { readComposeCredentials, requireState, type SmokeState } from './env.js';
import { cleanupOwnedFetcherQueue } from './harness.js';
import { signedFetch } from './sigv4.js';

const PROXY_ENVIRONMENT_KEYS = [
  'HTTP_PROXY',
  'HTTPS_PROXY',
  'ALL_PROXY',
  'NO_PROXY',
  'http_proxy',
  'https_proxy',
  'all_proxy',
  'no_proxy',
  'NODE_USE_ENV_PROXY',
] as const;

interface PackageFixture {
  readonly id: string;
  readonly revision: number;
  readonly ownerUserId: string;
  readonly cookie: string;
}

interface UrlFixture extends PackageFixture {
  readonly taskId: string;
}

interface StartedProcess {
  readonly child: ChildProcess;
  readonly output: { readonly text: () => string; readonly overflowed: () => boolean };
}

function databaseUrl(state: SmokeState): string {
  const credentials = readComposeCredentials(state.envFile);
  return `postgresql://smoke_user:${encodeURIComponent(credentials.POSTGRES_PASSWORD ?? '')}@127.0.0.1:${state.ports.postgres}/smoke_db`;
}

function redisUrl(state: SmokeState): string {
  const credentials = readComposeCredentials(state.envFile);
  return `redis://:${encodeURIComponent(credentials.REDIS_PASSWORD ?? '')}@127.0.0.1:${state.ports.redis}`;
}

async function waitFor<T>(read: () => Promise<T | undefined>, predicate: (value: T) => boolean): Promise<T> {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const value = await read();
    if (value !== undefined && predicate(value)) return value;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('m2_acceptance_wait_timed_out');
}

async function waitForMissing(read: () => Promise<unknown | undefined>): Promise<void> {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if ((await read()) === undefined) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('m2_acceptance_wait_timed_out');
}

async function createSession(state: SmokeState, ownerUserId: string): Promise<string> {
  const credential = randomBytes(32).toString('base64url');
  const hash = createHash('sha256').update(credential).digest('hex');
  const inserted = await composeExec(state, 'postgres', [
    'sh',
    '-c',
    `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -tAc "INSERT INTO auth_sessions (id, credential_hash, owner_user_id, created_at, expires_at) VALUES ('${randomUUID()}', '${hash}', '${ownerUserId}', now(), now() + interval '1 hour')"`,
  ]);
  expect(inserted.ok).toBe(true);
  return `contentos_session=${credential}`;
}

async function createPackage(state: SmokeState): Promise<PackageFixture> {
  const ownerUserId = randomUUID();
  const cookie = await createSession(state, ownerUserId);
  const response = await fetch(`${state.apiOrigin}/v1/content-packages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie, origin: state.webOrigin },
    body: JSON.stringify({ title: 'M2 acceptance package', contentMode: 'creator_led', requestedOutputs: ['blog'] }),
  });
  expect(response.status).toBe(201);
  const contentPackage = (await response.json()) as { data: { contentPackage: { id: string; revision: number } } };
  return { ...contentPackage.data.contentPackage, ownerUserId, cookie };
}

async function submitUrl(state: SmokeState, submittedUrl: string): Promise<UrlFixture> {
  const contentPackage = await createPackage(state);
  const response = await fetch(`${state.apiOrigin}/v1/content-packages/${contentPackage.id}/url-capture-requests`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: contentPackage.cookie,
      origin: state.webOrigin,
      'idempotency-key': randomBytes(16).toString('hex'),
    },
    body: JSON.stringify({ expectedPackageRevision: contentPackage.revision, role: 'primary', submittedUrl }),
  });
  expect(response.status).toBe(201);
  const body = (await response.json()) as { data: { urlCaptureRequest: { taskId: string } } };
  return { ...contentPackage, taskId: body.data.urlCaptureRequest.taskId };
}

function startWorker(state: SmokeState): StartedProcess {
  const child = spawn(process.execPath, [join(state.repoRoot, 'apps', 'worker', 'dist', 'main.js')], {
    cwd: join(state.repoRoot, 'apps', 'worker'),
    env: { ...process.env, CONTENTOS_ENV: 'test', DATABASE_URL: databaseUrl(state), REDIS_URL: redisUrl(state) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return collectOutput(child);
}

function fetcherEnvironment(state: SmokeState): NodeJS.ProcessEnv {
  const credentials = readComposeCredentials(state.envFile);
  const environment: NodeJS.ProcessEnv = {
    ...process.env,
    CONTENTOS_ENV: 'test',
    CONTENTOS_FETCHER_GATEWAY_SECRET: credentials.CONTENTOS_FETCHER_GATEWAY_SECRET,
    CONTENTOS_FETCHER_GATEWAY_API_ORIGIN: state.apiOrigin,
    CONTENTOS_FETCHER_REDIS_URL: redisUrl(state),
    CONTENTOS_FETCHER_OBJECT_STORAGE_ENDPOINT: `http://127.0.0.1:${state.ports.objectStorage}`,
    CONTENTOS_FETCHER_OBJECT_STORAGE_BUCKET: state.objectStorageBucket,
    CONTENTOS_FETCHER_OBJECT_STORAGE_ACCESS_KEY: credentials.OBJECT_STORAGE_ACCESS_KEY,
    CONTENTOS_FETCHER_OBJECT_STORAGE_SECRET_KEY: credentials.OBJECT_STORAGE_SECRET_KEY,
  };
  for (const key of PROXY_ENVIRONMENT_KEYS) delete environment[key];
  delete environment.DATABASE_URL;
  if (environment.NODE_OPTIONS?.includes('--use-env-proxy')) delete environment.NODE_OPTIONS;
  return environment;
}

function startFetcher(state: SmokeState): StartedProcess {
  const environment = fetcherEnvironment(state);
  expect(environment.DATABASE_URL).toBeUndefined();
  expect(environment.NODE_OPTIONS ?? '').not.toContain('--use-env-proxy');
  for (const key of PROXY_ENVIRONMENT_KEYS) expect(environment[key]).toBeUndefined();
  const child = spawn(process.execPath, [join(state.repoRoot, 'apps', 'fetcher', 'dist', 'main.js')], {
    cwd: join(state.repoRoot, 'apps', 'fetcher'),
    env: environment,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return collectOutput(child);
}

function collectOutput(child: ChildProcess): StartedProcess {
  let output = '';
  let overflowed = false;
  const append = (chunk: string): void => {
    if (overflowed) return;
    if (output.length + chunk.length > 8_192) {
      overflowed = true;
      return;
    }
    output += chunk;
  };
  child.stdout?.setEncoding('utf8');
  child.stderr?.setEncoding('utf8');
  child.stdout?.on('data', append);
  child.stderr?.on('data', append);
  return { child, output: { text: () => output, overflowed: () => overflowed } };
}

async function stopProcess(process: StartedProcess | undefined): Promise<void> {
  const child = process?.child;
  if (!child) return;
  if (child.exitCode !== null || child.signalCode !== null) {
    expect(child.exitCode).toBe(0);
    expect(child.signalCode).toBeNull();
    return;
  }
  const closed = new Promise<void>((resolve) => child.once('close', () => resolve()));
  child.kill('SIGTERM');
  const killTimer = setTimeout(() => child.kill('SIGKILL'), 10_000);
  try {
    await closed;
  } finally {
    clearTimeout(killTimer);
  }
  expect(child.exitCode).toBe(0);
}

async function startPublicTransportFixture(): Promise<{
  readonly server: Server;
  readonly transport: PublicUrlTransport;
  readonly requests: string[];
  readonly html: string;
}> {
  const requests: string[] = [];
  const html = '<main>Raw M2 acceptance HTML</main>';
  const server = createServer((request, response) => {
    requests.push(request.url ?? '');
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(html);
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (address === null || typeof address === 'string') throw new Error('m2_public_fixture_bind_failed');
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
  return { server, transport, requests, html };
}

async function closeServer(server: Server | undefined): Promise<void> {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('m2_public_fixture_close_timed_out')), 10_000);
    server.close((error) => {
      clearTimeout(timer);
      if (error) reject(error);
      else resolve();
    });
  });
}

async function listObjectKeys(state: SmokeState): Promise<readonly string[]> {
  const credentials = readComposeCredentials(state.envFile);
  const response = await signedFetch({
    method: 'GET',
    url: `http://127.0.0.1:${state.ports.objectStorage}/${state.objectStorageBucket}?list-type=2`,
    credentials: {
      accessKeyId: credentials.OBJECT_STORAGE_ACCESS_KEY ?? '',
      secretAccessKey: credentials.OBJECT_STORAGE_SECRET_KEY ?? '',
    },
  });
  expect(response.status).toBe(200);
  return Array.from((await response.text()).matchAll(/<Key>([^<]+)<\/Key>/g)).map((match) => match[1] as string);
}

async function deleteTaskSnapshotObjects(state: SmokeState, taskId: string | undefined): Promise<void> {
  if (!taskId) return;
  const credentials = readComposeCredentials(state.envFile);
  const prefix = `fetcher/url-capture/${taskId}/`;
  const keys = (await listObjectKeys(state)).filter((key) => key.startsWith(prefix));
  for (const key of keys) {
    const path = key
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    const response = await signedFetch({
      method: 'DELETE',
      url: `http://127.0.0.1:${state.ports.objectStorage}/${state.objectStorageBucket}/${path}`,
      credentials: {
        accessKeyId: credentials.OBJECT_STORAGE_ACCESS_KEY ?? '',
        secretAccessKey: credentials.OBJECT_STORAGE_SECRET_KEY ?? '',
      },
    });
    expect(response.ok).toBe(true);
  }
}

function containsSensitiveValue(text: string, values: readonly string[]): boolean {
  return values.some((value) => value.length > 0 && text.includes(value));
}

async function runCleanup(steps: readonly [string, () => Promise<void> | void][]): Promise<void> {
  const failed: string[] = [];
  for (const [label, step] of steps) {
    try {
      await step();
    } catch {
      failed.push(label);
    }
  }
  if (failed.length > 0) throw new Error(`m2_acceptance_cleanup_failed:${failed.join(',')}`);
}

async function cleanupPackage(boundary: UrlCaptureRepositoryTestBoundary, packageId: string): Promise<void> {
  await boundary.query('DELETE FROM url_capture_results WHERE content_package_id = $1', [packageId]);
  await boundary.query(
    'DELETE FROM source_approvals WHERE source_id IN (SELECT id FROM sources WHERE content_package_id = $1)',
    [packageId],
  );
  await boundary.query(
    'DELETE FROM source_heads WHERE source_id IN (SELECT id FROM sources WHERE content_package_id = $1)',
    [packageId],
  );
  await boundary.query(
    'DELETE FROM source_working_copies WHERE source_id IN (SELECT id FROM sources WHERE content_package_id = $1)',
    [packageId],
  );
  await boundary.query(
    'DELETE FROM source_versions WHERE source_id IN (SELECT id FROM sources WHERE content_package_id = $1)',
    [packageId],
  );
  await boundary.query(
    'DELETE FROM source_raw_snapshots WHERE source_id IN (SELECT id FROM sources WHERE content_package_id = $1)',
    [packageId],
  );
  await boundary.query('DELETE FROM sources WHERE content_package_id = $1', [packageId]);
  await boundary.query('DELETE FROM workflow_outbox_records WHERE content_package_id = $1', [packageId]);
  await boundary.query('DELETE FROM workflow_tasks WHERE content_package_id = $1', [packageId]);
  await boundary.query('DELETE FROM url_capture_requests WHERE content_package_id = $1', [packageId]);
  await boundary.query('DELETE FROM url_source_references WHERE content_package_id = $1', [packageId]);
  await boundary.query('ALTER TABLE workflow_events DISABLE TRIGGER workflow_events_immutable_trigger');
  try {
    await boundary.query('DELETE FROM workflow_events WHERE content_package_id = $1', [packageId]);
  } finally {
    await boundary.query('ALTER TABLE workflow_events ENABLE TRIGGER workflow_events_immutable_trigger');
  }
  await boundary.query('DELETE FROM workflow_nodes WHERE content_package_id = $1', [packageId]);
  await boundary.query('DELETE FROM workflow_instances WHERE content_package_id = $1', [packageId]);
  await boundary.query('DELETE FROM content_packages WHERE id = $1', [packageId]);
}

describe('M2 acceptance harness', () => {
  it('continues an authenticated URL command through Worker, Fetcher, approval, owner reads, and terminal redelivery', async () => {
    const state = requireState();
    const credentials = readComposeCredentials(state.envFile);
    const boundary = createUrlCaptureRepositoryTestBoundary(databaseUrl(state));
    const queue = new Queue('contentos-fetcher', { connection: { url: redisUrl(state) } });
    const snapshots = new FetcherS3SnapshotStore({
      endpoint: `http://127.0.0.1:${state.ports.objectStorage}`,
      region: 'us-east-1',
      bucket: state.objectStorageBucket,
      forcePathStyle: true,
      accessKeyId: credentials.OBJECT_STORAGE_ACCESS_KEY ?? '',
      secretAccessKey: credentials.OBJECT_STORAGE_SECRET_KEY ?? '',
    });
    let fixture: UrlFixture | undefined;
    let worker: StartedProcess | undefined;
    let consumer: ReturnType<typeof createFetcherQueueConsumer> | undefined;
    let gateway: NodeFetcherGatewayClient | undefined;
    let approvedInputRuntime: ReturnType<typeof createDatabaseRuntime> | undefined;
    let publicFixture: Awaited<ReturnType<typeof startPublicTransportFixture>> | undefined;
    let snapshot: { taskId: string; attemptNumber: number; snapshotId: string } | undefined;
    try {
      fixture = await submitUrl(state, 'http://m2-acceptance.test/article');
      worker = startWorker(state);
      await queue.waitUntilReady();
      const jobId = buildFetcherTaskJobId(fixture.taskId, 1);
      const job = await waitFor(
        () => queue.getJob(jobId),
        (value) => value !== undefined,
      );
      expect(job.data).toEqual({ taskId: fixture.taskId, taskKind: 'url_capture', envelopeVersion: 'fetcher-task/v1' });
      expect(job.opts.attempts).toBe(FETCHER_JOB_ATTEMPTS);
      publicFixture = await startPublicTransportFixture();
      gateway = new NodeFetcherGatewayClient(state.apiOrigin, credentials.CONTENTOS_FETCHER_GATEWAY_SECRET ?? '');
      consumer = createFetcherQueueConsumer(
        redisUrl(state),
        async (queueJob) =>
          createFetcherOrchestrator({ gateway: gateway!, transport: publicFixture!.transport, snapshots }).process(
            queueJob,
          ),
        () => undefined,
      );
      await consumer.ready();
      const terminal = await waitFor(
        async () =>
          (
            await boundary.query<{ state: string }>('SELECT state FROM workflow_tasks WHERE id = $1', [fixture!.taskId])
          )[0],
        (task) => task.state === 'succeeded',
      );
      expect(terminal).toEqual({ state: 'succeeded' });
      expect(publicFixture.requests).toEqual(['/article']);
      await waitForMissing(() => queue.getJob(jobId));

      const [source] = await boundary.query<{ id: string; body: { text: string } }>(
        `SELECT s.id, w.body FROM sources s JOIN source_working_copies w ON w.source_id = s.id WHERE s.content_package_id = $1`,
        [fixture.id],
      );
      expect(source?.body).toEqual({ text: 'Raw M2 acceptance HTML' });
      const [rawSnapshot] = await boundary.query<{ id: string; storage_key: string; attempt_number: number }>(
        `SELECT r.id, r.storage_key, u.attempt_number
         FROM source_raw_snapshots r
         JOIN sources s ON s.id = r.source_id
         JOIN url_capture_results u ON u.content_package_id = s.content_package_id
         WHERE s.content_package_id = $1`,
        [fixture.id],
      );
      expect(rawSnapshot).toBeDefined();
      snapshot = { taskId: fixture.taskId, attemptNumber: rawSnapshot!.attempt_number, snapshotId: rawSnapshot!.id };
      const raw = await signedFetch({
        method: 'GET',
        url: `http://127.0.0.1:${state.ports.objectStorage}/${state.objectStorageBucket}/${rawSnapshot!.storage_key}`,
        credentials: {
          accessKeyId: credentials.OBJECT_STORAGE_ACCESS_KEY ?? '',
          secretAccessKey: credentials.OBJECT_STORAGE_SECRET_KEY ?? '',
        },
      });
      expect(await raw.text()).toBe(publicFixture.html);

      const version = await fetch(
        `${state.apiOrigin}/v1/content-packages/${fixture.id}/sources/${source!.id}/versions`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie: fixture.cookie, origin: state.webOrigin },
          body: JSON.stringify({ expectedRevision: 1 }),
        },
      );
      expect(version.status).toBe(201);
      const versionId = ((await version.json()) as { data: { version: { id: string } } }).data.version.id;
      const approval = await fetch(
        `${state.apiOrigin}/v1/content-packages/${fixture.id}/sources/${source!.id}/approval`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie: fixture.cookie, origin: state.webOrigin },
          body: JSON.stringify({ versionId }),
        },
      );
      expect(approval.status).toBe(200);
      approvedInputRuntime = createDatabaseRuntime(databaseUrl(state));
      const approved = await approvedInputRuntime.approvedSourceInputs.listCurrentForPackage({
        contentPackageId: fixture.id as never,
        ownerUserId: fixture.ownerUserId as never,
      });
      expect(approved).toEqual([
        expect.objectContaining({
          sourceId: source!.id,
          sourceVersionId: versionId,
          role: 'primary',
          body: { text: 'Raw M2 acceptance HTML' },
        }),
      ]);
      const [workflow, timeline] = await Promise.all([
        fetch(`${state.apiOrigin}/v1/content-packages/${fixture.id}/workflow`, { headers: { cookie: fixture.cookie } }),
        fetch(`${state.apiOrigin}/v1/content-packages/${fixture.id}/workflow/events`, {
          headers: { cookie: fixture.cookie },
        }),
      ]);
      expect(workflow.status).toBe(200);
      expect(timeline.status).toBe(200);
      const workflowBody = (await workflow.json()) as {
        data: { workflow: { nodes: Array<{ key: string; state: string; task: { state: string } | null }> } };
      };
      const timelineBody = (await timeline.json()) as {
        data: { items: Array<{ sequence: number; kind: string; attemptNumber?: number }> };
      };
      expect(workflowBody.data.workflow.nodes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: 'source_capture', state: 'completed' }),
          expect.objectContaining({ key: 'source_review', state: 'awaiting_human' }),
        ]),
      );
      expect(workflowBody.data.workflow.nodes.find((node) => node.key === 'source_capture')?.task).toMatchObject({
        state: 'succeeded',
      });
      expect(timelineBody.data.items).toEqual([
        expect.objectContaining({ sequence: 1, kind: 'url_capture_requested.v1' }),
        expect.objectContaining({ sequence: 2, kind: 'url_capture_succeeded.v1', attemptNumber: 1 }),
      ]);
      const safeReads = JSON.stringify({ workflow: workflowBody, timeline: timelineBody });
      expect(containsSensitiveValue(safeReads, [rawSnapshot!.storage_key, fixture.taskId, 'm2-acceptance.test'])).toBe(
        false,
      );

      await queue.add(FETCHER_JOB_NAME, job.data, {
        jobId,
        attempts: FETCHER_JOB_ATTEMPTS,
        removeOnComplete: true,
        removeOnFail: true,
      });
      await waitForMissing(() => queue.getJob(jobId));
      expect(publicFixture.requests).toEqual(['/article']);
      await expect(
        boundary.query<{
          results: string;
          sources: string;
          snapshots: string;
          working_copies: string;
          heads: string;
          versions: string;
          approvals: string;
          terminal_events: string;
          promotions: string;
        }>(
          `SELECT (SELECT count(*) FROM url_capture_results WHERE content_package_id = $1)::text AS results,
             (SELECT count(*) FROM sources WHERE content_package_id = $1)::text AS sources,
             (SELECT count(*) FROM source_raw_snapshots r JOIN sources s ON s.id = r.source_id WHERE s.content_package_id = $1)::text AS snapshots,
             (SELECT count(*) FROM source_working_copies w JOIN sources s ON s.id = w.source_id WHERE s.content_package_id = $1)::text AS working_copies,
             (SELECT count(*) FROM source_heads h JOIN sources s ON s.id = h.source_id WHERE s.content_package_id = $1)::text AS heads,
             (SELECT count(*) FROM source_versions v JOIN sources s ON s.id = v.source_id WHERE s.content_package_id = $1)::text AS versions,
             (SELECT count(*) FROM source_approvals a JOIN sources s ON s.id = a.source_id WHERE s.content_package_id = $1)::text AS approvals,
             (SELECT count(*) FROM workflow_events WHERE content_package_id = $1 AND event_type IN ('url_capture_succeeded.v1', 'url_capture_failed.v1'))::text AS terminal_events,
             (SELECT count(*) FROM url_capture_results WHERE content_package_id = $1 AND recorded_outcome = 'succeeded')::text AS promotions`,
          [fixture.id],
        ),
      ).resolves.toEqual([
        {
          results: '1',
          sources: '1',
          snapshots: '1',
          working_copies: '1',
          heads: '1',
          versions: '1',
          approvals: '1',
          terminal_events: '1',
          promotions: '1',
        },
      ]);
    } finally {
      await runCleanup([
        ['consumer', () => consumer?.close(true)],
        ['worker', () => stopProcess(worker)],
        ['queue', () => queue.close()],
        [
          'snapshot',
          () => snapshot && snapshots.deleteForCompensation({ ...snapshot, signal: AbortSignal.timeout(5_000) }),
        ],
        ['task-snapshot-prefix', () => deleteTaskSnapshotObjects(state, fixture?.taskId)],
        ['approved-input-runtime', () => approvedInputRuntime?.close()],
        ['package', () => fixture && cleanupPackage(boundary, fixture.id)],
        ['gateway', () => gateway?.close()],
        ['snapshot-store', () => snapshots.close()],
        ['http-fixture', () => closeServer(publicFixture?.server)],
        ['repository', () => boundary.close()],
        ['queue-residue', () => cleanupOwnedFetcherQueue(state)],
      ]);
    }
  });

  it('runs unmodified Worker and Fetcher processes that fail closed for loopback without Source evidence', async () => {
    const state = requireState();
    const credentials = readComposeCredentials(state.envFile);
    const boundary = createUrlCaptureRepositoryTestBoundary(databaseUrl(state));
    let fixture: UrlFixture | undefined;
    let worker: StartedProcess | undefined;
    let fetcher: StartedProcess | undefined;
    try {
      fixture = await submitUrl(state, 'http://127.0.0.1:9/m2-loopback-denial');
      fetcher = startFetcher(state);
      worker = startWorker(state);
      const result = await waitFor(
        async () =>
          (
            await boundary.query<{ state: string; recorded_category: string | null; safe_code: string | null }>(
              `SELECT t.state, r.recorded_category, r.safe_code FROM workflow_tasks t LEFT JOIN url_capture_results r ON r.task_id = t.id WHERE t.id = $1`,
              [fixture!.taskId],
            )
          )[0],
        (value) => value.state === 'failed',
      );
      expect(result).toEqual({
        state: 'failed',
        recorded_category: 'validation_blocked',
        safe_code: 'VALIDATION_BLOCKED',
      });
      await expect(
        boundary.query<{ sources: string; snapshots: string }>(
          `SELECT (SELECT count(*) FROM sources WHERE content_package_id = $1)::text AS sources,
             (SELECT count(*) FROM source_raw_snapshots r JOIN sources s ON s.id = r.source_id WHERE s.content_package_id = $1)::text AS snapshots`,
          [fixture.id],
        ),
      ).resolves.toEqual([{ sources: '0', snapshots: '0' }]);
      expect(
        (await listObjectKeys(state)).some((key) => key.startsWith(`fetcher/url-capture/${fixture!.taskId}/`)),
      ).toBe(false);
      await stopProcess(fetcher);
      await stopProcess(worker);
      expect(worker.output.overflowed()).toBe(false);
      expect(fetcher.output.overflowed()).toBe(false);
      const output = `${worker.output.text()}\n${fetcher.output.text()}`;
      expect(output.length).toBeLessThanOrEqual(16_385);
      expect(
        containsSensitiveValue(output, [
          'http://127.0.0.1:9/m2-loopback-denial',
          credentials.CONTENTOS_FETCHER_GATEWAY_SECRET ?? '',
          credentials.OBJECT_STORAGE_ACCESS_KEY ?? '',
          credentials.OBJECT_STORAGE_SECRET_KEY ?? '',
          credentials.POSTGRES_PASSWORD ?? '',
          credentials.REDIS_PASSWORD ?? '',
          databaseUrl(state),
          redisUrl(state),
        ]),
      ).toBe(false);
      expect(/stack|postgresql:\/\//i.test(output)).toBe(false);
    } finally {
      await runCleanup([
        ['fetcher', () => stopProcess(fetcher)],
        ['worker', () => stopProcess(worker)],
        ['task-snapshot-prefix', () => deleteTaskSnapshotObjects(state, fixture?.taskId)],
        ['package', () => fixture && cleanupPackage(boundary, fixture.id)],
        ['repository', () => boundary.close()],
        ['queue-residue', () => cleanupOwnedFetcherQueue(state)],
      ]);
    }
  });
});
