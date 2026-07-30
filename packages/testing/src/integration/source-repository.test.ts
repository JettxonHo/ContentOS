import { createHash, randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  SourceService,
  defineHead,
  defineSnapshot,
  defineSourceReference,
  defineWorkingCopy,
  type ContentPackageId,
  type ContentPackageOwnerId,
  type NormalizedBodyValidator,
  type ObjectStore,
  type RawSnapshotId,
  type SourceApprovalId,
  type SourceId,
  type SourceServiceIds,
  type SourceVersionId,
  type SourceWorkingCopyId,
  type SourceApplicationError,
  type SourceCapturePersistenceError,
  type StoredObject,
} from '@contentos/core';
import {
  createSourceRepositoryTestBoundary,
  type SourceRepositoryFaultInjector,
  type SourceRepositoryFaultPoint,
} from '@contentos/database';

import { readComposeCredentials, requireState } from './env.js';

class Faults implements SourceRepositoryFaultInjector {
  readonly active = new Set<SourceRepositoryFaultPoint>();

  hit(point: SourceRepositoryFaultPoint): void {
    if (this.active.has(point)) throw new Error(`injected:${point}`);
  }
}

class RecordingObjectStore implements ObjectStore {
  readonly puts: string[] = [];
  readonly deletes: string[] = [];

  async putImmutable(input: {
    readonly ownerUserId: ContentPackageOwnerId;
    readonly contentPackageId: ContentPackageId;
    readonly sourceId: SourceId;
    readonly snapshotId: RawSnapshotId;
    readonly bytes: Uint8Array;
  }): Promise<StoredObject> {
    const storageKey = `sources/${input.ownerUserId}/${input.contentPackageId}/${input.sourceId}/raw/${input.snapshotId}`;
    this.puts.push(storageKey);
    return {
      storageKey,
      sha256: createHash('sha256').update(input.bytes).digest('hex'),
      byteSize: input.bytes.byteLength,
      contentType: 'text/plain; charset=utf-8',
    };
  }

  async readForIntegrity(): Promise<boolean> {
    return true;
  }

  async deleteForCompensation(storageKey: string): Promise<void> {
    this.deletes.push(storageKey);
  }
}

const validBody: NormalizedBodyValidator = {
  validate(body: unknown): body is { readonly text: string } {
    return typeof body === 'object' && body !== null && typeof (body as { text?: unknown }).text === 'string';
  },
};

function databaseUrl(): string {
  const state = requireState();
  const credentials = readComposeCredentials(state.envFile);
  return `postgresql://smoke_user:${encodeURIComponent(credentials.POSTGRES_PASSWORD ?? '')}@127.0.0.1:${state.ports.postgres}/smoke_db`;
}

function ids(): SourceServiceIds {
  return {
    generateSourceId: () => randomUUID() as SourceId,
    generateSnapshotId: () => randomUUID() as RawSnapshotId,
    generateWorkingCopyId: () => randomUUID() as SourceWorkingCopyId,
    generateVersionId: () => randomUUID() as SourceVersionId,
    generateApprovalId: () => randomUUID() as SourceApprovalId,
  };
}

async function insertPackage(
  boundary: ReturnType<typeof createSourceRepositoryTestBoundary>,
  packageId: ContentPackageId,
  ownerId: ContentPackageOwnerId,
): Promise<void> {
  await boundary.query(
    `INSERT INTO content_packages
      (id, owner_user_id, title, description, content_mode, requested_blog, requested_xiaohongshu,
       lifecycle, revision, created_at, updated_at, archived_at)
     VALUES ($1,$2,'repository fault fixture',NULL,'creator_led',true,true,'active',1,now(),now(),NULL)`,
    [packageId, ownerId],
  );
}

function captureAggregate(ownerId: ContentPackageOwnerId, packageId: ContentPackageId) {
  const now = new Date('2026-07-29T00:00:00.000Z');
  const sourceId = randomUUID() as SourceId;
  const snapshotId = randomUUID() as RawSnapshotId;
  const workingCopyId = randomUUID() as SourceWorkingCopyId;
  const reference = defineSourceReference({
    id: sourceId,
    contentPackageId: packageId,
    ownerUserId: ownerId,
    sourceType: 'pasted_text',
    role: 'primary',
    label: null,
    captureType: 'pasted_text',
    now,
  });
  const bytes = new TextEncoder().encode('real repository fault fixture');
  const snapshot = defineSnapshot({
    id: snapshotId,
    sourceId,
    storageKey: `fixture/${snapshotId}`,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    byteSize: bytes.byteLength,
    contentType: 'text/plain; charset=utf-8',
    now,
  });
  const workingCopy = defineWorkingCopy({
    id: workingCopyId,
    sourceId,
    body: { text: 'real repository fault fixture' },
    revision: 1,
    baseVersionId: null,
    now,
  });
  const head = defineHead({ sourceId, workingCopyId });
  return { reference, snapshot, workingCopy, head, now };
}

async function expectCaptureGraphAbsent(
  boundary: ReturnType<typeof createSourceRepositoryTestBoundary>,
  aggregate: ReturnType<typeof captureAggregate>,
): Promise<void> {
  const rows = await boundary.query<{ count: number }>(
    `SELECT (SELECT count(*) FROM sources WHERE id=$1)::int
          +(SELECT count(*) FROM source_raw_snapshots WHERE id=$2)::int
          +(SELECT count(*) FROM source_working_copies WHERE id=$3)::int
          +(SELECT count(*) FROM source_heads WHERE source_id=$1)::int AS count`,
    [aggregate.reference.id, aggregate.snapshot.id, aggregate.workingCopy.id],
  );
  expect(rows[0]?.count).toBe(0);
}

async function readAuthoritativeMutableRows(
  boundary: ReturnType<typeof createSourceRepositoryTestBoundary>,
  sourceId: SourceId,
): Promise<{
  readonly head: Readonly<Record<string, unknown>>;
  readonly workingCopy: Readonly<Record<string, unknown>>;
}> {
  const [heads, workingCopies] = await Promise.all([
    boundary.query('SELECT * FROM source_heads WHERE source_id=$1', [sourceId]),
    boundary.query('SELECT * FROM source_working_copies WHERE source_id=$1', [sourceId]),
  ]);
  expect(heads).toHaveLength(1);
  expect(workingCopies).toHaveLength(1);
  return { head: heads[0]!, workingCopy: workingCopies[0]! };
}

describe('DrizzleSourceRepository transaction and recovery seams', () => {
  it('rolls back intermediate capture, Version, and Approval failures including every Head mutation', async () => {
    const ownerId = randomUUID() as ContentPackageOwnerId;
    const packageId = randomUUID() as ContentPackageId;
    const faults = new Faults();
    const boundary = createSourceRepositoryTestBoundary(databaseUrl(), faults);
    const repository = boundary.repository;
    try {
      await insertPackage(boundary, packageId, ownerId);
      const aggregate = captureAggregate(ownerId, packageId);

      faults.active.add('capture.afterWorkingCopyInsert');
      await expect(
        repository.capture(aggregate.reference, aggregate.snapshot, aggregate.workingCopy, aggregate.head),
      ).rejects.toMatchObject({ outcome: 'NOT_COMMITTED' } satisfies Partial<SourceCapturePersistenceError>);
      await expectCaptureGraphAbsent(boundary, aggregate);

      faults.active.clear();
      const postHeadAggregate = captureAggregate(ownerId, packageId);
      faults.active.add('capture.afterHeadInsert');
      await expect(
        repository.capture(
          postHeadAggregate.reference,
          postHeadAggregate.snapshot,
          postHeadAggregate.workingCopy,
          postHeadAggregate.head,
        ),
      ).rejects.toMatchObject({ outcome: 'NOT_COMMITTED' } satisfies Partial<SourceCapturePersistenceError>);
      await expectCaptureGraphAbsent(boundary, postHeadAggregate);

      faults.active.clear();
      await repository.capture(
        postHeadAggregate.reference,
        postHeadAggregate.snapshot,
        postHeadAggregate.workingCopy,
        postHeadAggregate.head,
      );

      const afterHeadVersionTime = new Date('2026-07-29T00:01:00.000Z');
      const beforeAfterHeadVersionFailure = await readAuthoritativeMutableRows(
        boundary,
        postHeadAggregate.reference.id,
      );
      faults.active.add('version.afterHeadUpdate');
      const failedVersionId = randomUUID() as SourceVersionId;
      await expect(
        repository.createVersion(
          postHeadAggregate.reference.id,
          packageId,
          ownerId,
          failedVersionId,
          1,
          afterHeadVersionTime,
        ),
      ).rejects.toThrow('injected:version.afterHeadUpdate');
      expect(await repository.listVersionsForPackageOwner(postHeadAggregate.reference.id, packageId, ownerId)).toEqual(
        [],
      );
      expect(await readAuthoritativeMutableRows(boundary, postHeadAggregate.reference.id)).toEqual(
        beforeAfterHeadVersionFailure,
      );

      faults.active.clear();
      const afterWorkingCopyVersionTime = new Date('2026-07-29T00:02:00.000Z');
      const beforeAfterWorkingCopyVersionFailure = await readAuthoritativeMutableRows(
        boundary,
        postHeadAggregate.reference.id,
      );
      faults.active.add('version.afterWorkingCopyUpdate');
      await expect(
        repository.createVersion(
          postHeadAggregate.reference.id,
          packageId,
          ownerId,
          randomUUID() as SourceVersionId,
          1,
          afterWorkingCopyVersionTime,
        ),
      ).rejects.toThrow('injected:version.afterWorkingCopyUpdate');
      expect(await repository.listVersionsForPackageOwner(postHeadAggregate.reference.id, packageId, ownerId)).toEqual(
        [],
      );
      expect(await readAuthoritativeMutableRows(boundary, postHeadAggregate.reference.id)).toEqual(
        beforeAfterWorkingCopyVersionFailure,
      );

      faults.active.clear();
      const versionId = randomUUID() as SourceVersionId;
      await repository.createVersion(
        postHeadAggregate.reference.id,
        packageId,
        ownerId,
        versionId,
        1,
        new Date('2026-07-29T00:03:00.000Z'),
      );

      const afterInsertApprovalTime = new Date('2026-07-29T00:04:00.000Z');
      const beforeAfterInsertApprovalFailure = await readAuthoritativeMutableRows(
        boundary,
        postHeadAggregate.reference.id,
      );
      faults.active.add('approval.afterApprovalInsert');
      await expect(
        repository.approve(
          postHeadAggregate.reference.id,
          packageId,
          ownerId,
          versionId,
          randomUUID() as SourceApprovalId,
          'valid',
          afterInsertApprovalTime,
        ),
      ).rejects.toThrow('injected:approval.afterApprovalInsert');
      expect(
        await repository.getApprovalForPackageOwner(postHeadAggregate.reference.id, packageId, ownerId),
      ).toBeNull();
      expect(await readAuthoritativeMutableRows(boundary, postHeadAggregate.reference.id)).toEqual(
        beforeAfterInsertApprovalFailure,
      );

      faults.active.clear();
      const afterHeadApprovalTime = new Date('2026-07-29T00:05:00.000Z');
      const beforeAfterHeadApprovalFailure = await readAuthoritativeMutableRows(
        boundary,
        postHeadAggregate.reference.id,
      );
      const failedApprovalId = randomUUID() as SourceApprovalId;
      faults.active.add('approval.afterHeadUpdate');
      await expect(
        repository.approve(
          postHeadAggregate.reference.id,
          packageId,
          ownerId,
          versionId,
          failedApprovalId,
          'valid',
          afterHeadApprovalTime,
        ),
      ).rejects.toThrow('injected:approval.afterHeadUpdate');
      expect(
        await repository.getApprovalForPackageOwner(postHeadAggregate.reference.id, packageId, ownerId),
      ).toBeNull();
      expect(await readAuthoritativeMutableRows(boundary, postHeadAggregate.reference.id)).toEqual(
        beforeAfterHeadApprovalFailure,
      );
      expect(await boundary.query('SELECT id FROM source_approvals WHERE id=$1', [failedApprovalId])).toEqual([]);
    } finally {
      await boundary.close();
    }
  });

  it('reconciles committed, absent, and unresolved capture acknowledgements without uncertain deletion', async () => {
    const ownerId = randomUUID() as ContentPackageOwnerId;
    const boundaries: ReturnType<typeof createSourceRepositoryTestBoundary>[] = [];
    try {
      for (const scenario of ['committed', 'absent', 'unresolved'] as const) {
        const packageId = randomUUID() as ContentPackageId;
        const faults = new Faults();
        if (scenario === 'committed') faults.active.add('capture.afterCommit');
        if (scenario === 'absent') {
          faults.active.add('capture.afterWorkingCopyInsert');
          faults.active.add('capture.afterRollback');
        }
        if (scenario === 'unresolved') {
          faults.active.add('capture.afterCommit');
          faults.active.add('reconcile.beforeRead');
        }
        const boundary = createSourceRepositoryTestBoundary(databaseUrl(), faults);
        boundaries.push(boundary);
        await insertPackage(boundary, packageId, ownerId);
        const repository = boundary.repository;
        const objectStore = new RecordingObjectStore();
        const service = new SourceService(repository, objectStore, ids(), { now: () => new Date() }, validBody);
        const capture = service.capture({
          contentPackageId: packageId,
          ownerUserId: ownerId,
          sourceType: 'pasted_text',
          role: 'primary',
          label: null,
          text: `real ${scenario} reconciliation`,
        });

        if (scenario === 'committed') {
          const result = await capture;
          expect(await repository.findByIdForPackageOwner(result.reference.id, packageId, ownerId)).not.toBeNull();
          expect(objectStore.deletes).toEqual([]);
        } else if (scenario === 'absent') {
          await expect(capture).rejects.toMatchObject({
            code: 'SOURCE_CAPTURE_FAILED',
          } satisfies Partial<SourceApplicationError>);
          expect(objectStore.deletes).toEqual(objectStore.puts);
          const count = await boundary.query<{ count: number }>(
            'SELECT count(*)::int AS count FROM sources WHERE content_package_id=$1',
            [packageId],
          );
          expect(count[0]?.count).toBe(0);
        } else {
          await expect(capture).rejects.toMatchObject({
            code: 'SOURCE_RECONCILIATION_REQUIRED',
          } satisfies Partial<SourceApplicationError>);
          expect(objectStore.deletes).toEqual([]);
          const count = await boundary.query<{ count: number }>(
            'SELECT count(*)::int AS count FROM sources WHERE content_package_id=$1',
            [packageId],
          );
          expect(count[0]?.count).toBe(1);
        }
      }
    } finally {
      await Promise.all(boundaries.map((boundary) => boundary.close()));
    }
  });
});
