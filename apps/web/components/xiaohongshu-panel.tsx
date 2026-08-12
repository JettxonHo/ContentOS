'use client';
import { useEffect, useState } from 'react';
import type { ContentModeDto, XiaohongshuBodyDto, XiaohongshuResource } from '@contentos/contracts';
import { WebApiError } from '../lib/api-client';
import type { ContentOsApiClient } from '../lib/api-client';

const clone = (body: XiaohongshuBodyDto): XiaohongshuBodyDto => JSON.parse(JSON.stringify(body)) as XiaohongshuBodyDto;

export function XiaohongshuPanel({
  api,
  contentPackageId,
  configuredMode,
  active,
  onDirtyChange,
  onBusyChange,
  onUnauthenticated,
}: {
  readonly api: ContentOsApiClient;
  readonly contentPackageId: string;
  readonly configuredMode: 'deferred' | ContentModeDto;
  readonly active: boolean;
  readonly onDirtyChange: (value: boolean) => void;
  readonly onBusyChange: (value: boolean) => void;
  readonly onUnauthenticated: () => void;
}) {
  const [state, setState] = useState<XiaohongshuResource | null>(null);
  const [draft, setDraft] = useState<XiaohongshuBodyDto | null>(null);
  const [mode, setMode] = useState<ContentModeDto | null>(configuredMode === 'deferred' ? null : configuredMode);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const dirty = Boolean(state && draft && JSON.stringify(state.workingCopy.body) !== JSON.stringify(draft));
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  useEffect(() => onBusyChange(busy), [busy, onBusyChange]);
  useEffect(() => {
    let live = true;
    void api
      .getXiaohongshu(contentPackageId)
      .then((response) => {
        if (live) {
          setState(response.data.xiaohongshu);
          setDraft(clone(response.data.xiaohongshu.workingCopy.body));
        }
      })
      .catch((error) => {
        if (error instanceof WebApiError && error.status === 401) onUnauthenticated();
      });
    return () => {
      live = false;
      onDirtyChange(false);
      onBusyChange(false);
    }; /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [contentPackageId]);
  const apply = (next: XiaohongshuResource) => {
    setState(next);
    setDraft(clone(next.workingCopy.body));
  };
  async function command(run: () => Promise<XiaohongshuResource>, success: string) {
    setBusy(true);
    setMessage('');
    try {
      apply(await run());
      setMessage(success);
    } catch (error) {
      if (error instanceof WebApiError && error.status === 401) onUnauthenticated();
      else setMessage('Command failed safely.');
    } finally {
      setBusy(false);
    }
  }
  function move(index: number, offset: number) {
    if (!draft) return;
    const pages = [...draft.pages];
    const target = index + offset;
    if (target < 0 || target >= pages.length) return;
    [pages[index], pages[target]] = [pages[target]!, pages[index]!];
    setDraft({ ...draft, pages });
  }
  async function download(kind: 'post' | 'pages') {
    setBusy(true);
    setMessage('');
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
      setMessage(`Approved ${anchor.download} exported.`);
    } catch (error) {
      if (error instanceof WebApiError && error.status === 401) onUnauthenticated();
      else setMessage('Command failed safely.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-labelledby="xiaohongshu-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Independent output branch</p>
          <h2 id="xiaohongshu-title">Xiaohongshu content</h2>
        </div>
        {state ? (
          <span className={`lifecycle ${state.outdated ? 'archived' : 'active'}`}>
            {state.outdated ? 'Outdated' : state.approvedVersionId ? 'Approved' : 'In review'}
          </span>
        ) : null}
      </div>
      {!state ? (
        <label>
          Xiaohongshu mode
          <select
            value={mode ?? ''}
            onChange={(event) => setMode((event.target.value || null) as ContentModeDto | null)}
          >
            <option value="">Choose a mode</option>
            <option value="creator_led">Creator-led</option>
            <option value="research_based">Research-based</option>
          </select>
        </label>
      ) : (
        <p>
          <strong>Mode:</strong> {state.latestVersion.body.contentMode}
        </p>
      )}
      {!state ? (
        <button
          className="primary-button"
          disabled={!active || busy || mode === null}
          onClick={() =>
            void command(
              async () =>
                (
                  await api.generateXiaohongshu(contentPackageId, {
                    requestId: crypto.randomUUID(),
                    contentMode: mode!,
                  })
                ).data.xiaohongshu,
              'Eight-page Packaging candidate generated.',
            )
          }
        >
          Generate Xiaohongshu Candidate
        </button>
      ) : draft ? (
        <>
          <label>
            Selected Platform Title
            <select
              value={draft.selectedPlatformTitle}
              onChange={(event) => setDraft({ ...draft, selectedPlatformTitle: event.target.value })}
            >
              {draft.platformTitleCandidates.map((candidate) => (
                <option key={candidate} value={candidate}>
                  {candidate}
                </option>
              ))}
            </select>
          </label>
          <div>
            <strong>Platform Title Candidates</strong>
            <ul>
              {draft.platformTitleCandidates.map((candidate) => (
                <li key={candidate}>{candidate}</li>
              ))}
            </ul>
          </div>
          <label>
            Cover Title
            <input
              value={draft.coverTitle}
              onChange={(event) => setDraft({ ...draft, coverTitle: event.target.value })}
            />
          </label>
          <label>
            Cover Subtitle
            <input
              value={draft.coverSubtitle ?? ''}
              onChange={(event) => setDraft({ ...draft, coverSubtitle: event.target.value || null })}
            />
          </label>
          <div className="source-list">
            {draft.pages.map((page, index) => (
              <article className="source-card" key={page.id}>
                <p className="eyebrow">
                  {page.id} · {page.purpose}
                </p>
                <p>
                  <strong>Emphasis:</strong> {page.emphasis} · <strong>Density:</strong> {page.density}
                </p>
                <p>
                  <strong>Visual brief:</strong> {page.visualBrief}
                </p>
                <p>
                  <strong>Research items:</strong> {page.researchItemIds.join(', ')} · <strong>Opinion Version:</strong>{' '}
                  {page.opinionVersionId ?? 'None'}
                </p>
                <label>
                  Page Heading
                  <input
                    value={page.heading}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        pages: draft.pages.map((entry, i) =>
                          i === index ? { ...entry, heading: event.target.value } : entry,
                        ),
                      })
                    }
                  />
                </label>
                <label>
                  Page Content
                  <textarea
                    value={page.content}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        pages: draft.pages.map((entry, i) =>
                          i === index ? { ...entry, content: event.target.value } : entry,
                        ),
                      })
                    }
                  />
                </label>
                <button
                  className="secondary-button"
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  Move page up
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  disabled={index === draft.pages.length - 1}
                  onClick={() => move(index, 1)}
                >
                  Move page down
                </button>
              </article>
            ))}
          </div>
          <label>
            Caption
            <textarea value={draft.caption} onChange={(event) => setDraft({ ...draft, caption: event.target.value })} />
          </label>
          <label>
            CTA
            <input value={draft.cta} onChange={(event) => setDraft({ ...draft, cta: event.target.value })} />
          </label>
          <label>
            Hashtags
            <input
              value={draft.hashtags.join(' ')}
              onChange={(event) => setDraft({ ...draft, hashtags: event.target.value.split(/\s+/).filter(Boolean) })}
            />
          </label>
          <div>
            <strong>Public References</strong>
            <ul>
              {draft.publicReferences.map((reference) => (
                <li key={`${reference.sourceVersionId}:${reference.label}`}>
                  {reference.label} ({reference.sourceVersionId})
                </li>
              ))}
            </ul>
          </div>
          <div className="button-row">
            <button
              className="secondary-button"
              disabled={!active || busy || !dirty}
              onClick={() =>
                void command(
                  async () =>
                    (
                      await api.editXiaohongshu(contentPackageId, {
                        expectedRevision: state.workingCopy.revision,
                        body: draft,
                      })
                    ).data.xiaohongshu,
                  'Xiaohongshu Working Copy saved.',
                )
              }
            >
              Save Xiaohongshu draft
            </button>
            <button
              className="secondary-button"
              disabled={
                !active || busy || dirty || state.workingCopy.checkpointedRevision === state.workingCopy.revision
              }
              onClick={() =>
                void command(
                  async () =>
                    (
                      await api.checkpointXiaohongshu(contentPackageId, {
                        expectedRevision: state.workingCopy.revision,
                      })
                    ).data.xiaohongshu,
                  'Immutable Xiaohongshu Version checkpointed.',
                )
              }
            >
              Checkpoint Xiaohongshu Version
            </button>
            <button
              className="primary-button"
              disabled={
                !active ||
                busy ||
                dirty ||
                state.reviewCandidateOutdated ||
                state.workingCopy.checkpointedRevision !== state.workingCopy.revision ||
                state.approvedVersionId === state.latestVersion.id
              }
              onClick={() =>
                void command(
                  async () =>
                    (await api.approveXiaohongshu(contentPackageId, { versionId: state.latestVersion.id })).data
                      .xiaohongshu,
                  'Exact Xiaohongshu Version approved.',
                )
              }
            >
              Approve Xiaohongshu Version
            </button>
            <button
              className="secondary-button"
              type="button"
              disabled={busy || !state.approvedVersionId || state.outdated}
              onClick={() => void download('post')}
            >
              Export post.md
            </button>
            <button
              className="secondary-button"
              type="button"
              disabled={busy || !state.approvedVersionId || state.outdated}
              onClick={() => void download('pages')}
            >
              Export pages.json
            </button>
          </div>
        </>
      ) : null}
      {message ? <p role="status">{message}</p> : null}
    </section>
  );
}
