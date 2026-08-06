import type { ContentPackageId, ContentPackageOwnerId } from '../content-package/content-package.js';

export type WorkflowProjectionFailure =
  | { readonly category: 'fetch_failed'; readonly code: 'FETCH_FAILED' }
  | { readonly category: 'validation_blocked'; readonly code: 'VALIDATION_BLOCKED' }
  | { readonly category: 'unsupported_content'; readonly code: 'UNSUPPORTED_CONTENT' }
  | { readonly category: 'too_large'; readonly code: 'TOO_LARGE' }
  | { readonly category: 'timeout'; readonly code: 'TIMEOUT' }
  | { readonly category: 'redirect_blocked'; readonly code: 'REDIRECT_BLOCKED' }
  | { readonly category: 'extraction_failed'; readonly code: 'EXTRACTION_FAILED' }
  | { readonly category: 'package_archived'; readonly code: 'PACKAGE_ARCHIVED' }
  | { readonly category: 'source_role_limit'; readonly code: 'SOURCE_ROLE_LIMIT' }
  | { readonly category: 'object_integrity_failed'; readonly code: 'OBJECT_INTEGRITY_FAILED' };

export interface WorkflowQueryScope {
  readonly contentPackageId: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
}

export interface WorkflowTimelinePageScope extends WorkflowQueryScope {
  readonly after: number;
  readonly limit: number;
}

interface WorkflowTaskProjectionBase {
  readonly kind: 'url_capture';
  readonly attemptNumber: number;
  readonly updatedAt: Date;
}

export type WorkflowTaskProjection =
  | (WorkflowTaskProjectionBase & {
      readonly state: 'queued' | 'running' | 'succeeded';
      readonly failure: null;
    })
  | (WorkflowTaskProjectionBase & {
      readonly state: 'failed';
      readonly failure: WorkflowProjectionFailure;
    });

export interface WorkflowNodeProjection {
  readonly key: string;
  readonly ordinal: number;
  readonly kind: 'work' | 'gate';
  readonly requiresHumanGate: boolean;
  readonly state:
    'not_ready' | 'ready' | 'running' | 'awaiting_human' | 'completed' | 'failed' | 'skipped' | 'cancelled';
  readonly revision: number;
  readonly updatedAt: Date;
  readonly task: WorkflowTaskProjection | null;
}

export interface WorkflowProjection {
  readonly instanceId: string;
  readonly templateId: 'content-package-dual-output';
  readonly templateVersion: 'v1';
  readonly lifecycle: 'active' | 'paused' | 'completed' | 'failed' | 'cancelled';
  readonly revision: number;
  readonly latestSequence: number;
  readonly nodes: readonly WorkflowNodeProjection[];
}

export interface WorkflowTimelineItemBase {
  readonly sequence: number;
  readonly nodeKey: string | null;
  readonly occurredAt: Date;
}

export type WorkflowTimelineItem =
  | (WorkflowTimelineItemBase & { readonly kind: 'url_capture_requested.v1' })
  | (WorkflowTimelineItemBase & { readonly kind: 'fetcher_lease_expired.v1'; readonly attemptNumber: number })
  | (WorkflowTimelineItemBase & { readonly kind: 'url_capture_succeeded.v1'; readonly attemptNumber: number })
  | (WorkflowTimelineItemBase & {
      readonly kind: 'url_capture_failed.v1';
      readonly attemptNumber: number;
      readonly failure: WorkflowProjectionFailure;
    })
  | (WorkflowTimelineItemBase & { readonly kind: 'workflow_event.v1' });

export interface WorkflowTimelinePage {
  readonly workflowInstanceId: string | null;
  readonly latestSequence: number;
  readonly items: readonly WorkflowTimelineItem[];
  readonly nextAfter: number | null;
}

/** Provider-neutral owner-scoped Workflow read seam. */
export interface WorkflowQueryPort {
  getProjection(scope: WorkflowQueryScope): Promise<WorkflowProjection | null>;
  listTimeline(scope: WorkflowTimelinePageScope): Promise<WorkflowTimelinePage>;
}

const FAILURE_PAIRS = {
  fetch_failed: 'FETCH_FAILED',
  validation_blocked: 'VALIDATION_BLOCKED',
  unsupported_content: 'UNSUPPORTED_CONTENT',
  too_large: 'TOO_LARGE',
  timeout: 'TIMEOUT',
  redirect_blocked: 'REDIRECT_BLOCKED',
  extraction_failed: 'EXTRACTION_FAILED',
  package_archived: 'PACKAGE_ARCHIVED',
  source_role_limit: 'SOURCE_ROLE_LIMIT',
  object_integrity_failed: 'OBJECT_INTEGRITY_FAILED',
} as const;

export function workflowProjectionFailure(category: unknown, code: unknown): WorkflowProjectionFailure | null {
  if (typeof category !== 'string' || typeof code !== 'string') return null;
  if (!(category in FAILURE_PAIRS)) return null;
  const expected = FAILURE_PAIRS[category as keyof typeof FAILURE_PAIRS];
  return expected === code ? ({ category, code } as WorkflowProjectionFailure) : null;
}

export function workflowTaskState(value: unknown): WorkflowTaskProjection['state'] | null {
  if (value === 'queued' || value === 'succeeded' || value === 'failed') return value;
  return value === 'leased' ? 'running' : null;
}

export interface WorkflowTimelineEventInput {
  readonly sequence: number;
  readonly nodeKey: string | null;
  readonly occurredAt: Date;
  readonly eventType: string;
  readonly payload: unknown;
}

function positiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 1;
}

function field(value: unknown, key: string): unknown {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)[key]
    : undefined;
}

function hasRequestPayload(value: unknown): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return ['captureRequestId', 'sourceReferenceId', 'taskId'].every(
    (key) => typeof record[key] === 'string' && (record[key] as string).length > 0,
  );
}

/** Maps persisted Events to the deliberately small, payload-free public union. */
export function mapWorkflowTimelineEvent(input: WorkflowTimelineEventInput): WorkflowTimelineItem {
  const base: WorkflowTimelineItemBase = {
    sequence: input.sequence,
    nodeKey: input.nodeKey,
    occurredAt: new Date(input.occurredAt.getTime()),
  };
  if (input.eventType === 'url_capture_requested.v1') {
    return hasRequestPayload(input.payload)
      ? { ...base, kind: 'url_capture_requested.v1' }
      : { ...base, kind: 'workflow_event.v1' };
  }

  const attemptKey = input.eventType === 'fetcher_lease_expired.v1' ? 'claimAttemptNumber' : 'attemptNumber';
  const attemptNumber = field(input.payload, attemptKey);
  if (!positiveInteger(attemptNumber)) return { ...base, kind: 'workflow_event.v1' };

  if (input.eventType === 'fetcher_lease_expired.v1') {
    return { ...base, kind: 'fetcher_lease_expired.v1', attemptNumber };
  }
  if (input.eventType === 'url_capture_succeeded.v1') {
    return { ...base, kind: 'url_capture_succeeded.v1', attemptNumber };
  }
  if (input.eventType === 'url_capture_failed.v1') {
    const failure = workflowProjectionFailure(field(input.payload, 'category'), field(input.payload, 'code'));
    return failure
      ? { ...base, kind: 'url_capture_failed.v1', attemptNumber, failure }
      : { ...base, kind: 'workflow_event.v1' };
  }
  return { ...base, kind: 'workflow_event.v1' };
}
