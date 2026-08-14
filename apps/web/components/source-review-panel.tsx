'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type {
  SourceResource,
  SourceVersionDetailResource,
  SourceVersionResource,
  SourceWorkingCopyResource,
} from '@contentos/contracts';

import { WebApiError, type ContentOsApiClient } from '../lib/api-client';
import {
  SourceReviewRecoveryGate,
  SourceReviewRequestFence,
  sourceReviewRefreshDraft,
  sourceReviewView,
} from '../lib/source-review-view';

interface ReviewState {
  readonly source: SourceResource;
  readonly workingCopy: SourceWorkingCopyResource;
  readonly versions: readonly SourceVersionResource[];
}

interface RecoveryDraftContext {
  readonly baselineAtRefreshStart: string;
  readonly dirtyAtRefreshStart: boolean;
}

interface Props {
  readonly api: ContentOsApiClient;
  readonly contentPackageId: string;
  readonly sourceId: string;
  readonly refreshSignal: number;
  readonly onClose: () => void;
  readonly onDirtyChange: (dirty: boolean) => void;
  readonly onBusyChange: (busy: boolean) => void;
  readonly onUnavailable: (cause: unknown) => boolean;
  readonly onSourceUnavailable: () => void;
  readonly onStatusChange: () => void;
}

function safeError(cause: unknown): string {
  if (!(cause instanceof WebApiError)) return 'This Source could not be updated. Try again.';
  switch (cause.code) {
    case 'SOURCE_REVISION_CONFLICT':
      return 'A newer authoritative Working Copy exists. Your draft is preserved; reload it explicitly before continuing.';
    case 'SOURCE_VERSION_ALREADY_EXISTS':
      return 'This exact revision was already checkpointed. The latest authoritative Version state was refreshed.';
    case 'SOURCE_VERSION_NOT_ELIGIBLE':
    case 'SOURCE_ALREADY_APPROVED':
      return 'This Version is no longer approvable. The current authoritative Head was refreshed.';
    case 'SOURCE_VERSION_NOT_FOUND':
      return 'This Version is unavailable. The Version history was refreshed.';
    default:
      return 'This Source could not be updated. Try again.';
  }
}

export function SourceReviewPanel({
  api,
  contentPackageId,
  sourceId,
  refreshSignal,
  onClose,
  onDirtyChange,
  onBusyChange,
  onUnavailable,
  onSourceUnavailable,
  onStatusChange,
}: Props) {
  const [state, setState] = useState<ReviewState | null>(null);
  const [draft, setDraft] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<SourceVersionDetailResource | null>(null);
  const [busy, setBusy] = useState(false);
  const [initialLoadFailed, setInitialLoadFailed] = useState(false);
  const [revisionConflict, setRevisionConflict] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmingVersion, setConfirmingVersion] = useState<SourceVersionDetailResource | null>(null);
  const requestFence = useRef(new SourceReviewRequestFence());
  const recoveryGate = useRef(new SourceReviewRecoveryGate());
  const stateRef = useRef<ReviewState | null>(null);
  const draftRef = useRef('');
  const errorRef = useRef<HTMLParagraphElement>(null);
  const approvalTriggerRef = useRef<HTMLButtonElement>(null);
  const approvalCancelRef = useRef<HTMLButtonElement>(null);
  const approvalConfirmRef = useRef<HTMLButtonElement>(null);

  const view = useMemo(
    () =>
      state
        ? sourceReviewView({
            revision: state.workingCopy.revision,
            checkpointedRevision: state.workingCopy.checkpointedRevision,
            text: state.workingCopy.body.text,
            draft,
            busy,
            revisionConflict,
          })
        : null,
    [busy, draft, revisionConflict, state],
  );

  const load = async (recoveryDraft: RecoveryDraftContext | null = null): Promise<boolean> => {
    const token = requestFence.current.beginLoad();
    try {
      const [sourceResponse, workingCopyResponse, versionResponse] = await Promise.all([
        api.getSource(contentPackageId, sourceId),
        api.getWorkingCopy(contentPackageId, sourceId),
        api.listVersions(contentPackageId, sourceId),
      ]);
      if (!requestFence.current.isLatestLoad(token)) return false;
      const next: ReviewState = {
        source: sourceResponse.data.source,
        workingCopy: workingCopyResponse.data.workingCopy,
        versions: versionResponse.data.items,
      };
      const nextDraft = recoveryDraft
        ? sourceReviewRefreshDraft({
            draft: draftRef.current,
            baselineAtRefreshStart: recoveryDraft.baselineAtRefreshStart,
            incomingText: next.workingCopy.body.text,
            dirtyAtRefreshStart: recoveryDraft.dirtyAtRefreshStart,
          })
        : next.workingCopy.body.text;
      stateRef.current = next;
      draftRef.current = nextDraft;
      setState(next);
      setDraft(nextDraft);
      if (!recoveryDraft?.dirtyAtRefreshStart) setRevisionConflict(false);
      setInitialLoadFailed(false);
      setError('');
      return true;
    } catch (cause) {
      if (!requestFence.current.isLatestLoad(token)) return false;
      if (onUnavailable(cause)) return false;
      if (cause instanceof WebApiError && cause.code === 'SOURCE_NOT_FOUND') {
        onSourceUnavailable();
        return false;
      }
      if (!state) setInitialLoadFailed(true);
      setError('This Source could not be loaded. Reload the authoritative Source status.');
      return false;
    }
  };

  const startRecovery = (): void => {
    const currentState = stateRef.current;
    if (!currentState) return;
    void load({
      baselineAtRefreshStart: currentState.workingCopy.body.text,
      dirtyAtRefreshStart: currentState.workingCopy.body.text !== draftRef.current,
    });
  };

  useEffect(() => {
    const fence = requestFence.current;
    fence.beginSession();
    recoveryGate.current.beginSession(refreshSignal);
    const token = fence.capture();
    stateRef.current = null;
    draftRef.current = '';
    void Promise.resolve().then(() => {
      if (!requestFence.current.isCurrent(token)) return;
      setState(null);
      setDraft('');
      setSelectedVersion(null);
      setInitialLoadFailed(false);
      setRevisionConflict(false);
      setError('');
      setNotice('');
      return load();
    });
    return () => {
      fence.dispose();
      onDirtyChange(false);
      onBusyChange(false);
    };
    // One opaque Source identity owns every continuation in this review session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentPackageId, sourceId]);

  useEffect(() => {
    onDirtyChange(view?.dirty ?? false);
  }, [onDirtyChange, view?.dirty]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent): void => {
      if (!view?.dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [view?.dirty]);

  useEffect(() => {
    if (!stateRef.current || !recoveryGate.current.requestRefresh(refreshSignal)) return;
    startRecovery();
    // Recovery adopts authoritative text only if the clean starting baseline is still untouched.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  useEffect(() => {
    if (!error) return;
    errorRef.current?.focus();
  }, [error]);

  useEffect(() => {
    if (!confirmingVersion) return;
    approvalCancelRef.current?.focus();
    const handleDialogKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !busy) {
        event.preventDefault();
        setConfirmingVersion(null);
        requestAnimationFrame(() => approvalTriggerRef.current?.focus());
        return;
      }
      if (event.key !== 'Tab') return;
      const first = approvalCancelRef.current;
      const last = approvalConfirmRef.current;
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleDialogKey);
    return () => document.removeEventListener('keydown', handleDialogKey);
  }, [busy, confirmingVersion]);

  const beginCommand = (invalidateLoads = true) => {
    if (!recoveryGate.current.beginCommand()) return null;
    if (invalidateLoads) requestFence.current.invalidateLoads();
    const token = requestFence.current.capture();
    setBusy(true);
    onBusyChange(true);
    return token;
  };

  const endCommand = (token: ReturnType<SourceReviewRequestFence['capture']>): void => {
    if (!requestFence.current.isCurrent(token)) return;
    const recoverDeferredSignal = recoveryGate.current.endCommand();
    setBusy(false);
    onBusyChange(false);
    if (recoverDeferredSignal) startRecovery();
  };

  const retryInitialLoad = (): void => {
    setInitialLoadFailed(false);
    setError('');
    void load();
  };

  const reloadAuthoritative = async (discard = false): Promise<void> => {
    const token = beginCommand(false);
    if (!token) return;
    setSelectedVersion(null);
    setNotice('');
    try {
      const loaded = await load();
      if (loaded && requestFence.current.isCurrent(token) && discard) setNotice('Unsaved draft discarded.');
    } finally {
      endCommand(token);
    }
  };

  const discardDraft = (): void => {
    if (!state || busy) return;
    if (revisionConflict) {
      void reloadAuthoritative(true);
      return;
    }
    draftRef.current = state.workingCopy.body.text;
    setDraft(state.workingCopy.body.text);
    setError('');
    setNotice('Unsaved draft discarded.');
  };

  const close = (): void => {
    if (view?.dirty) {
      setError('Discard the unsaved draft before closing this Source review.');
      return;
    }
    onClose();
  };

  const save = async (): Promise<void> => {
    if (!state || !view?.canSaveWorkingCopy) return;
    const token = beginCommand();
    if (!token) return;
    setError('');
    setNotice('');
    try {
      const response = await api.editWorkingCopy(contentPackageId, sourceId, {
        expectedRevision: state.workingCopy.revision,
        body: { text: draft },
      });
      if (!requestFence.current.commitMutation(token)) return;
      const workingCopy = response.data.workingCopy;
      const currentState = stateRef.current;
      if (!currentState) return;
      const nextState = { ...currentState, workingCopy };
      stateRef.current = nextState;
      draftRef.current = workingCopy.body.text;
      setState(nextState);
      setDraft(workingCopy.body.text);
      setRevisionConflict(false);
      setNotice(`Working Copy revision ${workingCopy.revision} saved.`);
      onStatusChange();
    } catch (cause) {
      if (!requestFence.current.isCurrent(token) || onUnavailable(cause)) return;
      if (cause instanceof WebApiError && cause.code === 'SOURCE_NOT_FOUND') {
        onSourceUnavailable();
        return;
      }
      if (cause instanceof WebApiError && cause.code === 'SOURCE_REVISION_CONFLICT') setRevisionConflict(true);
      setError(safeError(cause));
    } finally {
      endCommand(token);
    }
  };

  const selectVersion = async (version: SourceVersionResource): Promise<void> => {
    if (!state || busy) return;
    const token = beginCommand(false);
    if (!token) return;
    setError('');
    try {
      const response = await api.getVersion(contentPackageId, sourceId, version.id);
      if (!requestFence.current.isCurrent(token)) return;
      setSelectedVersion(response.data.version);
    } catch (cause) {
      if (!requestFence.current.isCurrent(token) || onUnavailable(cause)) return;
      if (cause instanceof WebApiError && cause.code === 'SOURCE_NOT_FOUND') {
        onSourceUnavailable();
        return;
      }
      setSelectedVersion(null);
      const message = safeError(cause);
      if (cause instanceof WebApiError && cause.code === 'SOURCE_VERSION_NOT_FOUND') {
        await load({
          baselineAtRefreshStart: state.workingCopy.body.text,
          dirtyAtRefreshStart: state.workingCopy.body.text !== draft,
        });
      }
      if (requestFence.current.isCurrent(token)) setError(message);
    } finally {
      endCommand(token);
    }
  };

  const createVersion = async (): Promise<void> => {
    if (!state || !view?.canCreateVersion) return;
    const token = beginCommand();
    if (!token) return;
    setError('');
    setNotice('');
    try {
      const created = await api.createVersion(contentPackageId, sourceId, {
        expectedRevision: state.workingCopy.revision,
      });
      if (!requestFence.current.commitMutation(token) || !(await load())) return;
      const detail = await api.getVersion(contentPackageId, sourceId, created.data.version.id);
      if (!requestFence.current.isCurrent(token)) return;
      setSelectedVersion(detail.data.version);
      setNotice(`Version ${created.data.version.versionNumber} created from the saved Working Copy.`);
      onStatusChange();
    } catch (cause) {
      if (!requestFence.current.isCurrent(token) || onUnavailable(cause)) return;
      if (cause instanceof WebApiError && cause.code === 'SOURCE_NOT_FOUND') {
        onSourceUnavailable();
        return;
      }
      const message = safeError(cause);
      if (cause instanceof WebApiError && cause.code === 'SOURCE_VERSION_ALREADY_EXISTS') await load();
      if (requestFence.current.isCurrent(token)) setError(message);
    } finally {
      endCommand(token);
    }
  };

  const closeConfirmation = (): void => {
    setConfirmingVersion(null);
    requestAnimationFrame(() => approvalTriggerRef.current?.focus());
  };

  const approve = async (): Promise<void> => {
    if (!state || !confirmingVersion || !view || busy) return;
    const versionToApprove = confirmingVersion;
    const approvalView = sourceReviewView({
      revision: state.workingCopy.revision,
      checkpointedRevision: state.workingCopy.checkpointedRevision,
      text: state.workingCopy.body.text,
      draft,
      busy,
      revisionConflict,
      versionId: versionToApprove.id,
      head: state.source,
    });
    if (!approvalView.canApproveVersion) return;
    const token = beginCommand();
    if (!token) return;
    setError('');
    try {
      await api.approveVersion(contentPackageId, sourceId, { versionId: versionToApprove.id });
      if (!requestFence.current.commitMutation(token) || !(await load())) return;
      setNotice(`Version ${versionToApprove.versionNumber} is now the current approved Version.`);
      setConfirmingVersion(null);
      onStatusChange();
    } catch (cause) {
      if (!requestFence.current.isCurrent(token) || onUnavailable(cause)) return;
      if (cause instanceof WebApiError && cause.code === 'SOURCE_NOT_FOUND') {
        onSourceUnavailable();
        return;
      }
      setConfirmingVersion(null);
      const message = safeError(cause);
      if (
        cause instanceof WebApiError &&
        ['SOURCE_VERSION_NOT_ELIGIBLE', 'SOURCE_ALREADY_APPROVED'].includes(cause.code)
      ) {
        await load();
      }
      if (requestFence.current.isCurrent(token)) setError(message);
    } finally {
      endCommand(token);
    }
  };

  if (!state || !view) {
    return (
      <section className="source-review-panel" aria-busy={!initialLoadFailed} aria-label="Source review">
        {initialLoadFailed ? (
          <>
            <p className="field-error" role="alert" tabIndex={-1} ref={errorRef}>
              {error}
            </p>
            <button className="secondary-button" type="button" onClick={retryInitialLoad}>
              Retry Source review
            </button>
          </>
        ) : (
          <p role="status">Loading Source review…</p>
        )}
      </section>
    );
  }

  const selectedView = selectedVersion
    ? sourceReviewView({
        revision: state.workingCopy.revision,
        checkpointedRevision: state.workingCopy.checkpointedRevision,
        text: state.workingCopy.body.text,
        draft,
        busy,
        revisionConflict,
        versionId: selectedVersion.id,
        head: state.source,
      })
    : null;

  return (
    <section className="source-review-panel" aria-labelledby="source-review-title" aria-busy={busy}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Source review</p>
          <h2 id="source-review-title">{state.source.label ?? 'Source review'}</h2>
        </div>
        <button className="text-button" type="button" onClick={close} disabled={busy}>
          Close review
        </button>
      </div>
      {view.dirty ? (
        <p className="help-text">Save or discard this draft before reviewing another Source or leaving Sources.</p>
      ) : null}
      {error ? (
        <p className="field-error" role="alert" tabIndex={-1} ref={errorRef}>
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="save-notice" role="status">
          {notice}
        </p>
      ) : null}
      <label className="field">
        Normalized Working Copy · revision {state.workingCopy.revision} {view.dirty ? '(unsaved changes)' : '(saved)'}
        <textarea
          value={draft}
          rows={10}
          maxLength={100000}
          onChange={(event) => {
            draftRef.current = event.target.value;
            setDraft(event.target.value);
          }}
          disabled={busy}
        />
      </label>
      <div className="form-actions review-actions">
        <button
          className="primary-button"
          type="button"
          onClick={() => void save()}
          disabled={!view.canSaveWorkingCopy}
        >
          Save Working Copy
        </button>
        <button className="secondary-button" type="button" onClick={discardDraft} disabled={busy || !view.dirty}>
          Discard draft
        </button>
        <button className="secondary-button" type="button" onClick={() => void reloadAuthoritative()} disabled={busy}>
          Reload authoritative copy
        </button>
      </div>
      <div className="version-heading">
        <h3>Immutable Versions</h3>
        <button
          className="secondary-button"
          type="button"
          disabled={!view.canCreateVersion}
          onClick={() => void createVersion()}
        >
          Create Version
        </button>
      </div>
      <p className="help-text">
        {state.workingCopy.revision === state.workingCopy.checkpointedRevision
          ? 'This saved revision is already checkpointed.'
          : 'Create a Version from this saved revision.'}
      </p>
      <div className="version-list" aria-label="Immutable Version history">
        {state.versions.length === 0 ? <p>No immutable Versions yet.</p> : null}
        {state.versions.map((version) => (
          <button
            className="version-row"
            type="button"
            key={version.id}
            disabled={busy}
            aria-pressed={selectedVersion?.id === version.id}
            onClick={() => void selectVersion(version)}
          >
            Version {version.versionNumber}
            <time dateTime={version.createdAt}>{new Date(version.createdAt).toLocaleString()}</time>
          </button>
        ))}
      </div>
      {selectedVersion && selectedView ? (
        <article className="version-detail" aria-label={`Version ${selectedVersion.versionNumber} immutable review`}>
          <div className="version-heading">
            <h3>Version {selectedVersion.versionNumber}</h3>
            <div>
              {selectedView.badges.map((badge) => (
                <span className="head-badge" key={badge}>
                  {badge}
                </span>
              ))}
            </div>
          </div>
          <p className="help-text">Immutable plain-text body</p>
          <pre>{selectedVersion.body.text}</pre>
          {selectedView.canApproveVersion ? (
            <button
              className="primary-button"
              type="button"
              ref={approvalTriggerRef}
              onClick={() => setConfirmingVersion(selectedVersion)}
            >
              Approve Version {selectedVersion.versionNumber}
            </button>
          ) : null}
        </article>
      ) : null}
      {confirmingVersion ? (
        <div className="dialog-backdrop" role="presentation">
          <section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="approval-title">
            <h3 id="approval-title">Approve Version {confirmingVersion.versionNumber}?</h3>
            <p>This exact immutable Version will become eligible for future Research.</p>
            <div className="form-actions">
              <button
                className="secondary-button"
                type="button"
                disabled={busy}
                ref={approvalCancelRef}
                onClick={closeConfirmation}
              >
                Cancel
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={busy}
                ref={approvalConfirmRef}
                onClick={() => void approve()}
              >
                Confirm approval
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
