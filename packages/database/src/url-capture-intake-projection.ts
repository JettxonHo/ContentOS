import type {
  UrlCaptureIntake,
  UrlCaptureIntakeQueryPort,
  UrlCaptureIntakeQueryScope,
  WorkflowProjectionFailure,
} from '@contentos/core';
import { ContentPackageApplicationError, workflowProjectionFailure } from '@contentos/core';

import type { DatabaseConnection } from './client.js';

interface IntakeRow {
  readonly package_id: string;
  readonly request_id: string | null;
  readonly source_reference_id: string | null;
  readonly role: string | null;
  readonly submitted_url: string | null;
  readonly request_created_at: Date | string | null;
  readonly task_state: string | null;
  readonly task_updated_at: Date | string | null;
  readonly recorded_outcome: string | null;
  readonly recorded_category: string | null;
  readonly safe_code: string | null;
  readonly result_source_id: string | null;
  readonly bound_source_id: string | null;
}

const INTAKE_QUERY = `
SELECT
  package_row.id AS package_id,
  request_row.id AS request_id,
  reference_row.id AS source_reference_id,
  reference_row.role AS role,
  reference_row.submitted_url AS submitted_url,
  request_row.created_at AS request_created_at,
  task_row.state AS task_state,
  task_row.updated_at AS task_updated_at,
  result_row.recorded_outcome AS recorded_outcome,
  result_row.recorded_category AS recorded_category,
  result_row.safe_code AS safe_code,
  result_row.source_id AS result_source_id,
  source_row.id AS bound_source_id
FROM content_packages AS package_row
LEFT JOIN url_capture_requests AS request_row
  ON request_row.content_package_id = package_row.id
  AND request_row.owner_user_id = package_row.owner_user_id
LEFT JOIN url_source_references AS reference_row
  ON reference_row.id = request_row.source_reference_id
  AND reference_row.content_package_id = request_row.content_package_id
  AND reference_row.owner_user_id = request_row.owner_user_id
LEFT JOIN workflow_tasks AS task_row
  ON task_row.url_capture_request_id = request_row.id
  AND task_row.content_package_id = request_row.content_package_id
  AND task_row.owner_user_id = request_row.owner_user_id
LEFT JOIN url_capture_results AS result_row
  ON result_row.task_id = task_row.id
  AND result_row.url_capture_request_id = request_row.id
  AND result_row.source_reference_id = request_row.source_reference_id
  AND result_row.content_package_id = request_row.content_package_id
  AND result_row.owner_user_id = request_row.owner_user_id
LEFT JOIN sources AS source_row
  ON source_row.id = result_row.source_id
  AND source_row.id = request_row.source_reference_id
  AND source_row.content_package_id = request_row.content_package_id
  AND source_row.owner_user_id = request_row.owner_user_id
WHERE package_row.id = $1 AND package_row.owner_user_id = $2
ORDER BY request_row.created_at ASC NULLS LAST, request_row.id ASC NULLS LAST`;

function date(value: Date | string | null): Date {
  const parsed = value instanceof Date ? new Date(value.getTime()) : new Date(value ?? '');
  if (!Number.isFinite(parsed.getTime())) throw new Error('invalid_url_capture_intake_row');
  return parsed;
}

function role(value: string | null): 'primary' | 'supporting' {
  if (value === 'primary' || value === 'supporting') return value;
  throw new Error('invalid_url_capture_intake_row');
}

function base(row: IntakeRow): Omit<UrlCaptureIntake, 'status' | 'failure' | 'sourceId'> {
  if (
    row.request_id === null ||
    row.source_reference_id === null ||
    row.submitted_url === null ||
    row.request_created_at === null ||
    row.task_state === null ||
    row.task_updated_at === null
  ) {
    throw new Error('invalid_url_capture_intake_row');
  }
  return {
    id: row.request_id,
    sourceReferenceId: row.source_reference_id,
    role: role(row.role),
    submittedUrl: row.submitted_url,
    createdAt: date(row.request_created_at),
    updatedAt: date(row.task_updated_at),
  };
}

function failure(row: IntakeRow): WorkflowProjectionFailure {
  const value = workflowProjectionFailure(row.recorded_category, row.safe_code);
  if (value === null) throw new Error('invalid_url_capture_intake_row');
  return value;
}

function map(row: IntakeRow): UrlCaptureIntake {
  const value = base(row);
  if (row.task_state === 'queued') {
    if (row.recorded_outcome !== null) throw new Error('invalid_url_capture_intake_row');
    return { ...value, status: 'queued', failure: null, sourceId: null };
  }
  if (row.task_state === 'leased') {
    if (row.recorded_outcome !== null) throw new Error('invalid_url_capture_intake_row');
    return { ...value, status: 'running', failure: null, sourceId: null };
  }
  if (row.task_state === 'failed') {
    if (row.recorded_outcome !== 'failed' || row.result_source_id !== null || row.bound_source_id !== null)
      throw new Error('invalid_url_capture_intake_row');
    return { ...value, status: 'failed', failure: failure(row), sourceId: null };
  }
  if (row.task_state === 'succeeded') {
    if (
      row.recorded_outcome !== 'succeeded' ||
      row.recorded_category !== null ||
      row.safe_code !== null ||
      row.result_source_id === null ||
      row.bound_source_id !== row.result_source_id ||
      row.result_source_id !== value.sourceReferenceId
    )
      throw new Error('invalid_url_capture_intake_row');
    return { ...value, status: 'succeeded', failure: null, sourceId: row.result_source_id };
  }
  throw new Error('invalid_url_capture_intake_row');
}

/** Explicit SQL projection of the fixed v1 URL intake history; it never mutates state. */
export class DrizzleUrlCaptureIntakeProjection implements UrlCaptureIntakeQueryPort {
  constructor(private readonly connection: DatabaseConnection) {}

  async list(scope: UrlCaptureIntakeQueryScope): Promise<readonly UrlCaptureIntake[]> {
    const result = await this.connection.pool.query<IntakeRow>(INTAKE_QUERY, [
      scope.contentPackageId,
      scope.ownerUserId,
    ]);
    const first = result.rows[0];
    if (first === undefined) throw new ContentPackageApplicationError('CONTENT_PACKAGE_NOT_FOUND');
    if (first.request_id === null) return [];
    if (result.rows.length !== 1) throw new Error('invalid_url_capture_intake_row');
    return [map(first)];
  }
}
