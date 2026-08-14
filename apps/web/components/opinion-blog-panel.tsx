'use client';

import { useEffect, useMemo, useState } from 'react';
import type { BlogBodyDto, BlogResource, ContentModeDto, OpinionResource } from '@contentos/contracts';

import { WebApiError, type ContentOsApiClient } from '../lib/api-client';
import {
  candidatePresentationStatus,
  deriveCandidateAction,
  workspaceStageStatusLabel,
  type CandidateAction,
} from '../lib/workspace-stage-view';
import { StatusMessage } from './app-shell';
import { NextActionCard } from './next-action-card';

interface Props {
  readonly api: ContentOsApiClient;
  readonly contentPackageId: string;
  readonly configuredMode: 'deferred' | ContentModeDto;
  readonly active: boolean;
  readonly onDirtyChange: (dirty: boolean) => void;
  readonly onBusyChange: (busy: boolean) => void;
  readonly onUnauthenticated: () => void;
  readonly onStatusChange: () => void;
}

const clone = (body: BlogBodyDto): BlogBodyDto => JSON.parse(JSON.stringify(body)) as BlogBodyDto;

function commandError(cause: unknown): string {
  if (!(cause instanceof WebApiError)) return 'The command could not be completed. Try again.';
  switch (cause.code) {
    case 'APPROVED_RESEARCH_REQUIRED':
      return 'Approve the current Research Version before continuing.';
    case 'CONFIRMED_OPINION_REQUIRED':
      return 'Re-interpret the retained response against current Research, review it, then confirm the exact Opinion Version.';
    case 'OPINION_REVISION_CONFLICT':
      return 'A newer Opinion draft exists. Reload before confirming.';
    case 'BLOG_REVISION_CONFLICT':
      return 'A newer Blog Working Copy exists. Reload before saving.';
    case 'BLOG_VERSION_NOT_ELIGIBLE':
      return 'The exact Blog Version is not eligible. Keep a final “## References” section and refresh changed dependencies.';
    case 'BLOG_PROVIDER_OUTPUT_INVALID':
      return 'The Blog candidate failed deterministic content validation. No candidate was promoted.';
    case 'BLOG_EXPORT_NOT_ELIGIBLE':
      return 'Export requires a current exact Approved Blog Version.';
    default:
      return 'The command could not be completed. Try again.';
  }
}

export function OpinionBlogPanel({
  api,
  contentPackageId,
  configuredMode,
  active,
  onDirtyChange,
  onBusyChange,
  onUnauthenticated,
  onStatusChange,
}: Props) {
  const [opinion, setOpinion] = useState<OpinionResource | null>(null);
  const [raw, setRaw] = useState('');
  const [statement, setStatement] = useState('');
  const [opinionNeedsConfirmation, setOpinionNeedsConfirmation] = useState(false);
  const [reinterpretedCurrent, setReinterpretedCurrent] = useState(false);
  const [blog, setBlog] = useState<BlogResource | null>(null);
  const [draft, setDraft] = useState<BlogBodyDto | null>(null);
  const [mode, setMode] = useState<'deferred' | ContentModeDto>(configuredMode);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const dirty = useMemo(
    () => blog !== null && draft !== null && JSON.stringify(blog.workingCopy.body) !== JSON.stringify(draft),
    [blog, draft],
  );
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  useEffect(() => onBusyChange(busy), [busy, onBusyChange]);

  const applyBlog = (next: BlogResource): void => {
    setBlog(next);
    setDraft(clone(next.workingCopy.body));
    setMode(next.latestVersion.body.contentMode);
  };
  const applyOpinion = (next: OpinionResource | null, showDraftInterpretation = false): void => {
    setOpinion(next);
    setRaw(next?.rawResponse ?? '');
    setStatement(
      showDraftInterpretation
        ? (next?.interpretation ?? '')
        : next?.confirmedVersionId && !next.outdated
          ? (next.confirmedStatement ?? next.interpretation)
          : (next?.interpretation ?? ''),
    );
    setOpinionNeedsConfirmation(Boolean(next && (next.outdated || !next.confirmedVersionId)));
    setReinterpretedCurrent(false);
  };
  const load = async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      setMode(configuredMode);
      const opinionResponse = (await api.getOpinion(contentPackageId)).data.opinion;
      applyOpinion(opinionResponse);
      if (configuredMode === 'deferred' && opinionResponse) setMode('creator_led');
      try {
        applyBlog((await api.getBlog(contentPackageId)).data.blog);
      } catch (cause) {
        if (cause instanceof WebApiError && cause.code === 'BLOG_NOT_FOUND') {
          setBlog(null);
          setDraft(null);
        } else throw cause;
      }
    } catch (cause) {
      if (cause instanceof WebApiError && cause.status === 401) onUnauthenticated();
      else setError('Opinion and Blog status could not be loaded. Reload authoritative status.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    let current = true;
    void Promise.resolve().then(() => {
      if (current) return load();
    });
    return () => {
      current = false;
      onDirtyChange(false);
      onBusyChange(false);
    }; /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [contentPackageId]);

  const command = async (run: () => Promise<void>, success: string): Promise<void> => {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await run();
      setNotice(success);
      onStatusChange();
    } catch (cause) {
      if (cause instanceof WebApiError && cause.status === 401) onUnauthenticated();
      else setError(commandError(cause));
    } finally {
      setBusy(false);
    }
  };

  const currentConfirmedOpinion = Boolean(
    opinion?.confirmedVersionId && !opinion.outdated && !opinionNeedsConfirmation,
  );
  const rawResponseChanged = Boolean(opinion && raw !== opinion.rawResponse);
  const blogAction = deriveCandidateAction({
    resource: blog,
    dirty,
    active,
    busy,
    noun: 'Blog',
    exportLabel: 'Export article.md',
  });
  let action: CandidateAction = blogAction;
  if (mode === 'deferred') {
    action = {
      id: 'select_mode',
      label: 'Choose a content mode',
      reason: 'Choose Creator-led or Research-based before generating a Blog Candidate.',
      disabled: !active || busy,
    };
  } else if (mode === 'creator_led' && opinion?.outdated && !reinterpretedCurrent) {
    action = {
      id: 'refresh',
      label: 'Re-interpret with current Research',
      reason: 'The retained response is preserved, but its interpretation is bound to an older Research Version.',
      disabled: !active || busy || raw.trim() === '',
    };
  } else if (mode === 'creator_led' && !opinion) {
    action = {
      id: 'generate',
      label: 'Interpret response',
      reason:
        raw.trim() === ''
          ? 'Respond to the Opinion question before interpretation.'
          : 'Interpret the response against current Approved Research.',
      disabled: !active || busy || raw.trim() === '',
    };
  } else if (mode === 'creator_led' && !currentConfirmedOpinion) {
    action = {
      id: 'approve',
      label: 'Confirm exact Opinion Version',
      reason:
        'Review or correct the interpretation. Human confirmation binds this exact statement to current Research.',
      disabled: !active || busy || statement.trim() === '',
    };
  } else if (mode === 'creator_led' && rawResponseChanged) {
    action = {
      id: 'refresh',
      label: 'Interpret updated response',
      reason:
        'The Human response changed. Interpret it against current Research before creating a new Opinion Version.',
      disabled: !active || busy || raw.trim() === '',
    };
  }

  const presentationStatus =
    mode === 'deferred'
      ? 'ready'
      : mode === 'creator_led' && opinion?.outdated && !reinterpretedCurrent
        ? 'outdated'
        : mode === 'creator_led' && !currentConfirmedOpinion
          ? opinion
            ? 'in_review'
            : 'ready'
          : mode === 'creator_led' && rawResponseChanged
            ? 'in_review'
            : candidatePresentationStatus(blog, dirty);

  const interpret = (): void => {
    void command(async () => {
      const next = (await api.interpretOpinion(contentPackageId, { rawResponse: raw })).data.opinion;
      if (!next) throw new Error('Opinion interpretation was not returned');
      applyOpinion(next, true);
      setOpinionNeedsConfirmation(true);
      setReinterpretedCurrent(true);
    }, 'Interpretation prepared against current Approved Research. Review it before confirmation.');
  };
  const confirm = (): void => {
    if (!opinion) return;
    void command(async () => {
      applyOpinion(
        (
          await api.confirmOpinion(contentPackageId, {
            expectedRevision: opinion.revision,
            confirmedStatement: statement,
          })
        ).data.opinion,
      );
      setOpinionNeedsConfirmation(false);
      setReinterpretedCurrent(false);
    }, 'Immutable Human Opinion Version confirmed.');
  };
  const generate = (fresh: boolean): void => {
    if (mode === 'deferred') return;
    void command(
      async () => {
        applyBlog(
          (await api.generateBlog(contentPackageId, { requestId: crypto.randomUUID(), contentMode: mode })).data.blog,
        );
      },
      fresh
        ? 'Fresh Blog Candidate created. Existing Versions and Approval history remain immutable.'
        : 'Blog Candidate generated from exact Approved dependencies.',
    );
  };
  const runNextAction = (): void => {
    if (action.disabled || action.id === 'complete') return;
    if (action.id === 'select_mode') {
      document.getElementById('blog-mode')?.focus();
      return;
    }
    if (mode === 'creator_led' && ((opinion?.outdated && !reinterpretedCurrent) || !opinion || rawResponseChanged))
      return interpret();
    if (mode === 'creator_led' && !currentConfirmedOpinion) return confirm();
    if (action.id === 'generate' || action.id === 'refresh') return generate(action.id === 'refresh');
    if (!blog || !draft) return;
    if (action.id === 'save') {
      void command(
        async () =>
          applyBlog(
            (await api.editBlog(contentPackageId, { expectedRevision: blog.workingCopy.revision, body: draft })).data
              .blog,
          ),
        'Blog Working Copy saved.',
      );
    } else if (action.id === 'checkpoint') {
      void command(
        async () =>
          applyBlog(
            (await api.checkpointBlog(contentPackageId, { expectedRevision: blog.workingCopy.revision })).data.blog,
          ),
        'Immutable Blog Version checkpointed.',
      );
    } else if (action.id === 'approve') {
      void command(
        async () =>
          applyBlog((await api.approveBlog(contentPackageId, { versionId: blog.latestVersion.id })).data.blog),
        'Exact Blog Version approved.',
      );
    } else if (action.id === 'export') {
      void command(async () => {
        const markdown = await api.exportBlog(contentPackageId);
        const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown' }));
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'article.md';
        anchor.click();
        URL.revokeObjectURL(url);
      }, 'Approved article.md exported.');
    }
  };

  if (loading) return <p role="status">Loading Opinion and Blog…</p>;
  const bodyHeadings = draft?.markdown.match(/^## (?!References$).+/gm)?.length ?? 0;
  return (
    <section className="research-panel" aria-labelledby="opinion-blog-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">G2 Opinion & Blog</p>
          <h2 id="opinion-blog-title">Shape the point, then approve the article</h2>
        </div>
        <span className={`lifecycle ${presentationStatus === 'approved' ? 'active' : 'archived'}`}>
          {workspaceStageStatusLabel(presentationStatus)}
        </span>
      </div>
      {error ? <StatusMessage>{error}</StatusMessage> : null}
      {notice ? <StatusMessage>{notice}</StatusMessage> : null}
      {blog?.outdated ? (
        <StatusMessage>
          {blog.reviewCandidateOutdated
            ? 'The current Blog Candidate is Outdated; generate a fresh candidate.'
            : 'An older Approved Blog is Outdated. The fresh current Candidate remains In review.'}
        </StatusMessage>
      ) : null}
      <NextActionCard
        status={presentationStatus}
        label={workspaceStageStatusLabel(presentationStatus)}
        actionLabel={action.label}
        reason={action.reason}
        disabled={action.disabled}
        disabledReason={action.reason}
        busy={busy}
        onAction={action.id === 'complete' ? undefined : runNextAction}
      />

      <div className="form-grid">
        <div className="field">
          <label htmlFor="blog-mode">Content mode</label>
          <select
            id="blog-mode"
            value={mode}
            disabled={!active || busy || blog !== null}
            onChange={(event) => setMode(event.target.value as ContentModeDto)}
          >
            <option value="deferred" disabled>
              Choose a content mode
            </option>
            <option value="creator_led">Creator-led</option>
            <option value="research_based">Research-based</option>
          </select>
          <p className="field-help">
            {blog
              ? 'Mode is fixed for the current candidate.'
              : 'Choose how the Content Foundation should be expressed.'}
          </p>
        </div>

        {mode === 'deferred' ? (
          <div className="mode-explanation full-span">
            <strong>Choose a content mode</strong>
            <p>Select Creator-led or Research-based before generating a Blog Candidate.</p>
          </div>
        ) : mode === 'research_based' ? (
          <div className="mode-explanation full-span">
            <strong>Research-based mode</strong>
            <p>
              Uses exact Approved Research. Human Opinion is not requested, and the article must not imply personal
              experience.
            </p>
          </div>
        ) : (
          <section className="opinion-workflow full-span" aria-labelledby="opinion-workflow-title">
            <div>
              <p className="eyebrow">Creator-led opinion</p>
              <h3 id="opinion-workflow-title">Respond → Interpret → Review → Confirm</h3>
            </div>
            {opinion?.outdated ? (
              <StatusMessage>
                Research changed. The retained response is ready to re-interpret; the old Opinion Version remains
                immutable.
              </StatusMessage>
            ) : null}
            {currentConfirmedOpinion && !rawResponseChanged ? (
              <p className="confirmed-note">
                Current exact Opinion Version confirmed. No duplicate confirmation is needed.
              </p>
            ) : null}
            <div className="field">
              <label htmlFor="opinion-question">1. Human response</label>
              <p id="opinion-question">
                <strong>What should readers understand, feel, or do after reading this?</strong>
              </p>
              <textarea
                aria-label="Raw Human Opinion response"
                rows={4}
                maxLength={10000}
                value={raw}
                disabled={!active || busy}
                onChange={(event) => setRaw(event.target.value)}
              />
            </div>
            {opinion ? (
              <div className="field">
                <label htmlFor="confirmed-opinion">2. Review or correct the interpretation</label>
                <textarea
                  id="confirmed-opinion"
                  rows={4}
                  maxLength={10000}
                  value={statement}
                  disabled={!active || busy || currentConfirmedOpinion}
                  onChange={(event) => setStatement(event.target.value)}
                />
              </div>
            ) : null}
          </section>
        )}

        {blog && draft ? (
          <>
            <div className="candidate-context full-span">
              <div>
                <span>Body sections</span>
                <strong>{bodyHeadings} / 4–6</strong>
              </div>
              <div>
                <span>References</span>
                <strong>{draft.markdown.includes('\n## References\n') ? 'Present' : 'Required'}</strong>
              </div>
              <div>
                <span>History</span>
                <strong>Preserved</strong>
              </div>
            </div>
            <div className="field full-span">
              <label htmlFor="blog-title">Title</label>
              <input
                id="blog-title"
                maxLength={200}
                value={draft.title}
                disabled={!active || busy}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              />
            </div>
            <div className="field full-span">
              <label htmlFor="blog-summary">Summary</label>
              <textarea
                id="blog-summary"
                rows={3}
                maxLength={1000}
                value={draft.summary}
                disabled={!active || busy}
                onChange={(event) => setDraft({ ...draft, summary: event.target.value })}
              />
            </div>
            <div className="field full-span">
              <label htmlFor="blog-markdown">Article Markdown</label>
              <textarea
                id="blog-markdown"
                rows={18}
                maxLength={50000}
                value={draft.markdown}
                disabled={!active || busy}
                onChange={(event) => setDraft({ ...draft, markdown: event.target.value })}
              />
            </div>
            <div className="form-actions full-span supporting-actions" aria-label="Supporting Blog actions">
              <button
                className="secondary-button"
                type="button"
                disabled={!active || busy || dirty}
                onClick={() => generate(true)}
              >
                Generate fresh Candidate
              </button>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
