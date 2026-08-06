import { and, asc, eq, sql } from 'drizzle-orm';

import {
  type ApprovedSourceInput,
  type ApprovedSourceInputPort,
  type ApprovedSourceInputScope,
  type NormalizedSourceBody,
  type SourceId,
  type SourceRole,
  type SourceVersionId,
  SOURCE_SCHEMA_VERSION,
  SourceApplicationError,
} from '@contentos/core';

import type { DatabaseConnection } from './client.js';
import { contentPackages, sourceApprovals, sourceHeads, sourceVersions, sources } from './schema.js';

/**
 * PostgreSQL implementation of the Source-owned current-Approved input read.
 *
 * The Package-rooted statement gives Package existence, lifecycle, and the
 * complete bounded Source projection one database-statement snapshot.
 */
export class DrizzleApprovedSourceInputProjection implements ApprovedSourceInputPort {
  constructor(private readonly connection: DatabaseConnection) {}

  async listCurrentForPackage(scope: ApprovedSourceInputScope): Promise<readonly ApprovedSourceInput[]> {
    const rows = await this.connection.db
      .select({
        packageId: contentPackages.id,
        packageLifecycle: contentPackages.lifecycle,
        sourceId: sources.id,
        sourceRole: sources.role,
        sourceCreatedAt: sources.createdAt,
        versionId: sourceVersions.id,
        versionNumber: sourceVersions.versionNumber,
        schemaVersion: sourceVersions.schemaVersion,
        body: sourceVersions.body,
        approvalId: sourceApprovals.id,
      })
      .from(contentPackages)
      .leftJoin(
        sources,
        and(eq(sources.contentPackageId, contentPackages.id), eq(sources.ownerUserId, contentPackages.ownerUserId)),
      )
      .leftJoin(
        sourceHeads,
        and(eq(sourceHeads.sourceId, sources.id), eq(sourceHeads.ownerUserId, contentPackages.ownerUserId)),
      )
      .leftJoin(
        sourceVersions,
        and(
          eq(sourceVersions.id, sourceHeads.approvedVersionId),
          eq(sourceVersions.sourceId, sources.id),
          eq(sourceVersions.ownerUserId, contentPackages.ownerUserId),
        ),
      )
      .leftJoin(
        sourceApprovals,
        and(
          eq(sourceApprovals.sourceId, sources.id),
          eq(sourceApprovals.ownerUserId, contentPackages.ownerUserId),
          eq(sourceApprovals.approvedVersionId, sourceHeads.approvedVersionId),
        ),
      )
      .where(and(eq(contentPackages.id, scope.contentPackageId), eq(contentPackages.ownerUserId, scope.ownerUserId)))
      .orderBy(sql`CASE WHEN ${sources.role} = 'primary' THEN 0 ELSE 1 END`, asc(sources.createdAt), asc(sources.id));

    const packageRow = rows.at(0);
    if (!packageRow) throw new SourceApplicationError('CONTENT_PACKAGE_NOT_FOUND');
    if (packageRow.packageLifecycle !== 'active') throw new SourceApplicationError('PACKAGE_ARCHIVED');

    return rows.flatMap((row): readonly ApprovedSourceInput[] => {
      if (
        row.sourceId === null ||
        row.sourceRole === null ||
        row.versionId === null ||
        row.versionNumber === null ||
        row.schemaVersion !== SOURCE_SCHEMA_VERSION ||
        row.body === null ||
        row.approvalId === null
      ) {
        return [];
      }

      return [
        {
          sourceId: row.sourceId as SourceId,
          role: row.sourceRole as SourceRole,
          sourceVersionId: row.versionId as SourceVersionId,
          versionNumber: row.versionNumber,
          schemaVersion: SOURCE_SCHEMA_VERSION,
          body: row.body as NormalizedSourceBody,
        },
      ];
    });
  }
}
