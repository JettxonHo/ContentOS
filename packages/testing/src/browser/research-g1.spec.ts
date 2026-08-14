import { readFileSync } from 'node:fs';

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

test('G1 Research: owner reviews evidence, checkpoints a Version, and approves it exactly', async ({ page }) => {
  const value = state();
  await page.goto(value.webOrigin);
  await page.getByLabel('所有者密码').fill(password(value));
  await page.getByRole('button', { name: '登录' }).click();
  await page
    .getByRole('button', { name: /新建内容项目/ })
    .first()
    .click();
  await page.getByLabel('项目标题').fill('G1 research browser package');
  await page.locator('.create-panel').getByRole('button', { name: '创建内容项目' }).click();
  await expect(page).toHaveURL(/\/packages\/[0-9a-f-]+$/);

  await page.getByRole('button', { name: '+ 添加资料' }).click();
  await page.getByLabel('资料名称（可选）').fill('Approved primary evidence');
  await page
    .getByLabel('资料正文')
    .fill('Research evidence must remain traceable.\n\nHuman review remains authoritative.');
  await page.getByRole('button', { name: '添加资料', exact: true }).click();
  await page.getByRole('button', { name: /审核资料 Approved primary evidence/ }).click();
  await page.getByRole('button', { name: '保存为版本' }).click();
  await page.getByRole('button', { name: '批准版本 1' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '确认批准' }).click();
  await expect(page.getByText('版本 1 已成为当前批准版本。')).toBeVisible();

  let releaseResearchLoad = (): void => undefined;
  const researchLoadGate = new Promise<void>((resolve) => {
    releaseResearchLoad = resolve;
  });
  let prematureResearchMutations = 0;
  await page.route('**/v1/content-packages/*/research', async (route) => {
    if (route.request().method() === 'GET') await researchLoadGate;
    else prematureResearchMutations += 1;
    await route.continue();
  });
  await page.getByRole('button', { name: /^研究：/ }).click();
  const loadingAction = page.getByRole('button', { name: '生成研究候选', exact: true });
  await expect(loadingAction).toHaveCount(0);
  expect(prematureResearchMutations).toBe(0);
  releaseResearchLoad();
  await expect(page.getByRole('heading', { name: '审核有证据支撑的研究' })).toBeVisible();
  await page.unroute('**/v1/content-packages/*/research');
  await page.getByRole('button', { name: '生成研究候选', exact: true }).click();
  await expect(page.getByText('研究候选已生成')).toBeVisible();
  await expect(page.getByLabel('item-1 的研究内容')).toHaveValue('Research evidence must remain traceable.');
  await page.getByText('证据（1）').click();
  await expect(page.getByText(/资料版本 .* 第 1 段/)).toBeVisible();

  await page.getByLabel('item-1 的审核状态').selectOption('corrected');
  await page.getByLabel('item-1 的研究内容').fill('Owner-corrected evidence-backed conclusion.');
  await page.getByLabel('研究摘要').fill('Owner-reviewed Research summary.');
  await page.getByRole('button', { name: '保存修改' }).click();
  await expect(page.getByText('研究草稿已保存。')).toBeVisible();
  await page.getByRole('button', { name: '保存为版本' }).click();
  await expect(page.getByText('已保存不可变研究版本。')).toBeVisible();
  await page.getByRole('button', { name: '批准此版本' }).click();
  await expect(page.getByText('已批准精确研究版本。')).toBeVisible();
  await expect(page.locator('.section-heading .lifecycle')).toHaveText('已批准');

  await page.reload();
  await page.getByRole('button', { name: /^研究：/ }).click();
  await expect(page.getByLabel('研究摘要')).toHaveValue('Owner-reviewed Research summary.');
  await expect(page.getByLabel('item-1 的研究内容')).toHaveValue('Owner-corrected evidence-backed conclusion.');
  await expect(page.locator('.section-heading .lifecycle')).toHaveText('已批准');

  await page.getByRole('button', { name: /^资料：已批准/ }).click();
  await page.getByRole('button', { name: /审核资料 Approved primary evidence/ }).click();
  await page.getByLabel(/当前草稿修订/).fill('Fresh approved evidence after the Research approval.');
  await page.getByRole('button', { name: '保存当前草稿' }).click();
  await page.getByRole('button', { name: '保存为版本' }).click();
  await page.getByRole('button', { name: '批准版本 2' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '确认批准' }).click();
  await expect(page.getByText('版本 2 已成为当前批准版本。')).toBeVisible();

  await page.getByRole('button', { name: /^研究：/ }).click();
  await expect(page.getByText(/当前研究候选需更新/)).toBeVisible();
  await page.getByRole('button', { name: '生成新版研究候选', exact: true }).click();
  await expect(page.getByText('已根据当前已批准资料生成新版研究候选。')).toBeVisible();
  await expect(page.getByText(/旧的已批准研究需更新/)).toBeVisible();
  await page.getByLabel('item-1 的审核状态').selectOption('accepted');
  await page.getByLabel('研究摘要').fill('Research reviewed against the refreshed Source.');
  await page.getByRole('button', { name: '保存修改' }).click();
  await page.getByRole('button', { name: '保存为版本' }).click();
  await page.getByRole('button', { name: '批准此版本' }).click();
  await expect(page.getByText('已批准精确研究版本。')).toBeVisible();
  await expect(page.getByText(/旧的已批准研究需更新/)).toHaveCount(0);
});
