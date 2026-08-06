import { describe, expect, it } from 'vitest';

import { ConfigurationError, loadFetcherSnapshotConfig } from './index.js';

const env = {
  CONTENTOS_FETCHER_OBJECT_STORAGE_ENDPOINT: 'http://127.0.0.1:8333',
  CONTENTOS_FETCHER_OBJECT_STORAGE_BUCKET: 'contentos-fetcher-test',
  CONTENTOS_FETCHER_OBJECT_STORAGE_ACCESS_KEY: 'fetcher-access',
  CONTENTOS_FETCHER_OBJECT_STORAGE_SECRET_KEY: 'fetcher-secret',
};

describe('Fetcher snapshot configuration', () => {
  it('loads only the Fetcher-scoped S3 configuration with reviewed defaults', () => {
    expect(loadFetcherSnapshotConfig(env)).toEqual({
      endpoint: 'http://127.0.0.1:8333',
      region: 'us-east-1',
      bucket: 'contentos-fetcher-test',
      forcePathStyle: true,
      accessKeyId: 'fetcher-access',
      secretAccessKey: 'fetcher-secret',
    });
  });

  it('does not fall back to the API object-storage environment names', () => {
    expect(() =>
      loadFetcherSnapshotConfig({
        CONTENTOS_OBJECT_STORAGE_ENDPOINT: 'http://127.0.0.1:8333',
        CONTENTOS_OBJECT_STORAGE_BUCKET: 'contentos-api-test',
        OBJECT_STORAGE_ACCESS_KEY: 'api-access',
        OBJECT_STORAGE_SECRET_KEY: 'api-secret',
      }),
    ).toThrow(new ConfigurationError('CONTENTOS_FETCHER_OBJECT_STORAGE_ENDPOINT', 'value is required'));
  });

  it('redacts invalid endpoint and credential values from errors', () => {
    const marker = 'fetcher-private-value';
    const invalid = () =>
      loadFetcherSnapshotConfig({
        ...env,
        CONTENTOS_FETCHER_OBJECT_STORAGE_ENDPOINT: marker,
        CONTENTOS_FETCHER_OBJECT_STORAGE_SECRET_KEY: marker,
      });

    expect(invalid).toThrowError(ConfigurationError);
    try {
      invalid();
    } catch (error) {
      expect(String(error)).not.toContain(marker);
    }
  });
});
