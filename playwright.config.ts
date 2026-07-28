import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { defineConfig } from '@playwright/test';

const smokeDir = join(tmpdir(), 'contentos-smoke-harness');

export default defineConfig({
  testDir: './packages/testing/src/browser',
  globalSetup: './packages/testing/src/browser/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'line',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  outputDir: join(smokeDir, 'playwright-output'),
  use: {
    browserName: 'chromium',
    headless: true,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
});
