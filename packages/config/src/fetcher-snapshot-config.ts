import { ConfigurationError } from './api-config.js';

export interface FetcherSnapshotConfig {
  readonly endpoint: string;
  readonly region: string;
  readonly bucket: string;
  readonly forcePathStyle: boolean;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
}

function required(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key];
  if (!value) throw new ConfigurationError(key, 'value is required');
  return value;
}

function endpoint(env: NodeJS.ProcessEnv): string {
  const value = required(env, 'CONTENTOS_FETCHER_OBJECT_STORAGE_ENDPOINT');
  try {
    const parsed = new URL(value);
    if (
      (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') ||
      parsed.username !== '' ||
      parsed.password !== ''
    ) {
      throw new Error('invalid');
    }
  } catch {
    throw new ConfigurationError('CONTENTOS_FETCHER_OBJECT_STORAGE_ENDPOINT', 'must be an absolute HTTP(S) URL');
  }
  return value;
}

function region(env: NodeJS.ProcessEnv): string {
  const value = env.CONTENTOS_FETCHER_OBJECT_STORAGE_REGION ?? 'us-east-1';
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(value)) {
    throw new ConfigurationError('CONTENTOS_FETCHER_OBJECT_STORAGE_REGION', 'must be a valid region token');
  }
  return value;
}

function bucket(env: NodeJS.ProcessEnv): string {
  const value = required(env, 'CONTENTOS_FETCHER_OBJECT_STORAGE_BUCKET');
  if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(value)) {
    throw new ConfigurationError('CONTENTOS_FETCHER_OBJECT_STORAGE_BUCKET', 'must be a valid bucket name');
  }
  return value;
}

function forcePathStyle(env: NodeJS.ProcessEnv): boolean {
  const value = env.CONTENTOS_FETCHER_OBJECT_STORAGE_FORCE_PATH_STYLE ?? 'true';
  if (value !== 'true' && value !== 'false') {
    throw new ConfigurationError('CONTENTOS_FETCHER_OBJECT_STORAGE_FORCE_PATH_STYLE', 'must be true or false');
  }
  return value === 'true';
}

/** Loads only the Fetcher-scoped S3 identity. API object-storage names never apply here. */
export function loadFetcherSnapshotConfig(env: NodeJS.ProcessEnv): FetcherSnapshotConfig {
  return {
    endpoint: endpoint(env),
    region: region(env),
    bucket: bucket(env),
    forcePathStyle: forcePathStyle(env),
    accessKeyId: required(env, 'CONTENTOS_FETCHER_OBJECT_STORAGE_ACCESS_KEY'),
    secretAccessKey: required(env, 'CONTENTOS_FETCHER_OBJECT_STORAGE_SECRET_KEY'),
  };
}
