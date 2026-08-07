import { createHash, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { expect, test, type Page } from '@playwright/test';

import { composeExec } from '../integration/compose.js';
import { readComposeCredentials, SMOKE_STATE_FILE_ENV, type SmokeState } from '../integration/env.js';
import { signedFetch } from '../integration/sigv4.js';

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
  const valueAtKey = fields.CONTENTOS_TEST_OWNER_PASSWORD;
  if (!valueAtKey) throw new Error('temporary browser fixture is missing');
  return valueAtKey;
}

async function signInAndCreatePackage(page: Page, value: SmokeState): Promise<string> {
  await page.goto(value.webOrigin);
  await page.getByLabel('Owner password').fill(password(value));
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(value.webOrigin + '/');
  await page
    .getByRole('button', { name: /Create Content Package|New package/ })
    .first()
    .click();
  await page.getByLabel('Title').fill('M2 intake browser package');
  await page.getByLabel('Content mode').selectOption('creator_led');
  await page.getByRole('button', { name: 'Create package' }).click();
  await expect(page).toHaveURL(/\/packages\/[0-9a-f-]+$/);
  const packageId = page.url().split('/').at(-1);
  if (!packageId) throw new Error('workspace route is missing its opaque identity');
  return packageId;
}

async function markDispatched(value: SmokeState, taskId: string): Promise<void> {
  const result = await composeExec(value, 'postgres', [
    'sh',
    '-c',
    `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "UPDATE workflow_outbox_records SET state = 'dispatched', last_dispatch_at = created_at, dispatched_at = created_at WHERE task_id = '${taskId}'"`,
  ]);
  expect(result.ok).toBe(true);
}

async function completeUrlCapture(value: SmokeState, taskId: string): Promise<void> {
  await markDispatched(value, taskId);
  const credentials = readComposeCredentials(value.envFile);
  const secret = credentials.CONTENTOS_FETCHER_GATEWAY_SECRET;
  const accessKeyId = credentials.OBJECT_STORAGE_ACCESS_KEY;
  const secretAccessKey = credentials.OBJECT_STORAGE_SECRET_KEY;
  if (!secret || !accessKeyId || !secretAccessKey) throw new Error('temporary capture fixture is incomplete');
  const claim = await fetch(`${value.apiOrigin}/internal/fetcher/tasks/${taskId}/claim`, {
    method: 'POST',
    headers: { 'x-contentos-fetcher-gateway-secret': secret, 'x-contentos-fetcher-delivery-generation': '1' },
  });
  expect(claim.status).toBe(200);
  const claimData = (await claim.json()) as { data: { claim: string; attemptNumber: number } };
  const snapshotId = randomUUID();
  const storageKey = `fetcher/url-capture/${taskId}/${claimData.data.attemptNumber}/raw/${snapshotId}`;
  const body = '<html><body>archived success history</body></html>';
  const sha256 = createHash('sha256').update(body).digest('hex');
  const byteSize = Buffer.byteLength(body);
  const put = await signedFetch({
    method: 'PUT',
    url: `http://127.0.0.1:${value.ports.objectStorage}/${value.objectStorageBucket}/${storageKey}`,
    credentials: { accessKeyId, secretAccessKey },
    body,
    headers: {
      'content-type': 'text/html',
      'x-amz-meta-sha256': sha256,
      'x-amz-meta-bytesize': String(byteSize),
      'x-amz-meta-immutable': 'true',
    },
  });
  expect(put.status).toBeLessThan(300);
  const result = await fetch(`${value.apiOrigin}/internal/fetcher/tasks/${taskId}/result`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-contentos-fetcher-gateway-secret': secret,
      'x-contentos-fetcher-claim': claimData.data.claim,
    },
    body: JSON.stringify({
      resultVersion: 'fetcher-result/v1',
      attemptNumber: claimData.data.attemptNumber,
      outcome: 'succeeded',
      snapshot: { snapshotId, storageKey, sha256, byteSize, contentType: 'text/html', contentEncoding: 'identity' },
      capture: {
        finalUrl: 'https://example.test/archived-final',
        redirects: [],
        responseStatus: 200,
        encodedByteSize: byteSize,
        decodedByteSize: byteSize,
      },
      candidate: { schemaVersion: 'source/normalized/v1', text: 'archived success candidate' },
    }),
  });
  expect(result.status).toBe(200);
}

test('M2 Source intake: owner creates Paste and accepted text-file Sources that persist after refresh', async ({
  page,
}) => {
  const value = state();
  await signInAndCreatePackage(page, value);
  await expect(page.getByRole('heading', { name: 'Sources' })).toBeVisible();
  await expect(page.getByText('Primary 0/1 · Supporting 0/5')).toBeVisible();

  await page.getByLabel('Label Optional').fill('Primary notes');
  await page.getByLabel('Pasted text').fill('Primary source body');
  await page.getByRole('button', { name: 'Add Source' }).dblclick();
  await expect(page.getByText('Source added to this package.')).toBeVisible();
  await expect(page.getByText('Primary 1/1 · Supporting 0/5')).toBeVisible();
  await expect(page.getByText('Primary notes')).toBeVisible();
  await expect(page.locator('article.source-card').filter({ hasText: 'Primary notes' })).toBeFocused();

  await page.getByRole('button', { name: 'Upload file' }).click();
  await page.getByRole('radio', { name: /Supporting/ }).check();
  await page.getByLabel('Label Optional').fill('Markdown notes');
  await page.getByLabel('Upload a Markdown or text file').setInputFiles({
    name: 'notes.md',
    mimeType: 'text/markdown',
    buffer: Buffer.from('# supporting markdown'),
  });
  await page.getByRole('button', { name: 'Add Source' }).click();
  await expect(page.getByText('Supporting 1/5')).toBeVisible();
  await expect(page.getByText('Markdown notes')).toBeVisible();

  await page.getByRole('button', { name: 'Upload file' }).click();
  await page.getByLabel('Label Optional').fill('Text notes');
  await page.getByLabel('Upload a Markdown or text file').setInputFiles({
    name: 'notes.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('supporting text'),
  });
  await page.getByRole('button', { name: 'Add Source' }).click();
  await expect(page.getByText('Supporting 2/5')).toBeVisible();
  await expect(page.getByText('Text notes')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Primary 1/1 · Supporting 2/5')).toBeVisible();
  await expect(page.getByText('Primary notes')).toBeVisible();
  await expect(page.getByText('Markdown notes')).toBeVisible();
  await expect(page.getByText('Text notes')).toBeVisible();
});

test('M2 Source intake: queued URL refreshes to safe failure and keeps fallback independent', async ({ page }) => {
  const value = state();
  await signInAndCreatePackage(page, value);
  await page.getByRole('button', { name: 'Public URL' }).click();
  await page.getByLabel('Public URL').fill('https://example.test/visible-owner-url');
  const created = page.waitForResponse(
    (response) => response.url().endsWith('/url-capture-requests') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Capture URL' }).click();
  const taskId = ((await (await created).json()) as { data: { urlCaptureRequest: { taskId: string } } }).data
    .urlCaptureRequest.taskId;
  await expect(page.getByText('Waiting to capture')).toBeVisible();
  const submittedUrl = 'https://example.test/visible-owner-url';
  await expect(page.getByText(submittedUrl)).toBeVisible();
  await expect(page.getByRole('link', { name: submittedUrl })).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('Waiting to capture')).toBeVisible();
  await markDispatched(value, taskId);
  const secret = readComposeCredentials(value.envFile).CONTENTOS_FETCHER_GATEWAY_SECRET;
  if (!secret) throw new Error('temporary Fetcher credential is missing');
  const claim = await fetch(`${value.apiOrigin}/internal/fetcher/tasks/${taskId}/claim`, {
    method: 'POST',
    headers: { 'x-contentos-fetcher-gateway-secret': secret, 'x-contentos-fetcher-delivery-generation': '1' },
  });
  expect(claim.status).toBe(200);
  const claimData = (await claim.json()) as { data: { claim: string; attemptNumber: number } };
  await page.getByRole('button', { name: 'Paste text' }).click();
  await page.getByLabel('Pasted text').fill('Draft preserved while status refreshes');
  await page.getByLabel('Pasted text').focus();
  let failBackgroundRead = true;
  await page.route('**/url-capture-requests', async (route) => {
    if (route.request().method() === 'GET' && failBackgroundRead) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: '{"error":{"code":"INTERNAL_ERROR"}}',
      });
    } else {
      await route.continue();
    }
  });
  const result = await fetch(`${value.apiOrigin}/internal/fetcher/tasks/${taskId}/result`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-contentos-fetcher-gateway-secret': secret,
      'x-contentos-fetcher-claim': claimData.data.claim,
    },
    body: JSON.stringify({
      resultVersion: 'fetcher-result/v1',
      attemptNumber: claimData.data.attemptNumber,
      outcome: 'failed',
      category: 'fetch_failed',
      code: 'FETCH_FAILED',
    }),
  });
  expect(result.status).toBe(200);
  await expect(
    page.getByText('Latest Source status could not be confirmed. Showing the last known state.'),
  ).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByLabel('Pasted text')).toHaveValue('Draft preserved while status refreshes');
  await expect(page.getByLabel('Pasted text')).toBeFocused();
  failBackgroundRead = false;
  await page.getByRole('button', { name: 'Reload Source status' }).click();
  await expect(page.getByText('Capture failed')).toBeVisible({ timeout: 10_000 });
  await page.unroute('**/url-capture-requests');
  await page.getByRole('button', { name: 'Use pasted text instead' }).click();
  await expect(page.getByLabel('Pasted text')).toBeFocused();
  await page.getByLabel('Pasted text').fill('Independent fallback source');
  await page.getByRole('button', { name: 'Add Source' }).click();
  await expect(page.getByText('Source added to this package.')).toBeVisible();
  await expect(page.getByText('Primary 1/1 · Supporting 0/5')).toBeVisible();
  await expect(page.getByText('Pasted text · primary')).toBeVisible();
  await expect(page.getByText('Capture failed')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Public URL' })).toBeDisabled();
  await page.reload();
  await expect(page.getByText('Capture failed')).toBeVisible();
  await expect(page.getByText('Primary 1/1 · Supporting 0/5')).toBeVisible();
  await expect(page.getByText('Pasted text · primary')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Public URL' })).toBeDisabled();
});

test('M2 Source intake: archived package shows owned intake history but disables commands', async ({ page }) => {
  const value = state();
  await signInAndCreatePackage(page, value);
  await page.getByRole('button', { name: 'Public URL' }).click();
  await page.getByLabel('Public URL').fill('https://example.test/archived-owner-url');
  const created = page.waitForResponse(
    (response) => response.url().endsWith('/url-capture-requests') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Capture URL' }).click();
  const taskId = ((await (await created).json()) as { data: { urlCaptureRequest: { taskId: string } } }).data
    .urlCaptureRequest.taskId;
  await expect(page.getByText('Waiting to capture')).toBeVisible();
  await completeUrlCapture(value, taskId);
  await expect(page.locator('article.source-card').filter({ hasText: 'Public URL · primary' })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText('Captured', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: /Package metadata/ }).click();
  await page.getByRole('button', { name: 'Archive package' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Archive package' }).click();
  await expect(page).toHaveURL(/\?view=archived$/);
  await page.getByRole('link', { name: /M2 intake browser package/ }).click();
  await page.getByRole('button', { name: /Sources/ }).click();
  await expect(page.getByText('This package is archived. Source intake is unavailable.')).toBeVisible();
  await expect(page.getByText('Captured', { exact: true })).toBeVisible();
  await expect(page.getByText(/Primary \d\/1/)).toHaveCount(0);
  await expect(page.getByText(/Supporting \d\/5/)).toHaveCount(0);
  await expect(page.getByText('No formal Sources yet. Add a Source to begin.')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Capture URL' })).toHaveCount(0);
});

test('M2 Source intake: read failures recover, ambiguous URL stays locked, and command 401 returns to Login', async ({
  page,
}) => {
  const value = state();
  let failIntakeRead = true;
  await page.route('**/url-capture-requests', async (route) => {
    if (route.request().method() === 'GET' && failIntakeRead) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: '{"error":{"code":"INTERNAL_ERROR"}}',
      });
    } else {
      await route.continue();
    }
  });
  await signInAndCreatePackage(page, value);
  await expect(page.getByText(/Source status could not be loaded/)).toBeVisible();
  failIntakeRead = false;
  await page.getByRole('button', { name: 'Reload Source status' }).click();
  await expect(page.getByText('Primary 0/1 · Supporting 0/5')).toBeVisible();

  await page.getByRole('button', { name: 'Public URL' }).click();
  await page.getByLabel('Public URL').fill('https://example.test/ambiguous');
  await page.route('**/url-capture-requests', async (route) => {
    if (route.request().method() === 'POST') await route.abort('connectionfailed');
    else await route.continue();
  });
  await page.getByRole('button', { name: 'Capture URL' }).click();
  const sourceAlert = page.locator('.source-intake-panel').getByRole('alert');
  await expect(sourceAlert).toContainText('could not be confirmed');
  await expect(sourceAlert).toBeFocused();
  await expect(page.getByRole('button', { name: 'Public URL' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Capture URL' })).toBeDisabled();
  await page.unroute('**/url-capture-requests');
  await page.getByRole('button', { name: 'Reload Source status' }).click();
  await expect(page.getByRole('button', { name: 'Public URL' })).toBeEnabled();
  await expect(sourceAlert).toHaveCount(0);
  await expect(page.locator('.source-composer').getByRole('button', { name: 'Reload Source status' })).toHaveCount(0);

  let failConfirmationRead = false;
  await page.route('**/url-capture-requests', async (route) => {
    if (route.request().method() === 'POST') {
      failConfirmationRead = true;
      await route.continue();
    } else if (route.request().method() === 'GET' && failConfirmationRead) {
      failConfirmationRead = false;
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: '{"error":{"code":"INTERNAL_ERROR"}}',
      });
    } else {
      await route.continue();
    }
  });
  await page.getByLabel('Public URL').fill('https://example.test/accepted-but-unconfirmed');
  await page.getByRole('button', { name: 'Capture URL' }).click();
  await expect(sourceAlert).toContainText('URL submission needs confirmation');
  await expect(page.getByRole('button', { name: 'Public URL' })).toBeDisabled();
  await page.unroute('**/url-capture-requests');
  await page.locator('.source-composer').getByRole('button', { name: 'Reload Source status' }).click();
  await expect(page.getByText('Waiting to capture')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Public URL' })).toBeDisabled();
  await expect(sourceAlert).toHaveCount(0);
  await expect(page.locator('.source-composer').getByRole('button', { name: 'Reload Source status' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Paste text' }).click();
  await page.getByRole('radio', { name: /Supporting/ }).check();
  await page.getByLabel('Pasted text').fill('session expires before this command');
  await page.route('**/sources', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: '{"error":{"code":"UNAUTHENTICATED","message":"Authentication required"}}',
      });
    } else await route.continue();
  });
  await page.getByRole('button', { name: 'Add Source' }).click();
  await expect(page).toHaveURL(`${value.webOrigin}/login`);
});

test('M2 Source intake: command 404 enters the unavailable Workspace state', async ({ page }) => {
  const value = state();
  await signInAndCreatePackage(page, value);
  await expect(page.getByRole('heading', { name: 'Sources' })).toBeVisible();
  await page.getByLabel('Pasted text').fill('package disappears before this command');
  await page.route('**/sources', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: '{"error":{"code":"CONTENT_PACKAGE_NOT_FOUND","message":"Content Package not found"}}',
      });
    } else {
      await route.continue();
    }
  });
  await page.getByRole('button', { name: 'Add Source' }).click();
  await expect(page.getByText('This Content Package is unavailable.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sources' })).toHaveCount(0);
  await expect(page.locator('.source-composer')).toHaveCount(0);
});
