import { randomUUID } from 'node:crypto';

import { Client } from 'pg';
import { describe, expect, it } from 'vitest';

import { composeExec, composeHealth, composePort } from './compose.js';
import { readComposeCredentials, requireState, type SmokeState } from './env.js';
import { loopbackReachable } from './process.js';

function postgresClient(state: SmokeState): Client {
  const credentials = readComposeCredentials(state.envFile);
  return new Client({
    host: '127.0.0.1',
    port: state.ports.postgres,
    user: 'smoke_user',
    password: credentials.POSTGRES_PASSWORD,
    database: 'smoke_db',
  });
}

async function expectConstraint(
  client: Client,
  text: string,
  values: readonly unknown[],
  expectedConstraint: string,
): Promise<void> {
  await client.query('SAVEPOINT expected_failure');
  try {
    await client.query(text, [...values]);
    throw new Error(`expected constraint ${expectedConstraint} to reject the statement`);
  } catch (error) {
    expect((error as { constraint?: string }).constraint).toBe(expectedConstraint);
  } finally {
    await client.query('ROLLBACK TO SAVEPOINT expected_failure');
    await client.query('RELEASE SAVEPOINT expected_failure');
  }
}

async function insertPackage(client: Client, id: string, ownerUserId: string): Promise<void> {
  await client.query(
    `INSERT INTO content_packages
      (id, owner_user_id, title, description, content_mode, requested_blog, requested_xiaohongshu,
       lifecycle, revision, created_at, updated_at, archived_at)
     VALUES ($1, $2, 'constraint fixture', NULL, 'creator_led', true, true, 'active', 1, now(), now(), NULL)`,
    [id, ownerUserId],
  );
}

async function insertSource(
  client: Client,
  id: string,
  packageId: string,
  ownerUserId: string,
  label: string | null = null,
): Promise<void> {
  await client.query(
    `INSERT INTO sources
      (id, content_package_id, owner_user_id, source_type, role, label, capture_type, created_at)
     VALUES ($1, $2, $3, 'pasted_text', 'supporting', $4, 'pasted_text', now())`,
    [id, packageId, ownerUserId, label],
  );
}

describe('postgres smoke', () => {
  it('is healthy, loopback-reachable, authenticates credentials, and contains the reviewed M1 migrations', async () => {
    const state = requireState();

    expect(await composeHealth(state, 'postgres')).toBe('healthy');

    const portInfo = await composePort(state, 'postgres', 5432);
    expect(portInfo.stdout.trim()).toMatch(/^127\.0\.0\.1:\d+$/);

    await expect(loopbackReachable(state.ports.postgres)).resolves.toBe(true);

    // Correct credential over TCP exercises scram-sha-256 host auth.
    const correct = await composeExec(state, 'postgres', [
      'sh',
      '-c',
      `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT 1"`,
    ]);
    expect(correct.ok).toBe(true);
    expect(correct.stdout.trim()).toBe('1');

    // A wrong credential must be rejected.
    const wrong = await composeExec(state, 'postgres', [
      'sh',
      '-c',
      `PGPASSWORD=invalid-smoke-password psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT 1"`,
    ]);
    expect(wrong.ok).toBe(false);
    expect(wrong.stderr).toContain('password authentication failed');

    // M1-SEC-001 and M1-CP-001 introduce the Session and Content Package tables.
    // M2-SRC-001 adds Source, Raw Snapshot, Working Copy, Version, Head, and Approval tables.
    // Drizzle's own migration journal lives in its dedicated schema and is not product state.
    const tables = await composeExec(state, 'postgres', [
      'sh',
      '-c',
      `PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"`,
    ]);
    expect(tables.ok).toBe(true);
    expect(tables.stdout.trim().split('\n')).toEqual([
      'auth_sessions',
      'content_packages',
      'source_approvals',
      'source_heads',
      'source_raw_snapshots',
      'source_versions',
      'source_working_copies',
      'sources',
      'workflow_events',
      'workflow_instances',
      'workflow_nodes',
      'workflow_template_edges',
      'workflow_template_nodes',
      'workflow_templates',
    ]);
  });

  it('rejects NUL and lone-surrogate JSON text while round-tripping supplementary-plane text', async () => {
    const client = postgresClient(requireState());
    await client.connect();
    try {
      for (const text of ['before\u0000after', 'lone high \ud800', 'lone low \udc00']) {
        await expect(client.query('SELECT $1::jsonb', [JSON.stringify({ text })])).rejects.toBeDefined();
      }
      const body = { text: 'valid \u{1f680} text' };
      const result = await client.query<{ body: { text: string } }>('SELECT $1::jsonb AS body', [JSON.stringify(body)]);
      expect(result.rows[0]?.body).toEqual(body);
    } finally {
      await client.end();
    }
  });

  it('counts the Source label varchar and char_length boundary by Unicode scalar values', async () => {
    const client = postgresClient(requireState());
    await client.connect();
    await client.query('BEGIN');
    try {
      const ownerId = randomUUID();
      const packageId = randomUUID();
      const supplementary = '\u{1f680}';
      const accepted = [
        supplementary.repeat(100),
        supplementary.repeat(200),
        `${'a'.repeat(100)}${supplementary.repeat(100)}`,
      ];
      await insertPackage(client, packageId, ownerId);
      for (const label of accepted) {
        await insertSource(client, randomUUID(), packageId, ownerId, label);
      }
      const lengths = await client.query<{ length: number }>(
        'SELECT char_length(label)::int AS length FROM sources WHERE content_package_id=$1',
        [packageId],
      );
      expect(lengths.rows.map((row) => row.length).sort((left, right) => left - right)).toEqual([100, 200, 200]);
      await expect(
        insertSource(client, randomUUID(), packageId, ownerId, supplementary.repeat(201)),
      ).rejects.toBeDefined();
    } finally {
      await client.query('ROLLBACK');
      await client.end();
    }
  });

  it('enforces the complete Source owner/package/lineage and exact-body constraint matrix', async () => {
    const state = requireState();
    const client = postgresClient(state);
    await client.connect();
    await client.query('BEGIN');
    try {
      const ownerA = randomUUID();
      const ownerB = randomUUID();
      const packageA = randomUUID();
      const packageB = randomUUID();
      const sourceA = randomUUID();
      const sourceB = randomUUID();
      const sourceC = randomUUID();
      const snapshotA = randomUUID();
      const snapshotB = randomUUID();
      const workingCopyA = randomUUID();
      const workingCopyB = randomUUID();
      const versionA = randomUUID();
      const versionB = randomUUID();
      const hash = 'a'.repeat(64);

      await insertPackage(client, packageA, ownerA);
      await insertPackage(client, packageB, ownerB);
      await insertSource(client, sourceA, packageA, ownerA);
      await insertSource(client, sourceB, packageB, ownerB);
      await insertSource(client, sourceC, packageA, ownerA);
      await client.query(
        `INSERT INTO source_raw_snapshots
          (id, source_id, owner_user_id, storage_key, sha256, byte_size, content_type, captured_at)
         VALUES ($1,$2,$3,$4,$5,4,'text/plain; charset=utf-8',now()),
                ($6,$7,$8,$9,$5,4,'text/plain; charset=utf-8',now())`,
        [snapshotA, sourceA, ownerA, `fixture/${snapshotA}`, hash, snapshotB, sourceB, ownerB, `fixture/${snapshotB}`],
      );
      await client.query(
        `INSERT INTO source_working_copies
          (id, source_id, owner_user_id, body, schema_version, revision, checkpointed_revision,
           base_version_id, updated_at, created_at)
         VALUES ($1,$2,$3,$4::jsonb,'source/normalized/v1',1,NULL,NULL,now(),now()),
                ($5,$6,$7,$4::jsonb,'source/normalized/v1',1,NULL,NULL,now(),now())`,
        [workingCopyA, sourceA, ownerA, JSON.stringify({ text: 'body' }), workingCopyB, sourceB, ownerB],
      );
      await client.query(
        `INSERT INTO source_versions
          (id, source_id, owner_user_id, version_number, parent_version_id, body, content_hash,
           schema_version, raw_snapshot_id, created_by_id, created_at)
         VALUES ($1,$2,$3,1,NULL,$4::jsonb,$5,'source/normalized/v1',$6,$3,now()),
                ($7,$8,$9,1,NULL,$4::jsonb,$5,'source/normalized/v1',$10,$9,now())`,
        [
          versionA,
          sourceA,
          ownerA,
          JSON.stringify({ text: 'body' }),
          hash,
          snapshotA,
          versionB,
          sourceB,
          ownerB,
          snapshotB,
        ],
      );
      await client.query(
        `INSERT INTO source_heads
          (source_id, owner_user_id, working_copy_id, latest_version_id, review_candidate_version_id,
           approved_version_id, updated_at)
         VALUES ($1,$2,$3,$4,$4,NULL,now()), ($5,$6,$7,$8,$8,NULL,now())`,
        [sourceA, ownerA, workingCopyA, versionA, sourceB, ownerB, workingCopyB, versionB],
      );

      await expectConstraint(
        client,
        `INSERT INTO sources VALUES ($1,$2,$3,'pasted_text','supporting',NULL,'pasted_text',now())`,
        [randomUUID(), packageA, ownerB],
        'sources_package_owner_fk',
      );
      await expectConstraint(
        client,
        `INSERT INTO source_raw_snapshots VALUES ($1,$2,$3,$4,$5,4,'text/plain; charset=utf-8',now())`,
        [randomUUID(), sourceC, ownerB, `fixture/${randomUUID()}`, hash],
        'source_raw_snapshots_source_owner_fk',
      );
      await expectConstraint(
        client,
        `UPDATE source_working_copies SET owner_user_id=$1 WHERE id=$2`,
        [ownerB, workingCopyA],
        'source_working_copies_source_owner_fk',
      );
      await expectConstraint(
        client,
        `UPDATE source_versions SET owner_user_id=$1 WHERE id=$2`,
        [ownerB, versionA],
        'source_versions_source_owner_fk',
      );
      await expectConstraint(
        client,
        `UPDATE source_heads SET owner_user_id=$1 WHERE source_id=$2`,
        [ownerB, sourceA],
        'source_heads_source_owner_fk',
      );
      await expectConstraint(
        client,
        `INSERT INTO source_approvals VALUES ($1,$2,$3,$4,$3,now(),'valid')`,
        [randomUUID(), sourceA, ownerB, versionA],
        'source_approvals_source_owner_fk',
      );
      await expectConstraint(
        client,
        `UPDATE source_versions SET parent_version_id=$1 WHERE id=$2`,
        [versionB, versionA],
        'source_versions_parent_source_fk',
      );
      await expectConstraint(
        client,
        `UPDATE source_versions SET raw_snapshot_id=$1 WHERE id=$2`,
        [snapshotB, versionA],
        'source_versions_snapshot_source_fk',
      );
      await expectConstraint(
        client,
        `UPDATE source_working_copies SET base_version_id=$1 WHERE id=$2`,
        [versionB, workingCopyA],
        'source_working_copies_base_version_source_fk',
      );
      await expectConstraint(
        client,
        `INSERT INTO source_working_copies
          (id,source_id,owner_user_id,body,schema_version,revision,checkpointed_revision,base_version_id,updated_at,created_at)
         VALUES ($1,$2,$3,$4::jsonb,'source/normalized/v1',1,NULL,$5,now(),now())`,
        [randomUUID(), sourceC, ownerA, JSON.stringify({ text: 'body' }), randomUUID()],
        'source_working_copies_base_version_source_fk',
      );
      await expectConstraint(
        client,
        `INSERT INTO source_heads VALUES ($1,$2,$3,NULL,NULL,NULL,now())`,
        [sourceC, ownerA, workingCopyB],
        'source_heads_wc_source_fk',
      );
      for (const [column, constraint] of [
        ['latest_version_id', 'source_heads_latest_version_source_fk'],
        ['review_candidate_version_id', 'source_heads_review_candidate_source_fk'],
        ['approved_version_id', 'source_heads_approved_version_source_fk'],
      ] as const) {
        await expectConstraint(
          client,
          `UPDATE source_heads SET ${column}=$1 WHERE source_id=$2`,
          [versionB, sourceA],
          constraint,
        );
      }
      await expectConstraint(
        client,
        `INSERT INTO source_approvals VALUES ($1,$2,$3,$4,$3,now(),'valid')`,
        [randomUUID(), sourceA, ownerA, versionB],
        'source_approvals_version_source_fk',
      );
      await expectConstraint(
        client,
        `INSERT INTO source_approvals VALUES ($1,$2,$3,$4,$5,now(),'valid')`,
        [randomUUID(), sourceA, ownerA, versionA, ownerB],
        'source_approvals_owner_approver_check',
      );
      await expectConstraint(
        client,
        `INSERT INTO source_raw_snapshots VALUES ($1,$2,$3,$4,$5,4,'text/plain; charset=utf-8',now())`,
        [randomUUID(), sourceA, ownerA, `fixture/${randomUUID()}`, hash],
        'source_raw_snapshots_source_unique',
      );
      await expectConstraint(
        client,
        `UPDATE source_raw_snapshots SET storage_key=$1 WHERE id=$2`,
        [`fixture/${snapshotA}`, snapshotB],
        'source_raw_snapshots_storage_key_unique',
      );
      await expectConstraint(
        client,
        `UPDATE source_raw_snapshots SET byte_size=100001 WHERE id=$1`,
        [snapshotA],
        'source_raw_snapshots_byte_size_check',
      );

      const invalidBodies = [
        [[], 'body_keys_check'],
        [{}, 'body_keys_check'],
        [{ text: 'x', extra: true }, 'body_keys_check'],
        [{ text: 1 }, 'body_text_type_check'],
        [{ text: '   ' }, 'body_text_check'],
        [{ text: '界'.repeat(33_334) }, 'body_text_check'],
      ] as const;
      for (const [body, suffix] of invalidBodies) {
        await expectConstraint(
          client,
          `UPDATE source_working_copies SET body=$1::jsonb WHERE id=$2`,
          [JSON.stringify(body), workingCopyA],
          `source_working_copies_${suffix}`,
        );
        await expectConstraint(
          client,
          `UPDATE source_versions SET body=$1::jsonb WHERE id=$2`,
          [JSON.stringify(body), versionA],
          `source_versions_${suffix}`,
        );
      }
      await expectConstraint(
        client,
        `UPDATE source_working_copies SET schema_version='wrong' WHERE id=$1`,
        [workingCopyA],
        'source_working_copies_schema_version_check',
      );
      await expectConstraint(
        client,
        `UPDATE source_versions SET schema_version='wrong' WHERE id=$1`,
        [versionA],
        'source_versions_schema_version_check',
      );
      await expectConstraint(
        client,
        `UPDATE source_working_copies SET checkpointed_revision=2 WHERE id=$1`,
        [workingCopyA],
        'source_working_copies_checkpoint_revision_check',
      );
    } finally {
      await client.query('ROLLBACK');
      await client.end();
    }
  });

  it('rolls back capture, Version, and Approval state as atomic units', async () => {
    const state = requireState();
    const client = postgresClient(state);
    await client.connect();
    const owner = randomUUID();
    const packageId = randomUUID();
    const sourceId = randomUUID();
    const snapshotId = randomUUID();
    const workingCopyId = randomUUID();
    const versionId = randomUUID();
    const approvalId = randomUUID();
    const hash = 'b'.repeat(64);
    try {
      await insertPackage(client, packageId, owner);

      await client.query('BEGIN');
      await insertSource(client, sourceId, packageId, owner);
      await client.query(
        `INSERT INTO source_raw_snapshots VALUES ($1,$2,$3,$4,$5,4,'text/plain; charset=utf-8',now())`,
        [snapshotId, sourceId, owner, `fixture/${snapshotId}`, hash],
      );
      await client.query(
        `INSERT INTO source_working_copies VALUES ($1,$2,$3,$4::jsonb,'source/normalized/v1',1,NULL,NULL,now(),now())`,
        [workingCopyId, sourceId, owner, JSON.stringify({ text: 'body' })],
      );
      await client.query(`INSERT INTO source_heads VALUES ($1,$2,$3,NULL,NULL,NULL,now())`, [
        sourceId,
        owner,
        workingCopyId,
      ]);
      await client.query('ROLLBACK');
      expect(
        (await client.query(`SELECT count(*)::int AS count FROM sources WHERE id=$1`, [sourceId])).rows[0]?.count,
      ).toBe(0);

      await insertSource(client, sourceId, packageId, owner);
      await client.query(
        `INSERT INTO source_raw_snapshots VALUES ($1,$2,$3,$4,$5,4,'text/plain; charset=utf-8',now())`,
        [snapshotId, sourceId, owner, `fixture/${snapshotId}`, hash],
      );
      await client.query(
        `INSERT INTO source_working_copies VALUES ($1,$2,$3,$4::jsonb,'source/normalized/v1',1,NULL,NULL,now(),now())`,
        [workingCopyId, sourceId, owner, JSON.stringify({ text: 'body' })],
      );
      await client.query(`INSERT INTO source_heads VALUES ($1,$2,$3,NULL,NULL,NULL,now())`, [
        sourceId,
        owner,
        workingCopyId,
      ]);

      await client.query('BEGIN');
      await client.query(
        `INSERT INTO source_versions VALUES ($1,$2,$3,1,NULL,$4::jsonb,$5,'source/normalized/v1',$6,$3,now())`,
        [versionId, sourceId, owner, JSON.stringify({ text: 'body' }), hash, snapshotId],
      );
      await client.query(
        `UPDATE source_heads SET latest_version_id=$1,review_candidate_version_id=$1 WHERE source_id=$2`,
        [versionId, sourceId],
      );
      await client.query(
        `UPDATE source_working_copies SET base_version_id=$1,checkpointed_revision=1 WHERE source_id=$2`,
        [versionId, sourceId],
      );
      await client.query('ROLLBACK');
      expect(
        (await client.query(`SELECT count(*)::int AS count FROM source_versions WHERE id=$1`, [versionId])).rows[0]
          .count,
      ).toBe(0);
      expect(
        (await client.query(`SELECT latest_version_id FROM source_heads WHERE source_id=$1`, [sourceId])).rows[0]
          .latest_version_id,
      ).toBeNull();

      await client.query(
        `INSERT INTO source_versions VALUES ($1,$2,$3,1,NULL,$4::jsonb,$5,'source/normalized/v1',$6,$3,now())`,
        [versionId, sourceId, owner, JSON.stringify({ text: 'body' }), hash, snapshotId],
      );
      await client.query(
        `UPDATE source_heads SET latest_version_id=$1,review_candidate_version_id=$1 WHERE source_id=$2`,
        [versionId, sourceId],
      );
      await client.query('BEGIN');
      await client.query(`INSERT INTO source_approvals VALUES ($1,$2,$3,$4,$3,now(),'valid')`, [
        approvalId,
        sourceId,
        owner,
        versionId,
      ]);
      await client.query(`UPDATE source_heads SET approved_version_id=$1 WHERE source_id=$2`, [versionId, sourceId]);
      await client.query('ROLLBACK');
      expect(
        (await client.query(`SELECT count(*)::int AS count FROM source_approvals WHERE id=$1`, [approvalId])).rows[0]
          .count,
      ).toBe(0);
      expect(
        (await client.query(`SELECT approved_version_id FROM source_heads WHERE source_id=$1`, [sourceId])).rows[0]
          .approved_version_id,
      ).toBeNull();
    } finally {
      await client.query('DELETE FROM source_approvals WHERE source_id=$1', [sourceId]);
      await client.query(
        'UPDATE source_heads SET latest_version_id=NULL, review_candidate_version_id=NULL, approved_version_id=NULL WHERE source_id=$1',
        [sourceId],
      );
      await client.query('UPDATE source_working_copies SET base_version_id=NULL WHERE source_id=$1', [sourceId]);
      await client.query('DELETE FROM source_versions WHERE source_id=$1', [sourceId]);
      await client.query('DELETE FROM source_heads WHERE source_id=$1', [sourceId]);
      await client.query('DELETE FROM source_working_copies WHERE source_id=$1', [sourceId]);
      await client.query('DELETE FROM source_raw_snapshots WHERE source_id=$1', [sourceId]);
      await client.query('DELETE FROM sources WHERE id=$1', [sourceId]);
      await client.query('DELETE FROM content_packages WHERE id=$1', [packageId]);
      await client.end();
    }
  });
});

describe('source upload migration 0003 constraints (M2-SRC-002)', () => {
  it('accepts uploaded_text sources and text/markdown snapshots while rejecting non-allowlisted values', async () => {
    const client = postgresClient(requireState());
    await client.connect();
    await client.query('BEGIN');
    try {
      const ownerId = randomUUID();
      const packageId = randomUUID();
      const sourceId = randomUUID();
      const snapshotId = randomUUID();
      const hash = 'a'.repeat(64);
      await insertPackage(client, packageId, ownerId);

      // Migration 0003 relaxed values are accepted.
      await client.query(
        `INSERT INTO sources
          (id, content_package_id, owner_user_id, source_type, role, label, capture_type, created_at)
         VALUES ($1, $2, $3, 'uploaded_text', 'primary', 'upload label', 'uploaded_text', now())`,
        [sourceId, packageId, ownerId],
      );
      await client.query(
        `INSERT INTO source_raw_snapshots
          (id, source_id, owner_user_id, storage_key, sha256, byte_size, content_type, captured_at)
         VALUES ($1, $2, $3, $4, $5, 12, 'text/markdown; charset=utf-8', now())`,
        [snapshotId, sourceId, ownerId, `fixture/${randomUUID()}`, hash],
      );

      // Non-allowlisted values remain rejected by the same named constraints.
      await expectConstraint(
        client,
        `INSERT INTO sources
          (id, content_package_id, owner_user_id, source_type, role, label, capture_type, created_at)
         VALUES ($1, $2, $3, 'url', 'supporting', NULL, 'pasted_text', now())`,
        [randomUUID(), packageId, ownerId],
        'sources_source_type_check',
      );
      await expectConstraint(
        client,
        `INSERT INTO sources
          (id, content_package_id, owner_user_id, source_type, role, label, capture_type, created_at)
         VALUES ($1, $2, $3, 'pasted_text', 'supporting', NULL, 'public_url', now())`,
        [randomUUID(), packageId, ownerId],
        'sources_capture_type_check',
      );
      await expectConstraint(
        client,
        `INSERT INTO source_raw_snapshots
          (id, source_id, owner_user_id, storage_key, sha256, byte_size, content_type, captured_at)
         VALUES ($1, $2, $3, $4, $5, 12, 'text/html; charset=utf-8', now())`,
        [randomUUID(), sourceId, ownerId, `fixture/${randomUUID()}`, hash],
        'source_raw_snapshots_content_type_check',
      );
    } finally {
      await client.query('ROLLBACK');
      await client.end();
    }
  });
});
