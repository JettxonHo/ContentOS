import { fileURLToPath } from 'node:url';

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  out: '../../migrations',
  schema: fileURLToPath(new URL('./packages/database/src/schema.ts', import.meta.url)),
});
