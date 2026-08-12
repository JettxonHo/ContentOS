'use client';

import { useEffect, useMemo, useState } from 'react';

import type { ResearchBodyDto, ResearchResource, ResearchReviewStateDto } from '@contentos/contracts';

import { WebApiError, type ContentOsApiClient } from '../lib/api-client';
import { StatusMessage } from './app-shell';

interface Props {
  readonly api: ContentOsApiClient;
  readonly contentPackageId: string;
  readonly active: boolean;
  readonly onDirtyChange: (dirty: boolean) => void;
  readonly onBusyChange: (busy: boolean) => void;
  readonly onUnauthenticated: () => void;
}

function cloneBody(body: ResearchBodyDto): ResearchBodyDto {
  return JSON.parse(JSON.stringify(body)) as ResearchBodyDto;
}

function message(cause: unknown): string {
  if (!(cause instanceof WebApiError)) return 'Research could not be updated. Try again.';
  switch (cause.code) {
    case 'APPROVED_SOURCE_REQUIRED':
      return 'Approve one Primary Source before generating Research.';
    case 'RESEARCH_REVISION_CONFLICT':
      return 'A newer Research Working Copy exists. Reload before saving.';
    case 'RESEARCH_VERSION_NOT_ELIGIBLE':
      return 'Review every item, keep at least one evidence-backed usable item, and checkpoint the current Sources.';
    case 'RESEARCH_PROVIDER_OUTPUT_INVALID':
      return 'The generated Research failed deterministic validation. No Research Version was created.';
    default:
      return 'Research could not be updated. Try again.';
  }
}

export function ResearchReviewPanel({
  api,
  contentPackageId,
  active,
  onDirtyChange,
  onBusyChange,
  onUnauthenticated,
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
      } else setError('Research status could not be loaded.');
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

  if (loading) return <p role="status">Loading Research…</p>;

  return (
    <section className="research-panel" aria-labelledby="research-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">G1 Research</p>
          <h2 id="research-title">Review evidence-backed Research</h2>
        </div>
        {state?.approvedVersionId ? <span className="lifecycle active">Approved</span> : null}
      </div>
      {error ? <StatusMessage>{error}</StatusMessage> : null}
      {notice ? <StatusMessage>{notice}</StatusMessage> : null}
      {state?.outdated ? (
        <StatusMessage>
          {state.reviewCandidateOutdated
            ? 'Approved Sources changed. The current Research Candidate is Outdated; generate a new candidate.'
            : 'Approved Research is Outdated. Review and approve the current candidate.'}
        </StatusMessage>
      ) : null}
      {!state || !draft ? (
        <div className="empty-state">
          <h3>No Research yet</h3>
          <p>Generate a deterministic candidate from the exact currently Approved Sources.</p>
          <button
            className="primary-button"
            type="button"
            disabled={!active || busy}
            onClick={() =>
              void command(
                async () =>
                  (await api.generateResearch(contentPackageId, { requestId: crypto.randomUUID() })).data.research,
                'Research Candidate generated. Review every item before Approval.',
              )
            }
          >
            Generate Research
          </button>
        </div>
      ) : (
        <div className="form-grid">
          <div className="field full-span">
            <label htmlFor="research-summary">Summary</label>
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
                  aria-label={`Review state for ${item.id}`}
                  value={item.reviewState}
                  disabled={!active || busy}
                  onChange={(event) => setItem(index, { reviewState: event.target.value as ResearchReviewStateDto })}
                >
                  <option value="unreviewed">Unreviewed</option>
                  <option value="accepted">Accepted</option>
                  <option value="corrected">Corrected</option>
                  <option value="excluded">Excluded</option>
                  <option value="needs_verification">Needs verification</option>
                </select>
              </div>
              <textarea
                aria-label={`Research text for ${item.id}`}
                rows={3}
                maxLength={5_000}
                value={item.text}
                disabled={!active || busy}
                onChange={(event) => setItem(index, { text: event.target.value })}
              />
              <details>
                <summary>Evidence ({item.evidence.length})</summary>
                {item.evidence.map((evidence) => (
                  <blockquote key={`${evidence.sourceVersionId}-${evidence.paragraphIndex}`}>
                    {evidence.snippet}
                    <footer>
                      Source Version {evidence.sourceVersionId} · paragraph {evidence.paragraphIndex + 1}
                    </footer>
                  </blockquote>
                ))}
              </details>
            </article>
          ))}
          <div className="field full-span">
            <label htmlFor="research-questions">Open questions</label>
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
          <div className="form-actions full-span">
            {state.reviewCandidateOutdated ? (
              <button
                className="secondary-button"
                type="button"
                disabled={!active || busy || dirty}
                onClick={() =>
                  void command(
                    async () =>
                      (await api.generateResearch(contentPackageId, { requestId: crypto.randomUUID() })).data.research,
                    'Fresh Research Candidate generated from the current Approved Sources.',
                  )
                }
              >
                Generate new Research
              </button>
            ) : null}
            <button
              className="secondary-button"
              type="button"
              disabled={!active || busy || !dirty}
              onClick={() =>
                void command(
                  async () =>
                    (
                      await api.editResearch(contentPackageId, {
                        expectedRevision: state.workingCopy.revision,
                        body: draft,
                      })
                    ).data.research,
                  'Research Working Copy saved.',
                )
              }
            >
              Save review
            </button>
            <button
              className="secondary-button"
              type="button"
              disabled={
                !active || busy || dirty || state.workingCopy.checkpointedRevision === state.workingCopy.revision
              }
              onClick={() =>
                void command(
                  async () =>
                    (
                      await api.checkpointResearch(contentPackageId, {
                        expectedRevision: state.workingCopy.revision,
                      })
                    ).data.research,
                  'Immutable Research Version checkpointed.',
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
                state.reviewCandidateOutdated ||
                state.approvedVersionId === state.latestVersion.id
              }
              onClick={() =>
                void command(
                  async () =>
                    (
                      await api.approveResearch(contentPackageId, {
                        versionId: state.latestVersion.id,
                      })
                    ).data.research,
                  'Exact Research Version approved.',
                )
              }
            >
              Approve exact Version
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
