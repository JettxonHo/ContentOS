import { describe, expect, it } from 'vitest';

import { LoginAttemptLimiter } from './login-attempt-limiter.js';

describe('LoginAttemptLimiter', () => {
  it('blocks after ten failures and resets after the bounded window', () => {
    const limiter = new LoginAttemptLimiter();
    const now = Date.parse('2026-07-28T00:00:00.000Z');
    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect(limiter.check('127.0.0.1', now).allowed).toBe(true);
      limiter.recordFailure('127.0.0.1', now);
    }
    expect(limiter.check('127.0.0.1', now)).toEqual({ allowed: false, retryAfterSeconds: 900 });
    expect(limiter.check('127.0.0.1', now + 900_000).allowed).toBe(true);
  });
});
