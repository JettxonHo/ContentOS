import {
  ContentPackageApplicationError,
  mapWorkflowTimelineEvent,
  workflowProjectionFailure,
  workflowTaskState,
  type WorkflowProjection,
  type WorkflowQueryPort,
  type WorkflowQueryScope,
  type WorkflowTimelinePage,
  type WorkflowTimelinePageScope,
} from '@contentos/core';

import type { DatabaseConnection } from './client.js';

interface ProjectionRow {
  readonly package_id: string;
  readonly instance_id: string | null;
  readonly template_id: string | null;
  readonly template_version: string | null;
  readonly instance_lifecycle: string | null;
  readonly instance_revision: number | null;
  readonly latest_sequence: number | null;
  readonly node_key: string | null;
  readonly node_ordinal: number | null;
  readonly node_kind: string | null;
  readonly requires_human_gate: boolean | null;
  readonly node_state: string | null;
  readonly node_revision: number | null;
  readonly node_updated_at: Date | string | null;
  readonly task_kind: string | null;
  readonly task_state: string | null;
  readonly claim_attempt_number: number | null;
  readonly task_updated_at: Date | string | null;
  readonly recorded_category: string | null;
  readonly safe_code: string | null;
}

interface TimelineRow {
  readonly package_id: string;
  readonly workflow_instance_id: string | null;
  readonly latest_sequence: number | null;
  readonly sequence: number | null;
  readonly node_key: string | null;
  readonly occurred_at: Date | string | null;
  readonly event_type: string | null;
  readonly payload: unknown;
}

const PROJECTION_QUERY = `
WITH package_scope AS (
  SELECT id, owner_user_id
  FROM content_packages
  WHERE id = $1 AND owner_user_id = $2
), selected_instance AS (
  SELECT i.*
  FROM workflow_instances i
  JOIN package_scope p ON p.id = i.content_package_id AND p.owner_user_id = i.owner_user_id
  WHERE i.template_id = 'content-package-dual-output'
    AND i.template_version = 'v1'
)
SELECT
  p.id AS package_id,
  i.id AS instance_id,
  i.template_id,
  i.template_version,
  i.lifecycle AS instance_lifecycle,
  i.revision AS instance_revision,
  COALESCE(high_water.latest_sequence, 0)::int AS latest_sequence,
  n.template_node_key AS node_key,
  template_node.ordinal AS node_ordinal,
  template_node.kind AS node_kind,
  template_node.requires_human_gate,
  n.state AS node_state,
  n.revision AS node_revision,
  n.updated_at AS node_updated_at,
  task.kind AS task_kind,
  task.state AS task_state,
  task.claim_attempt_number,
  task.updated_at AS task_updated_at,
  result.recorded_category,
  result.safe_code
FROM package_scope p
LEFT JOIN selected_instance i ON true
LEFT JOIN LATERAL (
  SELECT max(e.sequence)::int AS latest_sequence
  FROM workflow_events e
  WHERE e.workflow_instance_id = i.id
    AND e.content_package_id = p.id
    AND e.owner_user_id = p.owner_user_id
) high_water ON true
LEFT JOIN workflow_nodes n
  ON n.workflow_instance_id = i.id
 AND n.content_package_id = p.id
 AND n.owner_user_id = p.owner_user_id
LEFT JOIN workflow_template_nodes template_node
  ON template_node.template_id = n.template_id
 AND template_node.template_version = n.template_version
 AND template_node.node_key = n.template_node_key
LEFT JOIN workflow_tasks task
  ON task.workflow_node_id = n.id
 AND task.workflow_instance_id = i.id
 AND task.content_package_id = p.id
 AND task.owner_user_id = p.owner_user_id
 AND task.kind = 'url_capture'
LEFT JOIN url_capture_results result
  ON result.task_id = task.id
 AND result.content_package_id = p.id
 AND result.owner_user_id = p.owner_user_id
ORDER BY template_node.ordinal ASC NULLS LAST`;

const TIMELINE_QUERY = `
WITH package_scope AS (
  SELECT id, owner_user_id
  FROM content_packages
  WHERE id = $1 AND owner_user_id = $2
), selected_instance AS (
  SELECT i.id, i.content_package_id, i.owner_user_id
  FROM workflow_instances i
  JOIN package_scope p ON p.id = i.content_package_id AND p.owner_user_id = i.owner_user_id
  WHERE i.template_id = 'content-package-dual-output'
    AND i.template_version = 'v1'
), high_water AS (
  SELECT COALESCE(max(e.sequence), 0)::int AS latest_sequence
  FROM workflow_events e
  JOIN selected_instance i ON i.id = e.workflow_instance_id
   AND i.content_package_id = e.content_package_id
   AND i.owner_user_id = e.owner_user_id
), event_page AS (
  SELECT e.sequence, e.workflow_node_id, e.occurred_at, e.event_type, e.payload
  FROM workflow_events e
  JOIN selected_instance i ON i.id = e.workflow_instance_id
   AND i.content_package_id = e.content_package_id
   AND i.owner_user_id = e.owner_user_id
  WHERE e.sequence > $3
  ORDER BY e.sequence ASC
  LIMIT $4
)
SELECT
  p.id AS package_id,
  i.id AS workflow_instance_id,
  COALESCE(high_water.latest_sequence, 0)::int AS latest_sequence,
  page.sequence,
  node.template_node_key AS node_key,
  page.occurred_at,
  page.event_type,
  page.payload
FROM package_scope p
LEFT JOIN selected_instance i ON true
LEFT JOIN high_water ON true
LEFT JOIN event_page page ON true
LEFT JOIN workflow_nodes node
  ON node.id = page.workflow_node_id
 AND node.workflow_instance_id = i.id
 AND node.content_package_id = p.id
 AND node.owner_user_id = p.owner_user_id
ORDER BY page.sequence ASC NULLS LAST`;

function date(value: Date | string | null): Date {
  const result = value instanceof Date ? new Date(value.getTime()) : new Date(value ?? '');
  if (!Number.isFinite(result.getTime())) throw new Error('invalid_workflow_query_row');
  return result;
}

function lifecycle(value: string | null): WorkflowProjection['lifecycle'] {
  if (value === 'active' || value === 'paused' || value === 'completed' || value === 'failed' || value === 'cancelled')
    return value;
  throw new Error('invalid_workflow_query_row');
}

function nodeState(value: string | null): WorkflowProjection['nodes'][number]['state'] {
  if (
    value === 'not_ready' ||
    value === 'ready' ||
    value === 'running' ||
    value === 'awaiting_human' ||
    value === 'completed' ||
    value === 'failed' ||
    value === 'skipped' ||
    value === 'cancelled'
  )
    return value;
  throw new Error('invalid_workflow_query_row');
}

/** Explicit-SQL PostgreSQL owner-scoped Workflow projection. */
export class DrizzleWorkflowQueryProjection implements WorkflowQueryPort {
  constructor(private readonly connection: DatabaseConnection) {}

  async getProjection(scope: WorkflowQueryScope): Promise<WorkflowProjection | null> {
    const result = await this.connection.pool.query<ProjectionRow>(PROJECTION_QUERY, [
      scope.contentPackageId,
      scope.ownerUserId,
    ]);
    const first = result.rows[0];
    if (!first) throw new ContentPackageApplicationError('CONTENT_PACKAGE_NOT_FOUND');
    if (first.instance_id === null) return null;
    if (
      first.template_id !== 'content-package-dual-output' ||
      first.template_version !== 'v1' ||
      first.instance_revision === null
    )
      throw new Error('invalid_workflow_query_row');

    const nodes = result.rows.flatMap((row) => {
      if (row.node_key === null) return [];
      if (
        row.node_ordinal === null ||
        row.node_kind === null ||
        row.requires_human_gate === null ||
        row.node_revision === null ||
        row.node_updated_at === null
      )
        throw new Error('invalid_workflow_query_row');
      const taskState = row.task_state === null ? null : workflowTaskState(row.task_state);
      if (
        row.task_state !== null &&
        (row.task_kind !== 'url_capture' ||
          taskState === null ||
          row.claim_attempt_number === null ||
          row.task_updated_at === null)
      ) {
        throw new Error('invalid_workflow_query_row');
      }
      const failure = taskState === 'failed' ? workflowProjectionFailure(row.recorded_category, row.safe_code) : null;
      if (taskState === 'failed' && failure === null) throw new Error('invalid_workflow_query_row');
      const task =
        taskState === null
          ? null
          : taskState === 'failed'
            ? {
                kind: 'url_capture' as const,
                state: taskState,
                attemptNumber: row.claim_attempt_number as number,
                updatedAt: date(row.task_updated_at),
                failure: failure as NonNullable<typeof failure>,
              }
            : {
                kind: 'url_capture' as const,
                state: taskState,
                attemptNumber: row.claim_attempt_number as number,
                updatedAt: date(row.task_updated_at),
                failure: null,
              };
      if (row.node_kind !== 'work' && row.node_kind !== 'gate') throw new Error('invalid_workflow_query_row');
      const kind: 'work' | 'gate' = row.node_kind;
      return [
        {
          key: row.node_key,
          ordinal: row.node_ordinal,
          kind,
          requiresHumanGate: row.requires_human_gate,
          state: nodeState(row.node_state),
          revision: row.node_revision,
          updatedAt: date(row.node_updated_at),
          task,
        },
      ];
    });
    return {
      instanceId: first.instance_id,
      templateId: 'content-package-dual-output',
      templateVersion: 'v1',
      lifecycle: lifecycle(first.instance_lifecycle),
      revision: first.instance_revision,
      latestSequence: first.latest_sequence ?? 0,
      nodes,
    };
  }

  async listTimeline(scope: WorkflowTimelinePageScope): Promise<WorkflowTimelinePage> {
    const result = await this.connection.pool.query<TimelineRow>(TIMELINE_QUERY, [
      scope.contentPackageId,
      scope.ownerUserId,
      scope.after,
      scope.limit + 1,
    ]);
    const first = result.rows[0];
    if (!first) throw new ContentPackageApplicationError('CONTENT_PACKAGE_NOT_FOUND');
    if (first.workflow_instance_id === null) {
      return { workflowInstanceId: null, latestSequence: 0, items: [], nextAfter: null };
    }
    const candidates = result.rows.flatMap((row) => {
      if (row.sequence === null || row.occurred_at === null || row.event_type === null) return [];
      return [
        mapWorkflowTimelineEvent({
          sequence: row.sequence,
          nodeKey: row.node_key,
          occurredAt: date(row.occurred_at),
          eventType: row.event_type,
          payload: row.payload,
        }),
      ];
    });
    const hasMore = candidates.length > scope.limit;
    const items = candidates.slice(0, scope.limit);
    return {
      workflowInstanceId: first.workflow_instance_id,
      latestSequence: first.latest_sequence ?? 0,
      items,
      nextAfter: hasMore ? (items.at(-1)?.sequence ?? null) : null,
    };
  }
}
