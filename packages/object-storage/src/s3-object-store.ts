import { createHash } from 'node:crypto';

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';

import {
  ObjectStoreError,
  PASTED_UPLOAD_SNAPSHOT_CONTENT_TYPES,
  SOURCE_SNAPSHOT_CONTENT_TYPES,
  type ObjectStore,
  type StoredObject,
} from '@contentos/core';

export interface S3ObjectStoreConfig {
  readonly endpoint: string;
  readonly region: string;
  readonly bucket: string;
  readonly forcePathStyle: boolean;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
}

const WRITABLE_SNAPSHOT_CONTENT_TYPE_SET = new Set<string>(PASTED_UPLOAD_SNAPSHOT_CONTENT_TYPES);
const READABLE_SNAPSHOT_CONTENT_TYPE_SET = new Set<string>(SOURCE_SNAPSHOT_CONTENT_TYPES);
const MAX_INTEGRITY_READ_BYTES = 2_097_152;

interface IntegrityBody extends AsyncIterable<Uint8Array> {
  destroy?: () => void;
}

interface IntegrityResponse {
  readonly body: IntegrityBody | undefined;
  readonly contentLength: number | undefined;
  readonly contentType: string | undefined;
  readonly metadata: Readonly<Record<string, string | undefined>> | undefined;
}

function abortBody(body: IntegrityBody | undefined): void {
  try {
    body?.destroy?.();
  } catch {
    // Integrity verification is already failing closed. Never expose a raw
    // stream-abort error or let it replace the stable false result.
  }
}

/**
 * Verifies one S3 integrity response without buffering an untrusted object.
 * Header/metadata mismatches abort before iteration; the streaming loop has an
 * exact expected-byte cap and a fixed 2 MiB defense-in-depth ceiling.
 */
export async function verifyIntegrityResponse(response: IntegrityResponse, expected: StoredObject): Promise<boolean> {
  if (
    !Number.isSafeInteger(expected.byteSize) ||
    expected.byteSize < 1 ||
    expected.byteSize > MAX_INTEGRITY_READ_BYTES ||
    !/^[0-9a-f]{64}$/.test(expected.sha256) ||
    !READABLE_SNAPSHOT_CONTENT_TYPE_SET.has(expected.contentType) ||
    response.body === undefined ||
    response.contentLength !== expected.byteSize ||
    response.contentType !== expected.contentType ||
    response.metadata?.sha256 !== expected.sha256 ||
    response.metadata?.bytesize !== String(expected.byteSize)
  ) {
    abortBody(response.body);
    return false;
  }

  const hash = createHash('sha256');
  let byteSize = 0;
  try {
    for await (const chunk of response.body) {
      if (!(chunk instanceof Uint8Array)) {
        abortBody(response.body);
        return false;
      }
      byteSize += chunk.byteLength;
      if (byteSize > expected.byteSize || byteSize > MAX_INTEGRITY_READ_BYTES) {
        abortBody(response.body);
        return false;
      }
      hash.update(chunk);
    }
  } catch {
    abortBody(response.body);
    return false;
  }
  return byteSize === expected.byteSize && hash.digest('hex') === expected.sha256;
}

function buildKey(input: {
  readonly ownerUserId: string;
  readonly contentPackageId: string;
  readonly sourceId: string;
  readonly snapshotId: string;
}): string {
  return `sources/${input.ownerUserId}/${input.contentPackageId}/${input.sourceId}/raw/${input.snapshotId}`;
}

export class S3ObjectStore implements ObjectStore {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: S3ObjectStoreConfig) {
    this.bucket = config.bucket;
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: config.forcePathStyle,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async putImmutable(input: {
    readonly ownerUserId: string;
    readonly contentPackageId: string;
    readonly sourceId: string;
    readonly snapshotId: string;
    readonly bytes: Uint8Array;
    readonly contentType: string;
  }): Promise<StoredObject> {
    if (!WRITABLE_SNAPSHOT_CONTENT_TYPE_SET.has(input.contentType)) {
      throw new ObjectStoreError('WRITE_FAILED', 'Unsupported snapshot content type');
    }
    const storageKey = buildKey(input);
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
          Metadata: {
            sha256,
            byteSize: String(byteSize),
            immutable: 'true',
          },
        }),
      );
    } catch (error) {
      if (error instanceof S3ServiceException && error.$metadata?.httpStatusCode === 412) {
        throw new ObjectStoreError('WRITE_FAILED', 'Object already exists for the given key');
      }
      throw new ObjectStoreError('WRITE_FAILED', 'Object store write failed');
    }

    return { storageKey, sha256, byteSize, contentType: input.contentType };
  }

  async readForIntegrity(expected: StoredObject): Promise<boolean> {
    try {
      const response = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: expected.storageKey }));
      return verifyIntegrityResponse(
        {
          body: response.Body as IntegrityBody | undefined,
          contentLength: response.ContentLength,
          contentType: response.ContentType,
          metadata: response.Metadata,
        },
        expected,
      );
    } catch {
      return false;
    }
  }

  async deleteForCompensation(storageKey: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }));
    } catch {
      throw new ObjectStoreError('COMPENSATION_FAILED', 'Unable to delete object during compensation');
    }
  }
}
