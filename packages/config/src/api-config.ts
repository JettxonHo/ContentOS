const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SCRYPT_HASH_PATTERN = /^scrypt\$v=1\$N=16384\$r=8\$p=1\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{43}$/;

export type RuntimeEnvironment = 'development' | 'test' | 'production';

export interface ObjectStorageConfig {
  readonly endpoint: string;
  readonly region: string;
  readonly bucket: string;
  readonly forcePathStyle: boolean;
}

export interface ApiConfig {
  readonly environment: RuntimeEnvironment;
  readonly host: '127.0.0.1';
  readonly port: number;
  readonly trustedWebOrigin: string;
  readonly ownerUserId: string;
  readonly sessionTtlSeconds: number;
  readonly sessionCookieName: 'contentos_session';
  readonly secureCookies: boolean;
  readonly objectStorage: ObjectStorageConfig;
}

export interface ApiSecrets {
  readonly databaseUrl: string;
  readonly ownerPasswordHash: string;
  readonly objectStorageAccessKey: string;
  readonly objectStorageSecretKey: string;
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
    objectStorage: loadObjectStorageConfig(env),
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

  const objectStorageAccessKey = required(env, 'OBJECT_STORAGE_ACCESS_KEY');
  if (objectStorageAccessKey.length < 1) {
    throw new ConfigurationError('OBJECT_STORAGE_ACCESS_KEY', 'value is required');
  }

  const objectStorageSecretKey = required(env, 'OBJECT_STORAGE_SECRET_KEY');
  if (objectStorageSecretKey.length < 1) {
    throw new ConfigurationError('OBJECT_STORAGE_SECRET_KEY', 'value is required');
  }

  return { databaseUrl, ownerPasswordHash, objectStorageAccessKey, objectStorageSecretKey };
}

function loadObjectStorageConfig(env: NodeJS.ProcessEnv): ObjectStorageConfig {
  const endpoint = required(env, 'CONTENTOS_OBJECT_STORAGE_ENDPOINT');
  let endpointUrl: URL;
  try {
    endpointUrl = new URL(endpoint);
    if (endpointUrl.protocol !== 'http:' && endpointUrl.protocol !== 'https:') {
      throw new Error('protocol');
    }
  } catch {
    throw new ConfigurationError('CONTENTOS_OBJECT_STORAGE_ENDPOINT', 'must be an absolute HTTP(S) URL');
  }
  if (endpointUrl.username !== '' || endpointUrl.password !== '') {
    throw new ConfigurationError('CONTENTOS_OBJECT_STORAGE_ENDPOINT', 'must not contain user information');
  }

  const region = env.CONTENTOS_OBJECT_STORAGE_REGION ?? 'us-east-1';
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(region)) {
    throw new ConfigurationError(
      'CONTENTOS_OBJECT_STORAGE_REGION',
      'must be a 1-64 character region token using only letters, numbers, dot, underscore, or hyphen',
    );
  }

  const bucket = required(env, 'CONTENTOS_OBJECT_STORAGE_BUCKET');
  if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket)) {
    throw new ConfigurationError('CONTENTOS_OBJECT_STORAGE_BUCKET', 'must be a valid bucket name');
  }

  const forcePathStyleRaw = env.CONTENTOS_OBJECT_STORAGE_FORCE_PATH_STYLE ?? 'true';
  if (forcePathStyleRaw !== 'true' && forcePathStyleRaw !== 'false') {
    throw new ConfigurationError('CONTENTOS_OBJECT_STORAGE_FORCE_PATH_STYLE', 'must be true or false');
  }

  return {
    endpoint,
    region,
    bucket,
    forcePathStyle: forcePathStyleRaw === 'true',
  };
}
