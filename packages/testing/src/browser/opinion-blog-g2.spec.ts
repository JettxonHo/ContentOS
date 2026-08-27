import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
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

test('G2/G3: owner approves and exports independent Blog and Xiaohongshu text Versions', async ({ page }) => {
  const value = state();
  await page.goto(value.webOrigin);
  await page.getByLabel('所有者密码').fill(password(value));
  await page.getByRole('button', { name: '登录' }).click();
  await page
    .getByRole('button', { name: /新建内容项目/ })
    .first()
    .click();
  await page.getByLabel('项目标题').fill('G2 Blog browser package');
  await page.getByLabel('内容模式').selectOption('creator_led');
  await page.locator('.create-panel').getByRole('button', { name: '创建内容项目' }).click();
  await page.getByRole('button', { name: '+ 添加资料' }).click();
  await page.getByLabel('资料名称（可选）').fill('Blog evidence');
  await page.getByLabel('资料正文').fill('Verified evidence supports a practical conclusion.');
  await page.getByRole('button', { name: '添加资料', exact: true }).click();
  await page.getByRole('button', { name: /审核资料 Blog evidence/ }).click();
  await page.getByRole('button', { name: '保存为版本' }).click();
  await page.getByRole('button', { name: '批准版本 1' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '确认批准' }).click();
  await page.getByRole('button', { name: /^研究：/ }).click();
  await page.getByRole('button', { name: '生成研究候选', exact: true }).click();
  await page.getByLabel('item-1 的审核状态').selectOption('accepted');
  await page.getByRole('button', { name: '保存修改' }).click();
  await page.getByRole('button', { name: '保存为版本' }).click();
  await page.getByRole('button', { name: '批准此版本' }).click();
  const packageId = page.url().split('/').at(-1);
  if (!packageId) throw new Error('workspace route is missing its opaque identity');
  let releaseOpinionLoad = (): void => undefined;
  const opinionLoadGate = new Promise<void>((resolve) => {
    releaseOpinionLoad = resolve;
  });
  let prematureOpinionMutations = 0;
  for (const resource of ['opinion', 'blog'] as const) {
    await page.route(`**/v1/content-packages/${packageId}/${resource}`, async (route) => {
      if (route.request().method() === 'GET') await opinionLoadGate;
      else prematureOpinionMutations += 1;
      await route.continue();
    });
  }
  await page.getByRole('button', { name: /^观点与文章：/ }).click();
  await expect(page.locator('.workspace-context-panel .next-action-button')).toHaveCount(0);
  expect(prematureOpinionMutations).toBe(0);
  releaseOpinionLoad();
  await expect(page.getByRole('heading', { name: '先明确观点，再审核文章' })).toBeVisible();
  await page.unroute(`**/v1/content-packages/${packageId}/opinion`);
  await page.unroute(`**/v1/content-packages/${packageId}/blog`);
  await page.getByLabel('人工观点原始回答').fill('Readers should apply only verified evidence.');
  await page.getByRole('button', { name: '解读回答' }).click();
  await expect(page.getByText(/已基于当前已批准研究准备解读/)).toBeVisible();
  await page.getByLabel('2. 审核或修正解读').fill('Readers should act on verified evidence.');
  await page.getByRole('button', { name: '确认精确观点版本', exact: true }).click();
  await expect(page.getByText('不可变人工观点版本已确认。')).toBeVisible();
  await expect(page.getByText('无需重复确认')).toBeVisible();
  await expect(page.getByRole('button', { name: '确认精确观点版本', exact: true })).toHaveCount(0);
  await expect(page.getByLabel('2. 审核或修正解读')).toHaveValue('Readers should act on verified evidence.');
  await page.reload();
  await page.getByRole('button', { name: /^观点与文章：/ }).click();
  await expect(page.getByLabel('2. 审核或修正解读')).toHaveValue('Readers should act on verified evidence.');
  await page.getByLabel('人工观点原始回答').fill('Readers should apply updated verified evidence.');
  await page.getByRole('button', { name: '解读更新后的回答', exact: true }).click();
  await expect(page.getByLabel('2. 审核或修正解读')).toHaveValue('Readers should apply updated verified evidence.');
  await page.getByRole('button', { name: '确认精确观点版本' }).click();
  await page.getByRole('button', { name: /^资料：已批准/ }).click();
  await page.getByRole('button', { name: /审核资料 Blog evidence/ }).click();
  await page.getByLabel(/当前草稿修订/).fill('Verified evidence now supports a refreshed practical conclusion.');
  await page.getByRole('button', { name: '保存当前草稿' }).click();
  await page.getByRole('button', { name: '保存为版本' }).click();
  await page.getByRole('button', { name: '批准版本 2' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '确认批准' }).click();
  await page.getByRole('button', { name: /^研究：需更新/ }).click();
  await page.getByRole('button', { name: '生成新版研究候选', exact: true }).click();
  await page.getByLabel('item-1 的审核状态').selectOption('accepted');
  await page.getByLabel('研究摘要').fill('Research refreshed for the updated approved Source.');
  await page.getByRole('button', { name: '保存修改' }).click();
  await page.getByRole('button', { name: '保存为版本' }).click();
  await page.getByRole('button', { name: '批准此版本' }).click();
  await page.getByRole('button', { name: /^观点与文章：需更新/ }).click();
  await expect(page.getByLabel('人工观点原始回答')).toHaveValue('Readers should apply updated verified evidence.');
  await page.getByRole('button', { name: '基于当前研究重新解读', exact: true }).click();
  await page.getByRole('button', { name: '确认精确观点版本' }).click();
  await page.getByLabel('创作模式').selectOption('creator_led');
  await page.getByRole('button', { name: '生成文章候选', exact: true }).click();
  await expect(page.getByLabel('文章 Markdown')).toContainText('Readers should apply updated verified evidence.');
  await expect(page.locator('.chief-editor-assistant')).toContainText('强调治理分工');
  await expect(page.locator('.chief-editor-assistant')).toContainText('强调落地执行');
  const visualQaDirectory = process.env.CONTENTOS_VISUAL_QA_DIRECTORY;
  if (visualQaDirectory) {
    mkdirSync(visualQaDirectory, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 1024 });
    await page.screenshot({ path: join(visualQaDirectory, 'assistant-state-blog-review-1440.png') });
  }
  await page.getByLabel('文章摘要').fill('Owner-reviewed Blog summary.');
  await page.getByRole('button', { name: '保存修改' }).click();
  await expect(page.getByText('文章草稿已保存。')).toBeVisible();
  await expect(page.getByRole('button', { name: '批准此版本' })).toHaveCount(0);
  await page.getByRole('button', { name: '保存为版本' }).click();
  await page.getByRole('button', { name: '批准此版本' }).click();
  await expect(page.getByText('已批准精确文章版本。')).toBeVisible();
  await expect(page.locator('.chief-editor-assistant')).toContainText('当前精确版本已批准并锁定');
  if (visualQaDirectory) {
    await page.screenshot({ path: join(visualQaDirectory, 'assistant-state-blog-approved-1440.png') });
  }
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出 article.md', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('article.md');
  let releaseXiaohongshuLoad = (): void => undefined;
  const xiaohongshuLoadGate = new Promise<void>((resolve) => {
    releaseXiaohongshuLoad = resolve;
  });
  let prematureXiaohongshuMutations = 0;
  await page.route(`**/v1/content-packages/${packageId}/xiaohongshu`, async (route) => {
    if (route.request().method() === 'GET') await xiaohongshuLoadGate;
    else prematureXiaohongshuMutations += 1;
    await route.continue();
  });
  await page.getByRole('button', { name: /^小红书：/ }).click();
  await expect(page.locator('.workspace-context-panel .next-action-button')).toHaveCount(0);
  expect(prematureXiaohongshuMutations).toBe(0);
  releaseXiaohongshuLoad();
  await expect(page.getByLabel('小红书创作模式')).toHaveValue('creator_led');
  await page.unroute(`**/v1/content-packages/${packageId}/xiaohongshu`);
  await page.getByRole('button', { name: '生成小红书候选', exact: true }).click();
  await expect(page.getByText('八页小红书候选已生成。')).toBeVisible();
  await expect(page.getByRole('navigation', { name: '小红书页面' }).getByRole('button')).toHaveCount(8);
  await page.getByRole('navigation', { name: '小红书页面' }).getByRole('button').nth(7).click();
  await page.getByText('可追溯信息', { exact: true }).click();
  await expect(page.getByText('视觉说明', { exact: true })).toBeVisible();
  await page.getByLabel('正文说明').fill('Owner-reviewed Xiaohongshu caption.');
  await page.getByRole('button', { name: '保存修改' }).click();
  await expect(page.getByText('小红书草稿已保存。')).toBeVisible();
  await page.getByRole('button', { name: '保存为版本' }).click();
  await page.getByRole('button', { name: '批准此版本' }).click();
  await expect(page.getByText('已批准精确小红书版本。')).toBeVisible();
  const postDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出 post.md', exact: true }).click();
  expect((await postDownloadPromise).suggestedFilename()).toBe('post.md');
  const pagesDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出 pages.json', exact: true }).click();
  expect((await pagesDownloadPromise).suggestedFilename()).toBe('pages.json');
  await page.reload();
  await page.getByRole('button', { name: /^小红书：/ }).click();
  await expect(page.getByLabel('正文说明')).toHaveValue('Owner-reviewed Xiaohongshu caption.');
  await expect(page.locator('.section-heading .lifecycle')).toHaveText('已批准');
  for (const width of [1440, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
    ).toBe(true);
    if (visualQaDirectory) {
      mkdirSync(visualQaDirectory, { recursive: true });
      await page.screenshot({
        path: join(visualQaDirectory, width === 1440 ? 'xiaohongshu-desktop.png' : 'xiaohongshu-1024.png'),
        fullPage: true,
      });
    }
  }
  await page.setViewportSize({ width: 720, height: 900 });
  await expect(page.getByRole('navigation', { name: '小红书页面' })).toBeVisible();
  const pageTabs = page.getByRole('navigation', { name: '小红书页面' }).getByRole('button');
  const tabRows = await pageTabs.evaluateAll(
    (buttons) => new Set(buttons.map((button) => Math.round(button.getBoundingClientRect().top))).size,
  );
  expect(tabRows).toBe(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(
    true,
  );
  if (visualQaDirectory) {
    await page.screenshot({ path: join(visualQaDirectory, 'xiaohongshu-720.png'), fullPage: true });
  }
});

test('G2: deferred mode requires an explicit choice before Blog generation', async ({ page }) => {
  const value = state();
  await page.goto(value.webOrigin);
  await page.getByLabel('所有者密码').fill(password(value));
  await page.getByRole('button', { name: '登录' }).click();
  await page
    .getByRole('button', { name: /新建内容项目/ })
    .first()
    .click();
  await page.getByLabel('项目标题').fill('G2 deferred-mode browser package');
  await page.locator('.create-panel').getByRole('button', { name: '创建内容项目' }).click();
  await page.getByRole('button', { name: '+ 添加资料' }).click();
  await page.getByLabel('资料名称（可选）').fill('Deferred mode evidence');
  await page.getByLabel('资料正文').fill('Verified evidence supports an explicit content-mode choice.');
  await page.getByRole('button', { name: '添加资料', exact: true }).click();
  await page.getByRole('button', { name: /审核资料 Deferred mode evidence/ }).click();
  await page.getByRole('button', { name: '保存为版本' }).click();
  await page.getByRole('button', { name: '批准版本 1' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '确认批准' }).click();
  await page.getByRole('button', { name: /^研究：/ }).click();
  await page.getByRole('button', { name: '生成研究候选', exact: true }).click();
  await page.getByLabel('item-1 的审核状态').selectOption('accepted');
  await page.getByRole('button', { name: '保存修改' }).click();
  await page.getByRole('button', { name: '保存为版本' }).click();
  await page.getByRole('button', { name: '批准此版本' }).click();
  await page.getByRole('button', { name: /^观点与文章：/ }).click();
  const contentMode = page.getByRole('combobox', { name: '创作模式' });
  await expect(contentMode).toHaveValue('deferred');
  await expect(page.getByRole('button', { name: '选择创作模式', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '生成文章候选', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '选择创作模式', exact: true }).click();
  await expect(contentMode).toBeFocused();
  await contentMode.selectOption('research_based');
  await expect(page.getByRole('button', { name: '生成文章候选', exact: true })).toBeVisible();
});
