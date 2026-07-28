import { defineConfig } from 'vitest/config';

// Dedicated configuration for the Docker-dependent integration smoke harness.
// It is intentionally separate from vitest.config.ts so that `corepack pnpm test`
// and `corepack pnpm check` remain Docker-, network-, and credential-independent.
// `corepack pnpm test:integration` is the only entry point that uses this file.
export default defineConfig({
  test: {
    include: ['packages/testing/src/integration/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    // One isolated Compose project and one API process back the whole run.
    globalSetup: ['packages/testing/src/integration/global-setup.ts'],
    fileParallelism: false,
    pool: 'forks',
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
