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
import { useWorkspacePrimaryAction } from './workspace-action-context';

const clone = (body: XiaohongshuBodyDto): XiaohongshuBodyDto => JSON.parse(JSON.stringify(body)) as XiaohongshuBodyDto;

function errorMessage(error: unknown): string {
  if (!(error instanceof WebApiError)) return '无法完成该操作，请重试。';
  switch (error.code) {
    case 'APPROVED_RESEARCH_REQUIRED':
      return '生成小红书内容前，请先批准当前研究版本。';
    case 'CONFIRMED_OPINION_REQUIRED':
      return '创作者主导生成需要绑定当前研究的已确认人工观点。';
    case 'BLOG_REVISION_CONFLICT':
      return '已有更新的小红书草稿，请重新加载后再保存。';
    case 'BLOG_VERSION_NOT_ELIGIBLE':
      return '当前小红书版本尚不符合条件，请审核全部 8 页及其当前依赖。';
    case 'BLOG_PROVIDER_OUTPUT_INVALID':
      return '生成的候选未通过确定性的八页内容合同。';
    case 'BLOG_EXPORT_NOT_ELIGIBLE':
      return '导出需要当前精确且已批准的小红书版本。';
    default:
      return '无法完成该操作，请重试。';
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
      } else setError('无法加载小红书状态，请重新加载权威状态。');
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
      setNotice(`已导出批准的 ${anchor.download}。`);
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
    exportLabel: '导出 post.md',
  });
  const presentationStatus = candidatePresentationStatus(state, dirty);
  const generate = (fresh: boolean): void => {
    if (!mode) return;
    void command(
      async () =>
        (await api.generateXiaohongshu(contentPackageId, { requestId: crypto.randomUUID(), contentMode: mode })).data
          .xiaohongshu,
      fresh ? '新版小红书候选已创建，历史版本与批准记录保持不可变。' : '八页小红书候选已生成。',
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
        '小红书草稿已保存。',
      );
    } else if (action.id === 'checkpoint') {
      void command(
        async () =>
          (await api.checkpointXiaohongshu(contentPackageId, { expectedRevision: state.workingCopy.revision })).data
            .xiaohongshu,
        '已保存不可变小红书版本。',
      );
    } else if (action.id === 'approve') {
      void command(
        async () =>
          (await api.approveXiaohongshu(contentPackageId, { versionId: state.latestVersion.id })).data.xiaohongshu,
        '已批准精确小红书版本。',
      );
    } else if (action.id === 'export') void download('post');
  };

  useWorkspacePrimaryAction(
    loading
      ? null
      : {
          label: action.label,
          reason: mode === null ? '请先选择创作者主导或研究驱动模式。' : action.reason,
          disabled: action.disabled || action.id === 'complete' || (action.id === 'generate' && mode === null),
          busy,
          onAction: runNextAction,
        },
  );

  if (loading) return <p role="status">正在加载小红书…</p>;
  const page = draft?.pages[selectedPage];
  return (
    <section className="xiaohongshu-panel" aria-labelledby="xiaohongshu-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">阶段 05 · 独立输出</p>
          <h2 id="xiaohongshu-title">小红书内容</h2>
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
            ? '当前候选仍使用旧依赖，请在审核前生成新版候选。'
            : '旧的已批准版本需更新；新的当前候选仍处于待审核。'}
        </StatusMessage>
      ) : null}
      {!state ? (
        <div className="xhs-mode-picker">
          <label htmlFor="xiaohongshu-mode">小红书创作模式</label>
          <select
            id="xiaohongshu-mode"
            value={mode ?? ''}
            disabled={!active || busy}
            onChange={(event) => setMode((event.target.value || null) as ContentModeDto | null)}
          >
            <option value="">选择模式</option>
            <option value="creator_led">创作者主导</option>
            <option value="research_based">研究驱动</option>
          </select>
        </div>
      ) : draft && page ? (
        <div className="xhs-editor-shell">
          <section className="xhs-editor-header" aria-label="小红书包装设置">
            <div className="field">
              <label htmlFor="platform-title">平台标题</label>
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
              <label htmlFor="cover-title">封面标题</label>
              <input
                id="cover-title"
                value={draft.coverTitle}
                onChange={(event) => setDraft({ ...draft, coverTitle: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="cover-subtitle">封面副标题</label>
              <input
                id="cover-subtitle"
                value={draft.coverSubtitle ?? ''}
                onChange={(event) => setDraft({ ...draft, coverSubtitle: event.target.value || null })}
              />
            </div>
          </section>

          <nav className="xhs-page-nav" aria-label="小红书页面">
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
                <p className="eyebrow">第 {selectedPage + 1} / 8 页</p>
                <h3 id="xhs-page-heading">{page.purpose}</h3>
              </div>
              <span className="xhs-density">
                {page.emphasis} · {page.density}
              </span>
            </div>
            <div className="field">
              <label htmlFor="page-heading">页面标题</label>
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
              <label htmlFor="page-content">页面内容</label>
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
              <summary>可追溯信息</summary>
              <dl>
                <div>
                  <dt>视觉说明</dt>
                  <dd>{page.visualBrief}</dd>
                </div>
                <div>
                  <dt>研究条目</dt>
                  <dd>{page.researchItemIds.join(', ')}</dd>
                </div>
                <div>
                  <dt>观点版本</dt>
                  <dd>{page.opinionVersionId ?? '研究驱动模式不使用观点'}</dd>
                </div>
                <div>
                  <dt>平台配置</dt>
                  <dd>{draft.platformProfileVersion}</dd>
                </div>
              </dl>
            </details>
          </article>

          <section className="xhs-finishing-grid" aria-label="帖子收尾字段">
            <div className="field full-span">
              <label htmlFor="xhs-caption">正文说明</label>
              <textarea
                id="xhs-caption"
                rows={5}
                value={draft.caption}
                onChange={(event) => setDraft({ ...draft, caption: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="xhs-cta">行动引导</label>
              <input
                id="xhs-cta"
                value={draft.cta}
                onChange={(event) => setDraft({ ...draft, cta: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="xhs-hashtags">话题标签</label>
              <input
                id="xhs-hashtags"
                value={draft.hashtags.join(' ')}
                onChange={(event) => setDraft({ ...draft, hashtags: event.target.value.split(/\s+/).filter(Boolean) })}
              />
            </div>
          </section>

          <details className="xhs-traceability xhs-references">
            <summary>公开参考资料</summary>
            <ul>
              {draft.publicReferences.map((reference) => (
                <li key={`${reference.sourceVersionId}:${reference.label}`}>
                  {reference.label} <code>{reference.sourceVersionId}</code>
                </li>
              ))}
            </ul>
          </details>
          <div className="form-actions supporting-actions" aria-label="小红书辅助操作">
            <button
              className="secondary-button"
              type="button"
              disabled={!active || busy || dirty}
              onClick={() => generate(true)}
            >
              生成新版候选
            </button>
            <button
              className="secondary-button"
              type="button"
              disabled={busy || !state.approvedVersionId || state.outdated}
              onClick={() => void download('pages')}
            >
              导出 pages.json
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
