import { describe, expect, it } from 'vitest';

import { ConfigurationError, loadApiConfig, loadApiSecrets } from './api-config.js';

const validHash = `scrypt$v=1$N=16384$r=8$p=1$${'a'.repeat(22)}$${'b'.repeat(43)}`;

describe('API configuration', () => {
  it('loads the bounded local configuration and separates secrets', () => {
    const env = {
      CONTENTOS_ENV: 'test',
      CONTENTOS_OWNER_USER_ID: '00000000-0000-4000-8000-000000000001',
      CONTENTOS_OWNER_PASSWORD_HASH: validHash,
      DATABASE_URL: 'postgresql://user:password@127.0.0.1:5432/contentos',
      CONTENTOS_WEB_ORIGIN: 'http://127.0.0.1:3000',
    };

    expect(loadApiConfig(env)).toMatchObject({
      environment: 'test',
      host: '127.0.0.1',
      port: 3001,
      secureCookies: false,
    });
    expect(loadApiSecrets(env)).toEqual({
      databaseUrl: env.DATABASE_URL,
      ownerPasswordHash: validHash,
    });
  });

  it('fails closed without echoing invalid secret values', () => {
    const secret = 'must-not-appear';
    expect(() => loadApiSecrets({ DATABASE_URL: secret, CONTENTOS_OWNER_PASSWORD_HASH: secret })).toThrowError(
      ConfigurationError,
    );
    try {
      loadApiSecrets({ DATABASE_URL: secret, CONTENTOS_OWNER_PASSWORD_HASH: secret });
    } catch (error) {
      expect(String(error)).not.toContain(secret);
    }
  });

  it('requires secure cookies and HTTPS origin in production', () => {
    expect(() =>
      loadApiConfig({
        CONTENTOS_ENV: 'production',
        CONTENTOS_OWNER_USER_ID: '00000000-0000-4000-8000-000000000001',
        CONTENTOS_WEB_ORIGIN: 'http://127.0.0.1:3000',
      }),
    ).toThrow(/HTTPS/);
  });
});
