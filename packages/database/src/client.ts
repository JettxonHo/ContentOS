import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema.js';

export const DATABASE_UNAVAILABLE_ERROR_CODE = 'database_unavailable' as const;

export interface DatabaseConnection {
  readonly db: NodePgDatabase<typeof schema>;
  readonly pool: Pool;
  assertAvailable(): void;
  close(): Promise<void>;
}

export function createDatabaseConnection(databaseUrl: string): DatabaseConnection {
  const pool = new Pool({ connectionString: databaseUrl, max: 10 });
  let unavailable = false;
  pool.on('error', () => {
    unavailable = true;
  });
  return {
    db: drizzle(pool, { schema }),
    pool,
    assertAvailable(): void {
      if (unavailable) throw new Error(DATABASE_UNAVAILABLE_ERROR_CODE);
    },
    async close(): Promise<void> {
      await pool.end();
    },
  };
}
