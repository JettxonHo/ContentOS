'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ContentModeDto, XiaohongshuBodyDto, XiaohongshuResource } from '@contentos/contracts';

import { WebApiError, type ContentOsApiClient } from '../lib/api-client';
import {
  candidatePresentationStatus,
  deriveCandidateAction,
  workspaceStageStatusLabel,
} from '../lib/workspace-stage-view';
import { StatusMessage } from './app-shell';
import { NextActionCard } from './next-action-card';

const clone = (body: XiaohongshuBodyDto): XiaohongshuBodyDto => JSON.parse(JSON.stringify(body)) as XiaohongshuBodyDto;

function errorMessage(error: unknown): string {
  if (!(error instanceof WebApiError)) return 'The command could not be completed. Try again.';
  switch (error.code) {
    case 'APPROVED_RESEARCH_REQUIRED':
      return 'Approve the current Research Version before generating Xiaohongshu content.';
    case 'CONFIRMED_OPINION_REQUIRED':
      return 'Creator-led generation requires a Human Opinion confirmed against current Research.';
    case 'BLOG_REVISION_CONFLICT':
      return 'A newer Xiaohongshu Working Copy exists. Reload before saving.';
    case 'BLOG_VERSION_NOT_ELIGIBLE':
      return 'The exact Xiaohongshu Version is not eligible. Review all eight pages and current dependencies.';
    case 'BLOG_PROVIDER_OUTPUT_INVALID':
      return 'The generated candidate failed the deterministic eight-page content contract.';
    case 'BLOG_EXPORT_NOT_ELIGIBLE':
      return 'Export requires a current exact Approved Xiaohongshu Version.';
    default:
      return 'The command could not be completed. Try again.';
  }
}

export function XiaohongshuPanel({
  api,
  contentPackageId,
  configuredMode,
  active,
  onDirtyChange,
  onBusyChange,
  onUnauthenticated,
  onStatusChange,
}: {
  readonly api: ContentOsApiClient;
  readonly contentPackageId: string;
  readonly configuredMode: 'deferred' | ContentModeDto;
  readonly active: boolean;
  readonly onDirtyChange: (value: boolean) => void;
  readonly onBusyChange: (value: boolean) => void;
  readonly onUnauthenticated: () => void;
  readonly onStatusChange: () => void;
}) {
  const [state, setState] = useState<XiaohongshuResource | null>(null);
  const [draft, setDraft] = useState<XiaohongshuBodyDto | null>(null);
  const [mode, setMode] = useState<ContentModeDto | null>(configuredMode === 'deferred' ? null : configuredMode);
  const [selectedPage, setSelectedPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const dirty = useMemo(
    () => Boolean(state && draft && JSON.stringify(state.workingCopy.body) !== JSON.stringify(draft)),
    [draft, state],
  );
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  useEffect(() => onBusyChange(busy), [busy, onBusyChange]);

  const apply = (next: XiaohongshuResource): void => {
    setState(next);
    setDraft(clone(next.workingCopy.body));
    setMode(next.latestVersion.body.contentMode);
    setSelectedPage((current) => Math.min(current, next.workingCopy.body.pages.length - 1));
  };
  const load = async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      apply((await api.getXiaohongshu(contentPackageId)).data.xiaohongshu);
    } catch (cause) {
      if (cause instanceof WebApiError && cause.status === 401) onUnauthenticated();
      else if (cause instanceof WebApiError && cause.code === 'BLOG_NOT_FOUND') {
        setState(null);
        setDraft(null);
      } else setError('Xiaohongshu status could not be loaded. Reload authoritative status.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    let live = true;
    void Promise.resolve().then(() => {
      if (live) return load();
    });
    return () => {
      live = false;
      onDirtyChange(false);
      onBusyChange(false);
    }; /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [contentPackageId]);

  async function command(run: () => Promise<XiaohongshuResource>, success: string): Promise<void> {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      apply(await run());
      setNotice(success);
      onStatusChange();
    } catch (cause) {
      if (cause instanceof WebApiError && cause.status === 401) onUnauthenticated();
      else setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }
  async function download(kind: 'post' | 'pages'): Promise<void> {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const content = await api.exportXiaohongshu(contentPackageId, kind);
      const url = URL.createObjectURL(
        new Blob([content], { type: kind === 'post' ? 'text/markdown' : 'application/json' }),
      );
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = kind === 'post' ? 'post.md' : 'pages.json';
      anchor.click();
      URL.revokeObjectURL(url);
      setNotice(`Approved ${anchor.download} exported.`);
    } catch (cause) {
      if (cause instanceof WebApiError && cause.status === 401) onUnauthenticated();
      else setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  const action = deriveCandidateAction({
    resource: state,
    dirty,
    active,
    busy,
    noun: 'Xiaohongshu',
    exportLabel: 'Export post.md',
  });
  const presentationStatus = candidatePresentationStatus(state, dirty);
  const generate = (fresh: boolean): void => {
    if (!mode) return;
    void command(
      async () =>
        (await api.generateXiaohongshu(contentPackageId, { requestId: crypto.randomUUID(), contentMode: mode })).data
          .xiaohongshu,
      fresh
        ? 'Fresh Xiaohongshu Candidate created. Existing Versions and Approval history remain immutable.'
        : 'Eight-page Xiaohongshu Candidate generated.',
    );
  };
  const runNextAction = (): void => {
    if (action.disabled || action.id === 'complete') return;
    if (action.id === 'generate' || action.id === 'refresh') return generate(action.id === 'refresh');
    if (!state || !draft) return;
    if (action.id === 'save') {
      void command(
        async () =>
          (await api.editXiaohongshu(contentPackageId, { expectedRevision: state.workingCopy.revision, body: draft }))
            .data.xiaohongshu,
        'Xiaohongshu Working Copy saved.',
      );
    } else if (action.id === 'checkpoint') {
      void command(
        async () =>
          (await api.checkpointXiaohongshu(contentPackageId, { expectedRevision: state.workingCopy.revision })).data
            .xiaohongshu,
        'Immutable Xiaohongshu Version checkpointed.',
      );
    } else if (action.id === 'approve') {
      void command(
        async () =>
          (await api.approveXiaohongshu(contentPackageId, { versionId: state.latestVersion.id })).data.xiaohongshu,
        'Exact Xiaohongshu Version approved.',
      );
    } else if (action.id === 'export') void download('post');
  };

  if (loading) return <p role="status">Loading Xiaohongshu…</p>;
  const page = draft?.pages[selectedPage];
  return (
    <section className="xiaohongshu-panel" aria-labelledby="xiaohongshu-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Independent output branch</p>
          <h2 id="xiaohongshu-title">Xiaohongshu content</h2>
        </div>
        <span className={`lifecycle ${presentationStatus === 'approved' ? 'active' : 'archived'}`}>
          {workspaceStageStatusLabel(presentationStatus)}
        </span>
      </div>
      {error ? <StatusMessage>{error}</StatusMessage> : null}
      {notice ? <StatusMessage>{notice}</StatusMessage> : null}
      {state?.outdated ? (
        <StatusMessage>
          {state.reviewCandidateOutdated
            ? 'The current candidate uses older dependencies. Generate a fresh Candidate before review.'
            : 'An older Approved Version is Outdated. The fresh current Candidate remains In review.'}
        </StatusMessage>
      ) : null}
      <NextActionCard
        status={presentationStatus}
        label={workspaceStageStatusLabel(presentationStatus)}
        actionLabel={action.label}
        reason={action.reason}
        disabled={action.disabled || (action.id === 'generate' && mode === null)}
        disabledReason={mode === null ? 'Choose Creator-led or Research-based mode first.' : action.reason}
        busy={busy}
        onAction={action.id === 'complete' ? undefined : runNextAction}
      />

      {!state ? (
        <div className="xhs-mode-picker">
          <label htmlFor="xiaohongshu-mode">Xiaohongshu mode</label>
          <select
            id="xiaohongshu-mode"
            value={mode ?? ''}
            disabled={!active || busy}
            onChange={(event) => setMode((event.target.value || null) as ContentModeDto | null)}
          >
            <option value="">Choose a mode</option>
            <option value="creator_led">Creator-led</option>
            <option value="research_based">Research-based</option>
          </select>
        </div>
      ) : draft && page ? (
        <div className="xhs-editor-shell">
          <section className="xhs-editor-header" aria-label="Xiaohongshu packaging settings">
            <div className="field">
              <label htmlFor="platform-title">Platform title</label>
              <select
                id="platform-title"
                value={draft.selectedPlatformTitle}
                onChange={(event) => setDraft({ ...draft, selectedPlatformTitle: event.target.value })}
              >
                {draft.platformTitleCandidates.map((candidate) => (
                  <option key={candidate} value={candidate}>
                    {candidate}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="cover-title">Cover title</label>
              <input
                id="cover-title"
                value={draft.coverTitle}
                onChange={(event) => setDraft({ ...draft, coverTitle: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="cover-subtitle">Cover subtitle</label>
              <input
                id="cover-subtitle"
                value={draft.coverSubtitle ?? ''}
                onChange={(event) => setDraft({ ...draft, coverSubtitle: event.target.value || null })}
              />
            </div>
          </section>

          <nav className="xhs-page-nav" aria-label="Xiaohongshu pages">
            {draft.pages.map((entry, index) => (
              <button
                key={entry.id}
                type="button"
                className={index === selectedPage ? 'xhs-page-tab current' : 'xhs-page-tab'}
                aria-current={index === selectedPage ? 'page' : undefined}
                onClick={() => setSelectedPage(index)}
              >
                <span>{index + 1}</span>
                <small>{entry.purpose}</small>
              </button>
            ))}
          </nav>

          <article className="xhs-page-editor" aria-labelledby="xhs-page-heading">
            <div className="xhs-page-editor-title">
              <div>
                <p className="eyebrow">Page {selectedPage + 1} of 8</p>
                <h3 id="xhs-page-heading">{page.purpose}</h3>
              </div>
              <span className="xhs-density">
                {page.emphasis} · {page.density}
              </span>
            </div>
            <div className="field">
              <label htmlFor="page-heading">Page heading</label>
              <input
                id="page-heading"
                value={page.heading}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    pages: draft.pages.map((entry, index) =>
                      index === selectedPage ? { ...entry, heading: event.target.value } : entry,
                    ),
                  })
                }
              />
            </div>
            <div className="field">
              <label htmlFor="page-content">Page content</label>
              <textarea
                id="page-content"
                rows={9}
                value={page.content}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    pages: draft.pages.map((entry, index) =>
                      index === selectedPage ? { ...entry, content: event.target.value } : entry,
                    ),
                  })
                }
              />
            </div>
            <details className="xhs-traceability">
              <summary>Traceability</summary>
              <dl>
                <div>
                  <dt>Visual brief</dt>
                  <dd>{page.visualBrief}</dd>
                </div>
                <div>
                  <dt>Research items</dt>
                  <dd>{page.researchItemIds.join(', ')}</dd>
                </div>
                <div>
                  <dt>Opinion Version</dt>
                  <dd>{page.opinionVersionId ?? 'Not used in Research-based mode'}</dd>
                </div>
                <div>
                  <dt>Profile</dt>
                  <dd>{draft.platformProfileVersion}</dd>
                </div>
              </dl>
            </details>
          </article>

          <section className="xhs-finishing-grid" aria-label="Post finishing fields">
            <div className="field full-span">
              <label htmlFor="xhs-caption">Caption</label>
              <textarea
                id="xhs-caption"
                rows={5}
                value={draft.caption}
                onChange={(event) => setDraft({ ...draft, caption: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="xhs-cta">Call to action</label>
              <input
                id="xhs-cta"
                value={draft.cta}
                onChange={(event) => setDraft({ ...draft, cta: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="xhs-hashtags">Hashtags</label>
              <input
                id="xhs-hashtags"
                value={draft.hashtags.join(' ')}
                onChange={(event) => setDraft({ ...draft, hashtags: event.target.value.split(/\s+/).filter(Boolean) })}
              />
            </div>
          </section>

          <details className="xhs-traceability xhs-references">
            <summary>Public references</summary>
            <ul>
              {draft.publicReferences.map((reference) => (
                <li key={`${reference.sourceVersionId}:${reference.label}`}>
                  {reference.label} <code>{reference.sourceVersionId}</code>
                </li>
              ))}
            </ul>
          </details>
          <div className="form-actions supporting-actions" aria-label="Supporting Xiaohongshu actions">
            <button
              className="secondary-button"
              type="button"
              disabled={!active || busy || dirty}
              onClick={() => generate(true)}
            >
              Generate fresh Candidate
            </button>
            <button
              className="secondary-button"
              type="button"
              disabled={busy || !state.approvedVersionId || state.outdated}
              onClick={() => void download('pages')}
            >
              Export pages.json
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
