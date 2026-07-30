import { sql } from 'drizzle-orm';
import {
  boolean,
  char,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const authSessions = pgTable(
  'auth_sessions',
  {
    id: uuid('id').primaryKey(),
    credentialHash: char('credential_hash', { length: 64 }).notNull().unique(),
    ownerUserId: uuid('owner_user_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    index('auth_sessions_owner_user_id_idx').on(table.ownerUserId),
    index('auth_sessions_expires_at_idx').on(table.expiresAt),
  ],
);

export const contentPackages = pgTable(
  'content_packages',
  {
    id: uuid('id').primaryKey(),
    ownerUserId: uuid('owner_user_id').notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    contentMode: varchar('content_mode', { length: 32 }).notNull(),
    requestedBlog: boolean('requested_blog').notNull(),
    requestedXiaohongshu: boolean('requested_xiaohongshu').notNull(),
    lifecycle: varchar('lifecycle', { length: 16 }).notNull(),
    revision: integer('revision').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
    archivedAt: timestamp('archived_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    unique('content_packages_id_owner_unique').on(table.id, table.ownerUserId),
    index('content_packages_owner_lifecycle_created_idx').on(
      table.ownerUserId,
      table.lifecycle,
      table.createdAt,
      table.id,
    ),
    check('content_packages_title_length_check', sql`char_length(${table.title}) BETWEEN 1 AND 200`),
    check(
      'content_packages_description_length_check',
      sql`${table.description} IS NULL OR char_length(${table.description}) <= 2000`,
    ),
    check('content_packages_mode_check', sql`${table.contentMode} IN ('deferred', 'creator_led', 'research_based')`),
    check('content_packages_requested_output_check', sql`${table.requestedBlog} OR ${table.requestedXiaohongshu}`),
    check('content_packages_lifecycle_check', sql`${table.lifecycle} IN ('active', 'archived')`),
    check('content_packages_revision_check', sql`${table.revision} >= 1`),
    check(
      'content_packages_archive_state_check',
      sql`(${table.lifecycle} = 'active' AND ${table.archivedAt} IS NULL) OR (${table.lifecycle} = 'archived' AND ${table.archivedAt} IS NOT NULL)`,
    ),
  ],
);

export const sources = pgTable(
  'sources',
  {
    id: uuid('id').primaryKey(),
    contentPackageId: uuid('content_package_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    sourceType: varchar('source_type', { length: 32 }).notNull(),
    role: varchar('role', { length: 16 }).notNull(),
    label: varchar('label', { length: 200 }),
    captureType: varchar('capture_type', { length: 32 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    unique('sources_id_owner_unique').on(table.id, table.ownerUserId),
    foreignKey({
      name: 'sources_package_owner_fk',
      columns: [table.contentPackageId, table.ownerUserId],
      foreignColumns: [contentPackages.id, contentPackages.ownerUserId],
    }).onDelete('restrict'),
    index('sources_owner_package_created_idx').on(table.ownerUserId, table.contentPackageId, table.createdAt, table.id),
    index('sources_package_idx').on(table.contentPackageId),
    check('sources_source_type_check', sql`${table.sourceType} IN ('pasted_text')`),
    check('sources_role_check', sql`${table.role} IN ('primary', 'supporting')`),
    check('sources_capture_type_check', sql`${table.captureType} IN ('pasted_text')`),
    check('sources_label_length_check', sql`${table.label} IS NULL OR char_length(${table.label}) BETWEEN 1 AND 200`),
  ],
);

export const sourceRawSnapshots = pgTable(
  'source_raw_snapshots',
  {
    id: uuid('id').primaryKey(),
    sourceId: uuid('source_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    storageKey: varchar('storage_key', { length: 512 }).notNull(),
    sha256: char('sha256', { length: 64 }).notNull(),
    byteSize: integer('byte_size').notNull(),
    contentType: varchar('content_type', { length: 100 }).notNull(),
    capturedAt: timestamp('captured_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    unique('source_raw_snapshots_source_unique').on(table.sourceId),
    unique('source_raw_snapshots_id_source_unique').on(table.id, table.sourceId),
    uniqueIndex('source_raw_snapshots_storage_key_unique').on(table.storageKey),
    foreignKey({
      name: 'source_raw_snapshots_source_owner_fk',
      columns: [table.sourceId, table.ownerUserId],
      foreignColumns: [sources.id, sources.ownerUserId],
    }).onDelete('restrict'),
    index('source_raw_snapshots_source_idx').on(table.sourceId),
    index('source_raw_snapshots_owner_idx').on(table.ownerUserId),
    check('source_raw_snapshots_sha256_format_check', sql`${table.sha256} ~ '^[0-9a-f]{64}$'`),
    check('source_raw_snapshots_byte_size_check', sql`${table.byteSize} BETWEEN 1 AND 100000`),
    // `chr(59)` avoids Drizzle's migration statement splitter treating the
    // semicolon inside the MIME value as a SQL statement terminator.
    check(
      'source_raw_snapshots_content_type_check',
      sql`${table.contentType} = concat('text/plain', chr(59), ' charset=utf-8')`,
    ),
  ],
);

export const sourceVersions = pgTable(
  'source_versions',
  {
    id: uuid('id').primaryKey(),
    sourceId: uuid('source_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    versionNumber: integer('version_number').notNull(),
    // The composite parent/source foreign key below is the self-reference.
    // Defining it in the table-extra callback preserves same-Source lineage
    // without a circular TypeScript table initializer.
    parentVersionId: uuid('parent_version_id'),
    body: jsonb('body').$type<{ readonly text: string }>().notNull(),
    contentHash: char('content_hash', { length: 64 }).notNull(),
    schemaVersion: varchar('schema_version', { length: 32 }).notNull(),
    rawSnapshotId: uuid('raw_snapshot_id').notNull(),
    createdById: uuid('created_by_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    uniqueIndex('source_versions_source_number_unique_idx').on(table.sourceId, table.versionNumber),
    unique('source_versions_id_source_unique').on(table.id, table.sourceId),
    foreignKey({
      name: 'source_versions_source_owner_fk',
      columns: [table.sourceId, table.ownerUserId],
      foreignColumns: [sources.id, sources.ownerUserId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'source_versions_parent_source_fk',
      columns: [table.parentVersionId, table.sourceId],
      foreignColumns: [table.id, table.sourceId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'source_versions_snapshot_source_fk',
      columns: [table.rawSnapshotId, table.sourceId],
      foreignColumns: [sourceRawSnapshots.id, sourceRawSnapshots.sourceId],
    }).onDelete('restrict'),
    index('source_versions_source_idx').on(table.sourceId),
    index('source_versions_owner_idx').on(table.ownerUserId),
    check('source_versions_version_number_check', sql`${table.versionNumber} >= 1`),
    check('source_versions_body_object_check', sql`jsonb_typeof(${table.body}) = 'object'`),
    check('source_versions_body_keys_check', sql`${table.body} ? 'text' AND (${table.body} - 'text') = '{}'::jsonb`),
    check('source_versions_body_text_type_check', sql`jsonb_typeof(${table.body}->'text') = 'string'`),
    check(
      'source_versions_body_text_check',
      sql`btrim(${table.body}->>'text') <> '' AND octet_length(${table.body}->>'text') BETWEEN 1 AND 100000`,
    ),
    check('source_versions_schema_version_check', sql`${table.schemaVersion} = 'source/normalized/v1'`),
    check('source_versions_content_hash_format_check', sql`${table.contentHash} ~ '^[0-9a-f]{64}$'`),
  ],
);

export const sourceWorkingCopies = pgTable(
  'source_working_copies',
  {
    id: uuid('id').primaryKey(),
    sourceId: uuid('source_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    body: jsonb('body').$type<{ readonly text: string }>().notNull(),
    schemaVersion: varchar('schema_version', { length: 32 }).notNull(),
    revision: integer('revision').notNull().default(1),
    checkpointedRevision: integer('checkpointed_revision'),
    baseVersionId: uuid('base_version_id'),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    uniqueIndex('source_working_copies_source_unique_idx').on(table.sourceId),
    unique('source_working_copies_id_source_unique').on(table.id, table.sourceId),
    foreignKey({
      name: 'source_working_copies_source_owner_fk',
      columns: [table.sourceId, table.ownerUserId],
      foreignColumns: [sources.id, sources.ownerUserId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'source_working_copies_base_version_source_fk',
      columns: [table.baseVersionId, table.sourceId],
      foreignColumns: [sourceVersions.id, sourceVersions.sourceId],
    }).onDelete('restrict'),
    index('source_working_copies_owner_idx').on(table.ownerUserId),
    check('source_working_copies_revision_check', sql`${table.revision} >= 1`),
    check(
      'source_working_copies_checkpoint_revision_check',
      sql`${table.checkpointedRevision} IS NULL OR ${table.checkpointedRevision} BETWEEN 1 AND ${table.revision}`,
    ),
    check('source_working_copies_body_object_check', sql`jsonb_typeof(${table.body}) = 'object'`),
    check(
      'source_working_copies_body_keys_check',
      sql`${table.body} ? 'text' AND (${table.body} - 'text') = '{}'::jsonb`,
    ),
    check('source_working_copies_body_text_type_check', sql`jsonb_typeof(${table.body}->'text') = 'string'`),
    check(
      'source_working_copies_body_text_check',
      sql`btrim(${table.body}->>'text') <> '' AND octet_length(${table.body}->>'text') BETWEEN 1 AND 100000`,
    ),
    check('source_working_copies_schema_version_check', sql`${table.schemaVersion} = 'source/normalized/v1'`),
  ],
);

export const sourceHeads = pgTable(
  'source_heads',
  {
    sourceId: uuid('source_id').primaryKey(),
    ownerUserId: uuid('owner_user_id').notNull(),
    workingCopyId: uuid('working_copy_id').notNull(),
    latestVersionId: uuid('latest_version_id'),
    reviewCandidateVersionId: uuid('review_candidate_version_id'),
    approvedVersionId: uuid('approved_version_id'),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    foreignKey({
      name: 'source_heads_source_owner_fk',
      columns: [table.sourceId, table.ownerUserId],
      foreignColumns: [sources.id, sources.ownerUserId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'source_heads_wc_source_fk',
      columns: [table.workingCopyId, table.sourceId],
      foreignColumns: [sourceWorkingCopies.id, sourceWorkingCopies.sourceId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'source_heads_latest_version_source_fk',
      columns: [table.latestVersionId, table.sourceId],
      foreignColumns: [sourceVersions.id, sourceVersions.sourceId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'source_heads_review_candidate_source_fk',
      columns: [table.reviewCandidateVersionId, table.sourceId],
      foreignColumns: [sourceVersions.id, sourceVersions.sourceId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'source_heads_approved_version_source_fk',
      columns: [table.approvedVersionId, table.sourceId],
      foreignColumns: [sourceVersions.id, sourceVersions.sourceId],
    }).onDelete('restrict'),
    index('source_heads_owner_idx').on(table.ownerUserId),
  ],
);

export const sourceApprovals = pgTable(
  'source_approvals',
  {
    id: uuid('id').primaryKey(),
    sourceId: uuid('source_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    approvedVersionId: uuid('approved_version_id').notNull(),
    approvedById: uuid('approved_by_id').notNull(),
    approvedAt: timestamp('approved_at', { withTimezone: true, mode: 'date' }).notNull(),
    validationSummary: varchar('validation_summary', { length: 200 }).notNull(),
  },
  (table) => [
    uniqueIndex('source_approvals_source_version_unique_idx').on(table.sourceId, table.approvedVersionId),
    foreignKey({
      name: 'source_approvals_source_owner_fk',
      columns: [table.sourceId, table.ownerUserId],
      foreignColumns: [sources.id, sources.ownerUserId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'source_approvals_version_source_fk',
      columns: [table.approvedVersionId, table.sourceId],
      foreignColumns: [sourceVersions.id, sourceVersions.sourceId],
    }).onDelete('restrict'),
    index('source_approvals_source_idx').on(table.sourceId),
    index('source_approvals_owner_idx').on(table.ownerUserId),
    check('source_approvals_owner_approver_check', sql`${table.approvedById} = ${table.ownerUserId}`),
    check(
      'source_approvals_validation_summary_nonempty_check',
      sql`char_length(${table.validationSummary}) BETWEEN 1 AND 200`,
    ),
  ],
);
