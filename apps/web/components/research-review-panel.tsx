'use client';

import { useEffect, useMemo, useState } from 'react';

import type { ResearchBodyDto, ResearchResource, ResearchReviewStateDto } from '@contentos/contracts';

import { WebApiError, type ContentOsApiClient } from '../lib/api-client';
import {
  candidatePresentationStatus,
  deriveCandidateAction,
  workspaceStageStatusLabel,
} from '../lib/workspace-stage-view';
import { StatusMessage } from './app-shell';
import { RESEARCH_REVIEW_LABEL } from '../lib/ui-copy';
import { useWorkspacePrimaryAction } from './workspace-action-context';

interface Props {
  readonly api: ContentOsApiClient;
  readonly contentPackageId: string;
  readonly active: boolean;
  readonly onDirtyChange: (dirty: boolean) => void;
  readonly onBusyChange: (busy: boolean) => void;
  readonly onUnauthenticated: () => void;
  readonly onStatusChange: () => void;
}

function cloneBody(body: ResearchBodyDto): ResearchBodyDto {
  return JSON.parse(JSON.stringify(body)) as ResearchBodyDto;
}

function message(cause: unknown): string {
  if (!(cause instanceof WebApiError)) return '无法更新研究，请重试。';
  switch (cause.code) {
    case 'APPROVED_SOURCE_REQUIRED':
      return '生成研究前，请先批准一份主资料。';
    case 'RESEARCH_REVISION_CONFLICT':
      return '已有更新的研究草稿，请重新加载后再保存。';
    case 'RESEARCH_VERSION_NOT_ELIGIBLE':
      return '请审核每个条目，至少保留一条有证据的可用内容，并确保资料版本已固定。';
    case 'RESEARCH_PROVIDER_OUTPUT_INVALID':
      return '生成的研究未通过确定性校验，未创建研究版本。';
    default:
      return '无法更新研究，请重试。';
  }
}

export function ResearchReviewPanel({
  api,
  contentPackageId,
  active,
  onDirtyChange,
  onBusyChange,
  onUnauthenticated,
  onStatusChange,
}: Props) {
  const [state, setState] = useState<ResearchResource | null>(null);
  const [draft, setDraft] = useState<ResearchBodyDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const dirty = useMemo(
    () => state !== null && draft !== null && JSON.stringify(state.workingCopy.body) !== JSON.stringify(draft),
    [draft, state],
  );

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  useEffect(() => onBusyChange(busy), [busy, onBusyChange]);

  const apply = (next: ResearchResource): void => {
    setState(next);
    setDraft(cloneBody(next.workingCopy.body));
    setError('');
  };

  const load = async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      apply((await api.getResearch(contentPackageId)).data.research);
    } catch (cause) {
      if (cause instanceof WebApiError && cause.status === 401) onUnauthenticated();
      else if (cause instanceof WebApiError && cause.code === 'RESEARCH_NOT_FOUND') {
        setState(null);
        setDraft(null);
      } else setError('无法加载研究状态。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let current = true;
    void Promise.resolve().then(() => {
      if (!current) return;
      return load();
    });
    return () => {
      current = false;
      onDirtyChange(false);
      onBusyChange(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentPackageId]);

  const command = async (run: () => Promise<ResearchResource>, success: string): Promise<void> => {
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
      else setError(message(cause));
    } finally {
      setBusy(false);
    }
  };

  const setItem = (index: number, update: Partial<ResearchBodyDto['items'][number]>): void => {
    if (!draft) return;
    setDraft({
      ...draft,
      items: draft.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...update } : item)),
    });
  };

  const action = deriveCandidateAction({ resource: state, dirty, active, busy, noun: 'Research' });
  const presentationStatus = candidatePresentationStatus(state, dirty);
  const runNextAction = (): void => {
    if (action.disabled || action.id === 'complete') return;
    if (action.id === 'generate' || action.id === 'refresh') {
      void command(
        async () => (await api.generateResearch(contentPackageId, { requestId: crypto.randomUUID() })).data.research,
        action.id === 'refresh' ? '已根据当前已批准资料生成新版研究候选。' : '研究候选已生成，请在批准前审核每个条目。',
      );
      return;
    }
    if (!state || !draft) return;
    if (action.id === 'save') {
      void command(
        async () =>
          (
            await api.editResearch(contentPackageId, {
              expectedRevision: state.workingCopy.revision,
              body: draft,
            })
          ).data.research,
        '研究草稿已保存。',
      );
    } else if (action.id === 'checkpoint') {
      void command(
        async () =>
          (await api.checkpointResearch(contentPackageId, { expectedRevision: state.workingCopy.revision })).data
            .research,
        '已保存不可变研究版本。',
      );
    } else if (action.id === 'approve') {
      void command(
        async () => (await api.approveResearch(contentPackageId, { versionId: state.latestVersion.id })).data.research,
        '已批准精确研究版本。',
      );
    }
  };

  useWorkspacePrimaryAction(
    loading
      ? null
      : {
          label: action.label,
          reason: action.reason,
          disabled: action.disabled || action.id === 'complete',
          busy,
          onAction: runNextAction,
        },
  );

  if (loading) return <p role="status">正在加载研究…</p>;

  return (
    <section className="research-panel" aria-labelledby="research-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">阶段 03</p>
          <h2 id="research-title">审核有证据支撑的研究</h2>
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
            ? '已批准资料发生变化，当前研究候选需更新；请生成新版候选。'
            : '旧的已批准研究需更新，请审核并批准当前候选。'}
        </StatusMessage>
      ) : null}
      {state?.approvedVersionId && dirty ? (
        <StatusMessage>已批准版本保持不可变；当前草稿的新修改尚未保存。</StatusMessage>
      ) : null}
      {!state || !draft ? (
        <div className="empty-state">
          <h3>暂无研究</h3>
          <p>根据当前精确的已批准资料生成确定性候选。</p>
        </div>
      ) : (
        <div className="form-grid">
          <div className="field full-span">
            <label htmlFor="research-summary">研究摘要</label>
            <textarea
              id="research-summary"
              rows={5}
              maxLength={10_000}
              value={draft.summary}
              disabled={!active || busy}
              onChange={(event) => setDraft({ ...draft, summary: event.target.value })}
            />
          </div>
          {draft.items.map((item, index) => (
            <article className="source-review-card full-span" key={item.id}>
              <div className="section-heading">
                <strong>{item.kind}</strong>
                <select
                  aria-label={`${item.id} 的审核状态`}
                  value={item.reviewState}
                  disabled={!active || busy}
                  onChange={(event) => setItem(index, { reviewState: event.target.value as ResearchReviewStateDto })}
                >
                  {(Object.entries(RESEARCH_REVIEW_LABEL) as [ResearchReviewStateDto, string][]).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <textarea
                aria-label={`${item.id} 的研究内容`}
                rows={3}
                maxLength={5_000}
                value={item.text}
                disabled={!active || busy}
                onChange={(event) => setItem(index, { text: event.target.value })}
              />
              <details>
                <summary>证据（{item.evidence.length}）</summary>
                {item.evidence.map((evidence) => (
                  <blockquote key={`${evidence.sourceVersionId}-${evidence.paragraphIndex}`}>
                    {evidence.snippet}
                    <footer>
                      资料版本 {evidence.sourceVersionId} · 第 {evidence.paragraphIndex + 1} 段
                    </footer>
                  </blockquote>
                ))}
              </details>
            </article>
          ))}
          <div className="field full-span">
            <label htmlFor="research-questions">待确认问题</label>
            <textarea
              id="research-questions"
              rows={4}
              value={draft.openQuestions.map((question) => question.text).join('\n')}
              disabled={!active || busy}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  openQuestions: event.target.value
                    .split('\n')
                    .map((text) => text.trim())
                    .filter(Boolean)
                    .map((text, index) => ({ id: `question-${index + 1}`, text })),
                })
              }
            />
          </div>
        </div>
      )}
    </section>
  );
}
