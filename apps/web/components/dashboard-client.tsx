'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';

import type { ContentPackageModeDto, ContentPackageOutputDto, ContentPackageResource } from '@contentos/contracts';

import { ContentOsApiClient, WebApiError } from '../lib/api-client';
import { CONTENT_MODE_LABEL, OUTPUT_LABEL, UI_COPY } from '../lib/ui-copy';
import { AppShell, StatusMessage } from './app-shell';

type View = 'active' | 'archived';

function safeMessage(error: unknown): string {
  return error instanceof WebApiError && error.code === 'NETWORK_ERROR'
    ? '私有 API 暂时不可用。请检查本地服务后重试。'
    : '内容项目读取失败，请重试。';
}

export function DashboardClient({ apiOrigin, initialView }: { apiOrigin: string; initialView: View }) {
  const api = useMemo(() => new ContentOsApiClient(apiOrigin), [apiOrigin]);
  const router = useRouter();
  const submitting = useRef(false);
  const [view, setView] = useState<View>(initialView);
  const [items, setItems] = useState<readonly ContentPackageResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentMode, setContentMode] = useState<ContentPackageModeDto>('deferred');
  const [outputs, setOutputs] = useState<ContentPackageOutputDto[]>(['blog', 'xiaohongshu']);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let current = true;
    void api
      .session()
      .then(() => api.list(view))
      .then((result) => {
        if (current) {
          setItems(result.data.items);
        }
      })
      .catch((error: unknown) => {
        if (!current) return;
        if (error instanceof WebApiError && error.status === 401) {
          router.replace('/login');
          return;
        }
        setLoadError(safeMessage(error));
      })
      .finally(() => current && setLoading(false));
    return () => {
      current = false;
    };
  }, [api, router, view]);

  async function logout(): Promise<void> {
    try {
      await api.logout();
      router.replace('/login');
      router.refresh();
    } catch (cause) {
      if (cause instanceof WebApiError && cause.status === 401) {
        router.replace('/login');
      } else {
        setLoadError('ContentOS 无法结束当前会话，请重试。');
      }
    }
  }

  function toggleOutput(output: ContentPackageOutputDto): void {
    setOutputs((current) =>
      current.includes(output) ? current.filter((item) => item !== output) : [...current, output],
    );
  }

  function changeView(next: View): void {
    setLoading(true);
    setLoadError('');
    setView(next);
  }

  async function create(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (submitting.current || title.trim() === '' || outputs.length === 0) return;
    submitting.current = true;
    setCreating(true);
    setCreateError('');
    try {
      const result = await api.create({
        title,
        description: description === '' ? null : description,
        contentMode,
        requestedOutputs: outputs,
      });
      router.push(`/packages/${result.data.contentPackage.id}`);
    } catch (error) {
      setCreateError(
        error instanceof WebApiError && error.status === 422 ? '请检查项目信息后重试。' : '内容项目创建失败，请重试。',
      );
      submitting.current = false;
      setCreating(false);
    }
  }

  return (
    <AppShell active="dashboard" onLogout={() => void logout()}>
      <header className="page-header">
        <div>
          <p className="eyebrow">个人内容工作室</p>
          <h1>{UI_COPY.shell.dashboard}</h1>
          <p className="lede">创建、继续和管理你的私有内容项目，让资料、研究与双输出保持清晰可追溯。</p>
        </div>
        <button aria-label="新建内容项目" className="primary-button" type="button" onClick={() => setShowCreate(true)}>
          <span aria-hidden="true">＋</span> 新建内容项目
        </button>
      </header>

      <div className="view-tabs" role="group" aria-label="内容项目状态">
        <button type="button" className={view === 'active' ? 'is-active' : ''} onClick={() => changeView('active')}>
          进行中
        </button>
        <button type="button" className={view === 'archived' ? 'is-active' : ''} onClick={() => changeView('archived')}>
          已归档
        </button>
      </div>

      {showCreate ? (
        <section className="create-panel" aria-labelledby="create-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">新项目</p>
              <h2 id="create-title">创建内容项目</h2>
            </div>
            <button
              className="icon-button"
              type="button"
              aria-label="关闭新项目表单"
              onClick={() => setShowCreate(false)}
            >
              ×
            </button>
          </div>
          <form className="form-grid" onSubmit={create}>
            <div className="field full-span">
              <label htmlFor="package-title">项目标题</label>
              <input
                id="package-title"
                aria-label="项目标题"
                value={title}
                maxLength={200}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </div>
            <div className="field full-span">
              <label htmlFor="package-description">
                项目说明 <span>可选</span>
              </label>
              <textarea
                id="package-description"
                aria-label="项目说明"
                value={description}
                maxLength={2000}
                rows={3}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="content-mode">内容模式</label>
              <select
                id="content-mode"
                aria-label="内容模式"
                value={contentMode}
                onChange={(event) => setContentMode(event.target.value as ContentPackageModeDto)}
              >
                <option value="deferred">{CONTENT_MODE_LABEL.deferred}</option>
                <option value="creator_led">{CONTENT_MODE_LABEL.creator_led}</option>
                <option value="research_based">{CONTENT_MODE_LABEL.research_based}</option>
              </select>
            </div>
            <fieldset className="field output-field">
              <legend>目标输出</legend>
              <label className="check-label">
                <input type="checkbox" checked={outputs.includes('blog')} onChange={() => toggleOutput('blog')} />{' '}
                {OUTPUT_LABEL.blog}
              </label>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={outputs.includes('xiaohongshu')}
                  onChange={() => toggleOutput('xiaohongshu')}
                />{' '}
                {OUTPUT_LABEL.xiaohongshu}
              </label>
            </fieldset>
            {outputs.length === 0 ? (
              <p className="field-error full-span" role="alert">
                请至少选择一种输出。
              </p>
            ) : null}
            {createError ? (
              <p className="field-error full-span" role="alert">
                {createError}
              </p>
            ) : null}
            <div className="form-actions full-span">
              <button className="secondary-button" type="button" onClick={() => setShowCreate(false)}>
                取消
              </button>
              <button
                className="primary-button"
                type="submit"
                aria-label="创建内容项目"
                disabled={creating || title.trim() === '' || outputs.length === 0}
              >
                {creating ? '正在创建…' : '创建内容项目'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {loading ? (
        <div className="loading-state" role="status">
          <span className="skeleton-line" /> 正在读取内容项目…
        </div>
      ) : null}
      {loadError ? <StatusMessage>{loadError}</StatusMessage> : null}
      {!loading && !loadError && items.length === 0 ? (
        <section className="empty-state">
          <div className="empty-icon" aria-hidden="true">
            ◇
          </div>
          <h2>{view === 'active' ? '开始第一个内容项目' : '暂无已归档项目'}</h2>
          <p>
            {view === 'active'
              ? '一个内容项目把同一主题的资料、研究和输出整理在一起。'
              : '归档项目会被完整保留，并显示在这里。'}
          </p>
          {view === 'active' ? (
            <button className="primary-button" type="button" onClick={() => setShowCreate(true)}>
              创建内容项目
            </button>
          ) : null}
        </section>
      ) : null}
      {!loading && items.length > 0 ? (
        <section className="package-grid" aria-label={view === 'active' ? '进行中的内容项目' : '已归档的内容项目'}>
          {items.map((item) => (
            <Link className="package-card" href={`/packages/${item.id}`} key={item.id}>
              <div className="card-top">
                <span className={`lifecycle ${item.lifecycle}`}>
                  {item.lifecycle === 'active' ? '进行中' : '已归档'}
                </span>
                <span>版本 {item.revision}</span>
              </div>
              <h2>{item.title}</h2>
              <p>{item.description ?? '尚未添加项目说明。'}</p>
              <div className="output-list">
                {item.requestedOutputs.map((output) => (
                  <span key={output}>{OUTPUT_LABEL[output]}</span>
                ))}
              </div>
              <span className="open-link">
                打开创作工作台 <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </section>
      ) : null}
    </AppShell>
  );
}
