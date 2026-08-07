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
  await page.getByLabel('Owner password').fill(password(value));
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page
    .getByRole('button', { name: /Create Content Package|New package/ })
    .first()
    .click();
  await page.getByLabel('Title').fill('M2 source review package');
  await page.getByRole('button', { name: 'Create package' }).click();
  await expect(page).toHaveURL(/\/packages\/[0-9a-f-]+$/);
}

async function addPastedSource(
  page: Page,
  input: { readonly label: string; readonly text: string; readonly supporting?: boolean },
): Promise<string> {
  if (input.supporting) await page.getByRole('radio', { name: /Supporting/ }).check();
  await page.getByLabel('Label Optional').fill(input.label);
  await page.getByLabel('Pasted text').fill(input.text);
  const created = page.waitForResponse(
    (response) => response.url().endsWith('/sources') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Add Source' }).click();
  return ((await (await created).json()) as { data: { source: { id: string } } }).data.source.id;
}

test('M2 Source review: explicit save, immutable Version, and exact approval survive refresh', async ({ page }) => {
  const value = state();
  await packageWorkspace(page, value);
  await page.getByLabel('Pasted text').fill('Initial normalized Source body');
  await page.getByRole('button', { name: 'Add Source' }).click();
  await page.getByRole('button', { name: /Review Source/ }).click();
  const editor = page.getByLabel(/Normalized Working Copy/);
  await expect(editor).toHaveValue('Initial normalized Source body');
  await editor.fill('Saved review body');
  await expect(page.getByRole('button', { name: 'Create Version' })).toBeDisabled();
  await page.getByRole('button', { name: 'Save Working Copy' }).click();
  await expect(page.getByText(/Working Copy revision 2 saved/)).toBeVisible();
  await page.getByRole('button', { name: 'Create Version' }).click();
  await expect(page.getByText('Version 1 created from the saved Working Copy.')).toBeVisible();
  await expect(page.getByLabel('Version 1 immutable review')).toContainText('Saved review body');
  await page.getByRole('button', { name: 'Approve Version 1' }).click();
  await expect(page.getByRole('dialog', { name: 'Approve Version 1?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Confirm approval' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Approve Version 1' })).toBeFocused();
  await page.getByRole('button', { name: 'Approve Version 1' }).click();
  await page.getByRole('button', { name: 'Confirm approval' }).click();
  await expect(page.getByText('Version 1 is now the current approved Version.')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: /Review Source/ }).click();
  await page
    .locator('.version-list')
    .getByRole('button', { name: /^Version 1\b/ })
    .click();
  await expect(page.getByText('Current approved')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Approve Version 1' })).toHaveCount(0);
});

test('M2 Source review: a revision conflict preserves the local draft until an explicit reload', async ({ page }) => {
  const value = state();
  await packageWorkspace(page, value);
  const created = page.waitForResponse(
    (response) => response.url().endsWith('/sources') && response.request().method() === 'POST',
  );
  await page.getByLabel('Pasted text').fill('Initial revision');
  await page.getByRole('button', { name: 'Add Source' }).click();
  const sourceId = ((await (await created).json()) as { data: { source: { id: string } } }).data.source.id;
  const packageId = page.url().split('/').at(-1);
  if (!packageId) throw new Error('workspace route is missing its opaque identity');
  await page.getByRole('button', { name: /Review Source/ }).click();
  const editor = page.getByLabel(/Normalized Working Copy/);
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
  await page.getByRole('button', { name: 'Save Working Copy' }).click();
  await expect(page.locator('.source-review-panel').getByRole('alert')).toContainText('Your draft is preserved');
  await expect(editor).toHaveValue('Local unsaved review');
  await expect(page.getByRole('button', { name: 'Save Working Copy' })).toBeDisabled();
  await page.getByRole('button', { name: 'Reload authoritative copy' }).click();
  await expect(editor).toHaveValue('Authoritative concurrent revision');
});

test('M2 Source review: two immutable Versions remain selectable with exact Head state', async ({ page }) => {
  const value = state();
  await packageWorkspace(page, value);
  await addPastedSource(page, { label: 'Versioned source', text: 'Version one body' });
  await page.getByRole('button', { name: 'Review Source Versioned source' }).click();
  await page.getByRole('button', { name: 'Create Version' }).click();
  await expect(page.getByLabel('Version 1 immutable review')).toContainText('Version one body');
  const editor = page.getByLabel(/Normalized Working Copy/);
  await editor.fill('Version two body');
  await page.getByRole('button', { name: 'Save Working Copy' }).click();
  await page.getByRole('button', { name: 'Create Version' }).click();
  await expect(page.getByRole('button', { name: 'Create Version' })).toBeDisabled();
  const versionList = page.locator('.version-list');
  const version2Row = versionList.getByRole('button', { name: /^Version 2\b/ });
  await expect(version2Row).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Version 2 immutable review')).toContainText('Version two body');
  await expect(page.getByLabel('Version 2 immutable review')).toContainText('Latest');
  await expect(page.getByLabel('Version 2 immutable review')).toContainText('Review candidate');
  const version1Row = versionList.getByRole('button', { name: /^Version 1\b/ });
  await version1Row.click();
  await expect(version1Row).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Version 1 immutable review')).toContainText('Version one body');
  await expect(page.getByLabel('Version 1 immutable review')).not.toContainText('Review candidate');
  await expect(page.getByRole('button', { name: 'Approve Version 1' })).toHaveCount(0);
});

test('M2 Source review: stale candidate confirmation refreshes the exact authoritative Head', async ({ page }) => {
  const value = state();
  await packageWorkspace(page, value);
  const sourceId = await addPastedSource(page, { label: 'Stale candidate source', text: 'Version one body' });
  const packageId = page.url().split('/').at(-1);
  if (!packageId) throw new Error('workspace route is missing its opaque identity');
  await page.getByRole('button', { name: 'Review Source Stale candidate source' }).click();
  await page.getByRole('button', { name: 'Create Version' }).click();
  await page.getByRole('button', { name: 'Approve Version 1', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Approve Version 1?' })).toBeVisible();

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

  await page.getByRole('button', { name: 'Confirm approval' }).click();
  const review = page.locator('.source-review-panel');
  await expect(review.getByRole('alert')).toContainText('no longer approvable');
  await expect(review.getByText('Version 1 is now the current approved Version.')).toHaveCount(0);
  await expect(review.getByRole('button', { name: 'Approve Version 1', exact: true })).toHaveCount(0);
  const version2Row = review.locator('.version-list').getByRole('button', { name: /^Version 2\b/ });
  await version2Row.click();
  await expect(review.getByRole('button', { name: 'Approve Version 2', exact: true })).toBeVisible();
  await expect(review.getByLabel('Version 2 immutable review')).toContainText('Review candidate');
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

  const timeline = page.locator('.workflow-timeline-panel');
  const items = timeline.locator('.timeline-list > li');
  await expect(items).toHaveCount(2);
  await expect(items.nth(0)).toContainText('URL capture requested');
  await expect(items.nth(1)).toContainText('URL capture recovery scheduled');
  await timeline.getByRole('button', { name: 'Load more activity' }).click();
  await expect(items).toHaveCount(3);
  await expect(items.nth(0)).toContainText('URL capture requested');
  await expect(items.nth(1)).toContainText('URL capture recovery scheduled');
  await expect(items.nth(2)).toContainText('URL Source captured');
  await expect(timeline.getByText('URL capture recovery scheduled', { exact: true })).toHaveCount(1);
  await expect(timeline.getByRole('button', { name: 'Load more activity' })).toHaveCount(0);
});

test('M2 Source review: dirty navigation stays blocked until explicit discard', async ({ page }) => {
  const value = state();
  await packageWorkspace(page, value);
  await addPastedSource(page, { label: 'Guarded source', text: 'Authoritative guard body' });
  await addPastedSource(page, { label: 'Other source', text: 'Other body', supporting: true });
  await page.getByRole('button', { name: 'Review Source Guarded source' }).click();
  await page.getByLabel(/Normalized Working Copy/).fill('Unsaved guarded body');

  const workspaceUrl = page.url();
  await page.locator('.primary-nav').getByRole('link', { name: 'Dashboard' }).click();
  await expect(page).toHaveURL(workspaceUrl);
  await page.locator('a.back-link').click();
  await expect(page).toHaveURL(workspaceUrl);
  await expect(page.getByText('Save or discard the unsaved Source draft before leaving this workspace.')).toBeVisible();
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(workspaceUrl);
  await expect(page.getByRole('button', { name: /Package metadata/ })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Review Source Other source' })).toBeDisabled();
  await page.getByRole('button', { name: 'Archive package' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Close review' }).click();
  await expect(page.locator('.source-review-panel').getByRole('alert')).toBeFocused();
  await page.getByRole('button', { name: 'Discard draft' }).click();
  await expect(page.getByLabel(/Normalized Working Copy/)).toHaveValue('Authoritative guard body');
  await page.locator('a.back-link').click();
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

  await page.getByRole('button', { name: 'Review Source Source A' }).click();
  await paused;
  await page.getByRole('button', { name: 'Review Source Source B' }).click();
  await expect(page.getByRole('heading', { name: 'Source B' })).toBeVisible();
  await expect(page.getByLabel(/Normalized Working Copy/)).toHaveValue('B body');
  releaseSourceA?.();
  await expect(page.getByLabel(/Normalized Working Copy/)).toHaveValue('B body');
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
  await page.getByRole('button', { name: 'Review Source Retry source' }).click();
  const alert = page.locator('.source-review-panel').getByRole('alert');
  await expect(alert).toContainText('could not be loaded');
  await expect(alert).toBeFocused();
  await page.getByRole('button', { name: 'Retry Source review' }).click();
  await expect(page.getByLabel(/Normalized Working Copy/)).toHaveValue('Retry body');
  await page.getByRole('button', { name: 'Close review' }).click();
  sourceMissing = true;
  await page.getByRole('button', { name: 'Review Source Retry source' }).click();
  await expect(page.getByText('This Source is unavailable. The Source collection was refreshed.')).toBeVisible();
  await expect(page.locator('.source-review-panel')).toHaveCount(0);
});
