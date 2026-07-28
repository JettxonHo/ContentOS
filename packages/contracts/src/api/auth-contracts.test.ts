import { describe, expect, it } from 'vitest';
import { Ajv2020 } from 'ajv/dist/2020.js';

import { apiError, apiErrorSchema } from './error-contract.js';
import { authSessionResponseSchema, parseAuthLoginRequest } from './auth-contracts.js';

describe('authentication API contracts', () => {
  it('accepts only the bounded login body and never includes invalid values in details', () => {
    expect(parseAuthLoginRequest({ password: 'valid' })).toEqual({
      ok: true,
      value: { password: 'valid' },
    });
    const invalid = parseAuthLoginRequest({ password: 'secret-value', extra: true });
    expect(invalid.ok).toBe(false);
    expect(JSON.stringify(invalid)).not.toContain('secret-value');
  });

  it('creates the one versioned error envelope', () => {
    const response = apiError('UNAUTHENTICATED', 'Authentication required', 'request-1');
    expect(response).toEqual({
      error: {
        version: '1',
        code: 'UNAUTHENTICATED',
        message: 'Authentication required',
        correlationId: 'request-1',
      },
    });
    expect(new Ajv2020({ strict: true }).compile(apiErrorSchema)(response)).toBe(true);
  });

  it('validates the shared successful Session response contract', () => {
    const validate = new Ajv2020({ strict: true }).compile(authSessionResponseSchema);
    expect(
      validate({
        data: {
          principal: { kind: 'user', userId: '00000000-0000-4000-8000-000000000001' },
          expiresAt: '2026-07-28T00:00:00.000Z',
        },
      }),
    ).toBe(true);
    expect(validate({ data: { principal: { kind: 'admin', userId: 'owner' }, expiresAt: 'now' } })).toBe(false);
  });
});
