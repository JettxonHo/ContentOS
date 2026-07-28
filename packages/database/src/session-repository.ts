import { and, eq, isNull } from 'drizzle-orm/sql/expressions/conditions';

import { type SessionId, type SessionRecord, type SessionRepository, type UserId } from '@contentos/core';

import type { DatabaseConnection } from './client.js';
import { authSessions } from './schema.js';

export class DrizzleSessionRepository implements SessionRepository {
  constructor(private readonly connection: DatabaseConnection) {}

  async insert(session: SessionRecord): Promise<void> {
    await this.connection.db.insert(authSessions).values({
      id: session.id,
      credentialHash: session.credentialHash,
      ownerUserId: session.ownerUserId,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
    });
  }

  async findByCredentialHash(credentialHash: string): Promise<SessionRecord | null> {
    const [row] = await this.connection.db
      .select()
      .from(authSessions)
      .where(eq(authSessions.credentialHash, credentialHash))
      .limit(1);
    if (!row) {
      return null;
    }
    return {
      id: row.id as SessionId,
      credentialHash: row.credentialHash,
      ownerUserId: row.ownerUserId as UserId,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
    };
  }

  async revokeByCredentialHash(credentialHash: string, revokedAt: Date): Promise<boolean> {
    const rows = await this.connection.db
      .update(authSessions)
      .set({ revokedAt })
      .where(and(eq(authSessions.credentialHash, credentialHash), isNull(authSessions.revokedAt)))
      .returning({ id: authSessions.id });
    return rows.length === 1;
  }
}
