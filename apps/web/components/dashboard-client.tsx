'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';

import type { ContentPackageModeDto, ContentPackageOutputDto, ContentPackageResource } from '@contentos/contracts';

import { ContentOsApiClient, WebApiError } from '../lib/api-client';
import { AppShell, StatusMessage } from './app-shell';

type View = 'active' | 'archived';

function safeMessage(error: unknown): string {
  return error instanceof WebApiError && error.code === 'NETWORK_ERROR'
    ? 'The private API is unavailable. Check the local services and try again.'
    : 'Content Packages could not be loaded. Try again.';
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
        setLoadError('ContentOS could not end the session. Try again.');
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
        error instanceof WebApiError && error.status === 422
          ? 'Review the package details and try again.'
          : 'The package could not be created. Try again.',
      );
      submitting.current = false;
      setCreating(false);
    }
  }

  return (
    <AppShell active="dashboard" onLogout={() => void logout()}>
      <header className="page-header">
        <div>
          <p className="eyebrow">Content foundation</p>
          <h1>Dashboard</h1>
          <p className="lede">Create and reopen private content projects. Source and workflow stages come later.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => setShowCreate(true)}>
          <span aria-hidden="true">＋</span> New package
        </button>
      </header>

      <div className="view-tabs" role="group" aria-label="Package status">
        <button type="button" className={view === 'active' ? 'is-active' : ''} onClick={() => changeView('active')}>
          Active
        </button>
        <button type="button" className={view === 'archived' ? 'is-active' : ''} onClick={() => changeView('archived')}>
          Archived
        </button>
      </div>

      {showCreate ? (
        <section className="create-panel" aria-labelledby="create-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">New project</p>
              <h2 id="create-title">Create Content Package</h2>
            </div>
            <button
              className="icon-button"
              type="button"
              aria-label="Close new package form"
              onClick={() => setShowCreate(false)}
            >
              ×
            </button>
          </div>
          <form className="form-grid" onSubmit={create}>
            <div className="field full-span">
              <label htmlFor="package-title">Title</label>
              <input
                id="package-title"
                value={title}
                maxLength={200}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </div>
            <div className="field full-span">
              <label htmlFor="package-description">
                Description <span>Optional</span>
              </label>
              <textarea
                id="package-description"
                value={description}
                maxLength={2000}
                rows={3}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="content-mode">Content mode</label>
              <select
                id="content-mode"
                value={contentMode}
                onChange={(event) => setContentMode(event.target.value as ContentPackageModeDto)}
              >
                <option value="deferred">Decide later</option>
                <option value="creator_led">Creator-led</option>
                <option value="research_based">Research-based</option>
              </select>
            </div>
            <fieldset className="field output-field">
              <legend>Requested outputs</legend>
              <label className="check-label">
                <input type="checkbox" checked={outputs.includes('blog')} onChange={() => toggleOutput('blog')} /> Blog
              </label>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={outputs.includes('xiaohongshu')}
                  onChange={() => toggleOutput('xiaohongshu')}
                />{' '}
                Xiaohongshu
              </label>
            </fieldset>
            {outputs.length === 0 ? (
              <p className="field-error full-span" role="alert">
                Choose at least one output.
              </p>
            ) : null}
            {createError ? (
              <p className="field-error full-span" role="alert">
                {createError}
              </p>
            ) : null}
            <div className="form-actions full-span">
              <button className="secondary-button" type="button" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button
                className="primary-button"
                type="submit"
                disabled={creating || title.trim() === '' || outputs.length === 0}
              >
                {creating ? 'Creating…' : 'Create package'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {loading ? (
        <div className="loading-state" role="status">
          <span /> Loading packages…
        </div>
      ) : null}
      {loadError ? <StatusMessage>{loadError}</StatusMessage> : null}
      {!loading && !loadError && items.length === 0 ? (
        <section className="empty-state">
          <div className="empty-icon" aria-hidden="true">
            ◇
          </div>
          <h2>{view === 'active' ? 'Start your first content project' : 'No archived packages'}</h2>
          <p>
            {view === 'active'
              ? 'A Content Package keeps one idea and its future outputs together.'
              : 'Archived work stays preserved and will appear here.'}
          </p>
          {view === 'active' ? (
            <button className="primary-button" type="button" onClick={() => setShowCreate(true)}>
              Create Content Package
            </button>
          ) : null}
        </section>
      ) : null}
      {!loading && items.length > 0 ? (
        <section className="package-grid" aria-label={`${view} Content Packages`}>
          {items.map((item) => (
            <Link className="package-card" href={`/packages/${item.id}`} key={item.id}>
              <div className="card-top">
                <span className={`lifecycle ${item.lifecycle}`}>{item.lifecycle}</span>
                <span>r{item.revision}</span>
              </div>
              <h2>{item.title}</h2>
              <p>{item.description ?? 'No description yet.'}</p>
              <div className="output-list">
                {item.requestedOutputs.map((output) => (
                  <span key={output}>{output === 'xiaohongshu' ? 'Xiaohongshu' : 'Blog'}</span>
                ))}
              </div>
              <span className="open-link">
                Open workspace <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </section>
      ) : null}
    </AppShell>
  );
}
