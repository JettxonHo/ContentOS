import type { WorkflowProjectionResponse } from '@contentos/contracts';
import { parseWorkflowNotificationData } from '@contentos/contracts';

import { WebApiError } from './api-client';
import type { ContentOsApiClient } from './api-client';

export type WorkflowRecoveryNotice =
  | { readonly kind: 'projection'; readonly response: WorkflowProjectionResponse }
  | { readonly kind: 'terminal'; readonly status: 401; readonly code: 'UNAUTHENTICATED' }
  | { readonly kind: 'terminal'; readonly status: 404; readonly code: 'CONTENT_PACKAGE_NOT_FOUND' }
  | { readonly kind: 'terminal'; readonly status: 422; readonly code: 'INVALID_REQUEST' };

export interface WorkflowEventSource {
  addEventListener(type: string, listener: (event: { readonly data?: string }) => void): void;
  close(): void;
}

export type WorkflowEventSourceFactory = (
  url: string,
  options: { readonly withCredentials: true },
) => WorkflowEventSource;

function defaultEventSourceFactory(url: string, options: { readonly withCredentials: true }): WorkflowEventSource {
  return new EventSource(url, options) as unknown as WorkflowEventSource;
}

function terminalNotice(error: unknown): Extract<WorkflowRecoveryNotice, { readonly kind: 'terminal' }> | null {
  if (!(error instanceof WebApiError)) return null;
  switch (error.status) {
    case 401:
      return { kind: 'terminal', status: 401, code: 'UNAUTHENTICATED' };
    case 404:
      return { kind: 'terminal', status: 404, code: 'CONTENT_PACKAGE_NOT_FOUND' };
    case 422:
      return { kind: 'terminal', status: 422, code: 'INVALID_REQUEST' };
    default:
      return null;
  }
}

/** Notification-driven recovery; REST Workflow reads remain the source of truth. */
export class WorkflowRecoveryController {
  constructor(
    private readonly api: Pick<ContentOsApiClient, 'workflow'>,
    private readonly apiOrigin: string,
    private readonly eventSourceFactory: WorkflowEventSourceFactory = defaultEventSourceFactory,
  ) {}

  subscribe(contentPackageId: string, listener: (notice: WorkflowRecoveryNotice) => void): () => void {
    let active = true;
    let mode: 'initial' | 'stream' | 'poll' | 'stopped' = 'initial';
    let eventSource: WorkflowEventSource | undefined;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;
    let pollDueAt: number | undefined;
    let currentRequest: AbortController | undefined;
    let refreshPending = false;

    const isPolling = (): boolean => mode === 'poll';

    const closeEventSource = (): void => {
      const current = eventSource;
      eventSource = undefined;
      current?.close();
    };

    const clearPollTimer = (): void => {
      if (pollTimer !== undefined) clearTimeout(pollTimer);
      pollTimer = undefined;
    };

    const stop = (): void => {
      if (!active) return;
      active = false;
      mode = 'stopped';
      refreshPending = false;
      pollDueAt = undefined;
      clearPollTimer();
      closeEventSource();
      const request = currentRequest;
      currentRequest = undefined;
      request?.abort();
    };

    const readProjection = async (): Promise<'success' | 'terminal' | 'recoverable' | 'cancelled'> => {
      const request = new AbortController();
      currentRequest = request;
      try {
        const response = await this.api.workflow(contentPackageId, request.signal);
        if (!active || request.signal.aborted) return 'cancelled';
        listener({ kind: 'projection', response });
        return 'success';
      } catch (error) {
        if (!active || request.signal.aborted) return 'cancelled';
        const terminal = terminalNotice(error);
        if (terminal) {
          listener(terminal);
          stop();
          return 'terminal';
        }
        return 'recoverable';
      } finally {
        if (currentRequest === request) currentRequest = undefined;
      }
    };

    const schedulePoll = (): void => {
      if (!active || mode !== 'poll' || pollTimer !== undefined || pollDueAt === undefined) return;
      const delay = Math.max(0, pollDueAt - Date.now());
      pollTimer = setTimeout(() => {
        pollTimer = undefined;
        resumePolling();
      }, delay);
    };

    const beginPolling = (): void => {
      if (!active || mode === 'stopped') return;
      if (mode === 'poll') return;
      mode = 'poll';
      refreshPending = false;
      closeEventSource();
      pollDueAt = Date.now() + 5_000;
      currentRequest?.abort();
      schedulePoll();
    };

    const runNotificationRefresh = async (): Promise<void> => {
      if (!active || mode !== 'stream') return;
      if (currentRequest !== undefined) {
        refreshPending = true;
        return;
      }
      const result = await readProjection();
      if (!active) return;
      if (isPolling()) {
        resumePolling();
        return;
      }
      if (result === 'recoverable') {
        beginPolling();
        return;
      }
      if (result === 'success' && refreshPending) {
        refreshPending = false;
        void runNotificationRefresh();
      }
    };

    const runPoll = async (): Promise<void> => {
      if (!active || mode !== 'poll') return;
      if (currentRequest !== undefined) return;
      clearPollTimer();
      pollDueAt = undefined;
      const result = await readProjection();
      if (!active || mode !== 'poll') return;
      if (result === 'terminal') return;
      pollDueAt = Date.now() + 5_000;
      schedulePoll();
    };

    const resumePolling = (): void => {
      if (!active || mode !== 'poll') return;
      if (pollDueAt === undefined) return;
      if (pollDueAt > Date.now()) {
        schedulePoll();
        return;
      }
      clearPollTimer();
      if (currentRequest !== undefined) return;
      void runPoll();
    };

    const openStream = (): void => {
      if (!active || mode !== 'stream') return;
      try {
        eventSource = this.eventSourceFactory(
          `${this.apiOrigin}/v1/content-packages/${encodeURIComponent(contentPackageId)}/workflow/stream`,
          { withCredentials: true },
        );
        eventSource.addEventListener('workflow-notification/v1', (event) => {
          if (!active || mode !== 'stream' || typeof event.data !== 'string') {
            beginPolling();
            return;
          }
          try {
            const parsed = parseWorkflowNotificationData(JSON.parse(event.data));
            if (!parsed.ok) {
              beginPolling();
              return;
            }
          } catch {
            beginPolling();
            return;
          }
          void runNotificationRefresh();
        });
        eventSource.addEventListener('error', beginPolling);
        eventSource.addEventListener('keepalive', () => undefined);
      } catch {
        beginPolling();
      }
    };

    void (async (): Promise<void> => {
      const result = await readProjection();
      if (!active) return;
      if (result === 'success') {
        mode = 'stream';
        openStream();
      } else if (result === 'recoverable') {
        beginPolling();
      }
    })();

    return stop;
  }
}
