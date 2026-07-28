import { fileURLToPath } from 'node:url';

import { migrate } from 'drizzle-orm/node-postgres/migrator';

import { createDatabaseConnection } from './client.js';

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to apply migrations');
  }
  const migrationsFolder = fileURLToPath(new URL('../../../migrations/', import.meta.url));
  const connection = createDatabaseConnection(databaseUrl);
  try {
    await migrate(connection.db, { migrationsFolder });
  } finally {
    await connection.close();
  }
}

void main().catch(() => {
  process.stderr.write('Database migration failed.\n');
  process.exitCode = 1;
});
