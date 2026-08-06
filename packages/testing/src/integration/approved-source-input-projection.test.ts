import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
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
  SourceService,
} from '@contentos/core';
import { createDatabaseRuntime } from '@contentos/database';
import { Client } from 'pg';

import { readComposeCredentials, requireState } from './env.js';

function databaseUrl(): string {
  const state = requireState();
  const credentials = readComposeCredentials(state.envFile);
  return `postgresql://smoke_user:${encodeURIComponent(credentials.POSTGRES_PASSWORD ?? '')}@127.0.0.1:${state.ports.postgres}/smoke_db`;
}

const normalizedBodyValidator: NormalizedBodyValidator = {
  validate(body: unknown): body is { readonly text: string } {
    return typeof body === 'object' && body !== null && typeof (body as { text?: unknown }).text === 'string';
  },
};

class FixtureObjectStore implements ObjectStore {
  async putImmutable(input: Parameters<ObjectStore['putImmutable']>[0]) {
    return {
      storageKey: `fixture/${input.snapshotId}`,
      sha256: 'a'.repeat(64),
      byteSize: input.bytes.byteLength,
      contentType: input.contentType,
    };
  }

  async readForIntegrity(): Promise<boolean> {
    return true;
  }

  async deleteForCompensation(): Promise<void> {}
}

function sourceIds(): SourceServiceIds {
  return {
    generateSourceId: () => randomUUID() as SourceId,
    generateSnapshotId: () => randomUUID() as RawSnapshotId,
    generateWorkingCopyId: () => randomUUID() as SourceWorkingCopyId,
    generateVersionId: () => randomUUID() as SourceVersionId,
    generateApprovalId: () => randomUUID() as SourceApprovalId,
  };
}

async function insertPackage(
  client: Client,
  packageId: ContentPackageId,
  ownerUserId: ContentPackageOwnerId,
): Promise<void> {
  await client.query(
    `INSERT INTO content_packages
      (id, owner_user_id, title, description, content_mode, requested_blog, requested_xiaohongshu,
       lifecycle, revision, created_at, updated_at, archived_at)
     VALUES ($1, $2, 'Approved input fixture', NULL, 'creator_led', true, true, 'active', 1, now(), now(), NULL)`,
    [packageId, ownerUserId],
  );
}

function createSourceService(
  runtime: ReturnType<typeof createDatabaseRuntime>,
  options: {
    readonly ids?: SourceServiceIds;
    readonly now?: () => Date;
  } = {},
): SourceService {
  let timestamp = Date.parse('2026-08-06T00:00:00.000Z');
  return new SourceService(
    runtime.sources,
    new FixtureObjectStore(),
    options.ids ?? sourceIds(),
    {
      now:
        options.now ??
        (() => {
          const now = new Date(timestamp);
          timestamp += 1_000;
          return now;
        }),
    },
    normalizedBodyValidator,
  );
}

function sourceIdsWithFixedSources(fixedSourceIds: readonly SourceId[]): SourceServiceIds {
  const generated = sourceIds();
  let sourceIndex = 0;
  return {
    ...generated,
    generateSourceId: () => fixedSourceIds[sourceIndex++]!,
  };
}

async function captureVersionAndApprove(
  service: SourceService,
  input: {
    readonly contentPackageId: ContentPackageId;
    readonly ownerUserId: ContentPackageOwnerId;
    readonly role: 'primary' | 'supporting';
    readonly text: string;
  },
) {
  const captured = await service.capture({ ...input, sourceType: 'pasted_text', label: null });
  const created = await service.createVersion({
    sourceId: captured.reference.id,
    contentPackageId: input.contentPackageId,
    ownerUserId: input.ownerUserId,
    expectedRevision: captured.workingCopy.revision,
  });
  await service.approve({
    sourceId: captured.reference.id,
    contentPackageId: input.contentPackageId,
    ownerUserId: input.ownerUserId,
    versionId: created.version.id,
  });
  return { captured, version: created.version };
}

async function sourceGraphCounts(client: Client, packageId: ContentPackageId): Promise<Record<string, number>> {
  const result = await client.query<{
    sources: number;
    heads: number;
    versions: number;
    approvals: number;
  }>(
    `SELECT
       (SELECT count(*)::int FROM sources WHERE content_package_id = $1) AS sources,
       (SELECT count(*)::int FROM source_heads h JOIN sources s ON s.id = h.source_id WHERE s.content_package_id = $1) AS heads,
       (SELECT count(*)::int FROM source_versions v JOIN sources s ON s.id = v.source_id WHERE s.content_package_id = $1) AS versions,
       (SELECT count(*)::int FROM source_approvals a JOIN sources s ON s.id = a.source_id WHERE s.content_package_id = $1) AS approvals`,
    [packageId],
  );
  return result.rows[0] ?? { sources: 0, heads: 0, versions: 0, approvals: 0 };
}

describe('M2-SRC-004 Approved Source Input Projection', () => {
  it('returns only current approved Primary and Supporting Version bodies in stable order', async () => {
    const runtime = createDatabaseRuntime(databaseUrl());
    const client = new Client({ connectionString: databaseUrl() });
    await client.connect();
    try {
      const ownerUserId = randomUUID() as ContentPackageOwnerId;
      const contentPackageId = randomUUID() as ContentPackageId;
      await insertPackage(client, contentPackageId, ownerUserId);
      const service = createSourceService(runtime);

      const primary = await captureVersionAndApprove(service, {
        contentPackageId,
        ownerUserId,
        role: 'primary',
        text: 'approved primary body',
      });
      const supporting = await captureVersionAndApprove(service, {
        contentPackageId,
        ownerUserId,
        role: 'supporting',
        text: 'approved supporting body',
      });
      const laterSupporting = await captureVersionAndApprove(service, {
        contentPackageId,
        ownerUserId,
        role: 'supporting',
        text: 'later approved supporting body',
      });
      await service.capture({
        contentPackageId,
        ownerUserId,
        sourceType: 'pasted_text',
        role: 'supporting',
        label: null,
        text: 'unapproved supporting body',
      });
      const beforeCounts = await sourceGraphCounts(client, contentPackageId);

      await expect(
        runtime.approvedSourceInputs.listCurrentForPackage({ contentPackageId, ownerUserId }),
      ).resolves.toEqual([
        {
          sourceId: primary.captured.reference.id,
          role: 'primary',
          sourceVersionId: primary.version.id,
          versionNumber: 1,
          schemaVersion: 'source/normalized/v1',
          body: { text: 'approved primary body' },
        },
        {
          sourceId: supporting.captured.reference.id,
          role: 'supporting',
          sourceVersionId: supporting.version.id,
          versionNumber: 1,
          schemaVersion: 'source/normalized/v1',
          body: { text: 'approved supporting body' },
        },
        {
          sourceId: laterSupporting.captured.reference.id,
          role: 'supporting',
          sourceVersionId: laterSupporting.version.id,
          versionNumber: 1,
          schemaVersion: 'source/normalized/v1',
          body: { text: 'later approved supporting body' },
        },
      ]);
      expect(await sourceGraphCounts(client, contentPackageId)).toEqual(beforeCounts);
    } finally {
      await runtime.close();
      await client.end();
    }
  });

  it('returns an approved Supporting Source when the Primary Source is still unapproved', async () => {
    const runtime = createDatabaseRuntime(databaseUrl());
    const client = new Client({ connectionString: databaseUrl() });
    await client.connect();
    try {
      const ownerUserId = randomUUID() as ContentPackageOwnerId;
      const contentPackageId = randomUUID() as ContentPackageId;
      await insertPackage(client, contentPackageId, ownerUserId);
      const service = createSourceService(runtime);
      await service.capture({
        contentPackageId,
        ownerUserId,
        sourceType: 'pasted_text',
        role: 'primary',
        label: null,
        text: 'unapproved primary body',
      });
      const supporting = await captureVersionAndApprove(service, {
        contentPackageId,
        ownerUserId,
        role: 'supporting',
        text: 'approved supporting remains eligible',
      });

      await expect(
        runtime.approvedSourceInputs.listCurrentForPackage({ contentPackageId, ownerUserId }),
      ).resolves.toEqual([
        {
          sourceId: supporting.captured.reference.id,
          role: 'supporting',
          sourceVersionId: supporting.version.id,
          versionNumber: 1,
          schemaVersion: 'source/normalized/v1',
          body: { text: 'approved supporting remains eligible' },
        },
      ]);
    } finally {
      await runtime.close();
      await client.end();
    }
  });

  it('orders Supporting Sources with the same creation time by Source id ascending', async () => {
    const runtime = createDatabaseRuntime(databaseUrl());
    const client = new Client({ connectionString: databaseUrl() });
    await client.connect();
    try {
      const ownerUserId = randomUUID() as ContentPackageOwnerId;
      const contentPackageId = randomUUID() as ContentPackageId;
      const lowerSourceId = '00000000-0000-4000-8000-0000000000a0' as SourceId;
      const higherSourceId = '00000000-0000-4000-8000-0000000000b0' as SourceId;
      const fixedTime = new Date('2026-08-06T01:00:00.000Z');
      await insertPackage(client, contentPackageId, ownerUserId);
      const service = createSourceService(runtime, {
        ids: sourceIdsWithFixedSources([higherSourceId, lowerSourceId]),
        now: () => fixedTime,
      });
      const createdFirst = await captureVersionAndApprove(service, {
        contentPackageId,
        ownerUserId,
        role: 'supporting',
        text: 'higher id created first',
      });
      const createdSecond = await captureVersionAndApprove(service, {
        contentPackageId,
        ownerUserId,
        role: 'supporting',
        text: 'lower id created second',
      });

      expect(createdFirst.captured.reference.id).toBe(higherSourceId);
      expect(createdSecond.captured.reference.id).toBe(lowerSourceId);
      await expect(
        runtime.approvedSourceInputs.listCurrentForPackage({ contentPackageId, ownerUserId }),
      ).resolves.toEqual([
        {
          sourceId: lowerSourceId,
          role: 'supporting',
          sourceVersionId: createdSecond.version.id,
          versionNumber: 1,
          schemaVersion: 'source/normalized/v1',
          body: { text: 'lower id created second' },
        },
        {
          sourceId: higherSourceId,
          role: 'supporting',
          sourceVersionId: createdFirst.version.id,
          versionNumber: 1,
          schemaVersion: 'source/normalized/v1',
          body: { text: 'higher id created first' },
        },
      ]);
    } finally {
      await runtime.close();
      await client.end();
    }
  });

  it('holds the current Approved Version until a newer Version receives its own Approval', async () => {
    const runtime = createDatabaseRuntime(databaseUrl());
    const client = new Client({ connectionString: databaseUrl() });
    await client.connect();
    try {
      const ownerUserId = randomUUID() as ContentPackageOwnerId;
      const contentPackageId = randomUUID() as ContentPackageId;
      await insertPackage(client, contentPackageId, ownerUserId);
      const service = createSourceService(runtime);
      const first = await captureVersionAndApprove(service, {
        contentPackageId,
        ownerUserId,
        role: 'primary',
        text: 'approved version one',
      });

      const edited = await service.editWorkingCopy({
        sourceId: first.captured.reference.id,
        contentPackageId,
        ownerUserId,
        expectedRevision: 1,
        body: { text: 'unapproved version two' },
      });
      const second = await service.createVersion({
        sourceId: first.captured.reference.id,
        contentPackageId,
        ownerUserId,
        expectedRevision: edited.workingCopy.revision,
      });

      await expect(
        runtime.approvedSourceInputs.listCurrentForPackage({ contentPackageId, ownerUserId }),
      ).resolves.toEqual([
        {
          sourceId: first.captured.reference.id,
          role: 'primary',
          sourceVersionId: first.version.id,
          versionNumber: 1,
          schemaVersion: 'source/normalized/v1',
          body: { text: 'approved version one' },
        },
      ]);

      await service.approve({
        sourceId: first.captured.reference.id,
        contentPackageId,
        ownerUserId,
        versionId: second.version.id,
      });

      await expect(
        runtime.approvedSourceInputs.listCurrentForPackage({ contentPackageId, ownerUserId }),
      ).resolves.toEqual([
        {
          sourceId: first.captured.reference.id,
          role: 'primary',
          sourceVersionId: second.version.id,
          versionNumber: 2,
          schemaVersion: 'source/normalized/v1',
          body: { text: 'unapproved version two' },
        },
      ]);
    } finally {
      await runtime.close();
      await client.end();
    }
  });

  it('preserves empty, owner, and archived Package semantics without mutating the Source graph', async () => {
    const runtime = createDatabaseRuntime(databaseUrl());
    const client = new Client({ connectionString: databaseUrl() });
    await client.connect();
    try {
      const ownerUserId = randomUUID() as ContentPackageOwnerId;
      const otherOwnerUserId = randomUUID() as ContentPackageOwnerId;
      const activeEmptyPackageId = randomUUID() as ContentPackageId;
      const archivedPackageId = randomUUID() as ContentPackageId;
      await insertPackage(client, activeEmptyPackageId, ownerUserId);
      await insertPackage(client, archivedPackageId, ownerUserId);
      await client.query(
        `UPDATE content_packages
         SET lifecycle = 'archived', archived_at = now(), updated_at = now()
         WHERE id = $1`,
        [archivedPackageId],
      );
      const beforeCounts = await sourceGraphCounts(client, activeEmptyPackageId);

      await expect(
        runtime.approvedSourceInputs.listCurrentForPackage({ contentPackageId: activeEmptyPackageId, ownerUserId }),
      ).resolves.toEqual([]);
      await expect(
        runtime.approvedSourceInputs.listCurrentForPackage({
          contentPackageId: activeEmptyPackageId,
          ownerUserId: otherOwnerUserId,
        }),
      ).rejects.toMatchObject({ code: 'CONTENT_PACKAGE_NOT_FOUND' });
      await expect(
        runtime.approvedSourceInputs.listCurrentForPackage({
          contentPackageId: randomUUID() as ContentPackageId,
          ownerUserId,
        }),
      ).rejects.toMatchObject({ code: 'CONTENT_PACKAGE_NOT_FOUND' });
      await expect(
        runtime.approvedSourceInputs.listCurrentForPackage({ contentPackageId: archivedPackageId, ownerUserId }),
      ).rejects.toMatchObject({
        code: 'PACKAGE_ARCHIVED',
      });

      expect(await sourceGraphCounts(client, activeEmptyPackageId)).toEqual(beforeCounts);
    } finally {
      await runtime.close();
      await client.end();
    }
  });
});
