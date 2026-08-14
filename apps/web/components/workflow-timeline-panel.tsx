'use client';

import { useEffect, useRef, useState } from 'react';

import type { WorkflowTimelineItemResource, WorkflowTimelinePageResponse } from '@contentos/contracts';

import { WebApiError, type ContentOsApiClient } from '../lib/api-client';
import { TimelineRefreshCoordinator, appendTimelinePage, timelineItemView } from '../lib/workflow-timeline-view';
import { formatZhDate } from '../lib/ui-copy';

interface Props {
  readonly api: ContentOsApiClient;
  readonly contentPackageId: string;
  readonly latestSequence: number | null;
  readonly onTerminal: (cause: unknown) => boolean;
}

export function WorkflowTimelinePanel({ api, contentPackageId, latestSequence, onTerminal }: Props) {
  const [items, setItems] = useState<readonly WorkflowTimelineItemResource[]>([]);
  const [nextAfter, setNextAfter] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState('');
  const highestRef = useRef(0);
  const latestSequenceRef = useRef(latestSequence);
  const coordinatorRef = useRef<TimelineRefreshCoordinator<WorkflowTimelinePageResponse> | null>(null);

  useEffect(() => {
    latestSequenceRef.current = latestSequence;
  }, [latestSequence]);

  useEffect(() => {
    const coordinator = new TimelineRefreshCoordinator((packageId, after) => api.workflowTimeline(packageId, after), {
      onSuccess: (response) => {
        highestRef.current = Math.max(highestRef.current, ...response.data.items.map((item) => item.sequence));
        setItems((current) => {
          const merged = appendTimelinePage(current, response.data.items);
          return merged;
        });
        setNextAfter(response.data.nextAfter);
        setStale(false);
        setError('');
      },
      onFailure: (cause) => {
        if (onTerminal(cause)) return;
        setStale(true);
        setError(cause instanceof WebApiError ? '无法刷新运行记录，当前显示上次确认的结果。' : '无法加载运行记录。');
      },
      onLoading: setLoading,
    });
    coordinatorRef.current = coordinator;
    void Promise.resolve().then(() => {
      if (coordinatorRef.current !== coordinator) return;
      setItems([]);
      setNextAfter(null);
      setStale(false);
      setError('');
      highestRef.current = 0;
      coordinator.startSession(contentPackageId, () => 0);
      if ((latestSequenceRef.current ?? 0) > 0) coordinator.request(() => highestRef.current);
    });
    return () => {
      coordinator.dispose();
      if (coordinatorRef.current === coordinator) coordinatorRef.current = null;
    };
  }, [api, contentPackageId, onTerminal]);

  useEffect(() => {
    if (latestSequence !== null && latestSequence > highestRef.current) {
      coordinatorRef.current?.request(() => highestRef.current);
    }
  }, [latestSequence]);

  const highest = items.at(-1)?.sequence ?? 0;

  return (
    <section className="workflow-timeline-panel" aria-labelledby="workflow-timeline-title" aria-busy={loading}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">工作流</p>
          <h2 id="workflow-timeline-title">运行记录</h2>
        </div>
      </div>
      {stale ? (
        <p className="field-error" role="status">
          {error}{' '}
          <button
            className="inline-button"
            type="button"
            onClick={() => coordinatorRef.current?.request(() => highestRef.current)}
          >
            重试加载
          </button>
        </p>
      ) : null}
      {!stale && error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
      {latestSequence !== null && latestSequence > highest ? (
        <p className="help-text">已有更新的权威运行记录。</p>
      ) : null}
      {items.length === 0 && !loading ? <p className="compact-empty">暂无运行记录</p> : null}
      <ol className="timeline-list">
        {items.map((item) => {
          const view = timelineItemView(item);
          return (
            <li key={view.sequence}>
              <strong>{view.label}</strong>
              <time dateTime={view.occurredAt}>{formatZhDate(view.occurredAt)}</time>
            </li>
          );
        })}
      </ol>
      {nextAfter !== null ? (
        <button
          className="secondary-button"
          type="button"
          disabled={loading}
          onClick={() => coordinatorRef.current?.request(() => nextAfter)}
        >
          加载更多
        </button>
      ) : null}
    </section>
  );
}
