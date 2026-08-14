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
import { formatZhDate } from '../lib/ui-copy';
import { useWorkspacePrimaryAction } from './workspace-action-context';

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
  if (!(cause instanceof WebApiError)) return '无法更新该资料，请重试。';
  switch (cause.code) {
    case 'SOURCE_REVISION_CONFLICT':
      return '已有更新的权威草稿。你的草稿已保留，请明确重新加载后再继续。';
    case 'SOURCE_VERSION_ALREADY_EXISTS':
      return '该精确修订已保存为版本，最新权威版本状态已刷新。';
    case 'SOURCE_VERSION_NOT_ELIGIBLE':
    case 'SOURCE_ALREADY_APPROVED':
      return '该版本已不能批准，当前权威头部已刷新。';
    case 'SOURCE_VERSION_NOT_FOUND':
      return '该版本不可用，版本历史已刷新。';
    default:
      return '无法更新该资料，请重试。';
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
  const approvalOpenerRef = useRef<HTMLElement | null>(null);
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
      setError('无法加载该资料，请重新加载权威资料状态。');
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
        requestAnimationFrame(() => approvalOpenerRef.current?.focus());
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
      if (loaded && requestFence.current.isCurrent(token) && discard) setNotice('未保存草稿已放弃。');
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
    setNotice('未保存草稿已放弃。');
  };

  const close = (): void => {
    if (view?.dirty) {
      setError('关闭资料审核前，请先放弃未保存的草稿。');
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
      setNotice(`当前草稿修订 ${workingCopy.revision} 已保存。`);
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
      setNotice(`已根据保存的草稿创建版本 ${created.data.version.versionNumber}。`);
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
    requestAnimationFrame(() => approvalOpenerRef.current?.focus());
  };

  const openConfirmation = (version: SourceVersionDetailResource): void => {
    approvalOpenerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setConfirmingVersion(version);
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
      setNotice(`版本 ${versionToApprove.versionNumber} 已成为当前批准版本。`);
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

  const selectedView =
    state && selectedVersion
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
  const reviewAction =
    !state || !view
      ? null
      : revisionConflict
        ? {
            label: '重新加载权威草稿',
            reason: '保存时发现版本冲突；本地草稿已保留，请明确重新加载后再继续。',
            disabled: false,
            busy,
            onAction: () => void reloadAuthoritative(),
          }
        : view.canSaveWorkingCopy
          ? {
              label: '保存当前草稿',
              reason: '当前资料草稿包含尚未保存的修改。',
              disabled: false,
              busy,
              onAction: () => void save(),
            }
          : view.canCreateVersion
            ? {
                label: '保存为版本',
                reason: '当前草稿已保存，请创建精确不可变版本。',
                disabled: false,
                busy,
                onAction: () => void createVersion(),
              }
            : selectedVersion && selectedView?.canApproveVersion
              ? {
                  label: `批准版本 ${selectedVersion.versionNumber}`,
                  reason: '当前选中的不可变版本可由你精确批准。',
                  disabled: false,
                  busy,
                  onAction: () => openConfirmation(selectedVersion),
                }
              : {
                  label: state.source.reviewCandidateVersionId ? '选择待审核版本' : '资料审核已完成',
                  reason: state.source.reviewCandidateVersionId
                    ? '在版本历史中选择待审核版本，再执行批准。'
                    : '当前资料没有待处理的草稿或版本。',
                  disabled: true,
                  busy,
                  onAction: () => undefined,
                };
  useWorkspacePrimaryAction(reviewAction);

  if (!state || !view) {
    return (
      <section className="source-review-panel" aria-busy={!initialLoadFailed} aria-label="资料审核">
        {initialLoadFailed ? (
          <>
            <p className="field-error" role="alert" tabIndex={-1} ref={errorRef}>
              {error}
            </p>
            <button className="secondary-button" type="button" onClick={retryInitialLoad}>
              重试资料审核
            </button>
          </>
        ) : (
          <p role="status">正在加载资料审核…</p>
        )}
      </section>
    );
  }

  return (
    <section className="source-review-panel" aria-labelledby="source-review-title" aria-busy={busy}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">资料审核</p>
          <h2 id="source-review-title">{state.source.label ?? '资料审核'}</h2>
        </div>
        <button aria-label="关闭审核" className="text-button" type="button" onClick={close} disabled={busy}>
          关闭审核
        </button>
      </div>
      {view.dirty ? <p className="help-text">审核其他资料或离开此阶段前，请先保存或放弃当前草稿。</p> : null}
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
        规范化当前草稿 · 修订 {state.workingCopy.revision} {view.dirty ? '（有未保存更改）' : '（已保存）'}
        <textarea
          aria-label={`当前草稿修订 ${state.workingCopy.revision}`}
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
          className="secondary-button"
          type="button"
          aria-label="提交资料草稿修改"
          onClick={() => void save()}
          disabled={!view.canSaveWorkingCopy}
        >
          保存当前草稿
        </button>
        <button className="secondary-button" type="button" onClick={discardDraft} disabled={busy || !view.dirty}>
          放弃草稿
        </button>
        <button
          className="secondary-button"
          type="button"
          aria-label="审核区重新加载权威草稿"
          onClick={() => void reloadAuthoritative()}
          disabled={busy}
        >
          重新加载权威草稿
        </button>
      </div>
      <div className="version-heading">
        <h3>不可变版本</h3>
        <button
          className="secondary-button"
          type="button"
          aria-label="创建不可变资料版本"
          disabled={!view.canCreateVersion}
          onClick={() => void createVersion()}
        >
          保存为版本
        </button>
      </div>
      <p className="help-text">
        {state.workingCopy.revision === state.workingCopy.checkpointedRevision
          ? '当前保存的修订已存在对应不可变版本。'
          : '根据已保存修订创建不可变版本。'}
      </p>
      <div className="version-list" aria-label="不可变版本历史">
        {state.versions.length === 0 ? <p>暂无不可变版本。</p> : null}
        {state.versions.map((version) => (
          <button
            className="version-row"
            type="button"
            aria-label={`版本 ${version.versionNumber}`}
            key={version.id}
            disabled={busy}
            aria-pressed={selectedVersion?.id === version.id}
            onClick={() => void selectVersion(version)}
          >
            版本 {version.versionNumber}
            <time dateTime={version.createdAt}>{formatZhDate(version.createdAt)}</time>
          </button>
        ))}
      </div>
      {selectedVersion && selectedView ? (
        <article className="version-detail" aria-label={`版本 ${selectedVersion.versionNumber} 不可变审核`}>
          <div className="version-heading">
            <h3>版本 {selectedVersion.versionNumber}</h3>
            <div>
              {selectedView.badges.map((badge) => (
                <span className="head-badge" key={badge}>
                  {badge === 'Latest' ? '最新' : badge === 'Review candidate' ? '待审核候选' : '当前批准'}
                </span>
              ))}
            </div>
          </div>
          <p className="help-text">不可变纯文本正文</p>
          <pre>{selectedVersion.body.text}</pre>
          {selectedView.canApproveVersion ? (
            <button
              className="secondary-button"
              type="button"
              aria-label={`审核区确认版本 ${selectedVersion.versionNumber}`}
              onClick={() => openConfirmation(selectedVersion)}
            >
              批准版本 {selectedVersion.versionNumber}
            </button>
          ) : null}
        </article>
      ) : null}
      {confirmingVersion ? (
        <div className="dialog-backdrop" role="presentation">
          <section
            className="confirmation-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={`批准版本 ${confirmingVersion.versionNumber}？`}
          >
            <h3 id="approval-title">批准版本 {confirmingVersion.versionNumber}？</h3>
            <p>该精确不可变版本将可用于后续研究。</p>
            <div className="form-actions">
              <button
                className="secondary-button"
                type="button"
                disabled={busy}
                ref={approvalCancelRef}
                onClick={closeConfirmation}
              >
                取消
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={busy}
                ref={approvalConfirmRef}
                onClick={() => void approve()}
              >
                确认批准
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
