import type { PoolClient, QueryResultRow } from 'pg';

import {
  RESEARCH_SCHEMA_VERSION,
  ResearchError,
  createResearchValidationSummary,
  parseResearchValidationSummary,
  researchContentHash,
  validateResearchBody,
  type ApprovedResearchSource,
  type ContentPackageId,
  type ContentPackageOwnerId,
  type ResearchApprovalId,
  type ResearchApprovalState,
  type ResearchArtifactId,
  type ResearchBody,
  type ResearchHeadState,
  type ResearchRepository,
  type ResearchRunId,
  type ResearchState,
  type ResearchVersionId,
  type ResearchVersionState,
  type ResearchWorkingCopyId,
  type ResearchWorkingCopyState,
  type SourceId,
  type SourceVersionId,
} from '@contentos/core';

import type { DatabaseConnection } from './client.js';

interface StateRow extends QueryResultRow {
  readonly research_id: string;
  readonly content_package_id: string;
  readonly wc_id: string;
  readonly wc_body: unknown;
  readonly wc_revision: number;
  readonly wc_checkpointed_revision: number | null;
  readonly wc_base_version_id: string;
  readonly wc_updated_at: Date;
  readonly latest_version_id: string;
  readonly review_candidate_version_id: string;
  readonly approved_version_id: string | null;
  readonly latest_number: number;
  readonly latest_parent_id: string | null;
  readonly latest_body: unknown;
  readonly latest_hash: string;
  readonly latest_origin: 'generated' | 'user_checkpoint';
  readonly latest_created_by: string;
  readonly latest_created_at: Date;
  readonly approved_number: number | null;
  readonly approved_parent_id: string | null;
  readonly approved_body: unknown | null;
  readonly approved_hash: string | null;
  readonly approved_origin: 'generated' | 'user_checkpoint' | null;
  readonly approved_created_by: string | null;
  readonly approved_created_at: Date | null;
  readonly approval_id: string | null;
  readonly approval_approved_at: Date | null;
  readonly approval_validation_summary: unknown | null;
}

interface InputRow extends QueryResultRow {
  readonly source_id: string;
  readonly source_version_id: string;
  readonly role: 'primary' | 'supporting';
  readonly label: string | null;
  readonly text?: string;
}

function sourceInput(row: InputRow): ApprovedResearchSource {
  if (row.text === undefined) throw new ResearchError('INVALID_RESEARCH');
  return {
    sourceId: row.source_id as SourceId,
    sourceVersionId: row.source_version_id as SourceVersionId,
    role: row.role,
    label: row.label,
    text: row.text,
  };
}

function version(
  row: StateRow,
  kind: 'latest' | 'approved',
  sources: readonly Omit<ApprovedResearchSource, 'text'>[],
): ResearchVersionState | null {
  const id = kind === 'latest' ? row.latest_version_id : row.approved_version_id;
  const number = kind === 'latest' ? row.latest_number : row.approved_number;
  const body = kind === 'latest' ? row.latest_body : row.approved_body;
  const hash = kind === 'latest' ? row.latest_hash : row.approved_hash;
  const origin = kind === 'latest' ? row.latest_origin : row.approved_origin;
  const createdBy = kind === 'latest' ? row.latest_created_by : row.approved_created_by;
  const createdAt = kind === 'latest' ? row.latest_created_at : row.approved_created_at;
  if (
    id === null ||
    number === null ||
    body === null ||
    hash === null ||
    origin === null ||
    createdBy === null ||
    createdAt === null
  ) {
    return null;
  }
  return {
    id: id as ResearchVersionId,
    researchId: row.research_id as ResearchArtifactId,
    versionNumber: number,
    parentVersionId: (kind === 'latest' ? row.latest_parent_id : row.approved_parent_id) as ResearchVersionId | null,
    body: validateResearchBody(body),
    sourceInputs: sources,
    origin,
    contentHash: hash,
    createdById: createdBy,
    createdAt,
  };
}

function sameInputs(
  left: readonly Omit<ApprovedResearchSource, 'text'>[],
  right: readonly ApprovedResearchSource[],
): boolean {
  return (
    left.length === right.length &&
    left.every((entry, index) => {
      const candidate = right[index];
      return (
        candidate !== undefined &&
        entry.sourceId === candidate.sourceId &&
        entry.sourceVersionId === candidate.sourceVersionId &&
        entry.role === candidate.role
      );
    })
  );
}

export class DrizzleResearchRepository implements ResearchRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  async isPackageOwned(packageId: ContentPackageId, ownerUserId: ContentPackageOwnerId): Promise<boolean> {
    const result = await this.connection.pool.query(
      'SELECT 1 FROM content_packages WHERE id = $1 AND owner_user_id = $2 LIMIT 1',
      [packageId, ownerUserId],
    );
    return result.rowCount === 1;
  }

  async isPackageActive(packageId: ContentPackageId, ownerUserId: ContentPackageOwnerId): Promise<boolean> {
    const result = await this.connection.pool.query(
      "SELECT 1 FROM content_packages WHERE id = $1 AND owner_user_id = $2 AND lifecycle = 'active' LIMIT 1",
      [packageId, ownerUserId],
    );
    return result.rowCount === 1;
  }

  async approvedSources(
    packageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
  ): Promise<readonly ApprovedResearchSource[]> {
    const result = await this.connection.pool.query<InputRow>(
      `SELECT s.id AS source_id, v.id AS source_version_id, s.role, s.label, v.body->>'text' AS text
       FROM sources s
       JOIN source_heads h ON h.source_id = s.id AND h.owner_user_id = s.owner_user_id
       JOIN source_versions v ON v.id = h.approved_version_id AND v.source_id = s.id
       WHERE s.content_package_id = $1 AND s.owner_user_id = $2
       ORDER BY CASE s.role WHEN 'primary' THEN 0 ELSE 1 END, s.created_at, s.id`,
      [packageId, ownerUserId],
    );
    return result.rows.map(sourceInput);
  }

  private async versionSources(versionId: string): Promise<readonly Omit<ApprovedResearchSource, 'text'>[]> {
    const result = await this.connection.pool.query<InputRow>(
      `SELECT source_id, source_version_id, role, label
       FROM research_version_sources WHERE research_version_id = $1 ORDER BY ordinal`,
      [versionId],
    );
    return result.rows.map((row) => ({
      sourceId: row.source_id as SourceId,
      sourceVersionId: row.source_version_id as SourceVersionId,
      role: row.role,
      label: row.label,
    }));
  }

  async find(packageId: ContentPackageId, ownerUserId: ContentPackageOwnerId): Promise<ResearchState | null> {
    const result = await this.connection.pool.query<StateRow>(
      `SELECT a.id AS research_id, a.content_package_id,
              wc.id AS wc_id, wc.body AS wc_body, wc.revision AS wc_revision,
              wc.checkpointed_revision AS wc_checkpointed_revision, wc.base_version_id AS wc_base_version_id,
              wc.updated_at AS wc_updated_at,
              h.latest_version_id, h.review_candidate_version_id, h.approved_version_id,
              lv.version_number AS latest_number, lv.parent_version_id AS latest_parent_id,
              lv.body AS latest_body, lv.content_hash AS latest_hash, lv.origin AS latest_origin,
              lv.created_by_id AS latest_created_by, lv.created_at AS latest_created_at,
              av.version_number AS approved_number, av.parent_version_id AS approved_parent_id,
              av.body AS approved_body, av.content_hash AS approved_hash, av.origin AS approved_origin,
              av.created_by_id AS approved_created_by, av.created_at AS approved_created_at,
              ap.id AS approval_id, ap.approved_at AS approval_approved_at,
              ap.validation_summary AS approval_validation_summary
       FROM research_artifacts a
       JOIN research_working_copies wc ON wc.research_id = a.id
       JOIN research_heads h ON h.research_id = a.id
       JOIN research_versions lv ON lv.id = h.latest_version_id AND lv.research_id = a.id
       LEFT JOIN research_versions av ON av.id = h.approved_version_id AND av.research_id = a.id
       LEFT JOIN research_approvals ap ON ap.research_id = a.id AND ap.approved_version_id = h.approved_version_id
       WHERE a.content_package_id = $1 AND a.owner_user_id = $2 LIMIT 1`,
      [packageId, ownerUserId],
    );
    const row = result.rows[0];
    if (!row) return null;
    const latestSources = await this.versionSources(row.latest_version_id);
    const approvedSources = row.approved_version_id ? await this.versionSources(row.approved_version_id) : [];
    const latest = version(row, 'latest', latestSources);
    if (!latest) throw new ResearchError('INVALID_RESEARCH');
    const approved = version(row, 'approved', approvedSources);
    const currentSources = await this.approvedSources(packageId, ownerUserId);
    const dependencyVersion = approved ?? latest;
    const workingCopy: ResearchWorkingCopyState = {
      id: row.wc_id as ResearchWorkingCopyId,
      researchId: row.research_id as ResearchArtifactId,
      body: validateResearchBody(row.wc_body),
      revision: row.wc_revision,
      checkpointedRevision: row.wc_checkpointed_revision,
      baseVersionId: row.wc_base_version_id as ResearchVersionId,
      updatedAt: row.wc_updated_at,
    };
    const head: ResearchHeadState = {
      researchId: row.research_id as ResearchArtifactId,
      latestVersionId: row.latest_version_id as ResearchVersionId,
      reviewCandidateVersionId: row.review_candidate_version_id as ResearchVersionId,
      approvedVersionId: row.approved_version_id as ResearchVersionId | null,
    };
    const approval: ResearchApprovalState | null =
      row.approval_id && row.approval_approved_at && row.approved_version_id && row.approval_validation_summary
        ? {
            id: row.approval_id as ResearchApprovalId,
            researchId: row.research_id as ResearchArtifactId,
            approvedVersionId: row.approved_version_id as ResearchVersionId,
            approvedById: String(ownerUserId),
            approvedAt: row.approval_approved_at,
            validationSummary: parseResearchValidationSummary(row.approval_validation_summary),
          }
        : null;
    return {
      researchId: row.research_id as ResearchArtifactId,
      contentPackageId: row.content_package_id as ContentPackageId,
      workingCopy,
      head,
      latestVersion: latest,
      approvedVersion: approved,
      approval,
      outdated: !sameInputs(dependencyVersion.sourceInputs, currentSources),
      reviewCandidateOutdated: !sameInputs(latest.sourceInputs, currentSources),
    };
  }

  private async transaction<T>(run: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.connection.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await run(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private inputSnapshot(sources: readonly ApprovedResearchSource[]): readonly Omit<ApprovedResearchSource, 'text'>[] {
    return sources.map((source) => ({
      sourceId: source.sourceId,
      sourceVersionId: source.sourceVersionId,
      role: source.role,
      label: source.label,
    }));
  }

  async recordFailedGeneration(input: {
    readonly requestId: string;
    readonly runId: ResearchRunId;
    readonly packageId: ContentPackageId;
    readonly ownerUserId: ContentPackageOwnerId;
    readonly providerAlias: string;
    readonly rawOutput: string;
    readonly sources: readonly ApprovedResearchSource[];
    readonly now: Date;
  }): Promise<void> {
    await this.connection.pool.query(
      `INSERT INTO research_runs
       (id, request_id, content_package_id, owner_user_id, provider_alias, input_snapshot, raw_output, state, safe_error_code, created_at)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,'failed','provider_output_invalid',$8)
       ON CONFLICT (request_id, owner_user_id) DO NOTHING`,
      [
        input.runId,
        input.requestId,
        input.packageId,
        input.ownerUserId,
        input.providerAlias,
        JSON.stringify(this.inputSnapshot(input.sources)),
        input.rawOutput,
        input.now,
      ],
    );
  }

  async createGenerated(input: {
    readonly requestId: string;
    readonly runId: ResearchRunId;
    readonly researchId: ResearchArtifactId;
    readonly workingCopyId: ResearchWorkingCopyId;
    readonly versionId: ResearchVersionId;
    readonly packageId: ContentPackageId;
    readonly ownerUserId: ContentPackageOwnerId;
    readonly providerAlias: string;
    readonly rawOutput: string;
    readonly body: ResearchBody;
    readonly sources: readonly ApprovedResearchSource[];
    readonly now: Date;
  }): Promise<ResearchState> {
    await this.transaction(async (client) => {
      const packageResult = await client.query<{ lifecycle: string }>(
        'SELECT lifecycle FROM content_packages WHERE id = $1 AND owner_user_id = $2 FOR UPDATE',
        [input.packageId, input.ownerUserId],
      );
      if (!packageResult.rows[0]) throw new ResearchError('CONTENT_PACKAGE_NOT_FOUND');
      if (packageResult.rows[0].lifecycle !== 'active') throw new ResearchError('PACKAGE_ARCHIVED');

      const prior = await client.query<{ state: string }>(
        'SELECT state FROM research_runs WHERE request_id = $1 AND owner_user_id = $2 FOR UPDATE',
        [input.requestId, input.ownerUserId],
      );
      if (prior.rows[0]?.state === 'succeeded') return;
      if (prior.rows[0]?.state === 'failed') throw new ResearchError('RESEARCH_PROVIDER_OUTPUT_INVALID');

      const currentSourceResult = await client.query<InputRow>(
        `SELECT s.id AS source_id, v.id AS source_version_id, s.role, s.label, v.body->>'text' AS text
         FROM sources s
         JOIN source_heads h ON h.source_id = s.id AND h.owner_user_id = s.owner_user_id
         JOIN source_versions v ON v.id = h.approved_version_id AND v.source_id = s.id
         WHERE s.content_package_id = $1 AND s.owner_user_id = $2
         ORDER BY CASE s.role WHEN 'primary' THEN 0 ELSE 1 END, s.created_at, s.id`,
        [input.packageId, input.ownerUserId],
      );
      const currentSources = currentSourceResult.rows.map(sourceInput);
      if (!sameInputs(this.inputSnapshot(input.sources), currentSources)) {
        throw new ResearchError('RESEARCH_VERSION_NOT_ELIGIBLE');
      }

      const existing = await client.query<{ id: string }>(
        'SELECT id FROM research_artifacts WHERE content_package_id = $1 AND owner_user_id = $2 FOR UPDATE',
        [input.packageId, input.ownerUserId],
      );
      const researchId = (existing.rows[0]?.id ?? input.researchId) as ResearchArtifactId;
      let versionNumber = 1;
      let parentVersionId: string | null = null;
      if (!existing.rows[0]) {
        await client.query(
          'INSERT INTO research_artifacts (id, content_package_id, owner_user_id, created_at) VALUES ($1,$2,$3,$4)',
          [researchId, input.packageId, input.ownerUserId, input.now],
        );
      } else {
        const current = await client.query<{ latest_version_id: string; version_number: number }>(
          `SELECT h.latest_version_id, v.version_number FROM research_heads h
           JOIN research_versions v ON v.id = h.latest_version_id
           WHERE h.research_id = $1 FOR UPDATE`,
          [researchId],
        );
        if (!current.rows[0]) throw new ResearchError('INVALID_RESEARCH');
        versionNumber = current.rows[0].version_number + 1;
        parentVersionId = current.rows[0].latest_version_id;
      }
      await client.query(
        `INSERT INTO research_versions
         (id,research_id,content_package_id,owner_user_id,version_number,parent_version_id,body,content_hash,schema_version,origin,created_by_id,created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,'generated',$4,$10)`,
        [
          input.versionId,
          researchId,
          input.packageId,
          input.ownerUserId,
          versionNumber,
          parentVersionId,
          JSON.stringify(input.body),
          researchContentHash(input.body),
          RESEARCH_SCHEMA_VERSION,
          input.now,
        ],
      );
      for (const [index, source] of input.sources.entries()) {
        await client.query(
          `INSERT INTO research_version_sources
           (research_version_id,research_id,source_id,source_version_id,role,label,ordinal)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [input.versionId, researchId, source.sourceId, source.sourceVersionId, source.role, source.label, index + 1],
        );
      }
      if (!existing.rows[0]) {
        await client.query(
          `INSERT INTO research_working_copies
           (id,research_id,content_package_id,owner_user_id,body,schema_version,revision,checkpointed_revision,base_version_id,updated_at)
           VALUES ($1,$2,$3,$4,$5::jsonb,$6,1,1,$7,$8)`,
          [
            input.workingCopyId,
            researchId,
            input.packageId,
            input.ownerUserId,
            JSON.stringify(input.body),
            RESEARCH_SCHEMA_VERSION,
            input.versionId,
            input.now,
          ],
        );
        await client.query(
          `INSERT INTO research_heads
           (research_id,content_package_id,owner_user_id,working_copy_id,latest_version_id,review_candidate_version_id,approved_version_id,updated_at)
           VALUES ($1,$2,$3,$4,$5,$5,NULL,$6)`,
          [researchId, input.packageId, input.ownerUserId, input.workingCopyId, input.versionId, input.now],
        );
      } else {
        await client.query(
          `UPDATE research_working_copies SET body=$2::jsonb, revision=revision+1,
             checkpointed_revision=revision+1, base_version_id=$3, updated_at=$4
           WHERE research_id=$1`,
          [researchId, JSON.stringify(input.body), input.versionId, input.now],
        );
        await client.query(
          `UPDATE research_heads SET latest_version_id=$2, review_candidate_version_id=$2, updated_at=$3
           WHERE research_id=$1`,
          [researchId, input.versionId, input.now],
        );
      }
      await client.query(
        `INSERT INTO research_runs
         (id,request_id,content_package_id,owner_user_id,provider_alias,input_snapshot,raw_output,state,safe_error_code,research_id,created_at)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,'succeeded',NULL,$8,$9)`,
        [
          input.runId,
          input.requestId,
          input.packageId,
          input.ownerUserId,
          input.providerAlias,
          JSON.stringify(this.inputSnapshot(input.sources)),
          input.rawOutput,
          researchId,
          input.now,
        ],
      );
    });
    const state = await this.find(input.packageId, input.ownerUserId);
    if (!state) throw new ResearchError('RESEARCH_NOT_FOUND');
    return state;
  }

  async updateWorkingCopy(input: {
    readonly packageId: ContentPackageId;
    readonly ownerUserId: ContentPackageOwnerId;
    readonly body: ResearchBody;
    readonly expectedRevision: number;
    readonly now: Date;
  }): Promise<ResearchState> {
    const result = await this.connection.pool.query(
      `UPDATE research_working_copies wc SET body=$3::jsonb, revision=revision+1, checkpointed_revision=NULL, updated_at=$4
       FROM research_artifacts a
       WHERE wc.research_id=a.id AND a.content_package_id=$1 AND a.owner_user_id=$2 AND wc.revision=$5
       RETURNING wc.id`,
      [input.packageId, input.ownerUserId, JSON.stringify(input.body), input.now, input.expectedRevision],
    );
    if (result.rowCount !== 1) {
      if (!(await this.find(input.packageId, input.ownerUserId))) throw new ResearchError('RESEARCH_NOT_FOUND');
      throw new ResearchError('RESEARCH_REVISION_CONFLICT');
    }
    return (await this.find(input.packageId, input.ownerUserId))!;
  }

  async checkpoint(input: {
    readonly packageId: ContentPackageId;
    readonly ownerUserId: ContentPackageOwnerId;
    readonly versionId: ResearchVersionId;
    readonly expectedRevision: number;
    readonly now: Date;
  }): Promise<ResearchState> {
    await this.transaction(async (client) => {
      const result = await client.query<{
        research_id: string;
        body: unknown;
        revision: number;
        checkpointed_revision: number | null;
        base_version_id: string;
        latest_number: number;
      }>(
        `SELECT wc.research_id, wc.body, wc.revision, wc.checkpointed_revision, wc.base_version_id,
                lv.version_number AS latest_number
         FROM research_working_copies wc
         JOIN research_artifacts a ON a.id=wc.research_id
         JOIN research_heads h ON h.research_id=a.id
         JOIN research_versions lv ON lv.id=h.latest_version_id
         WHERE a.content_package_id=$1 AND a.owner_user_id=$2 FOR UPDATE`,
        [input.packageId, input.ownerUserId],
      );
      const row = result.rows[0];
      if (!row) throw new ResearchError('RESEARCH_NOT_FOUND');
      if (row.checkpointed_revision === input.expectedRevision) return;
      if (row.revision !== input.expectedRevision) throw new ResearchError('RESEARCH_REVISION_CONFLICT');
      const body = validateResearchBody(row.body);
      await client.query(
        `INSERT INTO research_versions
         (id,research_id,content_package_id,owner_user_id,version_number,parent_version_id,body,content_hash,schema_version,origin,created_by_id,created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,'user_checkpoint',$4,$10)`,
        [
          input.versionId,
          row.research_id,
          input.packageId,
          input.ownerUserId,
          row.latest_number + 1,
          row.base_version_id,
          JSON.stringify(body),
          researchContentHash(body),
          RESEARCH_SCHEMA_VERSION,
          input.now,
        ],
      );
      await client.query(
        `INSERT INTO research_version_sources
         (research_version_id,research_id,source_id,source_version_id,role,label,ordinal)
         SELECT $1,research_id,source_id,source_version_id,role,label,ordinal
         FROM research_version_sources WHERE research_version_id=$2`,
        [input.versionId, row.base_version_id],
      );
      await client.query(
        `UPDATE research_working_copies SET checkpointed_revision=revision, base_version_id=$2 WHERE research_id=$1`,
        [row.research_id, input.versionId],
      );
      await client.query(
        `UPDATE research_heads SET latest_version_id=$2, review_candidate_version_id=$2, updated_at=$3 WHERE research_id=$1`,
        [row.research_id, input.versionId, input.now],
      );
    });
    return (await this.find(input.packageId, input.ownerUserId))!;
  }

  async approve(input: {
    readonly packageId: ContentPackageId;
    readonly ownerUserId: ContentPackageOwnerId;
    readonly versionId: ResearchVersionId;
    readonly approvalId: ResearchApprovalId;
    readonly now: Date;
  }): Promise<ResearchState> {
    await this.transaction(async (client) => {
      const packageResult = await client.query<{ lifecycle: string }>(
        'SELECT lifecycle FROM content_packages WHERE id = $1 AND owner_user_id = $2 FOR UPDATE',
        [input.packageId, input.ownerUserId],
      );
      if (!packageResult.rows[0]) throw new ResearchError('CONTENT_PACKAGE_NOT_FOUND');
      if (packageResult.rows[0].lifecycle !== 'active') throw new ResearchError('PACKAGE_ARCHIVED');

      const result = await client.query<{
        research_id: string;
        approved_version_id: string | null;
        latest_version_id: string;
        review_candidate_version_id: string;
        version_body: unknown;
      }>(
        `SELECT h.research_id, h.approved_version_id, h.latest_version_id, h.review_candidate_version_id,
                v.body AS version_body
         FROM research_heads h
         JOIN research_artifacts a ON a.id=h.research_id
         JOIN research_versions v ON v.id=$3 AND v.research_id=h.research_id
         WHERE a.content_package_id=$1 AND a.owner_user_id=$2 FOR UPDATE`,
        [input.packageId, input.ownerUserId, input.versionId],
      );
      const row = result.rows[0];
      if (!row) throw new ResearchError('RESEARCH_NOT_FOUND');
      if (row.approved_version_id === input.versionId) return;
      if (row.latest_version_id !== input.versionId || row.review_candidate_version_id !== input.versionId) {
        throw new ResearchError('RESEARCH_VERSION_NOT_ELIGIBLE');
      }

      const versionSourceResult = await client.query<InputRow>(
        `SELECT source_id, source_version_id, role, label
         FROM research_version_sources WHERE research_version_id = $1 ORDER BY ordinal`,
        [input.versionId],
      );
      const currentSourceResult = await client.query<InputRow>(
        `SELECT s.id AS source_id, v.id AS source_version_id, s.role, s.label, v.body->>'text' AS text
         FROM sources s
         JOIN source_heads h ON h.source_id = s.id AND h.owner_user_id = s.owner_user_id
         JOIN source_versions v ON v.id = h.approved_version_id AND v.source_id = s.id
         WHERE s.content_package_id = $1 AND s.owner_user_id = $2
         ORDER BY CASE s.role WHEN 'primary' THEN 0 ELSE 1 END, s.created_at, s.id`,
        [input.packageId, input.ownerUserId],
      );
      const versionSources = versionSourceResult.rows.map((source) => ({
        sourceId: source.source_id as SourceId,
        sourceVersionId: source.source_version_id as SourceVersionId,
        role: source.role,
        label: source.label,
      }));
      if (!sameInputs(versionSources, currentSourceResult.rows.map(sourceInput))) {
        throw new ResearchError('RESEARCH_VERSION_NOT_ELIGIBLE');
      }
      const validationSummary = createResearchValidationSummary(validateResearchBody(row.version_body), versionSources);
      await client.query(
        `INSERT INTO research_approvals
         (id,research_id,approved_version_id,content_package_id,owner_user_id,approved_by_id,validation_summary,approved_at)
         VALUES ($1,$2,$3,$4,$5,$5,$6::jsonb,$7)`,
        [
          input.approvalId,
          row.research_id,
          input.versionId,
          input.packageId,
          input.ownerUserId,
          JSON.stringify(validationSummary),
          input.now,
        ],
      );
      await client.query('UPDATE research_heads SET approved_version_id=$2, updated_at=$3 WHERE research_id=$1', [
        row.research_id,
        input.versionId,
        input.now,
      ]);
    });
    return (await this.find(input.packageId, input.ownerUserId))!;
  }
}
