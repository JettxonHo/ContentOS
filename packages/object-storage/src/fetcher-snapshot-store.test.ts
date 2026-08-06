import { createHash } from 'node:crypto';

import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, type S3Client } from '@aws-sdk/client-s3';
import { describe, expect, it } from 'vitest';

import { FetcherS3SnapshotStore, FetcherSnapshotStoreError } from './fetcher-snapshot-store.js';

const taskId = '00000000-0000-4000-8000-000000000201';
const snapshotId = '00000000-0000-4000-8000-000000000202';
const bytes = new TextEncoder().encode('immutable fetch evidence');

function responseBody(chunks: readonly Uint8Array[]): AsyncIterable<Uint8Array> {
  return {
    async *[Symbol.asyncIterator]() {
      yield* chunks;
    },
  };
}

function clientFor(
  send: (command: unknown, options?: { readonly abortSignal?: AbortSignal }) => Promise<unknown>,
): S3Client {
  return { send } as unknown as S3Client;
}

function store(client: S3Client): FetcherS3SnapshotStore {
  return new FetcherS3SnapshotStore(
    {
      endpoint: 'http://127.0.0.1:8333',
      region: 'us-east-1',
      bucket: 'contentos-fetcher-test',
      forcePathStyle: true,
      accessKeyId: 'test-access',
      secretAccessKey: 'test-secret',
    },
    client,
  );
}

describe('Fetcher S3 snapshot store', () => {
  it('closes only its owned S3 client lifecycle seam', () => {
    let destroyed = 0;
    const client = { send: async () => ({}), destroy: () => (destroyed += 1) } as unknown as S3Client;
    store(client).close();
    expect(destroyed).toBe(1);
  });

  it('uses the exact immutable public-URL key and independently verifies it', async () => {
    const commands: unknown[] = [];
    const digest = createHash('sha256').update(bytes).digest('hex');
    const snapshotStore = store(
      clientFor(async (command) => {
        commands.push(command);
        if (command instanceof GetObjectCommand) {
          return {
            Body: responseBody([bytes.subarray(0, 7), bytes.subarray(7)]),
            ContentLength: bytes.byteLength,
            ContentType: 'text/html',
            Metadata: { sha256: digest, bytesize: String(bytes.byteLength), immutable: 'true' },
          };
        }
        return {};
      }),
    );
    const signal = new AbortController().signal;

    const stored = await snapshotStore.putImmutable({
      taskId,
      attemptNumber: 2,
      snapshotId,
      bytes,
      contentType: 'text/html',
      signal,
    });

    expect(stored).toEqual({
      storageKey: `fetcher/url-capture/${taskId}/2/raw/${snapshotId}`,
      sha256: digest,
      byteSize: bytes.byteLength,
      contentType: 'text/html',
    });
    const put = commands[0] as PutObjectCommand;
    expect(put).toBeInstanceOf(PutObjectCommand);
    expect(put.input).toMatchObject({
      Bucket: 'contentos-fetcher-test',
      Key: stored.storageKey,
      Body: bytes,
      ContentType: 'text/html',
      IfNoneMatch: '*',
      Metadata: { sha256: digest, bytesize: String(bytes.byteLength), immutable: 'true' },
    });
    await expect(snapshotStore.readForIntegrity(stored, signal)).resolves.toBe(true);
  });

  it('fails a collision without trying to compensate the pre-existing object', async () => {
    const commands: unknown[] = [];
    const snapshotStore = store(
      clientFor(async (command) => {
        commands.push(command);
        throw new Error('precondition failed');
      }),
    );

    await expect(
      snapshotStore.putImmutable({
        taskId,
        attemptNumber: 1,
        snapshotId,
        bytes,
        contentType: 'text/plain',
        signal: new AbortController().signal,
      }),
    ).rejects.toEqual(new FetcherSnapshotStoreError('WRITE_FAILED'));
    expect(commands).toHaveLength(1);
    expect(commands[0]).toBeInstanceOf(PutObjectCommand);
  });

  it('reconstructs the exact Task/Attempt/Snapshot key for compensation', async () => {
    const commands: unknown[] = [];
    const snapshotStore = store(
      clientFor(async (command) => {
        commands.push(command);
        return {};
      }),
    );

    await snapshotStore.deleteForCompensation({
      taskId,
      attemptNumber: 3,
      snapshotId,
      signal: new AbortController().signal,
    });

    const deletion = commands[0] as DeleteObjectCommand;
    expect(deletion).toBeInstanceOf(DeleteObjectCommand);
    expect(deletion.input.Key).toBe(`fetcher/url-capture/${taskId}/3/raw/${snapshotId}`);
  });

  it('fails read-back closed when the inherited signal has already expired', async () => {
    let reads = 0;
    const snapshotStore = store(
      clientFor(async () => {
        reads += 1;
        return {};
      }),
    );
    const controller = new AbortController();
    controller.abort();

    await expect(
      snapshotStore.readForIntegrity(
        {
          storageKey: `fetcher/url-capture/${taskId}/1/raw/${snapshotId}`,
          sha256: createHash('sha256').update(bytes).digest('hex'),
          byteSize: bytes.byteLength,
          contentType: 'text/plain',
        },
        controller.signal,
      ),
    ).resolves.toBe(false);
    expect(reads).toBe(0);
  });

  it.each([
    {
      label: 'digest metadata',
      response: { Metadata: { sha256: '0'.repeat(64), bytesize: String(bytes.byteLength) } },
    },
    {
      label: 'byte-size metadata',
      response: { Metadata: { sha256: createHash('sha256').update(bytes).digest('hex'), bytesize: '1' } },
    },
    { label: 'Content-Length', response: { ContentLength: bytes.byteLength + 1 } },
    { label: 'content type', response: { ContentType: 'text/html' } },
    { label: 'body bytes', response: { Body: responseBody([new TextEncoder().encode('different evidence')]) } },
  ])('fails read-back closed for a $label mismatch', async ({ response: mismatch }) => {
    const digest = createHash('sha256').update(bytes).digest('hex');
    const snapshotStore = store(
      clientFor(async () => ({
        Body: responseBody([bytes]),
        ContentLength: bytes.byteLength,
        ContentType: 'text/plain',
        Metadata: { sha256: digest, bytesize: String(bytes.byteLength), immutable: 'true' },
        ...mismatch,
      })),
    );

    await expect(
      snapshotStore.readForIntegrity(
        {
          storageKey: `fetcher/url-capture/${taskId}/1/raw/${snapshotId}`,
          sha256: digest,
          byteSize: bytes.byteLength,
          contentType: 'text/plain',
        },
        new AbortController().signal,
      ),
    ).resolves.toBe(false);
  });

  it('fails read-back closed when GetObject fails', async () => {
    const snapshotStore = store(
      clientFor(async () => {
        throw new Error('private provider failure');
      }),
    );

    await expect(
      snapshotStore.readForIntegrity(
        {
          storageKey: `fetcher/url-capture/${taskId}/1/raw/${snapshotId}`,
          sha256: createHash('sha256').update(bytes).digest('hex'),
          byteSize: bytes.byteLength,
          contentType: 'text/plain',
        },
        new AbortController().signal,
      ),
    ).resolves.toBe(false);
  });

  it('passes the same inherited signal to put, read, and exact compensation', async () => {
    const observedSignals: (AbortSignal | undefined)[] = [];
    const digest = createHash('sha256').update(bytes).digest('hex');
    const snapshotStore = store(
      clientFor(async (command, options) => {
        observedSignals.push(options?.abortSignal);
        if (command instanceof GetObjectCommand) {
          return {
            Body: responseBody([bytes]),
            ContentLength: bytes.byteLength,
            ContentType: 'text/plain',
            Metadata: { sha256: digest, bytesize: String(bytes.byteLength), immutable: 'true' },
          };
        }
        return {};
      }),
    );
    const signal = new AbortController().signal;
    const stored = await snapshotStore.putImmutable({
      taskId,
      attemptNumber: 4,
      snapshotId,
      bytes,
      contentType: 'text/plain',
      signal,
    });

    await expect(snapshotStore.readForIntegrity(stored, signal)).resolves.toBe(true);
    await snapshotStore.deleteForCompensation({ taskId, attemptNumber: 4, snapshotId, signal });
    expect(observedSignals).toEqual([signal, signal, signal]);
  });

  it('accepts exactly 2 MiB and rejects one additional byte before calling S3', async () => {
    let sends = 0;
    const snapshotStore = store(
      clientFor(async () => {
        sends += 1;
        return {};
      }),
    );
    const signal = new AbortController().signal;

    await expect(
      snapshotStore.putImmutable({
        taskId,
        attemptNumber: 1,
        snapshotId,
        bytes: new Uint8Array(2_097_152),
        contentType: 'text/plain',
        signal,
      }),
    ).resolves.toMatchObject({ byteSize: 2_097_152 });
    await expect(
      snapshotStore.putImmutable({
        taskId,
        attemptNumber: 1,
        snapshotId,
        bytes: new Uint8Array(2_097_153),
        contentType: 'text/plain',
        signal,
      }),
    ).rejects.toEqual(new FetcherSnapshotStoreError('WRITE_FAILED'));
    expect(sends).toBe(1);
  });
});
