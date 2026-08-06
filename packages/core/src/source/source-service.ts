import type { ContentPackageId, ContentPackageOwnerId } from '../content-package/content-package.js';

import type { NormalizedBodyValidator } from './normalized-body-validator.js';
import type { ObjectStore, StoredObject } from './object-store.js';
import {
  advanceWorkingCopy,
  computeContentHash,
  defineApproval,
  defineHead,
  defineSnapshot,
  defineSourceReference,
  defineVersion,
  defineWorkingCopy,
  SourceDomainError,
  validatePastedTextBytes,
} from './source.js';
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
  type PastedUploadSnapshotContentType,
  type SourceState,
  type SourceType,
  type SourceVersionId,
  type SourceVersionState,
  type SourceWorkingCopyId,
  type SourceWorkingCopyState,
  MAX_SUPPORTING_SOURCES,
  PASTED_TEXT_MAX_BYTES,
  SOURCE_SCHEMA_VERSION,
} from './source-values.js';
import { assertUploadLabel, validateUploadFile } from './upload.js';

export type SourceApplicationErrorCode =
  | 'SOURCE_NOT_FOUND'
  | 'CONTENT_PACKAGE_NOT_FOUND'
  | 'PACKAGE_ARCHIVED'
  | 'SOURCE_REVISION_CONFLICT'
  | 'SOURCE_VERSION_NOT_FOUND'
  | 'SOURCE_VERSION_NOT_ELIGIBLE'
  | 'SOURCE_ALREADY_APPROVED'
  | 'SOURCE_CAPTURE_FAILED'
  | 'SOURCE_COMPENSATION_FAILED'
  | 'SOURCE_RECONCILIATION_REQUIRED'
  | 'SOURCE_VERSION_ALREADY_EXISTS'
  | 'SOURCE_BODY_INVALID';

export class SourceApplicationError extends Error {
  constructor(readonly code: SourceApplicationErrorCode) {
    super(code);
    this.name = 'SourceApplicationError';
  }
}

export interface SourceServiceIds {
  generateSourceId(): SourceId;
  generateSnapshotId(): RawSnapshotId;
  generateWorkingCopyId(): SourceWorkingCopyId;
  generateVersionId(): SourceVersionId;
  generateApprovalId(): SourceApprovalId;
}
export interface SourceClock {
  now(): Date;
}

export interface CaptureSourceCommand {
  readonly contentPackageId: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
  readonly sourceType: 'pasted_text';
  readonly role: 'primary' | 'supporting';
  readonly label: string | null;
  readonly text: string;
}

export interface CaptureUploadCommand {
  readonly contentPackageId: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
  readonly role: 'primary' | 'supporting';
  readonly label: string | null;
  /** Attacker-controlled multipart filename; validated by the quarantine gate. */
  readonly fileName: string;
  /** Declared multipart Content-Type for the file part, or null when absent. */
  readonly declaredMediaType: string | null;
  /** Exact original file bytes; stored unchanged as the Raw Snapshot. */
  readonly bytes: Uint8Array;
}

export interface EditWorkingCopyCommand {
  readonly sourceId: SourceId;
  readonly contentPackageId: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
  readonly body: NormalizedSourceBody;
  readonly expectedRevision: number;
}

export interface CreateVersionCommand {
  readonly sourceId: SourceId;
  readonly contentPackageId: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
  readonly expectedRevision: number;
}

export interface ApproveVersionCommand {
  readonly sourceId: SourceId;
  readonly contentPackageId: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
  readonly versionId: SourceVersionId;
}

export interface SourceListRequest {
  readonly contentPackageId: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
  readonly limit: number;
  readonly after?: { readonly createdAt: Date; readonly id: SourceId };
}

export interface SourceListResult {
  readonly items: readonly SourceReferenceState[];
  readonly hasMore: boolean;
}

export class SourceCapturePersistenceError extends Error {
  constructor(
    readonly outcome: 'NOT_COMMITTED' | 'COMMIT_UNKNOWN',
    readonly originalCause: unknown,
  ) {
    super('SOURCE_CAPTURE_PERSISTENCE_ERROR');
    this.name = 'SourceCapturePersistenceError';
  }
}

export type CaptureReconciliation =
  | { readonly outcome: 'COMMITTED'; readonly state: SourceState }
  | { readonly outcome: 'ABSENT' }
  | { readonly outcome: 'UNKNOWN' };

export interface SourceRepository {
  isPackageActiveForOwner(packageId: ContentPackageId, ownerUserId: ContentPackageOwnerId): Promise<boolean>;

  isPackageOwnedByOwner(packageId: ContentPackageId, ownerUserId: ContentPackageOwnerId): Promise<boolean>;

  countSourcesByRoleForPackage(
    packageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
    role: 'primary' | 'supporting',
  ): Promise<number>;

  capture(
    reference: SourceReferenceState,
    snapshot: RawSnapshotState,
    workingCopy: SourceWorkingCopyState,
    head: SourceHeadState,
  ): Promise<void>;

  reconcileCapture(
    reference: SourceReferenceState,
    snapshot: RawSnapshotState,
    workingCopy: SourceWorkingCopyState,
    head: SourceHeadState,
  ): Promise<CaptureReconciliation>;

  findByIdForPackageOwner(
    sourceId: SourceId,
    contentPackageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
  ): Promise<SourceState | null>;

  listForPackage(request: SourceListRequest): Promise<SourceListResult>;

  getWorkingCopyForPackageOwner(
    sourceId: SourceId,
    contentPackageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
  ): Promise<{ workingCopy: SourceWorkingCopyState; snapshot: RawSnapshotState } | null>;

  updateWorkingCopy(
    sourceId: SourceId,
    contentPackageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
    body: NormalizedSourceBody,
    expectedRevision: number,
    now: Date,
  ): Promise<{ readonly workingCopy: SourceWorkingCopyState; readonly snapshot: RawSnapshotState } | null>;

  createVersion(
    sourceId: SourceId,
    contentPackageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
    versionId: SourceVersionId,
    expectedRevision: number,
    now: Date,
  ): Promise<{ version: SourceVersionState; workingCopy: SourceWorkingCopyState; head: SourceHeadState }>;

  listVersionsForPackageOwner(
    sourceId: SourceId,
    contentPackageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
  ): Promise<readonly SourceVersionState[]>;

  getVersionForPackageOwner(
    sourceId: SourceId,
    versionId: SourceVersionId,
    contentPackageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
  ): Promise<SourceVersionState | null>;

  approve(
    sourceId: SourceId,
    contentPackageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
    versionId: SourceVersionId,
    approvalId: SourceApprovalId,
    validationSummary: string,
    now: Date,
  ): Promise<{ approval: SourceApprovalState; head: SourceHeadState }>;

  getApprovalForPackageOwner(
    sourceId: SourceId,
    contentPackageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
  ): Promise<SourceApprovalState | null>;
}

export class SourceService {
  constructor(
    private readonly repository: SourceRepository,
    private readonly objectStore: ObjectStore,
    private readonly ids: SourceServiceIds,
    private readonly clock: SourceClock,
    private readonly bodyValidator: NormalizedBodyValidator,
  ) {}

  async capture(command: CaptureSourceCommand): Promise<SourceState> {
    validatePastedTextBytes(command.text);
    return this.persistNewCapture({
      contentPackageId: command.contentPackageId,
      ownerUserId: command.ownerUserId,
      role: command.role,
      label: command.label,
      sourceType: 'pasted_text',
      captureType: 'pasted_text',
      normalizedBody: { text: command.text },
      rawBytes: Buffer.from(command.text, 'utf8'),
      contentType: 'text/plain; charset=utf-8',
    });
  }

  async captureUpload(command: CaptureUploadCommand): Promise<SourceState> {
    // Request-scoped Upload Quarantine gate (DEC-208 ordering): filename,
    // extension, declared MIME, size, encoding, and content validation all
    // run before the package lookup, role counting, and Object Store write.
    // A denied upload creates zero persisted state.
    const validated = validateUploadFile({
      fileName: command.fileName,
      declaredMediaType: command.declaredMediaType,
      bytes: command.bytes,
    });
    assertUploadLabel(command.label);
    return this.persistNewCapture({
      contentPackageId: command.contentPackageId,
      ownerUserId: command.ownerUserId,
      role: command.role,
      label: command.label ?? validated.derivedLabel,
      sourceType: 'uploaded_text',
      captureType: 'uploaded_text',
      normalizedBody: { text: validated.text },
      rawBytes: command.bytes,
      contentType: validated.contentType,
    });
  }

  private async persistNewCapture(params: {
    readonly contentPackageId: ContentPackageId;
    readonly ownerUserId: ContentPackageOwnerId;
    readonly role: 'primary' | 'supporting';
    readonly label: string | null;
    readonly sourceType: SourceType;
    readonly captureType: SourceCaptureType;
    readonly normalizedBody: NormalizedSourceBody;
    readonly rawBytes: Uint8Array;
    readonly contentType: PastedUploadSnapshotContentType;
  }): Promise<SourceState> {
    await this.requireActivePackage(params.contentPackageId, params.ownerUserId);

    const count = await this.repository.countSourcesByRoleForPackage(
      params.contentPackageId,
      params.ownerUserId,
      params.role,
    );
    if (params.role === 'primary' && count >= 1) {
      throw new SourceDomainError('SOURCE_ROLE_LIMIT_EXCEEDED');
    }
    if (params.role === 'supporting' && count >= MAX_SUPPORTING_SOURCES) {
      throw new SourceDomainError('SOURCE_ROLE_LIMIT_EXCEEDED');
    }

    const now = this.clock.now();
    const sourceId = this.ids.generateSourceId();
    const snapshotId = this.ids.generateSnapshotId();
    const workingCopyId = this.ids.generateWorkingCopyId();

    // Construct and validate all caller-controlled text before the immutable
    // Object Store write. In particular, labels and bodies cannot contain NUL
    // or lone UTF-16 surrogates that PostgreSQL jsonb would later reject.
    const reference = defineSourceReference({
      id: sourceId,
      contentPackageId: params.contentPackageId,
      ownerUserId: params.ownerUserId,
      sourceType: params.sourceType,
      role: params.role,
      label: params.label,
      captureType: params.captureType,
      now,
    });
    const workingCopy = defineWorkingCopy({
      id: workingCopyId,
      sourceId,
      body: params.normalizedBody,
      revision: 1,
      baseVersionId: null,
      now,
    });
    const head = defineHead({ sourceId, workingCopyId });

    let stored: StoredObject;
    try {
      stored = await this.objectStore.putImmutable({
        ownerUserId: params.ownerUserId,
        contentPackageId: params.contentPackageId,
        sourceId,
        snapshotId,
        bytes: params.rawBytes,
        contentType: params.contentType,
      });
    } catch {
      throw new SourceApplicationError('SOURCE_CAPTURE_FAILED');
    }

    const snapshot = defineSnapshot({
      id: snapshotId,
      sourceId,
      storageKey: stored.storageKey,
      sha256: stored.sha256,
      byteSize: stored.byteSize,
      contentType: stored.contentType,
      now,
    });

    const constructedState: SourceState = {
      reference,
      workingCopy,
      head,
      rawSnapshot: snapshot,
    };

    try {
      await this.repository.capture(reference, snapshot, workingCopy, head);
    } catch (error) {
      if (error instanceof SourceCapturePersistenceError && error.outcome === 'COMMIT_UNKNOWN') {
        const reconciliation = await this.repository
          .reconcileCapture(reference, snapshot, workingCopy, head)
          .catch((): CaptureReconciliation => ({ outcome: 'UNKNOWN' }));
        if (reconciliation.outcome === 'COMMITTED') {
          return reconciliation.state;
        }
        if (reconciliation.outcome === 'UNKNOWN') {
          throw new SourceApplicationError('SOURCE_RECONCILIATION_REQUIRED');
        }
        await this.compensateCapture(stored.storageKey);
        throw new SourceApplicationError('SOURCE_CAPTURE_FAILED');
      }

      await this.compensateCapture(stored.storageKey);
      if (error instanceof SourceCapturePersistenceError) {
        if (error.originalCause instanceof SourceDomainError || error.originalCause instanceof SourceApplicationError) {
          throw error.originalCause;
        }
        throw new SourceApplicationError('SOURCE_CAPTURE_FAILED');
      }
      throw error;
    }

    return constructedState;
  }

  async get(
    sourceId: SourceId,
    contentPackageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
  ): Promise<SourceState> {
    await this.requireActivePackage(contentPackageId, ownerUserId);
    const state = await this.repository.findByIdForPackageOwner(sourceId, contentPackageId, ownerUserId);
    if (!state) {
      throw new SourceApplicationError('SOURCE_NOT_FOUND');
    }
    return state;
  }

  async list(request: SourceListRequest): Promise<{
    readonly items: readonly SourceReferenceState[];
    readonly nextPosition: { readonly createdAt: Date; readonly id: SourceId } | null;
  }> {
    if (!Number.isSafeInteger(request.limit) || request.limit < 1 || request.limit > 50) {
      throw new SourceDomainError('INVALID_SOURCE');
    }
    await this.requireActivePackage(request.contentPackageId, request.ownerUserId);
    const result = await this.repository.listForPackage(request);
    const last = result.items.at(-1);
    return {
      items: result.items,
      nextPosition: result.hasMore && last ? { createdAt: last.createdAt, id: last.id } : null,
    };
  }

  async getWorkingCopy(
    sourceId: SourceId,
    contentPackageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
  ): Promise<{ workingCopy: SourceWorkingCopyState; snapshot: RawSnapshotState }> {
    await this.requireActivePackage(contentPackageId, ownerUserId);
    const result = await this.repository.getWorkingCopyForPackageOwner(sourceId, contentPackageId, ownerUserId);
    if (!result) {
      throw new SourceApplicationError('SOURCE_NOT_FOUND');
    }
    return result;
  }

  async editWorkingCopy(
    command: EditWorkingCopyCommand,
  ): Promise<{ workingCopy: SourceWorkingCopyState; snapshot: RawSnapshotState }> {
    validatePastedTextBytes(command.body.text);
    const now = this.clock.now();
    const updated = await this.repository.updateWorkingCopy(
      command.sourceId,
      command.contentPackageId,
      command.ownerUserId,
      command.body,
      command.expectedRevision,
      now,
    );
    if (updated) {
      return updated;
    }
    return this.classifyWorkingCopyFailure(
      command.sourceId,
      command.contentPackageId,
      command.ownerUserId,
      command.expectedRevision,
    );
  }

  async createVersion(command: CreateVersionCommand): Promise<{
    version: SourceVersionState;
    workingCopy: SourceWorkingCopyState;
    head: SourceHeadState;
  }> {
    const now = this.clock.now();
    const versionId = this.ids.generateVersionId();

    const wcResult = await this.repository.getWorkingCopyForPackageOwner(
      command.sourceId,
      command.contentPackageId,
      command.ownerUserId,
    );
    if (!wcResult) {
      throw new SourceApplicationError('SOURCE_NOT_FOUND');
    }

    if (!this.bodyValidator.validate(wcResult.workingCopy.body)) {
      throw new SourceApplicationError('SOURCE_BODY_INVALID');
    }

    return this.repository.createVersion(
      command.sourceId,
      command.contentPackageId,
      command.ownerUserId,
      versionId,
      command.expectedRevision,
      now,
    );
  }

  async approve(command: ApproveVersionCommand): Promise<{
    approval: SourceApprovalState;
    head: SourceHeadState;
  }> {
    const now = this.clock.now();
    const approvalId = this.ids.generateApprovalId();

    const version = await this.repository.getVersionForPackageOwner(
      command.sourceId,
      command.versionId,
      command.contentPackageId,
      command.ownerUserId,
    );
    if (!version) {
      throw new SourceApplicationError('SOURCE_VERSION_NOT_FOUND');
    }

    if (
      version.schemaVersion !== SOURCE_SCHEMA_VERSION ||
      !this.bodyValidator.validate(version.body) ||
      version.contentHash !== computeContentHash(version.body)
    ) {
      throw new SourceApplicationError('SOURCE_BODY_INVALID');
    }

    const validationSummary = `schema=${version.schemaVersion};valid=true;contentHash=${version.contentHash}`;

    return this.repository.approve(
      command.sourceId,
      command.contentPackageId,
      command.ownerUserId,
      command.versionId,
      approvalId,
      validationSummary,
      now,
    );
  }

  async getVersion(
    sourceId: SourceId,
    versionId: SourceVersionId,
    contentPackageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
  ): Promise<SourceVersionState> {
    await this.requireActivePackage(contentPackageId, ownerUserId);
    const version = await this.repository.getVersionForPackageOwner(sourceId, versionId, contentPackageId, ownerUserId);
    if (!version) {
      throw new SourceApplicationError('SOURCE_VERSION_NOT_FOUND');
    }
    return version;
  }

  async listVersions(
    sourceId: SourceId,
    contentPackageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
  ): Promise<readonly SourceVersionState[]> {
    await this.requireActivePackage(contentPackageId, ownerUserId);
    const versions = await this.repository.listVersionsForPackageOwner(sourceId, contentPackageId, ownerUserId);
    if (versions.length === 0) {
      const state = await this.repository.findByIdForPackageOwner(sourceId, contentPackageId, ownerUserId);
      if (!state) {
        throw new SourceApplicationError('SOURCE_NOT_FOUND');
      }
    }
    return versions;
  }

  private async classifyWorkingCopyFailure(
    sourceId: SourceId,
    contentPackageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
    expectedRevision: number,
  ): Promise<never> {
    const state = await this.repository.findByIdForPackageOwner(sourceId, contentPackageId, ownerUserId);
    if (!state) {
      throw new SourceApplicationError('SOURCE_NOT_FOUND');
    }
    if (state.workingCopy.revision !== expectedRevision) {
      throw new SourceApplicationError('SOURCE_REVISION_CONFLICT');
    }
    throw new SourceDomainError('SOURCE_STATE_CONFLICT');
  }

  private async requireActivePackage(
    contentPackageId: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
  ): Promise<void> {
    if (await this.repository.isPackageActiveForOwner(contentPackageId, ownerUserId)) {
      return;
    }
    if (await this.repository.isPackageOwnedByOwner(contentPackageId, ownerUserId)) {
      throw new SourceApplicationError('PACKAGE_ARCHIVED');
    }
    throw new SourceApplicationError('CONTENT_PACKAGE_NOT_FOUND');
  }

  private async compensateCapture(storageKey: string): Promise<void> {
    try {
      await this.objectStore.deleteForCompensation(storageKey);
    } catch {
      throw new SourceApplicationError('SOURCE_COMPENSATION_FAILED');
    }
  }
}

export {
  SourceDomainError,
  computeContentHash,
  PASTED_TEXT_MAX_BYTES,
  SOURCE_SCHEMA_VERSION,
  advanceWorkingCopy,
  defineApproval,
  defineHead,
  defineSnapshot,
  defineSourceReference,
  defineVersion,
  defineWorkingCopy,
};
