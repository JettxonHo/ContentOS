import { Ajv2020 } from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';

import {
  parseWorkflowTimelineQuery,
  workflowProjectionResponseSchema,
  workflowTimelinePageResponseSchema,
} from './workflow-query-contracts.js';

describe('Workflow query contracts', () => {
  it('parses the exact bounded Timeline cursor query', () => {
    expect(parseWorkflowTimelineQuery({})).toEqual({ ok: true, value: { after: 0, limit: 20 } });
    expect(parseWorkflowTimelineQuery({ after: '2147483647', limit: '50' })).toEqual({
      ok: true,
      value: { after: 2147483647, limit: 50 },
    });
    for (const query of [
      { extra: '1' },
      { after: '-1' },
      { after: '1.2' },
      { after: '2147483648' },
      { limit: '0' },
      { limit: '01' },
      { after: ['1', '2'] },
    ]) {
      expect(parseWorkflowTimelineQuery(query).ok).toBe(false);
    }
  });

  it('keeps wrappers and nested Workflow resources exact', () => {
    expect(workflowProjectionResponseSchema).toMatchObject({ additionalProperties: false, required: ['data'] });
    expect(workflowTimelinePageResponseSchema).toMatchObject({ additionalProperties: false, required: ['data'] });
    const projection = workflowProjectionResponseSchema.properties?.data;
    const timeline = workflowTimelinePageResponseSchema.properties?.data;
    expect(projection).toMatchObject({ additionalProperties: false, required: ['workflow'] });
    expect(timeline).toMatchObject({
      additionalProperties: false,
      required: ['workflowInstanceId', 'latestSequence', 'items', 'nextAfter'],
    });
  });

  it('validates the discriminated task and Timeline response variants with strict Ajv 2020', () => {
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    const validateProjection = ajv.compile(workflowProjectionResponseSchema);
    const validateTimeline = ajv.compile(workflowTimelinePageResponseSchema);
    const updatedAt = '2026-08-06T00:00:00.000Z';
    const taskBase = { kind: 'url_capture', attemptNumber: 2, updatedAt } as const;
    const projection = {
      data: {
        workflow: {
          instanceId: '00000000-0000-4000-8000-000000000010',
          templateId: 'content-package-dual-output',
          templateVersion: 'v1',
          lifecycle: 'active',
          revision: 1,
          latestSequence: 5,
          nodes: [
            {
              key: 'queued',
              ordinal: 1,
              kind: 'work',
              requiresHumanGate: false,
              state: 'ready',
              revision: 1,
              updatedAt,
              task: { ...taskBase, state: 'queued', failure: null },
            },
            {
              key: 'running',
              ordinal: 2,
              kind: 'work',
              requiresHumanGate: false,
              state: 'running',
              revision: 1,
              updatedAt,
              task: { ...taskBase, state: 'running', failure: null },
            },
            {
              key: 'succeeded',
              ordinal: 3,
              kind: 'work',
              requiresHumanGate: false,
              state: 'completed',
              revision: 1,
              updatedAt,
              task: { ...taskBase, state: 'succeeded', failure: null },
            },
            {
              key: 'failed',
              ordinal: 4,
              kind: 'work',
              requiresHumanGate: false,
              state: 'failed',
              revision: 1,
              updatedAt,
              task: { ...taskBase, state: 'failed', failure: { category: 'timeout', code: 'TIMEOUT' } },
            },
          ],
        },
      },
    };
    expect(validateProjection(projection)).toBe(true);
    expect(validateProjection({ data: { workflow: null } })).toBe(true);

    const failedNode = projection.data.workflow.nodes[3]!;
    const invalidProjectionVariants: unknown[] = [
      { data: { workflow: { ...projection.data.workflow, extra: true } } },
      {
        data: {
          workflow: {
            ...projection.data.workflow,
            nodes: [...projection.data.workflow.nodes.slice(0, 3), { ...failedNode, extra: true }],
          },
        },
      },
      {
        data: {
          workflow: {
            ...projection.data.workflow,
            nodes: [
              ...projection.data.workflow.nodes.slice(0, 3),
              { ...failedNode, task: { ...failedNode.task, extra: true } },
            ],
          },
        },
      },
      {
        data: {
          workflow: {
            ...projection.data.workflow,
            nodes: [
              ...projection.data.workflow.nodes.slice(0, 3),
              {
                ...failedNode,
                task: { ...failedNode.task, failure: { ...failedNode.task.failure, extra: true } },
              },
            ],
          },
        },
      },
      {
        data: {
          workflow: {
            ...projection.data.workflow,
            nodes: [
              {
                ...projection.data.workflow.nodes[0],
                task: { ...taskBase, state: 'failed', failure: null },
              },
            ],
          },
        },
      },
    ];
    for (const candidate of invalidProjectionVariants) expect(validateProjection(candidate)).toBe(false);

    const timeline = {
      data: {
        workflowInstanceId: '00000000-0000-4000-8000-000000000010',
        latestSequence: 5,
        items: [
          { sequence: 1, nodeKey: 'source_capture', occurredAt: updatedAt, kind: 'url_capture_requested.v1' },
          {
            sequence: 2,
            nodeKey: 'source_capture',
            occurredAt: updatedAt,
            kind: 'fetcher_lease_expired.v1',
            attemptNumber: 1,
          },
          {
            sequence: 3,
            nodeKey: 'source_capture',
            occurredAt: updatedAt,
            kind: 'url_capture_succeeded.v1',
            attemptNumber: 2,
          },
          {
            sequence: 4,
            nodeKey: 'source_capture',
            occurredAt: updatedAt,
            kind: 'url_capture_failed.v1',
            attemptNumber: 3,
            failure: { category: 'timeout', code: 'TIMEOUT' },
          },
          { sequence: 5, nodeKey: null, occurredAt: updatedAt, kind: 'workflow_event.v1' },
        ],
        nextAfter: null,
      },
    };
    expect(validateTimeline(timeline)).toBe(true);
    const timelineWithExtra = {
      data: { ...timeline.data, items: [{ ...timeline.data.items[0], extra: true }, ...timeline.data.items.slice(1)] },
    };
    expect(validateTimeline(timelineWithExtra)).toBe(false);
    const failureItem = timeline.data.items[3]!;
    const timelineFailureWithExtra = {
      data: {
        ...timeline.data,
        items: [
          ...timeline.data.items.slice(0, 3),
          { ...failureItem, failure: { ...failureItem.failure, extra: true } },
          timeline.data.items[4],
        ],
      },
    };
    expect(validateTimeline(timelineFailureWithExtra)).toBe(false);
  });
});
