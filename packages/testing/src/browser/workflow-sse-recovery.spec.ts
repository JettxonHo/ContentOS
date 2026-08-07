import { readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import { SMOKE_STATE_FILE_ENV } from '../integration/env.js';

interface BrowserSmokeState {
  readonly envFile: string;
  readonly webOrigin: string;
  readonly apiOrigin: string;
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

test('M2-WF-004B: native credentialed EventSource receives and closes an exact notification without Workspace composition', async ({
  page,
}) => {
  const state = requireState();
  const password = readKeyValueFile(state.envFile).CONTENTOS_TEST_OWNER_PASSWORD;
  if (!password) throw new Error('temporary browser fixture is missing');

  await page.goto(state.webOrigin);
  await page.getByLabel('Owner password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(state.webOrigin + '/');

  const packageId = await page.evaluate(async (apiOrigin) => {
    const response = await fetch(`${apiOrigin}/v1/content-packages`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Browser EventSource Package',
        contentMode: 'creator_led',
        requestedOutputs: ['blog', 'xiaohongshu'],
      }),
    });
    if (!response.ok) throw new Error('browser package fixture was not created');
    return ((await response.json()) as { data: { contentPackage: { id: string } } }).data.contentPackage.id;
  }, state.apiOrigin);

  const response = page.waitForResponse(
    (candidate) => candidate.url() === `${state.apiOrigin}/v1/content-packages/${packageId}/workflow/stream`,
  );
  const notification = await page.evaluate(
    ({ apiOrigin, id }) =>
      new Promise<{ readonly data: string }>((resolve, reject) => {
        const source = new EventSource(`${apiOrigin}/v1/content-packages/${id}/workflow/stream`, {
          withCredentials: true,
        });
        const timeout = window.setTimeout(() => {
          source.close();
          reject(new Error('browser EventSource notification timed out'));
        }, 10_000);
        source.addEventListener('workflow-notification/v1', (event) => {
          window.clearTimeout(timeout);
          source.close();
          resolve({ data: (event as MessageEvent<string>).data });
        });
        source.addEventListener('error', () => {
          window.clearTimeout(timeout);
          source.close();
          reject(new Error('browser EventSource failed'));
        });
      }),
    { apiOrigin: state.apiOrigin, id: packageId },
  );

  const streamResponse = await response;
  expect(streamResponse.status()).toBe(200);
  expect(streamResponse.headers()['content-type']).toContain('text/event-stream');
  expect(JSON.parse(notification.data)).toEqual({ workflowInstanceId: null, latestSequence: 0 });
});
