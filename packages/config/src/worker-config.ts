import { ConfigurationError, type RuntimeEnvironment } from './api-config.js';

export interface WorkerConfig {
  readonly environment: RuntimeEnvironment;
  readonly databaseUrl: string;
  readonly redisUrl: string;
}

function required(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key];
  if (!value) throw new ConfigurationError(key, 'value is required');
  return value;
}

function runtimeEnvironment(env: NodeJS.ProcessEnv): RuntimeEnvironment {
  const value = env.CONTENTOS_ENV ?? 'development';
  if (value !== 'development' && value !== 'test' && value !== 'production') {
    throw new ConfigurationError('CONTENTOS_ENV', 'must be development, test, or production');
  }
  return value;
}

function connectionUrl(env: NodeJS.ProcessEnv, key: 'DATABASE_URL' | 'REDIS_URL'): string {
  const value = required(env, key);
  try {
    const parsed = new URL(value);
    const validProtocol =
      key === 'DATABASE_URL'
        ? parsed.protocol === 'postgres:' || parsed.protocol === 'postgresql:'
        : parsed.protocol === 'redis:' || parsed.protocol === 'rediss:';
    if (!validProtocol || parsed.hostname === '') throw new Error('invalid connection URL');
  } catch {
    const description = key === 'DATABASE_URL' ? 'a PostgreSQL connection URL' : 'a redis or rediss connection URL';
    throw new ConfigurationError(key, `must be ${description}`);
  }
  return value;
}

export function loadWorkerConfig(env: NodeJS.ProcessEnv): WorkerConfig {
  return {
    environment: runtimeEnvironment(env),
    databaseUrl: connectionUrl(env, 'DATABASE_URL'),
    redisUrl: connectionUrl(env, 'REDIS_URL'),
  };
}
