import { spawn, type ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

import { Queue } from 'bullmq';
import { afterEach, describe, expect, it } from 'vitest';

import {
  hashFetcherGatewayClaim,
  UrlCaptureService,
  type ContentPackageId,
  type ContentPackageOwnerId,
  type UrlCaptureIdGenerator,
} from '@contentos/core';
import { createUrlCaptureRepositoryTestBoundary, type UrlCaptureRepositoryTestBoundary } from '@contentos/database';

import { readComposeCredentials, requireState } from './env.js';
import { cleanupOwnedFetcherQueue } from './harness.js';

const INVALID_JOB_CONTRACTS = [
  {
    label: 'wrong name',
    name: 'wrong-name',
    data: { taskId: 'task-placeholder', taskKind: 'url_capture', envelopeVersion: 'fetcher-task/v1' },
    attempts: 1,
  },
  {
    label: 'extra payload field',
    name: 'fetcher-task',
    data: {
      taskId: 'task-placeholder',
      taskKind: 'url_capture',
      envelopeVersion: 'fetcher-task/v1',
      extra: 'must remain untouched',
    },
    attempts: 1,
  },
  {
    label: 'wrong envelope',
    name: 'fetcher-task',
    data: { taskId: 'task-placeholder', taskKind: 'url_capture', envelopeVersion: 'fetcher-task/v2' },
    attempts: 1,
  },
  {
    label: 'wrong attempts',
    name: 'fetcher-task',
    data: { taskId: 'task-placeholder', taskKind: 'url_capture', envelopeVersion: 'fetcher-task/v1' },
    attempts: 2,
  },
] as const;

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
  readonly outboxId: string;
}> {
  const ownerUserId = randomUUID() as ContentPackageOwnerId;
  const packageId = randomUUID() as ContentPackageId;
  const createdAt = new Date();
  await boundary.query(
    `INSERT INTO content_packages
      (id, owner_user_id, title, description, content_mode, requested_blog, requested_xiaohongshu,
       lifecycle, revision, created_at, updated_at, archived_at)
     VALUES ($1, $2, 'Worker integration package', NULL, 'creator_led', true, true, 'active', 1, now(), now(), NULL)`,
    [packageId, ownerUserId],
  );
  const result = await new UrlCaptureService(boundary.repository, ids(), {
    now: () => new Date(createdAt.getTime()),
  }).submit({
    contentPackageId: packageId,
    ownerUserId,
    expectedPackageRevision: 1,
    role: 'primary',
    submittedUrl: 'https://example.com/worker',
    idempotencyKey: randomUUID().replaceAll('-', '').slice(0, 16),
  });
  const rows = await boundary.query<{ id: string }>('SELECT id FROM workflow_outbox_records WHERE task_id = $1', [
    result.taskId,
  ]);
  if (!rows[0]) throw new Error('worker integration outbox is missing');
  return { packageId, taskId: result.taskId, outboxId: rows[0].id };
}

async function cleanupTask(boundary: UrlCaptureRepositoryTestBoundary, packageId: ContentPackageId): Promise<void> {
  await boundary.query('BEGIN');
  try {
    for (const table of [
      'workflow_outbox_records',
      'workflow_tasks',
      'url_capture_requests',
      'url_source_references',
    ]) {
      await boundary.query(`DELETE FROM ${table} WHERE content_package_id = $1`, [packageId]);
    }
    await boundary.query('ALTER TABLE workflow_events DISABLE TRIGGER workflow_events_immutable_trigger');
    await boundary.query('DELETE FROM workflow_events WHERE content_package_id = $1', [packageId]);
    await boundary.query('ALTER TABLE workflow_events ENABLE TRIGGER workflow_events_immutable_trigger');
    await boundary.query('DELETE FROM workflow_nodes WHERE content_package_id = $1', [packageId]);
    await boundary.query('DELETE FROM workflow_instances WHERE content_package_id = $1', [packageId]);
    await boundary.query('DELETE FROM content_packages WHERE id = $1', [packageId]);
    await boundary.query('COMMIT');
  } catch (error) {
    await boundary.query('ROLLBACK');
    throw error;
  }
}

async function waitFor<T>(
  read: () => Promise<T | undefined>,
  predicate: (value: T) => boolean,
  diagnostic?: () => string,
): Promise<T> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const value = await read();
    if (value !== undefined && predicate(value)) return value;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`worker integration wait timed out${diagnostic ? `: ${diagnostic()}` : ''}`);
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

// Each test stops its Worker and obliterates the queue, but a BullMQ
// `obliterate` can leave the `meta` marker behind under load. Verify no owned
// `contentos-fetcher` key survives any test here (redis.test.ts asserts the
// database holds zero keys).
afterEach(async () => {
  await cleanupOwnedFetcherQueue(requireState());
});

describe('M2-WF-003A Worker integration', () => {
  it('dispatches the exact envelope, keeps Task queued, and repairs a missing current Job', async () => {
    const boundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const queue = new Queue('contentos-fetcher', { connection: { url: redisUrl() } });
    const worker = startWorker();
    let fixture: Awaited<ReturnType<typeof createTask>> | undefined;
    try {
      fixture = await createTask(boundary);
      await queue.waitUntilReady();
      const jobId = `fetcher-${fixture.taskId}-1`;
      const job = await waitFor(
        () => queue.getJob(jobId),
        (value) => value !== undefined,
        () => `worker stdout=${worker.stdout.join('').trim()} stderr=${worker.stderr.join('').trim()}`,
      );
      const outboxId = fixture.outboxId;
      expect(job.name).toBe('fetcher-task');
      expect(job.data).toEqual({ taskId: fixture.taskId, taskKind: 'url_capture', envelopeVersion: 'fetcher-task/v1' });
      expect(job.opts.attempts).toBe(1);
      expect(job.opts.removeOnComplete).toBe(true);
      expect(job.opts.removeOnFail).toBe(true);
      expect(JSON.stringify(job.data)).not.toContain('worker');

      const ledger = await waitFor(
        () =>
          boundary.query<{
            state: string;
            delivery_generation: number;
            dispatch_attempt_count: number;
          }>('SELECT state, delivery_generation, dispatch_attempt_count FROM workflow_outbox_records WHERE id = $1', [
            outboxId,
          ]),
        (rows) => rows[0]?.state === 'dispatched',
        () => `worker stdout=${worker.stdout.join('').trim()} stderr=${worker.stderr.join('').trim()}`,
      );
      expect(ledger[0]).toEqual({ state: 'dispatched', delivery_generation: 1, dispatch_attempt_count: 1 });
      expect(
        (
          await boundary.query<{ state: string }>('SELECT state FROM workflow_tasks WHERE id = $1', [fixture.taskId])
        )[0],
      ).toEqual({ state: 'queued' });

      await job.remove();
      const repaired = await waitFor(
        () => queue.getJob(jobId),
        (value) => value !== undefined,
      );
      expect(repaired.id).toBe(jobId);
      expect(repaired.data).toEqual(job.data);
      expect(repaired.opts.removeOnComplete).toBe(true);
      expect(repaired.opts.removeOnFail).toBe(true);
      const repairedLedger = await waitFor(
        () => boundary.query<{ state: string }>('SELECT state FROM workflow_outbox_records WHERE id = $1', [outboxId]),
        (rows) => rows[0]?.state === 'dispatched',
        () => `worker stdout=${worker.stdout.join('').trim()} stderr=${worker.stderr.join('').trim()}`,
      );
      expect(repairedLedger[0]).toEqual({ state: 'dispatched' });
    } finally {
      const jobId = fixture ? `fetcher-${fixture.taskId}-1` : undefined;
      if (jobId) {
        const job = await queue.getJob(jobId);
        if (job) await job.remove();
      }
      await stopWorker(worker.child).catch(() => {
        if (worker.child.exitCode === null && worker.child.signalCode === null) worker.child.kill('SIGKILL');
      });
      await queue.obliterate({ force: true });
      await queue.close();
      if (fixture) await cleanupTask(boundary, fixture.packageId);
      await boundary.close();
    }
  });

  it('recovers an expired lease and dispatches generation N+1 while retaining the old Job', async () => {
    const boundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const queue = new Queue('contentos-fetcher', { connection: { url: redisUrl() } });
    const worker = startWorker();
    let fixture: Awaited<ReturnType<typeof createTask>> | undefined;
    let oldJobId = '';
    let newJobId = '';
    const claim = 'A'.repeat(43);
    try {
      fixture = await createTask(boundary);
      await queue.waitUntilReady();
      oldJobId = `fetcher-${fixture.taskId}-1`;
      await waitFor(
        () => queue.getJob(oldJobId),
        (value) => value !== undefined,
      );
      const recoveryAt = new Date(Date.now() - 1_000);
      const startedAt = new Date(recoveryAt.getTime() - 60_000);
      await boundary.query(
        `UPDATE workflow_tasks
         SET state = 'leased',
             claim_attempt_number = 1,
             claim_hash = $2,
             claimed_by = 'fetcher',
             lease_started_at = $3,
             lease_expires_at = $4,
             lease_heartbeat_at = $3,
             updated_at = $3
         WHERE id = $1`,
        [fixture.taskId, hashFetcherGatewayClaim(claim), startedAt, recoveryAt],
      );
      newJobId = `fetcher-${fixture.taskId}-2`;

      const newJob = await waitFor(
        () => queue.getJob(newJobId),
        (value) => value !== undefined,
        () => `worker stdout=${worker.stdout.join('').trim()} stderr=${worker.stderr.join('').trim()}`,
      );
      expect(newJob.name).toBe('fetcher-task');
      expect(newJob.data).toEqual({
        taskId: fixture.taskId,
        taskKind: 'url_capture',
        envelopeVersion: 'fetcher-task/v1',
      });
      expect(newJob.opts.attempts).toBe(1);
      expect(newJob.opts.removeOnComplete).toBe(true);
      expect(newJob.opts.removeOnFail).toBe(true);
      expect(await queue.getJob(oldJobId)).toBeDefined();

      const task = await boundary.query<{
        state: string;
        claim_attempt_number: number;
        claim_hash: string | null;
        lease_expires_at: Date | null;
      }>('SELECT state, claim_attempt_number, claim_hash, lease_expires_at FROM workflow_tasks WHERE id = $1', [
        fixture.taskId,
      ]);
      expect(task[0]).toEqual({ state: 'queued', claim_attempt_number: 1, claim_hash: null, lease_expires_at: null });
      const ledger = await boundary.query<{
        state: string;
        delivery_generation: number;
        dispatch_attempt_count: number;
        last_dispatch_at: Date | null;
        dispatched_at: Date | null;
      }>(
        `SELECT state, delivery_generation, dispatch_attempt_count, last_dispatch_at, dispatched_at
         FROM workflow_outbox_records WHERE id = $1`,
        [fixture.outboxId],
      );
      expect(ledger[0]).toMatchObject({
        state: 'dispatched',
        delivery_generation: 2,
        dispatch_attempt_count: 2,
        last_dispatch_at: expect.any(Date),
        dispatched_at: expect.any(Date),
      });
      const events = await boundary.query<{ event_type: string; payload: Record<string, unknown> }>(
        `SELECT event_type, payload FROM workflow_events
         WHERE content_package_id = $1 AND event_type = 'fetcher_lease_expired.v1'`,
        [fixture.packageId],
      );
      expect(events).toEqual([
        {
          event_type: 'fetcher_lease_expired.v1',
          payload: {
            taskId: fixture.taskId,
            claimAttemptNumber: 1,
            previousDeliveryGeneration: 1,
            nextDeliveryGeneration: 2,
          },
        },
      ]);
    } finally {
      for (const jobId of [oldJobId, newJobId]) {
        if (!jobId) continue;
        const job = await queue.getJob(jobId);
        if (job) await job.remove();
      }
      await stopWorker(worker.child).catch(() => {
        if (worker.child.exitCode === null && worker.child.signalCode === null) worker.child.kill('SIGKILL');
      });
      await queue.obliterate({ force: true });
      await queue.close();
      if (fixture) await cleanupTask(boundary, fixture.packageId);
      await boundary.close();
    }
  });

  it('fairly repairs a missing Job beyond the first ten reconciliation rows', async () => {
    const boundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const queue = new Queue('contentos-fetcher', { connection: { url: redisUrl() } });
    const worker = startWorker();
    const fixtures: Awaited<ReturnType<typeof createTask>>[] = [];
    try {
      for (let index = 0; index < 11; index += 1) fixtures.push(await createTask(boundary));
      await queue.waitUntilReady();

      await waitFor(
        async () =>
          boundary.query<{ state: string }>(`SELECT state FROM workflow_outbox_records WHERE id = ANY($1::uuid[])`, [
            fixtures.map((fixture) => fixture.outboxId),
          ]),
        (rows) => rows.length === 11 && rows.every((row) => row.state === 'dispatched'),
        () => `worker stdout=${worker.stdout.join('').trim()} stderr=${worker.stderr.join('').trim()}`,
      );

      const ordered = await boundary.query<{ task_id: string; dispatched_at: Date }>(
        `SELECT task_id, dispatched_at
         FROM workflow_outbox_records
         WHERE id = ANY($1::uuid[])
         ORDER BY dispatched_at, id`,
        [fixtures.map((fixture) => fixture.outboxId)],
      );
      const targetTaskId = ordered[10]?.task_id;
      if (!targetTaskId) throw new Error('fairness fixture did not produce an eleventh dispatched row');
      const target = fixtures.find((fixture) => fixture.taskId === targetTaskId);
      if (!target) throw new Error('fairness fixture target task is missing');

      const targetJobId = `fetcher-${target.taskId}-1`;
      const targetJob = await queue.getJob(targetJobId);
      if (!targetJob) throw new Error('fairness fixture target Job is missing before removal');
      await targetJob.remove();

      const repairedJob = await waitFor(
        () => queue.getJob(targetJobId),
        (value) => value !== undefined,
        () => `worker stdout=${worker.stdout.join('').trim()} stderr=${worker.stderr.join('').trim()}`,
      );
      expect(repairedJob.id).toBe(targetJobId);
      expect(repairedJob.data).toEqual(targetJob.data);
      const repairedLedger = await waitFor(
        () =>
          boundary.query<{
            state: string;
            delivery_generation: number;
            dispatch_attempt_count: number;
          }>(
            `SELECT state, delivery_generation, dispatch_attempt_count
             FROM workflow_outbox_records WHERE id = $1`,
            [target.outboxId],
          ),
        (rows) => rows[0]?.state === 'dispatched',
        () => `worker stdout=${worker.stdout.join('').trim()} stderr=${worker.stderr.join('').trim()}`,
      );
      expect(repairedLedger[0]).toEqual({ state: 'dispatched', delivery_generation: 1, dispatch_attempt_count: 2 });
    } finally {
      for (const fixture of fixtures) {
        const job = await queue.getJob(`fetcher-${fixture.taskId}-1`);
        if (job) await job.remove();
      }
      await stopWorker(worker.child).catch(() => {
        if (worker.child.exitCode === null && worker.child.signalCode === null) worker.child.kill('SIGKILL');
      });
      await queue.obliterate({ force: true });
      await queue.close();
      for (const fixture of fixtures) await cleanupTask(boundary, fixture.packageId);
      await boundary.close();
    }
  });

  it.each(INVALID_JOB_CONTRACTS)('returns a $label duplicate Job to pending without mutating it', async (contract) => {
    const boundary = createUrlCaptureRepositoryTestBoundary(databaseUrl());
    const queue = new Queue('contentos-fetcher', { connection: { url: redisUrl() } });
    let fixture: Awaited<ReturnType<typeof createTask>> | undefined;
    let worker: StartedWorker | undefined;
    let jobId = '';
    try {
      fixture = await createTask(boundary);
      jobId = `fetcher-${fixture.taskId}-1`;
      await queue.waitUntilReady();
      const existing = await queue.add(
        contract.name,
        { ...contract.data, taskId: fixture.taskId },
        { jobId, attempts: contract.attempts },
      );
      worker = startWorker();
      const ledger = await waitFor(
        () =>
          boundary.query<{ state: string; dispatch_lease_expires_at: Date | null }>(
            'SELECT state, dispatch_lease_expires_at FROM workflow_outbox_records WHERE id = $1',
            [fixture?.outboxId],
          ),
        (rows) => rows[0]?.state === 'pending',
        () => `worker stdout=${worker?.stdout.join('').trim()} stderr=${worker?.stderr.join('').trim()}`,
      );
      expect(ledger[0]).toEqual({ state: 'pending', dispatch_lease_expires_at: null });
      const untouched = await queue.getJob(jobId);
      expect(untouched?.name).toBe(existing.name);
      expect(untouched?.data).toEqual(existing.data);
      expect(untouched?.opts.attempts).toBe(existing.opts.attempts);
    } finally {
      if (jobId) {
        const job = await queue.getJob(jobId);
        if (job) await job.remove();
      }
      if (worker) {
        await stopWorker(worker.child).catch(() => {
          if (worker?.child.exitCode === null && worker.child.signalCode === null) worker.child.kill('SIGKILL');
        });
      }
      await queue.obliterate({ force: true });
      await queue.close();
      if (fixture) await cleanupTask(boundary, fixture.packageId);
      await boundary.close();
    }
  });
});
