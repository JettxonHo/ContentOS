import { describe, expect, it } from 'vitest';

import { composeExec, composeHealth, composePort } from './compose.js';
import { requireState } from './env.js';
import { loopbackReachable } from './process.js';

describe('redis smoke', () => {
  it('is healthy, loopback-reachable, returns PONG for the correct credential, rejects a wrong one, and holds no keys', async () => {
    const state = requireState();

    expect(await composeHealth(state, 'redis')).toBe('healthy');

    const portInfo = await composePort(state, 'redis', 6379);
    expect(portInfo.stdout.trim()).toMatch(/^127\.0\.0\.1:\d+$/);

    await expect(loopbackReachable(state.ports.redis)).resolves.toBe(true);

    const correct = await composeExec(state, 'redis', [
      'sh',
      '-c',
      `redis-cli --no-auth-warning -a "$REDIS_PASSWORD" ping`,
    ]);
    expect(correct.stdout).toContain('PONG');

    const wrong = await composeExec(state, 'redis', [
      'sh',
      '-c',
      `redis-cli --no-auth-warning -a invalid-smoke-password ping`,
    ]);
    expect(wrong.stdout).not.toContain('PONG');

    const size = await composeExec(state, 'redis', [
      'sh',
      '-c',
      `redis-cli --no-auth-warning -a "$REDIS_PASSWORD" dbsize`,
    ]);
    // Robust to both "0" and "(integer) 0" output forms across redis-cli versions.
    expect(Number.parseInt(size.stdout, 10)).toBe(0);
  });
});
