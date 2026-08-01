import { describe, expect, it } from 'vitest';

import {
  CONTENT_PACKAGE_DUAL_OUTPUT_V1_DEFINITION_SHA256,
  CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE,
  canonicalWorkflowSerialization,
  defineWorkflowEvent,
  defineWorkflowInstance,
  defineWorkflowNode,
  reconstructWorkflowTemplate,
  rehydrateWorkflowEvent,
  rehydrateWorkflowInstance,
  validateWorkflowTemplateCatalog,
  validateWorkflowTemplateDefinition,
  WorkflowDomainError,
  type WorkflowEventId,
  type WorkflowEventPayload,
  type WorkflowInstanceId,
  type WorkflowNodeId,
  type WorkflowNodeKey,
} from './workflow.js';
import type { ContentPackageId, ContentPackageOwnerId } from '../content-package/content-package.js';

const ownerId = '00000000-0000-4000-8000-000000000001' as ContentPackageOwnerId;
const packageId = '00000000-0000-4000-8000-000000000002' as ContentPackageId;
const otherPackageId = '00000000-0000-4000-8000-000000000003' as ContentPackageId;
const now = new Date('2026-08-01T00:00:00.000Z');

function expectInvalid(action: () => unknown): void {
  expect(action).toThrowError(new WorkflowDomainError('INVALID_WORKFLOW_TEMPLATE'));
}

function validInstance() {
  return defineWorkflowInstance({
    id: '00000000-0000-4000-8000-000000000010' as WorkflowInstanceId,
    contentPackageId: packageId,
    ownerUserId: ownerId,
    template: CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE,
    lifecycle: 'active',
    revision: 1,
    createdAt: now,
    updatedAt: now,
  });
}

describe('fixed workflow template catalog', () => {
  it('uses the exact canonical serialization and definition hash', () => {
    expect(CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE.definition.nodes).toHaveLength(15);
    expect(CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE.definition.edges).toHaveLength(15);
    expect(CONTENT_PACKAGE_DUAL_OUTPUT_V1_DEFINITION_SHA256).toBe(
      '2eb436927ee3e047a1b6aec6b016d6275606c9f4de28fc1c167ac2aabb4d2a5b',
    );
    expect(canonicalWorkflowSerialization({ b: 2, a: { d: false, c: [2, 1] } })).toBe(
      '{"a":{"c":[2,1],"d":false},"b":2}',
    );
  });

  it('keeps array order and rejects unsupported JSON values', () => {
    expect(canonicalWorkflowSerialization([2, 1])).toBe('[2,1]');
    const extraStringKey = [1];
    Object.defineProperty(extraStringKey, '01', {
      value: 'ignored',
      enumerable: true,
    });
    expect(() => canonicalWorkflowSerialization(extraStringKey)).toThrow(WorkflowDomainError);
    const accessorElement = [1];
    Object.defineProperty(accessorElement, '0', { get: () => 1 });
    expect(() => canonicalWorkflowSerialization(accessorElement)).toThrow(WorkflowDomainError);
    const protoKeyValue = JSON.parse('{"__proto__":{"x":1}}') as unknown;
    expect(canonicalWorkflowSerialization(protoKeyValue)).toBe('{"__proto__":{"x":1}}');
    expect(canonicalWorkflowSerialization(protoKeyValue)).not.toBe(canonicalWorkflowSerialization({}));
    for (const invalid of [undefined, NaN, Infinity, new Date(), new Map(), Symbol('x'), BigInt(1)]) {
      expect(() => canonicalWorkflowSerialization(invalid)).toThrow(WorkflowDomainError);
    }
    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;
    expect(() => canonicalWorkflowSerialization(cyclic)).toThrow(WorkflowDomainError);
  });

  it('rejects each fixed catalog corruption shape before use', () => {
    const base = CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE.definition;
    const clone = () => structuredClone(base) as unknown as Record<string, unknown>;
    const cases: Array<() => unknown> = [
      () => validateWorkflowTemplateDefinition({ ...clone(), nodes: [...base.nodes, base.nodes[0]] }),
      () =>
        validateWorkflowTemplateDefinition({
          ...clone(),
          nodes: base.nodes.map((node, index) => (index === 1 ? { ...node, key: base.nodes[0]!.key } : node)),
        }),
      () =>
        validateWorkflowTemplateDefinition({
          ...clone(),
          edges: base.edges.map((edge, index) => (index === 0 ? { ...edge, to: 'unknown' } : edge)),
        }),
      () =>
        validateWorkflowTemplateDefinition({
          ...clone(),
          edges: base.edges.map((edge, index) => (index === 13 ? { ...edge, to: 'render' } : edge)),
        }),
      () =>
        validateWorkflowTemplateDefinition({
          ...clone(),
          edges: base.edges.map((edge, index) => (index === 0 ? { ...edge, to: edge.from } : edge)),
        }),
      () =>
        validateWorkflowTemplateDefinition({
          ...clone(),
          edges: base.edges.map((edge, index) => (index === 1 ? base.edges[0]! : edge)),
        }),
      () => validateWorkflowTemplateDefinition({ ...clone(), nodes: [] }),
      () =>
        validateWorkflowTemplateDefinition({
          ...clone(),
          nodes: base.nodes.map((node, index) => (index === 0 ? { ...node, key: 'missing_required_node' } : node)),
        }),
      () =>
        validateWorkflowTemplateDefinition({
          ...clone(),
          nodes: base.nodes.map((node, index) => (index === 4 ? { ...node, ordinal: 6 } : node)),
        }),
      () =>
        validateWorkflowTemplateDefinition({
          ...clone(),
          edges: base.edges.map((edge, index) => (index === 4 ? { ...edge, ordinal: 6 } : edge)),
        }),
      () =>
        validateWorkflowTemplateDefinition({
          ...clone(),
          nodes: base.nodes.map((node, index) =>
            index === 1 ? { ...node, kind: 'work', requiresHumanGate: false } : node,
          ),
        }),
      () => validateWorkflowTemplateCatalog([]),
      () => validateWorkflowTemplateCatalog([{ definition: base, definitionSha256: '0'.repeat(64) }]),
    ];
    for (const invalidCase of cases) expectInvalid(invalidCase);
  });

  it('reconstructs rows by ordinal and verifies the catalog hash', () => {
    const definition = CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE.definition;
    const result = reconstructWorkflowTemplate({
      template: {
        templateId: definition.templateId,
        templateVersion: definition.templateVersion,
        definitionSha256: CONTENT_PACKAGE_DUAL_OUTPUT_V1_DEFINITION_SHA256,
        seededAt: now,
      },
      nodes: [...definition.nodes].reverse().map((node) => ({
        templateId: definition.templateId,
        templateVersion: definition.templateVersion,
        nodeKey: node.key,
        ordinal: node.ordinal,
        kind: node.kind,
        requiresHumanGate: node.requiresHumanGate,
      })),
      edges: [...definition.edges].reverse().map((edge) => ({
        templateId: definition.templateId,
        templateVersion: definition.templateVersion,
        ordinal: edge.ordinal,
        fromNodeKey: edge.from,
        toNodeKey: edge.to,
      })),
    });
    expect(result).toEqual(CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE);
  });
});

describe('workflow instance, node, and event values', () => {
  it('validates exact instance binding, lifecycle, revision, and ownership identity', () => {
    const instance = validInstance();
    expect(instance.definitionSha256).toBe(CONTENT_PACKAGE_DUAL_OUTPUT_V1_DEFINITION_SHA256);
    expect(() =>
      rehydrateWorkflowInstance(
        { ...instance, definitionSha256: '0'.repeat(64) },
        CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE,
      ),
    ).toThrow(WorkflowDomainError);
    expect(() =>
      defineWorkflowInstance({ ...instance, template: CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE, revision: 0 }),
    ).toThrow(WorkflowDomainError);
    expect(() =>
      defineWorkflowInstance({
        ...instance,
        template: CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE,
        lifecycle: 'unknown' as never,
      }),
    ).toThrow(WorkflowDomainError);
  });

  it('rejects unknown or duplicate node materialization and cross-instance nodes', () => {
    const instance = validInstance();
    const node = defineWorkflowNode({
      id: '00000000-0000-4000-8000-000000000011' as WorkflowNodeId,
      workflowInstance: instance,
      template: CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE,
      templateNodeKey: 'source_capture' as WorkflowNodeKey,
      state: 'not_ready',
      revision: 1,
      createdAt: now,
      updatedAt: now,
    });
    expect(node.contentPackageId).toBe(packageId);
    expect(() =>
      defineWorkflowNode({
        ...node,
        templateNodeKey: 'unknown' as WorkflowNodeKey,
        workflowInstance: instance,
        template: CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE,
      }),
    ).toThrow(WorkflowDomainError);
    expect(() =>
      defineWorkflowNode({
        ...node,
        state: 'bogus' as never,
        workflowInstance: instance,
        template: CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE,
      }),
    ).toThrow(WorkflowDomainError);
  });

  it('validates append-only event sequence, payload, and same-instance Node binding', () => {
    const instance = validInstance();
    const node = defineWorkflowNode({
      id: '00000000-0000-4000-8000-000000000012' as WorkflowNodeId,
      workflowInstance: instance,
      template: CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE,
      templateNodeKey: 'source_capture' as WorkflowNodeKey,
      state: 'ready',
      revision: 1,
      createdAt: now,
      updatedAt: now,
    });
    const event = defineWorkflowEvent({
      id: '00000000-0000-4000-8000-000000000013' as WorkflowEventId,
      workflowInstance: instance,
      sequence: 1,
      eventType: 'fixture.created',
      payload: {} as WorkflowEventPayload,
      occurredAt: now,
      workflowNode: node,
    });
    expect(event.workflowNodeId).toBe(node.id);
    expect(() => defineWorkflowEvent({ ...event, sequence: 0, workflowInstance: instance })).toThrow(
      WorkflowDomainError,
    );
    expect(() => defineWorkflowEvent({ ...event, payload: [] as never, workflowInstance: instance })).toThrow(
      WorkflowDomainError,
    );
    const otherInstance = defineWorkflowInstance({
      ...instance,
      id: '00000000-0000-4000-8000-000000000014' as WorkflowInstanceId,
      contentPackageId: otherPackageId,
      template: CONTENT_PACKAGE_DUAL_OUTPUT_V1_TEMPLATE,
    });
    expect(() => rehydrateWorkflowEvent(event, otherInstance, node)).toThrow(WorkflowDomainError);
    expect(() => defineWorkflowEvent({ ...event, eventType: ' '.repeat(2), workflowInstance: instance })).toThrow(
      WorkflowDomainError,
    );
  });
});
