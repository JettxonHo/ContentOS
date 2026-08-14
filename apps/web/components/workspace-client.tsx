'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, type MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  BlogResource,
  ContentPackageModeDto,
  ContentPackageOutputDto,
  ContentPackageResource,
  OpinionResource,
  ResearchResource,
  SourceListItemResource,
  SourceResource,
  UrlCaptureIntakeResource,
  XiaohongshuResource,
} from '@contentos/contracts';

import { ContentOsApiClient, WebApiError } from '../lib/api-client';
import { SourceRefreshCoordinator } from '../lib/source-intake-view';
import { WorkflowRecoveryController } from '../lib/workflow-recovery';
import { deriveWorkspaceStageProjection, type WorkspaceStageId } from '../lib/workspace-stage-view';
import { CONTENT_MODE_LABEL, OUTPUT_LABEL, UI_COPY } from '../lib/ui-copy';
import { AppShell, StatusMessage } from './app-shell';
import { NextActionCard } from './next-action-card';
import { SourceIntakePanel } from './source-intake-panel';
import { SourceReviewPanel } from './source-review-panel';
import { ResearchReviewPanel } from './research-review-panel';
import { OpinionBlogPanel } from './opinion-blog-panel';
import { XiaohongshuPanel } from './xiaohongshu-panel';
import { WorkspaceActionRegistrationContext, type WorkspacePrimaryAction } from './workspace-action-context';
import { WorkspaceDrawer } from './workspace-drawer';
import { WorkflowTimelinePanel } from './workflow-timeline-panel';

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
  const [showActivity, setShowActivity] = useState(false);
  const [primaryAction, setPrimaryAction] = useState<WorkspacePrimaryAction | null>(null);
  const [section, setSection] = useState<'sources' | 'research' | 'opinion-blog' | 'xiaohongshu' | 'details'>(
    'sources',
  );
  const [sources, setSources] = useState<readonly SourceListItemResource[] | null>(null);
  const [intakes, setIntakes] = useState<readonly UrlCaptureIntakeResource[] | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceStale, setSourceStale] = useState(false);
  const [sourceError, setSourceError] = useState('');
  const [sourceNotice, setSourceNotice] = useState('');
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [reviewDirty, setReviewDirty] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewRefreshSignal, setReviewRefreshSignal] = useState(0);
  const [stageState, setStageState] = useState<{
    readonly loading: boolean;
    readonly readError: boolean;
    readonly sources: readonly SourceResource[] | null;
    readonly research: ResearchResource | null;
    readonly opinion: OpinionResource | null;
    readonly blog: BlogResource | null;
    readonly xiaohongshu: XiaohongshuResource | null;
  }>({ loading: true, readError: false, sources: null, research: null, opinion: null, blog: null, xiaohongshu: null });
  const [workflowLatestSequence, setWorkflowLatestSequence] = useState<number | null>(null);
  const sourceRefreshRef = useRef<
    SourceRefreshCoordinator<{
      readonly intakes: readonly UrlCaptureIntakeResource[];
      readonly sources: readonly SourceListItemResource[] | null;
    }>
  >(null);
  const selectedSourceIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedSourceIdRef.current = selectedSourceId;
  }, [selectedSourceId]);

  function apply(value: ContentPackageResource): void {
    setContentPackage(value);
    setTitle(value.title);
    setDescription(value.description ?? '');
    setContentMode(value.contentMode);
    setOutputs([...value.requestedOutputs]);
    if (value.lifecycle === 'archived') setSection('details');
  }

  const showPackageUnavailable = useCallback((): void => {
    setContentPackage(null);
    setSources(null);
    setIntakes(null);
    setSourceLoading(false);
    setSourceStale(false);
    setSourceError('');
    setSourceNotice('');
    setSelectedSourceId(null);
    setReviewDirty(false);
    setReviewBusy(false);
    setStageState({
      loading: false,
      readError: true,
      sources: null,
      research: null,
      opinion: null,
      blog: null,
      xiaohongshu: null,
    });
    setError('此内容项目不可用。');
  }, []);

  const refreshStageOverview = useCallback(async (): Promise<void> => {
    setStageState((current) => ({ ...current, loading: true, readError: false }));
    try {
      const sourceItems = (await api.listSources(contentPackageId)).data.items;
      const sourceResources = await Promise.all(
        sourceItems.map(async (source) => (await api.getSource(contentPackageId, source.id)).data.source),
      );
      const optional = async <T,>(run: () => Promise<T>, missingCode: string): Promise<T | null> => {
        try {
          return await run();
        } catch (cause) {
          if (cause instanceof WebApiError && cause.code === missingCode) return null;
          throw cause;
        }
      };
      const [research, opinionResponse, blog, xiaohongshu] = await Promise.all([
        optional(async () => (await api.getResearch(contentPackageId)).data.research, 'RESEARCH_NOT_FOUND'),
        api.getOpinion(contentPackageId),
        optional(async () => (await api.getBlog(contentPackageId)).data.blog, 'BLOG_NOT_FOUND'),
        optional(async () => (await api.getXiaohongshu(contentPackageId)).data.xiaohongshu, 'BLOG_NOT_FOUND'),
      ]);
      setStageState({
        loading: false,
        readError: false,
        sources: sourceResources,
        research,
        opinion: opinionResponse.data.opinion,
        blog,
        xiaohongshu,
      });
    } catch (cause) {
      if (cause instanceof WebApiError && cause.status === 401) router.replace('/login');
      else if (cause instanceof WebApiError && cause.status === 404 && cause.code === 'CONTENT_PACKAGE_NOT_FOUND')
        showPackageUnavailable();
      else setStageState((current) => ({ ...current, loading: false, readError: true }));
    }
  }, [api, contentPackageId, router, showPackageUnavailable]);

  const handleSourceTerminal = useCallback(
    (cause: unknown): boolean => {
      if (cause instanceof WebApiError && cause.status === 401) {
        router.replace('/login');
        return true;
      }
      if (cause instanceof WebApiError && cause.status === 404 && cause.code === 'CONTENT_PACKAGE_NOT_FOUND') {
        showPackageUnavailable();
        return true;
      }
      return false;
    },
    [router, showPackageUnavailable],
  );

  const refreshSources = useCallback(
    async (background = false): Promise<readonly UrlCaptureIntakeResource[] | undefined> => {
      const sourceRefresh = sourceRefreshRef.current;
      if (!sourceRefresh) return undefined;
      if (!background) setSourceLoading(true);
      if (!background) setSourceError('');
      try {
        return (await sourceRefresh.request())?.intakes;
      } catch (cause) {
        if (handleSourceTerminal(cause)) return undefined;
        if (background) {
          setSourceStale(true);
        } else {
          setSourceError('无法读取资料状态，请重新加载权威状态。');
        }
      } finally {
        if (!background) setSourceLoading(false);
      }
      return undefined;
    },
    [handleSourceTerminal],
  );

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
        setError('此内容项目不可用。');
      } else {
        setError('无法加载工作区，请重试。');
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
        if (!current) return;
        apply(result.data.contentPackage);
      })
      .catch((cause: unknown) => {
        if (!current) return;
        if (cause instanceof WebApiError && cause.status === 401) router.replace('/login');
        else if (cause instanceof WebApiError && cause.status === 404) setError('此内容项目不可用。');
        else setError('无法加载工作区，请重试。');
      })
      .finally(() => current && setLoading(false));
    return () => {
      current = false;
    };
  }, [api, contentPackageId, router]);

  useEffect(() => {
    if (!contentPackage || contentPackage.lifecycle === 'archived') return;
    void Promise.resolve().then(refreshStageOverview);
  }, [contentPackage, refreshStageOverview]);

  useEffect(() => {
    if (!contentPackage || section !== 'sources') return;
    let active = true;
    const sourceRefresh = new SourceRefreshCoordinator(
      async () => {
        const intakeResponse = await api.listUrlCaptureIntakes(contentPackageId);
        const sourceResponse = contentPackage.lifecycle === 'active' ? await api.listSources(contentPackageId) : null;
        return { intakes: intakeResponse.data.items, sources: sourceResponse?.data.items ?? null };
      },
      (result) => {
        const selectedSourceMissing =
          selectedSourceIdRef.current !== null &&
          result.sources?.some((source) => source.id === selectedSourceIdRef.current) === false;
        setIntakes(result.intakes);
        setSources(result.sources);
        if (selectedSourceMissing) {
          setSelectedSourceId(null);
          setReviewDirty(false);
          setReviewBusy(false);
          setSourceNotice('该资料不可用，资料列表已刷新。');
        } else {
          setSourceError('');
        }
        setSourceStale(false);
      },
    );
    sourceRefreshRef.current = sourceRefresh;
    void Promise.resolve().then(async () => {
      if (!active) return;
      setSourceLoading(true);
      setSourceError('');
      try {
        await sourceRefresh.request();
      } catch (cause) {
        if (!active) return;
        if (!handleSourceTerminal(cause)) {
          setSourceError('无法读取资料状态，请重新加载权威状态。');
        }
      } finally {
        if (active) setSourceLoading(false);
      }
    });
    return () => {
      active = false;
      sourceRefresh.dispose();
      if (sourceRefreshRef.current === sourceRefresh) sourceRefreshRef.current = null;
    };
  }, [api, contentPackage, contentPackageId, handleSourceTerminal, section]);

  useEffect(() => {
    if (!contentPackage || contentPackage.lifecycle !== 'active') return;
    const recovery = new WorkflowRecoveryController(api, apiOrigin);
    const unsubscribe = recovery.subscribe(contentPackageId, (event) => {
      if (event.kind === 'projection') {
        setWorkflowLatestSequence(event.response.data.workflow?.latestSequence ?? 0);
        setReviewRefreshSignal((current) => current + 1);
        void refreshSources(true);
      }
      if (event.kind === 'terminal' && event.status === 401) router.replace('/login');
      if (event.kind === 'terminal' && event.status === 404) showPackageUnavailable();
    });
    return unsubscribe;
  }, [api, apiOrigin, contentPackage, contentPackageId, refreshSources, router, showPackageUnavailable]);

  async function logout(): Promise<void> {
    if (reviewDirty) {
      setSourceError('离开工作区前，请先保存或放弃未保存的资料草稿。');
      return;
    }
    try {
      await api.logout();
      router.replace('/login');
    } catch (cause) {
      if (cause instanceof WebApiError && cause.status === 401) {
        router.replace('/login');
      } else {
        setError('ContentOS 无法结束当前会话，请重试。');
      }
    }
  }

  function toggleOutput(output: ContentPackageOutputDto): void {
    setOutputs((current) =>
      current.includes(output) ? current.filter((item) => item !== output) : [...current, output],
    );
  }

  function chooseSection(next: 'sources' | 'research' | 'opinion-blog' | 'xiaohongshu' | 'details'): void {
    if ((reviewDirty || reviewBusy) && next !== section) {
      setSourceError('切换阶段前，请先保存或放弃未保存的审核草稿。');
      return;
    }
    setPrimaryAction(null);
    setSection(next);
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
      setNotice('项目信息已保存到权威工作区。');
    } catch (cause) {
      if (cause instanceof WebApiError && cause.code === 'REVISION_CONFLICT') {
        setConflict(true);
      } else if (cause instanceof WebApiError && cause.status === 401) {
        router.replace('/login');
      } else {
        setError('未能保存更改，请检查表单后重试。');
      }
    } finally {
      setSaving(false);
    }
  }

  async function archive(): Promise<void> {
    if (!contentPackage || saving || reviewDirty || reviewBusy) return;
    setSaving(true);
    setError('');
    try {
      await api.archive(contentPackage.id, { expectedRevision: contentPackage.revision });
      router.replace('/?view=archived');
    } catch (cause) {
      if (cause instanceof WebApiError && cause.code === 'REVISION_CONFLICT') setConflict(true);
      else if (cause instanceof WebApiError && cause.status === 401) router.replace('/login');
      else setError('未能归档项目，请重试。');
    } finally {
      setSaving(false);
      setConfirmArchive(false);
    }
  }

  const blockDirtyLinkNavigation = (event: MouseEvent<HTMLDivElement>): void => {
    if (!reviewDirty) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest('a');
    const href = link?.getAttribute('href');
    if (href !== '/' && href?.startsWith('/?') !== true) return;
    event.preventDefault();
    event.stopPropagation();
    setSourceError('离开工作区前，请先保存或放弃未保存的资料草稿。');
  };

  const closeUnavailableSource = (): void => {
    setSelectedSourceId(null);
    setReviewDirty(false);
    setReviewBusy(false);
    setSourceNotice('该资料不可用，资料列表已刷新。');
    void refreshSources(true);
    void refreshStageOverview();
  };

  const stageProjection = contentPackage
    ? deriveWorkspaceStageProjection({
        lifecycle: contentPackage.lifecycle,
        configuredMode: contentPackage.contentMode,
        requestedOutputs: contentPackage.requestedOutputs,
        ...stageState,
      })
    : null;

  const stageRows: readonly { readonly id: WorkspaceStageId; readonly number: string; readonly title: string }[] = [
    { id: 'details', number: '01', title: UI_COPY.stage.details },
    { id: 'sources', number: '02', title: UI_COPY.stage.sources },
    { id: 'research', number: '03', title: UI_COPY.stage.research },
    { id: 'opinion-blog', number: '04', title: UI_COPY.stage.opinionBlog },
    { id: 'xiaohongshu', number: '05', title: UI_COPY.stage.xiaohongshu },
  ];

  const metadataDirty = Boolean(
    contentPackage &&
    (title !== contentPackage.title ||
      description !== (contentPackage.description ?? '') ||
      contentMode !== contentPackage.contentMode ||
      JSON.stringify([...outputs].sort()) !== JSON.stringify([...contentPackage.requestedOutputs].sort())),
  );
  const detailsAction: WorkspacePrimaryAction | null = contentPackage
    ? {
        label: '保存项目信息',
        reason: metadataDirty ? '保存标题、描述、创作模式和输出选择。' : '项目信息与权威版本一致。',
        disabled:
          contentPackage.lifecycle !== 'active' ||
          saving ||
          !metadataDirty ||
          title.trim() === '' ||
          outputs.length === 0,
        busy: saving,
        onAction: () => document.querySelector<HTMLFormElement>('#package-metadata-form')?.requestSubmit(),
      }
    : null;
  const contextAction = section === 'details' ? detailsAction : primaryAction;
  const currentStage = stageProjection?.[section];
  const contextFacts = contentPackage
    ? [
        { label: '项目版本', value: String(contentPackage.revision) },
        {
          label: '依赖与版本',
          value:
            section === 'sources'
              ? `${sources?.length ?? 0} 份资料`
              : section === 'research'
                ? stageState.research
                  ? `当前草稿 r${stageState.research.workingCopy.revision}`
                  : '尚未生成研究'
                : section === 'opinion-blog'
                  ? stageState.blog
                    ? `文章草稿 r${stageState.blog.workingCopy.revision}`
                    : '尚未生成文章'
                  : section === 'xiaohongshu'
                    ? stageState.xiaohongshu
                      ? `小红书草稿 r${stageState.xiaohongshu.workingCopy.revision}`
                      : '尚未生成小红书候选'
                    : `创作模式：${CONTENT_MODE_LABEL[contentMode]}`,
        },
      ]
    : [];

  return (
    <div onClickCapture={blockDirtyLinkNavigation}>
      <AppShell active="workspace" onLogout={() => void logout()}>
        <header className="workspace-header">
          <div>
            <p className="workspace-breadcrumb">
              <Link href="/">工作台</Link> <span>/</span> {contentPackage?.title ?? '内容项目'}
            </p>
            <p className="eyebrow">内容项目工作区</p>
            <h1>{contentPackage?.title ?? '内容项目'}</h1>
          </div>
          {contentPackage ? <div className="revision-badge">版本 {contentPackage.revision}</div> : null}
        </header>

        {contentPackage && stageProjection ? (
          <nav className="project-stage-nav" aria-label="项目阶段">
            {stageRows.map((row) => {
              const stage = stageProjection[row.id];
              const archivedDisabled =
                contentPackage.lifecycle === 'archived' && row.id !== 'details' && row.id !== 'sources';
              return (
                <button
                  key={row.id}
                  className={`project-stage-tab stage-${stage.status}`}
                  type="button"
                  aria-current={section === row.id ? 'page' : undefined}
                  aria-label={`${row.title}：${stage.label}。${stage.reason}`}
                  onClick={() => chooseSection(row.id)}
                  disabled={archivedDisabled || ((reviewDirty || reviewBusy) && section !== row.id)}
                >
                  <span>{row.number}</span>
                  <strong>{row.title}</strong>
                  <small>{stage.label}</small>
                </button>
              );
            })}
          </nav>
        ) : null}

        {loading ? (
          <div className="loading-state" role="status">
            <span className="skeleton-line" /> 正在加载工作区…
          </div>
        ) : null}
        {error ? <StatusMessage>{error}</StatusMessage> : null}
        {conflict ? (
          <StatusMessage>
            <strong>版本冲突。</strong> 已存在更新的权威版本，本次更改没有应用。{' '}
            <button className="inline-button" type="button" onClick={() => void load()}>
              重新加载最新版本
            </button>
          </StatusMessage>
        ) : null}

        {contentPackage && !loading ? (
          <WorkspaceActionRegistrationContext.Provider value={setPrimaryAction}>
            <div className="workspace-layout">
              <section
                className="workspace-main"
                aria-labelledby={
                  section === 'sources'
                    ? 'sources-title'
                    : section === 'research'
                      ? 'research-title'
                      : section === 'opinion-blog'
                        ? 'opinion-blog-title'
                        : section === 'xiaohongshu'
                          ? 'xiaohongshu-title'
                          : 'metadata-title'
                }
              >
                {section === 'sources' ? (
                  <>
                    {sourceError ? (
                      <StatusMessage>
                        {sourceError}{' '}
                        <button className="inline-button" type="button" onClick={() => void refreshSources()}>
                          重新加载资料状态
                        </button>
                      </StatusMessage>
                    ) : null}
                    {sourceNotice ? <StatusMessage>{sourceNotice}</StatusMessage> : null}
                    <SourceIntakePanel
                      api={api}
                      contentPackage={contentPackage}
                      sources={sources}
                      sourceDetails={stageState.sources}
                      intakes={intakes}
                      busy={sourceLoading}
                      stale={sourceStale}
                      onRefresh={() => refreshSources()}
                      onTerminal={handleSourceTerminal}
                      onReview={(sourceId) => {
                        setSourceError('');
                        setSourceNotice('');
                        setSelectedSourceId(sourceId);
                      }}
                      reviewNavigationBlocked={reviewDirty || reviewBusy}
                      primaryActionEnabled={selectedSourceId === null}
                    />
                    {contentPackage.lifecycle === 'active' && selectedSourceId ? (
                      <SourceReviewPanel
                        key={selectedSourceId}
                        api={api}
                        contentPackageId={contentPackage.id}
                        sourceId={selectedSourceId}
                        refreshSignal={reviewRefreshSignal}
                        onClose={() => setSelectedSourceId(null)}
                        onDirtyChange={setReviewDirty}
                        onBusyChange={setReviewBusy}
                        onUnavailable={handleSourceTerminal}
                        onSourceUnavailable={closeUnavailableSource}
                        onStatusChange={() => void refreshStageOverview()}
                      />
                    ) : null}
                  </>
                ) : section === 'research' ? (
                  <ResearchReviewPanel
                    api={api}
                    contentPackageId={contentPackage.id}
                    active={contentPackage.lifecycle === 'active'}
                    onDirtyChange={setReviewDirty}
                    onBusyChange={setReviewBusy}
                    onUnauthenticated={() => router.replace('/login')}
                    onStatusChange={() => void refreshStageOverview()}
                  />
                ) : section === 'opinion-blog' ? (
                  <OpinionBlogPanel
                    api={api}
                    contentPackageId={contentPackage.id}
                    configuredMode={contentPackage.contentMode}
                    active={contentPackage.lifecycle === 'active'}
                    onDirtyChange={setReviewDirty}
                    onBusyChange={setReviewBusy}
                    onUnauthenticated={() => router.replace('/login')}
                    onStatusChange={() => void refreshStageOverview()}
                  />
                ) : section === 'xiaohongshu' ? (
                  <XiaohongshuPanel
                    api={api}
                    contentPackageId={contentPackage.id}
                    configuredMode={contentPackage.contentMode}
                    active={contentPackage.lifecycle === 'active'}
                    onDirtyChange={setReviewDirty}
                    onBusyChange={setReviewBusy}
                    onUnauthenticated={() => router.replace('/login')}
                    onStatusChange={() => void refreshStageOverview()}
                  />
                ) : (
                  <>
                    <div className="section-heading">
                      <div>
                        <p className="eyebrow">项目基础信息</p>
                        <h2 id="metadata-title">项目信息</h2>
                      </div>
                      <span className={`lifecycle ${contentPackage.lifecycle}`}>
                        {contentPackage.lifecycle === 'active' ? '进行中' : '已归档'}
                      </span>
                    </div>
                    <form id="package-metadata-form" className="form-grid" onSubmit={save}>
                      <div className="field full-span">
                        <label htmlFor="workspace-title">项目标题</label>
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
                          项目描述 <span>可选</span>
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
                        <label htmlFor="workspace-mode">创作模式</label>
                        <select
                          id="workspace-mode"
                          value={contentMode}
                          onChange={(event) => setContentMode(event.target.value as ContentPackageModeDto)}
                          disabled={contentPackage.lifecycle === 'archived'}
                        >
                          <option value="deferred">稍后决定</option>
                          <option value="creator_led">创作者主导</option>
                          <option value="research_based">研究驱动</option>
                        </select>
                      </div>
                      <fieldset className="field output-field" disabled={contentPackage.lifecycle === 'archived'}>
                        <legend>目标输出</legend>
                        <label className="check-label">
                          <input
                            type="checkbox"
                            checked={outputs.includes('blog')}
                            onChange={() => toggleOutput('blog')}
                          />{' '}
                          {OUTPUT_LABEL.blog}
                        </label>
                        <label className="check-label">
                          <input
                            type="checkbox"
                            checked={outputs.includes('xiaohongshu')}
                            onChange={() => toggleOutput('xiaohongshu')}
                          />{' '}
                          {OUTPUT_LABEL.xiaohongshu}
                        </label>
                      </fieldset>
                      {outputs.length === 0 ? (
                        <p className="field-error full-span" role="alert">
                          至少选择一种输出。
                        </p>
                      ) : null}
                      {notice ? (
                        <p className="save-notice full-span" role="status">
                          {notice}
                        </p>
                      ) : null}
                    </form>
                  </>
                )}
              </section>

              <aside className="workspace-context-panel" aria-labelledby="context-title">
                <p className="eyebrow">当前阶段</p>
                <h2 id="context-title">{stageRows.find((row) => row.id === section)?.title}</h2>
                {currentStage ? (
                  <NextActionCard
                    status={currentStage.status}
                    label={currentStage.label}
                    actionLabel={contextAction?.label ?? currentStage.nextAction}
                    reason={contextAction?.reason ?? currentStage.reason}
                    disabled={contextAction?.disabled ?? true}
                    disabledReason={contextAction?.reason ?? currentStage.reason}
                    busy={contextAction?.busy ?? false}
                    {...(contextAction && !contextAction.disabled ? { onAction: contextAction.onAction } : {})}
                    meta={contextFacts}
                  />
                ) : null}
                <button className="secondary-button activity-entry" type="button" onClick={() => setShowActivity(true)}>
                  运行记录
                </button>
                <p className="stage-note">当前生成仍使用确定性 Fake Provider，不代表产品已接入真实 Provider。</p>
                {contentPackage.lifecycle === 'active' ? (
                  <button
                    className="danger-text-button"
                    type="button"
                    onClick={() => {
                      if (reviewDirty || reviewBusy) {
                        setSourceError('归档项目前，请先保存或放弃未保存的资料草稿。');
                        return;
                      }
                      setConfirmArchive(true);
                    }}
                  >
                    归档项目
                  </button>
                ) : (
                  <p className="archived-note">该项目已归档并以只读方式保留。</p>
                )}
              </aside>
            </div>
          </WorkspaceActionRegistrationContext.Provider>
        ) : null}

        {contentPackage ? (
          <WorkspaceDrawer open={showActivity} keepMounted title="运行记录" onClose={() => setShowActivity(false)}>
            {contentPackage.lifecycle === 'active' ? (
              <WorkflowTimelinePanel
                api={api}
                contentPackageId={contentPackage.id}
                latestSequence={workflowLatestSequence}
                onTerminal={handleSourceTerminal}
              />
            ) : (
              <p className="archived-note">已归档项目不会继续产生运行记录。</p>
            )}
          </WorkspaceDrawer>
        ) : null}

        {confirmArchive ? (
          <div className="dialog-backdrop" role="presentation">
            <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="archive-title">
              <p className="eyebrow">保留历史，而非删除</p>
              <h2 id="archive-title">归档这个项目？</h2>
              <p>它将离开进行中的工作台，但仍可在已归档项目中查看。</p>
              <div className="form-actions">
                <button className="secondary-button" type="button" onClick={() => setConfirmArchive(false)} autoFocus>
                  取消
                </button>
                <button className="danger-button" type="button" onClick={() => void archive()} disabled={saving}>
                  {saving ? '正在归档…' : '归档项目'}
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </AppShell>
    </div>
  );
}
