import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';
import { SMOKE_STATE_FILE_ENV } from '../integration/env.js';

interface BrowserSmokeState {
  envFile: string;
  webOrigin: string;
  apiOrigin: string;
}

function readKeyValueFile(path: string): Record<string, string> {
  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split('\n')
      .filter((line) => line.includes('='))
      .map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );
}

function requireState(): BrowserSmokeState {
  const path = process.env[SMOKE_STATE_FILE_ENV];
  if (!path) throw new Error('Browser smoke state path was not propagated by global setup.');
  return JSON.parse(readFileSync(path, 'utf8')) as BrowserSmokeState;
}

test('M1 owner loop: login, create, edit, refresh, conflict, archive, and logout', async ({ page, context }) => {
  const state = requireState();
  if (process.env.CONTENTOS_BROWSER_INJECT_FAILURE === '1') {
    throw new Error('Injected browser assertion failure for cleanup verification.');
  }
  const pageErrors: string[] = [];
  const webResponses: string[] = [];
  const consoleErrors: string[] = [];
  const requestFailures: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('response', (response) => {
    const url = new URL(response.url());
    const target = url.origin === state.webOrigin ? 'web' : url.origin === state.apiOrigin ? 'api' : `port-${url.port}`;
    webResponses.push(`${target}${url.pathname}:${response.status()}`);
  });
  page.on('requestfailed', (request) => {
    const url = new URL(request.url());
    requestFailures.push(`port-${url.port}${url.pathname}:${request.failure()?.errorText ?? 'failed'}`);
  });
  const password = readKeyValueFile(state.envFile).CONTENTOS_TEST_OWNER_PASSWORD;
  if (!password) {
    throw new Error('temporary browser fixture is missing');
  }

  const initialSessionResponse = page.waitForResponse(
    (response) => response.url() === `${state.apiOrigin}/v1/auth/session`,
    { timeout: 10_000 },
  );
  await page.goto(state.webOrigin);
  const initialResponse = await initialSessionResponse.catch(() => undefined);
  if (!initialResponse) {
    throw new Error(
      `Browser client did not request the owner session.${pageErrors.length > 0 ? ` Page error: ${pageErrors[0]}` : ''}${consoleErrors.length > 0 ? ` Console error: ${consoleErrors[0]}` : ''}${requestFailures.length > 0 ? ` Request failure: ${requestFailures[0]}` : ''} Responses: ${webResponses.join(', ')}`,
    );
  }
  expect(initialResponse.status()).toBe(401);
  await expect(page).toHaveURL(`${state.webOrigin}/login`);
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('heading', { name: '欢迎回来' })).toBeVisible();

  const passwordInput = page.getByLabel('所有者密码');
  await passwordInput.fill('incorrect-browser-password');
  await page.getByRole('button', { name: '登录' }).click();
  await expect(page.locator('#login-error')).toContainText('密码不正确');
  await expect(passwordInput).toHaveValue('');
  await expect(passwordInput).toBeFocused();

  const loginResponse = page.waitForResponse(
    (response) => response.url() === `${state.apiOrigin}/v1/auth/login` && response.status() === 200,
  );
  await passwordInput.fill(password);
  await page.getByRole('button', { name: '登录' }).click();
  const response = await loginResponse;
  expect(response.headers()['access-control-allow-origin']).toBe(state.webOrigin);
  await expect(page).toHaveURL(state.webOrigin + '/');
  const sessionCookie = (await context.cookies()).find((cookie) => cookie.name === 'contentos_session');
  expect(sessionCookie).toMatchObject({ httpOnly: true, sameSite: 'Strict' });

  await expect(page.getByRole('heading', { name: '工作台' })).toBeVisible();
  await expect(page.getByText('开始第一个内容项目')).toBeVisible();
  await expect(page.getByText('设置').locator('..')).toHaveAttribute('aria-disabled', 'true');
  await page.getByRole('button', { name: '新建内容项目' }).click();

  await page.getByLabel('项目标题').fill('M1 browser package');
  await page.getByLabel('项目说明').fill('A private package created through the first product loop.');
  await page.getByLabel('内容模式').selectOption('creator_led');
  const createButton = page.locator('.create-panel').getByRole('button', { name: '创建内容项目' });
  await createButton.dblclick();
  await expect(page).toHaveURL(/\/packages\/[0-9a-f-]+$/);
  await expect(page.getByRole('heading', { name: 'M1 browser package' })).toBeVisible();
  await expect(page.locator('#sources-title')).toBeVisible();
  await expect(page.getByRole('button', { name: /^观点与文章：未就绪/ })).toBeVisible();
  const activityOpener = page.getByRole('button', { name: '运行记录', exact: true });
  await activityOpener.click();
  const activityDrawer = page.getByRole('dialog', { name: '运行记录' });
  await expect(activityDrawer.getByRole('button', { name: '关闭运行记录' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(activityDrawer.getByRole('button', { name: '关闭运行记录' })).toBeFocused();
  await expect(page.getByText('暂无运行记录')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(activityDrawer).toBeHidden();
  await expect(activityOpener).toBeFocused();

  await page.getByRole('button', { name: '+ 添加资料' }).click();
  const drawerTitleIds = await page
    .locator('aside.workspace-drawer')
    .evaluateAll((drawers) => drawers.map((drawer) => drawer.getAttribute('aria-labelledby')));
  expect(drawerTitleIds).toHaveLength(2);
  expect(new Set(drawerTitleIds).size).toBe(2);
  await page.getByRole('button', { name: '关闭添加资料' }).click();

  const id = page.url().split('/').at(-1);
  if (!id) throw new Error('workspace route is missing its opaque identity');
  await page.getByRole('button', { name: /项目信息/ }).click();
  await page.getByLabel('项目标题').fill('M1 persisted package');
  await page.getByLabel('项目描述').fill('Persisted through the authoritative API.');
  await page.getByRole('button', { name: '保存项目信息' }).click();
  await expect(page.getByRole('status')).toContainText('项目信息已保存');
  await expect(page.getByText('版本 2')).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: /项目信息/ }).click();
  await expect(page.getByLabel('项目标题')).toHaveValue('M1 persisted package');
  await expect(page.getByLabel('项目描述')).toHaveValue('Persisted through the authoritative API.');
  await expect(page.getByText('版本 2')).toBeVisible();

  const concurrentStatus = await page.evaluate(
    async ({ apiOrigin, packageId }) => {
      const response = await fetch(`${apiOrigin}/v1/content-packages/${packageId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ expectedRevision: 2, title: 'Concurrent authoritative title' }),
      });
      return response.status;
    },
    { apiOrigin: state.apiOrigin, packageId: id },
  );
  expect(concurrentStatus).toBe(200);
  await page.getByLabel('项目标题').fill('Stale browser title');
  await page.getByRole('button', { name: '保存项目信息' }).click();
  await expect(page.getByText('版本冲突。', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '重新加载最新版本' }).click();
  await expect(page.getByLabel('项目标题')).toHaveValue('Concurrent authoritative title');
  await expect(page.getByText('版本 3')).toBeVisible();

  await page.getByRole('button', { name: '归档项目' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: '归档项目' }).click();
  await expect(page).toHaveURL(`${state.webOrigin}/?view=archived`);
  await expect(page.getByRole('link', { name: /Concurrent authoritative title/ })).toBeVisible();
  await expect(page.getByRole('button', { name: '已归档', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /Concurrent authoritative title/ })).toHaveCount(1);

  await page.getByRole('button', { name: '退出登录' }).click();
  await expect(page).toHaveURL(`${state.webOrigin}/login`);
  await page.goto(`${state.webOrigin}/packages/${id}`);
  await expect(page).toHaveURL(`${state.webOrigin}/login`);
});
