'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useMemo, useState } from 'react';

import type { ContentPackageModeDto, ContentPackageOutputDto, ContentPackageResource } from '@contentos/contracts';

import { ContentOsApiClient, WebApiError } from '../lib/api-client';
import { AppShell, StatusMessage } from './app-shell';

export function WorkspaceClient({ apiOrigin, contentPackageId }: { apiOrigin: string; contentPackageId: string }) {
  const api = useMemo(() => new ContentOsApiClient(apiOrigin), [apiOrigin]);
  const router = useRouter();
  const [contentPackage, setContentPackage] = useState<ContentPackageResource | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentMode, setContentMode] = useState<ContentPackageModeDto>('deferred');
  const [outputs, setOutputs] = useState<ContentPackageOutputDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  function apply(value: ContentPackageResource): void {
    setContentPackage(value);
    setTitle(value.title);
    setDescription(value.description ?? '');
    setContentMode(value.contentMode);
    setOutputs([...value.requestedOutputs]);
  }

  async function load(): Promise<void> {
    setLoading(true);
    setError('');
    setConflict(false);
    try {
      await api.session();
      apply((await api.get(contentPackageId)).data.contentPackage);
    } catch (cause) {
      if (cause instanceof WebApiError && cause.status === 401) {
        router.replace('/login');
      } else if (cause instanceof WebApiError && cause.status === 404) {
        setError('This Content Package is unavailable.');
      } else {
        setError('The workspace could not be loaded. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let current = true;
    void api
      .session()
      .then(() => api.get(contentPackageId))
      .then((result) => {
        if (current) apply(result.data.contentPackage);
      })
      .catch((cause: unknown) => {
        if (!current) return;
        if (cause instanceof WebApiError && cause.status === 401) router.replace('/login');
        else if (cause instanceof WebApiError && cause.status === 404) setError('This Content Package is unavailable.');
        else setError('The workspace could not be loaded. Try again.');
      })
      .finally(() => current && setLoading(false));
    return () => {
      current = false;
    };
  }, [api, contentPackageId, router]);

  async function logout(): Promise<void> {
    try {
      await api.logout();
      router.replace('/login');
    } catch (cause) {
      if (cause instanceof WebApiError && cause.status === 401) {
        router.replace('/login');
      } else {
        setError('ContentOS could not end the session. Try again.');
      }
    }
  }

  function toggleOutput(output: ContentPackageOutputDto): void {
    setOutputs((current) =>
      current.includes(output) ? current.filter((item) => item !== output) : [...current, output],
    );
  }

  async function save(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!contentPackage || saving || title.trim() === '' || outputs.length === 0) return;
    setSaving(true);
    setError('');
    setNotice('');
    setConflict(false);
    try {
      apply(
        (
          await api.update(contentPackage.id, {
            expectedRevision: contentPackage.revision,
            title,
            description: description === '' ? null : description,
            contentMode,
            requestedOutputs: outputs,
          })
        ).data.contentPackage,
      );
      setNotice('Changes saved to the authoritative workspace.');
    } catch (cause) {
      if (cause instanceof WebApiError && cause.code === 'REVISION_CONFLICT') {
        setConflict(true);
      } else if (cause instanceof WebApiError && cause.status === 401) {
        router.replace('/login');
      } else {
        setError('Changes were not saved. Review the form and try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function archive(): Promise<void> {
    if (!contentPackage || saving) return;
    setSaving(true);
    setError('');
    try {
      await api.archive(contentPackage.id, { expectedRevision: contentPackage.revision });
      router.replace('/?view=archived');
    } catch (cause) {
      if (cause instanceof WebApiError && cause.code === 'REVISION_CONFLICT') setConflict(true);
      else if (cause instanceof WebApiError && cause.status === 401) router.replace('/login');
      else setError('The package was not archived. Try again.');
    } finally {
      setSaving(false);
      setConfirmArchive(false);
    }
  }

  return (
    <AppShell active="workspace" onLogout={() => void logout()}>
      <header className="workspace-header">
        <div>
          <Link className="back-link" href="/">
            ← Dashboard
          </Link>
          <p className="eyebrow">Content Package workspace</p>
          <h1>{contentPackage?.title ?? 'Workspace'}</h1>
        </div>
        {contentPackage ? <div className="revision-badge">Revision {contentPackage.revision}</div> : null}
      </header>

      {loading ? (
        <div className="loading-state" role="status">
          <span /> Loading workspace…
        </div>
      ) : null}
      {error ? <StatusMessage>{error}</StatusMessage> : null}
      {conflict ? (
        <StatusMessage>
          <strong>Revision conflict.</strong> A newer authoritative revision exists. Your changes were not applied.{' '}
          <button className="inline-button" type="button" onClick={() => void load()}>
            Reload latest
          </button>
        </StatusMessage>
      ) : null}

      {contentPackage && !loading ? (
        <div className="workspace-layout">
          <section className="workspace-main" aria-labelledby="metadata-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Current foundation</p>
                <h2 id="metadata-title">Package metadata</h2>
              </div>
              <span className={`lifecycle ${contentPackage.lifecycle}`}>{contentPackage.lifecycle}</span>
            </div>
            <form className="form-grid" onSubmit={save}>
              <div className="field full-span">
                <label htmlFor="workspace-title">Title</label>
                <input
                  id="workspace-title"
                  maxLength={200}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  disabled={contentPackage.lifecycle === 'archived'}
                  required
                />
              </div>
              <div className="field full-span">
                <label htmlFor="workspace-description">
                  Description <span>Optional</span>
                </label>
                <textarea
                  id="workspace-description"
                  maxLength={2000}
                  rows={4}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  disabled={contentPackage.lifecycle === 'archived'}
                />
              </div>
              <div className="field">
                <label htmlFor="workspace-mode">Content mode</label>
                <select
                  id="workspace-mode"
                  value={contentMode}
                  onChange={(event) => setContentMode(event.target.value as ContentPackageModeDto)}
                  disabled={contentPackage.lifecycle === 'archived'}
                >
                  <option value="deferred">Decide later</option>
                  <option value="creator_led">Creator-led</option>
                  <option value="research_based">Research-based</option>
                </select>
              </div>
              <fieldset className="field output-field" disabled={contentPackage.lifecycle === 'archived'}>
                <legend>Requested outputs</legend>
                <label className="check-label">
                  <input type="checkbox" checked={outputs.includes('blog')} onChange={() => toggleOutput('blog')} />{' '}
                  Blog
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
              {notice ? (
                <p className="save-notice full-span" role="status">
                  {notice}
                </p>
              ) : null}
              {contentPackage.lifecycle === 'active' ? (
                <div className="form-actions full-span">
                  <button
                    className="primary-button"
                    type="submit"
                    disabled={saving || title.trim() === '' || outputs.length === 0}
                  >
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              ) : null}
            </form>
          </section>

          <aside className="stage-panel" aria-labelledby="stage-title">
            <p className="eyebrow">M1 context</p>
            <h2 id="stage-title">Foundation</h2>
            <div className="stage-current">
              <span>01</span>
              <div>
                <strong>Package metadata</strong>
                <small>Available now</small>
              </div>
            </div>
            <div className="stage-future">
              <span>02</span>
              <div>
                <strong>Sources</strong>
                <small>Planned for M2</small>
              </div>
            </div>
            <div className="stage-future">
              <span>03</span>
              <div>
                <strong>Research & creation</strong>
                <small>Not implemented</small>
              </div>
            </div>
            <p className="stage-note">
              This shell does not start a Workflow or Agent. It preserves the honest boundary of the current milestone.
            </p>
            {contentPackage.lifecycle === 'active' ? (
              <button className="danger-text-button" type="button" onClick={() => setConfirmArchive(true)}>
                Archive package
              </button>
            ) : (
              <p className="archived-note">This package is preserved as archived and is read-only.</p>
            )}
          </aside>
        </div>
      ) : null}

      {confirmArchive ? (
        <div className="dialog-backdrop" role="presentation">
          <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="archive-title">
            <p className="eyebrow">Preserve, don’t delete</p>
            <h2 id="archive-title">Archive this package?</h2>
            <p>It will leave the active Dashboard but remain available in Archived.</p>
            <div className="form-actions">
              <button className="secondary-button" type="button" onClick={() => setConfirmArchive(false)} autoFocus>
                Cancel
              </button>
              <button className="danger-button" type="button" onClick={() => void archive()} disabled={saving}>
                {saving ? 'Archiving…' : 'Archive package'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
