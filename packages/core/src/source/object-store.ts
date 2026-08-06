import type { PastedUploadSnapshotContentType } from './source-values.js';

/**
 * Result of storing immutable object bytes.
 * `storageKey` is opaque and never user-controlled.
 */
export interface StoredObject {
  readonly storageKey: string;
  readonly sha256: string;
  readonly byteSize: number;
  readonly contentType: string;
}
/**
 * Domain-owned Port for private object storage. The adapter implementation
 * lives in `packages/object-storage` and depends on S3-compatible storage.
 *
 * Domain code depends only on this Port — it has no knowledge of the
 * S3 SDK, bucket names, endpoints, or credentials.
 */
export interface ObjectStore {
  /**
   * Stores immutable bytes under an opaque owner/package/source/snapshot-scoped key.
   * Returns the storage key, SHA-256 hex digest, and byte size.
   * Must not overwrite an existing object for the same key.
   * `contentType` must be one of the two allowlisted pasted/upload snapshot
   * content types. URL-capture media types are read-only at this Port until the
   * separately approved Fetcher writer exists.
   */
  putImmutable(input: {
    readonly ownerUserId: string;
    readonly contentPackageId: string;
    readonly sourceId: string;
    readonly snapshotId: string;
    readonly bytes: Uint8Array;
    readonly contentType: PastedUploadSnapshotContentType;
  }): Promise<StoredObject>;

  /**
   * Reads bytes back solely for integrity verification. Returns true only if
   * the body digest, stored digest metadata, byte size, and content type all
   * match the expected immutable-object record.
   * Never exposes a URL or credential.
   */
  readForIntegrity(expected: StoredObject): Promise<boolean>;

  /**
   * Deletes a scoped object to compensate a failed database creation.
   * Used only during capture compensation — never as a public API.
   */
  deleteForCompensation(storageKey: string): Promise<void>;
}

/**
 * Error raised when the ObjectStore write fails. The message carries
 * only a generic reason — never credentials, endpoints, or raw responses.
 */
export class ObjectStoreError extends Error {
  constructor(
    readonly reason: 'WRITE_FAILED' | 'INTEGRITY_MISMATCH' | 'COMPENSATION_FAILED',
    message: string,
  ) {
    super(message);
    this.name = 'ObjectStoreError';
  }
}
