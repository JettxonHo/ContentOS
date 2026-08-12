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
  await page.getByRole('button', { name: 'Create package' }).click();
  await page.getByLabel('Label Optional').fill('Blog evidence');
  await page.getByLabel('Pasted text').fill('Verified evidence supports a practical conclusion.');
  await page.getByRole('button', { name: 'Add Source' }).click();
  await page.getByRole('button', { name: /Review Source Blog evidence/ }).click();
  await page.getByRole('button', { name: 'Create Version' }).click();
  await page.getByRole('button', { name: 'Approve Version 1' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm approval' }).click();
  await page.getByRole('button', { name: /Research/ }).click();
  await page.getByRole('button', { name: 'Generate Research' }).click();
  await page.getByLabel('Review state for item-1').selectOption('accepted');
  await page.getByRole('button', { name: 'Save review' }).click();
  await page.getByRole('button', { name: 'Checkpoint Version' }).click();
  await page.getByRole('button', { name: 'Approve exact Version' }).click();
  await page.getByRole('button', { name: /Opinion & creation/ }).click();
  await expect(page.getByRole('heading', { name: 'Shape the point, then approve the article' })).toBeVisible();
  await page.getByLabel('Raw Human Opinion response').fill('Readers should apply only verified evidence.');
  await page.getByRole('button', { name: 'Interpret response' }).click();
  await expect(page.getByText('Interpretation prepared.')).toBeVisible();
  await page.getByLabel('Confirm or correct the interpretation').fill('Readers should act on verified evidence.');
  await page.getByRole('button', { name: 'Confirm Human Opinion' }).click();
  await expect(page.getByText('Immutable Human Opinion Version confirmed.')).toBeVisible();
  await page.getByLabel('Blog voice').selectOption('creator_led');
  await page.getByRole('button', { name: 'Generate Blog Candidate' }).click();
  await expect(page.getByLabel('Article Markdown')).toContainText('Readers should act on verified evidence.');
  await page.getByLabel('Summary').fill('Owner-reviewed Blog summary.');
  await page.getByRole('button', { name: 'Save draft' }).click();
  await expect(page.getByText('Blog Working Copy saved.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Approve exact Version' })).toBeDisabled();
  await page.getByRole('button', { name: 'Checkpoint Version' }).click();
  await page.getByRole('button', { name: 'Approve exact Version' }).click();
  await expect(page.getByText('Exact Blog Version approved.')).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export article.md' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('article.md');
  await page.getByRole('button', { name: /Xiaohongshu/ }).click();
  await expect(page.getByRole('button', { name: 'Generate Xiaohongshu Candidate' })).toBeDisabled();
  await page.getByLabel('Xiaohongshu mode').selectOption('creator_led');
  await page.getByRole('button', { name: 'Generate Xiaohongshu Candidate' }).click();
  await expect(page.getByText('Eight-page Packaging candidate generated.')).toBeVisible();
  await expect(page.getByText(/page-8/)).toBeVisible();
  await expect(page.getByText('Platform Title Candidates')).toBeVisible();
  await expect(page.getByText(/Emphasis:/).first()).toBeVisible();
  await expect(page.getByText(/Visual brief:/).first()).toBeVisible();
  await expect(page.getByText(/Research items:/).first()).toBeVisible();
  await expect(page.getByText('Public References')).toBeVisible();
  await page.getByLabel('Caption').fill('Owner-reviewed Xiaohongshu caption.');
  await page.getByRole('button', { name: 'Move page down' }).first().click();
  await page.getByRole('button', { name: 'Save Xiaohongshu draft' }).click();
  await expect(page.getByText('Xiaohongshu Working Copy saved.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Approve Xiaohongshu Version' })).toBeDisabled();
  await page.getByRole('button', { name: 'Checkpoint Xiaohongshu Version' }).click();
  await page.getByRole('button', { name: 'Approve Xiaohongshu Version' }).click();
  await expect(page.getByText('Exact Xiaohongshu Version approved.')).toBeVisible();
  const postDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export post.md' }).click();
  expect((await postDownloadPromise).suggestedFilename()).toBe('post.md');
  const pagesDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export pages.json' }).click();
  expect((await pagesDownloadPromise).suggestedFilename()).toBe('pages.json');
  await page.reload();
  await page.getByRole('button', { name: /Xiaohongshu/ }).click();
  await expect(page.getByLabel('Caption')).toHaveValue('Owner-reviewed Xiaohongshu caption.');
  await expect(page.getByText('Approved', { exact: true })).toBeVisible();
});
