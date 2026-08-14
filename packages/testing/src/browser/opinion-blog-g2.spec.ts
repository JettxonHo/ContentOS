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
  await page.getByLabel('Owner password').fill(password(value));
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page
    .getByRole('button', { name: /Create Content Package|New package/ })
    .first()
    .click();
  await page.getByLabel('Title').fill('G2 Blog browser package');
  await page.getByLabel('Content mode').selectOption('creator_led');
  await page.getByRole('button', { name: 'Create package' }).click();
  await page.getByLabel('Label Optional').fill('Blog evidence');
  await page.getByLabel('Pasted text').fill('Verified evidence supports a practical conclusion.');
  await page.getByRole('button', { name: 'Add Source' }).click();
  await page.getByRole('button', { name: /Review Source Blog evidence/ }).click();
  await page.getByRole('button', { name: 'Create Version' }).click();
  await page.getByRole('button', { name: 'Approve Version 1' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm approval' }).click();
  await page.getByRole('button', { name: /^Research:/ }).click();
  await page.getByRole('button', { name: 'Generate Research Candidate', exact: true }).click();
  await page.getByLabel('Review state for item-1').selectOption('accepted');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByRole('button', { name: 'Create immutable Version' }).click();
  await page.getByRole('button', { name: 'Approve exact Version' }).click();
  await page.getByRole('button', { name: /^Opinion & Blog:/ }).click();
  await expect(page.getByRole('heading', { name: 'Shape the point, then approve the article' })).toBeVisible();
  await page.getByLabel('Raw Human Opinion response').fill('Readers should apply only verified evidence.');
  await page.getByRole('button', { name: 'Interpret response' }).click();
  await expect(page.getByText(/Interpretation prepared against current Approved Research/)).toBeVisible();
  await page.getByLabel('2. Review or correct the interpretation').fill('Readers should act on verified evidence.');
  await page.getByRole('button', { name: 'Confirm exact Opinion Version' }).click();
  await expect(page.getByText('Immutable Human Opinion Version confirmed.')).toBeVisible();
  await expect(page.getByText('No duplicate confirmation is needed.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirm exact Opinion Version' })).toHaveCount(0);
  await expect(page.getByLabel('2. Review or correct the interpretation')).toHaveValue(
    'Readers should act on verified evidence.',
  );
  await page.reload();
  await page.getByRole('button', { name: /^Opinion & Blog:/ }).click();
  await expect(page.getByLabel('2. Review or correct the interpretation')).toHaveValue(
    'Readers should act on verified evidence.',
  );
  await page.getByLabel('Raw Human Opinion response').fill('Readers should apply updated verified evidence.');
  await page.getByRole('button', { name: 'Interpret updated response', exact: true }).click();
  await expect(page.getByLabel('2. Review or correct the interpretation')).toHaveValue(
    'Readers should apply updated verified evidence.',
  );
  await page.getByRole('button', { name: 'Confirm exact Opinion Version' }).click();
  await page.getByRole('button', { name: /^Sources: Approved/ }).click();
  await page.getByRole('button', { name: /Review Source Blog evidence/ }).click();
  await page
    .getByLabel(/Normalized Working Copy/)
    .fill('Verified evidence now supports a refreshed practical conclusion.');
  await page.getByRole('button', { name: 'Save Working Copy' }).click();
  await page.getByRole('button', { name: 'Create Version' }).click();
  await page.getByRole('button', { name: 'Approve Version 2' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm approval' }).click();
  await page.getByRole('button', { name: /^Research: Outdated/ }).click();
  await page.getByRole('button', { name: 'Generate fresh Research Candidate', exact: true }).click();
  await page.getByLabel('Review state for item-1').selectOption('accepted');
  await page.getByLabel('Summary').fill('Research refreshed for the updated approved Source.');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByRole('button', { name: 'Create immutable Version' }).click();
  await page.getByRole('button', { name: 'Approve exact Version' }).click();
  await page.getByRole('button', { name: /^Opinion & Blog: Outdated/ }).click();
  await expect(page.getByLabel('Raw Human Opinion response')).toHaveValue(
    'Readers should apply updated verified evidence.',
  );
  await page.getByRole('button', { name: 'Re-interpret with current Research', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm exact Opinion Version' }).click();
  await page.getByLabel('Content mode').selectOption('creator_led');
  await page.getByRole('button', { name: 'Generate Blog Candidate', exact: true }).click();
  await expect(page.getByLabel('Article Markdown')).toContainText('Readers should apply updated verified evidence.');
  await page.getByLabel('Summary').fill('Owner-reviewed Blog summary.');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Blog Working Copy saved.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Approve exact Version' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Create immutable Version' }).click();
  await page.getByRole('button', { name: 'Approve exact Version' }).click();
  await expect(page.getByText('Exact Blog Version approved.')).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export article.md', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('article.md');
  await page.getByRole('button', { name: /^Xiaohongshu:/ }).click();
  await expect(page.getByLabel('Xiaohongshu mode')).toHaveValue('creator_led');
  await page.getByRole('button', { name: 'Generate Xiaohongshu Candidate', exact: true }).click();
  await expect(page.getByText('Eight-page Xiaohongshu Candidate generated.')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Xiaohongshu pages' }).getByRole('button')).toHaveCount(8);
  await page.getByRole('navigation', { name: 'Xiaohongshu pages' }).getByRole('button').nth(7).click();
  await page.getByText('Traceability', { exact: true }).click();
  await expect(page.getByText('Visual brief', { exact: true })).toBeVisible();
  await page.getByLabel('Caption').fill('Owner-reviewed Xiaohongshu caption.');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Xiaohongshu Working Copy saved.')).toBeVisible();
  await page.getByRole('button', { name: 'Create immutable Version' }).click();
  await page.getByRole('button', { name: 'Approve exact Version' }).click();
  await expect(page.getByText('Exact Xiaohongshu Version approved.')).toBeVisible();
  const postDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export post.md', exact: true }).click();
  expect((await postDownloadPromise).suggestedFilename()).toBe('post.md');
  const pagesDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export pages.json', exact: true }).click();
  expect((await pagesDownloadPromise).suggestedFilename()).toBe('pages.json');
  await page.reload();
  await page.getByRole('button', { name: /^Xiaohongshu:/ }).click();
  await expect(page.getByLabel('Caption')).toHaveValue('Owner-reviewed Xiaohongshu caption.');
  await expect(page.locator('.section-heading .lifecycle')).toHaveText('Approved');
  const visualQaDirectory = process.env.CONTENTOS_VISUAL_QA_DIRECTORY;
  if (visualQaDirectory) {
    mkdirSync(visualQaDirectory, { recursive: true });
    await page.screenshot({ path: join(visualQaDirectory, 'xiaohongshu-desktop.png'), fullPage: true });
  }
  await page.setViewportSize({ width: 720, height: 900 });
  await expect(page.getByRole('navigation', { name: 'Xiaohongshu pages' })).toBeVisible();
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
  await page.getByLabel('Owner password').fill(password(value));
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page
    .getByRole('button', { name: /Create Content Package|New package/ })
    .first()
    .click();
  await page.getByLabel('Title').fill('G2 deferred-mode browser package');
  await page.getByRole('button', { name: 'Create package' }).click();
  await page.getByLabel('Label Optional').fill('Deferred mode evidence');
  await page.getByLabel('Pasted text').fill('Verified evidence supports an explicit content-mode choice.');
  await page.getByRole('button', { name: 'Add Source' }).click();
  await page.getByRole('button', { name: /Review Source Deferred mode evidence/ }).click();
  await page.getByRole('button', { name: 'Create Version' }).click();
  await page.getByRole('button', { name: 'Approve Version 1' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm approval' }).click();
  await page.getByRole('button', { name: /^Research:/ }).click();
  await page.getByRole('button', { name: 'Generate Research Candidate', exact: true }).click();
  await page.getByLabel('Review state for item-1').selectOption('accepted');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByRole('button', { name: 'Create immutable Version' }).click();
  await page.getByRole('button', { name: 'Approve exact Version' }).click();
  await page.getByRole('button', { name: /^Opinion & Blog:/ }).click();
  const contentMode = page.getByRole('combobox', { name: 'Content mode' });
  await expect(contentMode).toHaveValue('deferred');
  await expect(page.getByRole('button', { name: 'Choose a content mode', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Generate Blog Candidate', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Choose a content mode', exact: true }).click();
  await expect(contentMode).toBeFocused();
  await contentMode.selectOption('research_based');
  await expect(page.getByRole('button', { name: 'Generate Blog Candidate', exact: true })).toBeVisible();
});
