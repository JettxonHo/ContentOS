import type { PoolClient, QueryResultRow } from 'pg';

import {
  BlogError,
  OPINION_QUESTION,
  blogContentHash,
  validateBlog,
  validateBlogBody,
  validateResearchBody,
  type ApprovedBlogFoundation,
  type BlogApprovalId,
  type BlogArtifactId,
  type BlogBody,
  type BlogRepository,
  type BlogRunId,
  type BlogState,
  type BlogValidationSummary,
  type BlogVersionId,
  type BlogVersionState,
  type BlogWorkingCopyId,
  type BlogContentMode,
  type ContentPackageId,
  type ContentPackageOwnerId,
  type OpinionArtifactId,
  type OpinionState,
  type OpinionVersionId,
  type ResearchVersionId,
} from '@contentos/core';

import type { DatabaseConnection } from './client.js';

interface FoundationRow extends QueryResultRow {
  readonly research_version_id: string;
  readonly research_body: unknown;
}

interface SourceRow extends QueryResultRow {
  readonly source_version_id: string;
  readonly label: string | null;
}

interface OpinionRow extends QueryResultRow {
  readonly opinion_id: string;
  readonly question: string;
  readonly raw_response: string;
  readonly interpretation: string;
  readonly revision: number;
  readonly research_version_id: string;
  readonly confirmed_version_id: string | null;
  readonly confirmed_statement: string | null;
  readonly confirmed_research_version_id: string | null;
  readonly current_research_version_id: string;
}

interface BlogRow extends QueryResultRow {
  readonly blog_id: string;
  readonly content_package_id: string;
  readonly wc_body: unknown;
  readonly wc_revision: number;
  readonly wc_checkpointed_revision: number | null;
  readonly latest_version_id: string;
  readonly latest_number: number;
  readonly latest_body: unknown;
  readonly latest_research_version_id: string;
  readonly latest_opinion_version_id: string | null;
  readonly latest_created_at: Date;
  readonly approved_version_id: string | null;
  readonly approved_number: number | null;
  readonly approved_body: unknown | null;
  readonly approved_research_version_id: string | null;
  readonly approved_opinion_version_id: string | null;
  readonly approved_created_at: Date | null;
  readonly approval_validation_summary: unknown | null;
  readonly current_research_version_id: string;
  readonly current_opinion_version_id: string | null;
}

function version(row: BlogRow, kind: 'latest' | 'approved'): BlogVersionState | null {
  const id = kind === 'latest' ? row.latest_version_id : row.approved_version_id;
  const number = kind === 'latest' ? row.latest_number : row.approved_number;
  const body = kind === 'latest' ? row.latest_body : row.approved_body;
  const research = kind === 'latest' ? row.latest_research_version_id : row.approved_research_version_id;
  const opinion = kind === 'latest' ? row.latest_opinion_version_id : row.approved_opinion_version_id;
  const createdAt = kind === 'latest' ? row.latest_created_at : row.approved_created_at;
  if (!id || number === null || !body || !research || !createdAt) return null;
  return {
    id: id as BlogVersionId,
    versionNumber: number,
    body: validateBlogBody(body),
    researchVersionId: research as ResearchVersionId,
    opinionVersionId: opinion as OpinionVersionId | null,
    createdAt,
  };
}

function dependenciesCurrent(versionState: BlogVersionState, row: BlogRow): boolean {
  return (
    versionState.researchVersionId === row.current_research_version_id &&
    (versionState.body.contentMode === 'research_based' ||
      versionState.opinionVersionId === row.current_opinion_version_id)
  );
}

export class DrizzleBlogRepository implements BlogRepository {
  constructor(private readonly connection: DatabaseConnection) {}

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

  async requireActivePackage(packageId: ContentPackageId, ownerId: ContentPackageOwnerId): Promise<void> {
    const result = await this.connection.pool.query<{ lifecycle: string }>(
      'SELECT lifecycle FROM content_packages WHERE id=$1 AND owner_user_id=$2',
      [packageId, ownerId],
    );
    if (!result.rows[0]) throw new BlogError('CONTENT_PACKAGE_NOT_FOUND');
    if (result.rows[0].lifecycle !== 'active') throw new BlogError('PACKAGE_ARCHIVED');
  }

  private async currentResearch(
    client: PoolClient | DatabaseConnection['pool'],
    packageId: ContentPackageId,
    ownerId: ContentPackageOwnerId,
  ): Promise<FoundationRow> {
    const result = await client.query<FoundationRow>(
      `SELECT h.approved_version_id AS research_version_id, v.body AS research_body
       FROM research_artifacts a
       JOIN research_heads h ON h.research_id=a.id
       JOIN research_versions v ON v.id=h.approved_version_id AND v.research_id=a.id
       WHERE a.content_package_id=$1 AND a.owner_user_id=$2`,
      [packageId, ownerId],
    );
    const row = result.rows[0];
    if (!row) throw new BlogError('APPROVED_RESEARCH_REQUIRED');
    return row;
  }

  async foundation(
    packageId: ContentPackageId,
    ownerId: ContentPackageOwnerId,
    mode: BlogContentMode,
  ): Promise<ApprovedBlogFoundation> {
    const research = await this.currentResearch(this.connection.pool, packageId, ownerId);
    const sources = await this.connection.pool.query<SourceRow>(
      `SELECT rvs.source_version_id, rvs.label
       FROM research_version_sources rvs WHERE rvs.research_version_id=$1 ORDER BY rvs.ordinal`,
      [research.research_version_id],
    );
    let opinionVersionId: OpinionVersionId | null = null;
    let confirmedOpinion: string | null = null;
    if (mode === 'creator_led') {
      const opinion = await this.connection.pool.query<{
        id: string;
        confirmed_statement: string;
        research_version_id: string;
      }>(
        `SELECT v.id, v.confirmed_statement, v.research_version_id
         FROM opinion_artifacts a JOIN opinion_heads h ON h.opinion_id=a.id
         JOIN opinion_versions v ON v.id=h.confirmed_version_id AND v.opinion_id=a.id
         WHERE a.content_package_id=$1 AND a.owner_user_id=$2`,
        [packageId, ownerId],
      );
      const row = opinion.rows[0];
      if (!row || row.research_version_id !== research.research_version_id) {
        throw new BlogError('CONFIRMED_OPINION_REQUIRED');
      }
      opinionVersionId = row.id as OpinionVersionId;
      confirmedOpinion = row.confirmed_statement;
    }
    return {
      researchVersionId: research.research_version_id as ResearchVersionId,
      researchBody: validateResearchBody(research.research_body),
      sourceInputs: sources.rows.map((row) => ({ sourceVersionId: row.source_version_id, label: row.label })),
      opinionVersionId,
      confirmedOpinion,
    };
  }

  async opinion(packageId: ContentPackageId, ownerId: ContentPackageOwnerId): Promise<OpinionState | null> {
    const result = await this.connection.pool.query<OpinionRow>(
      `SELECT a.id AS opinion_id, d.question, d.raw_response, d.interpretation, d.revision,
              d.research_version_id, h.confirmed_version_id, v.confirmed_statement,
              v.research_version_id AS confirmed_research_version_id,
              rh.approved_version_id AS current_research_version_id
       FROM opinion_artifacts a JOIN opinion_drafts d ON d.opinion_id=a.id
       JOIN opinion_heads h ON h.opinion_id=a.id
       LEFT JOIN opinion_versions v ON v.id=h.confirmed_version_id AND v.opinion_id=a.id
       JOIN research_artifacts ra ON ra.content_package_id=a.content_package_id
       JOIN research_heads rh ON rh.research_id=ra.id
       WHERE a.content_package_id=$1 AND a.owner_user_id=$2`,
      [packageId, ownerId],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      artifactId: row.opinion_id as OpinionArtifactId,
      question: OPINION_QUESTION,
      rawResponse: row.raw_response,
      interpretation: row.interpretation,
      revision: row.revision,
      confirmedVersionId: row.confirmed_version_id as OpinionVersionId | null,
      confirmedStatement: row.confirmed_statement,
      researchVersionId: row.research_version_id as ResearchVersionId,
      outdated:
        row.research_version_id !== row.current_research_version_id ||
        (row.confirmed_version_id !== null && row.confirmed_research_version_id !== row.current_research_version_id),
    };
  }

  async saveOpinionDraft(input: {
    readonly packageId: ContentPackageId;
    readonly ownerId: ContentPackageOwnerId;
    readonly artifactId: OpinionArtifactId;
    readonly rawResponse: string;
    readonly interpretation: string;
    readonly researchVersionId: ResearchVersionId;
    readonly now: Date;
  }): Promise<OpinionState> {
    await this.transaction(async (client) => {
      const research = await this.currentResearch(client, input.packageId, input.ownerId);
      if (research.research_version_id !== input.researchVersionId) throw new BlogError('APPROVED_RESEARCH_REQUIRED');
      const existing = await client.query<{ id: string }>(
        'SELECT id FROM opinion_artifacts WHERE content_package_id=$1 AND owner_user_id=$2 FOR UPDATE',
        [input.packageId, input.ownerId],
      );
      const opinionId = existing.rows[0]?.id ?? input.artifactId;
      if (!existing.rows[0]) {
        await client.query(
          'INSERT INTO opinion_artifacts (id,content_package_id,owner_user_id,created_at) VALUES ($1,$2,$3,$4)',
          [opinionId, input.packageId, input.ownerId, input.now],
        );
        await client.query(
          `INSERT INTO opinion_drafts (opinion_id,content_package_id,owner_user_id,research_version_id,question,raw_response,interpretation,revision,updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,1,$8)`,
          [
            opinionId,
            input.packageId,
            input.ownerId,
            input.researchVersionId,
            OPINION_QUESTION,
            input.rawResponse,
            input.interpretation,
            input.now,
          ],
        );
        await client.query(
          'INSERT INTO opinion_heads (opinion_id,content_package_id,owner_user_id,confirmed_version_id,updated_at) VALUES ($1,$2,$3,NULL,$4)',
          [opinionId, input.packageId, input.ownerId, input.now],
        );
      } else {
        await client.query(
          `UPDATE opinion_drafts SET research_version_id=$2, raw_response=$3, interpretation=$4,
                  revision=revision+1, updated_at=$5 WHERE opinion_id=$1`,
          [opinionId, input.researchVersionId, input.rawResponse, input.interpretation, input.now],
        );
      }
    });
    return (await this.opinion(input.packageId, input.ownerId))!;
  }

  async confirmOpinion(input: {
    readonly packageId: ContentPackageId;
    readonly ownerId: ContentPackageOwnerId;
    readonly versionId: OpinionVersionId;
    readonly expectedRevision: number;
    readonly confirmedStatement: string;
    readonly now: Date;
  }): Promise<OpinionState> {
    await this.transaction(async (client) => {
      const result = await client.query<OpinionRow>(
        `SELECT a.id AS opinion_id, d.question, d.raw_response, d.interpretation, d.revision,
                d.research_version_id, h.confirmed_version_id, NULL::text AS confirmed_statement,
                NULL::uuid AS confirmed_research_version_id, rh.approved_version_id AS current_research_version_id
         FROM opinion_artifacts a JOIN opinion_drafts d ON d.opinion_id=a.id
         JOIN opinion_heads h ON h.opinion_id=a.id
         JOIN research_artifacts ra ON ra.content_package_id=a.content_package_id JOIN research_heads rh ON rh.research_id=ra.id
         WHERE a.content_package_id=$1 AND a.owner_user_id=$2 FOR UPDATE`,
        [input.packageId, input.ownerId],
      );
      const row = result.rows[0];
      if (!row) throw new BlogError('OPINION_NOT_FOUND');
      if (row.revision !== input.expectedRevision) throw new BlogError('OPINION_REVISION_CONFLICT');
      if (row.research_version_id !== row.current_research_version_id)
        throw new BlogError('CONFIRMED_OPINION_REQUIRED');
      const number = await client.query<{ next: number }>(
        'SELECT COALESCE(MAX(version_number),0)+1 AS next FROM opinion_versions WHERE opinion_id=$1',
        [row.opinion_id],
      );
      await client.query(
        `INSERT INTO opinion_versions
         (id,opinion_id,content_package_id,owner_user_id,version_number,research_version_id,question,raw_response,interpretation,confirmed_statement,created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          input.versionId,
          row.opinion_id,
          input.packageId,
          input.ownerId,
          number.rows[0]!.next,
          row.research_version_id,
          row.question,
          row.raw_response,
          row.interpretation,
          input.confirmedStatement,
          input.now,
        ],
      );
      await client.query('UPDATE opinion_heads SET confirmed_version_id=$2,updated_at=$3 WHERE opinion_id=$1', [
        row.opinion_id,
        input.versionId,
        input.now,
      ]);
    });
    return (await this.opinion(input.packageId, input.ownerId))!;
  }

  async blog(packageId: ContentPackageId, ownerId: ContentPackageOwnerId): Promise<BlogState | null> {
    const result = await this.connection.pool.query<BlogRow>(
      `SELECT a.id AS blog_id,a.content_package_id,wc.body AS wc_body,wc.revision AS wc_revision,
              wc.checkpointed_revision AS wc_checkpointed_revision,
              lv.id AS latest_version_id,lv.version_number AS latest_number,lv.body AS latest_body,
              lv.research_version_id AS latest_research_version_id,lv.opinion_version_id AS latest_opinion_version_id,
              lv.created_at AS latest_created_at,h.approved_version_id,
              av.version_number AS approved_number,av.body AS approved_body,
              av.research_version_id AS approved_research_version_id,av.opinion_version_id AS approved_opinion_version_id,
              av.created_at AS approved_created_at,ap.validation_summary AS approval_validation_summary,
              rh.approved_version_id AS current_research_version_id,oh.confirmed_version_id AS current_opinion_version_id
       FROM blog_artifacts a JOIN blog_working_copies wc ON wc.blog_id=a.id JOIN blog_heads h ON h.blog_id=a.id
       JOIN blog_versions lv ON lv.id=h.latest_version_id AND lv.blog_id=a.id
       LEFT JOIN blog_versions av ON av.id=h.approved_version_id AND av.blog_id=a.id
       LEFT JOIN blog_approvals ap ON ap.blog_id=a.id AND ap.approved_version_id=h.approved_version_id
       JOIN research_artifacts ra ON ra.content_package_id=a.content_package_id JOIN research_heads rh ON rh.research_id=ra.id
       LEFT JOIN opinion_artifacts oa ON oa.content_package_id=a.content_package_id LEFT JOIN opinion_heads oh ON oh.opinion_id=oa.id
       WHERE a.content_package_id=$1 AND a.owner_user_id=$2`,
      [packageId, ownerId],
    );
    const row = result.rows[0];
    if (!row) return null;
    const latest = version(row, 'latest');
    if (!latest) throw new BlogError('INVALID_BLOG');
    const approved = version(row, 'approved');
    return {
      blogId: row.blog_id as BlogArtifactId,
      packageId: row.content_package_id as ContentPackageId,
      workingCopy: {
        body: validateBlogBody(row.wc_body),
        revision: row.wc_revision,
        checkpointedRevision: row.wc_checkpointed_revision,
      },
      latestVersion: latest,
      approvedVersion: approved,
      approvedVersionId: row.approved_version_id as BlogVersionId | null,
      outdated: approved ? !dependenciesCurrent(approved, row) : !dependenciesCurrent(latest, row),
      reviewCandidateOutdated: !dependenciesCurrent(latest, row),
      approvalValidationSummary: row.approval_validation_summary as BlogValidationSummary | null,
    };
  }

  async recordFailedBlog(input: {
    readonly requestId: string;
    readonly runId: BlogRunId;
    readonly packageId: ContentPackageId;
    readonly ownerId: ContentPackageOwnerId;
    readonly providerAlias: string;
    readonly rawOutput: string;
    readonly now: Date;
  }): Promise<void> {
    await this.connection.pool.query(
      `INSERT INTO blog_runs
       (id,request_id,content_package_id,owner_user_id,provider_alias,raw_output,state,safe_error_code,blog_id,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,'failed','provider_output_invalid',NULL,$7)
       ON CONFLICT (request_id,owner_user_id) DO NOTHING`,
      [input.runId, input.requestId, input.packageId, input.ownerId, input.providerAlias, input.rawOutput, input.now],
    );
  }

  async createBlog(input: {
    readonly requestId: string;
    readonly runId: BlogRunId;
    readonly blogId: BlogArtifactId;
    readonly workingCopyId: BlogWorkingCopyId;
    readonly versionId: BlogVersionId;
    readonly packageId: ContentPackageId;
    readonly ownerId: ContentPackageOwnerId;
    readonly providerAlias: string;
    readonly rawOutput: string;
    readonly body: BlogBody;
    readonly foundation: ApprovedBlogFoundation;
    readonly now: Date;
  }): Promise<BlogState> {
    await this.transaction(async (client) => {
      const packageResult = await client.query<{ lifecycle: string }>(
        'SELECT lifecycle FROM content_packages WHERE id=$1 AND owner_user_id=$2 FOR UPDATE',
        [input.packageId, input.ownerId],
      );
      if (!packageResult.rows[0]) throw new BlogError('CONTENT_PACKAGE_NOT_FOUND');
      if (packageResult.rows[0].lifecycle !== 'active') throw new BlogError('PACKAGE_ARCHIVED');
      const prior = await client.query<{ state: string }>(
        'SELECT state FROM blog_runs WHERE request_id=$1 AND owner_user_id=$2 FOR UPDATE',
        [input.requestId, input.ownerId],
      );
      if (prior.rows[0]?.state === 'succeeded') return;
      const research = await this.currentResearch(client, input.packageId, input.ownerId);
      if (research.research_version_id !== input.foundation.researchVersionId)
        throw new BlogError('BLOG_VERSION_NOT_ELIGIBLE');
      if (input.body.contentMode === 'creator_led') {
        const opinion = await client.query<{ confirmed_version_id: string | null }>(
          `SELECT h.confirmed_version_id FROM opinion_artifacts a JOIN opinion_heads h ON h.opinion_id=a.id
           WHERE a.content_package_id=$1 AND a.owner_user_id=$2`,
          [input.packageId, input.ownerId],
        );
        if (opinion.rows[0]?.confirmed_version_id !== input.foundation.opinionVersionId)
          throw new BlogError('BLOG_VERSION_NOT_ELIGIBLE');
      }
      const existing = await client.query<{ id: string }>(
        'SELECT id FROM blog_artifacts WHERE content_package_id=$1 AND owner_user_id=$2 FOR UPDATE',
        [input.packageId, input.ownerId],
      );
      const blogId = (existing.rows[0]?.id ?? input.blogId) as BlogArtifactId;
      let versionNumber = 1;
      let parent: string | null = null;
      if (!existing.rows[0]) {
        await client.query(
          'INSERT INTO blog_artifacts (id,content_package_id,owner_user_id,created_at) VALUES ($1,$2,$3,$4)',
          [blogId, input.packageId, input.ownerId, input.now],
        );
      } else {
        const current = await client.query<{ latest_version_id: string; version_number: number }>(
          'SELECT h.latest_version_id,v.version_number FROM blog_heads h JOIN blog_versions v ON v.id=h.latest_version_id WHERE h.blog_id=$1 FOR UPDATE',
          [blogId],
        );
        parent = current.rows[0]!.latest_version_id;
        versionNumber = current.rows[0]!.version_number + 1;
      }
      await client.query(
        `INSERT INTO blog_versions
         (id,blog_id,content_package_id,owner_user_id,version_number,parent_version_id,body,content_hash,schema_version,research_version_id,opinion_version_id,content_mode,origin,created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,'blog/v1',$9,$10,$11,'generated',$12)`,
        [
          input.versionId,
          blogId,
          input.packageId,
          input.ownerId,
          versionNumber,
          parent,
          JSON.stringify(input.body),
          blogContentHash(input.body),
          input.foundation.researchVersionId,
          input.foundation.opinionVersionId,
          input.body.contentMode,
          input.now,
        ],
      );
      if (!existing.rows[0]) {
        await client.query(
          `INSERT INTO blog_working_copies (id,blog_id,content_package_id,owner_user_id,body,revision,checkpointed_revision,base_version_id,updated_at)
           VALUES ($1,$2,$3,$4,$5::jsonb,1,1,$6,$7)`,
          [
            input.workingCopyId,
            blogId,
            input.packageId,
            input.ownerId,
            JSON.stringify(input.body),
            input.versionId,
            input.now,
          ],
        );
        await client.query(
          `INSERT INTO blog_heads (blog_id,content_package_id,owner_user_id,working_copy_id,latest_version_id,review_candidate_version_id,approved_version_id,updated_at)
           VALUES ($1,$2,$3,$4,$5,$5,NULL,$6)`,
          [blogId, input.packageId, input.ownerId, input.workingCopyId, input.versionId, input.now],
        );
      } else {
        await client.query(
          'UPDATE blog_working_copies SET body=$2::jsonb,revision=revision+1,checkpointed_revision=revision+1,base_version_id=$3,updated_at=$4 WHERE blog_id=$1',
          [blogId, JSON.stringify(input.body), input.versionId, input.now],
        );
        await client.query(
          'UPDATE blog_heads SET latest_version_id=$2,review_candidate_version_id=$2,updated_at=$3 WHERE blog_id=$1',
          [blogId, input.versionId, input.now],
        );
      }
      await client.query(
        `INSERT INTO blog_runs (id,request_id,content_package_id,owner_user_id,provider_alias,raw_output,state,safe_error_code,blog_id,created_at)
         VALUES ($1,$2,$3,$4,$5,$6,'succeeded',NULL,$7,$8)`,
        [
          input.runId,
          input.requestId,
          input.packageId,
          input.ownerId,
          input.providerAlias,
          input.rawOutput,
          blogId,
          input.now,
        ],
      );
    });
    return (await this.blog(input.packageId, input.ownerId))!;
  }

  async updateBlog(input: {
    readonly packageId: ContentPackageId;
    readonly ownerId: ContentPackageOwnerId;
    readonly expectedRevision: number;
    readonly body: BlogBody;
    readonly now: Date;
  }): Promise<BlogState> {
    const result = await this.connection.pool.query(
      `UPDATE blog_working_copies wc SET body=$3::jsonb,revision=revision+1,checkpointed_revision=NULL,updated_at=$4
       FROM blog_artifacts a WHERE wc.blog_id=a.id AND a.content_package_id=$1 AND a.owner_user_id=$2 AND wc.revision=$5 RETURNING wc.id`,
      [input.packageId, input.ownerId, JSON.stringify(input.body), input.now, input.expectedRevision],
    );
    if (result.rowCount !== 1) {
      if (!(await this.blog(input.packageId, input.ownerId))) throw new BlogError('BLOG_NOT_FOUND');
      throw new BlogError('BLOG_REVISION_CONFLICT');
    }
    return (await this.blog(input.packageId, input.ownerId))!;
  }

  async checkpointBlog(input: {
    readonly packageId: ContentPackageId;
    readonly ownerId: ContentPackageOwnerId;
    readonly expectedRevision: number;
    readonly versionId: BlogVersionId;
    readonly now: Date;
  }): Promise<BlogState> {
    await this.transaction(async (client) => {
      const result = await client.query<{
        blog_id: string;
        body: unknown;
        revision: number;
        checkpointed_revision: number | null;
        base_version_id: string;
        latest_number: number;
        research_version_id: string;
        opinion_version_id: string | null;
        content_mode: BlogContentMode;
      }>(
        `SELECT wc.blog_id,wc.body,wc.revision,wc.checkpointed_revision,wc.base_version_id,lv.version_number AS latest_number,
                bv.research_version_id,bv.opinion_version_id,bv.content_mode
         FROM blog_working_copies wc JOIN blog_artifacts a ON a.id=wc.blog_id JOIN blog_heads h ON h.blog_id=a.id
         JOIN blog_versions lv ON lv.id=h.latest_version_id JOIN blog_versions bv ON bv.id=wc.base_version_id
         WHERE a.content_package_id=$1 AND a.owner_user_id=$2 FOR UPDATE`,
        [input.packageId, input.ownerId],
      );
      const row = result.rows[0];
      if (!row) throw new BlogError('BLOG_NOT_FOUND');
      if (row.checkpointed_revision === input.expectedRevision) return;
      if (row.revision !== input.expectedRevision) throw new BlogError('BLOG_REVISION_CONFLICT');
      const body = validateBlogBody(row.body);
      await client.query(
        `INSERT INTO blog_versions
         (id,blog_id,content_package_id,owner_user_id,version_number,parent_version_id,body,content_hash,schema_version,research_version_id,opinion_version_id,content_mode,origin,created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,'blog/v1',$9,$10,$11,'user_checkpoint',$12)`,
        [
          input.versionId,
          row.blog_id,
          input.packageId,
          input.ownerId,
          row.latest_number + 1,
          row.base_version_id,
          JSON.stringify(body),
          blogContentHash(body),
          row.research_version_id,
          row.opinion_version_id,
          row.content_mode,
          input.now,
        ],
      );
      await client.query(
        'UPDATE blog_working_copies SET checkpointed_revision=revision,base_version_id=$2 WHERE blog_id=$1',
        [row.blog_id, input.versionId],
      );
      await client.query(
        'UPDATE blog_heads SET latest_version_id=$2,review_candidate_version_id=$2,updated_at=$3 WHERE blog_id=$1',
        [row.blog_id, input.versionId, input.now],
      );
    });
    return (await this.blog(input.packageId, input.ownerId))!;
  }

  async approveBlog(input: {
    readonly packageId: ContentPackageId;
    readonly ownerId: ContentPackageOwnerId;
    readonly versionId: BlogVersionId;
    readonly approvalId: BlogApprovalId;
    readonly now: Date;
  }): Promise<BlogState> {
    await this.transaction(async (client) => {
      const result = await client.query<{
        blog_id: string;
        approved_version_id: string | null;
        latest_version_id: string;
        review_candidate_version_id: string;
        body: unknown;
        research_version_id: string;
        opinion_version_id: string | null;
        content_mode: BlogContentMode;
      }>(
        `SELECT h.blog_id,h.approved_version_id,h.latest_version_id,h.review_candidate_version_id,v.body,v.research_version_id,v.opinion_version_id,v.content_mode
         FROM blog_heads h JOIN blog_artifacts a ON a.id=h.blog_id JOIN blog_versions v ON v.id=$3 AND v.blog_id=h.blog_id
         WHERE a.content_package_id=$1 AND a.owner_user_id=$2 FOR UPDATE`,
        [input.packageId, input.ownerId, input.versionId],
      );
      const row = result.rows[0];
      if (!row) throw new BlogError('BLOG_NOT_FOUND');
      if (row.approved_version_id === input.versionId) return;
      if (row.latest_version_id !== input.versionId || row.review_candidate_version_id !== input.versionId)
        throw new BlogError('BLOG_VERSION_NOT_ELIGIBLE');
      const research = await this.currentResearch(client, input.packageId, input.ownerId);
      if (research.research_version_id !== row.research_version_id) throw new BlogError('BLOG_VERSION_NOT_ELIGIBLE');
      if (row.content_mode === 'creator_led') {
        const opinion = await client.query<{ confirmed_version_id: string | null }>(
          `SELECT h.confirmed_version_id FROM opinion_artifacts a JOIN opinion_heads h ON h.opinion_id=a.id WHERE a.content_package_id=$1 AND a.owner_user_id=$2`,
          [input.packageId, input.ownerId],
        );
        if (opinion.rows[0]?.confirmed_version_id !== row.opinion_version_id)
          throw new BlogError('BLOG_VERSION_NOT_ELIGIBLE');
      }
      const body = validateBlogBody(row.body);
      const boundSources = await client.query<{ source_version_id: string }>(
        'SELECT source_version_id FROM research_version_sources WHERE research_version_id=$1 ORDER BY ordinal',
        [row.research_version_id],
      );
      const expectedSourceIds = boundSources.rows.map((source) => source.source_version_id).sort();
      const referencedSourceIds = body.publicReferences.map((reference) => reference.sourceVersionId).sort();
      if (JSON.stringify(expectedSourceIds) !== JSON.stringify(referencedSourceIds)) {
        throw new BlogError('BLOG_VERSION_NOT_ELIGIBLE');
      }
      const summary = validateBlog(body);
      await client.query(
        `INSERT INTO blog_approvals (id,blog_id,approved_version_id,content_package_id,owner_user_id,approved_by_id,validation_summary,approved_at)
         VALUES ($1,$2,$3,$4,$5,$5,$6::jsonb,$7)`,
        [
          input.approvalId,
          row.blog_id,
          input.versionId,
          input.packageId,
          input.ownerId,
          JSON.stringify(summary),
          input.now,
        ],
      );
      await client.query('UPDATE blog_heads SET approved_version_id=$2,updated_at=$3 WHERE blog_id=$1', [
        row.blog_id,
        input.versionId,
        input.now,
      ]);
    });
    return (await this.blog(input.packageId, input.ownerId))!;
  }
}
