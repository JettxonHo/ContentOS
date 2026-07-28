import { and, desc, eq, lt, or } from 'drizzle-orm';

import {
  ContentPackage,
  type ContentPackageId,
  type ContentPackageListRequest,
  type ContentPackageListResult,
  type ContentMode,
  type ContentPackageOwnerId,
  type ContentPackageRepository,
  type ContentPackageLifecycle,
} from '@contentos/core';

import type { DatabaseConnection } from './client.js';
import { contentPackages } from './schema.js';

type ContentPackageRow = typeof contentPackages.$inferSelect;

function requestedOutputs(row: ContentPackageRow): ('blog' | 'xiaohongshu')[] {
  return [
    ...(row.requestedBlog ? (['blog'] as const) : []),
    ...(row.requestedXiaohongshu ? (['xiaohongshu'] as const) : []),
  ];
}

function toDomain(row: ContentPackageRow): ContentPackage {
  return ContentPackage.rehydrate({
    id: row.id as ContentPackageId,
    ownerUserId: row.ownerUserId as ContentPackageOwnerId,
    title: row.title,
    description: row.description,
    contentMode: row.contentMode as ContentMode,
    requestedOutputs: requestedOutputs(row),
    lifecycle: row.lifecycle as ContentPackageLifecycle,
    revision: row.revision,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    archivedAt: row.archivedAt,
  });
}

function values(contentPackage: ContentPackage) {
  const state = contentPackage.state;
  return {
    id: state.id,
    ownerUserId: state.ownerUserId,
    title: state.title,
    description: state.description,
    contentMode: state.contentMode,
    requestedBlog: state.requestedOutputs.includes('blog'),
    requestedXiaohongshu: state.requestedOutputs.includes('xiaohongshu'),
    lifecycle: state.lifecycle,
    revision: state.revision,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
    archivedAt: state.archivedAt,
  };
}

export class DrizzleContentPackageRepository implements ContentPackageRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  async insert(contentPackage: ContentPackage): Promise<void> {
    await this.connection.db.insert(contentPackages).values(values(contentPackage));
  }

  async findByIdForOwner(id: ContentPackageId, ownerUserId: ContentPackageOwnerId): Promise<ContentPackage | null> {
    const [row] = await this.connection.db
      .select()
      .from(contentPackages)
      .where(and(eq(contentPackages.ownerUserId, ownerUserId), eq(contentPackages.id, id)))
      .limit(1);
    return row ? toDomain(row) : null;
  }

  async listForOwner(request: ContentPackageListRequest): Promise<ContentPackageListResult> {
    const { ownerUserId, filter, limit, after } = request;
    const lifecycle =
      filter === 'all' ? undefined : eq(contentPackages.lifecycle, filter === 'active' ? 'active' : 'archived');
    const cursor = after
      ? or(
          lt(contentPackages.createdAt, after.createdAt),
          and(eq(contentPackages.createdAt, after.createdAt), lt(contentPackages.id, after.id)),
        )
      : undefined;
    const rows = await this.connection.db
      .select()
      .from(contentPackages)
      .where(and(eq(contentPackages.ownerUserId, ownerUserId), lifecycle, cursor))
      .orderBy(desc(contentPackages.createdAt), desc(contentPackages.id))
      .limit(limit + 1);
    const pageRows = rows.slice(0, limit);
    const last = pageRows.at(-1);
    return {
      items: pageRows.map(toDomain),
      hasMore: rows.length > limit && last !== undefined,
    };
  }

  async updateMetadata(contentPackage: ContentPackage, expectedRevision: number): Promise<boolean> {
    const state = contentPackage.state;
    const rows = await this.connection.db
      .update(contentPackages)
      .set(values(contentPackage))
      .where(
        and(
          eq(contentPackages.ownerUserId, state.ownerUserId),
          eq(contentPackages.id, state.id),
          eq(contentPackages.lifecycle, 'active'),
          eq(contentPackages.revision, expectedRevision),
        ),
      )
      .returning({ id: contentPackages.id });
    return rows.length === 1;
  }

  async archive(contentPackage: ContentPackage, expectedRevision: number): Promise<boolean> {
    const state = contentPackage.state;
    const rows = await this.connection.db
      .update(contentPackages)
      .set(values(contentPackage))
      .where(
        and(
          eq(contentPackages.ownerUserId, state.ownerUserId),
          eq(contentPackages.id, state.id),
          eq(contentPackages.lifecycle, 'active'),
          eq(contentPackages.revision, expectedRevision),
        ),
      )
      .returning({ id: contentPackages.id });
    return rows.length === 1;
  }
}
