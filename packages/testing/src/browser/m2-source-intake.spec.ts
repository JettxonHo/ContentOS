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
  await page.getByLabel('所有者密码').fill(password(value));
  await page.getByRole('button', { name: '登录' }).click();
  await expect(page).toHaveURL(value.webOrigin + '/');
  await page
    .getByRole('button', { name: /新建内容项目/ })
    .first()
    .click();
  await page.getByLabel('项目标题').fill('M2 intake browser package');
  await page.getByLabel('内容模式').selectOption('creator_led');
  await page.locator('.create-panel').getByRole('button', { name: '创建内容项目' }).click();
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
  await expect(page.locator('#sources-title')).toBeVisible();
  await expect(page.getByText('主资料 0/1 · 补充资料 0/5')).toBeVisible();

  await page.getByRole('button', { name: '+ 添加资料' }).click();
  const primaryRadio = page.getByRole('radio', { name: /主资料/ });
  const radioBox = await primaryRadio.boundingBox();
  expect(radioBox?.width).toBeLessThanOrEqual(18);
  expect(radioBox?.height).toBeLessThanOrEqual(18);
  await page.getByLabel('资料名称（可选）').fill('Primary notes');
  await page.getByRole('textbox', { name: '资料正文', exact: true }).fill('Primary source body');
  await page.getByRole('button', { name: '添加资料', exact: true }).dblclick();
  await expect(page.getByText('资料已添加到当前项目。')).toBeVisible();
  await expect(page.getByText('主资料 1/1 · 补充资料 0/5')).toBeVisible();
  await expect(page.getByText('Primary notes')).toBeVisible();
  await expect(page.locator('tr').filter({ hasText: 'Primary notes' })).toBeFocused();

  await page.getByRole('button', { name: '+ 添加资料' }).click();
  await page.getByRole('button', { name: '上传文件', exact: true }).click();
  await page.getByRole('radio', { name: /补充资料/ }).check();
  await page.getByLabel('资料名称（可选）').fill('Markdown notes');
  await page.getByLabel('上传 Markdown 或文本文件').setInputFiles({
    name: 'notes.md',
    mimeType: 'text/markdown',
    buffer: Buffer.from('# supporting markdown'),
  });
  await page.getByRole('button', { name: '添加资料', exact: true }).click();
  await expect(page.getByText(/补充资料 1\/5/)).toBeVisible();
  await expect(page.getByText('Markdown notes')).toBeVisible();

  await page.getByRole('button', { name: '+ 添加资料' }).click();
  await page.getByRole('button', { name: '上传文件', exact: true }).click();
  await page.getByLabel('资料名称（可选）').fill('Text notes');
  await page.getByLabel('上传 Markdown 或文本文件').setInputFiles({
    name: 'notes.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('supporting text'),
  });
  await page.getByRole('button', { name: '添加资料', exact: true }).click();
  await expect(page.getByText(/补充资料 2\/5/)).toBeVisible();
  await expect(page.getByText('Text notes')).toBeVisible();
  const actionXs = await page
    .locator('.resource-table tbody .table-action')
    .evaluateAll((buttons) => buttons.map((button) => Math.round(button.getBoundingClientRect().right)));
  expect(Math.max(...actionXs) - Math.min(...actionXs)).toBeLessThanOrEqual(1);
  await page.reload();
  await expect(page.getByText('主资料 1/1 · 补充资料 2/5')).toBeVisible();
  await expect(page.getByText('Primary notes')).toBeVisible();
  await expect(page.getByText('Markdown notes')).toBeVisible();
  await expect(page.getByText('Text notes')).toBeVisible();
});

test('M2 Source intake: queued URL refreshes to safe failure and keeps fallback independent', async ({ page }) => {
  const value = state();
  await signInAndCreatePackage(page, value);
  await page.getByRole('button', { name: '+ 添加资料' }).click();
  await page.getByRole('button', { name: '网页链接', exact: true }).click();
  await page.getByRole('textbox', { name: '公开 URL' }).fill('https://example.test/visible-owner-url');
  const created = page.waitForResponse(
    (response) => response.url().endsWith('/url-capture-requests') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: '添加资料', exact: true }).click();
  const taskId = ((await (await created).json()) as { data: { urlCaptureRequest: { taskId: string } } }).data
    .urlCaptureRequest.taskId;
  await expect(page.getByText('等待抓取', { exact: true })).toBeVisible();
  const submittedUrl = 'https://example.test/visible-owner-url';
  await expect(page.getByText(submittedUrl)).toBeVisible();
  await expect(page.getByRole('link', { name: submittedUrl })).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('等待抓取', { exact: true })).toBeVisible();
  await markDispatched(value, taskId);
  const secret = readComposeCredentials(value.envFile).CONTENTOS_FETCHER_GATEWAY_SECRET;
  if (!secret) throw new Error('temporary Fetcher credential is missing');
  const claim = await fetch(`${value.apiOrigin}/internal/fetcher/tasks/${taskId}/claim`, {
    method: 'POST',
    headers: { 'x-contentos-fetcher-gateway-secret': secret, 'x-contentos-fetcher-delivery-generation': '1' },
  });
  expect(claim.status).toBe(200);
  const claimData = (await claim.json()) as { data: { claim: string; attemptNumber: number } };
  await page.getByRole('button', { name: '+ 添加资料' }).click();
  await page.getByRole('button', { name: '粘贴文本', exact: true }).click();
  await page.getByRole('textbox', { name: '资料正文', exact: true }).fill('Draft preserved while status refreshes');
  await page.getByRole('textbox', { name: '资料正文', exact: true }).focus();
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
  await expect(page.getByText('无法确认最新资料状态，当前显示上次已知结果。')).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByRole('textbox', { name: '资料正文', exact: true })).toHaveValue(
    'Draft preserved while status refreshes',
  );
  await expect(page.getByRole('textbox', { name: '资料正文', exact: true })).toBeFocused();
  failBackgroundRead = false;
  await page.getByRole('button', { name: '重新加载' }).click();
  await expect(page.locator('.source-intake-panel').getByText('抓取失败', { exact: true })).toBeVisible({
    timeout: 10_000,
  });
  await page.unroute('**/url-capture-requests');
  await page.getByRole('button', { name: '关闭添加资料' }).click();
  await page.getByRole('button', { name: '改用粘贴文本' }).click();
  await expect(page.getByRole('textbox', { name: '资料正文', exact: true })).toBeFocused();
  await page.getByRole('textbox', { name: '资料正文', exact: true }).fill('Independent fallback source');
  await page.getByRole('button', { name: '添加资料', exact: true }).click();
  await expect(page.getByText('资料已添加到当前项目。')).toBeVisible();
  await expect(page.getByText('主资料 1/1 · 补充资料 0/5')).toBeVisible();
  await expect(page.getByRole('cell', { name: '粘贴文本', exact: true }).last()).toBeVisible();
  await expect(page.locator('.source-intake-panel').getByText('抓取失败', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '+ 添加资料' }).click();
  await expect(page.getByRole('button', { name: '网页链接', exact: true })).toBeDisabled();
  await page.reload();
  await expect(page.locator('.source-intake-panel').getByText('抓取失败', { exact: true })).toBeVisible();
  await expect(page.getByText('主资料 1/1 · 补充资料 0/5')).toBeVisible();
  await expect(page.getByRole('cell', { name: '粘贴文本', exact: true }).last()).toBeVisible();
  await page.getByRole('button', { name: '+ 添加资料' }).click();
  await expect(page.getByRole('button', { name: '网页链接', exact: true })).toBeDisabled();
});

test('M2 Source intake: archived package shows owned intake history but disables commands', async ({ page }) => {
  const value = state();
  await page.route('**/workflow/stream', async (route) => route.abort('connectionfailed'));
  await signInAndCreatePackage(page, value);
  await page.getByRole('button', { name: '+ 添加资料' }).click();
  await page.getByRole('button', { name: '网页链接', exact: true }).click();
  await page.getByRole('textbox', { name: '公开 URL' }).fill('https://example.test/archived-owner-url');
  const created = page.waitForResponse(
    (response) => response.url().endsWith('/url-capture-requests') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: '添加资料', exact: true }).click();
  const taskId = ((await (await created).json()) as { data: { urlCaptureRequest: { taskId: string } } }).data
    .urlCaptureRequest.taskId;
  await expect(page.getByText('等待抓取', { exact: true })).toBeVisible();
  await completeUrlCapture(value, taskId);
  await expect(page.locator('tr').filter({ hasText: '网页链接' })).toBeVisible({
    timeout: 10_000,
  });
  await page.getByRole('button', { name: '运行记录', exact: true }).click();
  await expect(page.locator('.workflow-timeline-panel').getByText('URL Source captured', { exact: true })).toBeVisible({
    timeout: 12_000,
  });
  await page.getByRole('button', { name: '关闭运行记录' }).click();
  await page.getByRole('button', { name: /审核资料 网页链接/ }).click();
  await expect(page.getByLabel(/当前草稿修订/)).toHaveValue('archived success candidate');
  await expect(page.getByText('<html><body>archived success history</body></html>', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '关闭审核' }).click();
  await page.getByRole('button', { name: /项目信息/ }).click();
  await page.getByRole('button', { name: '归档项目' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '归档项目' }).click();
  await expect(page).toHaveURL(/\?view=archived$/);
  await page.getByRole('link', { name: /M2 intake browser package/ }).click();
  await page.getByRole('button', { name: /^资料：/ }).click();
  await expect(page.getByText('该项目已归档，不能继续添加资料。')).toBeVisible();
  await expect(page.getByText('已抓取', { exact: true })).toBeVisible();
  await expect(page.getByText(/Primary \d\/1/)).toHaveCount(0);
  await expect(page.getByText(/补充资料 \d\/5/)).toHaveCount(0);
  await expect(page.getByText('暂无资料。使用“+ 添加资料”开始。')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '添加资料', exact: true })).toHaveCount(0);
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
  await expect(page.getByText(/无法读取资料状态/)).toBeVisible();
  failIntakeRead = false;
  await page.getByRole('button', { name: '重新加载资料状态' }).evaluateAll((buttons) => {
    const button = buttons[0];
    if (button instanceof HTMLButtonElement) button.click();
  });
  await expect(page.getByText('主资料 0/1 · 补充资料 0/5')).toBeVisible();

  await page.getByRole('button', { name: '+ 添加资料' }).click();
  await page.getByRole('button', { name: '网页链接', exact: true }).click();
  await page.getByRole('textbox', { name: '公开 URL' }).fill('https://example.test/ambiguous');
  await page.route('**/url-capture-requests', async (route) => {
    if (route.request().method() === 'POST') await route.abort('connectionfailed');
    else await route.continue();
  });
  await page.getByRole('button', { name: '添加资料', exact: true }).click();
  const sourceAlert = page.locator('.source-intake-panel').getByRole('alert');
  await expect(sourceAlert).toContainText('无法确认');
  await expect(sourceAlert).toBeFocused();
  await expect(page.getByRole('button', { name: '网页链接', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: '添加资料', exact: true })).toBeDisabled();
  await page.unroute('**/url-capture-requests');
  await page.getByRole('button', { name: '重新加载资料状态' }).click();
  await expect(page.getByRole('button', { name: '网页链接', exact: true })).toBeEnabled();
  await expect(sourceAlert).toHaveCount(0);
  await expect(page.locator('.source-composer').getByRole('button', { name: '重新加载资料状态' })).toHaveCount(0);

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
  await page.getByRole('textbox', { name: '公开 URL' }).fill('https://example.test/accepted-but-unconfirmed');
  await page.getByRole('button', { name: '添加资料', exact: true }).click();
  await expect(sourceAlert).toContainText('提交仍待确认');
  await expect(page.getByRole('button', { name: '网页链接', exact: true })).toBeDisabled();
  await page.unroute('**/url-capture-requests');
  await page.locator('.source-composer').getByRole('button', { name: '重新加载资料状态' }).click();
  await expect(page.getByText('等待抓取', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '网页链接', exact: true })).toBeDisabled();
  await expect(sourceAlert).toHaveCount(0);
  await expect(page.locator('.source-composer').getByRole('button', { name: '重新加载资料状态' })).toHaveCount(0);

  await page.getByRole('button', { name: '粘贴文本', exact: true }).click();
  await page.getByRole('radio', { name: /补充资料/ }).check();
  await page.getByRole('textbox', { name: '资料正文', exact: true }).fill('session expires before this command');
  let sessionExpired = false;
  await page.route('**/v1/auth/session', async (route) => {
    if (sessionExpired) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: '{"error":{"code":"UNAUTHENTICATED","message":"Authentication required"}}',
      });
      return;
    }
    await route.continue();
  });
  await page.route('**/sources', async (route) => {
    if (route.request().method() === 'POST') {
      sessionExpired = true;
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: '{"error":{"code":"UNAUTHENTICATED","message":"Authentication required"}}',
      });
    } else await route.continue();
  });
  await page.getByRole('button', { name: '添加资料', exact: true }).click();
  await expect(page).toHaveURL(`${value.webOrigin}/login`);
});

test('M2 Source intake: command 404 enters the unavailable Workspace state', async ({ page }) => {
  const value = state();
  await signInAndCreatePackage(page, value);
  await expect(page.locator('#sources-title')).toBeVisible();
  await page.getByRole('button', { name: '+ 添加资料' }).click();
  await page.getByRole('textbox', { name: '资料正文', exact: true }).fill('package disappears before this command');
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
  await page.getByRole('button', { name: '添加资料', exact: true }).click();
  await expect(page.getByText('此内容项目不可用。')).toBeVisible();
  await expect(page.locator('#sources-title')).toHaveCount(0);
  await expect(page.locator('.source-composer')).toHaveCount(0);
});
