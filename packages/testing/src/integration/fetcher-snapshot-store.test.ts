import { randomUUID } from 'node:crypto';

import { FetcherS3SnapshotStore, FetcherSnapshotStoreError } from '@contentos/object-storage';
import { describe, expect, it } from 'vitest';

import { composeHealth } from './compose.js';
import { readComposeCredentials, requireState } from './env.js';

describe('Fetcher snapshot store integration', () => {
  it('writes, verifies, compensates its own object, and rejects wrong credentials', async () => {
    const state = requireState();
    expect(await composeHealth(state, 'object-storage')).toBe('healthy');
    const credentials = readComposeCredentials(state.envFile);
    const accessKeyId = credentials.OBJECT_STORAGE_ACCESS_KEY;
    const secretAccessKey = credentials.OBJECT_STORAGE_SECRET_KEY;
    if (!accessKeyId || !secretAccessKey) throw new Error('temporary S3 credentials are unavailable');

    const config = {
      endpoint: `http://127.0.0.1:${state.ports.objectStorage}`,
      region: 'us-east-1',
      bucket: state.objectStorageBucket,
      forcePathStyle: true,
      accessKeyId,
      secretAccessKey,
    };
    const snapshotStore = new FetcherS3SnapshotStore(config);
    const taskId = randomUUID();
    const snapshotId = randomUUID();
    const signal = new AbortController().signal;
    const bytes = new TextEncoder().encode('task-owned fetcher evidence');

    const stored = await snapshotStore.putImmutable({
      taskId,
      attemptNumber: 1,
      snapshotId,
      bytes,
      contentType: 'text/plain',
      signal,
    });
    try {
      await expect(snapshotStore.readForIntegrity(stored, signal)).resolves.toBe(true);
      await expect(
        snapshotStore.putImmutable({
          taskId,
          attemptNumber: 1,
          snapshotId,
          bytes: new TextEncoder().encode('replacement evidence'),
          contentType: 'text/plain',
          signal,
        }),
      ).rejects.toEqual(new FetcherSnapshotStoreError('WRITE_FAILED'));
      await expect(snapshotStore.readForIntegrity(stored, signal)).resolves.toBe(true);
      const wrongCredentialStore = new FetcherS3SnapshotStore({
        ...config,
        secretAccessKey: 'invalid-fetcher-test-secret',
      });
      await expect(
        wrongCredentialStore.putImmutable({
          taskId: randomUUID(),
          attemptNumber: 1,
          snapshotId: randomUUID(),
          bytes,
          contentType: 'text/plain',
          signal,
        }),
      ).rejects.toEqual(new FetcherSnapshotStoreError('WRITE_FAILED'));
    } finally {
      await snapshotStore.deleteForCompensation({ taskId, attemptNumber: 1, snapshotId, signal });
    }
    await expect(snapshotStore.readForIntegrity(stored, signal)).resolves.toBe(false);
  });
});
