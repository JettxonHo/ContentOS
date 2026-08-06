import { describe, expect, it } from 'vitest';

import { mapWorkflowTimelineEvent, workflowProjectionFailure, workflowTaskState } from './workflow-query.js';

const occurredAt = new Date('2026-08-06T00:00:00.000Z');

describe('Workflow Query mapping', () => {
  it('maps the bounded task states and only exact failure pairs', () => {
    expect(workflowTaskState('leased')).toBe('running');
    expect(workflowTaskState('queued')).toBe('queued');
    expect(workflowTaskState('unknown')).toBeNull();
    expect(workflowProjectionFailure('timeout', 'TIMEOUT')).toEqual({ category: 'timeout', code: 'TIMEOUT' });
    expect(workflowProjectionFailure('timeout', 'FETCH_FAILED')).toBeNull();
  });

  it('projects known event variants without copying their raw payload', () => {
    const common = { sequence: 3, nodeKey: 'source_capture', occurredAt };
    expect(
      mapWorkflowTimelineEvent({
        ...common,
        eventType: 'url_capture_requested.v1',
        payload: { captureRequestId: 'private', sourceReferenceId: 'private', taskId: 'private' },
      }),
    ).toEqual({
      ...common,
      kind: 'url_capture_requested.v1',
    });
    expect(
      mapWorkflowTimelineEvent({
        ...common,
        eventType: 'fetcher_lease_expired.v1',
        payload: { claimAttemptNumber: 2 },
      }),
    ).toEqual({
      ...common,
      kind: 'fetcher_lease_expired.v1',
      attemptNumber: 2,
    });
    expect(
      mapWorkflowTimelineEvent({
        ...common,
        eventType: 'url_capture_succeeded.v1',
        payload: { attemptNumber: 3, sourceId: 'private' },
      }),
    ).toEqual({
      ...common,
      kind: 'url_capture_succeeded.v1',
      attemptNumber: 3,
    });
    expect(
      mapWorkflowTimelineEvent({
        ...common,
        eventType: 'url_capture_failed.v1',
        payload: { attemptNumber: 4, category: 'timeout', code: 'TIMEOUT' },
      }),
    ).toEqual({
      ...common,
      kind: 'url_capture_failed.v1',
      attemptNumber: 4,
      failure: { category: 'timeout', code: 'TIMEOUT' },
    });
  });

  it('uses the safe generic variant for unknown or malformed persisted Events', () => {
    const common = { sequence: 9, nodeKey: null, occurredAt };
    expect(
      mapWorkflowTimelineEvent({ ...common, eventType: 'other.internal.v1', payload: { url: 'private' } }),
    ).toEqual({
      ...common,
      kind: 'workflow_event.v1',
    });
    expect(
      mapWorkflowTimelineEvent({
        ...common,
        eventType: 'url_capture_failed.v1',
        payload: { attemptNumber: 1, category: 'timeout', code: 'FETCH_FAILED' },
      }),
    ).toEqual({
      ...common,
      kind: 'workflow_event.v1',
    });
    expect(mapWorkflowTimelineEvent({ ...common, eventType: 'url_capture_requested.v1', payload: {} })).toEqual({
      ...common,
      kind: 'workflow_event.v1',
    });
  });
});
