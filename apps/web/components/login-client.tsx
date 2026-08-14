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
          ? '密码不正确，请重试。'
          : 'ContentOS 登录失败，请重试。',
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
        <p className="eyebrow">私有内容工作室</p>
        <h1 id="login-title">欢迎回来</h1>
        <p className="lede">登录后继续使用你的个人创作工作台。</p>
        <form onSubmit={submit} noValidate>
          <label htmlFor="owner-password">所有者密码</label>
          <input
            ref={passwordInput}
            id="owner-password"
            name="password"
            type="password"
            aria-label="所有者密码"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-describedby={error ? 'login-error' : 'password-help'}
            aria-invalid={Boolean(error)}
            required
          />
          <p className="field-help" id="password-help">
            密码只会发送到本机私有 ContentOS API。
          </p>
          {error ? (
            <p className="field-error" id="login-error" role="alert">
              {error}
            </p>
          ) : null}
          <button
            aria-label="登录"
            className="primary-button full"
            type="submit"
            disabled={pending || password.length === 0}
          >
            {pending ? '正在登录…' : '登录'}
          </button>
        </form>
        <p className="privacy-note">
          <span aria-hidden="true">●</span> 单用户 · 本地优先 · 默认私有
        </p>
      </section>
    </main>
  );
}
