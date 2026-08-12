'use client';

import { useEffect, useMemo, useState } from 'react';
import type { BlogBodyDto, BlogResource, ContentModeDto, OpinionResource } from '@contentos/contracts';
import { WebApiError, type ContentOsApiClient } from '../lib/api-client';
import { StatusMessage } from './app-shell';

interface Props {
  readonly api: ContentOsApiClient;
  readonly contentPackageId: string;
  readonly configuredMode: 'deferred' | ContentModeDto;
  readonly active: boolean;
  readonly onDirtyChange: (dirty: boolean) => void;
  readonly onBusyChange: (busy: boolean) => void;
  readonly onUnauthenticated: () => void;
}

const clone = (body: BlogBodyDto): BlogBodyDto => JSON.parse(JSON.stringify(body)) as BlogBodyDto;

export function OpinionBlogPanel({
  api,
  contentPackageId,
  configuredMode,
  active,
  onDirtyChange,
  onBusyChange,
  onUnauthenticated,
}: Props) {
  const [opinion, setOpinion] = useState<OpinionResource | null>(null);
  const [raw, setRaw] = useState('');
  const [statement, setStatement] = useState('');
  const [blog, setBlog] = useState<BlogResource | null>(null);
  const [draft, setDraft] = useState<BlogBodyDto | null>(null);
  const [mode, setMode] = useState<ContentModeDto>(configuredMode === 'creator_led' ? 'creator_led' : 'research_based');
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
  };
  const load = async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const opinionResponse = await api.getOpinion(contentPackageId);
      setOpinion(opinionResponse.data.opinion);
      setStatement(opinionResponse.data.opinion?.interpretation ?? '');
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
      else setError('Opinion and Blog status could not be loaded.');
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
    } catch (cause) {
      if (cause instanceof WebApiError && cause.status === 401) onUnauthenticated();
      else if (cause instanceof WebApiError && cause.code === 'APPROVED_RESEARCH_REQUIRED')
        setError('Approve Research before continuing.');
      else if (cause instanceof WebApiError && cause.code === 'CONFIRMED_OPINION_REQUIRED')
        setError('Confirm a current Human Opinion before Creator-led generation.');
      else if (cause instanceof WebApiError && cause.code === 'BLOG_REVISION_CONFLICT')
        setError('A newer Blog Working Copy exists. Reload first.');
      else if (cause instanceof WebApiError && cause.code === 'BLOG_VERSION_NOT_ELIGIBLE')
        setError('The exact Blog Version is no longer eligible. Refresh its dependencies.');
      else setError('The command could not be completed.');
    } finally {
      setBusy(false);
    }
  };
  if (loading) return <p role="status">Loading Opinion and Blog…</p>;
  return (
    <section className="research-panel" aria-labelledby="opinion-blog-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">G2 Opinion & Blog</p>
          <h2 id="opinion-blog-title">Shape the point, then approve the article</h2>
        </div>
        {blog?.approvedVersionId ? <span className="lifecycle active">Approved</span> : null}
      </div>
      {error ? <StatusMessage>{error}</StatusMessage> : null}
      {notice ? <StatusMessage>{notice}</StatusMessage> : null}
      {opinion?.outdated ? (
        <StatusMessage>The confirmed Human Opinion is Outdated because Approved Research changed.</StatusMessage>
      ) : null}
      {blog?.outdated ? (
        <StatusMessage>
          {blog.reviewCandidateOutdated
            ? 'The current Blog Candidate is Outdated; generate a fresh candidate.'
            : 'The Approved Blog is Outdated; review the current candidate.'}
        </StatusMessage>
      ) : null}
      <div className="form-grid">
        <div className="field full-span">
          <label htmlFor="opinion-question">Human Opinion</label>
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
        <div className="form-actions full-span">
          <button
            className="secondary-button"
            type="button"
            disabled={!active || busy || raw.trim() === ''}
            onClick={() =>
              void command(async () => {
                const next = (await api.interpretOpinion(contentPackageId, { rawResponse: raw })).data.opinion;
                if (!next) throw new Error('Opinion interpretation was not returned');
                setOpinion(next);
                setStatement(next.interpretation);
              }, 'Interpretation prepared. Confirm or correct it.')
            }
          >
            Interpret response
          </button>
        </div>
        {opinion ? (
          <>
            <div className="field full-span">
              <label htmlFor="confirmed-opinion">Confirm or correct the interpretation</label>
              <textarea
                id="confirmed-opinion"
                rows={4}
                maxLength={10000}
                value={statement}
                disabled={!active || busy}
                onChange={(event) => setStatement(event.target.value)}
              />
            </div>
            <div className="form-actions full-span">
              <button
                className="secondary-button"
                type="button"
                disabled={!active || busy || statement.trim() === ''}
                onClick={() =>
                  void command(async () => {
                    const next = (
                      await api.confirmOpinion(contentPackageId, {
                        expectedRevision: opinion.revision,
                        confirmedStatement: statement,
                      })
                    ).data.opinion;
                    setOpinion(next);
                  }, 'Immutable Human Opinion Version confirmed.')
                }
              >
                Confirm Human Opinion
              </button>
            </div>
          </>
        ) : null}
        <div className="field">
          <label htmlFor="blog-mode">Blog voice</label>
          <select
            id="blog-mode"
            value={mode}
            disabled={!active || busy}
            onChange={(event) => setMode(event.target.value as ContentModeDto)}
          >
            <option value="creator_led">Creator-led</option>
            <option value="research_based">Research-based</option>
          </select>
        </div>
        <div className="form-actions full-span">
          <button
            className="primary-button"
            type="button"
            disabled={!active || busy || (mode === 'creator_led' && (!opinion?.confirmedVersionId || opinion.outdated))}
            onClick={() =>
              void command(
                async () =>
                  applyBlog(
                    (await api.generateBlog(contentPackageId, { requestId: crypto.randomUUID(), contentMode: mode }))
                      .data.blog,
                  ),
                'Blog Candidate generated from exact Approved dependencies.',
              )
            }
          >
            Generate Blog Candidate
          </button>
        </div>
        {blog && draft ? (
          <>
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
            <div className="form-actions full-span">
              <button
                className="secondary-button"
                type="button"
                disabled={!active || busy || !dirty}
                onClick={() =>
                  void command(
                    async () =>
                      applyBlog(
                        (
                          await api.editBlog(contentPackageId, {
                            expectedRevision: blog.workingCopy.revision,
                            body: draft,
                          })
                        ).data.blog,
                      ),
                    'Blog Working Copy saved.',
                  )
                }
              >
                Save draft
              </button>
              <button
                className="secondary-button"
                type="button"
                disabled={
                  !active || busy || dirty || blog.workingCopy.checkpointedRevision === blog.workingCopy.revision
                }
                onClick={() =>
                  void command(
                    async () =>
                      applyBlog(
                        (await api.checkpointBlog(contentPackageId, { expectedRevision: blog.workingCopy.revision }))
                          .data.blog,
                      ),
                    'Immutable Blog Version checkpointed.',
                  )
                }
              >
                Checkpoint Version
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={
                  !active ||
                  busy ||
                  dirty ||
                  blog.reviewCandidateOutdated ||
                  blog.workingCopy.checkpointedRevision !== blog.workingCopy.revision ||
                  blog.approvedVersionId === blog.latestVersion.id
                }
                onClick={() =>
                  void command(
                    async () =>
                      applyBlog(
                        (await api.approveBlog(contentPackageId, { versionId: blog.latestVersion.id })).data.blog,
                      ),
                    'Exact Blog Version approved.',
                  )
                }
              >
                Approve exact Version
              </button>
              <button
                className="secondary-button"
                type="button"
                disabled={busy || !blog.approvedVersionId || blog.outdated}
                onClick={() =>
                  void command(async () => {
                    const markdown = await api.exportBlog(contentPackageId);
                    const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown' }));
                    const anchor = document.createElement('a');
                    anchor.href = url;
                    anchor.download = 'article.md';
                    anchor.click();
                    URL.revokeObjectURL(url);
                  }, 'Approved article.md exported.')
                }
              >
                Export article.md
              </button>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
