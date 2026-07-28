import { describe, expect, it } from 'vitest';

import {
  AuthenticationError,
  AuthenticationService,
  type Clock,
  type PasswordVerifier,
  type SessionCredentialManager,
  type SessionId,
  type SessionIdGenerator,
  type SessionRecord,
  type SessionRepository,
  type UserId,
} from './authentication.js';

class MemorySessions implements SessionRepository {
  readonly records: SessionRecord[] = [];

  async insert(session: SessionRecord): Promise<void> {
    this.records.push(session);
  }

  async findByCredentialHash(credentialHash: string): Promise<SessionRecord | null> {
    return this.records.find((record) => record.credentialHash === credentialHash) ?? null;
  }

  async revokeByCredentialHash(credentialHash: string, revokedAt: Date): Promise<boolean> {
    const index = this.records.findIndex((record) => record.credentialHash === credentialHash);
    const record = this.records[index];
    if (!record || record.revokedAt !== null) {
      return false;
    }
    this.records[index] = { ...record, revokedAt };
    return true;
  }
}

function createFixture(passwordValid = true): {
  service: AuthenticationService;
  sessions: MemorySessions;
  clock: { nowValue: Date } & Clock;
} {
  const sessions = new MemorySessions();
  const clock = {
    nowValue: new Date('2026-07-28T00:00:00.000Z'),
    now(): Date {
      return this.nowValue;
    },
  };
  const passwordVerifier: PasswordVerifier = {
    async verify(): Promise<boolean> {
      return passwordValid;
    },
  };
  const credentials: SessionCredentialManager = {
    issue: () => ({ rawCredential: 'raw-session', credentialHash: 'hashed-session' }),
    hash: () => 'hashed-session',
  };
  const sessionIds: SessionIdGenerator = { generate: () => 'session-id' as SessionId };
  return {
    sessions,
    clock,
    service: new AuthenticationService(sessions, passwordVerifier, credentials, clock, sessionIds, {
      ownerUserId: '00000000-0000-4000-8000-000000000001' as UserId,
      sessionTtlMs: 60_000,
    }),
  };
}

describe('AuthenticationService', () => {
  it('creates, authenticates, and revokes one expiring server-side session', async () => {
    const fixture = createFixture();
    const loggedIn = await fixture.service.login('correct-password');

    expect(loggedIn.rawCredential).toBe('raw-session');
    await expect(fixture.service.authenticate(loggedIn.rawCredential)).resolves.toEqual({
      principal: {
        kind: 'user',
        userId: '00000000-0000-4000-8000-000000000001',
      },
      expiresAt: new Date('2026-07-28T00:01:00.000Z'),
    });

    await fixture.service.logout(loggedIn.rawCredential);
    await expect(fixture.service.authenticate(loggedIn.rawCredential)).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
  });

  it('denies incorrect passwords, missing credentials, and expired sessions', async () => {
    const invalid = createFixture(false);
    await expect(invalid.service.login('incorrect-password')).rejects.toBeInstanceOf(AuthenticationError);

    const fixture = createFixture();
    const loggedIn = await fixture.service.login('correct-password');
    await expect(fixture.service.authenticate(undefined)).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });

    fixture.clock.nowValue = new Date(loggedIn.expiresAt.getTime());
    await expect(fixture.service.authenticate(loggedIn.rawCredential)).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
  });
});
