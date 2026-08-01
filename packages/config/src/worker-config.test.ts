import { describe, expect, it } from 'vitest';

import { ConfigurationError, loadWorkerConfig } from './index.js';

const databaseUrl = 'postgresql://worker:password@127.0.0.1:5432/contentos';
const redisUrl = 'redis://:redis-password@127.0.0.1:6379';

describe('Worker configuration', () => {
  it('accepts the bounded environment vocabulary and private connection URLs', () => {
    expect(loadWorkerConfig({ CONTENTOS_ENV: 'test', DATABASE_URL: databaseUrl, REDIS_URL: redisUrl })).toEqual({
      environment: 'test',
      databaseUrl,
      redisUrl,
    });
  });

  it('rejects missing, malformed, and unsupported configuration without reflecting values', () => {
    const secret = 'worker-secret-value';
    const cases: Array<[NodeJS.ProcessEnv, string]> = [
      [{ CONTENTOS_ENV: 'test', REDIS_URL: redisUrl }, 'DATABASE_URL'],
      [{ CONTENTOS_ENV: 'test', DATABASE_URL: databaseUrl }, 'REDIS_URL'],
      [{ CONTENTOS_ENV: 'test', DATABASE_URL: 'https://user:password@db', REDIS_URL: redisUrl }, 'DATABASE_URL'],
      [{ CONTENTOS_ENV: 'test', DATABASE_URL: databaseUrl, REDIS_URL: 'http://user:password@redis' }, 'REDIS_URL'],
      [{ CONTENTOS_ENV: 'staging', DATABASE_URL: databaseUrl, REDIS_URL: redisUrl }, 'CONTENTOS_ENV'],
      [{ CONTENTOS_ENV: 'test', DATABASE_URL: `${secret}-bad`, REDIS_URL: redisUrl }, 'DATABASE_URL'],
    ];

    for (const [env, key] of cases) {
      expect(() => loadWorkerConfig(env)).toThrowError(ConfigurationError);
      try {
        loadWorkerConfig(env);
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigurationError);
        expect((error as Error).message).toContain(key);
        expect((error as Error).message).not.toContain(secret);
      }
    }
  });
});
