import type { PoolClient } from 'pg';
import {
  BlogError,
  validatePackagingPlan,
  validateXiaohongshu,
  validateXiaohongshuBody,
  xiaohongshuBoundToFoundation,
  type ApprovedBlogFoundation,
  type BlogContentMode,
  type ContentPackageId,
  type ContentPackageOwnerId,
  type XiaohongshuRepository,
  type XiaohongshuState,
  type XiaohongshuVersionState,
} from '@contentos/core';
import type { DatabaseConnection } from './client.js';
import { DrizzleBlogRepository } from './blog-repository.js';

interface StateRow {
  artifact_id: string;
  content_package_id: string;
  body: unknown;
  plan: unknown;
  revision: number;
  checkpointed_revision: number | null;
  latest_version_id: string;
  approved_version_id: string | null;
  approval_validation_summary: unknown | null;
  research_version_id: string;
  opinion_version_id: string | null;
  content_mode: BlogContentMode;
  version_number: number;
  created_at: Date;
  current_research_version_id: string;
  current_opinion_version_id: string | null;
  version_body: unknown;
  version_plan: unknown;
  approved_number: number | null;
  approved_body: unknown | null;
  approved_plan: unknown | null;
  approved_research_version_id: string | null;
  approved_opinion_version_id: string | null;
  approved_created_at: Date | null;
}

export class DrizzleXiaohongshuRepository implements XiaohongshuRepository {
  private readonly blog: DrizzleBlogRepository;
  constructor(private readonly connection: DatabaseConnection) {
    this.blog = new DrizzleBlogRepository(connection);
  }
  requireActivePackage(packageId: ContentPackageId, ownerId: ContentPackageOwnerId): Promise<void> {
    return this.blog.requireActivePackage(packageId, ownerId);
  }
  foundation(
    packageId: ContentPackageId,
    ownerId: ContentPackageOwnerId,
    mode: BlogContentMode,
  ): Promise<ApprovedBlogFoundation> {
    return this.blog.foundation(packageId, ownerId, mode);
  }
  private async tx<T>(run: (client: PoolClient) => Promise<T>): Promise<T> {
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
  private map(row: StateRow): XiaohongshuState {
    const body = validateXiaohongshuBody(row.body);
    const versionBody = validateXiaohongshuBody(row.version_body);
    const plan = validatePackagingPlan(row.version_plan);
    const latestVersion: XiaohongshuVersionState = {
      id: row.latest_version_id as never,
      versionNumber: row.version_number,
      body: versionBody,
      plan,
      researchVersionId: row.research_version_id as never,
      opinionVersionId: row.opinion_version_id as never,
      createdAt: row.created_at,
    };
    const approvedVersion =
      row.approved_version_id &&
      row.approved_number !== null &&
      row.approved_body &&
      row.approved_plan &&
      row.approved_research_version_id &&
      row.approved_created_at
        ? {
            id: row.approved_version_id as never,
            versionNumber: row.approved_number,
            body: validateXiaohongshuBody(row.approved_body),
            plan: validatePackagingPlan(row.approved_plan),
            researchVersionId: row.approved_research_version_id as never,
            opinionVersionId: row.approved_opinion_version_id as never,
            createdAt: row.approved_created_at,
          }
        : null;
    const dependenciesCurrent = (version: XiaohongshuVersionState): boolean =>
      version.researchVersionId === row.current_research_version_id &&
      (version.body.contentMode === 'research_based' || version.opinionVersionId === row.current_opinion_version_id);
    return {
      artifactId: row.artifact_id as never,
      packageId: row.content_package_id as never,
      workingCopy: { body, revision: row.revision, checkpointedRevision: row.checkpointed_revision },
      latestVersion,
      approvedVersion,
      approvedVersionId: row.approved_version_id as never,
      outdated: approvedVersion !== null && !dependenciesCurrent(approvedVersion),
      reviewCandidateOutdated: !dependenciesCurrent(latestVersion),
      approvalValidationSummary: row.approval_validation_summary as never,
    };
  }
  async xiaohongshu(packageId: ContentPackageId, ownerId: ContentPackageOwnerId): Promise<XiaohongshuState | null> {
    const result = await this.connection.pool.query<StateRow>(
      `SELECT s.*,v.body AS version_body,v.plan AS version_plan,v.version_number,v.created_at,av.version_number AS approved_number,av.body AS approved_body,av.plan AS approved_plan,av.research_version_id AS approved_research_version_id,av.opinion_version_id AS approved_opinion_version_id,av.created_at AS approved_created_at,rh.approved_version_id AS current_research_version_id,oh.confirmed_version_id AS current_opinion_version_id FROM xiaohongshu_states s JOIN xiaohongshu_versions v ON v.id=s.latest_version_id LEFT JOIN xiaohongshu_versions av ON av.id=s.approved_version_id JOIN research_artifacts ra ON ra.content_package_id=s.content_package_id AND ra.owner_user_id=s.owner_user_id JOIN research_heads rh ON rh.research_id=ra.id LEFT JOIN opinion_artifacts oa ON oa.content_package_id=s.content_package_id AND oa.owner_user_id=s.owner_user_id LEFT JOIN opinion_heads oh ON oh.opinion_id=oa.id WHERE s.content_package_id=$1 AND s.owner_user_id=$2`,
      [packageId, ownerId],
    );
    return result.rows[0] ? this.map(result.rows[0]) : null;
  }
  async create(input: Parameters<XiaohongshuRepository['create']>[0]): Promise<XiaohongshuState> {
    await this.tx(async (client) => {
      const pkg = await client.query<{ lifecycle: string }>(
        'SELECT lifecycle FROM content_packages WHERE id=$1 AND owner_user_id=$2 FOR UPDATE',
        [input.packageId, input.ownerId],
      );
      if (!pkg.rows[0]) throw new BlogError('CONTENT_PACKAGE_NOT_FOUND');
      if (pkg.rows[0].lifecycle !== 'active') throw new BlogError('PACKAGE_ARCHIVED');
      const prior = await client.query(
        'SELECT artifact_id FROM xiaohongshu_runs WHERE request_id=$1 AND owner_user_id=$2',
        [input.requestId, input.ownerId],
      );
      if (prior.rows[0]) return;
      const existing = await client.query<{ artifact_id: string; latest_version_id: string; version_number: number }>(
        'SELECT s.artifact_id,s.latest_version_id,v.version_number FROM xiaohongshu_states s JOIN xiaohongshu_versions v ON v.id=s.latest_version_id WHERE s.content_package_id=$1 AND s.owner_user_id=$2 FOR UPDATE',
        [input.packageId, input.ownerId],
      );
      const artifactId = existing.rows[0]?.artifact_id ?? input.artifactId;
      const number = (existing.rows[0]?.version_number ?? 0) + 1;
      if (!existing.rows[0])
        await client.query(
          `INSERT INTO xiaohongshu_states (artifact_id,content_package_id,owner_user_id,working_copy_id,body,plan,revision,checkpointed_revision,latest_version_id,approved_version_id,approval_validation_summary,research_version_id,opinion_version_id,content_mode,created_at,updated_at) VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,1,1,$7,NULL,NULL,$8,$9,$10,$11,$11)`,
          [
            artifactId,
            input.packageId,
            input.ownerId,
            input.workingCopyId,
            JSON.stringify(input.body),
            JSON.stringify(input.plan),
            input.versionId,
            input.foundation.researchVersionId,
            input.foundation.opinionVersionId,
            input.body.contentMode,
            input.now,
          ],
        );
      await client.query(
        `INSERT INTO xiaohongshu_versions (id,artifact_id,content_package_id,owner_user_id,version_number,body,plan,research_version_id,opinion_version_id,content_mode,origin,created_at) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9,$10,'generated',$11)`,
        [
          input.versionId,
          artifactId,
          input.packageId,
          input.ownerId,
          number,
          JSON.stringify(input.body),
          JSON.stringify(input.plan),
          input.foundation.researchVersionId,
          input.foundation.opinionVersionId,
          input.body.contentMode,
          input.now,
        ],
      );
      if (existing.rows[0])
        await client.query(
          `UPDATE xiaohongshu_states SET body=$2::jsonb,plan=$3::jsonb,revision=revision+1,checkpointed_revision=revision+1,latest_version_id=$4,research_version_id=$5,opinion_version_id=$6,content_mode=$7,updated_at=$8 WHERE artifact_id=$1`,
          [
            artifactId,
            JSON.stringify(input.body),
            JSON.stringify(input.plan),
            input.versionId,
            input.foundation.researchVersionId,
            input.foundation.opinionVersionId,
            input.body.contentMode,
            input.now,
          ],
        );
      await client.query(
        'INSERT INTO xiaohongshu_runs (id,request_id,content_package_id,owner_user_id,provider_alias,raw_output,artifact_id,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        [
          input.runId,
          input.requestId,
          input.packageId,
          input.ownerId,
          input.providerAlias,
          input.rawOutput,
          artifactId,
          input.now,
        ],
      );
    });
    return (await this.xiaohongshu(input.packageId, input.ownerId))!;
  }
  async update(input: Parameters<XiaohongshuRepository['update']>[0]): Promise<XiaohongshuState> {
    const result = await this.connection.pool.query(
      'UPDATE xiaohongshu_states SET body=$3::jsonb,revision=revision+1,checkpointed_revision=NULL,updated_at=$4 WHERE content_package_id=$1 AND owner_user_id=$2 AND revision=$5',
      [input.packageId, input.ownerId, JSON.stringify(input.body), input.now, input.expectedRevision],
    );
    if (result.rowCount !== 1) throw new BlogError('BLOG_REVISION_CONFLICT');
    return (await this.xiaohongshu(input.packageId, input.ownerId))!;
  }
  async checkpoint(input: Parameters<XiaohongshuRepository['checkpoint']>[0]): Promise<XiaohongshuState> {
    await this.tx(async (client) => {
      const state = await client.query<StateRow>(
        'SELECT s.*,v.body AS version_body,v.plan AS version_plan,v.version_number,v.created_at,NULL::uuid current_research_version_id,NULL::uuid current_opinion_version_id FROM xiaohongshu_states s JOIN xiaohongshu_versions v ON v.id=s.latest_version_id WHERE s.content_package_id=$1 AND s.owner_user_id=$2 FOR UPDATE',
        [input.packageId, input.ownerId],
      );
      const row = state.rows[0];
      if (!row) throw new BlogError('BLOG_NOT_FOUND');
      if (row.revision !== input.expectedRevision) throw new BlogError('BLOG_REVISION_CONFLICT');
      if (row.checkpointed_revision === row.revision) return;
      await client.query(
        `INSERT INTO xiaohongshu_versions (id,artifact_id,content_package_id,owner_user_id,version_number,body,plan,research_version_id,opinion_version_id,content_mode,origin,created_at) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9,$10,'user_checkpoint',$11)`,
        [
          input.versionId,
          row.artifact_id,
          input.packageId,
          input.ownerId,
          row.version_number + 1,
          JSON.stringify(row.body),
          JSON.stringify(row.plan),
          row.research_version_id,
          row.opinion_version_id,
          row.content_mode,
          input.now,
        ],
      );
      await client.query(
        'UPDATE xiaohongshu_states SET latest_version_id=$2,checkpointed_revision=revision,updated_at=$3 WHERE artifact_id=$1',
        [row.artifact_id, input.versionId, input.now],
      );
    });
    return (await this.xiaohongshu(input.packageId, input.ownerId))!;
  }
  async approve(input: Parameters<XiaohongshuRepository['approve']>[0]): Promise<XiaohongshuState> {
    await this.tx(async (client) => {
      const result = await client.query<StateRow>(
        'SELECT s.*,v.body AS version_body,v.plan AS version_plan,v.version_number,v.created_at,NULL::uuid current_research_version_id,NULL::uuid current_opinion_version_id FROM xiaohongshu_states s JOIN xiaohongshu_versions v ON v.id=$3 AND v.artifact_id=s.artifact_id WHERE s.content_package_id=$1 AND s.owner_user_id=$2 FOR UPDATE',
        [input.packageId, input.ownerId, input.versionId],
      );
      const row = result.rows[0];
      if (!row) throw new BlogError('BLOG_NOT_FOUND');
      if (row.approved_version_id === input.versionId) return;
      if (row.latest_version_id !== input.versionId || row.checkpointed_revision !== row.revision)
        throw new BlogError('BLOG_VERSION_NOT_ELIGIBLE');
      const foundation = await this.blog.foundation(input.packageId, input.ownerId, row.content_mode);
      if (
        foundation.researchVersionId !== row.research_version_id ||
        foundation.opinionVersionId !== row.opinion_version_id
      )
        throw new BlogError('BLOG_VERSION_NOT_ELIGIBLE');
      const body = validateXiaohongshuBody(row.version_body);
      const refs = body.publicReferences.map((reference) => reference.sourceVersionId).sort();
      const expected = foundation.sourceInputs.map((source) => source.sourceVersionId).sort();
      const plan = validatePackagingPlan(row.version_plan);
      if (JSON.stringify(refs) !== JSON.stringify(expected) || !xiaohongshuBoundToFoundation(body, plan, foundation))
        throw new BlogError('BLOG_VERSION_NOT_ELIGIBLE');
      const summary = validateXiaohongshu(body, plan);
      await client.query(
        'INSERT INTO xiaohongshu_approvals (id,artifact_id,approved_version_id,content_package_id,owner_user_id,validation_summary,approved_at) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7)',
        [
          input.approvalId,
          row.artifact_id,
          input.versionId,
          input.packageId,
          input.ownerId,
          JSON.stringify(summary),
          input.now,
        ],
      );
      await client.query(
        'UPDATE xiaohongshu_states SET approved_version_id=$2,approval_validation_summary=$3::jsonb,updated_at=$4 WHERE artifact_id=$1',
        [row.artifact_id, input.versionId, JSON.stringify(summary), input.now],
      );
    });
    return (await this.xiaohongshu(input.packageId, input.ownerId))!;
  }
}
