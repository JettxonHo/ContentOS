import { describe, expect, it } from 'vitest';

import { composeExec, composeHealth, composePort } from './compose.js';
import { requireState } from './env.js';
import { loopbackReachable } from './process.js';

describe('postgres smoke', () => {
  it('is healthy, loopback-reachable, authenticates credentials, and contains only the reviewed authentication migration', async () => {
    const state = requireState();

    expect(await composeHealth(state, 'postgres')).toBe('healthy');

    const portInfo = await composePort(state, 'postgres', 5432);
    expect(portInfo.stdout.trim()).toMatch(/^127\.0\.0\.1:\d+$/);

    await expect(loopbackReachable(state.ports.postgres)).resolves.toBe(true);

    // Correct credential over TCP exercises scram-sha-256 host auth.
    const correct = await composeExec(state, 'postgres', [
      'sh',
      '-c',
      `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT 1"`,
    ]);
    expect(correct.ok).toBe(true);
    expect(correct.stdout.trim()).toBe('1');

    // A wrong credential must be rejected.
    const wrong = await composeExec(state, 'postgres', [
      'sh',
      '-c',
      `PGPASSWORD=invalid-smoke-password psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT 1"`,
    ]);
    expect(wrong.ok).toBe(false);
    expect(wrong.stderr).toContain('password authentication failed');

    // M1-SEC-001 introduces only the server-side Session table. Drizzle's own
    // migration journal lives in its dedicated schema and is not product state.
    const tables = await composeExec(state, 'postgres', [
      'sh',
      '-c',
      `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"`,
    ]);
    expect(tables.ok).toBe(true);
    expect(tables.stdout.trim()).toBe('auth_sessions');
  });
});
