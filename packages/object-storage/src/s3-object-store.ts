import { createHash } from 'node:crypto';

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';

import { ObjectStoreError, type ObjectStore, type StoredObject } from '@contentos/core';

export interface S3ObjectStoreConfig {
  readonly endpoint: string;
  readonly region: string;
  readonly bucket: string;
  readonly forcePathStyle: boolean;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
}

const PASTED_TEXT_CONTENT_TYPE = 'text/plain; charset=utf-8';

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
  }): Promise<StoredObject> {
    const storageKey = buildKey(input);
    const sha256 = createHash('sha256').update(input.bytes).digest('hex');
    const byteSize = input.bytes.byteLength;

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
          Body: input.bytes,
          ContentType: PASTED_TEXT_CONTENT_TYPE,
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

    return { storageKey, sha256, byteSize, contentType: PASTED_TEXT_CONTENT_TYPE };
  }

  async readForIntegrity(expected: StoredObject): Promise<boolean> {
    try {
      const response = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: expected.storageKey }));
      if (!response.Body) {
        return false;
      }
      const bytes = await response.Body.transformToByteArray();
      const actual = createHash('sha256').update(bytes).digest('hex');
      return (
        actual === expected.sha256 &&
        response.Metadata?.sha256 === expected.sha256 &&
        response.Metadata?.bytesize === String(expected.byteSize) &&
        bytes.byteLength === expected.byteSize &&
        response.ContentType === expected.contentType &&
        expected.contentType === PASTED_TEXT_CONTENT_TYPE
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
