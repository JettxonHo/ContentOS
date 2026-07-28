import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema.js';

export interface DatabaseConnection {
  readonly db: NodePgDatabase<typeof schema>;
  readonly pool: Pool;
  close(): Promise<void>;
}

export function createDatabaseConnection(databaseUrl: string): DatabaseConnection {
  const pool = new Pool({ connectionString: databaseUrl, max: 10 });
  return {
    db: drizzle(pool, { schema }),
    pool,
    async close(): Promise<void> {
      await pool.end();
    },
  };
}
