import { spawn, type ChildProcess } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildFetcherTaskJobId } from '@contentos/contracts';
import { Queue } from 'bullmq';
import { expect, test, type Page } from '@playwright/test';

import { readComposeCredentials, SMOKE_STATE_FILE_ENV, type SmokeState } from '../integration/env.js';

interface StartedWorker {
  readonly child: ChildProcess;
}

function state(): SmokeState {
  const path = process.env[SMOKE_STATE_FILE_ENV];
  if (!path) throw new Error('Browser smoke state path was not propagated by global setup.');
  return JSON.parse(readFileSync(path, 'utf8')) as SmokeState;
}

function password(value: SmokeState): string {
  const fields = Object.fromEntries(
    readFileSync(value.envFile, 'utf8')
      .split('\n')
      .filter((line) => line.includes('='))
      .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]),
  );
  const result = fields.CONTENTOS_TEST_OWNER_PASSWORD;
  if (!result) throw new Error('temporary browser fixture is missing');
  return result;
}

function redisUrl(value: SmokeState): string {
  const credentials = readComposeCredentials(value.envFile);
  return `redis://:${encodeURIComponent(credentials.REDIS_PASSWORD ?? '')}@127.0.0.1:${value.ports.redis}`;
}

function startWorker(value: SmokeState): StartedWorker {
  const credentials = readComposeCredentials(value.envFile);
  const child = spawn(process.execPath, [join(value.repoRoot, 'apps', 'worker', 'dist', 'main.js')], {
    cwd: join(value.repoRoot, 'apps', 'worker'),
    env: {
      ...process.env,
      CONTENTOS_ENV: 'test',
      DATABASE_URL: `postgresql://smoke_user:${encodeURIComponent(credentials.POSTGRES_PASSWORD ?? '')}@127.0.0.1:${value.ports.postgres}/smoke_db`,
      REDIS_URL: redisUrl(value),
    },
    stdio: ['ignore', 'ignore', 'ignore'],
  });
  return { child };
}

async function stopWorker(worker: StartedWorker | undefined): Promise<void> {
  const child = worker?.child;
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

async function runCleanup(steps: readonly [string, () => Promise<void> | void][]): Promise<void> {
  const failed: string[] = [];
  for (const [label, step] of steps) {
    try {
      await step();
    } catch {
      failed.push(label);
    }
  }
  if (failed.length > 0) throw new Error(`m2_browser_acceptance_cleanup_failed:${failed.join(',')}`);
}

async function waitFor<T>(read: () => Promise<T | undefined>, predicate: (value: T) => boolean): Promise<T> {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const value = await read();
    if (value !== undefined && predicate(value)) return value;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('m2_browser_acceptance_wait_timed_out');
}

async function createPackage(page: Page, value: SmokeState): Promise<string> {
  await page.goto(value.webOrigin);
  await page.getByLabel('Owner password').fill(password(value));
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(value.webOrigin + '/');
  await page
    .getByRole('button', { name: /Create Content Package|New package/ })
    .first()
    .click();
  await page.getByLabel('Title').fill('M2 acceptance browser package');
  await page.getByLabel('Content mode').selectOption('creator_led');
  await page.getByRole('button', { name: 'Create package' }).click();
  await expect(page).toHaveURL(/\/packages\/[0-9a-f-]+$/);
  const packageId = page.url().split('/').at(-1);
  if (!packageId) throw new Error('workspace route is missing its opaque identity');
  return packageId;
}

test('M2 acceptance: browser recovery journey keeps URL failure, fallback, review, and polling authoritative', async ({
  page,
}) => {
  const value = state();
  const credentials = readComposeCredentials(value.envFile);
  const queue = new Queue('contentos-fetcher', { connection: { url: redisUrl(value) } });
  let worker: StartedWorker | undefined;
  let jobId: string | undefined;
  let streamAborts = 0;
  let workflowEventReads = 0;
  page.on('request', (request) => {
    if (request.method() === 'GET' && /\/workflow\/events(?:\?|$)/.test(request.url())) workflowEventReads += 1;
  });
  try {
    await page.route('**/workflow/stream', async (route) => {
      streamAborts += 1;
      await route.abort('connectionfailed');
    });
    await createPackage(page, value);
    await expect.poll(() => streamAborts).toBeGreaterThan(0);
    await page.getByRole('button', { name: 'Public URL' }).click();
    await page.getByLabel('Public URL').fill('https://example.test/m2-browser-visible-failure');
    const requested = page.waitForResponse(
      (response) => response.url().endsWith('/url-capture-requests') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Capture URL' }).click();
    const taskId = ((await (await requested).json()) as { data: { urlCaptureRequest: { taskId: string } } }).data
      .urlCaptureRequest.taskId;
    worker = startWorker(value);
    await queue.waitUntilReady();
    jobId = buildFetcherTaskJobId(taskId, 1);
    const job = await waitFor(
      () => queue.getJob(jobId!),
      (current) => current !== undefined,
    );
    expect(job.data).toEqual({ taskId, taskKind: 'url_capture', envelopeVersion: 'fetcher-task/v1' });
    const secret = credentials.CONTENTOS_FETCHER_GATEWAY_SECRET;
    if (!secret) throw new Error('temporary Fetcher credential is missing');
    const claimed = await fetch(`${value.apiOrigin}/internal/fetcher/tasks/${taskId}/claim`, {
      method: 'POST',
      headers: { 'x-contentos-fetcher-gateway-secret': secret, 'x-contentos-fetcher-delivery-generation': '1' },
    });
    expect(claimed.status).toBe(200);
    const claim = (await claimed.json()) as { data: { claim: string; attemptNumber: number } };
    const workflowEventReadsBeforeFailure = workflowEventReads;
    const failed = await fetch(`${value.apiOrigin}/internal/fetcher/tasks/${taskId}/result`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-contentos-fetcher-gateway-secret': secret,
        'x-contentos-fetcher-claim': claim.data.claim,
      },
      body: JSON.stringify({
        resultVersion: 'fetcher-result/v1',
        attemptNumber: claim.data.attemptNumber,
        outcome: 'failed',
        category: 'validation_blocked',
        code: 'VALIDATION_BLOCKED',
      }),
    });
    expect(failed.status).toBe(200);
    await expect(page.locator('.source-intake-panel').getByText('Capture failed', { exact: true })).toBeVisible({
      timeout: 12_000,
    });
    await expect.poll(() => workflowEventReads).toBeGreaterThan(workflowEventReadsBeforeFailure);
    await page.getByRole('button', { name: 'Use pasted text instead' }).click();
    await page.getByLabel('Label Optional').fill('M2 fallback source');
    await page.getByLabel('Pasted text').fill('M2 browser authoritative fallback');
    await page.getByRole('button', { name: 'Add Source' }).click();
    await expect(page.getByText('Primary 1/1 · Supporting 0/5')).toBeVisible();

    await page.getByRole('button', { name: 'Upload file' }).click();
    await page.getByRole('radio', { name: /Supporting/ }).check();
    await page.getByLabel('Label Optional').fill('M2 markdown support');
    await page.getByLabel('Upload a Markdown or text file').setInputFiles({
      name: 'm2-support.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from('# M2 markdown support'),
    });
    await page.getByRole('button', { name: 'Add Source' }).click();
    await page.getByRole('button', { name: 'Upload file' }).click();
    await page.getByLabel('Label Optional').fill('M2 text support');
    await page.getByLabel('Upload a Markdown or text file').setInputFiles({
      name: 'm2-support.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('M2 text support'),
    });
    await page.getByRole('button', { name: 'Add Source' }).click();
    await expect(page.getByText('Primary 1/1 · Supporting 2/5')).toBeVisible();

    await page.getByRole('button', { name: 'Review Source M2 fallback source' }).click();
    const editor = page.getByLabel(/Normalized Working Copy/);
    await editor.fill('M2 browser saved working copy');
    await page.getByRole('button', { name: 'Save Working Copy' }).click();
    await page.getByRole('button', { name: 'Create Version' }).click();
    await page.getByRole('button', { name: 'Approve Version 1', exact: true }).click();
    await page
      .getByRole('dialog', { name: 'Approve Version 1?' })
      .getByRole('button', { name: 'Confirm approval' })
      .click();
    await expect(page.getByText('Version 1 is now the current approved Version.')).toBeVisible();
    await page.reload();
    await expect(page.getByText('M2 fallback source')).toBeVisible();
    await page.getByRole('button', { name: 'Review Source M2 fallback source' }).click();
    await page
      .locator('.version-list')
      .getByRole('button', { name: /^Version 1\b/ })
      .click();
    await expect(page.getByLabel('Version 1 immutable review')).toContainText('M2 browser saved working copy');
    await expect(page.getByLabel('Version 1 immutable review')).toContainText('Current approved');
    await page.getByRole('button', { name: 'Close review' }).click();
    const timeline = page.locator('.workflow-timeline-panel');
    await expect(timeline.getByText('URL capture requested', { exact: true })).toBeVisible({ timeout: 12_000 });
    await expect(timeline.getByText('URL capture was blocked safely', { exact: true })).toBeVisible({
      timeout: 12_000,
    });
  } finally {
    await runCleanup([
      ['worker', () => stopWorker(worker)],
      [
        'exact-job',
        async () => {
          if (!jobId) return;
          const remaining = await queue.getJob(jobId);
          if (remaining) await remaining.remove();
        },
      ],
      ['queue', () => queue.close()],
    ]);
  }
});
