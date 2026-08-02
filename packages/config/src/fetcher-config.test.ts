import { describe, expect, it } from 'vitest';

import {
  ConfigurationError,
  loadFetcherConfig,
  validateFetcherGatewayApiOrigin,
  validateFetcherGatewaySecret,
} from './index.js';

const secret = 'A'.repeat(43);

describe('Fetcher configuration', () => {
  it('accepts the exact loopback origin and shared Secret contract', () => {
    expect(
      loadFetcherConfig({
        CONTENTOS_ENV: 'test',
        CONTENTOS_FETCHER_GATEWAY_SECRET: secret,
        CONTENTOS_FETCHER_GATEWAY_API_ORIGIN: 'http://127.0.0.1:3001',
      }),
    ).toEqual({
      environment: 'test',
      gatewaySecret: secret,
      apiOrigin: 'http://127.0.0.1:3001',
    });
  });

  it('rejects malformed Secret and origin values without reflecting Secret material', () => {
    const marker = 'secret-marker-that-must-not-appear';
    const cases = [
      () => validateFetcherGatewaySecret('short'),
      () => validateFetcherGatewaySecret(`${marker}!`),
      () => validateFetcherGatewayApiOrigin('http://localhost:3001'),
      () => validateFetcherGatewayApiOrigin('http://127.0.0.1:3001/private'),
      () => validateFetcherGatewayApiOrigin('http://user:password@127.0.0.1:3001'),
      () => loadFetcherConfig({ CONTENTOS_ENV: 'test', CONTENTOS_FETCHER_GATEWAY_API_ORIGIN: marker }),
    ];

    for (const invalid of cases) {
      expect(invalid).toThrowError(ConfigurationError);
      try {
        invalid();
      } catch (error) {
        expect(String(error)).not.toContain(marker);
      }
    }
  });
});
