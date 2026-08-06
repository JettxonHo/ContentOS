import { createHash } from 'node:crypto';

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';

import {
  buildUrlCaptureStorageKey,
  parseUrlCaptureStorageKey,
  type StoredObject,
  URL_SNAPSHOT_CONTENT_TYPES,
  type UrlSnapshotContentType,
} from '@contentos/core';

import { verifyIntegrityResponse } from './s3-object-store.js';

const FETCHER_CONTENT_TYPES = new Set<string>(URL_SNAPSHOT_CONTENT_TYPES);
const FETCHER_SNAPSHOT_MAX_BYTES = 2_097_152;

interface IntegrityBody extends AsyncIterable<Uint8Array> {
  destroy?: () => void;
}

export interface FetcherSnapshotStore {
  putImmutable(input: {
    readonly taskId: string;
    readonly attemptNumber: number;
    readonly snapshotId: string;
    readonly bytes: Uint8Array;
    readonly contentType: UrlSnapshotContentType;
    readonly signal: AbortSignal;
  }): Promise<StoredObject>;
  readForIntegrity(expected: StoredObject, signal: AbortSignal): Promise<boolean>;
  deleteForCompensation(input: {
    readonly taskId: string;
    readonly attemptNumber: number;
    readonly snapshotId: string;
    readonly signal: AbortSignal;
  }): Promise<void>;
}

export interface FetcherSnapshotStoreConfig {
  readonly endpoint: string;
  readonly region: string;
  readonly bucket: string;
  readonly forcePathStyle: boolean;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
}

export class FetcherSnapshotStoreError extends Error {
  constructor(readonly reason: 'WRITE_FAILED' | 'COMPENSATION_FAILED') {
    super(reason);
    this.name = 'FetcherSnapshotStoreError';
  }
}

function keyFor(input: {
  readonly taskId: string;
  readonly attemptNumber: number;
  readonly snapshotId: string;
}): string {
  const storageKey = buildUrlCaptureStorageKey(input);
  const parsed = parseUrlCaptureStorageKey(storageKey);
  if (
    parsed === null ||
    parsed.taskId !== input.taskId ||
    parsed.attemptNumber !== input.attemptNumber ||
    parsed.snapshotId !== input.snapshotId
  ) {
    throw new FetcherSnapshotStoreError('WRITE_FAILED');
  }
  return storageKey;
}

/** S3-compatible immutable writer restricted to the public-URL capture key family. */
export class FetcherS3SnapshotStore implements FetcherSnapshotStore {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: FetcherSnapshotStoreConfig, client?: S3Client) {
    this.bucket = config.bucket;
    this.client =
      client ??
      new S3Client({
        endpoint: config.endpoint,
        region: config.region,
        forcePathStyle: config.forcePathStyle,
        credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
      });
  }

  async putImmutable(input: {
    readonly taskId: string;
    readonly attemptNumber: number;
    readonly snapshotId: string;
    readonly bytes: Uint8Array;
    readonly contentType: UrlSnapshotContentType;
    readonly signal: AbortSignal;
  }): Promise<StoredObject> {
    if (
      input.signal.aborted ||
      !FETCHER_CONTENT_TYPES.has(input.contentType) ||
      input.bytes.byteLength < 1 ||
      input.bytes.byteLength > FETCHER_SNAPSHOT_MAX_BYTES
    ) {
      throw new FetcherSnapshotStoreError('WRITE_FAILED');
    }
    const storageKey = keyFor(input);
    const sha256 = createHash('sha256').update(input.bytes).digest('hex');
    const byteSize = input.bytes.byteLength;
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
          Body: input.bytes,
          ContentType: input.contentType,
          IfNoneMatch: '*',
          Metadata: { sha256, bytesize: String(byteSize), immutable: 'true' },
        }),
        { abortSignal: input.signal },
      );
    } catch (error) {
      if (error instanceof S3ServiceException && error.$metadata.httpStatusCode === 412) {
        throw new FetcherSnapshotStoreError('WRITE_FAILED');
      }
      throw new FetcherSnapshotStoreError('WRITE_FAILED');
    }
    return { storageKey, sha256, byteSize, contentType: input.contentType };
  }

  async readForIntegrity(expected: StoredObject, signal: AbortSignal): Promise<boolean> {
    if (signal.aborted) return false;
    try {
      const response = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: expected.storageKey }), {
        abortSignal: signal,
      });
      return verifyIntegrityResponse(
        {
          body: response.Body as IntegrityBody | undefined,
          contentLength: response.ContentLength,
          contentType: response.ContentType,
          metadata: response.Metadata,
        },
        expected,
        signal,
      );
    } catch {
      return false;
    }
  }

  async deleteForCompensation(input: {
    readonly taskId: string;
    readonly attemptNumber: number;
    readonly snapshotId: string;
    readonly signal: AbortSignal;
  }): Promise<void> {
    if (input.signal.aborted) throw new FetcherSnapshotStoreError('COMPENSATION_FAILED');
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: keyFor(input) }), {
        abortSignal: input.signal,
      });
    } catch {
      throw new FetcherSnapshotStoreError('COMPENSATION_FAILED');
    }
  }

  /** Closes only the S3 client owned by this Fetcher-scoped store. */
  close(): void {
    this.client.destroy();
  }
}
