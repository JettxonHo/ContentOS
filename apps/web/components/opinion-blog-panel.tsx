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
import { CONTENT_MODE_LABEL } from '../lib/ui-copy';
import { useWorkspacePrimaryAction } from './workspace-action-context';

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
  if (!(cause instanceof WebApiError)) return '无法完成该操作，请重试。';
  switch (cause.code) {
    case 'APPROVED_RESEARCH_REQUIRED':
      return '继续前，请先批准当前研究版本。';
    case 'CONFIRMED_OPINION_REQUIRED':
      return '请基于当前研究重新解读保留的回答，人工审核后再确认精确观点版本。';
    case 'OPINION_REVISION_CONFLICT':
      return '已有更新的观点草稿，请重新加载后再确认。';
    case 'BLOG_REVISION_CONFLICT':
      return '已有更新的文章草稿，请重新加载后再保存。';
    case 'BLOG_VERSION_NOT_ELIGIBLE':
      return '当前文章版本尚不符合条件，请保留末尾“## References”并刷新已变化的依赖。';
    case 'BLOG_PROVIDER_OUTPUT_INVALID':
      return '文章候选未通过确定性内容校验，未提升为可审核候选。';
    case 'BLOG_EXPORT_NOT_ELIGIBLE':
      return '导出需要当前精确且已批准的文章版本。';
    default:
      return '无法完成该操作，请重试。';
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
      else setError('无法加载观点与文章状态，请重新加载权威状态。');
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
    exportLabel: '导出 article.md',
  });
  let action: CandidateAction = blogAction;
  if (mode === 'deferred') {
    action = {
      id: 'select_mode',
      label: '选择创作模式',
      reason: '生成文章候选前，请选择创作者主导或研究驱动。',
      disabled: !active || busy,
    };
  } else if (mode === 'creator_led' && opinion?.outdated && !reinterpretedCurrent) {
    action = {
      id: 'refresh',
      label: '基于当前研究重新解读',
      reason: '原始回答已保留，但当前解读仍绑定旧研究版本。',
      disabled: !active || busy || raw.trim() === '',
    };
  } else if (mode === 'creator_led' && !opinion) {
    action = {
      id: 'generate',
      label: '解读回答',
      reason: raw.trim() === '' ? '请先回答观点问题，再进行解读。' : '基于当前已批准研究解读这份回答。',
      disabled: !active || busy || raw.trim() === '',
    };
  } else if (mode === 'creator_led' && !currentConfirmedOpinion) {
    action = {
      id: 'approve',
      label: '确认精确观点版本',
      reason: '请审核或修正解读；人工确认会把这段表述绑定到当前研究。',
      disabled: !active || busy || statement.trim() === '',
    };
  } else if (mode === 'creator_led' && rawResponseChanged) {
    action = {
      id: 'refresh',
      label: '解读更新后的回答',
      reason: '人工回答已变化，请基于当前研究重新解读后再创建新观点版本。',
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
    }, '已基于当前已批准研究准备解读，请在确认前人工审核。');
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
    }, '不可变人工观点版本已确认。');
  };
  const generate = (fresh: boolean): void => {
    if (mode === 'deferred') return;
    void command(
      async () => {
        applyBlog(
          (await api.generateBlog(contentPackageId, { requestId: crypto.randomUUID(), contentMode: mode })).data.blog,
        );
      },
      fresh ? '新版文章候选已创建，历史版本与批准记录保持不可变。' : '已根据精确的已批准依赖生成文章候选。',
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
        '文章草稿已保存。',
      );
    } else if (action.id === 'checkpoint') {
      void command(
        async () =>
          applyBlog(
            (await api.checkpointBlog(contentPackageId, { expectedRevision: blog.workingCopy.revision })).data.blog,
          ),
        '已保存不可变文章版本。',
      );
    } else if (action.id === 'approve') {
      void command(
        async () =>
          applyBlog((await api.approveBlog(contentPackageId, { versionId: blog.latestVersion.id })).data.blog),
        '已批准精确文章版本。',
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
      }, '已导出批准的 article.md。');
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

  if (loading) return <p role="status">正在加载观点与文章…</p>;
  const bodyHeadings = draft?.markdown.match(/^## (?!References$).+/gm)?.length ?? 0;
  return (
    <section className="research-panel" aria-labelledby="opinion-blog-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">阶段 04</p>
          <h2 id="opinion-blog-title">先明确观点，再审核文章</h2>
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
            ? '当前文章候选仍绑定旧依赖，请生成新版候选。'
            : '旧的已批准文章需更新；新的当前候选仍处于待审核。'}
        </StatusMessage>
      ) : null}
      <div className="form-grid">
        <div className="field">
          <label htmlFor="blog-mode">创作模式</label>
          <select
            id="blog-mode"
            value={mode}
            disabled={!active || busy || blog !== null}
            onChange={(event) => setMode(event.target.value as ContentModeDto)}
          >
            <option value="deferred" disabled>
              选择创作模式
            </option>
            <option value="creator_led">{CONTENT_MODE_LABEL.creator_led}</option>
            <option value="research_based">{CONTENT_MODE_LABEL.research_based}</option>
          </select>
          <p className="field-help">{blog ? '当前候选的创作模式已固定。' : '请选择如何表达当前内容基础。'}</p>
        </div>

        {mode === 'deferred' ? (
          <div className="mode-explanation full-span">
            <strong>选择创作模式</strong>
            <p>生成文章候选前，请选择创作者主导或研究驱动。</p>
          </div>
        ) : mode === 'research_based' ? (
          <div className="mode-explanation full-span">
            <strong>研究驱动模式</strong>
            <p>只使用精确的已批准研究，不请求人工观点，也不会暗示个人经历。</p>
          </div>
        ) : (
          <section className="opinion-workflow full-span" aria-labelledby="opinion-workflow-title">
            <div>
              <p className="eyebrow">创作者主导观点</p>
              <h3 id="opinion-workflow-title">回答 → 解读 → 审核 → 确认</h3>
            </div>
            {opinion?.outdated ? (
              <StatusMessage>研究已变化。原始回答已保留，请基于当前研究重新解读；旧观点版本保持不可变。</StatusMessage>
            ) : null}
            {currentConfirmedOpinion && !rawResponseChanged ? (
              <p className="confirmed-note">当前精确观点版本已确认，无需重复确认。</p>
            ) : null}
            <div className="field">
              <label htmlFor="opinion-question">1. 人工回答</label>
              <p id="opinion-question">
                <strong>读者看完后，应该理解什么、感受什么或采取什么行动？</strong>
              </p>
              <textarea
                aria-label="人工观点原始回答"
                rows={4}
                maxLength={10000}
                value={raw}
                disabled={!active || busy}
                onChange={(event) => setRaw(event.target.value)}
              />
            </div>
            {opinion ? (
              <div className="field">
                <label htmlFor="confirmed-opinion">2. 审核或修正解读</label>
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
                <span>正文结构</span>
                <strong>{bodyHeadings} / 4–6</strong>
              </div>
              <div>
                <span>参考依据</span>
                <strong>{draft.markdown.includes('\n## References\n') ? '已包含' : '必需'}</strong>
              </div>
              <div>
                <span>历史版本</span>
                <strong>已保留</strong>
              </div>
            </div>
            <div className="field full-span">
              <label htmlFor="blog-title">文章标题</label>
              <input
                id="blog-title"
                maxLength={200}
                value={draft.title}
                disabled={!active || busy}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              />
            </div>
            <div className="field full-span">
              <label htmlFor="blog-summary">文章摘要</label>
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
              <label htmlFor="blog-markdown">文章 Markdown</label>
              <textarea
                id="blog-markdown"
                rows={18}
                maxLength={50000}
                value={draft.markdown}
                disabled={!active || busy}
                onChange={(event) => setDraft({ ...draft, markdown: event.target.value })}
              />
            </div>
            <div className="form-actions full-span supporting-actions" aria-label="文章辅助操作">
              <button
                className="secondary-button"
                type="button"
                disabled={!active || busy || dirty}
                onClick={() => generate(true)}
              >
                生成新版候选
              </button>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
