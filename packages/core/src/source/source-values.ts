import type { ContentPackageId, ContentPackageOwnerId } from '../content-package/content-package.js';

export type SourceId = string & { readonly __brand: 'SourceId' };
export type RawSnapshotId = string & { readonly __brand: 'RawSnapshotId' };
export type SourceWorkingCopyId = string & { readonly __brand: 'SourceWorkingCopyId' };
export type SourceVersionId = string & { readonly __brand: 'SourceVersionId' };
export type SourceApprovalId = string & { readonly __brand: 'SourceApprovalId' };

export const SOURCE_TYPES = ['pasted_text', 'uploaded_text', 'public_url'] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const SOURCE_ROLES = ['primary', 'supporting'] as const;
export type SourceRole = (typeof SOURCE_ROLES)[number];

export const SOURCE_CAPTURE_TYPES = ['pasted_text', 'uploaded_text', 'public_url'] as const;
export type SourceCaptureType = (typeof SOURCE_CAPTURE_TYPES)[number];

export const SOURCE_SCHEMA_VERSION = 'source/normalized/v1' as const;

/**
 * Raw Snapshot content types for the pasted/upload key family. Pasted Text is
 * stored as `text/plain; charset=utf-8`; `.txt` uploads use the same value and
 * `.md` uploads use `text/markdown; charset=utf-8`. Documented as a reversible
 * implementation detail in `docs/architecture/source-foundation.md`.
 */
export const PASTED_UPLOAD_SNAPSHOT_CONTENT_TYPES = [
  'text/plain; charset=utf-8',
  'text/markdown; charset=utf-8',
] as const;

/**
 * Raw Snapshot content types for the `public_url` key family (M2-SRC-003).
 * These are the three canonical URL media types declared by the
 * `fetcher-result/v1` success contract.
 */
export const URL_SNAPSHOT_CONTENT_TYPES = ['text/html', 'text/plain', 'text/markdown'] as const;
export type UrlSnapshotContentType = (typeof URL_SNAPSHOT_CONTENT_TYPES)[number];

/**
 * Allowlisted Raw Snapshot content types across both key families. The
 * Object Storage adapter uses this set for both the no-overwrite write path
 * (pasted/upload only, before M2-FETCH-001) and the integrity read path; the
 * `public_url` entries are required so a verified URL Raw Snapshot can be
 * integrity-read without modifying `packages/object-storage`.
 */
export const SOURCE_SNAPSHOT_CONTENT_TYPES = [
  ...PASTED_UPLOAD_SNAPSHOT_CONTENT_TYPES,
  ...URL_SNAPSHOT_CONTENT_TYPES,
] as const;
export type SourceSnapshotContentType = (typeof SOURCE_SNAPSHOT_CONTENT_TYPES)[number];

/**
 * The persisted Normalized Source body shape. Stored as `jsonb` in PostgreSQL
 * and validated against `schemas/source/normalized-source-v1.json` in the
 * production path. The TypeScript interface in
 * `packages/contracts/src/source/normalized-source-body.ts` must stay
 * synchronized with this type.
 */
export interface NormalizedSourceBody {
  readonly text: string;
}

/**
 * Maximum UTF-8 byte length for a single Pasted Text Source body.
 *
 * This is a reversible implementation detail documented in
 * `docs/architecture/source-foundation.md`. It is large enough for
 * substantial prose and small enough to make a normalized review body
 * trivially reviewable.
 */
export const PASTED_TEXT_MAX_BYTES = 100_000;

/**
 * Maximum raw byte size for one uploaded `.md`/`.txt` file. The Security
 * Baseline (§9) fixes the allowlist and leaves the numeric limit open; this
 * bound is a reversible implementation detail documented in
 * `docs/architecture/source-foundation.md`. It matches the pasted-text bound
 * and stays within the `source_raw_snapshots_byte_size_check` constraint.
 */
export const UPLOAD_FILE_MAX_BYTES = 100_000;

/**
 * Maps the two MVP-allowed upload extensions to their stored Raw Snapshot
 * content types (DEC-208 allowlist; DEC-268 input scope).
 */
export const UPLOAD_EXTENSION_CONTENT_TYPES = {
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
} as const satisfies Record<string, SourceSnapshotContentType>;
export type UploadExtension = keyof typeof UPLOAD_EXTENSION_CONTENT_TYPES;

export const MAX_SUPPORTING_SOURCES = 5;
export const MAX_PRIMARY_SOURCES = 1;

export interface RawSnapshotState {
  readonly id: RawSnapshotId;
  readonly sourceId: SourceId;
  readonly storageKey: string;
  readonly sha256: string;
  readonly byteSize: number;
  readonly contentType: string;
  readonly capturedAt: Date;
}

export interface SourceWorkingCopyState {
  readonly id: SourceWorkingCopyId;
  readonly sourceId: SourceId;
  readonly body: NormalizedSourceBody;
  readonly schemaVersion: string;
  readonly revision: number;
  /** Last revision consumed by an immutable Version checkpoint. */
  readonly checkpointedRevision: number | null;
  readonly baseVersionId: SourceVersionId | null;
  readonly updatedAt: Date;
  readonly createdAt: Date;
}

export interface SourceVersionState {
  readonly id: SourceVersionId;
  readonly sourceId: SourceId;
  readonly versionNumber: number;
  readonly parentVersionId: SourceVersionId | null;
  readonly body: NormalizedSourceBody;
  readonly contentHash: string;
  readonly schemaVersion: string;
  readonly rawSnapshotId: RawSnapshotId;
  readonly createdById: string;
  readonly createdAt: Date;
}

export interface SourceApprovalState {
  readonly id: SourceApprovalId;
  readonly sourceId: SourceId;
  readonly approvedVersionId: SourceVersionId;
  readonly approvedById: string;
  readonly approvedAt: Date;
  readonly validationSummary: string;
}

export interface SourceHeadState {
  readonly sourceId: SourceId;
  readonly workingCopyId: SourceWorkingCopyId;
  readonly latestVersionId: SourceVersionId | null;
  readonly reviewCandidateVersionId: SourceVersionId | null;
  readonly approvedVersionId: SourceVersionId | null;
}

export interface SourceReferenceState {
  readonly id: SourceId;
  readonly contentPackageId: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
  readonly sourceType: SourceType;
  readonly role: SourceRole;
  readonly label: string | null;
  readonly captureType: SourceCaptureType;
  readonly createdAt: Date;
}

export interface SourceState {
  readonly reference: SourceReferenceState;
  readonly workingCopy: SourceWorkingCopyState;
  readonly head: SourceHeadState;
  readonly rawSnapshot: RawSnapshotState;
}
