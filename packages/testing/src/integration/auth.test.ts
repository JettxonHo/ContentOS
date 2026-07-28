import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { composeExec } from './compose.js';
import { readComposeCredentials, requireState } from './env.js';

function cookieFrom(response: Response): string {
  const setCookie = response.headers.getSetCookie()[0];
  if (!setCookie) {
    throw new Error('authentication response did not set a cookie');
  }
  return setCookie.split(';', 1)[0] ?? '';
}

describe('single-user authentication smoke', () => {
  it('creates, inspects, revokes, and denies replay of one protected server-side session', async () => {
    const state = requireState();
    const credentials = readComposeCredentials(state.envFile);
    const password = credentials.CONTENTOS_TEST_OWNER_PASSWORD;
    if (!password) {
      throw new Error('temporary authentication fixture is missing');
    }

    const invalid = await fetch(`${state.apiOrigin}/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: state.webOrigin },
      body: JSON.stringify({ password: 'incorrect-password' }),
    });
    expect(invalid.status).toBe(401);
    expect(await invalid.json()).toMatchObject({
      error: { version: '1', code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' },
    });

    const login = await fetch(`${state.apiOrigin}/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: state.webOrigin },
      body: JSON.stringify({ password }),
    });
    expect(login.status).toBe(200);
    expect(login.headers.get('access-control-allow-origin')).toBe(state.webOrigin);
    expect(login.headers.get('access-control-allow-credentials')).toBe('true');
    expect(login.headers.get('access-control-allow-origin')).not.toBe('*');
    const setCookie = login.headers.getSetCookie()[0] ?? '';
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Strict');
    expect(setCookie).toContain('Path=/');
    expect(setCookie).not.toContain('Secure');
    expect(setCookie).not.toContain(password);
    const cookie = cookieFrom(login);
    const rawCredential = cookie.slice(cookie.indexOf('=') + 1);

    const stored = await composeExec(state, 'postgres', [
      'sh',
      '-c',
      `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT credential_hash FROM auth_sessions ORDER BY created_at DESC LIMIT 1"`,
    ]);
    const expectedHash = createHash('sha256').update(rawCredential, 'utf8').digest('hex');
    expect(stored.ok).toBe(true);
    expect(stored.stdout.trim().length).toBe(64);
    expect(stored.stdout.trim() === expectedHash).toBe(true);
    expect(stored.stdout.includes(rawCredential)).toBe(false);

    const session = await fetch(`${state.apiOrigin}/v1/auth/session`, { headers: { cookie } });
    expect(session.status).toBe(200);
    expect(await session.json()).toMatchObject({
      data: {
        principal: { kind: 'user', userId: '00000000-0000-4000-8000-000000000001' },
      },
    });

    const deniedOrigin = await fetch(`${state.apiOrigin}/v1/auth/logout`, {
      method: 'POST',
      headers: { cookie, origin: 'https://denied.example' },
    });
    expect(deniedOrigin.status).toBe(403);
    expect(deniedOrigin.headers.get('access-control-allow-origin')).not.toBe('*');
    expect(await deniedOrigin.json()).toMatchObject({ error: { code: 'ORIGIN_DENIED' } });

    const logout = await fetch(`${state.apiOrigin}/v1/auth/logout`, {
      method: 'POST',
      headers: { cookie, origin: state.webOrigin },
    });
    expect(logout.status).toBe(204);
    const clearedCookie = logout.headers.getSetCookie()[0] ?? '';
    expect(clearedCookie).toContain('contentos_session=');
    expect(clearedCookie).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/);

    const replay = await fetch(`${state.apiOrigin}/v1/auth/session`, { headers: { cookie } });
    expect(replay.status).toBe(401);
    expect(await replay.json()).toMatchObject({ error: { code: 'UNAUTHENTICATED' } });
  });

  it('denies a server-side Session after its persisted expiry time', async () => {
    const state = requireState();
    const credentials = readComposeCredentials(state.envFile);
    const password = credentials.CONTENTOS_TEST_OWNER_PASSWORD;
    if (!password) {
      throw new Error('temporary authentication fixture is missing');
    }

    const login = await fetch(`${state.apiOrigin}/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: state.webOrigin },
      body: JSON.stringify({ password }),
    });
    expect(login.status).toBe(200);
    const cookie = cookieFrom(login);

    const expire = await composeExec(state, 'postgres', [
      'sh',
      '-c',
      `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "UPDATE auth_sessions SET expires_at = now() - interval '1 second' WHERE id = (SELECT id FROM auth_sessions ORDER BY created_at DESC LIMIT 1)"`,
    ]);
    expect(expire.ok).toBe(true);

    const expired = await fetch(`${state.apiOrigin}/v1/auth/session`, { headers: { cookie } });
    expect(expired.status).toBe(401);
    expect(await expired.json()).toMatchObject({ error: { version: '1', code: 'UNAUTHENTICATED' } });
  });

  it('throttles repeated invalid credentials without reflecting the password', async () => {
    const state = requireState();
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await fetch(`${state.apiOrigin}/v1/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: state.webOrigin },
        body: JSON.stringify({ password: `invalid-password-${attempt}` }),
      });
      expect(response.status).toBe(401);
    }

    const blocked = await fetch(`${state.apiOrigin}/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: state.webOrigin },
      body: JSON.stringify({ password: 'still-invalid' }),
    });
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('retry-after')).toMatch(/^\d+$/);
    const body = await blocked.text();
    expect(body).toContain('RATE_LIMITED');
    expect(body).not.toContain('still-invalid');
  });
});
