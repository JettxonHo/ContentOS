'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';

import { ContentOsApiClient, WebApiError } from '../lib/api-client';

export function LoginClient({ apiOrigin }: { apiOrigin: string }) {
  const api = useMemo(() => new ContentOsApiClient(apiOrigin), [apiOrigin]);
  const router = useRouter();
  const passwordInput = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void api
      .session()
      .then(() => router.replace('/'))
      .catch(() => undefined);
  }, [api, router]);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (pending || password.length === 0) {
      return;
    }
    setPending(true);
    setError('');
    try {
      await api.login({ password });
      setPassword('');
      router.replace('/');
      router.refresh();
    } catch (cause) {
      setPassword('');
      setError(
        cause instanceof WebApiError && cause.code === 'INVALID_CREDENTIALS'
          ? 'The password was not accepted. Try again.'
          : 'ContentOS could not sign you in. Try again.',
      );
      requestAnimationFrame(() => passwordInput.current?.focus());
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">
          <span className="brand-mark">C</span> ContentOS
        </div>
        <p className="eyebrow">Private content studio</p>
        <h1 id="login-title">Welcome back</h1>
        <p className="lede">Sign in to continue to your private creator workspace.</p>
        <form onSubmit={submit} noValidate>
          <label htmlFor="owner-password">Owner password</label>
          <input
            ref={passwordInput}
            id="owner-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-describedby={error ? 'login-error' : 'password-help'}
            aria-invalid={Boolean(error)}
            required
          />
          <p className="field-help" id="password-help">
            Your password is sent only to the private ContentOS API.
          </p>
          {error ? (
            <p className="field-error" id="login-error" role="alert">
              {error}
            </p>
          ) : null}
          <button className="primary-button full" type="submit" disabled={pending || password.length === 0}>
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="privacy-note">
          <span aria-hidden="true">●</span> Single-user · local-first · private by default
        </p>
      </section>
    </main>
  );
}
