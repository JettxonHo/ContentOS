import type { ContractValidationError } from './auth-contracts.js';
import type { PortableJsonSchema } from './error-contract.js';

export interface WorkflowTimelineQuery {
  readonly after: number;
  readonly limit: number;
}

export type WorkflowFailureResource =
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

interface WorkflowTaskProjectionResourceBase {
  readonly kind: 'url_capture';
  readonly attemptNumber: number;
  readonly updatedAt: string;
}

export type WorkflowTaskProjectionResource =
  | (WorkflowTaskProjectionResourceBase & {
      readonly state: 'queued' | 'running' | 'succeeded';
      readonly failure: null;
    })
  | (WorkflowTaskProjectionResourceBase & {
      readonly state: 'failed';
      readonly failure: WorkflowFailureResource;
    });

export interface WorkflowNodeProjectionResource {
  readonly key: string;
  readonly ordinal: number;
  readonly kind: 'work' | 'gate';
  readonly requiresHumanGate: boolean;
  readonly state:
    'not_ready' | 'ready' | 'running' | 'awaiting_human' | 'completed' | 'failed' | 'skipped' | 'cancelled';
  readonly revision: number;
  readonly updatedAt: string;
  readonly task: WorkflowTaskProjectionResource | null;
}

export interface WorkflowProjectionResource {
  readonly instanceId: string;
  readonly templateId: 'content-package-dual-output';
  readonly templateVersion: 'v1';
  readonly lifecycle: 'active' | 'paused' | 'completed' | 'failed' | 'cancelled';
  readonly revision: number;
  readonly latestSequence: number;
  readonly nodes: readonly WorkflowNodeProjectionResource[];
}

export interface WorkflowProjectionResponse {
  readonly data: { readonly workflow: WorkflowProjectionResource | null };
}

interface TimelineBase {
  readonly sequence: number;
  readonly nodeKey: string | null;
  readonly occurredAt: string;
}
export type WorkflowTimelineItemResource =
  | (TimelineBase & { readonly kind: 'url_capture_requested.v1' })
  | (TimelineBase & { readonly kind: 'fetcher_lease_expired.v1'; readonly attemptNumber: number })
  | (TimelineBase & { readonly kind: 'url_capture_succeeded.v1'; readonly attemptNumber: number })
  | (TimelineBase & {
      readonly kind: 'url_capture_failed.v1';
      readonly attemptNumber: number;
      readonly failure: WorkflowFailureResource;
    })
  | (TimelineBase & { readonly kind: 'workflow_event.v1' });

export interface WorkflowTimelinePageResponse {
  readonly data: {
    readonly workflowInstanceId: string | null;
    readonly latestSequence: number;
    readonly items: readonly WorkflowTimelineItemResource[];
    readonly nextAfter: number | null;
  };
}

const failureSchema: PortableJsonSchema = {
  anyOf: [
    ['fetch_failed', 'FETCH_FAILED'],
    ['validation_blocked', 'VALIDATION_BLOCKED'],
    ['unsupported_content', 'UNSUPPORTED_CONTENT'],
    ['too_large', 'TOO_LARGE'],
    ['timeout', 'TIMEOUT'],
    ['redirect_blocked', 'REDIRECT_BLOCKED'],
    ['extraction_failed', 'EXTRACTION_FAILED'],
    ['package_archived', 'PACKAGE_ARCHIVED'],
    ['source_role_limit', 'SOURCE_ROLE_LIMIT'],
    ['object_integrity_failed', 'OBJECT_INTEGRITY_FAILED'],
  ].map(([category, code]): PortableJsonSchema => ({
    type: 'object',
    additionalProperties: false,
    required: ['category', 'code'],
    properties: {
      category: { type: 'string', enum: [category] },
      code: { type: 'string', enum: [code] },
    },
  })),
};
const taskBase: Record<string, PortableJsonSchema> = {
  kind: { type: 'string', enum: ['url_capture'] },
  attemptNumber: { type: 'integer', minimum: 0 },
  updatedAt: { type: 'string' },
};
const taskSchema: PortableJsonSchema = {
  anyOf: [
    {
      type: 'object',
      additionalProperties: false,
      required: ['kind', 'state', 'attemptNumber', 'updatedAt', 'failure'],
      properties: {
        ...taskBase,
        state: { type: 'string', enum: ['queued', 'running', 'succeeded'] },
        failure: { type: 'null' },
      },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['kind', 'state', 'attemptNumber', 'updatedAt', 'failure'],
      properties: {
        ...taskBase,
        state: { type: 'string', enum: ['failed'] },
        failure: failureSchema,
      },
    },
  ],
};
const nodeSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['key', 'ordinal', 'kind', 'requiresHumanGate', 'state', 'revision', 'updatedAt', 'task'],
  properties: {
    key: { type: 'string' },
    ordinal: { type: 'integer', minimum: 1 },
    kind: { type: 'string', enum: ['work', 'gate'] },
    requiresHumanGate: { enum: [true, false] },
    state: {
      type: 'string',
      enum: ['not_ready', 'ready', 'running', 'awaiting_human', 'completed', 'failed', 'skipped', 'cancelled'],
    },
    revision: { type: 'integer', minimum: 1 },
    updatedAt: { type: 'string' },
    task: { anyOf: [taskSchema, { type: 'null' }] },
  },
};
const projectionSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['instanceId', 'templateId', 'templateVersion', 'lifecycle', 'revision', 'latestSequence', 'nodes'],
  properties: {
    instanceId: { type: 'string' },
    templateId: { type: 'string', enum: ['content-package-dual-output'] },
    templateVersion: { type: 'string', enum: ['v1'] },
    lifecycle: { type: 'string', enum: ['active', 'paused', 'completed', 'failed', 'cancelled'] },
    revision: { type: 'integer', minimum: 1 },
    latestSequence: { type: 'integer', minimum: 0 },
    nodes: { type: 'array', items: nodeSchema },
  },
};
export const workflowProjectionResponseSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      additionalProperties: false,
      required: ['workflow'],
      properties: { workflow: { anyOf: [projectionSchema, { type: 'null' }] } },
    },
  },
};

const timelineBase: Record<string, PortableJsonSchema> = {
  sequence: { type: 'integer', minimum: 1 },
  nodeKey: { anyOf: [{ type: 'string' }, { type: 'null' }] },
  occurredAt: { type: 'string' },
};
const timelineItemSchemas: PortableJsonSchema[] = [
  {
    type: 'object',
    additionalProperties: false,
    required: ['sequence', 'nodeKey', 'occurredAt', 'kind'],
    properties: { ...timelineBase, kind: { type: 'string', enum: ['url_capture_requested.v1'] } },
  },
  {
    type: 'object',
    additionalProperties: false,
    required: ['sequence', 'nodeKey', 'occurredAt', 'kind', 'attemptNumber'],
    properties: {
      ...timelineBase,
      kind: { type: 'string', enum: ['fetcher_lease_expired.v1'] },
      attemptNumber: { type: 'integer', minimum: 1 },
    },
  },
  {
    type: 'object',
    additionalProperties: false,
    required: ['sequence', 'nodeKey', 'occurredAt', 'kind', 'attemptNumber'],
    properties: {
      ...timelineBase,
      kind: { type: 'string', enum: ['url_capture_succeeded.v1'] },
      attemptNumber: { type: 'integer', minimum: 1 },
    },
  },
  {
    type: 'object',
    additionalProperties: false,
    required: ['sequence', 'nodeKey', 'occurredAt', 'kind', 'attemptNumber', 'failure'],
    properties: {
      ...timelineBase,
      kind: { type: 'string', enum: ['url_capture_failed.v1'] },
      attemptNumber: { type: 'integer', minimum: 1 },
      failure: failureSchema,
    },
  },
  {
    type: 'object',
    additionalProperties: false,
    required: ['sequence', 'nodeKey', 'occurredAt', 'kind'],
    properties: { ...timelineBase, kind: { type: 'string', enum: ['workflow_event.v1'] } },
  },
];
export const workflowTimelinePageResponseSchema: PortableJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      additionalProperties: false,
      required: ['workflowInstanceId', 'latestSequence', 'items', 'nextAfter'],
      properties: {
        workflowInstanceId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
        latestSequence: { type: 'integer', minimum: 0 },
        items: { type: 'array', items: { anyOf: timelineItemSchemas } },
        nextAfter: { anyOf: [{ type: 'integer', minimum: 1 }, { type: 'null' }] },
      },
    },
  },
};

export function parseWorkflowTimelineQuery(
  input: unknown,
):
  | { readonly ok: true; readonly value: WorkflowTimelineQuery }
  | { readonly ok: false; readonly errors: readonly ContractValidationError[] } {
  if (typeof input !== 'object' || input === null || Array.isArray(input))
    return { ok: false, errors: [{ path: '/', keyword: 'type' }] };
  const record = input as Record<string, unknown>;
  const allowed = new Set(['after', 'limit']);
  for (const [key, value] of Object.entries(record)) {
    if (!allowed.has(key) || typeof value !== 'string')
      return { ok: false, errors: [{ path: `/${key}`, keyword: 'format' }] };
  }
  const parse = (key: 'after' | 'limit', fallback: number, min: number, max: number): number | null => {
    const raw = record[key];
    if (raw === undefined) return fallback;
    if (typeof raw !== 'string' || !/^(?:0|[1-9][0-9]*)$/.test(raw)) return null;
    const value = Number(raw);
    return Number.isSafeInteger(value) && value >= min && value <= max ? value : null;
  };
  const after = parse('after', 0, 0, 2_147_483_647);
  const limit = parse('limit', 20, 1, 50);
  return after === null || limit === null
    ? { ok: false, errors: [{ path: after === null ? '/after' : '/limit', keyword: 'format' }] }
    : { ok: true, value: { after, limit } };
}
