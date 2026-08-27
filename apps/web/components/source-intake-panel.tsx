'use client';

import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ContentPackageResource,
  SourceListItemResource,
  SourceResource,
  UrlCaptureIntakeResource,
} from '@contentos/contracts';

import { WebApiError, type ContentOsApiClient } from '../lib/api-client';
import {
  intakeFailureCopy,
  reconcileUrlSubmission,
  sourceIntakeView,
  sourceTablePresentation,
  type SourceIntakeRole,
  type UrlSubmissionConfirmation,
} from '../lib/source-intake-view';
import { formatZhDate, SOURCE_ROLE_LABEL, SOURCE_TYPE_LABEL } from '../lib/ui-copy';
import { useWorkspacePrimaryAction } from './workspace-action-context';
import { WorkspaceDrawer } from './workspace-drawer';

type IntakeMode = 'paste' | 'upload' | 'url';
type UrlConfirmationWarning = 'ambiguous' | 'refresh_failed';

interface Props {
  readonly api: ContentOsApiClient;
  readonly contentPackage: ContentPackageResource;
  readonly sources: readonly SourceListItemResource[] | null;
  readonly sourceDetails: readonly SourceResource[] | null;
  readonly intakes: readonly UrlCaptureIntakeResource[] | null;
  readonly busy: boolean;
  readonly stale: boolean;
  readonly onRefresh: () => Promise<readonly UrlCaptureIntakeResource[] | undefined>;
  readonly onTerminal: (cause: unknown) => boolean;
  readonly onReview: (sourceId: string) => void;
  readonly reviewNavigationBlocked: boolean;
  readonly primaryActionEnabled: boolean;
}

function defaultRole(view: ReturnType<typeof sourceIntakeView>): SourceIntakeRole {
  return view.primary.available ? 'primary' : 'supporting';
}

export function SourceIntakePanel({
  api,
  contentPackage,
  sources,
  sourceDetails,
  intakes,
  busy,
  stale,
  onRefresh,
  onTerminal,
  onReview,
  reviewNavigationBlocked,
  primaryActionEnabled,
}: Props) {
  const archived = contentPackage.lifecycle === 'archived';
  const view = useMemo(() => sourceIntakeView(archived ? null : sources, intakes ?? []), [archived, sources, intakes]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [mode, setMode] = useState<IntakeMode>('paste');
  const [role, setRole] = useState<SourceIntakeRole>(() => defaultRole(view));
  const [label, setLabel] = useState('');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [urlConfirmation, setUrlConfirmation] = useState<{
    readonly status: UrlSubmissionConfirmation;
    readonly warning: UrlConfirmationWarning | null;
  }>({ status: 'idle', warning: null });
  const textInput = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const sourceRefs = useRef(new Map<string, HTMLTableRowElement>());

  const hasIntake = view.intake !== null || urlConfirmation.status !== 'idle';
  const roleAvailable = role === 'primary' ? view.primary.available : view.supporting.available;

  useWorkspacePrimaryAction(
    primaryActionEnabled
      ? {
          label: '+ 添加资料',
          reason: archived ? '已归档项目不能添加资料。' : '添加粘贴文本、Markdown 文件或公开网页链接。',
          disabled: archived || busy || submitting,
          busy: submitting,
          onAction: () => setComposerOpen(true),
        }
      : null,
  );

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
    if (error || urlConfirmation.warning) errorRef.current?.focus();
  }, [error, urlConfirmation.warning]);

  function chooseMode(next: IntakeMode): void {
    setMode(next);
    setError('');
    setNotice('');
  }

  function selectFallback(next: 'paste' | 'upload'): void {
    if (view.intake?.status !== 'failed') return;
    const available = view.intake.role === 'primary' ? view.primary.available : view.supporting.available;
    if (available) setRole(view.intake.role);
    chooseMode(next);
    setComposerOpen(true);
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
        if (text.trim() === '') return void textInput.current?.focus();
        const response = await api.createSource(contentPackage.id, {
          sourceType: 'pasted_text',
          role,
          text,
          ...(label.trim() ? { label: label.trim() } : {}),
        });
        createdSourceId = response.data.source.id;
        setText('');
      } else if (mode === 'upload') {
        if (!file) return void fileInput.current?.focus();
        const form = new FormData();
        form.append('file', file);
        form.append('role', role);
        if (label.trim()) form.append('label', label.trim());
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
        setUrlConfirmation((current) => ({ status: reconcileUrlSubmission(current.status, refreshed), warning: null }));
      }
      setNotice(mode === 'url' ? '网页资料已提交，正在等待抓取。' : '资料已添加到当前项目。');
      setComposerOpen(false);
      if (createdSourceId) {
        setTimeout(
          () =>
            requestAnimationFrame(() => requestAnimationFrame(() => sourceRefs.current.get(createdSourceId)?.focus())),
          0,
        );
      }
    } catch (cause) {
      if (onTerminal(cause)) return;
      if (cause instanceof WebApiError && cause.code === 'SOURCE_ROLE_LIMIT_EXCEEDED') {
        setError('该资料用途已达到容量上限，请刷新状态并选择仍有余量的用途。');
      } else if (mode === 'url' && cause instanceof WebApiError && cause.code === 'NETWORK_ERROR') {
        setUrlConfirmation((current) => ({ ...current, status: 'confirming', warning: 'ambiguous' }));
      } else setError('无法添加该资料，请检查输入后重试。');
    } finally {
      setSubmitting(false);
    }
  }

  const feedback = (
    <>
      {stale ? (
        <p className="field-error" role="status">
          无法确认最新资料状态，当前显示上次已知结果。{' '}
          <button className="inline-button" type="button" onClick={() => void onRefresh()}>
            重新加载
          </button>
        </p>
      ) : null}
      {error ? (
        <p className="field-error" role="alert" ref={errorRef} tabIndex={-1}>
          {error}
        </p>
      ) : null}
      {urlConfirmation.warning ? (
        <p className="field-error" role="alert" ref={errorRef} tabIndex={-1}>
          {urlConfirmation.warning === 'ambiguous'
            ? '无法确认网页资料是否提交成功，请先刷新权威状态。'
            : '网页资料提交仍待确认，请刷新后再操作。'}
        </p>
      ) : null}
      {notice ? (
        <p className="save-notice" role="status">
          {notice}
        </p>
      ) : null}
    </>
  );

  if ((!archived && sources === null) || intakes === null) {
    return (
      <section className="source-intake-panel" aria-labelledby="sources-title" aria-busy="true">
        <div className="section-heading">
          <div>
            <p className="eyebrow">阶段 02</p>
            <h2 id="sources-title">资料</h2>
          </div>
        </div>
        <div className="resource-table-skeleton" role="status">
          <span className="skeleton-line" />
          正在读取资料状态…
        </div>
      </section>
    );
  }

  return (
    <section className="source-intake-panel" aria-labelledby="sources-title" aria-busy={busy || submitting}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">阶段 02</p>
          <h2 id="sources-title">资料</h2>
        </div>
        {archived ? <span className="lifecycle archived">已归档</span> : null}
      </div>
      {view.formalSourcesAvailable ? (
        <p className="source-capacity">
          主资料 {view.primary.used}/1 · 补充资料 {view.supporting.used}/5
        </p>
      ) : null}
      {!composerOpen ? feedback : null}

      <div className="resource-table-wrap">
        <table className="resource-table">
          <thead>
            <tr>
              <th>资料名称</th>
              <th>方式</th>
              <th>用途</th>
              <th>状态</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {view.visibleSources.length === 0 && !view.intake ? (
              <tr>
                <td colSpan={6} className="empty-table-cell">
                  暂无资料。使用“+ 添加资料”开始。
                </td>
              </tr>
            ) : null}
            {view.visibleSources.map((source) => {
              const state = sourceTablePresentation(
                source,
                sourceDetails?.find((item) => item.id === source.id),
              );
              return (
                <tr
                  key={source.id}
                  ref={(element) => {
                    if (element) sourceRefs.current.set(source.id, element);
                    else sourceRefs.current.delete(source.id);
                  }}
                  tabIndex={-1}
                >
                  <td>
                    <strong>{source.label ?? SOURCE_TYPE_LABEL[source.sourceType]}</strong>
                  </td>
                  <td>{SOURCE_TYPE_LABEL[source.sourceType]}</td>
                  <td>{SOURCE_ROLE_LABEL[source.role]}</td>
                  <td>
                    <span className="resource-state">{state.label}</span>
                  </td>
                  <td>
                    <time dateTime={state.updatedAt}>{formatZhDate(state.updatedAt)}</time>
                  </td>
                  <td>
                    <button
                      className="table-action"
                      type="button"
                      aria-label={`审核资料 ${source.label ?? SOURCE_TYPE_LABEL[source.sourceType]}`}
                      disabled={reviewNavigationBlocked}
                      onClick={() => onReview(source.id)}
                    >
                      {state.action}
                    </button>
                  </td>
                </tr>
              );
            })}
            {view.showIntakeActivity && view.intake ? (
              <IntakeRow intake={view.intake} archived={archived} onFallback={selectFallback} />
            ) : null}
          </tbody>
        </table>
      </div>

      <WorkspaceDrawer
        open={composerOpen}
        title="添加资料"
        eyebrow="资料录入"
        onClose={() => !submitting && setComposerOpen(false)}
        footer={
          <>
            <button
              className="secondary-button"
              type="button"
              disabled={submitting}
              onClick={() => setComposerOpen(false)}
            >
              取消
            </button>
            <button
              className="primary-button"
              type="submit"
              form="source-composer-form"
              aria-label="添加资料"
              disabled={submitting || !roleAvailable || (mode === 'url' && hasIntake)}
            >
              {submitting ? '正在添加…' : '添加资料'}
            </button>
          </>
        }
      >
        {composerOpen ? feedback : null}
        <form id="source-composer-form" className="source-composer" onSubmit={(event) => void submit(event)}>
          <div className="segmented-control" role="group" aria-label="资料录入方式">
            {(['paste', 'upload', 'url'] as const).map((candidate) => (
              <button
                key={candidate}
                type="button"
                aria-label={candidate === 'paste' ? '粘贴文本' : candidate === 'upload' ? '上传文件' : '网页链接'}
                aria-pressed={mode === candidate}
                onClick={() => chooseMode(candidate)}
                disabled={candidate === 'url' && hasIntake}
              >
                {candidate === 'paste' ? '粘贴文本' : candidate === 'upload' ? '上传文件' : '网页链接'}
              </button>
            ))}
          </div>
          {hasIntake ? <p className="help-text">当前项目已有网页抓取记录，不能在此替换或重试。</p> : null}
          {urlConfirmation.status === 'confirming' ? (
            <button
              className="inline-button"
              type="button"
              aria-label="重新加载资料状态"
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
              重新加载资料状态
            </button>
          ) : null}
          <fieldset className="role-fieldset">
            <legend>资料用途</legend>
            <label className="role-option">
              <input
                type="radio"
                name="source-role"
                aria-label={`主资料（${view.primary.used}/1）`}
                checked={role === 'primary'}
                onChange={() => setRole('primary')}
                disabled={!view.primary.available}
              />
              <span>
                <strong>主资料</strong>
                <small>项目的核心事实依据，最多 1 份。</small>
                <em>
                  {view.primary.used}/1{!view.primary.available ? ' · 已达上限' : ''}
                </em>
              </span>
            </label>
            <label className="role-option">
              <input
                type="radio"
                name="source-role"
                aria-label={`补充资料（${view.supporting.used}/5）`}
                checked={role === 'supporting'}
                onChange={() => setRole('supporting')}
                disabled={!view.supporting.available}
              />
              <span>
                <strong>补充资料</strong>
                <small>用于背景、对比或佐证，最多 5 份。</small>
                <em>
                  {view.supporting.used}/5{!view.supporting.available ? ' · 已达上限' : ''}
                </em>
              </span>
            </label>
          </fieldset>
          {!roleAvailable ? <p className="help-text">请选择仍有容量的资料用途。</p> : null}
          {mode !== 'url' ? (
            <label className="field">
              资料名称 <span>可选</span>
              <input
                aria-label="资料名称（可选）"
                value={label}
                maxLength={200}
                onChange={(event) => setLabel(event.target.value)}
              />
            </label>
          ) : null}
          {mode === 'paste' ? (
            <label className="field">
              资料正文
              <textarea
                ref={textInput}
                aria-label="资料正文"
                value={text}
                maxLength={100000}
                rows={10}
                onChange={(event) => setText(event.target.value)}
                required
              />
            </label>
          ) : null}
          {mode === 'upload' ? (
            <label className="field">
              上传 Markdown 或文本文件
              <input
                ref={fileInput}
                type="file"
                aria-label="上传 Markdown 或文本文件"
                accept=".md,.txt,text/markdown,text/plain"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                required
              />
              <span>仅支持 .md 与 .txt</span>
            </label>
          ) : null}
          {mode === 'url' ? (
            <label className="field">
              公开 URL
              <input
                type="url"
                aria-label="公开 URL"
                value={url}
                maxLength={2048}
                onChange={(event) => setUrl(event.target.value)}
                required
              />
              <span>URL 仅对当前所有者可见。</span>
            </label>
          ) : null}
        </form>
      </WorkspaceDrawer>
      {archived ? <p className="archived-note">该项目已归档，不能继续添加资料。</p> : null}
    </section>
  );
}

function IntakeRow({
  intake,
  archived,
  onFallback,
}: {
  readonly intake: UrlCaptureIntakeResource;
  readonly archived: boolean;
  readonly onFallback: (mode: 'paste' | 'upload') => void;
}) {
  const status =
    intake.status === 'queued'
      ? '等待抓取'
      : intake.status === 'running'
        ? '抓取中'
        : intake.status === 'succeeded'
          ? '已抓取'
          : '抓取失败';
  return (
    <tr className="intake-row">
      <td>
        <strong>{intake.submittedUrl}</strong>
        {intake.status === 'failed' ? <small>{intakeFailureCopy(intake)}</small> : null}
      </td>
      <td>网页链接</td>
      <td>{SOURCE_ROLE_LABEL[intake.role]}</td>
      <td>
        <span className="resource-state">{status}</span>
      </td>
      <td>—</td>
      <td>
        {intake.status === 'failed' && !archived ? (
          <div className="table-fallback-actions">
            <button
              aria-label="改用粘贴文本"
              className="table-action"
              type="button"
              onClick={() => onFallback('paste')}
            >
              改用粘贴
            </button>
            <button
              aria-label="改用上传文件"
              className="table-action"
              type="button"
              onClick={() => onFallback('upload')}
            >
              改用上传
            </button>
          </div>
        ) : (
          <span>查看进度</span>
        )}
      </td>
    </tr>
  );
}
