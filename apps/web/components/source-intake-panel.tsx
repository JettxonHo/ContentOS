'use client';

import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';

import type { ContentPackageResource, SourceListItemResource, UrlCaptureIntakeResource } from '@contentos/contracts';

import { WebApiError } from '../lib/api-client';
import type { ContentOsApiClient } from '../lib/api-client';
import {
  intakeFailureCopy,
  reconcileUrlSubmission,
  sourceIntakeView,
  sourceTypeLabel,
  type SourceIntakeRole,
  type UrlSubmissionConfirmation,
} from '../lib/source-intake-view';

type IntakeMode = 'paste' | 'upload' | 'url';
type UrlConfirmationWarning = 'ambiguous' | 'refresh_failed';

interface UrlConfirmationState {
  readonly status: UrlSubmissionConfirmation;
  readonly warning: UrlConfirmationWarning | null;
}

interface Props {
  readonly api: ContentOsApiClient;
  readonly contentPackage: ContentPackageResource;
  readonly sources: readonly SourceListItemResource[] | null;
  readonly intakes: readonly UrlCaptureIntakeResource[] | null;
  readonly busy: boolean;
  readonly stale: boolean;
  readonly onRefresh: () => Promise<readonly UrlCaptureIntakeResource[] | undefined>;
  readonly onTerminal: (cause: unknown) => boolean;
  readonly onReview: (sourceId: string) => void;
  readonly reviewNavigationBlocked: boolean;
}

function defaultRole(view: ReturnType<typeof sourceIntakeView>): SourceIntakeRole {
  return view.primary.available ? 'primary' : 'supporting';
}

export function SourceIntakePanel({
  api,
  contentPackage,
  sources,
  intakes,
  busy,
  stale,
  onRefresh,
  onTerminal,
  onReview,
  reviewNavigationBlocked,
}: Props) {
  const archived = contentPackage.lifecycle === 'archived';
  const view = useMemo(() => sourceIntakeView(archived ? null : sources, intakes ?? []), [archived, sources, intakes]);
  const [mode, setMode] = useState<IntakeMode>('paste');
  const [role, setRole] = useState<SourceIntakeRole>(() => defaultRole(view));
  const [label, setLabel] = useState('');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [urlConfirmation, setUrlConfirmation] = useState<UrlConfirmationState>({ status: 'idle', warning: null });
  const textInput = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const confirmationWarningRef = useRef<HTMLParagraphElement>(null);
  const sourceRefs = useRef(new Map<string, HTMLElement>());

  const hasIntake = view.intake !== null || urlConfirmation.status !== 'idle';
  const roleAvailable = role === 'primary' ? view.primary.available : view.supporting.available;

  useEffect(() => {
    if (intakes === null) return;
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      setUrlConfirmation((current) => ({ status: reconcileUrlSubmission(current.status, intakes), warning: null }));
    });
    return () => {
      active = false;
    };
  }, [intakes]);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  useEffect(() => {
    if (urlConfirmation.warning) confirmationWarningRef.current?.focus();
  }, [urlConfirmation.warning]);

  function chooseMode(next: IntakeMode): void {
    setMode(next);
    setError('');
    setNotice('');
  }

  function selectFallback(next: 'paste' | 'upload'): void {
    if (view.intake?.status !== 'failed') return;
    const fallbackRole = view.intake.role === 'primary' ? view.primary.available : view.supporting.available;
    if (fallbackRole) setRole(view.intake.role);
    chooseMode(next);
    setTimeout(() => (next === 'paste' ? textInput.current?.focus() : fileInput.current?.focus()), 0);
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (archived || submitting || !roleAvailable) return;
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      let createdSourceId: string | null = null;
      if (mode === 'paste') {
        if (text.trim() === '') {
          textInput.current?.focus();
          return;
        }
        const response = await api.createSource(contentPackage.id, {
          sourceType: 'pasted_text',
          role,
          text,
          ...(label.trim() === '' ? {} : { label: label.trim() }),
        });
        createdSourceId = response.data.source.id;
        setText('');
      } else if (mode === 'upload') {
        if (!file) {
          fileInput.current?.focus();
          return;
        }
        const form = new FormData();
        form.append('file', file);
        form.append('role', role);
        if (label.trim() !== '') form.append('label', label.trim());
        const response = await api.uploadSource(contentPackage.id, form);
        createdSourceId = response.data.source.id;
        setFile(null);
        if (fileInput.current) fileInput.current.value = '';
      } else {
        if (hasIntake || url.trim() === '') return;
        setUrlConfirmation({ status: 'confirming', warning: null });
        await api.submitUrlCapture(
          contentPackage.id,
          { expectedPackageRevision: contentPackage.revision, role, submittedUrl: url.trim() },
          crypto.randomUUID(),
        );
        setUrl('');
      }
      setLabel('');
      const refreshed = await onRefresh();
      if (mode === 'url') {
        if (refreshed === undefined) {
          setUrlConfirmation((current) => ({ ...current, warning: 'refresh_failed' }));
          return;
        }
        setUrlConfirmation((current) => ({
          status: reconcileUrlSubmission(current.status, refreshed),
          warning: null,
        }));
      }
      setNotice(mode === 'url' ? 'URL capture is waiting to begin.' : 'Source added to this package.');
      if (createdSourceId) setTimeout(() => sourceRefs.current.get(createdSourceId)?.focus(), 0);
    } catch (cause) {
      if (onTerminal(cause)) return;
      if (cause instanceof WebApiError && cause.code === 'SOURCE_ROLE_LIMIT_EXCEEDED') {
        setError('That Source role is full. Refresh the latest Source status and choose an available role.');
      } else if (mode === 'url' && cause instanceof WebApiError && cause.code === 'NETWORK_ERROR') {
        setUrlConfirmation((current) => ({ ...current, status: 'confirming', warning: 'ambiguous' }));
      } else {
        setError('This Source could not be added. Review the input and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if ((!archived && sources === null) || intakes === null) {
    return (
      <section className="source-intake-panel" aria-labelledby="sources-title" aria-busy="true">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Stage 02</p>
            <h2 id="sources-title">Sources</h2>
          </div>
        </div>
        <p role="status">Loading authoritative Source status…</p>
      </section>
    );
  }

  return (
    <section className="source-intake-panel" aria-labelledby="sources-title" aria-busy={busy || submitting}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Stage 02</p>
          <h2 id="sources-title">Sources</h2>
        </div>
        {archived ? <span className="lifecycle archived">archived</span> : null}
      </div>
      {view.formalSourcesAvailable ? (
        <p className="source-capacity">
          Primary {view.primary.used}/1 · Supporting {view.supporting.used}/5
        </p>
      ) : null}
      {stale ? (
        <div className="field-error" role="status">
          Latest Source status could not be confirmed. Showing the last known state.{' '}
          <button className="inline-button" type="button" onClick={() => void onRefresh()}>
            Reload Source status
          </button>
        </div>
      ) : null}
      {error ? (
        <p className="field-error" role="alert" ref={errorRef} tabIndex={-1}>
          {error}
        </p>
      ) : null}
      {urlConfirmation.warning ? (
        <p className="field-error" role="alert" ref={confirmationWarningRef} tabIndex={-1}>
          {urlConfirmation.warning === 'ambiguous'
            ? 'The URL submission could not be confirmed. Refresh the latest intake status before trying anything else.'
            : 'URL submission needs confirmation. Reload Source status before another attempt.'}
        </p>
      ) : null}
      {notice ? (
        <p className="save-notice" role="status">
          {notice}
        </p>
      ) : null}

      <div className="source-card-list" aria-label="Formal Sources">
        {view.formalSourcesAvailable && view.visibleSources.length === 0 && !view.intake ? (
          <p>No formal Sources yet. Add a Source to begin.</p>
        ) : null}
        {view.visibleSources.map((source) => (
          <article
            className="source-card"
            key={source.id}
            tabIndex={-1}
            ref={(element) => {
              if (element) sourceRefs.current.set(source.id, element);
              else sourceRefs.current.delete(source.id);
            }}
          >
            <div>
              <strong>{source.label ?? sourceTypeLabel(source)}</strong>
              <small>
                {sourceTypeLabel(source)} · {source.role}
              </small>
            </div>
            <time dateTime={source.createdAt}>{new Date(source.createdAt).toLocaleString()}</time>
            {!archived ? (
              <button
                className="secondary-button source-review-button"
                type="button"
                aria-label={`Review Source ${source.label ?? sourceTypeLabel(source)}`}
                disabled={reviewNavigationBlocked}
                onClick={() => onReview(source.id)}
              >
                Review Source
              </button>
            ) : null}
          </article>
        ))}
        {view.showIntakeActivity ? (
          <IntakeActivity intake={view.intake} archived={archived} onFallback={selectFallback} />
        ) : null}
      </div>

      {!archived ? (
        <form className="source-composer" onSubmit={(event) => void submit(event)}>
          <fieldset disabled={submitting}>
            <legend>Add a Source</legend>
            <div className="source-mode-actions">
              {(['paste', 'upload', 'url'] as const).map((candidate) => (
                <button
                  key={candidate}
                  className="secondary-button"
                  type="button"
                  aria-pressed={mode === candidate}
                  onClick={() => chooseMode(candidate)}
                  disabled={candidate === 'url' && hasIntake}
                >
                  {candidate === 'paste' ? 'Paste text' : candidate === 'upload' ? 'Upload file' : 'Public URL'}
                </button>
              ))}
            </div>
            {hasIntake ? (
              <p className="help-text">
                This package already has a URL capture record. URL replacement and retry are not available here.
              </p>
            ) : null}
            {urlConfirmation.status === 'confirming' ? (
              <button
                className="inline-button"
                type="button"
                onClick={() => {
                  void onRefresh().then((refreshed) => {
                    if (refreshed !== undefined) {
                      setUrlConfirmation((current) => ({
                        status: reconcileUrlSubmission(current.status, refreshed),
                        warning: null,
                      }));
                    }
                  });
                }}
              >
                Reload Source status
              </button>
            ) : null}
            <fieldset className="role-fieldset">
              <legend>Source role</legend>
              <label>
                <input
                  type="radio"
                  name="source-role"
                  checked={role === 'primary'}
                  onChange={() => setRole('primary')}
                  disabled={!view.primary.available}
                />{' '}
                Primary ({view.primary.used}/1)
              </label>
              <label>
                <input
                  type="radio"
                  name="source-role"
                  checked={role === 'supporting'}
                  onChange={() => setRole('supporting')}
                  disabled={!view.supporting.available}
                />{' '}
                Supporting ({view.supporting.used}/5)
              </label>
            </fieldset>
            {!roleAvailable ? <p className="help-text">Choose a role with available capacity.</p> : null}
            {mode !== 'url' ? (
              <label className="field">
                Label <span>Optional</span>
                <input value={label} maxLength={200} onChange={(event) => setLabel(event.target.value)} />
              </label>
            ) : null}
            {mode === 'paste' ? (
              <label className="field">
                Pasted text
                <textarea
                  ref={textInput}
                  value={text}
                  maxLength={100000}
                  rows={7}
                  onChange={(event) => setText(event.target.value)}
                  required
                />
              </label>
            ) : null}
            {mode === 'upload' ? (
              <label className="field">
                Upload a Markdown or text file
                <input
                  ref={fileInput}
                  type="file"
                  accept=".md,.txt,text/markdown,text/plain"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  required
                />
                <span>.md and .txt files only</span>
              </label>
            ) : null}
            {mode === 'url' ? (
              <label className="field">
                Public URL
                <input
                  type="url"
                  value={url}
                  maxLength={2048}
                  onChange={(event) => setUrl(event.target.value)}
                  required
                />
                <span>The URL stays private to this owner.</span>
              </label>
            ) : null}
            <div className="form-actions">
              <button
                className="primary-button"
                type="submit"
                disabled={submitting || !roleAvailable || (mode === 'url' && hasIntake)}
              >
                {submitting ? 'Adding…' : mode === 'url' ? 'Capture URL' : 'Add Source'}
              </button>
            </div>
          </fieldset>
        </form>
      ) : (
        <p className="archived-note">This package is archived. Source intake is unavailable.</p>
      )}
    </section>
  );
}

function IntakeActivity({
  intake,
  archived,
  onFallback,
}: {
  readonly intake: UrlCaptureIntakeResource | null;
  readonly archived: boolean;
  readonly onFallback: (mode: 'paste' | 'upload') => void;
}) {
  if (!intake) return null;
  const status =
    intake.status === 'queued'
      ? 'Waiting to capture'
      : intake.status === 'running'
        ? 'Capturing'
        : intake.status === 'succeeded'
          ? 'Captured'
          : 'Capture failed';
  return (
    <article className="source-card intake-activity" role="status" aria-live="polite">
      <div>
        <strong>{status}</strong>
        <small>{intake.submittedUrl}</small>
        {intake.status === 'failed' ? <p>{intakeFailureCopy(intake)}</p> : null}
      </div>
      {intake.status === 'failed' && !archived ? (
        <div className="fallback-actions">
          <button className="secondary-button" type="button" onClick={() => onFallback('paste')}>
            Use pasted text instead
          </button>
          <button className="secondary-button" type="button" onClick={() => onFallback('upload')}>
            Upload a file instead
          </button>
        </div>
      ) : null}
    </article>
  );
}
