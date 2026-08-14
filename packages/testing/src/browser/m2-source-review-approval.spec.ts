import { readFileSync } from 'node:fs';

import { expect, test, type Page } from '@playwright/test';

import { SMOKE_STATE_FILE_ENV, type SmokeState } from '../integration/env.js';

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

async function packageWorkspace(page: Page, value: SmokeState): Promise<void> {
  await page.goto(value.webOrigin);
  await page.getByLabel('所有者密码').fill(password(value));
  await page.getByRole('button', { name: '登录' }).click();
  await page
    .getByRole('button', { name: /新建内容项目/ })
    .first()
    .click();
  await page.getByLabel('项目标题').fill('M2 source review package');
  await page.locator('.create-panel').getByRole('button', { name: '创建内容项目' }).click();
  await expect(page).toHaveURL(/\/packages\/[0-9a-f-]+$/);
}

async function addPastedSource(
  page: Page,
  input: { readonly label: string; readonly text: string; readonly supporting?: boolean },
): Promise<string> {
  await page.getByRole('button', { name: '+ 添加资料' }).click();
  if (input.supporting) await page.getByRole('radio', { name: /补充资料/ }).check();
  await page.getByLabel('资料名称（可选）').fill(input.label);
  await page.getByLabel('资料正文').fill(input.text);
  const created = page.waitForResponse(
    (response) => response.url().endsWith('/sources') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: '添加资料', exact: true }).click();
  return ((await (await created).json()) as { data: { source: { id: string } } }).data.source.id;
}

test('M2 Source review: explicit save, immutable Version, and exact approval survive refresh', async ({ page }) => {
  const value = state();
  await packageWorkspace(page, value);
  await page.getByRole('button', { name: '+ 添加资料' }).click();
  await page.getByLabel('资料正文').fill('Initial normalized Source body');
  await page.getByRole('button', { name: '添加资料', exact: true }).click();
  await page.getByRole('button', { name: /审核资料/ }).click();
  const contextAction = page.locator('.workspace-context-panel');
  await expect(contextAction.getByRole('button', { name: '+ 添加资料' })).toHaveCount(0);
  await expect(contextAction.locator('.next-action-button')).toHaveCount(1);
  await expect(contextAction.getByRole('button', { name: '保存为版本', exact: true })).toBeVisible();
  const editor = page.getByLabel(/当前草稿修订/);
  await expect(editor).toHaveValue('Initial normalized Source body');
  await editor.fill('Saved review body');
  await expect(contextAction.getByRole('button', { name: '保存当前草稿', exact: true })).toBeVisible();
  await contextAction.getByRole('button', { name: '保存当前草稿', exact: true }).click();
  await expect(page.getByText(/当前草稿修订 2 已保存/)).toBeVisible();
  await page.getByRole('button', { name: '保存为版本' }).click();
  await expect(page.getByText('已根据保存的草稿创建版本 1。')).toBeVisible();
  await expect(page.getByLabel('版本 1 不可变审核')).toContainText('Saved review body');
  await page.getByRole('button', { name: '批准版本 1' }).click();
  await expect(page.getByRole('dialog', { name: '批准版本 1？' })).toBeVisible();
  await expect(page.getByRole('button', { name: '取消' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: '确认批准' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: '取消' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '批准版本 1' })).toBeFocused();
  await page.getByRole('button', { name: '批准版本 1' }).click();
  await page.getByRole('button', { name: '确认批准' }).click();
  await expect(page.getByText('版本 1 已成为当前批准版本。')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: /审核资料/ }).click();
  await page
    .locator('.version-list')
    .getByRole('button', { name: /^版本 1\b/ })
    .click();
  await expect(page.getByText('当前批准')).toBeVisible();
  await expect(page.getByRole('button', { name: '批准版本 1' })).toHaveCount(0);
});

test('M2 Source review: a revision conflict preserves the local draft until an explicit reload', async ({ page }) => {
  const value = state();
  await packageWorkspace(page, value);
  await page.getByRole('button', { name: '+ 添加资料' }).click();
  const created = page.waitForResponse(
    (response) => response.url().endsWith('/sources') && response.request().method() === 'POST',
  );
  await page.getByLabel('资料正文').fill('Initial revision');
  await page.getByRole('button', { name: '添加资料', exact: true }).click();
  const sourceId = ((await (await created).json()) as { data: { source: { id: string } } }).data.source.id;
  const packageId = page.url().split('/').at(-1);
  if (!packageId) throw new Error('workspace route is missing its opaque identity');
  await page.getByRole('button', { name: /审核资料/ }).click();
  const editor = page.getByLabel(/当前草稿修订/);
  await editor.fill('Local unsaved review');
  await page.evaluate(
    async ({ apiOrigin, packageId: currentPackageId, sourceId: currentSourceId }) => {
      const response = await fetch(
        `${apiOrigin}/v1/content-packages/${encodeURIComponent(currentPackageId)}/sources/${encodeURIComponent(currentSourceId)}/working-copy`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ expectedRevision: 1, body: { text: 'Authoritative concurrent revision' } }),
        },
      );
      if (!response.ok) throw new Error('concurrent Working Copy edit did not succeed');
    },
    { apiOrigin: value.apiOrigin, packageId, sourceId },
  );
  await page.getByRole('button', { name: '保存当前草稿' }).click();
  await expect(page.locator('.source-review-panel').getByRole('alert')).toContainText('你的草稿已保留');
  await expect(editor).toHaveValue('Local unsaved review');
  await expect(page.getByRole('button', { name: '保存当前草稿', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '重新加载权威草稿', exact: true }).click();
  await expect(editor).toHaveValue('Authoritative concurrent revision');
});

test('M2 Source review: two immutable Versions remain selectable with exact Head state', async ({ page }) => {
  const value = state();
  await packageWorkspace(page, value);
  await addPastedSource(page, { label: 'Versioned source', text: 'Version one body' });
  await page.getByRole('button', { name: '审核资料 Versioned source' }).click();
  await page.getByRole('button', { name: '保存为版本' }).click();
  await expect(page.getByLabel('版本 1 不可变审核')).toContainText('Version one body');
  const editor = page.getByLabel(/当前草稿修订/);
  await editor.fill('Version two body');
  await page.getByRole('button', { name: '保存当前草稿' }).click();
  await page.getByRole('button', { name: '保存为版本' }).click();
  await expect(page.getByRole('button', { name: '保存为版本', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '批准版本 2', exact: true })).toBeVisible();
  const versionList = page.locator('.version-list');
  const version2Row = versionList.getByRole('button', { name: /^版本 2\b/ });
  await expect(version2Row).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('版本 2 不可变审核')).toContainText('Version two body');
  await expect(page.getByLabel('版本 2 不可变审核')).toContainText('最新');
  await expect(page.getByLabel('版本 2 不可变审核')).toContainText('待审核候选');
  const version1Row = versionList.getByRole('button', { name: /^版本 1\b/ });
  await version1Row.click();
  await expect(version1Row).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('版本 1 不可变审核')).toContainText('Version one body');
  await expect(page.getByLabel('版本 1 不可变审核')).not.toContainText('待审核候选');
  await expect(page.getByRole('button', { name: '批准版本 1' })).toHaveCount(0);
});

test('M2 Source review: stale candidate confirmation refreshes the exact authoritative Head', async ({ page }) => {
  const value = state();
  await packageWorkspace(page, value);
  const sourceId = await addPastedSource(page, { label: 'Stale candidate source', text: 'Version one body' });
  const packageId = page.url().split('/').at(-1);
  if (!packageId) throw new Error('workspace route is missing its opaque identity');
  await page.getByRole('button', { name: '审核资料 Stale candidate source' }).click();
  await page.getByRole('button', { name: '保存为版本' }).click();
  await page.getByRole('button', { name: '批准版本 1', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '批准版本 1？' })).toBeVisible();

  const newerCandidateStatus = await page.evaluate(
    async ({ apiOrigin, currentPackageId, currentSourceId }) => {
      const workingCopy = await fetch(
        `${apiOrigin}/v1/content-packages/${encodeURIComponent(currentPackageId)}/sources/${encodeURIComponent(currentSourceId)}/working-copy`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ expectedRevision: 1, body: { text: 'Version two body' } }),
        },
      );
      const version = await fetch(
        `${apiOrigin}/v1/content-packages/${encodeURIComponent(currentPackageId)}/sources/${encodeURIComponent(currentSourceId)}/versions`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ expectedRevision: 2 }),
        },
      );
      return [workingCopy.status, version.status];
    },
    { apiOrigin: value.apiOrigin, currentPackageId: packageId, currentSourceId: sourceId },
  );
  expect(newerCandidateStatus).toEqual([200, 201]);

  await page.getByRole('button', { name: '确认批准' }).click();
  const review = page.locator('.source-review-panel');
  await expect(review.getByRole('alert')).toContainText('已不能批准');
  await expect(review.getByText('版本 1 已成为当前批准版本。')).toHaveCount(0);
  await expect(review.getByRole('button', { name: '批准版本 1', exact: true })).toHaveCount(0);
  const version2Row = review.locator('.version-list').getByRole('button', { name: /^版本 2\b/ });
  await version2Row.click();
  await expect(review.getByRole('button', { name: '审核区确认版本 2', exact: true })).toBeVisible();
  await expect(page.locator('.workspace-context-panel').getByRole('button', { name: '批准版本 2' })).toBeVisible();
  await expect(review.getByLabel('版本 2 不可变审核')).toContainText('待审核候选');
});

test('M2 Workflow Timeline: Load more follows the cursor with ascending deduplicated safe activity', async ({
  page,
}) => {
  const value = state();
  const occurredAt = '2026-08-07T00:00:00.000Z';
  await page.route('**/workflow/events?*', async (route) => {
    const after = new URL(route.request().url()).searchParams.get('after');
    const data =
      after === '0'
        ? {
            workflowInstanceId: '00000000-0000-4000-8000-000000000010',
            latestSequence: 3,
            items: [
              {
                sequence: 2,
                nodeKey: 'source_capture',
                occurredAt,
                kind: 'fetcher_lease_expired.v1',
                attemptNumber: 1,
              },
              { sequence: 1, nodeKey: 'source_capture', occurredAt, kind: 'url_capture_requested.v1' },
            ],
            nextAfter: 2,
          }
        : {
            workflowInstanceId: '00000000-0000-4000-8000-000000000010',
            latestSequence: 3,
            items: [
              {
                sequence: 2,
                nodeKey: 'source_capture',
                occurredAt,
                kind: 'fetcher_lease_expired.v1',
                attemptNumber: 1,
              },
              {
                sequence: 3,
                nodeKey: 'source_capture',
                occurredAt,
                kind: 'url_capture_succeeded.v1',
                attemptNumber: 2,
              },
            ],
            nextAfter: null,
          };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data }) });
  });
  await packageWorkspace(page, value);

  await page.getByRole('button', { name: '运行记录', exact: true }).click();
  const timeline = page.locator('.workflow-timeline-panel');
  const items = timeline.locator('.timeline-list > li');
  await expect(items).toHaveCount(2);
  await expect(items.nth(0)).toContainText('URL capture requested');
  await expect(items.nth(1)).toContainText('URL capture recovery scheduled');
  await timeline.getByRole('button', { name: '加载更多' }).click();
  await expect(items).toHaveCount(3);
  await expect(items.nth(0)).toContainText('URL capture requested');
  await expect(items.nth(1)).toContainText('URL capture recovery scheduled');
  await expect(items.nth(2)).toContainText('URL Source captured');
  await expect(timeline.getByText('URL capture recovery scheduled', { exact: true })).toHaveCount(1);
  await expect(timeline.getByRole('button', { name: '加载更多' })).toHaveCount(0);
});

test('M2 Source review: dirty navigation stays blocked until explicit discard', async ({ page }) => {
  const value = state();
  await packageWorkspace(page, value);
  await addPastedSource(page, { label: 'Guarded source', text: 'Authoritative guard body' });
  await addPastedSource(page, { label: 'Other source', text: 'Other body', supporting: true });
  await page.getByRole('button', { name: '审核资料 Guarded source' }).click();
  await page.getByLabel(/当前草稿修订/).fill('Unsaved guarded body');

  const workspaceUrl = page.url();
  await page.locator('.primary-nav').getByRole('link', { name: '工作台' }).click();
  await expect(page).toHaveURL(workspaceUrl);
  await page.getByRole('link', { name: '工作台' }).nth(1).click();
  await expect(page).toHaveURL(workspaceUrl);
  await expect(page.getByText('离开工作区前，请先保存或放弃未保存的资料草稿。')).toBeVisible();
  await page.getByRole('button', { name: '退出登录' }).click();
  await expect(page).toHaveURL(workspaceUrl);
  await expect(page.getByRole('button', { name: /项目信息/ })).toBeDisabled();
  await expect(page.getByRole('button', { name: '审核资料 Other source' })).toBeDisabled();
  await page.getByRole('button', { name: '归档项目' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: '关闭审核' }).click();
  await expect(page.locator('.source-review-panel').getByRole('alert')).toBeFocused();
  await page.getByRole('button', { name: '放弃草稿' }).click();
  await expect(page.getByLabel(/当前草稿修订/)).toHaveValue('Authoritative guard body');
  await page.getByRole('link', { name: '工作台' }).nth(1).click();
  await expect(page).toHaveURL(value.webOrigin + '/');
});

test('M2 Source review: a late Source A load cannot overwrite Source B', async ({ page }) => {
  const value = state();
  await packageWorkspace(page, value);
  const sourceA = await addPastedSource(page, { label: 'Source A', text: 'A body' });
  await addPastedSource(page, { label: 'Source B', text: 'B body', supporting: true });

  let releaseSourceA: (() => void) | undefined;
  let markPaused: (() => void) | undefined;
  const paused = new Promise<void>((resolve) => {
    markPaused = resolve;
  });
  const release = new Promise<void>((resolve) => {
    releaseSourceA = resolve;
  });
  await page.route(`**/sources/${sourceA}/working-copy`, async (route) => {
    markPaused?.();
    await release;
    await route.continue();
  });

  await page.getByRole('button', { name: '审核资料 Source A' }).click();
  await paused;
  await page.getByRole('button', { name: '审核资料 Source B' }).click();
  await expect(page.getByRole('heading', { name: 'Source B' })).toBeVisible();
  await expect(page.getByLabel(/当前草稿修订/)).toHaveValue('B body');
  releaseSourceA?.();
  await expect(page.getByLabel(/当前草稿修订/)).toHaveValue('B body');
  await page.unroute(`**/sources/${sourceA}/working-copy`);
});

test('M2 Source review: an initial read failure exposes a focused retry state', async ({ page }) => {
  const value = state();
  await packageWorkspace(page, value);
  const sourceId = await addPastedSource(page, { label: 'Retry source', text: 'Retry body' });
  let failOnce = true;
  let sourceMissing = false;
  await page.route(`**/sources/${sourceId}`, async (route) => {
    if (route.request().method() === 'GET' && sourceMissing) {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: '{"error":{"code":"SOURCE_NOT_FOUND"}}',
      });
      return;
    }
    if (route.request().method() === 'GET' && failOnce) {
      failOnce = false;
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: '{"error":{"code":"INTERNAL_ERROR"}}',
      });
      return;
    }
    await route.continue();
  });
  await page.getByRole('button', { name: '审核资料 Retry source' }).click();
  const alert = page.locator('.source-review-panel').getByRole('alert');
  await expect(alert).toContainText('无法加载该资料');
  await expect(alert).toBeFocused();
  await page.getByRole('button', { name: '重试资料审核' }).click();
  await expect(page.getByLabel(/当前草稿修订/)).toHaveValue('Retry body');
  await page.getByRole('button', { name: '关闭审核' }).click();
  sourceMissing = true;
  await page.getByRole('button', { name: '审核资料 Retry source' }).click();
  await expect(page.getByText('该资料不可用，资料列表已刷新。')).toBeVisible();
  await expect(page.locator('.source-review-panel')).toHaveCount(0);
});
