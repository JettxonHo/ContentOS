const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SCRYPT_HASH_PATTERN = /^scrypt\$v=1\$N=16384\$r=8\$p=1\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{43}$/;

export type RuntimeEnvironment = 'development' | 'test' | 'production';

export interface ApiConfig {
  readonly environment: RuntimeEnvironment;
  readonly host: '127.0.0.1';
  readonly port: number;
  readonly trustedWebOrigin: string;
  readonly ownerUserId: string;
  readonly sessionTtlSeconds: number;
  readonly sessionCookieName: 'contentos_session';
  readonly secureCookies: boolean;
}

export interface ApiSecrets {
  readonly databaseUrl: string;
  readonly ownerPasswordHash: string;
}

export class ConfigurationError extends Error {
  constructor(
    readonly key: string,
    reason: string,
  ) {
    super(`Invalid configuration for ${key}: ${reason}`);
    this.name = 'ConfigurationError';
  }
}

function required(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key];
  if (!value) {
    throw new ConfigurationError(key, 'value is required');
  }
  return value;
}

function integer(env: NodeJS.ProcessEnv, key: string, defaultValue: number, min: number, max: number): number {
  const raw = env[key] ?? String(defaultValue);
  if (!/^\d+$/.test(raw)) {
    throw new ConfigurationError(key, 'must be an integer');
  }
  const value = Number.parseInt(raw, 10);
  if (value < min || value > max) {
    throw new ConfigurationError(key, `must be between ${min} and ${max}`);
  }
  return value;
}

function runtimeEnvironment(env: NodeJS.ProcessEnv): RuntimeEnvironment {
  const value = env.CONTENTOS_ENV ?? 'development';
  if (value !== 'development' && value !== 'test' && value !== 'production') {
    throw new ConfigurationError('CONTENTOS_ENV', 'must be development, test, or production');
  }
  return value;
}

function trustedOrigin(env: NodeJS.ProcessEnv, environment: RuntimeEnvironment): string {
  const raw = env.CONTENTOS_WEB_ORIGIN ?? 'http://127.0.0.1:3000';
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ConfigurationError('CONTENTOS_WEB_ORIGIN', 'must be an absolute HTTP(S) origin');
  }
  if (url.origin !== raw || (url.protocol !== 'http:' && url.protocol !== 'https:')) {
    throw new ConfigurationError('CONTENTOS_WEB_ORIGIN', 'must contain only an exact HTTP(S) origin');
  }
  if (environment === 'production' && url.protocol !== 'https:') {
    throw new ConfigurationError('CONTENTOS_WEB_ORIGIN', 'must use HTTPS in production');
  }
  return url.origin;
}

function secureCookies(env: NodeJS.ProcessEnv, environment: RuntimeEnvironment): boolean {
  const raw = env.CONTENTOS_SECURE_COOKIES ?? (environment === 'production' ? 'true' : 'false');
  if (raw !== 'true' && raw !== 'false') {
    throw new ConfigurationError('CONTENTOS_SECURE_COOKIES', 'must be true or false');
  }
  if (environment === 'production' && raw !== 'true') {
    throw new ConfigurationError('CONTENTOS_SECURE_COOKIES', 'must be true in production');
  }
  return raw === 'true';
}

export function loadApiConfig(env: NodeJS.ProcessEnv): ApiConfig {
  const environment = runtimeEnvironment(env);
  const ownerUserId = required(env, 'CONTENTOS_OWNER_USER_ID');
  if (!UUID_PATTERN.test(ownerUserId)) {
    throw new ConfigurationError('CONTENTOS_OWNER_USER_ID', 'must be an opaque UUID');
  }
  const host = env.API_HOST ?? '127.0.0.1';
  if (host !== '127.0.0.1') {
    throw new ConfigurationError('API_HOST', 'must be 127.0.0.1 in the current private baseline');
  }

  return {
    environment,
    host,
    port: integer(env, 'API_PORT', 3001, 1, 65_535),
    trustedWebOrigin: trustedOrigin(env, environment),
    ownerUserId,
    sessionTtlSeconds: integer(env, 'CONTENTOS_SESSION_TTL_SECONDS', 86_400, 300, 2_592_000),
    sessionCookieName: 'contentos_session',
    secureCookies: secureCookies(env, environment),
  };
}

export function loadApiSecrets(env: NodeJS.ProcessEnv): ApiSecrets {
  const databaseUrl = required(env, 'DATABASE_URL');
  try {
    const parsed = new URL(databaseUrl);
    if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
      throw new Error('protocol');
    }
  } catch {
    throw new ConfigurationError('DATABASE_URL', 'must be a PostgreSQL connection URL');
  }

  const ownerPasswordHash = required(env, 'CONTENTOS_OWNER_PASSWORD_HASH');
  if (!SCRYPT_HASH_PATTERN.test(ownerPasswordHash)) {
    throw new ConfigurationError('CONTENTOS_OWNER_PASSWORD_HASH', 'must be a supported scrypt hash');
  }
  return { databaseUrl, ownerPasswordHash };
}
