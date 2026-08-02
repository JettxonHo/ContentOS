import { ConfigurationError, type RuntimeEnvironment } from './api-config.js';

export const FETCHER_GATEWAY_SECRET_PATTERN = /^[A-Za-z0-9_-]+$/;
export const FETCHER_GATEWAY_SECRET_MIN_LENGTH = 43;
export const FETCHER_GATEWAY_SECRET_MAX_LENGTH = 128;

export interface FetcherConfig {
  readonly environment: RuntimeEnvironment;
  readonly gatewaySecret: string;
  readonly apiOrigin: string;
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

export function validateFetcherGatewaySecret(value: string): void {
  if (
    value.length < FETCHER_GATEWAY_SECRET_MIN_LENGTH ||
    value.length > FETCHER_GATEWAY_SECRET_MAX_LENGTH ||
    !FETCHER_GATEWAY_SECRET_PATTERN.test(value)
  ) {
    throw new ConfigurationError(
      'CONTENTOS_FETCHER_GATEWAY_SECRET',
      `must be a ${FETCHER_GATEWAY_SECRET_MIN_LENGTH}-${FETCHER_GATEWAY_SECRET_MAX_LENGTH} character URL-safe base64url token`,
    );
  }
}

export function validateFetcherGatewayApiOrigin(value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new ConfigurationError('CONTENTOS_FETCHER_GATEWAY_API_ORIGIN', 'must be an exact HTTP(S) origin');
  }
  if (
    parsed.origin !== value ||
    (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') ||
    parsed.hostname !== '127.0.0.1' ||
    parsed.username !== '' ||
    parsed.password !== '' ||
    parsed.pathname !== '/' ||
    parsed.search !== '' ||
    parsed.hash !== ''
  ) {
    throw new ConfigurationError(
      'CONTENTOS_FETCHER_GATEWAY_API_ORIGIN',
      'must be an exact HTTP(S) origin on literal 127.0.0.1',
    );
  }
  return parsed.origin;
}

export function loadFetcherConfig(env: NodeJS.ProcessEnv): FetcherConfig {
  const gatewaySecret = required(env, 'CONTENTOS_FETCHER_GATEWAY_SECRET');
  validateFetcherGatewaySecret(gatewaySecret);
  const apiOrigin = validateFetcherGatewayApiOrigin(required(env, 'CONTENTOS_FETCHER_GATEWAY_API_ORIGIN'));
  return { environment: runtimeEnvironment(env), gatewaySecret, apiOrigin };
}
