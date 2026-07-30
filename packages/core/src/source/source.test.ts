import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  PASTED_TEXT_MAX_BYTES,
  computeContentHash,
  defineHead,
  defineSnapshot,
  defineSourceReference,
  defineVersion,
  defineWorkingCopy,
  rehydrateVersion,
  advanceWorkingCopy,
  SourceDomainError,
  validatePastedTextBytes,
} from './source.js';
import type { ContentPackageId, ContentPackageOwnerId } from '../content-package/content-package.js';
import type { RawSnapshotId, SourceId, SourceWorkingCopyId, SourceVersionId } from './source-values.js';

const owner = '00000000-0000-4000-8000-000000000001' as ContentPackageOwnerId;
const packageId = '10000000-0000-4000-8000-000000000001' as ContentPackageId;
const sourceId = '20000000-0000-4000-8000-000000000001' as SourceId;
const snapshotId = '30000000-0000-4000-8000-000000000001' as RawSnapshotId;
const wcId = '40000000-0000-4000-8000-000000000001' as SourceWorkingCopyId;
const versionId = '50000000-0000-4000-8000-000000000001' as SourceVersionId;
const now = new Date('2026-01-01T00:00:00Z');

describe('Source domain', () => {
  describe('validatePastedTextBytes', () => {
    it('accepts valid non-empty text within the byte bound', () => {
      expect(() => validatePastedTextBytes('Hello world')).not.toThrow();
      expect(() => validatePastedTextBytes('Supplementary plane: \u{1f680}')).not.toThrow();
      const maxText = 'a'.repeat(PASTED_TEXT_MAX_BYTES);
      expect(() => validatePastedTextBytes(maxText)).not.toThrow();
    });

    it('rejects NUL and lone UTF-16 surrogates before UTF-8 byte conversion', () => {
      for (const text of ['before\u0000after', 'lone high \ud800', 'lone low \udc00']) {
        expect(() => validatePastedTextBytes(text)).toThrow(SourceDomainError);
        expect(() => computeContentHash({ text })).toThrow(SourceDomainError);
      }
    });

    it('rejects empty, whitespace-only, and oversized text', () => {
      expect(() => validatePastedTextBytes('')).toThrow(SourceDomainError);
      expect(() => validatePastedTextBytes('   ')).toThrow(SourceDomainError);
      expect(() => validatePastedTextBytes('\t\n')).toThrow(SourceDomainError);
      const oversized = 'a'.repeat(PASTED_TEXT_MAX_BYTES + 1);
      expect(() => validatePastedTextBytes(oversized)).toThrow(SourceDomainError);
    });
  });

  describe('computeContentHash', () => {
    it('computes the exact SHA-256 hex digest of the canonical JSON body', () => {
      const body = { text: 'test content' };
      const expected = createHash('sha256').update(JSON.stringify(body), 'utf8').digest('hex');
      expect(computeContentHash(body)).toBe(expected);
    });
  });

  describe('defineSourceReference', () => {
    it('creates a valid pasted_text primary Source Reference', () => {
      const ref = defineSourceReference({
        id: sourceId,
        contentPackageId: packageId,
        ownerUserId: owner,
        sourceType: 'pasted_text',
        role: 'primary',
        label: null,
        captureType: 'pasted_text',
        now,
      });
      expect(ref.sourceType).toBe('pasted_text');
      expect(ref.role).toBe('primary');
      expect(ref.label).toBeNull();
      expect(ref.captureType).toBe('pasted_text');
    });

    it('creates a valid supporting Source Reference with a label', () => {
      const ref = defineSourceReference({
        id: sourceId,
        contentPackageId: packageId,
        ownerUserId: owner,
        sourceType: 'pasted_text',
        role: 'supporting',
        label: 'My supporting source',
        captureType: 'pasted_text',
        now,
      });
      expect(ref.role).toBe('supporting');
      expect(ref.label).toBe('My supporting source');
    });

    it('rejects labels containing NUL or lone surrogates', () => {
      for (const label of ['bad\u0000label', 'bad\ud800label', 'bad\udc00label']) {
        expect(() =>
          defineSourceReference({
            id: sourceId,
            contentPackageId: packageId,
            ownerUserId: owner,
            sourceType: 'pasted_text',
            role: 'supporting',
            label,
            captureType: 'pasted_text',
            now,
          }),
        ).toThrow(SourceDomainError);
      }
    });

    it('counts the 200-character label boundary by Unicode scalar values', () => {
      const defineWithLabel = (label: string) =>
        defineSourceReference({
          id: sourceId,
          contentPackageId: packageId,
          ownerUserId: owner,
          sourceType: 'pasted_text',
          role: 'supporting',
          label,
          captureType: 'pasted_text',
          now,
        });
      const supplementary = '\u{1f680}';
      expect(defineWithLabel(supplementary.repeat(100)).label).toBe(supplementary.repeat(100));
      expect(defineWithLabel(supplementary.repeat(200)).label).toBe(supplementary.repeat(200));
      const mixedLabel = defineWithLabel(`${'a'.repeat(100)}${supplementary.repeat(100)}`).label;
      expect(mixedLabel).not.toBeNull();
      expect([...mixedLabel!]).toHaveLength(200);
      expect(() => defineWithLabel(supplementary.repeat(201))).toThrow(SourceDomainError);
      expect(() => defineWithLabel(`${'a'.repeat(101)}${supplementary.repeat(100)}`)).toThrow(SourceDomainError);
    });

    it('rejects an unsupported sourceType', () => {
      expect(() =>
        defineSourceReference({
          id: sourceId,
          contentPackageId: packageId,
          ownerUserId: owner,
          sourceType: 'url' as never,
          role: 'primary',
          label: null,
          captureType: 'pasted_text',
          now,
        }),
      ).toThrow(SourceDomainError);
    });

    it('rejects an unsupported role', () => {
      expect(() =>
        defineSourceReference({
          id: sourceId,
          contentPackageId: packageId,
          ownerUserId: owner,
          sourceType: 'pasted_text',
          role: 'reference' as never,
          label: null,
          captureType: 'pasted_text',
          now,
        }),
      ).toThrow(SourceDomainError);
    });
  });

  describe('defineHead', () => {
    it('creates a Head with all version pointers null initially', () => {
      const head = defineHead({ sourceId, workingCopyId: wcId });
      expect(head.sourceId).toBe(sourceId);
      expect(head.workingCopyId).toBe(wcId);
      expect(head.latestVersionId).toBeNull();
      expect(head.reviewCandidateVersionId).toBeNull();
      expect(head.approvedVersionId).toBeNull();
    });
  });

  describe('defineSnapshot', () => {
    it('creates an immutable Raw Snapshot metadata record', () => {
      const snap = defineSnapshot({
        id: snapshotId,
        sourceId,
        storageKey: 'sources/owner/pkg/src/raw/snap',
        sha256: 'a'.repeat(64),
        byteSize: 100,
        contentType: 'text/plain; charset=utf-8',
        now,
      });
      expect(snap.sha256).toBe('a'.repeat(64));
      expect(snap.byteSize).toBe(100);
      expect(snap.contentType).toBe('text/plain; charset=utf-8');
    });

    it('rejects a zero or negative byte size', () => {
      expect(() =>
        defineSnapshot({
          id: snapshotId,
          sourceId,
          storageKey: 'key',
          sha256: 'a'.repeat(64),
          byteSize: 0,
          contentType: 'text/plain; charset=utf-8',
          now,
        }),
      ).toThrow(SourceDomainError);
    });

    it('rejects an empty content type', () => {
      expect(() =>
        defineSnapshot({
          id: snapshotId,
          sourceId,
          storageKey: 'key',
          sha256: 'a'.repeat(64),
          byteSize: 100,
          contentType: '',
          now,
        }),
      ).toThrow(SourceDomainError);
    });
  });

  describe('defineVersion', () => {
    it('creates an immutable Version with computed content hash and sequential number', () => {
      const body = { text: 'version body content' };
      const version = defineVersion({
        id: versionId,
        sourceId,
        versionNumber: 1,
        parentVersionId: null,
        body,
        rawSnapshotId: snapshotId,
        createdById: owner,
        now,
      });
      expect(version.versionNumber).toBe(1);
      expect(version.parentVersionId).toBeNull();
      expect(version.contentHash).toBe(createHash('sha256').update(JSON.stringify(body), 'utf8').digest('hex'));
      expect(version.schemaVersion).toBe('source/normalized/v1');
      expect(version.rawSnapshotId).toBe(snapshotId);
    });
  });

  describe('rehydrateVersion', () => {
    const body = { text: 'persisted version body' };
    const persisted = {
      id: versionId,
      sourceId,
      versionNumber: 1,
      parentVersionId: null,
      body,
      contentHash: computeContentHash(body),
      schemaVersion: 'source/normalized/v1',
      rawSnapshotId: snapshotId,
      createdById: owner,
      createdAt: now,
    };

    it('accepts only an exact, hash-consistent persisted Version', () => {
      expect(rehydrateVersion(persisted)).toMatchObject({ body, contentHash: persisted.contentHash });
    });

    it('rejects corrupted persisted JSON, schema, and content hash before it reaches the API', () => {
      expect(() => rehydrateVersion({ ...persisted, body: { text: 'x', extra: true } as never })).toThrow(
        SourceDomainError,
      );
      expect(() => rehydrateVersion({ ...persisted, schemaVersion: 'wrong' })).toThrow(SourceDomainError);
      expect(() => rehydrateVersion({ ...persisted, contentHash: 'f'.repeat(64) })).toThrow(SourceDomainError);
    });
  });

  describe('advanceWorkingCopy', () => {
    it('increments revision when expectedRevision matches', () => {
      const wc = defineWorkingCopy({
        id: wcId,
        sourceId,
        body: { text: 'initial' },
        revision: 1,
        baseVersionId: null,
        now,
      });
      const updated = advanceWorkingCopy(wc, { text: 'edited' }, 1, now);
      expect(updated.revision).toBe(2);
      expect(updated.body).toEqual({ text: 'edited' });
    });

    it('throws SOURCE_REVISION_CONFLICT when expectedRevision does not match', () => {
      const wc = defineWorkingCopy({
        id: wcId,
        sourceId,
        body: { text: 'initial' },
        revision: 1,
        baseVersionId: null,
        now,
      });
      expect(() => advanceWorkingCopy(wc, { text: 'edited' }, 2, now)).toThrow(SourceDomainError);
      expect(() => advanceWorkingCopy(wc, { text: 'edited' }, 0, now)).toThrow(SourceDomainError);
    });
  });
});
