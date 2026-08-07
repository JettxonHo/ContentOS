import type { WorkflowTimelineItemResource } from '@contentos/contracts';

export interface TimelineItemView {
  readonly sequence: number;
  readonly occurredAt: string;
  readonly label: string;
}

interface TimelineRefreshHandlers<T> {
  readonly onSuccess: (value: T) => void;
  readonly onFailure: (cause: unknown) => void;
  readonly onLoading: (loading: boolean) => void;
}

/** Owns one serialized, latest-cursor refresh stream for the selected Package. */
export class TimelineRefreshCoordinator<T> {
  private generation = 0;
  private packageId: string | null = null;
  private inFlight = false;
  private pendingCursor: (() => number) | null = null;

  constructor(
    private readonly load: (packageId: string, after: number) => Promise<T>,
    private readonly handlers: TimelineRefreshHandlers<T>,
  ) {}

  startSession(packageId: string, cursor: () => number): void {
    this.generation += 1;
    this.packageId = packageId;
    this.inFlight = false;
    this.pendingCursor = null;
    this.run(cursor, this.generation);
  }

  request(cursor: () => number): void {
    if (!this.packageId) return;
    if (this.inFlight) {
      this.pendingCursor = cursor;
      return;
    }
    this.run(cursor, this.generation);
  }

  dispose(): void {
    this.generation += 1;
    this.packageId = null;
    this.inFlight = false;
    this.pendingCursor = null;
  }

  private run(cursor: () => number, generation: number): void {
    const packageId = this.packageId;
    if (!packageId) return;
    this.inFlight = true;
    this.handlers.onLoading(true);
    void this.load(packageId, cursor())
      .then((value) => {
        if (generation !== this.generation) return;
        this.handlers.onSuccess(value);
      })
      .catch((cause: unknown) => {
        if (generation !== this.generation) return;
        this.handlers.onFailure(cause);
      })
      .finally(() => {
        if (generation !== this.generation) return;
        const pending = this.pendingCursor;
        this.pendingCursor = null;
        if (pending) {
          this.run(pending, generation);
          return;
        }
        this.inFlight = false;
        this.handlers.onLoading(false);
      });
  }
}

export function timelineItemView(item: WorkflowTimelineItemResource): TimelineItemView {
  switch (item.kind) {
    case 'url_capture_requested.v1':
      return { sequence: item.sequence, occurredAt: item.occurredAt, label: 'URL capture requested' };
    case 'fetcher_lease_expired.v1':
      return { sequence: item.sequence, occurredAt: item.occurredAt, label: 'URL capture recovery scheduled' };
    case 'url_capture_succeeded.v1':
      return { sequence: item.sequence, occurredAt: item.occurredAt, label: 'URL Source captured' };
    case 'url_capture_failed.v1':
      return { sequence: item.sequence, occurredAt: item.occurredAt, label: failureCopy(item.failure.category) };
    case 'workflow_event.v1':
      return { sequence: item.sequence, occurredAt: item.occurredAt, label: 'Workflow updated' };
  }
}

function failureCopy(
  category: Extract<WorkflowTimelineItemResource, { readonly kind: 'url_capture_failed.v1' }>['failure']['category'],
): string {
  switch (category) {
    case 'validation_blocked':
    case 'redirect_blocked':
      return 'URL capture was blocked safely';
    case 'unsupported_content':
      return 'URL capture found unsupported content';
    case 'too_large':
      return 'URL capture exceeded the size limit';
    case 'timeout':
      return 'URL capture timed out';
    case 'package_archived':
      return 'URL capture stopped because the package is archived';
    case 'source_role_limit':
      return 'URL capture could not add a Source';
    case 'object_integrity_failed':
    case 'extraction_failed':
    case 'fetch_failed':
      return 'URL capture failed';
  }
}

export function appendTimelinePage(
  current: readonly WorkflowTimelineItemResource[],
  incoming: readonly WorkflowTimelineItemResource[],
): readonly WorkflowTimelineItemResource[] {
  const items = new Map<number, WorkflowTimelineItemResource>();
  for (const item of current) items.set(item.sequence, item);
  for (const item of incoming) items.set(item.sequence, item);
  return [...items.values()].sort((left, right) => left.sequence - right.sequence);
}
