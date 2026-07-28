import { sql } from 'drizzle-orm';
import { boolean, char, check, index, integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

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
