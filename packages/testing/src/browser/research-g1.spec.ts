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
  await page.getByLabel('Owner password').fill(password(value));
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page
    .getByRole('button', { name: /Create Content Package|New package/ })
    .first()
    .click();
  await page.getByLabel('Title').fill('G1 research browser package');
  await page.getByRole('button', { name: 'Create package' }).click();
  await expect(page).toHaveURL(/\/packages\/[0-9a-f-]+$/);

  await page.getByLabel('Label Optional').fill('Approved primary evidence');
  await page
    .getByLabel('Pasted text')
    .fill('Research evidence must remain traceable.\n\nHuman review remains authoritative.');
  await page.getByRole('button', { name: 'Add Source' }).click();
  await page.getByRole('button', { name: /Review Source Approved primary evidence/ }).click();
  await page.getByRole('button', { name: 'Create Version' }).click();
  await page.getByRole('button', { name: 'Approve Version 1' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm approval' }).click();
  await expect(page.getByText('Version 1 is now the current approved Version.')).toBeVisible();

  await page.getByRole('button', { name: /^Research:/ }).click();
  await expect(page.getByRole('heading', { name: 'Review evidence-backed Research' })).toBeVisible();
  await page.getByRole('button', { name: 'Generate Research Candidate', exact: true }).click();
  await expect(page.getByText('Research Candidate generated.')).toBeVisible();
  await expect(page.getByLabel('Research text for item-1')).toHaveValue('Research evidence must remain traceable.');
  await page.getByText('Evidence (1)').click();
  await expect(page.getByText(/Source Version .* paragraph 1/)).toBeVisible();

  await page.getByLabel('Review state for item-1').selectOption('corrected');
  await page.getByLabel('Research text for item-1').fill('Owner-corrected evidence-backed conclusion.');
  await page.getByLabel('Summary').fill('Owner-reviewed Research summary.');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Research Working Copy saved.')).toBeVisible();
  await page.getByRole('button', { name: 'Create immutable Version' }).click();
  await expect(page.getByText('Immutable Research Version checkpointed.')).toBeVisible();
  await page.getByRole('button', { name: 'Approve exact Version' }).click();
  await expect(page.getByText('Exact Research Version approved.')).toBeVisible();
  await expect(page.locator('.section-heading .lifecycle')).toHaveText('Approved');

  await page.reload();
  await page.getByRole('button', { name: /^Research:/ }).click();
  await expect(page.getByLabel('Summary')).toHaveValue('Owner-reviewed Research summary.');
  await expect(page.getByLabel('Research text for item-1')).toHaveValue('Owner-corrected evidence-backed conclusion.');
  await expect(page.locator('.section-heading .lifecycle')).toHaveText('Approved');

  await page.getByRole('button', { name: /^Sources: Approved/ }).click();
  await page.getByRole('button', { name: /Review Source Approved primary evidence/ }).click();
  await page.getByLabel(/Normalized Working Copy/).fill('Fresh approved evidence after the Research approval.');
  await page.getByRole('button', { name: 'Save Working Copy' }).click();
  await page.getByRole('button', { name: 'Create Version' }).click();
  await page.getByRole('button', { name: 'Approve Version 2' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm approval' }).click();
  await expect(page.getByText('Version 2 is now the current approved Version.')).toBeVisible();

  await page.getByRole('button', { name: /^Research:/ }).click();
  await expect(page.getByText('The current Research Candidate is Outdated')).toBeVisible();
  await page.getByRole('button', { name: 'Generate fresh Research Candidate', exact: true }).click();
  await expect(page.getByText('Fresh Research Candidate generated')).toBeVisible();
  await expect(page.getByText('Approved Research is Outdated')).toBeVisible();
  await page.getByLabel('Review state for item-1').selectOption('accepted');
  await page.getByLabel('Summary').fill('Research reviewed against the refreshed Source.');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByRole('button', { name: 'Create immutable Version' }).click();
  await page.getByRole('button', { name: 'Approve exact Version' }).click();
  await expect(page.getByText('Exact Research Version approved.')).toBeVisible();
  await expect(page.getByText('Approved Research is Outdated')).toHaveCount(0);
});
