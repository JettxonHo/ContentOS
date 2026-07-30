import { createHash } from 'node:crypto';

import { and, desc, eq, lt, or, sql } from 'drizzle-orm';

import {
  type ContentPackageId,
  type ContentPackageOwnerId,
  type NormalizedSourceBody,
  type RawSnapshotId,
  type RawSnapshotState,
  type SourceApprovalId,
  type SourceApprovalState,
  type SourceCaptureType,
  type SourceHeadState,
  type SourceId,
  type SourceReferenceState,
  type SourceRepository,
  type SourceRole,
  type SourceState,
  type SourceType,
  type SourceVersionId,
  type SourceVersionState,
  type SourceWorkingCopyId,
  type SourceWorkingCopyState,
  SourceApplicationError,
  SourceCapturePersistenceError,
  SourceDomainError,
  rehydrateHead,
  rehydrateReference,
  rehydrateSnapshot,
  rehydrateVersion,
  rehydrateWorkingCopy,
} from '@contentos/core';

import type { DatabaseConnection } from './client.js';
import type { SourceRepositoryFaultInjector, SourceRepositoryFaultPoint } from './source-repository-testing.js';
import {
  contentPackages,
  sourceApprovals,
  sourceHeads,
  sourceRawSnapshots,
  sourceVersions,
  sourceWorkingCopies,
  sources,
} from './schema.js';

type SourceRow = typeof sources.$inferSelect;
type SnapshotRow = typeof sourceRawSnapshots.$inferSelect;
type WorkingCopyRow = typeof sourceWorkingCopies.$inferSelect;
type VersionRow = typeof sourceVersions.$inferSelect;
type HeadRow = typeof sourceHeads.$inferSelect;

class CaptureRollbackSignal extends Error {
  constructor(readonly original: unknown) {
    super('CAPTURE_ROLLBACK_SIGNAL');
  }
}

function sameDate(left: Date, right: Date): boolean {
  return left.getTime() === right.getTime();
}

function captureStateMatches(
  actual: SourceState,
  reference: SourceReferenceState,
  snapshot: RawSnapshotState,
  workingCopy: SourceWorkingCopyState,
  head: SourceHeadState,
): boolean {
  return (
    actual.reference.id === reference.id &&
    actual.reference.contentPackageId === reference.contentPackageId &&
    actual.reference.ownerUserId === reference.ownerUserId &&
    actual.reference.sourceType === reference.sourceType &&
    actual.reference.role === reference.role &&
    actual.reference.label === reference.label &&
    actual.reference.captureType === reference.captureType &&
    sameDate(actual.reference.createdAt, reference.createdAt) &&
    actual.rawSnapshot.id === snapshot.id &&
    actual.rawSnapshot.sourceId === snapshot.sourceId &&
    actual.rawSnapshot.storageKey === snapshot.storageKey &&
    actual.rawSnapshot.sha256 === snapshot.sha256 &&
    actual.rawSnapshot.byteSize === snapshot.byteSize &&
    actual.rawSnapshot.contentType === snapshot.contentType &&
    sameDate(actual.rawSnapshot.capturedAt, snapshot.capturedAt) &&
    actual.workingCopy.id === workingCopy.id &&
    actual.workingCopy.sourceId === workingCopy.sourceId &&
    actual.workingCopy.revision === workingCopy.revision &&
    actual.workingCopy.checkpointedRevision === workingCopy.checkpointedRevision &&
    actual.workingCopy.baseVersionId === workingCopy.baseVersionId &&
    actual.workingCopy.schemaVersion === workingCopy.schemaVersion &&
    actual.workingCopy.body.text === workingCopy.body.text &&
    actual.head.sourceId === head.sourceId &&
    actual.head.workingCopyId === head.workingCopyId &&
    actual.head.latestVersionId === head.latestVersionId &&
    actual.head.reviewCandidateVersionId === head.reviewCandidateVersionId &&
    actual.head.approvedVersionId === head.approvedVersionId
  );
}

function toReference(row: SourceRow): SourceReferenceState {
  return rehydrateReference({
    id: row.id as SourceId,
    contentPackageId: row.contentPackageId as ContentPackageId,
    ownerUserId: row.ownerUserId as ContentPackageOwnerId,
    sourceType: row.sourceType as SourceType,
    role: row.role as SourceRole,
    label: row.label,
    captureType: row.captureType as SourceCaptureType,
    createdAt: row.createdAt,
  });
}

function toSnapshot(row: SnapshotRow): RawSnapshotState {
  return rehydrateSnapshot({
    id: row.id as RawSnapshotId,
    sourceId: row.sourceId as SourceId,
    storageKey: row.storageKey,
    sha256: row.sha256,
    byteSize: row.byteSize,
    contentType: row.contentType,
    capturedAt: row.capturedAt,
  });
}

function toWorkingCopy(row: WorkingCopyRow): SourceWorkingCopyState {
  return rehydrateWorkingCopy({
    id: row.id as SourceWorkingCopyId,
    sourceId: row.sourceId as SourceId,
    body: row.body as NormalizedSourceBody,
    schemaVersion: row.schemaVersion,
    revision: row.revision,
    checkpointedRevision: row.checkpointedRevision,
    baseVersionId: row.baseVersionId as SourceVersionId | null,
    updatedAt: row.updatedAt,
    createdAt: row.createdAt,
  });
}

function toVersion(row: VersionRow): SourceVersionState {
  return rehydrateVersion({
    id: row.id as SourceVersionId,
    sourceId: row.sourceId as SourceId,
    versionNumber: row.versionNumber,
    parentVersionId: row.parentVersionId as SourceVersionId | null,
    body: row.body as NormalizedSourceBody,
    contentHash: row.contentHash,
    schemaVersion: row.schemaVersion,
    rawSnapshotId: row.rawSnapshotId as RawSnapshotId,
    createdById: String(row.createdById),
    createdAt: row.createdAt,
  });
}

function toHead(row: HeadRow): SourceHeadState {
  return rehydrateHead({
    sourceId: row.sourceId as SourceId,
    workingCopyId: row.workingCopyId as SourceWorkingCopyId,
    latestVersionId: row.latestVersionId as SourceVersionId | null,
    reviewCandidateVersionId: row.reviewCandidateVersionId as SourceVersionId | null,
    approvedVersionId: row.approvedVersionId as SourceVersionId | null,
  });
}

function toApproval(row: typeof sourceApprovals.$inferSelect): SourceApprovalState {
  return {
    id: row.id as SourceApprovalId,
    sourceId: row.sourceId as SourceId,
    approvedVersionId: row.approvedVersionId as SourceVersionId,
    approvedById: String(row.approvedById),
    approvedAt: row.approvedAt,
    validationSummary: row.validationSummary,
  };
}

export class DrizzleSourceRepository implements SourceRepository {
  constructor(
    private readonly connection: DatabaseConnection,
    private readonly faultInjector?: SourceRepositoryFaultInjector,
  ) {}

  private async hitFault(point: SourceRepositoryFaultPoint): Promise<void> {
    await this.faultInjector?.hit(point);
  }

  async isPackageActiveForOwner(packageId: ContentPackageId, ownerUserId: ContentPackageOwnerId): Promise<boolean> {
    const [row] = await this.connection.db
      .select({ id: contentPackages.id })
      .from(contentPackages)
      .where(
        and(
          eq(contentPackages.id, packageId),
          eq(contentPackages.ownerUserId, ownerUserId),
          eq(contentPackages.lifecycle, 'active'),
        ),
      )
      .limit(1);
    return row !== undefined;
  }

  async isPackageOwnedByOwner(packageId: ContentPackageId, ownerUserId: ContentPackageOwnerId): Promise<boolean> {
    const [row] = await this.connection.db
      .select({ id: contentPackages.id })
      .from(contentPackages)
      .where(and(eq(contentPackages.id, packageId), eq(contentPackages.ownerUserId, ownerUserId)))
      .limit(1);
    return row !== undefined;
  }

  async countSourcesByRoleForPackage(
    packageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
    role: 'primary' | 'supporting',
  ): Promise<number> {
    const [row] = await this.connection.db
      .select({ count: sql<number>`count(*)::int` })
      .from(sources)
      .where(
        and(eq(sources.contentPackageId, packageId), eq(sources.ownerUserId, ownerUserId), eq(sources.role, role)),
      );
    return row?.count ?? 0;
  }

  async capture(
    reference: SourceReferenceState,
    snapshot: RawSnapshotState,
    workingCopy: SourceWorkingCopyState,
    head: SourceHeadState,
  ): Promise<void> {
    try {
      await this.connection.db.transaction(async (tx) => {
        try {
          const [pkgRow] = await tx
            .select({ lifecycle: contentPackages.lifecycle })
            .from(contentPackages)
            .where(
              and(
                eq(contentPackages.id, reference.contentPackageId),
                eq(contentPackages.ownerUserId, reference.ownerUserId),
              ),
            )
            .for('update')
            .limit(1);
          if (!pkgRow) {
            throw new SourceApplicationError('CONTENT_PACKAGE_NOT_FOUND');
          }
          if (pkgRow.lifecycle !== 'active') {
            throw new SourceApplicationError('PACKAGE_ARCHIVED');
          }

          const [countRow] = await tx
            .select({ count: sql<number>`count(*)::int` })
            .from(sources)
            .where(
              and(
                eq(sources.contentPackageId, reference.contentPackageId),
                eq(sources.ownerUserId, reference.ownerUserId),
                eq(sources.role, reference.role),
              ),
            );
          const existingCount = countRow?.count ?? 0;
          if (reference.role === 'primary' && existingCount >= 1) {
            throw new SourceDomainError('SOURCE_ROLE_LIMIT_EXCEEDED');
          }
          if (reference.role === 'supporting' && existingCount >= 5) {
            throw new SourceDomainError('SOURCE_ROLE_LIMIT_EXCEEDED');
          }

          await tx.insert(sources).values({
            id: reference.id,
            contentPackageId: reference.contentPackageId,
            ownerUserId: reference.ownerUserId,
            sourceType: reference.sourceType,
            role: reference.role,
            label: reference.label,
            captureType: reference.captureType,
            createdAt: reference.createdAt,
          });
          await this.hitFault('capture.afterSourceInsert');

          await tx.insert(sourceRawSnapshots).values({
            id: snapshot.id,
            sourceId: snapshot.sourceId,
            ownerUserId: reference.ownerUserId,
            storageKey: snapshot.storageKey,
            sha256: snapshot.sha256,
            byteSize: snapshot.byteSize,
            contentType: snapshot.contentType,
            capturedAt: snapshot.capturedAt,
          });
          await this.hitFault('capture.afterSnapshotInsert');

          await tx.insert(sourceWorkingCopies).values({
            id: workingCopy.id,
            sourceId: workingCopy.sourceId,
            ownerUserId: reference.ownerUserId,
            body: workingCopy.body,
            schemaVersion: workingCopy.schemaVersion,
            revision: workingCopy.revision,
            checkpointedRevision: workingCopy.checkpointedRevision,
            baseVersionId: workingCopy.baseVersionId,
            updatedAt: workingCopy.updatedAt,
            createdAt: workingCopy.createdAt,
          });
          await this.hitFault('capture.afterWorkingCopyInsert');

          await tx.insert(sourceHeads).values({
            sourceId: head.sourceId,
            ownerUserId: reference.ownerUserId,
            workingCopyId: head.workingCopyId,
            latestVersionId: head.latestVersionId,
            reviewCandidateVersionId: head.reviewCandidateVersionId,
            approvedVersionId: head.approvedVersionId,
            updatedAt: reference.createdAt,
          });
          await this.hitFault('capture.afterHeadInsert');
        } catch (error) {
          throw new CaptureRollbackSignal(error);
        }
      });
      await this.hitFault('capture.afterCommit');
    } catch (error) {
      if (error instanceof CaptureRollbackSignal) {
        try {
          await this.hitFault('capture.afterRollback');
        } catch (classificationError) {
          throw new SourceCapturePersistenceError('COMMIT_UNKNOWN', classificationError);
        }
        throw new SourceCapturePersistenceError('NOT_COMMITTED', error.original);
      }
      throw new SourceCapturePersistenceError('COMMIT_UNKNOWN', error);
    }
  }

  async reconcileCapture(
    reference: SourceReferenceState,
    snapshot: RawSnapshotState,
    workingCopy: SourceWorkingCopyState,
    head: SourceHeadState,
  ): Promise<
    | { readonly outcome: 'COMMITTED'; readonly state: SourceState }
    | { readonly outcome: 'ABSENT' }
    | { readonly outcome: 'UNKNOWN' }
  > {
    try {
      // A commit acknowledgement can be lost while PostgreSQL is still
      // resolving the original transaction. That transaction holds this same
      // Package row FOR UPDATE. Crossing a fresh lock barrier first guarantees
      // it has committed or rolled back before an absence result can authorize
      // destructive object compensation.
      await this.hitFault('reconcile.beforeBarrier');
      const packageBarrier = await this.connection.db.transaction(async (tx) => {
        const [row] = await tx
          .select({ id: contentPackages.id })
          .from(contentPackages)
          .where(
            and(
              eq(contentPackages.id, reference.contentPackageId),
              eq(contentPackages.ownerUserId, reference.ownerUserId),
            ),
          )
          .for('share')
          .limit(1);
        return row;
      });
      if (!packageBarrier) return { outcome: 'UNKNOWN' };

      await this.hitFault('reconcile.beforeRead');
      const state = await this.findByIdForPackageOwner(reference.id, reference.contentPackageId, reference.ownerUserId);
      if (state) {
        return captureStateMatches(state, reference, snapshot, workingCopy, head)
          ? { outcome: 'COMMITTED', state }
          : { outcome: 'UNKNOWN' };
      }

      const [sourceRows, snapshotRows, workingCopyRows, headRows] = await Promise.all([
        this.connection.db.select({ id: sources.id }).from(sources).where(eq(sources.id, reference.id)).limit(1),
        this.connection.db
          .select({ id: sourceRawSnapshots.id })
          .from(sourceRawSnapshots)
          .where(eq(sourceRawSnapshots.id, snapshot.id))
          .limit(1),
        this.connection.db
          .select({ id: sourceWorkingCopies.id })
          .from(sourceWorkingCopies)
          .where(eq(sourceWorkingCopies.id, workingCopy.id))
          .limit(1),
        this.connection.db
          .select({ id: sourceHeads.sourceId })
          .from(sourceHeads)
          .where(eq(sourceHeads.sourceId, head.sourceId))
          .limit(1),
      ]);
      const total = sourceRows.length + snapshotRows.length + workingCopyRows.length + headRows.length;
      return total === 0 ? { outcome: 'ABSENT' } : { outcome: 'UNKNOWN' };
    } catch {
      return { outcome: 'UNKNOWN' };
    }
  }

  async findByIdForPackageOwner(
    sourceId: SourceId,
    contentPackageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
  ): Promise<SourceState | null> {
    const [sourceRow] = await this.connection.db
      .select()
      .from(sources)
      .where(
        and(
          eq(sources.id, sourceId),
          eq(sources.contentPackageId, contentPackageId),
          eq(sources.ownerUserId, ownerUserId),
        ),
      )
      .limit(1);
    if (!sourceRow) return null;

    const [wcRow] = await this.connection.db
      .select()
      .from(sourceWorkingCopies)
      .where(eq(sourceWorkingCopies.sourceId, sourceId))
      .limit(1);
    if (!wcRow) return null;

    const [headRow] = await this.connection.db
      .select()
      .from(sourceHeads)
      .where(eq(sourceHeads.sourceId, sourceId))
      .limit(1);
    if (!headRow) return null;

    const [snapRow] = await this.connection.db
      .select()
      .from(sourceRawSnapshots)
      .where(eq(sourceRawSnapshots.sourceId, sourceId))
      .limit(1);
    if (!snapRow) return null;

    return {
      reference: toReference(sourceRow),
      workingCopy: toWorkingCopy(wcRow),
      head: toHead(headRow),
      rawSnapshot: toSnapshot(snapRow),
    };
  }

  async listForPackage(request: {
    readonly contentPackageId: ContentPackageId;
    readonly ownerUserId: ContentPackageOwnerId;
    readonly limit: number;
    readonly after?: { readonly createdAt: Date; readonly id: SourceId };
  }): Promise<{ items: readonly SourceReferenceState[]; hasMore: boolean }> {
    const { contentPackageId, ownerUserId, limit, after } = request;
    const cursor = after
      ? or(
          lt(sources.createdAt, after.createdAt),
          and(eq(sources.createdAt, after.createdAt), lt(sources.id, after.id)),
        )
      : undefined;
    const rows = await this.connection.db
      .select()
      .from(sources)
      .where(and(eq(sources.contentPackageId, contentPackageId), eq(sources.ownerUserId, ownerUserId), cursor))
      .orderBy(desc(sources.createdAt), desc(sources.id))
      .limit(limit + 1);
    const pageRows = rows.slice(0, limit);
    const last = pageRows.at(-1);
    return {
      items: pageRows.map(toReference),
      hasMore: rows.length > limit && last !== undefined,
    };
  }

  async getWorkingCopyForPackageOwner(
    sourceId: SourceId,
    contentPackageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
  ): Promise<{ workingCopy: SourceWorkingCopyState; snapshot: RawSnapshotState } | null> {
    const [sourceRow] = await this.connection.db
      .select({ id: sources.id })
      .from(sources)
      .where(
        and(
          eq(sources.id, sourceId),
          eq(sources.contentPackageId, contentPackageId),
          eq(sources.ownerUserId, ownerUserId),
        ),
      )
      .limit(1);
    if (!sourceRow) return null;

    const [wcRow] = await this.connection.db
      .select()
      .from(sourceWorkingCopies)
      .where(and(eq(sourceWorkingCopies.sourceId, sourceId), eq(sourceWorkingCopies.ownerUserId, ownerUserId)))
      .limit(1);
    if (!wcRow) return null;

    const [snapRow] = await this.connection.db
      .select()
      .from(sourceRawSnapshots)
      .where(and(eq(sourceRawSnapshots.sourceId, sourceId), eq(sourceRawSnapshots.ownerUserId, ownerUserId)))
      .limit(1);
    if (!snapRow) return null;

    return { workingCopy: toWorkingCopy(wcRow), snapshot: toSnapshot(snapRow) };
  }

  async updateWorkingCopy(
    sourceId: SourceId,
    contentPackageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
    body: NormalizedSourceBody,
    expectedRevision: number,
    now: Date,
  ): Promise<{ readonly workingCopy: SourceWorkingCopyState; readonly snapshot: RawSnapshotState } | null> {
    return this.connection.db.transaction(async (tx) => {
      const [pkgRow] = await tx
        .select({ lifecycle: contentPackages.lifecycle })
        .from(contentPackages)
        .where(and(eq(contentPackages.id, contentPackageId), eq(contentPackages.ownerUserId, ownerUserId)))
        .for('update')
        .limit(1);
      if (!pkgRow) throw new SourceApplicationError('CONTENT_PACKAGE_NOT_FOUND');
      if (pkgRow.lifecycle !== 'active') throw new SourceApplicationError('PACKAGE_ARCHIVED');

      const [sourceRow] = await tx
        .select({ id: sources.id })
        .from(sources)
        .where(
          and(
            eq(sources.id, sourceId),
            eq(sources.contentPackageId, contentPackageId),
            eq(sources.ownerUserId, ownerUserId),
          ),
        )
        .limit(1);
      if (!sourceRow) return null;

      const [workingCopyRow] = await tx
        .select()
        .from(sourceWorkingCopies)
        .where(and(eq(sourceWorkingCopies.sourceId, sourceId), eq(sourceWorkingCopies.ownerUserId, ownerUserId)))
        .for('update')
        .limit(1);
      if (!workingCopyRow) return null;
      if (workingCopyRow.revision !== expectedRevision) {
        throw new SourceApplicationError('SOURCE_REVISION_CONFLICT');
      }

      const [snapshotRow] = await tx
        .select()
        .from(sourceRawSnapshots)
        .where(and(eq(sourceRawSnapshots.sourceId, sourceId), eq(sourceRawSnapshots.ownerUserId, ownerUserId)))
        .limit(1);
      if (!snapshotRow) return null;

      const [updatedRow] = await tx
        .update(sourceWorkingCopies)
        .set({ body, revision: expectedRevision + 1, updatedAt: now })
        .where(and(eq(sourceWorkingCopies.id, workingCopyRow.id), eq(sourceWorkingCopies.revision, expectedRevision)))
        .returning();
      if (!updatedRow) throw new SourceDomainError('SOURCE_STATE_CONFLICT');
      return { workingCopy: toWorkingCopy(updatedRow), snapshot: toSnapshot(snapshotRow) };
    });
  }

  async createVersion(
    sourceId: SourceId,
    contentPackageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
    versionId: SourceVersionId,
    expectedRevision: number,
    now: Date,
  ): Promise<{ version: SourceVersionState; workingCopy: SourceWorkingCopyState; head: SourceHeadState }> {
    return this.connection.db.transaction(async (tx) => {
      const [pkgRow] = await tx
        .select({ lifecycle: contentPackages.lifecycle })
        .from(contentPackages)
        .where(and(eq(contentPackages.id, contentPackageId), eq(contentPackages.ownerUserId, ownerUserId)))
        .for('update')
        .limit(1);
      if (!pkgRow) throw new SourceApplicationError('CONTENT_PACKAGE_NOT_FOUND');
      if (pkgRow.lifecycle !== 'active') throw new SourceApplicationError('PACKAGE_ARCHIVED');

      const [sourceRow] = await tx
        .select({ id: sources.id })
        .from(sources)
        .where(
          and(
            eq(sources.id, sourceId),
            eq(sources.contentPackageId, contentPackageId),
            eq(sources.ownerUserId, ownerUserId),
          ),
        )
        .limit(1);
      if (!sourceRow) {
        throw new SourceApplicationError('SOURCE_NOT_FOUND');
      }

      const [wcRow] = await tx
        .select()
        .from(sourceWorkingCopies)
        .where(and(eq(sourceWorkingCopies.sourceId, sourceId), eq(sourceWorkingCopies.ownerUserId, ownerUserId)))
        .for('update')
        .limit(1);
      if (!wcRow) {
        throw new SourceApplicationError('SOURCE_NOT_FOUND');
      }
      if (wcRow.revision !== expectedRevision) {
        throw new SourceApplicationError('SOURCE_REVISION_CONFLICT');
      }
      if (wcRow.checkpointedRevision === expectedRevision) {
        throw new SourceApplicationError('SOURCE_VERSION_ALREADY_EXISTS');
      }

      const [snapRow] = await tx
        .select()
        .from(sourceRawSnapshots)
        .where(eq(sourceRawSnapshots.sourceId, sourceId))
        .limit(1);
      if (!snapRow) {
        throw new SourceApplicationError('SOURCE_NOT_FOUND');
      }

      const [headRow] = await tx
        .select()
        .from(sourceHeads)
        .where(eq(sourceHeads.sourceId, sourceId))
        .for('update')
        .limit(1);
      if (!headRow) {
        throw new SourceApplicationError('SOURCE_NOT_FOUND');
      }

      const maxVersionRow = await tx
        .select({ maxNum: sql<number>`COALESCE(MAX(version_number), 0)::int` })
        .from(sourceVersions)
        .where(eq(sourceVersions.sourceId, sourceId));
      const nextVersionNumber = (maxVersionRow[0]?.maxNum ?? 0) + 1;

      const body = wcRow.body as NormalizedSourceBody;
      const contentHash = createHash('sha256').update(JSON.stringify(body), 'utf8').digest('hex');

      const [versionRow] = await tx
        .insert(sourceVersions)
        .values({
          id: versionId,
          sourceId,
          ownerUserId,
          versionNumber: nextVersionNumber,
          parentVersionId: headRow.latestVersionId,
          body,
          contentHash,
          schemaVersion: wcRow.schemaVersion,
          rawSnapshotId: snapRow.id,
          createdById: ownerUserId,
          createdAt: now,
        })
        .returning();
      await this.hitFault('version.afterVersionInsert');

      const [updatedHeadRow] = await tx
        .update(sourceHeads)
        .set({
          latestVersionId: versionId,
          reviewCandidateVersionId: versionId,
          updatedAt: now,
        })
        .where(eq(sourceHeads.sourceId, sourceId))
        .returning();
      await this.hitFault('version.afterHeadUpdate');

      const [updatedWcRow] = await tx
        .update(sourceWorkingCopies)
        .set({ baseVersionId: versionId, checkpointedRevision: expectedRevision, updatedAt: now })
        .where(
          and(
            eq(sourceWorkingCopies.sourceId, sourceId),
            eq(sourceWorkingCopies.revision, expectedRevision),
            sql`${sourceWorkingCopies.checkpointedRevision} IS DISTINCT FROM ${expectedRevision}`,
          ),
        )
        .returning();
      await this.hitFault('version.afterWorkingCopyUpdate');

      if (!updatedWcRow) {
        throw new SourceApplicationError('SOURCE_VERSION_ALREADY_EXISTS');
      }

      return {
        version: toVersion(versionRow!),
        workingCopy: toWorkingCopy(updatedWcRow!),
        head: toHead(updatedHeadRow!),
      };
    });
  }

  async listVersionsForPackageOwner(
    sourceId: SourceId,
    contentPackageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
  ): Promise<readonly SourceVersionState[]> {
    const [sourceRow] = await this.connection.db
      .select({ id: sources.id })
      .from(sources)
      .where(
        and(
          eq(sources.id, sourceId),
          eq(sources.contentPackageId, contentPackageId),
          eq(sources.ownerUserId, ownerUserId),
        ),
      )
      .limit(1);
    if (!sourceRow) return [];

    const rows = await this.connection.db
      .select()
      .from(sourceVersions)
      .where(and(eq(sourceVersions.sourceId, sourceId), eq(sourceVersions.ownerUserId, ownerUserId)))
      .orderBy(desc(sourceVersions.versionNumber));
    return rows.map(toVersion);
  }

  async getVersionForPackageOwner(
    sourceId: SourceId,
    versionId: SourceVersionId,
    contentPackageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
  ): Promise<SourceVersionState | null> {
    const [sourceRow] = await this.connection.db
      .select({ id: sources.id })
      .from(sources)
      .where(
        and(
          eq(sources.id, sourceId),
          eq(sources.contentPackageId, contentPackageId),
          eq(sources.ownerUserId, ownerUserId),
        ),
      )
      .limit(1);
    if (!sourceRow) return null;

    const [row] = await this.connection.db
      .select()
      .from(sourceVersions)
      .where(
        and(
          eq(sourceVersions.id, versionId),
          eq(sourceVersions.sourceId, sourceId),
          eq(sourceVersions.ownerUserId, ownerUserId),
        ),
      )
      .limit(1);
    if (!row) return null;
    return toVersion(row);
  }

  async approve(
    sourceId: SourceId,
    contentPackageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
    versionId: SourceVersionId,
    approvalId: SourceApprovalId,
    validationSummary: string,
    now: Date,
  ): Promise<{ approval: SourceApprovalState; head: SourceHeadState }> {
    return this.connection.db.transaction(async (tx) => {
      const [pkgRow] = await tx
        .select({ lifecycle: contentPackages.lifecycle })
        .from(contentPackages)
        .where(and(eq(contentPackages.id, contentPackageId), eq(contentPackages.ownerUserId, ownerUserId)))
        .for('update')
        .limit(1);
      if (!pkgRow) throw new SourceApplicationError('CONTENT_PACKAGE_NOT_FOUND');
      if (pkgRow.lifecycle !== 'active') throw new SourceApplicationError('PACKAGE_ARCHIVED');

      const [sourceRow] = await tx
        .select({ id: sources.id })
        .from(sources)
        .where(
          and(
            eq(sources.id, sourceId),
            eq(sources.contentPackageId, contentPackageId),
            eq(sources.ownerUserId, ownerUserId),
          ),
        )
        .limit(1);
      if (!sourceRow) {
        throw new SourceApplicationError('SOURCE_NOT_FOUND');
      }

      const [versionRow] = await tx
        .select()
        .from(sourceVersions)
        .where(
          and(
            eq(sourceVersions.id, versionId),
            eq(sourceVersions.sourceId, sourceId),
            eq(sourceVersions.ownerUserId, ownerUserId),
          ),
        )
        .for('update')
        .limit(1);
      if (!versionRow) {
        throw new SourceApplicationError('SOURCE_VERSION_NOT_FOUND');
      }

      const [headRow] = await tx
        .select()
        .from(sourceHeads)
        .where(eq(sourceHeads.sourceId, sourceId))
        .for('update')
        .limit(1);
      if (!headRow) {
        throw new SourceApplicationError('SOURCE_NOT_FOUND');
      }

      if (headRow.approvedVersionId === versionId) {
        throw new SourceApplicationError('SOURCE_ALREADY_APPROVED');
      }

      if (headRow.reviewCandidateVersionId !== versionId) {
        throw new SourceApplicationError('SOURCE_VERSION_NOT_ELIGIBLE');
      }

      const [approvalRow] = await tx
        .insert(sourceApprovals)
        .values({
          id: approvalId,
          sourceId,
          ownerUserId,
          approvedVersionId: versionId,
          approvedById: ownerUserId,
          approvedAt: now,
          validationSummary,
        })
        .returning();
      await this.hitFault('approval.afterApprovalInsert');

      const [updatedHeadRow] = await tx
        .update(sourceHeads)
        .set({ approvedVersionId: versionId, updatedAt: now })
        .where(eq(sourceHeads.sourceId, sourceId))
        .returning();
      await this.hitFault('approval.afterHeadUpdate');

      return {
        approval: toApproval(approvalRow!),
        head: toHead(updatedHeadRow!),
      };
    });
  }

  async getApprovalForPackageOwner(
    sourceId: SourceId,
    contentPackageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
  ): Promise<SourceApprovalState | null> {
    const [sourceRow] = await this.connection.db
      .select({ id: sources.id })
      .from(sources)
      .where(
        and(
          eq(sources.id, sourceId),
          eq(sources.contentPackageId, contentPackageId),
          eq(sources.ownerUserId, ownerUserId),
        ),
      )
      .limit(1);
    if (!sourceRow) return null;

    const [headRow] = await this.connection.db
      .select()
      .from(sourceHeads)
      .where(eq(sourceHeads.sourceId, sourceId))
      .limit(1);
    if (!headRow || !headRow.approvedVersionId) return null;

    const [row] = await this.connection.db
      .select()
      .from(sourceApprovals)
      .where(
        and(
          eq(sourceApprovals.sourceId, sourceId),
          eq(sourceApprovals.ownerUserId, ownerUserId),
          eq(sourceApprovals.approvedVersionId, headRow.approvedVersionId),
        ),
      )
      .orderBy(desc(sourceApprovals.approvedAt))
      .limit(1);
    if (!row) return null;
    return toApproval(row);
  }
}
