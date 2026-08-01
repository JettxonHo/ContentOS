import { createHash } from 'node:crypto';

import type { ContentPackageId, ContentPackageOwnerId } from '../content-package/content-package.js';

export type WorkflowTemplateId = string & { readonly __brand: 'WorkflowTemplateId' };
export type WorkflowTemplateVersion = string & { readonly __brand: 'WorkflowTemplateVersion' };
export type WorkflowNodeKey = string & { readonly __brand: 'WorkflowNodeKey' };
export type WorkflowInstanceId = string & { readonly __brand: 'WorkflowInstanceId' };
export type WorkflowNodeId = string & { readonly __brand: 'WorkflowNodeId' };
export type WorkflowEventId = string & { readonly __brand: 'WorkflowEventId' };

export const WORKFLOW_TEMPLATE_ID = 'content-package-dual-output' as WorkflowTemplateId;
export const WORKFLOW_TEMPLATE_VERSION = 'v1' as WorkflowTemplateVersion;

export const WORKFLOW_NODE_KINDS = ['work', 'gate'] as const;
export type WorkflowNodeKind = (typeof WORKFLOW_NODE_KINDS)[number];

export const WORKFLOW_INSTANCE_LIFECYCLES = ['active', 'paused', 'completed', 'failed', 'cancelled'] as const;
export type WorkflowInstanceLifecycle = (typeof WORKFLOW_INSTANCE_LIFECYCLES)[number];

export const WORKFLOW_NODE_STATES = [
  'not_ready',
  'ready',
  'running',
  'awaiting_human',
  'completed',
  'failed',
  'skipped',
  'cancelled',
] as const;
export type WorkflowNodeStateValue = (typeof WORKFLOW_NODE_STATES)[number];

export const WORKFLOW_EVENT_TYPE_MAX_LENGTH = 128;
export const WORKFLOW_TEMPLATE_ID_MAX_LENGTH = 128;
export const WORKFLOW_TEMPLATE_VERSION_MAX_LENGTH = 32;
export const WORKFLOW_NODE_KEY_MAX_LENGTH = 128;

export interface WorkflowTemplateNodeDefinition {
  readonly ordinal: number;
  readonly key: string;
  readonly kind: WorkflowNodeKind;
  readonly requiresHumanGate: boolean;
}

export interface WorkflowTemplateEdgeDefinition {
  readonly ordinal: number;
  readonly from: string;
  readonly to: string;
}

export interface WorkflowTemplateDefinition {
  readonly templateId: string;
  readonly templateVersion: string;
  readonly nodes: readonly WorkflowTemplateNodeDefinition[];
  readonly edges: readonly WorkflowTemplateEdgeDefinition[];
}

export interface WorkflowTemplate {
  readonly definition: WorkflowTemplateDefinition;
  readonly definitionSha256: string;
}

export interface WorkflowTemplateCatalogRow {
  readonly templateId: string;
  readonly templateVersion: string;
  readonly definitionSha256: string;
  readonly seededAt: Date;
}

export interface WorkflowTemplateNodeRow {
  readonly templateId: string;
  readonly templateVersion: string;
  readonly nodeKey: string;
  readonly ordinal: number;
  readonly kind: string;
  readonly requiresHumanGate: boolean;
}

export interface WorkflowTemplateEdgeRow {
  readonly templateId: string;
  readonly templateVersion: string;
  readonly ordinal: number;
  readonly fromNodeKey: string;
  readonly toNodeKey: string;
}

export type WorkflowDomainErrorCode =
  'INVALID_WORKFLOW_TEMPLATE' | 'INVALID_WORKFLOW_INSTANCE' | 'INVALID_WORKFLOW_NODE' | 'INVALID_WORKFLOW_EVENT';

export class WorkflowDomainError extends Error {
  constructor(readonly code: WorkflowDomainErrorCode) {
    super(code);
    this.name = 'WorkflowDomainError';
  }
}

export interface WorkflowInstanceState {
  readonly id: WorkflowInstanceId;
  readonly contentPackageId: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
  readonly templateId: WorkflowTemplateId;
  readonly templateVersion: WorkflowTemplateVersion;
  readonly definitionSha256: string;
  readonly lifecycle: WorkflowInstanceLifecycle;
  readonly revision: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface WorkflowNodeState {
  readonly id: WorkflowNodeId;
  readonly workflowInstanceId: WorkflowInstanceId;
  readonly contentPackageId: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
  readonly templateId: WorkflowTemplateId;
  readonly templateVersion: WorkflowTemplateVersion;
  readonly templateNodeKey: WorkflowNodeKey;
  readonly state: WorkflowNodeStateValue;
  readonly revision: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface WorkflowEventPayload {
  readonly [key: string]: JsonValue;
}

export interface WorkflowEventState {
  readonly id: WorkflowEventId;
  readonly workflowInstanceId: WorkflowInstanceId;
  readonly contentPackageId: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
  readonly sequence: number;
  readonly eventType: string;
  readonly payload: WorkflowEventPayload;
  readonly occurredAt: Date;
  readonly workflowNodeId: WorkflowNodeId | null;
}

export type JsonPrimitive = null | boolean | number | string;
export type JsonValue = JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };

const NODE_DEFINITIONS = [
  { ordinal: 1, key: 'source_capture', kind: 'work', requiresHumanGate: false },
  { ordinal: 2, key: 'source_review', kind: 'gate', requiresHumanGate: true },
  { ordinal: 3, key: 'research', kind: 'work', requiresHumanGate: false },
  { ordinal: 4, key: 'research_review', kind: 'gate', requiresHumanGate: true },
  { ordinal: 5, key: 'human_opinion', kind: 'work', requiresHumanGate: false },
  { ordinal: 6, key: 'human_opinion_confirmation', kind: 'gate', requiresHumanGate: true },
  { ordinal: 7, key: 'content_foundation', kind: 'work', requiresHumanGate: false },
  { ordinal: 8, key: 'blog', kind: 'work', requiresHumanGate: false },
  { ordinal: 9, key: 'blog_review', kind: 'gate', requiresHumanGate: true },
  { ordinal: 10, key: 'xiaohongshu', kind: 'work', requiresHumanGate: false },
  { ordinal: 11, key: 'xiaohongshu_review', kind: 'gate', requiresHumanGate: true },
  { ordinal: 12, key: 'design', kind: 'work', requiresHumanGate: false },
  { ordinal: 13, key: 'design_review', kind: 'gate', requiresHumanGate: true },
  { ordinal: 14, key: 'render', kind: 'work', requiresHumanGate: false },
  { ordinal: 15, key: 'final_export_eligibility', kind: 'gate', requiresHumanGate: true },
] as const satisfies readonly WorkflowTemplateNodeDefinition[];

const EDGE_DEFINITIONS = [
  { ordinal: 1, from: 'source_capture', to: 'source_review' },
  { ordinal: 2, from: 'source_review', to: 'research' },
  { ordinal: 3, from: 'research', to: 'research_review' },
  { ordinal: 4, from: 'research_review', to: 'human_opinion' },
  { ordinal: 5, from: 'human_opinion', to: 'human_opinion_confirmation' },
  { ordinal: 6, from: 'human_opinion_confirmation', to: 'content_foundation' },
  { ordinal: 7, from: 'content_foundation', to: 'blog' },
  { ordinal: 8, from: 'blog', to: 'blog_review' },
  { ordinal: 9, from: 'content_foundation', to: 'xiaohongshu' },
  { ordinal: 10, from: 'xiaohongshu', to: 'xiaohongshu_review' },
  { ordinal: 11, from: 'xiaohongshu_review', to: 'design' },
  { ordinal: 12, from: 'design', to: 'design_review' },
  { ordinal: 13, from: 'design_review', to: 'render' },
  { ordinal: 14, from: 'blog_review', to: 'final_export_eligibility' },
  { ordinal: 15, from: 'render', to: 'final_export_eligibility' },
] as const satisfies readonly WorkflowTemplateEdgeDefinition[];

const REQUIRED_DEFINITION_KEYS = ['templateId', 'templateVersion', 'nodes', 'edges'];
const REQUIRED_NODE_KEYS = ['ordinal', 'key', 'kind', 'requiresHumanGate'];
const REQUIRED_EDGE_KEYS = ['ordinal', 'from', 'to'];

function invalid(code: WorkflowDomainErrorCode): never {
  throw new WorkflowDomainError(code);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value).sort();
  return keys.length === expected.length && keys.every((key, index) => key === [...expected].sort()[index]);
}

function boundedNonEmptyString(value: unknown, maxLength: number): value is string {
  return (
    typeof value === 'string' &&
    value.length >= 1 &&
    value.length <= maxLength &&
    value.trim().length >= 1 &&
    !value.includes('\u0000')
  );
}

function finitePositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function validDate(value: unknown): value is Date {
  return value instanceof Date && Number.isFinite(value.getTime());
}

function deepFreeze<T>(value: T): T {
  if (Array.isArray(value)) {
    for (const item of value) deepFreeze(item);
  } else if (isPlainRecord(value)) {
    for (const item of Object.values(value)) deepFreeze(item);
  }
  return Object.freeze(value);
}

function canonicalJsonValue(value: unknown, seen: WeakSet<object>): JsonValue {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) invalid('INVALID_WORKFLOW_TEMPLATE');
    return value;
  }
  if (typeof value !== 'object') invalid('INVALID_WORKFLOW_TEMPLATE');
  if (seen.has(value)) invalid('INVALID_WORKFLOW_TEMPLATE');
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      const result: JsonValue[] = [];
      const ownKeys = Reflect.ownKeys(value);
      const ownKeySet = new Set(ownKeys);
      if (
        ownKeys.length !== value.length + 1 ||
        ownKeys.some((key) => typeof key !== 'string') ||
        !ownKeySet.has('length')
      ) {
        invalid('INVALID_WORKFLOW_TEMPLATE');
      }
      const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length');
      if (!lengthDescriptor || !('value' in lengthDescriptor) || lengthDescriptor.value !== value.length) {
        invalid('INVALID_WORKFLOW_TEMPLATE');
      }
      for (let index = 0; index < value.length; index += 1) {
        const key = String(index);
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (!ownKeySet.has(key) || !descriptor || !('value' in descriptor)) {
          invalid('INVALID_WORKFLOW_TEMPLATE');
        }
        result.push(canonicalJsonValue(descriptor.value, seen));
      }
      return result;
    }
    if (!isPlainRecord(value)) invalid('INVALID_WORKFLOW_TEMPLATE');
    if (Object.getOwnPropertySymbols(value).length > 0) invalid('INVALID_WORKFLOW_TEMPLATE');
    // A null-prototype record is required here: assigning the legal JSON key
    // `__proto__` to an ordinary object would invoke Object.prototype's
    // legacy setter instead of creating an own property.
    const result: Record<string, JsonValue> = Object.create(null) as Record<string, JsonValue>;
    for (const key of Object.keys(value).sort()) {
      result[key] = canonicalJsonValue(value[key], seen);
    }
    return result;
  } finally {
    seen.delete(value);
  }
}

/**
 * Stable JSON for definitions and event payloads. Object keys are sorted at
 * every level, arrays retain their declared order, and non-JSON values fail
 * closed instead of inheriting JSON.stringify's lossy coercions.
 */
export function canonicalWorkflowSerialization(value: unknown): string {
  return JSON.stringify(canonicalJsonValue(value, new WeakSet<object>()));
}

export function workflowDefinitionSha256(definition: WorkflowTemplateDefinition): string {
  return createHash('sha256').update(canonicalWorkflowSerialization(definition), 'utf8').digest('hex');
}

function validateNodeDefinition(value: unknown, ordinal: number): WorkflowTemplateNodeDefinition {
  if (!isPlainRecord(value) || !hasExactKeys(value, REQUIRED_NODE_KEYS)) invalid('INVALID_WORKFLOW_TEMPLATE');
  const key = value.key;
  const kind = value.kind;
  const requiresHumanGate = value.requiresHumanGate;
  if (
    value.ordinal !== ordinal ||
    !boundedNonEmptyString(key, WORKFLOW_NODE_KEY_MAX_LENGTH) ||
    (kind !== 'work' && kind !== 'gate') ||
    typeof requiresHumanGate !== 'boolean' ||
    (kind === 'gate' && requiresHumanGate !== true) ||
    (kind === 'work' && requiresHumanGate !== false)
  ) {
    invalid('INVALID_WORKFLOW_TEMPLATE');
  }
  return {
    ordinal,
    key,
    kind,
    requiresHumanGate,
  };
}

function validateEdgeDefinition(
  value: unknown,
  ordinal: number,
  nodeKeys: ReadonlySet<string>,
): WorkflowTemplateEdgeDefinition {
  if (!isPlainRecord(value) || !hasExactKeys(value, REQUIRED_EDGE_KEYS)) invalid('INVALID_WORKFLOW_TEMPLATE');
  const from = value.from;
  const to = value.to;
  if (
    value.ordinal !== ordinal ||
    !boundedNonEmptyString(from, WORKFLOW_NODE_KEY_MAX_LENGTH) ||
    !boundedNonEmptyString(to, WORKFLOW_NODE_KEY_MAX_LENGTH) ||
    from === to ||
    !nodeKeys.has(from) ||
    !nodeKeys.has(to)
  ) {
    invalid('INVALID_WORKFLOW_TEMPLATE');
  }
  return { ordinal, from, to };
}

/**
 * Validates the one fixed catalog definition. The exact Node and edge arrays
 * are checked so a persisted row set cannot silently become a new v1 graph.
 */
export function validateWorkflowTemplateDefinition(value: unknown): WorkflowTemplateDefinition {
  if (!isPlainRecord(value) || !hasExactKeys(value, REQUIRED_DEFINITION_KEYS)) invalid('INVALID_WORKFLOW_TEMPLATE');
  const templateId = value.templateId;
  const templateVersion = value.templateVersion;
  if (
    typeof templateId !== 'string' ||
    typeof templateVersion !== 'string' ||
    templateId !== WORKFLOW_TEMPLATE_ID ||
    templateVersion !== WORKFLOW_TEMPLATE_VERSION
  ) {
    invalid('INVALID_WORKFLOW_TEMPLATE');
  }
  if (!Array.isArray(value.nodes) || value.nodes.length === 0 || value.nodes.length !== NODE_DEFINITIONS.length) {
    invalid('INVALID_WORKFLOW_TEMPLATE');
  }
  const nodes = value.nodes.map((node, index) => validateNodeDefinition(node, index + 1));
  const nodeKeys = new Set<string>();
  for (const node of nodes) {
    if (nodeKeys.has(node.key)) invalid('INVALID_WORKFLOW_TEMPLATE');
    nodeKeys.add(node.key);
  }
  if (!Array.isArray(value.edges) || value.edges.length === 0 || value.edges.length !== EDGE_DEFINITIONS.length) {
    invalid('INVALID_WORKFLOW_TEMPLATE');
  }
  const edges = value.edges.map((edge, index) => validateEdgeDefinition(edge, index + 1, nodeKeys));
  const edgeKeys = new Set<string>();
  for (const edge of edges) {
    const edgeKey = `${edge.from}\u0000${edge.to}`;
    if (edgeKeys.has(edgeKey)) invalid('INVALID_WORKFLOW_TEMPLATE');
    edgeKeys.add(edgeKey);
  }

  const expectedNodes = JSON.stringify(NODE_DEFINITIONS);
  const expectedEdges = JSON.stringify(EDGE_DEFINITIONS);
  if (JSON.stringify(nodes) !== expectedNodes || JSON.stringify(edges) !== expectedEdges) {
    invalid('INVALID_WORKFLOW_TEMPLATE');
  }
  return deepFreeze({
    templateId,
    templateVersion,
    nodes,
    edges,
  });
}

export function defineWorkflowTemplate(value: unknown, definitionSha256?: unknown): WorkflowTemplate {
  const definition = validateWorkflowTemplateDefinition(value);
  const computedHash = workflowDefinitionSha256(definition);
  if (definitionSha256 !== undefined && definitionSha256 !== computedHash) {
    invalid('INVALID_WORKFLOW_TEMPLATE');
  }
  return deepFreeze({ definition, definitionSha256: computedHash });
}

export function validateWorkflowTemplateCatalog(value: unknown): readonly WorkflowTemplate[] {
  if (!Array.isArray(value) || value.length !== 1) invalid('INVALID_WORKFLOW_TEMPLATE');
  return deepFreeze(
    value.map((entry) => {
      if (!isPlainRecord(entry) || !hasExactKeys(entry, ['definition', 'definitionSha256'])) {
        invalid('INVALID_WORKFLOW_TEMPLATE');
      }
      return defineWorkflowTemplate(entry.definition, entry.definitionSha256);
    }),
  );
}

export function reconstructWorkflowTemplate(input: {
  readonly template: WorkflowTemplateCatalogRow;
  readonly nodes: readonly WorkflowTemplateNodeRow[];
  readonly edges: readonly WorkflowTemplateEdgeRow[];
}): WorkflowTemplate {
  const matchingNodes = input.nodes
    .filter(
      (node) =>
        node.templateId === input.template.templateId && node.templateVersion === input.template.templateVersion,
    )
    .sort((left, right) => left.ordinal - right.ordinal)
    .map((node) => ({
      ordinal: node.ordinal,
      key: node.nodeKey,
      kind: node.kind,
      requiresHumanGate: node.requiresHumanGate,
    }));
  const matchingEdges = input.edges
    .filter(
      (edge) =>
        edge.templateId === input.template.templateId && edge.templateVersion === input.template.templateVersion,
    )
    .sort((left, right) => left.ordinal - right.ordinal)
    .map((edge) => ({
      ordinal: edge.ordinal,
      from: edge.fromNodeKey,
      to: edge.toNodeKey,
    }));
  return defineWorkflowTemplate(
    {
      templateId: input.template.templateId,
      templateVersion: input.template.templateVersion,
      nodes: matchingNodes,
      edges: matchingEdges,
    },
    input.template.definitionSha256,
  );
}

export function assertWorkflowTemplateMatches(
  actual: WorkflowTemplate,
  expectedCatalog: readonly WorkflowTemplate[] = WORKFLOW_TEMPLATE_CATALOG,
): WorkflowTemplate {
  const expected = expectedCatalog.find(
    (entry) =>
      entry.definition.templateId === actual.definition.templateId &&
      entry.definition.templateVersion === actual.definition.templateVersion,
  );
  if (
    !expected ||
    expected.definitionSha256 !== actual.definitionSha256 ||
    canonicalWorkflowSerialization(expected.definition) !== canonicalWorkflowSerialization(actual.definition)
  ) {
    invalid('INVALID_WORKFLOW_TEMPLATE');
  }
  return actual;
}

const CONTENT_PACKAGE_DUAL_OUTPUT_V1_DEFINITION = {
  templateId: WORKFLOW_TEMPLATE_ID,
  templateVersion: WORKFLOW_TEMPLATE_VERSION,
  nodes: NODE_DEFINITIONS,
  edges: EDGE_DEFINITIONS,
} as const satisfies WorkflowTemplateDefinition;

export const CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE = defineWorkflowTemplate(
  CONTENT_PACKAGE_DUAL_OUTPUT_V1_DEFINITION,
);
export const WORKFLOW_TEMPLATE_CATALOG: readonly WorkflowTemplate[] = Object.freeze([
  CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE,
]);
export const CONTENT_PACKAGE_DUAL_OUTPUT_V1_DEFINITION_SHA256 =
  CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE.definitionSha256;

const INSTANCE_LIFECYCLE_SET = new Set<string>(WORKFLOW_INSTANCE_LIFECYCLES);
const NODE_STATE_SET = new Set<string>(WORKFLOW_NODE_STATES);

function requireTemplateBinding(
  template: WorkflowTemplate,
  templateId: string,
  templateVersion: string,
  definitionSha256: string,
  code: WorkflowDomainErrorCode,
): void {
  if (
    template.definition.templateId !== templateId ||
    template.definition.templateVersion !== templateVersion ||
    template.definitionSha256 !== definitionSha256
  ) {
    throw new WorkflowDomainError(code);
  }
}

function validateIdentity(value: unknown, code: WorkflowDomainErrorCode): asserts value is string {
  if (!boundedNonEmptyString(value, 128)) throw new WorkflowDomainError(code);
}

export function defineWorkflowInstance(input: {
  readonly id: WorkflowInstanceId;
  readonly contentPackageId: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
  readonly template: WorkflowTemplate;
  readonly lifecycle: WorkflowInstanceLifecycle;
  readonly revision: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}): WorkflowInstanceState {
  validateIdentity(input.id, 'INVALID_WORKFLOW_INSTANCE');
  validateIdentity(input.contentPackageId, 'INVALID_WORKFLOW_INSTANCE');
  validateIdentity(input.ownerUserId, 'INVALID_WORKFLOW_INSTANCE');
  try {
    assertWorkflowTemplateMatches(input.template);
  } catch {
    invalid('INVALID_WORKFLOW_INSTANCE');
  }
  if (
    !INSTANCE_LIFECYCLE_SET.has(input.lifecycle) ||
    !finitePositiveInteger(input.revision) ||
    !validDate(input.createdAt) ||
    !validDate(input.updatedAt) ||
    input.updatedAt.getTime() < input.createdAt.getTime()
  ) {
    invalid('INVALID_WORKFLOW_INSTANCE');
  }
  return Object.freeze({
    id: input.id,
    contentPackageId: input.contentPackageId,
    ownerUserId: input.ownerUserId,
    templateId: input.template.definition.templateId as WorkflowTemplateId,
    templateVersion: input.template.definition.templateVersion as WorkflowTemplateVersion,
    definitionSha256: input.template.definitionSha256,
    lifecycle: input.lifecycle,
    revision: input.revision,
    createdAt: new Date(input.createdAt.getTime()),
    updatedAt: new Date(input.updatedAt.getTime()),
  });
}

export function rehydrateWorkflowInstance(
  state: WorkflowInstanceState,
  template: WorkflowTemplate,
): WorkflowInstanceState {
  requireTemplateBinding(
    template,
    state.templateId,
    state.templateVersion,
    state.definitionSha256,
    'INVALID_WORKFLOW_INSTANCE',
  );
  return defineWorkflowInstance({ ...state, template });
}

export function defineWorkflowNode(input: {
  readonly id: WorkflowNodeId;
  readonly workflowInstance: WorkflowInstanceState;
  readonly template: WorkflowTemplate;
  readonly templateNodeKey: WorkflowNodeKey;
  readonly state: WorkflowNodeStateValue;
  readonly revision: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}): WorkflowNodeState {
  validateIdentity(input.id, 'INVALID_WORKFLOW_NODE');
  validateIdentity(input.workflowInstance.id, 'INVALID_WORKFLOW_NODE');
  try {
    assertWorkflowTemplateMatches(input.template);
  } catch {
    invalid('INVALID_WORKFLOW_NODE');
  }
  requireTemplateBinding(
    input.template,
    input.workflowInstance.templateId,
    input.workflowInstance.templateVersion,
    input.workflowInstance.definitionSha256,
    'INVALID_WORKFLOW_NODE',
  );
  if (
    !boundedNonEmptyString(input.templateNodeKey, WORKFLOW_NODE_KEY_MAX_LENGTH) ||
    !input.template.definition.nodes.some((node) => node.key === input.templateNodeKey) ||
    !NODE_STATE_SET.has(input.state) ||
    !finitePositiveInteger(input.revision) ||
    !validDate(input.createdAt) ||
    !validDate(input.updatedAt) ||
    input.updatedAt.getTime() < input.createdAt.getTime()
  ) {
    invalid('INVALID_WORKFLOW_NODE');
  }
  return Object.freeze({
    id: input.id,
    workflowInstanceId: input.workflowInstance.id,
    contentPackageId: input.workflowInstance.contentPackageId,
    ownerUserId: input.workflowInstance.ownerUserId,
    templateId: input.template.definition.templateId as WorkflowTemplateId,
    templateVersion: input.template.definition.templateVersion as WorkflowTemplateVersion,
    templateNodeKey: input.templateNodeKey,
    state: input.state,
    revision: input.revision,
    createdAt: new Date(input.createdAt.getTime()),
    updatedAt: new Date(input.updatedAt.getTime()),
  });
}

export function rehydrateWorkflowNode(
  state: WorkflowNodeState,
  instance: WorkflowInstanceState,
  template: WorkflowTemplate,
): WorkflowNodeState {
  if (
    state.workflowInstanceId !== instance.id ||
    state.contentPackageId !== instance.contentPackageId ||
    state.ownerUserId !== instance.ownerUserId ||
    state.templateId !== instance.templateId ||
    state.templateVersion !== instance.templateVersion
  ) {
    invalid('INVALID_WORKFLOW_NODE');
  }
  return defineWorkflowNode({
    id: state.id,
    workflowInstance: instance,
    template,
    templateNodeKey: state.templateNodeKey,
    state: state.state,
    revision: state.revision,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
  });
}

function isJsonObject(value: unknown): value is WorkflowEventPayload {
  if (!isPlainRecord(value)) return false;
  try {
    canonicalWorkflowSerialization(value);
    return true;
  } catch {
    return false;
  }
}

export function defineWorkflowEvent(input: {
  readonly id: WorkflowEventId;
  readonly workflowInstance: WorkflowInstanceState;
  readonly sequence: number;
  readonly eventType: string;
  readonly payload: WorkflowEventPayload;
  readonly occurredAt: Date;
  readonly workflowNode?: WorkflowNodeState | null;
}): WorkflowEventState {
  validateIdentity(input.id, 'INVALID_WORKFLOW_EVENT');
  validateIdentity(input.workflowInstance.id, 'INVALID_WORKFLOW_EVENT');
  if (
    !finitePositiveInteger(input.sequence) ||
    !boundedNonEmptyString(input.eventType, WORKFLOW_EVENT_TYPE_MAX_LENGTH) ||
    !isJsonObject(input.payload) ||
    !validDate(input.occurredAt)
  ) {
    invalid('INVALID_WORKFLOW_EVENT');
  }
  if (
    input.workflowNode &&
    (input.workflowNode.workflowInstanceId !== input.workflowInstance.id ||
      input.workflowNode.contentPackageId !== input.workflowInstance.contentPackageId ||
      input.workflowNode.ownerUserId !== input.workflowInstance.ownerUserId)
  ) {
    invalid('INVALID_WORKFLOW_EVENT');
  }
  return Object.freeze({
    id: input.id,
    workflowInstanceId: input.workflowInstance.id,
    contentPackageId: input.workflowInstance.contentPackageId,
    ownerUserId: input.workflowInstance.ownerUserId,
    sequence: input.sequence,
    eventType: input.eventType,
    payload: deepFreeze(input.payload),
    occurredAt: new Date(input.occurredAt.getTime()),
    workflowNodeId: input.workflowNode?.id ?? null,
  });
}

export function rehydrateWorkflowEvent(
  state: WorkflowEventState,
  instance: WorkflowInstanceState,
  node?: WorkflowNodeState | null,
): WorkflowEventState {
  if (
    state.workflowInstanceId !== instance.id ||
    state.contentPackageId !== instance.contentPackageId ||
    state.ownerUserId !== instance.ownerUserId ||
    (state.workflowNodeId !== null && state.workflowNodeId !== node?.id) ||
    (state.workflowNodeId === null && node !== undefined && node !== null)
  ) {
    invalid('INVALID_WORKFLOW_EVENT');
  }
  if (node === undefined) {
    return defineWorkflowEvent({
      id: state.id,
      workflowInstance: instance,
      sequence: state.sequence,
      eventType: state.eventType,
      payload: state.payload,
      occurredAt: state.occurredAt,
    });
  }
  return defineWorkflowEvent({
    id: state.id,
    workflowInstance: instance,
    sequence: state.sequence,
    eventType: state.eventType,
    payload: state.payload,
    occurredAt: state.occurredAt,
    workflowNode: node,
  });
}

export interface WorkflowRepository {
  loadCatalog(): Promise<readonly WorkflowTemplate[]>;
  findTemplate(
    templateId: WorkflowTemplateId,
    templateVersion: WorkflowTemplateVersion,
  ): Promise<WorkflowTemplate | null>;
  findInstanceByIdForOwner(
    instanceId: WorkflowInstanceId,
    contentPackageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
  ): Promise<WorkflowInstanceState | null>;
  findInstanceForPackageOwner(
    contentPackageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
    templateId: WorkflowTemplateId,
    templateVersion: WorkflowTemplateVersion,
  ): Promise<WorkflowInstanceState | null>;
  insertInstance(instance: WorkflowInstanceState): Promise<void>;
  insertNode(node: WorkflowNodeState): Promise<void>;
  appendEvent(event: WorkflowEventState): Promise<void>;
}
