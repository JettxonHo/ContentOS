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

test('V0.3 chief editor assistant is local, explicit, keyboard accessible, and responsive', async ({ page }) => {
  const value = state();
  await page.goto(value.webOrigin);
  await page.getByLabel('所有者密码').fill(password(value));
  await page.getByRole('button', { name: '登录' }).click();
  await page
    .getByRole('button', { name: /新建内容项目/ })
    .first()
    .click();
  await page.getByLabel('项目标题').fill('V0.3 主编助手浏览器项目');
  await page.getByLabel('内容模式').selectOption('research_based');
  await page.locator('.create-panel').getByRole('button', { name: '创建内容项目' }).click();
  await expect(page).toHaveURL(/\/packages\/[0-9a-f-]+$/u);

  const packageId = page.url().split('/').at(-1);
  if (!packageId) throw new Error('workspace route is missing its opaque identity');
  const assistant = page.locator('.chief-editor-assistant');
  const composer = assistant.locator('form.assistant-composer');
  const input = assistant.getByLabel('给主编助手的本地消息');
  const send = assistant.getByRole('button', { name: '发送本地消息' });

  await expect(assistant.getByRole('heading', { name: '主编助手' })).toBeVisible();
  await expect(assistant.getByText('当前 Package', { exact: true })).toBeVisible();
  await expect(assistant.getByText('本地受控预览 · 不调用真实模型')).toBeVisible();
  await expect(composer).toHaveCount(1);
  await expect(send).toBeDisabled();
  const visualQaDirectory = process.env.CONTENTOS_VISUAL_QA_DIRECTORY;
  if (visualQaDirectory) {
    mkdirSync(visualQaDirectory, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 1024 });
    await page.screenshot({ path: join(visualQaDirectory, 'assistant-state-open-1440.png') });
  }

  let productMutations = 0;
  page.on('request', (request) => {
    if (
      request.url().includes(`/v1/content-packages/${packageId}`) &&
      !['GET', 'HEAD', 'OPTIONS'].includes(request.method())
    ) {
      productMutations += 1;
    }
  });

  await input.fill('第一行');
  await input.press('Shift+Enter');
  await input.type('第二行');
  await expect(input).toHaveValue('第一行\n第二行');
  await input.press('Enter');
  await expect(input).toHaveValue('');
  await expect(assistant.locator('[data-message-role="user"]')).toHaveText('第一行\n第二行');
  await expect(assistant.locator('[data-message-role="assistant"]')).toContainText('不会持久化');
  expect(productMutations).toBe(0);
  if (visualQaDirectory) {
    await page.screenshot({ path: join(visualQaDirectory, 'assistant-state-local-message-1440.png') });
  }

  const userTurn = assistant.locator('[data-message-role="user"]').last();
  const assistantTurn = assistant.locator('[data-message-role="assistant"]').last();
  const [userBox, assistantBox] = await Promise.all([userTurn.boundingBox(), assistantTurn.boundingBox()]);
  expect(userBox).not.toBeNull();
  expect(assistantBox).not.toBeNull();
  expect((userBox?.x ?? 0) + (userBox?.width ?? 0)).toBeGreaterThan(
    (assistantBox?.x ?? 0) + (assistantBox?.width ?? 0),
  );
  await input.focus();
  expect(await input.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none');

  await assistant.getByRole('button', { name: '说明下一步' }).click();
  await expect(assistant.locator('[data-message-role="user"]')).toHaveCount(2);
  expect(productMutations).toBe(0);

  const explicitAction = assistant.getByRole('button', { name: '+ 添加资料' });
  await expect(explicitAction).toBeVisible();
  await explicitAction.click();
  await expect(page.getByRole('dialog', { name: '添加资料' })).toBeVisible();
  expect(productMutations).toBe(0);
  await page.getByRole('button', { name: '关闭添加资料' }).click();

  for (const width of [1440, 1024, 720]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(assistant).toBeVisible();
    await expect(composer).toBeVisible();
    await expect(composer).toHaveCount(1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
    ).toBe(true);
    if (visualQaDirectory) {
      mkdirSync(visualQaDirectory, { recursive: true });
      await page.screenshot({ path: join(visualQaDirectory, `chief-editor-assistant-${width}.png`), fullPage: true });
    }
  }
});
