import { describe, expect, it } from 'vitest';

import { ConfigurationError, loadApiConfig, loadApiSecrets } from './api-config.js';

const validHash = `scrypt$v=1$N=16384$r=8$p=1$${'a'.repeat(22)}$${'b'.repeat(43)}`;
const gatewaySecret = 'A'.repeat(43);

function validConfigEnv(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    CONTENTOS_ENV: 'test',
    CONTENTOS_OWNER_USER_ID: '00000000-0000-4000-8000-000000000001',
    CONTENTOS_WEB_ORIGIN: 'http://127.0.0.1:3000',
    CONTENTOS_OBJECT_STORAGE_ENDPOINT: 'http://127.0.0.1:8333',
    CONTENTOS_OBJECT_STORAGE_REGION: 'us-east-1',
    CONTENTOS_OBJECT_STORAGE_BUCKET: 'contentos-test',
    ...overrides,
  };
}

describe('API configuration', () => {
  it('loads the bounded local configuration and separates secrets', () => {
    const env = {
      CONTENTOS_ENV: 'test',
      CONTENTOS_OWNER_USER_ID: '00000000-0000-4000-8000-000000000001',
      CONTENTOS_OWNER_PASSWORD_HASH: validHash,
      DATABASE_URL: 'postgresql://user:password@127.0.0.1:5432/contentos',
      CONTENTOS_WEB_ORIGIN: 'http://127.0.0.1:3000',
      CONTENTOS_OBJECT_STORAGE_ENDPOINT: 'http://127.0.0.1:8333',
      CONTENTOS_OBJECT_STORAGE_BUCKET: 'contentos-test',
      OBJECT_STORAGE_ACCESS_KEY: 'test-access-key',
      OBJECT_STORAGE_SECRET_KEY: 'test-secret-key',
      CONTENTOS_FETCHER_GATEWAY_SECRET: gatewaySecret,
    };

    expect(loadApiConfig(env)).toMatchObject({
      environment: 'test',
      host: '127.0.0.1',
      port: 3001,
      secureCookies: false,
      objectStorage: {
        endpoint: 'http://127.0.0.1:8333',
        bucket: 'contentos-test',
        forcePathStyle: true,
      },
    });
    expect(loadApiSecrets(env)).toEqual({
      databaseUrl: env.DATABASE_URL,
      ownerPasswordHash: validHash,
      objectStorageAccessKey: 'test-access-key',
      objectStorageSecretKey: 'test-secret-key',
      fetcherGatewaySecret: gatewaySecret,
    });
  });

  it('fails closed without echoing invalid secret values', () => {
    const secret = 'must-not-appear';
    expect(() =>
      loadApiSecrets({
        DATABASE_URL: secret,
        CONTENTOS_OWNER_PASSWORD_HASH: secret,
        OBJECT_STORAGE_ACCESS_KEY: secret,
        OBJECT_STORAGE_SECRET_KEY: secret,
      }),
    ).toThrowError(ConfigurationError);
    try {
      loadApiSecrets({
        DATABASE_URL: secret,
        CONTENTOS_OWNER_PASSWORD_HASH: secret,
        OBJECT_STORAGE_ACCESS_KEY: secret,
        OBJECT_STORAGE_SECRET_KEY: secret,
      });
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

  it('rejects endpoint user information without retaining or echoing it', () => {
    const credentialMaterial = 'endpoint-user:must-not-appear';
    const endpoint = `http://${credentialMaterial}@127.0.0.1:8333`;

    try {
      loadApiConfig(validConfigEnv({ CONTENTOS_OBJECT_STORAGE_ENDPOINT: endpoint }));
      expect.unreachable('userinfo-bearing endpoint should be rejected');
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigurationError);
      expect(error).toMatchObject({ key: 'CONTENTOS_OBJECT_STORAGE_ENDPOINT' });
      expect(String(error)).not.toContain(credentialMaterial);
      expect(String(error)).not.toContain('must-not-appear');
      expect(JSON.stringify(error)).not.toContain(credentialMaterial);
    }
  });

  it('accepts only canonical printable region tokens without echoing rejected values', () => {
    for (const region of ['cn-north-1', 'R2_region.1', 'a'.repeat(64)]) {
      expect(loadApiConfig(validConfigEnv({ CONTENTOS_OBJECT_STORAGE_REGION: region })).objectStorage.region).toBe(
        region,
      );
    }

    for (const region of ['', '   ', '-starts-with-hyphen', 'has/slash', 'has\u0000control', 'a'.repeat(65)]) {
      try {
        loadApiConfig(validConfigEnv({ CONTENTOS_OBJECT_STORAGE_REGION: region }));
        expect.unreachable('non-canonical region should be rejected');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigurationError);
        expect(error).toMatchObject({ key: 'CONTENTOS_OBJECT_STORAGE_REGION' });
        if (region !== '') expect(String(error)).not.toContain(region);
      }
    }
  });
});
