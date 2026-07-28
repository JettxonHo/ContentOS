import { char, index, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

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
