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
  primaryKey,
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
    check('sources_source_type_check', sql`${table.sourceType} IN ('pasted_text', 'uploaded_text', 'public_url')`),
    check('sources_role_check', sql`${table.role} IN ('primary', 'supporting')`),
    check('sources_capture_type_check', sql`${table.captureType} IN ('pasted_text', 'uploaded_text', 'public_url')`),
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
    check('source_raw_snapshots_byte_size_check', sql`${table.byteSize} BETWEEN 1 AND 2097152`),
    // `chr(59)` avoids Drizzle's migration statement splitter treating the
    // semicolon inside the MIME value as a SQL statement terminator. The three
    // bare URL media types serve the `public_url` key family (M2-SRC-003).
    check(
      'source_raw_snapshots_content_type_check',
      sql`${table.contentType} IN ('text/html', 'text/plain', 'text/markdown', concat('text/plain', chr(59), ' charset=utf-8'), concat('text/markdown', chr(59), ' charset=utf-8'))`,
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

export const researchArtifacts = pgTable(
  'research_artifacts',
  {
    id: uuid('id').primaryKey(),
    contentPackageId: uuid('content_package_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    unique('research_artifacts_package_unique').on(table.contentPackageId),
    unique('research_artifacts_id_package_owner_unique').on(table.id, table.contentPackageId, table.ownerUserId),
    foreignKey({
      name: 'research_artifacts_package_owner_fk',
      columns: [table.contentPackageId, table.ownerUserId],
      foreignColumns: [contentPackages.id, contentPackages.ownerUserId],
    }).onDelete('restrict'),
    index('research_artifacts_owner_idx').on(table.ownerUserId),
  ],
);

export const researchRuns = pgTable(
  'research_runs',
  {
    id: uuid('id').primaryKey(),
    requestId: uuid('request_id').notNull(),
    contentPackageId: uuid('content_package_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    providerAlias: varchar('provider_alias', { length: 100 }).notNull(),
    inputSnapshot: jsonb('input_snapshot').$type<readonly unknown[]>().notNull(),
    rawOutput: text('raw_output').notNull(),
    state: varchar('state', { length: 16 }).notNull(),
    safeErrorCode: varchar('safe_error_code', { length: 64 }),
    researchId: uuid('research_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    unique('research_runs_request_owner_unique').on(table.requestId, table.ownerUserId),
    foreignKey({
      name: 'research_runs_package_owner_fk',
      columns: [table.contentPackageId, table.ownerUserId],
      foreignColumns: [contentPackages.id, contentPackages.ownerUserId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'research_runs_artifact_package_owner_fk',
      columns: [table.researchId, table.contentPackageId, table.ownerUserId],
      foreignColumns: [researchArtifacts.id, researchArtifacts.contentPackageId, researchArtifacts.ownerUserId],
    }).onDelete('restrict'),
    index('research_runs_owner_package_idx').on(table.ownerUserId, table.contentPackageId, table.createdAt),
    check('research_runs_state_check', sql`${table.state} IN ('succeeded', 'failed')`),
    check('research_runs_provider_alias_check', sql`char_length(${table.providerAlias}) BETWEEN 1 AND 100`),
    check('research_runs_raw_output_check', sql`octet_length(${table.rawOutput}) BETWEEN 0 AND 1000000`),
    check(
      'research_runs_state_fields_check',
      sql`(${table.state} = 'succeeded' AND ${table.safeErrorCode} IS NULL AND ${table.researchId} IS NOT NULL) OR (${table.state} = 'failed' AND ${table.safeErrorCode} IS NOT NULL AND ${table.researchId} IS NULL)`,
    ),
  ],
);

export const researchVersions = pgTable(
  'research_versions',
  {
    id: uuid('id').primaryKey(),
    researchId: uuid('research_id').notNull(),
    contentPackageId: uuid('content_package_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    versionNumber: integer('version_number').notNull(),
    parentVersionId: uuid('parent_version_id'),
    body: jsonb('body').$type<Record<string, unknown>>().notNull(),
    contentHash: char('content_hash', { length: 64 }).notNull(),
    schemaVersion: varchar('schema_version', { length: 32 }).notNull(),
    origin: varchar('origin', { length: 32 }).notNull(),
    createdById: uuid('created_by_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    unique('research_versions_id_research_unique').on(table.id, table.researchId),
    unique('research_versions_id_research_package_owner_unique').on(
      table.id,
      table.researchId,
      table.contentPackageId,
      table.ownerUserId,
    ),
    unique('research_versions_research_number_unique').on(table.researchId, table.versionNumber),
    foreignKey({
      name: 'research_versions_artifact_package_owner_fk',
      columns: [table.researchId, table.contentPackageId, table.ownerUserId],
      foreignColumns: [researchArtifacts.id, researchArtifacts.contentPackageId, researchArtifacts.ownerUserId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'research_versions_parent_research_fk',
      columns: [table.parentVersionId, table.researchId],
      foreignColumns: [table.id, table.researchId],
    }).onDelete('restrict'),
    index('research_versions_owner_package_idx').on(table.ownerUserId, table.contentPackageId),
    check('research_versions_number_check', sql`${table.versionNumber} >= 1`),
    check('research_versions_body_check', sql`jsonb_typeof(${table.body}) = 'object'`),
    check('research_versions_hash_check', sql`${table.contentHash} ~ '^[0-9a-f]{64}$'`),
    check('research_versions_schema_check', sql`${table.schemaVersion} = 'research/v1'`),
    check('research_versions_origin_check', sql`${table.origin} IN ('generated', 'user_checkpoint')`),
  ],
);

export const researchVersionSources = pgTable(
  'research_version_sources',
  {
    researchVersionId: uuid('research_version_id').notNull(),
    researchId: uuid('research_id').notNull(),
    sourceId: uuid('source_id').notNull(),
    sourceVersionId: uuid('source_version_id').notNull(),
    role: varchar('role', { length: 16 }).notNull(),
    label: varchar('label', { length: 200 }),
    ordinal: integer('ordinal').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.researchVersionId, table.sourceId] }),
    unique('research_version_sources_version_ordinal_unique').on(table.researchVersionId, table.ordinal),
    foreignKey({
      name: 'research_version_sources_research_version_fk',
      columns: [table.researchVersionId, table.researchId],
      foreignColumns: [researchVersions.id, researchVersions.researchId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'research_version_sources_source_version_fk',
      columns: [table.sourceVersionId, table.sourceId],
      foreignColumns: [sourceVersions.id, sourceVersions.sourceId],
    }).onDelete('restrict'),
    check('research_version_sources_role_check', sql`${table.role} IN ('primary', 'supporting')`),
    check('research_version_sources_ordinal_check', sql`${table.ordinal} BETWEEN 1 AND 6`),
  ],
);

export const researchWorkingCopies = pgTable(
  'research_working_copies',
  {
    id: uuid('id').primaryKey(),
    researchId: uuid('research_id').notNull(),
    contentPackageId: uuid('content_package_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    body: jsonb('body').$type<Record<string, unknown>>().notNull(),
    schemaVersion: varchar('schema_version', { length: 32 }).notNull(),
    revision: integer('revision').notNull(),
    checkpointedRevision: integer('checkpointed_revision'),
    baseVersionId: uuid('base_version_id').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    unique('research_working_copies_research_unique').on(table.researchId),
    unique('research_working_copies_id_research_unique').on(table.id, table.researchId),
    foreignKey({
      name: 'research_working_copies_artifact_package_owner_fk',
      columns: [table.researchId, table.contentPackageId, table.ownerUserId],
      foreignColumns: [researchArtifacts.id, researchArtifacts.contentPackageId, researchArtifacts.ownerUserId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'research_working_copies_base_version_fk',
      columns: [table.baseVersionId, table.researchId],
      foreignColumns: [researchVersions.id, researchVersions.researchId],
    }).onDelete('restrict'),
    check('research_working_copies_revision_check', sql`${table.revision} >= 1`),
    check(
      'research_working_copies_checkpoint_check',
      sql`${table.checkpointedRevision} IS NULL OR ${table.checkpointedRevision} BETWEEN 1 AND ${table.revision}`,
    ),
    check('research_working_copies_body_check', sql`jsonb_typeof(${table.body}) = 'object'`),
    check('research_working_copies_schema_check', sql`${table.schemaVersion} = 'research/v1'`),
  ],
);

export const researchHeads = pgTable(
  'research_heads',
  {
    researchId: uuid('research_id').primaryKey(),
    contentPackageId: uuid('content_package_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    workingCopyId: uuid('working_copy_id').notNull(),
    latestVersionId: uuid('latest_version_id').notNull(),
    reviewCandidateVersionId: uuid('review_candidate_version_id').notNull(),
    approvedVersionId: uuid('approved_version_id'),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    foreignKey({
      name: 'research_heads_artifact_package_owner_fk',
      columns: [table.researchId, table.contentPackageId, table.ownerUserId],
      foreignColumns: [researchArtifacts.id, researchArtifacts.contentPackageId, researchArtifacts.ownerUserId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'research_heads_working_copy_fk',
      columns: [table.workingCopyId, table.researchId],
      foreignColumns: [researchWorkingCopies.id, researchWorkingCopies.researchId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'research_heads_latest_version_fk',
      columns: [table.latestVersionId, table.researchId],
      foreignColumns: [researchVersions.id, researchVersions.researchId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'research_heads_review_version_fk',
      columns: [table.reviewCandidateVersionId, table.researchId],
      foreignColumns: [researchVersions.id, researchVersions.researchId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'research_heads_approved_version_fk',
      columns: [table.approvedVersionId, table.researchId],
      foreignColumns: [researchVersions.id, researchVersions.researchId],
    }).onDelete('restrict'),
  ],
);

export const researchApprovals = pgTable(
  'research_approvals',
  {
    id: uuid('id').primaryKey(),
    researchId: uuid('research_id').notNull(),
    approvedVersionId: uuid('approved_version_id').notNull(),
    contentPackageId: uuid('content_package_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    approvedById: uuid('approved_by_id').notNull(),
    validationSummary: jsonb('validation_summary').notNull(),
    approvedAt: timestamp('approved_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    unique('research_approvals_research_version_unique').on(table.researchId, table.approvedVersionId),
    foreignKey({
      name: 'research_approvals_artifact_package_owner_fk',
      columns: [table.researchId, table.contentPackageId, table.ownerUserId],
      foreignColumns: [researchArtifacts.id, researchArtifacts.contentPackageId, researchArtifacts.ownerUserId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'research_approvals_version_research_fk',
      columns: [table.approvedVersionId, table.researchId],
      foreignColumns: [researchVersions.id, researchVersions.researchId],
    }).onDelete('restrict'),
    check('research_approvals_owner_check', sql`${table.approvedById} = ${table.ownerUserId}`),
    check('research_approvals_validation_summary_check', sql`jsonb_typeof(${table.validationSummary}) = 'object'`),
  ],
);

export const opinionArtifacts = pgTable(
  'opinion_artifacts',
  {
    id: uuid('id').primaryKey(),
    contentPackageId: uuid('content_package_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    unique('opinion_artifacts_package_unique').on(table.contentPackageId),
    unique('opinion_artifacts_id_package_owner_unique').on(table.id, table.contentPackageId, table.ownerUserId),
    foreignKey({
      name: 'opinion_artifacts_package_owner_fk',
      columns: [table.contentPackageId, table.ownerUserId],
      foreignColumns: [contentPackages.id, contentPackages.ownerUserId],
    }).onDelete('restrict'),
  ],
);

export const opinionDrafts = pgTable(
  'opinion_drafts',
  {
    opinionId: uuid('opinion_id').primaryKey(),
    contentPackageId: uuid('content_package_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    researchVersionId: uuid('research_version_id').notNull(),
    question: text('question').notNull(),
    rawResponse: text('raw_response').notNull(),
    interpretation: text('interpretation').notNull(),
    revision: integer('revision').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    foreignKey({
      name: 'opinion_drafts_artifact_package_owner_fk',
      columns: [table.opinionId, table.contentPackageId, table.ownerUserId],
      foreignColumns: [opinionArtifacts.id, opinionArtifacts.contentPackageId, opinionArtifacts.ownerUserId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'opinion_drafts_research_version_fk',
      columns: [table.researchVersionId],
      foreignColumns: [researchVersions.id],
    }).onDelete('restrict'),
    check('opinion_drafts_revision_check', sql`${table.revision} >= 1`),
    check('opinion_drafts_question_check', sql`char_length(${table.question}) BETWEEN 1 AND 500`),
    check('opinion_drafts_raw_check', sql`octet_length(${table.rawResponse}) BETWEEN 1 AND 10000`),
    check('opinion_drafts_interpretation_check', sql`octet_length(${table.interpretation}) BETWEEN 1 AND 10000`),
  ],
);

export const opinionVersions = pgTable(
  'opinion_versions',
  {
    id: uuid('id').primaryKey(),
    opinionId: uuid('opinion_id').notNull(),
    contentPackageId: uuid('content_package_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    versionNumber: integer('version_number').notNull(),
    researchVersionId: uuid('research_version_id').notNull(),
    question: text('question').notNull(),
    rawResponse: text('raw_response').notNull(),
    interpretation: text('interpretation').notNull(),
    confirmedStatement: text('confirmed_statement').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    unique('opinion_versions_opinion_number_unique').on(table.opinionId, table.versionNumber),
    unique('opinion_versions_id_opinion_unique').on(table.id, table.opinionId),
    foreignKey({
      name: 'opinion_versions_artifact_package_owner_fk',
      columns: [table.opinionId, table.contentPackageId, table.ownerUserId],
      foreignColumns: [opinionArtifacts.id, opinionArtifacts.contentPackageId, opinionArtifacts.ownerUserId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'opinion_versions_research_version_fk',
      columns: [table.researchVersionId],
      foreignColumns: [researchVersions.id],
    }).onDelete('restrict'),
    check('opinion_versions_number_check', sql`${table.versionNumber} >= 1`),
    check('opinion_versions_statement_check', sql`octet_length(${table.confirmedStatement}) BETWEEN 1 AND 10000`),
  ],
);

export const opinionHeads = pgTable(
  'opinion_heads',
  {
    opinionId: uuid('opinion_id').primaryKey(),
    contentPackageId: uuid('content_package_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    confirmedVersionId: uuid('confirmed_version_id'),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    foreignKey({
      name: 'opinion_heads_artifact_package_owner_fk',
      columns: [table.opinionId, table.contentPackageId, table.ownerUserId],
      foreignColumns: [opinionArtifacts.id, opinionArtifacts.contentPackageId, opinionArtifacts.ownerUserId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'opinion_heads_confirmed_version_fk',
      columns: [table.confirmedVersionId, table.opinionId],
      foreignColumns: [opinionVersions.id, opinionVersions.opinionId],
    }).onDelete('restrict'),
  ],
);

export const blogArtifacts = pgTable(
  'blog_artifacts',
  {
    id: uuid('id').primaryKey(),
    contentPackageId: uuid('content_package_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    unique('blog_artifacts_package_unique').on(table.contentPackageId),
    unique('blog_artifacts_id_package_owner_unique').on(table.id, table.contentPackageId, table.ownerUserId),
    foreignKey({
      name: 'blog_artifacts_package_owner_fk',
      columns: [table.contentPackageId, table.ownerUserId],
      foreignColumns: [contentPackages.id, contentPackages.ownerUserId],
    }).onDelete('restrict'),
  ],
);

export const blogRuns = pgTable(
  'blog_runs',
  {
    id: uuid('id').primaryKey(),
    requestId: uuid('request_id').notNull(),
    contentPackageId: uuid('content_package_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    providerAlias: varchar('provider_alias', { length: 100 }).notNull(),
    rawOutput: text('raw_output').notNull(),
    state: varchar('state', { length: 16 }).notNull(),
    safeErrorCode: varchar('safe_error_code', { length: 64 }),
    blogId: uuid('blog_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    unique('blog_runs_request_owner_unique').on(table.requestId, table.ownerUserId),
    foreignKey({
      name: 'blog_runs_package_owner_fk',
      columns: [table.contentPackageId, table.ownerUserId],
      foreignColumns: [contentPackages.id, contentPackages.ownerUserId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'blog_runs_artifact_package_owner_fk',
      columns: [table.blogId, table.contentPackageId, table.ownerUserId],
      foreignColumns: [blogArtifacts.id, blogArtifacts.contentPackageId, blogArtifacts.ownerUserId],
    }).onDelete('restrict'),
    check('blog_runs_state_check', sql`${table.state} IN ('succeeded', 'failed')`),
    check('blog_runs_raw_output_check', sql`octet_length(${table.rawOutput}) BETWEEN 0 AND 1000000`),
  ],
);

export const blogVersions = pgTable(
  'blog_versions',
  {
    id: uuid('id').primaryKey(),
    blogId: uuid('blog_id').notNull(),
    contentPackageId: uuid('content_package_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    versionNumber: integer('version_number').notNull(),
    parentVersionId: uuid('parent_version_id'),
    body: jsonb('body').$type<Record<string, unknown>>().notNull(),
    contentHash: char('content_hash', { length: 64 }).notNull(),
    schemaVersion: varchar('schema_version', { length: 32 }).notNull(),
    researchVersionId: uuid('research_version_id').notNull(),
    opinionVersionId: uuid('opinion_version_id'),
    contentMode: varchar('content_mode', { length: 32 }).notNull(),
    origin: varchar('origin', { length: 32 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    unique('blog_versions_id_blog_unique').on(table.id, table.blogId),
    unique('blog_versions_blog_number_unique').on(table.blogId, table.versionNumber),
    foreignKey({
      name: 'blog_versions_artifact_package_owner_fk',
      columns: [table.blogId, table.contentPackageId, table.ownerUserId],
      foreignColumns: [blogArtifacts.id, blogArtifacts.contentPackageId, blogArtifacts.ownerUserId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'blog_versions_parent_blog_fk',
      columns: [table.parentVersionId, table.blogId],
      foreignColumns: [table.id, table.blogId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'blog_versions_research_version_fk',
      columns: [table.researchVersionId],
      foreignColumns: [researchVersions.id],
    }).onDelete('restrict'),
    foreignKey({
      name: 'blog_versions_opinion_version_fk',
      columns: [table.opinionVersionId],
      foreignColumns: [opinionVersions.id],
    }).onDelete('restrict'),
    check('blog_versions_number_check', sql`${table.versionNumber} >= 1`),
    check('blog_versions_body_check', sql`jsonb_typeof(${table.body}) = 'object'`),
    check('blog_versions_hash_check', sql`${table.contentHash} ~ '^[0-9a-f]{64}$'`),
    check('blog_versions_schema_check', sql`${table.schemaVersion} = 'blog/v1'`),
    check('blog_versions_mode_check', sql`${table.contentMode} IN ('creator_led', 'research_based')`),
    check('blog_versions_origin_check', sql`${table.origin} IN ('generated', 'user_checkpoint')`),
  ],
);

export const blogWorkingCopies = pgTable(
  'blog_working_copies',
  {
    id: uuid('id').primaryKey(),
    blogId: uuid('blog_id').notNull(),
    contentPackageId: uuid('content_package_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    body: jsonb('body').$type<Record<string, unknown>>().notNull(),
    revision: integer('revision').notNull(),
    checkpointedRevision: integer('checkpointed_revision'),
    baseVersionId: uuid('base_version_id').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    unique('blog_working_copies_blog_unique').on(table.blogId),
    unique('blog_working_copies_id_blog_unique').on(table.id, table.blogId),
    foreignKey({
      name: 'blog_working_copies_artifact_package_owner_fk',
      columns: [table.blogId, table.contentPackageId, table.ownerUserId],
      foreignColumns: [blogArtifacts.id, blogArtifacts.contentPackageId, blogArtifacts.ownerUserId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'blog_working_copies_base_version_fk',
      columns: [table.baseVersionId, table.blogId],
      foreignColumns: [blogVersions.id, blogVersions.blogId],
    }).onDelete('restrict'),
    check('blog_working_copies_revision_check', sql`${table.revision} >= 1`),
  ],
);

export const blogHeads = pgTable(
  'blog_heads',
  {
    blogId: uuid('blog_id').primaryKey(),
    contentPackageId: uuid('content_package_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    workingCopyId: uuid('working_copy_id').notNull(),
    latestVersionId: uuid('latest_version_id').notNull(),
    reviewCandidateVersionId: uuid('review_candidate_version_id').notNull(),
    approvedVersionId: uuid('approved_version_id'),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    foreignKey({
      name: 'blog_heads_artifact_package_owner_fk',
      columns: [table.blogId, table.contentPackageId, table.ownerUserId],
      foreignColumns: [blogArtifacts.id, blogArtifacts.contentPackageId, blogArtifacts.ownerUserId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'blog_heads_working_copy_fk',
      columns: [table.workingCopyId, table.blogId],
      foreignColumns: [blogWorkingCopies.id, blogWorkingCopies.blogId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'blog_heads_latest_version_fk',
      columns: [table.latestVersionId, table.blogId],
      foreignColumns: [blogVersions.id, blogVersions.blogId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'blog_heads_review_version_fk',
      columns: [table.reviewCandidateVersionId, table.blogId],
      foreignColumns: [blogVersions.id, blogVersions.blogId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'blog_heads_approved_version_fk',
      columns: [table.approvedVersionId, table.blogId],
      foreignColumns: [blogVersions.id, blogVersions.blogId],
    }).onDelete('restrict'),
  ],
);

export const blogApprovals = pgTable(
  'blog_approvals',
  {
    id: uuid('id').primaryKey(),
    blogId: uuid('blog_id').notNull(),
    approvedVersionId: uuid('approved_version_id').notNull(),
    contentPackageId: uuid('content_package_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    approvedById: uuid('approved_by_id').notNull(),
    validationSummary: jsonb('validation_summary').notNull(),
    approvedAt: timestamp('approved_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    unique('blog_approvals_blog_version_unique').on(table.blogId, table.approvedVersionId),
    foreignKey({
      name: 'blog_approvals_artifact_package_owner_fk',
      columns: [table.blogId, table.contentPackageId, table.ownerUserId],
      foreignColumns: [blogArtifacts.id, blogArtifacts.contentPackageId, blogArtifacts.ownerUserId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'blog_approvals_version_blog_fk',
      columns: [table.approvedVersionId, table.blogId],
      foreignColumns: [blogVersions.id, blogVersions.blogId],
    }).onDelete('restrict'),
    check('blog_approvals_owner_check', sql`${table.approvedById} = ${table.ownerUserId}`),
    check('blog_approvals_validation_summary_check', sql`jsonb_typeof(${table.validationSummary}) = 'object'`),
  ],
);

export const xiaohongshuStates = pgTable(
  'xiaohongshu_states',
  {
    artifactId: uuid('artifact_id').primaryKey(),
    contentPackageId: uuid('content_package_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    workingCopyId: uuid('working_copy_id').notNull(),
    body: jsonb('body').$type<Record<string, unknown>>().notNull(),
    plan: jsonb('plan').$type<Record<string, unknown>>().notNull(),
    revision: integer('revision').notNull(),
    checkpointedRevision: integer('checkpointed_revision'),
    latestVersionId: uuid('latest_version_id').notNull(),
    approvedVersionId: uuid('approved_version_id'),
    approvalValidationSummary: jsonb('approval_validation_summary'),
    researchVersionId: uuid('research_version_id').notNull(),
    opinionVersionId: uuid('opinion_version_id'),
    contentMode: varchar('content_mode', { length: 32 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    unique('xiaohongshu_states_package_unique').on(table.contentPackageId),
    unique('xiaohongshu_states_artifact_package_owner_unique').on(
      table.artifactId,
      table.contentPackageId,
      table.ownerUserId,
    ),
    foreignKey({
      name: 'xiaohongshu_states_package_owner_fk',
      columns: [table.contentPackageId, table.ownerUserId],
      foreignColumns: [contentPackages.id, contentPackages.ownerUserId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'xiaohongshu_states_research_version_fk',
      columns: [table.researchVersionId],
      foreignColumns: [researchVersions.id],
    }).onDelete('restrict'),
    foreignKey({
      name: 'xiaohongshu_states_opinion_version_fk',
      columns: [table.opinionVersionId],
      foreignColumns: [opinionVersions.id],
    }).onDelete('restrict'),
    check('xiaohongshu_states_revision_check', sql`${table.revision} >= 1`),
    check('xiaohongshu_states_mode_check', sql`${table.contentMode} IN ('creator_led', 'research_based')`),
  ],
);

export const xiaohongshuVersions = pgTable(
  'xiaohongshu_versions',
  {
    id: uuid('id').primaryKey(),
    artifactId: uuid('artifact_id').notNull(),
    contentPackageId: uuid('content_package_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    versionNumber: integer('version_number').notNull(),
    body: jsonb('body').$type<Record<string, unknown>>().notNull(),
    plan: jsonb('plan').$type<Record<string, unknown>>().notNull(),
    researchVersionId: uuid('research_version_id').notNull(),
    opinionVersionId: uuid('opinion_version_id'),
    contentMode: varchar('content_mode', { length: 32 }).notNull(),
    origin: varchar('origin', { length: 32 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    unique('xiaohongshu_versions_artifact_number_unique').on(table.artifactId, table.versionNumber),
    foreignKey({
      name: 'xiaohongshu_versions_state_fk',
      columns: [table.artifactId, table.contentPackageId, table.ownerUserId],
      foreignColumns: [xiaohongshuStates.artifactId, xiaohongshuStates.contentPackageId, xiaohongshuStates.ownerUserId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'xiaohongshu_versions_research_version_fk',
      columns: [table.researchVersionId],
      foreignColumns: [researchVersions.id],
    }).onDelete('restrict'),
    foreignKey({
      name: 'xiaohongshu_versions_opinion_version_fk',
      columns: [table.opinionVersionId],
      foreignColumns: [opinionVersions.id],
    }).onDelete('restrict'),
    check('xiaohongshu_versions_number_check', sql`${table.versionNumber} >= 1`),
    check('xiaohongshu_versions_mode_check', sql`${table.contentMode} IN ('creator_led', 'research_based')`),
    check('xiaohongshu_versions_origin_check', sql`${table.origin} IN ('generated', 'user_checkpoint')`),
  ],
);

export const xiaohongshuRuns = pgTable(
  'xiaohongshu_runs',
  {
    id: uuid('id').primaryKey(),
    requestId: uuid('request_id').notNull(),
    contentPackageId: uuid('content_package_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    providerAlias: varchar('provider_alias', { length: 100 }).notNull(),
    rawOutput: text('raw_output').notNull(),
    artifactId: uuid('artifact_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    unique('xiaohongshu_runs_request_owner_unique').on(table.requestId, table.ownerUserId),
    foreignKey({
      name: 'xiaohongshu_runs_package_owner_fk',
      columns: [table.contentPackageId, table.ownerUserId],
      foreignColumns: [contentPackages.id, contentPackages.ownerUserId],
    }).onDelete('restrict'),
    check('xiaohongshu_runs_raw_output_check', sql`octet_length(${table.rawOutput}) BETWEEN 0 AND 1000000`),
  ],
);

export const xiaohongshuApprovals = pgTable(
  'xiaohongshu_approvals',
  {
    id: uuid('id').primaryKey(),
    artifactId: uuid('artifact_id').notNull(),
    approvedVersionId: uuid('approved_version_id').notNull(),
    contentPackageId: uuid('content_package_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    validationSummary: jsonb('validation_summary').notNull(),
    approvedAt: timestamp('approved_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    unique('xiaohongshu_approvals_artifact_version_unique').on(table.artifactId, table.approvedVersionId),
    foreignKey({
      name: 'xiaohongshu_approvals_version_fk',
      columns: [table.approvedVersionId],
      foreignColumns: [xiaohongshuVersions.id],
    }).onDelete('restrict'),
    check('xiaohongshu_approvals_summary_check', sql`jsonb_typeof(${table.validationSummary}) = 'object'`),
  ],
);

export const workflowTemplates = pgTable(
  'workflow_templates',
  {
    templateId: varchar('template_id', { length: 128 }).notNull(),
    templateVersion: varchar('template_version', { length: 32 }).notNull(),
    definitionSha256: char('definition_sha256', { length: 64 }).notNull(),
    seededAt: timestamp('seeded_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.templateId, table.templateVersion] }),
    unique('workflow_templates_id_version_hash_unique').on(
      table.templateId,
      table.templateVersion,
      table.definitionSha256,
    ),
    check(
      'workflow_templates_id_nonempty_check',
      sql`btrim(${table.templateId}) <> '' AND char_length(${table.templateId}) BETWEEN 1 AND 128`,
    ),
    check(
      'workflow_templates_version_nonempty_check',
      sql`btrim(${table.templateVersion}) <> '' AND char_length(${table.templateVersion}) BETWEEN 1 AND 32`,
    ),
    check('workflow_templates_definition_sha256_format_check', sql`${table.definitionSha256} ~ '^[0-9a-f]{64}$'`),
  ],
);

export const workflowTemplateNodes = pgTable(
  'workflow_template_nodes',
  {
    templateId: varchar('template_id', { length: 128 }).notNull(),
    templateVersion: varchar('template_version', { length: 32 }).notNull(),
    nodeKey: varchar('node_key', { length: 128 }).notNull(),
    ordinal: integer('ordinal').notNull(),
    kind: varchar('kind', { length: 16 }).notNull(),
    requiresHumanGate: boolean('requires_human_gate').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.templateId, table.templateVersion, table.nodeKey] }),
    unique('workflow_template_nodes_template_ordinal_unique').on(
      table.templateId,
      table.templateVersion,
      table.ordinal,
    ),
    foreignKey({
      name: 'workflow_template_nodes_template_fk',
      columns: [table.templateId, table.templateVersion],
      foreignColumns: [workflowTemplates.templateId, workflowTemplates.templateVersion],
    }).onDelete('restrict'),
    check(
      'workflow_template_nodes_key_nonempty_check',
      sql`btrim(${table.nodeKey}) <> '' AND char_length(${table.nodeKey}) BETWEEN 1 AND 128`,
    ),
    check('workflow_template_nodes_ordinal_check', sql`${table.ordinal} >= 1`),
    check(
      'workflow_template_nodes_kind_gate_check',
      sql`(${table.kind} = 'work' AND ${table.requiresHumanGate} = false) OR (${table.kind} = 'gate' AND ${table.requiresHumanGate} = true)`,
    ),
  ],
);

export const workflowTemplateEdges = pgTable(
  'workflow_template_edges',
  {
    templateId: varchar('template_id', { length: 128 }).notNull(),
    templateVersion: varchar('template_version', { length: 32 }).notNull(),
    ordinal: integer('ordinal').notNull(),
    fromNodeKey: varchar('from_node_key', { length: 128 }).notNull(),
    toNodeKey: varchar('to_node_key', { length: 128 }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.templateId, table.templateVersion, table.ordinal] }),
    unique('workflow_template_edges_pair_unique').on(
      table.templateId,
      table.templateVersion,
      table.fromNodeKey,
      table.toNodeKey,
    ),
    foreignKey({
      name: 'workflow_template_edges_from_node_fk',
      columns: [table.templateId, table.templateVersion, table.fromNodeKey],
      foreignColumns: [
        workflowTemplateNodes.templateId,
        workflowTemplateNodes.templateVersion,
        workflowTemplateNodes.nodeKey,
      ],
    }).onDelete('restrict'),
    foreignKey({
      name: 'workflow_template_edges_to_node_fk',
      columns: [table.templateId, table.templateVersion, table.toNodeKey],
      foreignColumns: [
        workflowTemplateNodes.templateId,
        workflowTemplateNodes.templateVersion,
        workflowTemplateNodes.nodeKey,
      ],
    }).onDelete('restrict'),
    check('workflow_template_edges_ordinal_check', sql`${table.ordinal} >= 1`),
    check('workflow_template_edges_not_self_check', sql`${table.fromNodeKey} <> ${table.toNodeKey}`),
  ],
);

export const workflowInstances = pgTable(
  'workflow_instances',
  {
    id: uuid('id').primaryKey(),
    contentPackageId: uuid('content_package_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    templateId: varchar('template_id', { length: 128 }).notNull(),
    templateVersion: varchar('template_version', { length: 32 }).notNull(),
    definitionSha256: char('definition_sha256', { length: 64 }).notNull(),
    lifecycle: varchar('lifecycle', { length: 16 }).notNull(),
    revision: integer('revision').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    unique('workflow_instances_id_package_owner_unique').on(table.id, table.contentPackageId, table.ownerUserId),
    unique('workflow_instances_node_binding_unique').on(
      table.id,
      table.contentPackageId,
      table.ownerUserId,
      table.templateId,
      table.templateVersion,
    ),
    unique('workflow_instances_package_template_unique').on(
      table.contentPackageId,
      table.templateId,
      table.templateVersion,
    ),
    foreignKey({
      name: 'workflow_instances_package_owner_fk',
      columns: [table.contentPackageId, table.ownerUserId],
      foreignColumns: [contentPackages.id, contentPackages.ownerUserId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'workflow_instances_template_binding_fk',
      columns: [table.templateId, table.templateVersion, table.definitionSha256],
      foreignColumns: [
        workflowTemplates.templateId,
        workflowTemplates.templateVersion,
        workflowTemplates.definitionSha256,
      ],
    }).onDelete('restrict'),
    check('workflow_instances_definition_sha256_format_check', sql`${table.definitionSha256} ~ '^[0-9a-f]{64}$'`),
    check(
      'workflow_instances_lifecycle_check',
      sql`${table.lifecycle} IN ('active', 'paused', 'completed', 'failed', 'cancelled')`,
    ),
    check('workflow_instances_revision_check', sql`${table.revision} >= 1`),
  ],
);

export const workflowNodes = pgTable(
  'workflow_nodes',
  {
    id: uuid('id').primaryKey(),
    workflowInstanceId: uuid('workflow_instance_id').notNull(),
    contentPackageId: uuid('content_package_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    templateId: varchar('template_id', { length: 128 }).notNull(),
    templateVersion: varchar('template_version', { length: 32 }).notNull(),
    templateNodeKey: varchar('template_node_key', { length: 128 }).notNull(),
    state: varchar('state', { length: 32 }).notNull(),
    revision: integer('revision').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    unique('workflow_nodes_id_binding_unique').on(
      table.id,
      table.workflowInstanceId,
      table.contentPackageId,
      table.ownerUserId,
    ),
    unique('workflow_nodes_instance_key_unique').on(table.workflowInstanceId, table.templateNodeKey),
    foreignKey({
      name: 'workflow_nodes_instance_binding_fk',
      columns: [
        table.workflowInstanceId,
        table.contentPackageId,
        table.ownerUserId,
        table.templateId,
        table.templateVersion,
      ],
      foreignColumns: [
        workflowInstances.id,
        workflowInstances.contentPackageId,
        workflowInstances.ownerUserId,
        workflowInstances.templateId,
        workflowInstances.templateVersion,
      ],
    }).onDelete('restrict'),
    foreignKey({
      name: 'workflow_nodes_template_node_fk',
      columns: [table.templateId, table.templateVersion, table.templateNodeKey],
      foreignColumns: [
        workflowTemplateNodes.templateId,
        workflowTemplateNodes.templateVersion,
        workflowTemplateNodes.nodeKey,
      ],
    }).onDelete('restrict'),
    index('workflow_nodes_owner_instance_idx').on(table.ownerUserId, table.workflowInstanceId),
    check(
      'workflow_nodes_key_nonempty_check',
      sql`btrim(${table.templateNodeKey}) <> '' AND char_length(${table.templateNodeKey}) BETWEEN 1 AND 128`,
    ),
    check(
      'workflow_nodes_state_check',
      sql`${table.state} IN ('not_ready', 'ready', 'running', 'awaiting_human', 'completed', 'failed', 'skipped', 'cancelled')`,
    ),
    check('workflow_nodes_revision_check', sql`${table.revision} >= 1`),
  ],
);

export const workflowEvents = pgTable(
  'workflow_events',
  {
    id: uuid('id').primaryKey(),
    workflowInstanceId: uuid('workflow_instance_id').notNull(),
    contentPackageId: uuid('content_package_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    sequence: integer('sequence').notNull(),
    eventType: varchar('event_type', { length: 128 }).notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'date' }).notNull(),
    workflowNodeId: uuid('workflow_node_id'),
  },
  (table) => [
    unique('workflow_events_instance_sequence_unique').on(table.workflowInstanceId, table.sequence),
    foreignKey({
      name: 'workflow_events_instance_owner_fk',
      columns: [table.workflowInstanceId, table.contentPackageId, table.ownerUserId],
      foreignColumns: [workflowInstances.id, workflowInstances.contentPackageId, workflowInstances.ownerUserId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'workflow_events_node_instance_owner_fk',
      columns: [table.workflowNodeId, table.workflowInstanceId, table.contentPackageId, table.ownerUserId],
      foreignColumns: [
        workflowNodes.id,
        workflowNodes.workflowInstanceId,
        workflowNodes.contentPackageId,
        workflowNodes.ownerUserId,
      ],
    }).onDelete('restrict'),
    index('workflow_events_owner_instance_sequence_idx').on(
      table.ownerUserId,
      table.workflowInstanceId,
      table.sequence,
    ),
    check('workflow_events_sequence_check', sql`${table.sequence} >= 1`),
    check(
      'workflow_events_type_nonempty_check',
      sql`btrim(${table.eventType}) <> '' AND char_length(${table.eventType}) BETWEEN 1 AND 128`,
    ),
    check('workflow_events_payload_object_check', sql`jsonb_typeof(${table.payload}) = 'object'`),
  ],
);

export const urlSourceReferences = pgTable(
  'url_source_references',
  {
    id: uuid('id').primaryKey(),
    contentPackageId: uuid('content_package_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    role: varchar('role', { length: 16 }).notNull(),
    submittedUrl: text('submitted_url').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    unique('url_source_references_id_package_owner_unique').on(table.id, table.contentPackageId, table.ownerUserId),
    foreignKey({
      name: 'url_source_references_package_owner_fk',
      columns: [table.contentPackageId, table.ownerUserId],
      foreignColumns: [contentPackages.id, contentPackages.ownerUserId],
    }).onDelete('restrict'),
    index('url_source_references_owner_package_created_idx').on(
      table.ownerUserId,
      table.contentPackageId,
      table.createdAt,
      table.id,
    ),
    check('url_source_references_role_check', sql`${table.role} IN ('primary', 'supporting')`),
    check(
      'url_source_references_submitted_url_check',
      sql`btrim(${table.submittedUrl}) = ${table.submittedUrl} AND octet_length(${table.submittedUrl}) BETWEEN 1 AND 2048 AND ${table.submittedUrl} !~ '[[:cntrl:]]'`,
    ),
  ],
);

export const urlCaptureRequests = pgTable(
  'url_capture_requests',
  {
    id: uuid('id').primaryKey(),
    sourceReferenceId: uuid('source_reference_id').notNull(),
    workflowInstanceId: uuid('workflow_instance_id').notNull(),
    workflowNodeId: uuid('workflow_node_id').notNull(),
    contentPackageId: uuid('content_package_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    expectedPackageRevision: integer('expected_package_revision').notNull(),
    commandKind: varchar('command_kind', { length: 64 }).notNull(),
    idempotencyKey: varchar('idempotency_key', { length: 128 }).notNull(),
    requestFingerprint: char('request_fingerprint', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    unique('url_capture_requests_id_package_owner_unique').on(table.id, table.contentPackageId, table.ownerUserId),
    unique('url_capture_requests_id_reference_package_owner_unique').on(
      table.id,
      table.sourceReferenceId,
      table.contentPackageId,
      table.ownerUserId,
    ),
    unique('url_capture_requests_id_node_instance_package_owner_unique').on(
      table.id,
      table.workflowNodeId,
      table.workflowInstanceId,
      table.contentPackageId,
      table.ownerUserId,
    ),
    unique('url_capture_requests_source_reference_unique').on(table.sourceReferenceId),
    unique('url_capture_requests_node_unique').on(table.workflowNodeId),
    unique('url_capture_requests_owner_package_kind_key_unique').on(
      table.ownerUserId,
      table.contentPackageId,
      table.commandKind,
      table.idempotencyKey,
    ),
    foreignKey({
      name: 'url_capture_requests_source_reference_binding_fk',
      columns: [table.sourceReferenceId, table.contentPackageId, table.ownerUserId],
      foreignColumns: [urlSourceReferences.id, urlSourceReferences.contentPackageId, urlSourceReferences.ownerUserId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'url_capture_requests_instance_binding_fk',
      columns: [table.workflowInstanceId, table.contentPackageId, table.ownerUserId],
      foreignColumns: [workflowInstances.id, workflowInstances.contentPackageId, workflowInstances.ownerUserId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'url_capture_requests_node_binding_fk',
      columns: [table.workflowNodeId, table.workflowInstanceId, table.contentPackageId, table.ownerUserId],
      foreignColumns: [
        workflowNodes.id,
        workflowNodes.workflowInstanceId,
        workflowNodes.contentPackageId,
        workflowNodes.ownerUserId,
      ],
    }).onDelete('restrict'),
    index('url_capture_requests_owner_package_created_idx').on(
      table.ownerUserId,
      table.contentPackageId,
      table.createdAt,
      table.id,
    ),
    check('url_capture_requests_expected_revision_check', sql`${table.expectedPackageRevision} >= 1`),
    check('url_capture_requests_command_kind_check', sql`${table.commandKind} = 'url_capture_request'`),
    check('url_capture_requests_idempotency_key_check', sql`${table.idempotencyKey} ~ '^[A-Za-z0-9_-]{16,128}$'`),
    check('url_capture_requests_fingerprint_check', sql`${table.requestFingerprint} ~ '^[0-9a-f]{64}$'`),
  ],
);

export const workflowTasks = pgTable(
  'workflow_tasks',
  {
    id: uuid('id').primaryKey(),
    workflowInstanceId: uuid('workflow_instance_id').notNull(),
    workflowNodeId: uuid('workflow_node_id').notNull(),
    urlCaptureRequestId: uuid('url_capture_request_id').notNull(),
    contentPackageId: uuid('content_package_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    kind: varchar('kind', { length: 32 }).notNull(),
    state: varchar('state', { length: 16 }).notNull(),
    claimAttemptNumber: integer('claim_attempt_number').notNull().default(0),
    claimHash: char('claim_hash', { length: 64 }),
    claimedBy: varchar('claimed_by', { length: 16 }),
    leaseStartedAt: timestamp('lease_started_at', { withTimezone: true, mode: 'date' }),
    leaseExpiresAt: timestamp('lease_expires_at', { withTimezone: true, mode: 'date' }),
    leaseHeartbeatAt: timestamp('lease_heartbeat_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    unique('workflow_tasks_id_package_owner_unique').on(table.id, table.contentPackageId, table.ownerUserId),
    unique('workflow_tasks_id_request_package_owner_unique').on(
      table.id,
      table.urlCaptureRequestId,
      table.contentPackageId,
      table.ownerUserId,
    ),
    unique('workflow_tasks_request_unique').on(table.urlCaptureRequestId),
    foreignKey({
      name: 'workflow_tasks_instance_binding_fk',
      columns: [table.workflowInstanceId, table.contentPackageId, table.ownerUserId],
      foreignColumns: [workflowInstances.id, workflowInstances.contentPackageId, workflowInstances.ownerUserId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'workflow_tasks_node_binding_fk',
      columns: [table.workflowNodeId, table.workflowInstanceId, table.contentPackageId, table.ownerUserId],
      foreignColumns: [
        workflowNodes.id,
        workflowNodes.workflowInstanceId,
        workflowNodes.contentPackageId,
        workflowNodes.ownerUserId,
      ],
    }).onDelete('restrict'),
    foreignKey({
      name: 'workflow_tasks_request_binding_fk',
      columns: [table.urlCaptureRequestId, table.contentPackageId, table.ownerUserId],
      foreignColumns: [urlCaptureRequests.id, urlCaptureRequests.contentPackageId, urlCaptureRequests.ownerUserId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'workflow_tasks_request_graph_binding_fk',
      columns: [
        table.urlCaptureRequestId,
        table.workflowNodeId,
        table.workflowInstanceId,
        table.contentPackageId,
        table.ownerUserId,
      ],
      foreignColumns: [
        urlCaptureRequests.id,
        urlCaptureRequests.workflowNodeId,
        urlCaptureRequests.workflowInstanceId,
        urlCaptureRequests.contentPackageId,
        urlCaptureRequests.ownerUserId,
      ],
    }).onDelete('restrict'),
    index('workflow_tasks_owner_package_state_idx').on(table.ownerUserId, table.contentPackageId, table.state),
    check('workflow_tasks_kind_check', sql`${table.kind} = 'url_capture'`),
    check('workflow_tasks_state_check', sql`${table.state} IN ('queued', 'leased', 'succeeded', 'failed')`),
    check('workflow_tasks_claim_attempt_number_check', sql`${table.claimAttemptNumber} >= 0`),
    check(
      'workflow_tasks_claim_hash_format_check',
      sql`${table.claimHash} IS NULL OR ${table.claimHash} ~ '^[0-9a-f]{64}$'`,
    ),
    check('workflow_tasks_claimed_by_check', sql`${table.claimedBy} IS NULL OR ${table.claimedBy} = 'fetcher'`),
    check(
      'workflow_tasks_lease_state_check',
      sql`(${table.state} = 'queued' AND ${table.claimHash} IS NULL AND ${table.claimedBy} IS NULL AND ${table.leaseStartedAt} IS NULL AND ${table.leaseExpiresAt} IS NULL AND ${table.leaseHeartbeatAt} IS NULL) OR (${table.state} = 'leased' AND ${table.claimAttemptNumber} >= 1 AND ${table.claimHash} IS NOT NULL AND ${table.claimedBy} = 'fetcher' AND ${table.leaseStartedAt} IS NOT NULL AND ${table.leaseExpiresAt} IS NOT NULL AND ${table.leaseHeartbeatAt} IS NOT NULL AND ${table.leaseStartedAt} <= ${table.leaseHeartbeatAt} AND ${table.leaseHeartbeatAt} < ${table.leaseExpiresAt}) OR (${table.state} IN ('succeeded', 'failed') AND ${table.claimAttemptNumber} >= 1 AND ${table.claimHash} IS NULL AND ${table.claimedBy} IS NULL AND ${table.leaseStartedAt} IS NULL AND ${table.leaseExpiresAt} IS NULL AND ${table.leaseHeartbeatAt} IS NULL)`,
    ),
  ],
);

export const workflowOutboxRecords = pgTable(
  'workflow_outbox_records',
  {
    id: uuid('id').primaryKey(),
    taskId: uuid('task_id').notNull(),
    contentPackageId: uuid('content_package_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    category: varchar('category', { length: 32 }).notNull(),
    envelopeVersion: varchar('envelope_version', { length: 32 }).notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    state: varchar('state', { length: 16 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    deliveryGeneration: integer('delivery_generation').notNull().default(1),
    dispatchAttemptCount: integer('dispatch_attempt_count').notNull().default(0),
    dispatchLeaseExpiresAt: timestamp('dispatch_lease_expires_at', { withTimezone: true, mode: 'date' }),
    lastDispatchAt: timestamp('last_dispatch_at', { withTimezone: true, mode: 'date' }),
    dispatchedAt: timestamp('dispatched_at', { withTimezone: true, mode: 'date' }),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    unique('workflow_outbox_records_id_task_owner_unique').on(table.id, table.taskId, table.ownerUserId),
    unique('workflow_outbox_records_task_unique').on(table.taskId),
    foreignKey({
      name: 'workflow_outbox_records_task_binding_fk',
      columns: [table.taskId, table.contentPackageId, table.ownerUserId],
      foreignColumns: [workflowTasks.id, workflowTasks.contentPackageId, workflowTasks.ownerUserId],
    }).onDelete('restrict'),
    index('workflow_outbox_records_dispatch_eligibility_idx').on(
      table.state,
      table.dispatchLeaseExpiresAt,
      table.createdAt,
      table.id,
    ),
    check('workflow_outbox_records_category_check', sql`${table.category} = 'fetcher'`),
    check('workflow_outbox_records_envelope_version_check', sql`${table.envelopeVersion} = 'fetcher-task/v1'`),
    check('workflow_outbox_records_state_check', sql`${table.state} IN ('pending', 'dispatching', 'dispatched')`),
    check('workflow_outbox_records_delivery_generation_check', sql`${table.deliveryGeneration} >= 1`),
    check('workflow_outbox_records_dispatch_attempt_count_check', sql`${table.dispatchAttemptCount} >= 0`),
    check(
      'workflow_outbox_records_dispatch_lease_check',
      sql`(${table.state} = 'dispatching' AND ${table.dispatchLeaseExpiresAt} IS NOT NULL) OR (${table.state} <> 'dispatching' AND ${table.dispatchLeaseExpiresAt} IS NULL)`,
    ),
    check(
      'workflow_outbox_records_acknowledgement_state_check',
      sql`(${table.state} = 'dispatched' AND ${table.lastDispatchAt} IS NOT NULL AND ${table.dispatchedAt} IS NOT NULL) OR (${table.state} <> 'dispatched' AND ${table.lastDispatchAt} IS NULL AND ${table.dispatchedAt} IS NULL)`,
    ),
    check(
      'workflow_outbox_records_acknowledgement_timestamp_check',
      sql`(${table.lastDispatchAt} IS NULL AND ${table.dispatchedAt} IS NULL) OR (${table.lastDispatchAt} IS NOT NULL AND ${table.dispatchedAt} IS NOT NULL AND ${table.lastDispatchAt} = ${table.dispatchedAt} AND ${table.lastDispatchAt} >= ${table.createdAt})`,
    ),
    check('workflow_outbox_records_updated_at_check', sql`${table.updatedAt} >= ${table.createdAt}`),
    check('workflow_outbox_records_payload_object_check', sql`jsonb_typeof(${table.payload}) = 'object'`),
    check(
      'workflow_outbox_records_payload_shape_check',
      sql`${table.payload} ?& ARRAY['taskId', 'taskKind', 'envelopeVersion'] AND (${table.payload} - 'taskId' - 'taskKind' - 'envelopeVersion') = '{}'::jsonb AND jsonb_typeof(${table.payload}->'taskId') = 'string' AND ${table.payload}->>'taskKind' = 'url_capture' AND ${table.payload}->>'envelopeVersion' = 'fetcher-task/v1'`,
    ),
  ],
);

export const urlCaptureResults = pgTable(
  'url_capture_results',
  {
    id: uuid('id').primaryKey(),
    taskId: uuid('task_id').notNull(),
    urlCaptureRequestId: uuid('url_capture_request_id').notNull(),
    sourceReferenceId: uuid('source_reference_id').notNull(),
    contentPackageId: uuid('content_package_id').notNull(),
    ownerUserId: uuid('owner_user_id').notNull(),
    attemptNumber: integer('attempt_number').notNull(),
    claimHash: char('claim_hash', { length: 64 }).notNull(),
    resultVersion: varchar('result_version', { length: 32 }).notNull(),
    submittedPayloadSha256: char('submitted_payload_sha256', { length: 64 }).notNull(),
    submittedOutcome: varchar('submitted_outcome', { length: 16 }).notNull(),
    submittedCategory: varchar('submitted_category', { length: 32 }),
    recordedOutcome: varchar('recorded_outcome', { length: 16 }).notNull(),
    recordedCategory: varchar('recorded_category', { length: 32 }),
    safeCode: varchar('safe_code', { length: 32 }),
    sourceId: uuid('source_id'),
    snapshotId: uuid('snapshot_id'),
    successEvidence: jsonb('success_evidence').$type<Record<string, unknown>>(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    unique('url_capture_results_task_unique').on(table.taskId),
    unique('url_capture_results_id_task_owner_unique').on(table.id, table.taskId, table.ownerUserId),
    foreignKey({
      name: 'url_capture_results_task_binding_fk',
      columns: [table.taskId, table.urlCaptureRequestId, table.contentPackageId, table.ownerUserId],
      foreignColumns: [
        workflowTasks.id,
        workflowTasks.urlCaptureRequestId,
        workflowTasks.contentPackageId,
        workflowTasks.ownerUserId,
      ],
    }).onDelete('restrict'),
    foreignKey({
      name: 'url_capture_results_request_binding_fk',
      columns: [table.urlCaptureRequestId, table.sourceReferenceId, table.contentPackageId, table.ownerUserId],
      foreignColumns: [
        urlCaptureRequests.id,
        urlCaptureRequests.sourceReferenceId,
        urlCaptureRequests.contentPackageId,
        urlCaptureRequests.ownerUserId,
      ],
    }).onDelete('restrict'),
    foreignKey({
      name: 'url_capture_results_reference_binding_fk',
      columns: [table.sourceReferenceId, table.contentPackageId, table.ownerUserId],
      foreignColumns: [urlSourceReferences.id, urlSourceReferences.contentPackageId, urlSourceReferences.ownerUserId],
    }).onDelete('restrict'),
    foreignKey({
      name: 'url_capture_results_package_owner_fk',
      columns: [table.contentPackageId, table.ownerUserId],
      foreignColumns: [contentPackages.id, contentPackages.ownerUserId],
    }).onDelete('restrict'),
    index('url_capture_results_owner_package_idx').on(table.ownerUserId, table.contentPackageId),
    check('url_capture_results_attempt_number_check', sql`${table.attemptNumber} >= 1`),
    check('url_capture_results_claim_hash_format_check', sql`${table.claimHash} ~ '^[0-9a-f]{64}$'`),
    check('url_capture_results_result_version_check', sql`${table.resultVersion} = 'fetcher-result/v1'`),
    check('url_capture_results_payload_sha256_format_check', sql`${table.submittedPayloadSha256} ~ '^[0-9a-f]{64}$'`),
    check('url_capture_results_submitted_outcome_check', sql`${table.submittedOutcome} IN ('succeeded', 'failed')`),
    check('url_capture_results_recorded_outcome_check', sql`${table.recordedOutcome} IN ('succeeded', 'failed')`),
    check(
      'url_capture_results_submitted_category_check',
      sql`${table.submittedCategory} IS NULL OR ${table.submittedCategory} IN ('fetch_failed', 'validation_blocked', 'unsupported_content', 'too_large', 'timeout', 'redirect_blocked', 'extraction_failed')`,
    ),
    check(
      'url_capture_results_recorded_category_check',
      sql`${table.recordedCategory} IS NULL OR ${table.recordedCategory} IN ('fetch_failed', 'validation_blocked', 'unsupported_content', 'too_large', 'timeout', 'redirect_blocked', 'extraction_failed', 'package_archived', 'source_role_limit', 'object_integrity_failed')`,
    ),
    check(
      'url_capture_results_safe_code_check',
      sql`${table.safeCode} IS NULL OR ${table.safeCode} IN ('FETCH_FAILED', 'VALIDATION_BLOCKED', 'UNSUPPORTED_CONTENT', 'TOO_LARGE', 'TIMEOUT', 'REDIRECT_BLOCKED', 'EXTRACTION_FAILED', 'PACKAGE_ARCHIVED', 'SOURCE_ROLE_LIMIT', 'OBJECT_INTEGRITY_FAILED')`,
    ),
    check(
      'url_capture_results_category_code_mapping_check',
      sql`(${table.recordedCategory} IS NULL AND ${table.safeCode} IS NULL) OR (${table.recordedCategory} = 'fetch_failed' AND ${table.safeCode} = 'FETCH_FAILED') OR (${table.recordedCategory} = 'validation_blocked' AND ${table.safeCode} = 'VALIDATION_BLOCKED') OR (${table.recordedCategory} = 'unsupported_content' AND ${table.safeCode} = 'UNSUPPORTED_CONTENT') OR (${table.recordedCategory} = 'too_large' AND ${table.safeCode} = 'TOO_LARGE') OR (${table.recordedCategory} = 'timeout' AND ${table.safeCode} = 'TIMEOUT') OR (${table.recordedCategory} = 'redirect_blocked' AND ${table.safeCode} = 'REDIRECT_BLOCKED') OR (${table.recordedCategory} = 'extraction_failed' AND ${table.safeCode} = 'EXTRACTION_FAILED') OR (${table.recordedCategory} = 'package_archived' AND ${table.safeCode} = 'PACKAGE_ARCHIVED') OR (${table.recordedCategory} = 'source_role_limit' AND ${table.safeCode} = 'SOURCE_ROLE_LIMIT') OR (${table.recordedCategory} = 'object_integrity_failed' AND ${table.safeCode} = 'OBJECT_INTEGRITY_FAILED')`,
    ),
    check(
      'url_capture_results_submission_classification_check',
      sql`(${table.submittedOutcome} = 'succeeded' AND ${table.submittedCategory} IS NULL AND ${table.successEvidence} IS NOT NULL AND (${table.recordedOutcome} = 'succeeded' OR (${table.recordedOutcome} = 'failed' AND ${table.recordedCategory} IN ('package_archived', 'source_role_limit', 'object_integrity_failed')))) OR (${table.submittedOutcome} = 'failed' AND ${table.submittedCategory} IS NOT NULL AND ${table.submittedCategory} IN ('fetch_failed', 'validation_blocked', 'unsupported_content', 'too_large', 'timeout', 'redirect_blocked', 'extraction_failed') AND ${table.successEvidence} IS NULL AND ${table.recordedOutcome} = 'failed' AND ${table.recordedCategory} IS NOT NULL AND ${table.recordedCategory} = ${table.submittedCategory} AND ${table.safeCode} IS NOT NULL AND ((${table.submittedCategory} = 'fetch_failed' AND ${table.safeCode} = 'FETCH_FAILED') OR (${table.submittedCategory} = 'validation_blocked' AND ${table.safeCode} = 'VALIDATION_BLOCKED') OR (${table.submittedCategory} = 'unsupported_content' AND ${table.safeCode} = 'UNSUPPORTED_CONTENT') OR (${table.submittedCategory} = 'too_large' AND ${table.safeCode} = 'TOO_LARGE') OR (${table.submittedCategory} = 'timeout' AND ${table.safeCode} = 'TIMEOUT') OR (${table.submittedCategory} = 'redirect_blocked' AND ${table.safeCode} = 'REDIRECT_BLOCKED') OR (${table.submittedCategory} = 'extraction_failed' AND ${table.safeCode} = 'EXTRACTION_FAILED')))`,
    ),
    check(
      'url_capture_results_recorded_classification_check',
      sql`(${table.recordedOutcome} = 'succeeded' AND ${table.recordedCategory} IS NULL AND ${table.safeCode} IS NULL AND ${table.sourceId} IS NOT NULL AND ${table.snapshotId} IS NOT NULL) OR (${table.recordedOutcome} = 'failed' AND ${table.recordedCategory} IS NOT NULL AND ${table.safeCode} IS NOT NULL AND ${table.sourceId} IS NULL AND ${table.snapshotId} IS NULL)`,
    ),
    check(
      'url_capture_results_success_requires_success_submission_check',
      sql`${table.recordedOutcome} = 'failed' OR ${table.submittedOutcome} = 'succeeded'`,
    ),
    check(
      'url_capture_results_source_binding_check',
      sql`${table.sourceId} IS NULL OR ${table.sourceId} = ${table.sourceReferenceId}`,
    ),
    check(
      'url_capture_results_evidence_object_check',
      sql`${table.successEvidence} IS NULL OR jsonb_typeof(${table.successEvidence}) = 'object'`,
    ),
    check(
      'url_capture_results_evidence_shape_check',
      sql`${table.successEvidence} IS NULL OR (${table.successEvidence} ?& ARRAY['snapshot', 'capture', 'candidate'] AND (${table.successEvidence} - 'snapshot' - 'capture' - 'candidate') = '{}'::jsonb AND jsonb_typeof(${table.successEvidence}->'snapshot') = 'object' AND (${table.successEvidence}->'snapshot') ?& ARRAY['snapshotId', 'storageKey', 'sha256', 'byteSize', 'contentType', 'contentEncoding'] AND (((${table.successEvidence}->'snapshot') - 'snapshotId') - 'storageKey' - 'sha256' - 'byteSize' - 'contentType' - 'contentEncoding') = '{}'::jsonb AND jsonb_typeof(${table.successEvidence}->'capture') = 'object' AND (${table.successEvidence}->'capture') ?& ARRAY['finalUrl', 'redirects', 'responseStatus', 'encodedByteSize', 'decodedByteSize'] AND (((${table.successEvidence}->'capture') - 'finalUrl') - 'redirects' - 'responseStatus' - 'encodedByteSize' - 'decodedByteSize') = '{}'::jsonb AND jsonb_typeof(${table.successEvidence}->'candidate') = 'object' AND (${table.successEvidence}->'candidate') ?& ARRAY['schemaVersion', 'text'] AND (((${table.successEvidence}->'candidate') - 'schemaVersion') - 'text') = '{}'::jsonb)`,
    ),
    check(
      'url_capture_results_evidence_value_types_check',
      sql`${table.successEvidence} IS NULL OR (jsonb_typeof(${table.successEvidence}->'snapshot'->'snapshotId') = 'string' AND jsonb_typeof(${table.successEvidence}->'snapshot'->'storageKey') = 'string' AND jsonb_typeof(${table.successEvidence}->'snapshot'->'sha256') = 'string' AND jsonb_typeof(${table.successEvidence}->'snapshot'->'byteSize') = 'number' AND jsonb_typeof(${table.successEvidence}->'snapshot'->'contentType') = 'string' AND jsonb_typeof(${table.successEvidence}->'snapshot'->'contentEncoding') = 'string' AND jsonb_typeof(${table.successEvidence}->'capture'->'finalUrl') = 'string' AND jsonb_typeof(${table.successEvidence}->'capture'->'redirects') = 'array' AND jsonb_typeof(${table.successEvidence}->'capture'->'responseStatus') = 'number' AND jsonb_typeof(${table.successEvidence}->'capture'->'encodedByteSize') = 'number' AND jsonb_typeof(${table.successEvidence}->'capture'->'decodedByteSize') = 'number' AND jsonb_typeof(${table.successEvidence}->'candidate'->'schemaVersion') = 'string' AND jsonb_typeof(${table.successEvidence}->'candidate'->'text') = 'string')`,
    ),
    check(
      'url_capture_results_evidence_value_bounds_check',
      sql`${table.successEvidence} IS NULL OR ((${table.successEvidence}->'snapshot'->>'sha256') ~ '^[0-9a-f]{64}$' AND (${table.successEvidence}->'snapshot'->>'contentType') IN ('text/html', 'text/plain', 'text/markdown') AND (${table.successEvidence}->'snapshot'->>'contentEncoding') IN ('identity', 'gzip', 'deflate', 'br') AND CASE WHEN jsonb_typeof(${table.successEvidence}->'snapshot'->'byteSize') = 'number' THEN (${table.successEvidence}->'snapshot'->>'byteSize')::numeric >= 1 AND (${table.successEvidence}->'snapshot'->>'byteSize')::numeric <= 2097152 ELSE TRUE END AND CASE WHEN jsonb_typeof(${table.successEvidence}->'capture'->'responseStatus') = 'number' THEN (${table.successEvidence}->'capture'->>'responseStatus')::numeric = 200 ELSE TRUE END AND CASE WHEN jsonb_typeof(${table.successEvidence}->'capture'->'encodedByteSize') = 'number' AND jsonb_typeof(${table.successEvidence}->'snapshot'->'byteSize') = 'number' THEN (${table.successEvidence}->'capture'->>'encodedByteSize')::numeric = (${table.successEvidence}->'snapshot'->>'byteSize')::numeric ELSE TRUE END AND CASE WHEN jsonb_typeof(${table.successEvidence}->'capture'->'decodedByteSize') = 'number' THEN (${table.successEvidence}->'capture'->>'decodedByteSize')::numeric >= 1 AND (${table.successEvidence}->'capture'->>'decodedByteSize')::numeric <= 8388608 ELSE TRUE END AND CASE WHEN jsonb_typeof(${table.successEvidence}->'capture'->'redirects') = 'array' THEN jsonb_array_length(${table.successEvidence}->'capture'->'redirects') <= 5 ELSE TRUE END AND (${table.successEvidence}->'candidate'->>'schemaVersion') = 'source/normalized/v1')`,
    ),
    check(
      'url_capture_results_evidence_integer_check',
      sql`${table.successEvidence} IS NULL OR (CASE WHEN jsonb_typeof(${table.successEvidence}->'snapshot'->'byteSize') = 'number' THEN (${table.successEvidence}->'snapshot'->>'byteSize')::numeric = trunc((${table.successEvidence}->'snapshot'->>'byteSize')::numeric) ELSE TRUE END AND CASE WHEN jsonb_typeof(${table.successEvidence}->'capture'->'responseStatus') = 'number' THEN (${table.successEvidence}->'capture'->>'responseStatus')::numeric = trunc((${table.successEvidence}->'capture'->>'responseStatus')::numeric) ELSE TRUE END AND CASE WHEN jsonb_typeof(${table.successEvidence}->'capture'->'encodedByteSize') = 'number' THEN (${table.successEvidence}->'capture'->>'encodedByteSize')::numeric = trunc((${table.successEvidence}->'capture'->>'encodedByteSize')::numeric) ELSE TRUE END AND CASE WHEN jsonb_typeof(${table.successEvidence}->'capture'->'decodedByteSize') = 'number' THEN (${table.successEvidence}->'capture'->>'decodedByteSize')::numeric = trunc((${table.successEvidence}->'capture'->>'decodedByteSize')::numeric) ELSE TRUE END)`,
    ),
    check(
      'url_capture_results_evidence_redirects_shape_check',
      sql`${table.successEvidence} IS NULL OR jsonb_typeof(${table.successEvidence}->'capture'->'redirects') <> 'array' OR NOT jsonb_path_exists(${table.successEvidence}, '$.capture.redirects[*] ? (!(@.type() == "object" && exists(@.status) && exists(@.url) && @.status.type() == "number" && @.url.type() == "string" && !exists(@.keyvalue() ? (@.key != "status" && @.key != "url")) && (@.status == 301 || @.status == 302 || @.status == 303 || @.status == 307 || @.status == 308)))')`,
    ),
    check(
      'url_capture_results_evidence_snapshot_binding_check',
      sql`${table.successEvidence} IS NULL OR ${table.snapshotId}::text = ${table.successEvidence}->'snapshot'->>'snapshotId'`,
    ),
  ],
);
