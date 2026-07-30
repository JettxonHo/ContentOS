import { describe, expect, it } from 'vitest';

import {
  SourceApplicationError,
  SourceCapturePersistenceError,
  SourceDomainError,
  SourceService,
  type CaptureReconciliation,
} from './source-service.js';
import { UploadQuarantineError } from './upload.js';
import type { NormalizedBodyValidator } from './normalized-body-validator.js';
import type { ObjectStore, StoredObject } from './object-store.js';
import type { ContentPackageId, ContentPackageOwnerId } from '../content-package/content-package.js';
import type {
  NormalizedSourceBody,
  RawSnapshotId,
  RawSnapshotState,
  SourceApprovalId,
  SourceApprovalState,
  SourceHeadState,
  SourceId,
  SourceReferenceState,
  SourceState,
  SourceVersionId,
  SourceVersionState,
  SourceWorkingCopyId,
  SourceWorkingCopyState,
} from './source-values.js';
import type { SourceListResult, SourceRepository, SourceServiceIds, SourceClock } from './source-service.js';

const owner = '00000000-0000-4000-8000-000000000001' as ContentPackageOwnerId;
const packageId = '10000000-0000-4000-8000-000000000001' as ContentPackageId;
const fixedDate = new Date('2026-01-01T00:00:00Z');

function makeStoredObject(): StoredObject {
  return {
    storageKey: 'sources/owner/pkg/src/raw/snap',
    sha256: 'a'.repeat(64),
    byteSize: 17,
    contentType: 'text/plain; charset=utf-8',
  };
}

function makeFakeIds(): SourceServiceIds {
  let counter = 0;
  const next = (): string => `30000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`;
  return {
    generateSourceId: () => next() as SourceId,
    generateSnapshotId: () => next() as RawSnapshotId,
    generateWorkingCopyId: () => next() as SourceWorkingCopyId,
    generateVersionId: () => next() as SourceVersionId,
    generateApprovalId: () => next() as SourceApprovalId,
  };
}

function makeFakeClock(): SourceClock {
  return { now: () => fixedDate };
}

/**
 * Minimal fake NormalizedBodyValidator that always reports valid.
 */
class FakeBodyValidator implements NormalizedBodyValidator {
  validate(body: unknown): body is NormalizedSourceBody {
    return (
      typeof body === 'object' &&
      body !== null &&
      typeof (body as { text?: unknown }).text === 'string' &&
      (body as { text: string }).text.length > 0
    );
  }
}

/**
 * Minimal fake ObjectStore that records interactions for compensation testing.
 */
class FakeObjectStore implements ObjectStore {
  readonly putCalls: Array<{ readonly key: string; readonly contentType: string }> = [];
  readonly deleteCalls: Array<{ readonly key: string }> = [];
  putResult: StoredObject = makeStoredObject();
  putShouldThrow = false;
  deleteShouldThrow = false;

  async putImmutable(input: {
    readonly ownerUserId: string;
    readonly contentPackageId: string;
    readonly sourceId: string;
    readonly snapshotId: string;
    readonly bytes: Uint8Array;
    readonly contentType: string;
  }): Promise<StoredObject> {
    if (this.putShouldThrow) {
      throw new Error('simulated object write failure');
    }
    const key = `sources/${input.ownerUserId}/${input.contentPackageId}/${input.sourceId}/raw/${input.snapshotId}`;
    this.putCalls.push({ key, contentType: input.contentType });
    return { ...this.putResult, storageKey: key, contentType: input.contentType };
  }

  async readForIntegrity(): Promise<boolean> {
    return true;
  }

  async deleteForCompensation(storageKey: string): Promise<void> {
    if (this.deleteShouldThrow) {
      throw new Error('simulated compensation failure');
    }
    this.deleteCalls.push({ key: storageKey });
  }
}

/**
 * Minimal fake SourceRepository that records capture calls and can simulate failures.
 */
class FakeRepository implements SourceRepository {
  captureShouldThrow = false;
  captureError: Error = new SourceDomainError('SOURCE_ROLE_LIMIT_EXCEEDED');
  reconciliation: CaptureReconciliation = { outcome: 'ABSENT' };
  reconciliationShouldThrow = false;
  updateResult: { workingCopy: SourceWorkingCopyState; snapshot: RawSnapshotState } | null = null;
  readonly captureCalls: Array<{ readonly reference: SourceReferenceState }> = [];
  findCalls = 0;

  async isPackageActiveForOwner(): Promise<boolean> {
    return true;
  }

  async isPackageOwnedByOwner(): Promise<boolean> {
    return true;
  }

  async countSourcesByRoleForPackage(): Promise<number> {
    return 0;
  }

  async capture(reference: SourceReferenceState): Promise<void> {
    this.captureCalls.push({ reference });
    if (this.captureShouldThrow) {
      throw this.captureError;
    }
  }

  async reconcileCapture(
    reference: SourceReferenceState,
    snapshot: RawSnapshotState,
    workingCopy: SourceWorkingCopyState,
    head: SourceHeadState,
  ): Promise<CaptureReconciliation> {
    if (this.reconciliationShouldThrow) throw new Error('reconciliation unavailable');
    if (this.reconciliation.outcome === 'COMMITTED') {
      return {
        outcome: 'COMMITTED',
        state: { reference, rawSnapshot: snapshot, workingCopy, head },
      };
    }
    return this.reconciliation;
  }

  async findByIdForPackageOwner(): Promise<SourceState | null> {
    this.findCalls += 1;
    return null;
  }

  async listForPackage(): Promise<SourceListResult> {
    return { items: [], hasMore: false };
  }

  async getWorkingCopyForPackageOwner(): Promise<{
    workingCopy: SourceWorkingCopyState;
    snapshot: RawSnapshotState;
  } | null> {
    return null;
  }

  async updateWorkingCopy(): Promise<{
    readonly workingCopy: SourceWorkingCopyState;
    readonly snapshot: RawSnapshotState;
  } | null> {
    return this.updateResult;
  }

  async createVersion(): Promise<{
    version: SourceVersionState;
    workingCopy: SourceWorkingCopyState;
    head: SourceHeadState;
  }> {
    throw new SourceApplicationError('SOURCE_NOT_FOUND');
  }

  async listVersionsForPackageOwner(): Promise<readonly SourceVersionState[]> {
    return [];
  }

  async getVersionForPackageOwner(): Promise<SourceVersionState | null> {
    return null;
  }

  async approve(): Promise<{ approval: SourceApprovalState; head: SourceHeadState }> {
    throw new SourceApplicationError('SOURCE_NOT_FOUND');
  }

  async getApprovalForPackageOwner(): Promise<SourceApprovalState | null> {
    return null;
  }
}

describe('SourceService capture failure paths', () => {
  it('rejects persistence-incompatible body and label text before Object Storage', async () => {
    for (const input of [
      { text: 'body\u0000text', label: null },
      { text: 'body\ud800text', label: null },
      { text: 'body\udc00text', label: null },
      { text: 'valid body', label: 'label\u0000text' },
    ]) {
      const objectStore = new FakeObjectStore();
      const repository = new FakeRepository();
      const service = new SourceService(
        repository,
        objectStore,
        makeFakeIds(),
        makeFakeClock(),
        new FakeBodyValidator(),
      );

      await expect(
        service.capture({
          contentPackageId: packageId,
          ownerUserId: owner,
          sourceType: 'pasted_text',
          role: 'primary',
          label: input.label,
          text: input.text,
        }),
      ).rejects.toThrow(SourceDomainError);
      expect(objectStore.putCalls).toHaveLength(0);
      expect(repository.captureCalls).toHaveLength(0);
    }
  });

  it('creates no database state when object write fails', async () => {
    const objectStore = new FakeObjectStore();
    objectStore.putShouldThrow = true;
    const repository = new FakeRepository();
    const service = new SourceService(repository, objectStore, makeFakeIds(), makeFakeClock(), new FakeBodyValidator());

    await expect(
      service.capture({
        contentPackageId: packageId,
        ownerUserId: owner,
        sourceType: 'pasted_text',
        role: 'primary',
        label: null,
        text: 'Valid pasted text',
      }),
    ).rejects.toThrow(SourceApplicationError);

    // Repository.capture must never have been called
    expect(repository.captureCalls).toHaveLength(0);
  });

  it('invokes compensation delete when repository fails after object write', async () => {
    const objectStore = new FakeObjectStore();
    const repository = new FakeRepository();
    repository.captureShouldThrow = true;
    repository.captureError = new SourceCapturePersistenceError(
      'NOT_COMMITTED',
      new SourceDomainError('SOURCE_ROLE_LIMIT_EXCEEDED'),
    );
    const service = new SourceService(repository, objectStore, makeFakeIds(), makeFakeClock(), new FakeBodyValidator());

    await expect(
      service.capture({
        contentPackageId: packageId,
        ownerUserId: owner,
        sourceType: 'pasted_text',
        role: 'primary',
        label: null,
        text: 'Valid pasted text',
      }),
    ).rejects.toThrow(SourceDomainError);

    // Object was written
    expect(objectStore.putCalls).toHaveLength(1);
    // Repository was attempted
    expect(repository.captureCalls).toHaveLength(1);
    // Compensation delete was invoked with the stored key
    expect(objectStore.deleteCalls).toHaveLength(1);
    expect(objectStore.deleteCalls[0]?.key).toBe(objectStore.putCalls[0]?.key);
  });

  it('surfaces SOURCE_COMPENSATION_FAILED when compensation delete fails', async () => {
    const objectStore = new FakeObjectStore();
    objectStore.deleteShouldThrow = true;
    const repository = new FakeRepository();
    repository.captureShouldThrow = true;
    repository.captureError = new SourceCapturePersistenceError(
      'NOT_COMMITTED',
      new SourceDomainError('SOURCE_ROLE_LIMIT_EXCEEDED'),
    );
    const service = new SourceService(repository, objectStore, makeFakeIds(), makeFakeClock(), new FakeBodyValidator());

    await expect(
      service.capture({
        contentPackageId: packageId,
        ownerUserId: owner,
        sourceType: 'pasted_text',
        role: 'primary',
        label: null,
        text: 'Valid pasted text',
      }),
    ).rejects.toMatchObject({ code: 'SOURCE_COMPENSATION_FAILED' });
  });

  it('surfaces SOURCE_COMPENSATION_FAILED for unexpected repository errors', async () => {
    const objectStore = new FakeObjectStore();
    objectStore.deleteShouldThrow = true;
    const repository = new FakeRepository();
    repository.captureShouldThrow = true;
    repository.captureError = new SourceCapturePersistenceError(
      'NOT_COMMITTED',
      new Error('unexpected database failure'),
    );
    const service = new SourceService(repository, objectStore, makeFakeIds(), makeFakeClock(), new FakeBodyValidator());

    await expect(
      service.capture({
        contentPackageId: packageId,
        ownerUserId: owner,
        sourceType: 'pasted_text',
        role: 'primary',
        label: null,
        text: 'Valid pasted text',
      }),
    ).rejects.toMatchObject({ code: 'SOURCE_COMPENSATION_FAILED' });
  });

  it('returns the committed state directly after successful capture without a separate lookup', async () => {
    const objectStore = new FakeObjectStore();
    const repository = new FakeRepository();
    const service = new SourceService(repository, objectStore, makeFakeIds(), makeFakeClock(), new FakeBodyValidator());

    const result = await service.capture({
      contentPackageId: packageId,
      ownerUserId: owner,
      sourceType: 'pasted_text',
      role: 'primary',
      label: null,
      text: 'Valid pasted text',
    });

    // The service must return the constructed state from the committed
    // transaction, not from a separate post-commit read that could fail.
    expect(result.reference.id).toBe(repository.captureCalls[0]?.reference.id);
    expect(result.workingCopy.body).toEqual({ text: 'Valid pasted text' });
    expect(result.rawSnapshot.contentType).toBe('text/plain; charset=utf-8');
    // findByIdForPackageOwner was never called (returns null in the fake),
    // yet capture still succeeds — proving no post-commit false-failure path.
  });

  it('returns authoritative committed state after a lost capture acknowledgement without deleting evidence', async () => {
    const objectStore = new FakeObjectStore();
    const repository = new FakeRepository();
    repository.captureShouldThrow = true;
    repository.captureError = new SourceCapturePersistenceError('COMMIT_UNKNOWN', new Error('ack lost'));
    repository.reconciliation = { outcome: 'COMMITTED', state: {} as SourceState };
    const service = new SourceService(repository, objectStore, makeFakeIds(), makeFakeClock(), new FakeBodyValidator());

    const result = await service.capture({
      contentPackageId: packageId,
      ownerUserId: owner,
      sourceType: 'pasted_text',
      role: 'primary',
      label: null,
      text: 'Valid pasted text',
    });

    expect(result.workingCopy.body.text).toBe('Valid pasted text');
    expect(objectStore.deleteCalls).toHaveLength(0);
  });

  it('compensates only after reconciliation confirms capture absence', async () => {
    const objectStore = new FakeObjectStore();
    const repository = new FakeRepository();
    repository.captureShouldThrow = true;
    repository.captureError = new SourceCapturePersistenceError('COMMIT_UNKNOWN', new Error('ack lost'));
    repository.reconciliation = { outcome: 'ABSENT' };
    const service = new SourceService(repository, objectStore, makeFakeIds(), makeFakeClock(), new FakeBodyValidator());

    await expect(
      service.capture({
        contentPackageId: packageId,
        ownerUserId: owner,
        sourceType: 'pasted_text',
        role: 'primary',
        label: null,
        text: 'Valid pasted text',
      }),
    ).rejects.toMatchObject({ code: 'SOURCE_CAPTURE_FAILED' });
    expect(objectStore.deleteCalls).toHaveLength(1);
  });

  it('retains immutable evidence and requests reconciliation when commit state cannot be determined', async () => {
    const objectStore = new FakeObjectStore();
    const repository = new FakeRepository();
    repository.captureShouldThrow = true;
    repository.captureError = new SourceCapturePersistenceError('COMMIT_UNKNOWN', new Error('ack lost'));
    repository.reconciliation = { outcome: 'UNKNOWN' };
    const service = new SourceService(repository, objectStore, makeFakeIds(), makeFakeClock(), new FakeBodyValidator());

    await expect(
      service.capture({
        contentPackageId: packageId,
        ownerUserId: owner,
        sourceType: 'pasted_text',
        role: 'primary',
        label: null,
        text: 'Valid pasted text',
      }),
    ).rejects.toMatchObject({ code: 'SOURCE_RECONCILIATION_REQUIRED' });
    expect(objectStore.deleteCalls).toHaveLength(0);
  });

  it('retains immutable evidence when the reconciliation read itself fails', async () => {
    const objectStore = new FakeObjectStore();
    const repository = new FakeRepository();
    repository.captureShouldThrow = true;
    repository.captureError = new SourceCapturePersistenceError('COMMIT_UNKNOWN', new Error('ack lost'));
    repository.reconciliationShouldThrow = true;
    const service = new SourceService(repository, objectStore, makeFakeIds(), makeFakeClock(), new FakeBodyValidator());

    await expect(
      service.capture({
        contentPackageId: packageId,
        ownerUserId: owner,
        sourceType: 'pasted_text',
        role: 'primary',
        label: null,
        text: 'Valid pasted text',
      }),
    ).rejects.toMatchObject({ code: 'SOURCE_RECONCILIATION_REQUIRED' });
    expect(objectStore.deleteCalls).toHaveLength(0);
  });

  it('returns the transactional PATCH result without a post-commit lookup', async () => {
    const objectStore = new FakeObjectStore();
    const repository = new FakeRepository();
    const service = new SourceService(repository, objectStore, makeFakeIds(), makeFakeClock(), new FakeBodyValidator());
    const captured = await service.capture({
      contentPackageId: packageId,
      ownerUserId: owner,
      sourceType: 'pasted_text',
      role: 'primary',
      label: null,
      text: 'Initial text',
    });
    repository.updateResult = {
      workingCopy: {
        ...captured.workingCopy,
        body: { text: 'Edited text' },
        revision: 2,
      },
      snapshot: captured.rawSnapshot,
    };

    const result = await service.editWorkingCopy({
      sourceId: captured.reference.id,
      contentPackageId: packageId,
      ownerUserId: owner,
      body: { text: 'Edited text' },
      expectedRevision: 1,
    });

    expect(result.workingCopy.revision).toBe(2);
    expect(result.snapshot.id).toBe(captured.rawSnapshot.id);
    expect(repository.findCalls).toBe(0);
  });
});

describe('SourceService captureUpload', () => {
  function makeService(): {
    service: SourceService;
    objectStore: FakeObjectStore;
    repository: FakeRepository;
  } {
    const objectStore = new FakeObjectStore();
    const repository = new FakeRepository();
    const service = new SourceService(repository, objectStore, makeFakeIds(), makeFakeClock(), new FakeBodyValidator());
    return { service, objectStore, repository };
  }

  function makeUpload(
    overrides: Partial<{
      fileName: string;
      declaredMediaType: string | null;
      bytes: Uint8Array;
      role: 'primary' | 'supporting';
      label: string | null;
    }> = {},
  ): Parameters<SourceService['captureUpload']>[0] {
    return {
      contentPackageId: packageId,
      ownerUserId: owner,
      role: overrides.role ?? 'primary',
      label: overrides.label ?? null,
      fileName: overrides.fileName ?? 'notes.md',
      declaredMediaType: overrides.declaredMediaType === undefined ? 'text/markdown' : overrides.declaredMediaType,
      bytes: overrides.bytes ?? new TextEncoder().encode('# Draft\ncontent'),
    };
  }

  it('captures a .md upload with markdown content type and decoded working copy', async () => {
    const { service, objectStore, repository } = makeService();
    const state = await service.captureUpload(makeUpload());

    expect(state.reference.sourceType).toBe('uploaded_text');
    expect(state.reference.captureType).toBe('uploaded_text');
    expect(state.reference.role).toBe('primary');
    expect(state.reference.label).toBe('notes');
    expect(state.rawSnapshot.contentType).toBe('text/markdown; charset=utf-8');
    expect(state.workingCopy.body).toEqual({ text: '# Draft\ncontent' });
    expect(objectStore.putCalls).toEqual([
      { key: expect.stringContaining('sources/'), contentType: 'text/markdown; charset=utf-8' },
    ]);
    expect(repository.captureCalls).toHaveLength(1);
  });

  it('captures a .txt upload with text/plain content type', async () => {
    const { service, objectStore } = makeService();
    const state = await service.captureUpload(
      makeUpload({ fileName: 'list.txt', declaredMediaType: 'text/plain', bytes: new TextEncoder().encode('items') }),
    );

    expect(state.reference.sourceType).toBe('uploaded_text');
    expect(state.rawSnapshot.contentType).toBe('text/plain; charset=utf-8');
    expect(state.workingCopy.body).toEqual({ text: 'items' });
    expect(objectStore.putCalls[0]?.contentType).toBe('text/plain; charset=utf-8');
  });

  it('prefers an explicit label over the derived filename stem', async () => {
    const { service } = makeService();
    const state = await service.captureUpload(makeUpload({ label: 'Research notes' }));
    expect(state.reference.label).toBe('Research notes');
  });

  it('creates no side effects when quarantine denies the upload', async () => {
    const denialInputs = [
      makeUpload({ fileName: 'virus.exe' }),
      makeUpload({ declaredMediaType: 'text/html' }),
      makeUpload({ bytes: new Uint8Array([0xff, 0xfe]) }),
      makeUpload({ bytes: new TextEncoder().encode('a'.repeat(100_001)) }),
      makeUpload({ bytes: new TextEncoder().encode('   ') }),
      makeUpload({ label: 'bad\0label' }),
    ];
    for (const input of denialInputs) {
      const { service, objectStore, repository } = makeService();
      await expect(service.captureUpload(input)).rejects.toBeInstanceOf(UploadQuarantineError);
      expect(objectStore.putCalls).toHaveLength(0);
      expect(objectStore.deleteCalls).toHaveLength(0);
      expect(repository.captureCalls).toHaveLength(0);
    }
  });

  it('denies a second primary upload after a pasted-text primary (shared role limits)', async () => {
    const objectStore = new FakeObjectStore();
    const repository = new FakeRepository();
    repository.countSourcesByRoleForPackage = async (): Promise<number> => 1;
    const service = new SourceService(repository, objectStore, makeFakeIds(), makeFakeClock(), new FakeBodyValidator());

    await expect(service.captureUpload(makeUpload({ role: 'primary' }))).rejects.toMatchObject({
      code: 'SOURCE_ROLE_LIMIT_EXCEEDED',
    });
    expect(objectStore.putCalls).toHaveLength(0);
  });

  it('compensates the object write when database creation fails', async () => {
    const { objectStore } = makeService();
    const repository = new FakeRepository();
    repository.captureShouldThrow = true;
    repository.captureError = new SourceCapturePersistenceError('NOT_COMMITTED', new Error('db down'));
    const failingService = new SourceService(
      repository,
      objectStore,
      makeFakeIds(),
      makeFakeClock(),
      new FakeBodyValidator(),
    );

    await expect(failingService.captureUpload(makeUpload())).rejects.toMatchObject({
      code: 'SOURCE_CAPTURE_FAILED',
    });
    expect(objectStore.putCalls).toHaveLength(1);
    expect(objectStore.deleteCalls).toHaveLength(1);
  });
});
