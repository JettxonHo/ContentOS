import { createHash } from 'node:crypto';

import type { ContentPackageId, ContentPackageOwnerId } from '../content-package/content-package.js';

import {
  type NormalizedSourceBody,
  type RawSnapshotId,
  type RawSnapshotState,
  type SourceApprovalId,
  type SourceApprovalState,
  type SourceCaptureType,
  type SourceHeadState,
  type SourceId,
  type SourceReferenceState,
  type SourceRole,
  type SourceType,
  type SourceVersionId,
  type SourceVersionState,
  type SourceWorkingCopyId,
  type SourceWorkingCopyState,
  PASTED_TEXT_MAX_BYTES,
  SOURCE_CAPTURE_TYPES,
  SOURCE_ROLES,
  SOURCE_SCHEMA_VERSION,
  SOURCE_TYPES,
} from './source-values.js';

export type SourceDomainErrorCode =
  'INVALID_SOURCE' | 'SOURCE_REVISION_CONFLICT' | 'SOURCE_ROLE_LIMIT_EXCEEDED' | 'SOURCE_STATE_CONFLICT';

export class SourceDomainError extends Error {
  constructor(readonly code: SourceDomainErrorCode) {
    super(code);
    this.name = 'SourceDomainError';
  }
}

const SOURCE_TYPE_SET = new Set<string>(SOURCE_TYPES);
const SOURCE_ROLE_SET = new Set<string>(SOURCE_ROLES);
const SOURCE_CAPTURE_TYPE_SET = new Set<string>(SOURCE_CAPTURE_TYPES);

function invalid(): never {
  throw new SourceDomainError('INVALID_SOURCE');
}

function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

function normalizeSourceType(sourceType: SourceType): SourceType {
  if (!SOURCE_TYPE_SET.has(sourceType)) {
    invalid();
  }
  return sourceType;
}

function normalizeRole(role: SourceRole): SourceRole {
  if (!SOURCE_ROLE_SET.has(role)) {
    invalid();
  }
  return role;
}

function normalizeCaptureType(captureType: SourceCaptureType): SourceCaptureType {
  if (!SOURCE_CAPTURE_TYPE_SET.has(captureType)) {
    invalid();
  }
  return captureType;
}

function normalizeLabel(label: string | null): string | null {
  if (label === null) {
    return null;
  }
  if (!isWellFormedUnicode(label)) {
    invalid();
  }
  const trimmed = label.trim();
  if ([...trimmed].length > 200) {
    invalid();
  }
  return trimmed === '' ? null : trimmed;
}

/**
 * Returns whether a JavaScript string is valid Unicode scalar text and does
 * not contain U+0000. PostgreSQL jsonb rejects these inputs, so this check
 * keeps validation ahead of Object Storage and persistence side effects.
 */
export function isWellFormedUnicode(text: string): boolean {
  for (let index = 0; index < text.length; index += 1) {
    const codeUnit = text.charCodeAt(index);
    if (codeUnit === 0) return false;
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const next = text.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      return false;
    }
  }
  return true;
}

/**
 * Validates the byte length of pasted text content.
 * Throws SourceDomainError('INVALID_SOURCE') for empty/whitespace-only
 * or oversized input.
 */
export function validatePastedTextBytes(text: string): void {
  if (typeof text !== 'string') {
    invalid();
  }
  if (!isWellFormedUnicode(text)) {
    invalid();
  }
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    invalid();
  }
  const byteLength = Buffer.byteLength(text, 'utf8');
  if (byteLength < 1 || byteLength > PASTED_TEXT_MAX_BYTES) {
    invalid();
  }
}

/**
 * Computes the SHA-256 hex digest of the canonical JSON encoding of body.
 */
export function computeContentHash(body: NormalizedSourceBody): string {
  const bodyKeys =
    typeof body === 'object' && body !== null ? Object.keys(body as unknown as Record<string, unknown>) : [];
  if (bodyKeys.length !== 1 || bodyKeys[0] !== 'text' || typeof body.text !== 'string') {
    invalid();
  }
  validatePastedTextBytes(body.text);
  return sha256Hex(JSON.stringify(body));
}

export interface CreateSourceReferenceInput {
  readonly id: SourceId;
  readonly contentPackageId: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
  readonly sourceType: SourceType;
  readonly role: SourceRole;
  readonly label: string | null;
  readonly captureType: SourceCaptureType;
  readonly now: Date;
}

function validateReference(state: SourceReferenceState): SourceReferenceState {
  if (!state.id || !state.contentPackageId || !state.ownerUserId || !Number.isFinite(state.createdAt.getTime())) {
    invalid();
  }
  return {
    ...state,
    sourceType: normalizeSourceType(state.sourceType),
    role: normalizeRole(state.role),
    captureType: normalizeCaptureType(state.captureType),
    label: normalizeLabel(state.label),
  };
}

function validateWorkingCopy(wc: SourceWorkingCopyState): SourceWorkingCopyState {
  const bodyKeys =
    typeof wc.body === 'object' && wc.body !== null ? Object.keys(wc.body as unknown as Record<string, unknown>) : [];
  if (
    !wc.id ||
    !wc.sourceId ||
    typeof wc.body !== 'object' ||
    wc.body === null ||
    typeof wc.body.text !== 'string' ||
    bodyKeys.length !== 1 ||
    bodyKeys[0] !== 'text' ||
    !Number.isSafeInteger(wc.revision) ||
    wc.revision < 1 ||
    (wc.checkpointedRevision !== null &&
      (!Number.isSafeInteger(wc.checkpointedRevision) ||
        wc.checkpointedRevision < 1 ||
        wc.checkpointedRevision > wc.revision)) ||
    wc.schemaVersion !== SOURCE_SCHEMA_VERSION ||
    !Number.isFinite(wc.updatedAt.getTime()) ||
    !Number.isFinite(wc.createdAt.getTime())
  ) {
    invalid();
  }
  validatePastedTextBytes(wc.body.text);
  return wc;
}

function validateHead(head: SourceHeadState): SourceHeadState {
  if (!head.sourceId || !head.workingCopyId) {
    invalid();
  }
  return head;
}

function validateSnapshot(snap: RawSnapshotState): RawSnapshotState {
  if (
    !snap.id ||
    !snap.sourceId ||
    !snap.storageKey ||
    !/^[0-9a-f]{64}$/.test(snap.sha256) ||
    snap.contentType !== 'text/plain; charset=utf-8' ||
    !Number.isSafeInteger(snap.byteSize) ||
    snap.byteSize < 1 ||
    !Number.isFinite(snap.capturedAt.getTime())
  ) {
    invalid();
  }
  return snap;
}

export function defineSourceReference(input: CreateSourceReferenceInput): SourceReferenceState {
  return validateReference({
    id: input.id,
    contentPackageId: input.contentPackageId,
    ownerUserId: input.ownerUserId,
    sourceType: input.sourceType,
    role: input.role,
    label: input.label,
    captureType: input.captureType,
    createdAt: input.now,
  });
}

export function defineWorkingCopy(input: {
  readonly id: SourceWorkingCopyId;
  readonly sourceId: SourceId;
  readonly body: NormalizedSourceBody;
  readonly revision: number;
  readonly baseVersionId: SourceVersionId | null;
  readonly now: Date;
}): SourceWorkingCopyState {
  return validateWorkingCopy({
    id: input.id,
    sourceId: input.sourceId,
    body: input.body,
    schemaVersion: SOURCE_SCHEMA_VERSION,
    revision: input.revision,
    checkpointedRevision: null,
    baseVersionId: input.baseVersionId,
    updatedAt: input.now,
    createdAt: input.now,
  });
}

export function defineHead(input: {
  readonly sourceId: SourceId;
  readonly workingCopyId: SourceWorkingCopyId;
}): SourceHeadState {
  return validateHead({
    sourceId: input.sourceId,
    workingCopyId: input.workingCopyId,
    latestVersionId: null,
    reviewCandidateVersionId: null,
    approvedVersionId: null,
  });
}

export function defineSnapshot(input: {
  readonly id: RawSnapshotId;
  readonly sourceId: SourceId;
  readonly storageKey: string;
  readonly sha256: string;
  readonly byteSize: number;
  readonly contentType: string;
  readonly now: Date;
}): RawSnapshotState {
  return validateSnapshot({
    id: input.id,
    sourceId: input.sourceId,
    storageKey: input.storageKey,
    sha256: input.sha256,
    byteSize: input.byteSize,
    contentType: input.contentType,
    capturedAt: input.now,
  });
}

export function defineVersion(input: {
  readonly id: SourceVersionId;
  readonly sourceId: SourceId;
  readonly versionNumber: number;
  readonly parentVersionId: SourceVersionId | null;
  readonly body: NormalizedSourceBody;
  readonly rawSnapshotId: RawSnapshotId;
  readonly createdById: string;
  readonly now: Date;
}): SourceVersionState {
  const contentHash = computeContentHash(input.body);
  return {
    id: input.id,
    sourceId: input.sourceId,
    versionNumber: input.versionNumber,
    parentVersionId: input.parentVersionId,
    body: input.body,
    contentHash,
    schemaVersion: SOURCE_SCHEMA_VERSION,
    rawSnapshotId: input.rawSnapshotId,
    createdById: input.createdById,
    createdAt: input.now,
  };
}

export function defineApproval(input: {
  readonly id: SourceApprovalId;
  readonly sourceId: SourceId;
  readonly approvedVersionId: SourceVersionId;
  readonly approvedById: string;
  readonly validationSummary: string;
  readonly now: Date;
}): SourceApprovalState {
  if (!input.id || !input.sourceId || !input.approvedVersionId || !input.approvedById) {
    invalid();
  }
  return {
    id: input.id,
    sourceId: input.sourceId,
    approvedVersionId: input.approvedVersionId,
    approvedById: input.approvedById,
    approvedAt: input.now,
    validationSummary: input.validationSummary,
  };
}

export function rehydrateReference(state: SourceReferenceState): SourceReferenceState {
  return validateReference(state);
}

export function rehydrateWorkingCopy(state: SourceWorkingCopyState): SourceWorkingCopyState {
  return validateWorkingCopy(state);
}

export function rehydrateHead(state: SourceHeadState): SourceHeadState {
  return validateHead(state);
}

export function rehydrateSnapshot(state: RawSnapshotState): RawSnapshotState {
  return validateSnapshot(state);
}

export function rehydrateVersion(state: SourceVersionState): SourceVersionState {
  const bodyKeys =
    typeof state.body === 'object' && state.body !== null
      ? Object.keys(state.body as unknown as Record<string, unknown>)
      : [];
  if (
    !state.id ||
    !state.sourceId ||
    !Number.isSafeInteger(state.versionNumber) ||
    state.versionNumber < 1 ||
    bodyKeys.length !== 1 ||
    bodyKeys[0] !== 'text' ||
    typeof state.body.text !== 'string' ||
    state.schemaVersion !== SOURCE_SCHEMA_VERSION ||
    !/^[0-9a-f]{64}$/.test(state.contentHash) ||
    state.contentHash !== computeContentHash(state.body) ||
    !state.rawSnapshotId ||
    !state.createdById ||
    !Number.isFinite(state.createdAt.getTime())
  ) {
    invalid();
  }
  validatePastedTextBytes(state.body.text);
  return state;
}

/**
 * Advance a working copy to the next revision.
 * Throws SOURCE_REVISION_CONFLICT if expectedRevision does not match.
 */
export function advanceWorkingCopy(
  current: SourceWorkingCopyState,
  body: NormalizedSourceBody,
  expectedRevision: number,
  now: Date,
): SourceWorkingCopyState {
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1 || expectedRevision !== current.revision) {
    throw new SourceDomainError('SOURCE_REVISION_CONFLICT');
  }
  return validateWorkingCopy({
    ...current,
    body,
    revision: current.revision + 1,
    updatedAt: now,
  });
}

export { sha256Hex, PASTED_TEXT_MAX_BYTES };
