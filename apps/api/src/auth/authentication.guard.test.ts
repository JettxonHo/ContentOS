import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import type { ApiConfig } from '@contentos/config';
import { AuthenticationError, type AuthenticationService } from '@contentos/core';

import { AuthenticationGuard } from './authentication.guard';

const config = { sessionCookieName: 'contentos_session' } as ApiConfig;

function context(cookie?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ cookies: cookie ? { contentos_session: cookie } : {} }),
    }),
  } as unknown as ExecutionContext;
}

describe('AuthenticationGuard', () => {
  it('maps only authentication failures to the safe 401 boundary', async () => {
    const authentication = {
      authenticate: async (): Promise<never> => {
        throw new AuthenticationError('UNAUTHENTICATED');
      },
    } as unknown as AuthenticationService;
    const guard = new AuthenticationGuard(config, authentication);

    await expect(guard.canActivate(context('invalid'))).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHENTICATED',
    });
  });

  it('preserves infrastructure failures for the common 500 filter', async () => {
    const authentication = {
      authenticate: async (): Promise<never> => {
        throw new Error('database unavailable');
      },
    } as unknown as AuthenticationService;
    const guard = new AuthenticationGuard(config, authentication);

    await expect(guard.canActivate(context('opaque-session'))).rejects.toThrow('database unavailable');
  });
});
