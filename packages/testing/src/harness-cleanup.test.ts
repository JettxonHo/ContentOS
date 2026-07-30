import { mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { acquireBuildLock, emptyAndDeleteBucket } from './integration/harness.js';
import type { signedFetch } from './integration/sigv4.js';

const credentials = { accessKeyId: 'test-access', secretAccessKey: 'test-secret' };

describe('smoke S3 cleanup', () => {
  it('decodes escaped pagination tokens once and attempts later pages and bucket deletion after an object throw', async () => {
    const calls: Array<{ method: string; url: string }> = [];
    let listCount = 0;
    const request: typeof signedFetch = async (options) => {
      calls.push({ method: options.method, url: options.url });
      if (options.method === 'GET') {
        listCount += 1;
        if (listCount === 1) {
          return new Response(
            '<ListBucketResult><IsTruncated>true</IsTruncated><Contents><Key>folder/a&amp;b</Key></Contents><NextContinuationToken>tok&amp;en%3F</NextContinuationToken></ListBucketResult>',
            { status: 200 },
          );
        }
        expect(new URL(options.url).searchParams.get('continuation-token')).toBe('tok&en%3F');
        return new Response('<ListBucketResult><IsTruncated>false</IsTruncated></ListBucketResult>', { status: 200 });
      }
      if (options.url.includes('/folder/')) throw new Error('injected object-delete transport failure');
      return new Response(null, { status: 204 });
    };

    await expect(
      emptyAndDeleteBucket('http://127.0.0.1:8333', credentials, 'test-bucket', { request }),
    ).rejects.toThrow('object delete request threw');

    expect(calls.filter((call) => call.method === 'GET')).toHaveLength(2);
    expect(calls.at(-1)).toEqual({ method: 'DELETE', url: 'http://127.0.0.1:8333/test-bucket' });
  });

  it('attempts bucket deletion after the list request throws', async () => {
    const methods: string[] = [];
    const request: typeof signedFetch = async (options) => {
      methods.push(options.method);
      if (options.method === 'GET') throw new Error('injected list transport failure');
      return new Response(null, { status: 204 });
    };

    await expect(
      emptyAndDeleteBucket('http://127.0.0.1:8333', credentials, 'test-bucket', { request }),
    ).rejects.toThrow('bucket list request threw');
    expect(methods).toEqual(['GET', 'DELETE']);
  });

  it('decodes a literal entity-like object key exactly once', async () => {
    const deletes: string[] = [];
    const request: typeof signedFetch = async (options) => {
      if (options.method === 'GET') {
        return new Response(
          '<ListBucketResult><IsTruncated>false</IsTruncated><Contents><Key>folder/literal&amp;lt;.txt</Key></Contents></ListBucketResult>',
          { status: 200 },
        );
      }
      deletes.push(options.url);
      return new Response(null, { status: 204 });
    };

    await emptyAndDeleteBucket('http://127.0.0.1:8333', credentials, 'test-bucket', { request });
    expect(deletes[0]).toBe('http://127.0.0.1:8333/test-bucket/folder/literal%26lt%3B.txt');
  });
});

describe('smoke build lock', () => {
  it('reclaims malformed and dead-owner locks but preserves a live lock', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'contentos-build-lock-test-'));
    const lockFile = join(directory, 'build.lock');
    try {
      writeFileSync(lockFile, 'malformed');
      const old = new Date(Date.now() - 60_000);
      utimesSync(lockFile, old, old);
      const releaseMalformed = await acquireBuildLock({ lockFile, malformedGraceMs: 1, timeoutMs: 100, pollMs: 1 });
      releaseMalformed();

      writeFileSync(lockFile, JSON.stringify({ pid: 999_999, token: 'a'.repeat(32) }));
      const releaseStale = await acquireBuildLock({
        lockFile,
        processIsAlive: () => false,
        timeoutMs: 100,
        pollMs: 1,
      });
      releaseStale();

      const livePayload = JSON.stringify({ pid: 42, token: 'b'.repeat(32) });
      writeFileSync(lockFile, livePayload);
      await expect(
        acquireBuildLock({ lockFile, processIsAlive: () => true, timeoutMs: 20, pollMs: 1 }),
      ).rejects.toThrow('Timed out');
      expect(readFileSync(lockFile, 'utf8')).toBe(livePayload);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('closes and removes its unpublished candidate when writing fails', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'contentos-build-lock-write-test-'));
    const lockFile = join(directory, 'build.lock');
    try {
      await expect(
        acquireBuildLock({
          lockFile,
          timeoutMs: 20,
          writeCandidate: () => {
            throw new Error('injected candidate write failure');
          },
        }),
      ).rejects.toThrow('injected candidate write failure');
      expect(() => readFileSync(lockFile)).toThrow();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
