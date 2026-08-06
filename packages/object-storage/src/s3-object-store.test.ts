import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { verifyIntegrityResponse } from './s3-object-store.js';

function body(
  chunks: readonly Uint8Array[],
  onRead: () => void,
  onDestroy: () => void,
): AsyncIterable<Uint8Array> & {
  destroy(): void;
} {
  return {
    async *[Symbol.asyncIterator]() {
      onRead();
      for (const chunk of chunks) yield chunk;
    },
    destroy: onDestroy,
  };
}

function expected(bytes: Uint8Array, byteSize = bytes.byteLength) {
  return {
    storageKey: 'fetcher/url-capture/task/1/raw/snapshot',
    sha256: createHash('sha256').update(bytes).digest('hex'),
    byteSize,
    contentType: 'text/html',
  };
}

describe('bounded S3 integrity response verification', () => {
  it('streams an exact object and verifies its digest', async () => {
    const bytes = new TextEncoder().encode('bounded evidence');
    let reads = 0;
    let destroys = 0;
    await expect(
      verifyIntegrityResponse(
        {
          body: body(
            [bytes.subarray(0, 4), bytes.subarray(4)],
            () => (reads += 1),
            () => (destroys += 1),
          ),
          contentLength: bytes.byteLength,
          contentType: 'text/html',
          metadata: { sha256: expected(bytes).sha256, bytesize: String(bytes.byteLength) },
        },
        expected(bytes),
      ),
    ).resolves.toBe(true);
    expect({ reads, destroys }).toEqual({ reads: 1, destroys: 0 });
  });

  it('rejects a Content-Length mismatch before reading the body', async () => {
    const bytes = new TextEncoder().encode('bounded evidence');
    let reads = 0;
    let destroys = 0;
    await expect(
      verifyIntegrityResponse(
        {
          body: body(
            [bytes],
            () => (reads += 1),
            () => (destroys += 1),
          ),
          contentLength: bytes.byteLength + 1,
          contentType: 'text/html',
          metadata: { sha256: expected(bytes).sha256, bytesize: String(bytes.byteLength) },
        },
        expected(bytes),
      ),
    ).resolves.toBe(false);
    expect({ reads, destroys }).toEqual({ reads: 0, destroys: 1 });
  });

  it('aborts when streamed bytes exceed the exact expected bound', async () => {
    const expectedBytes = new TextEncoder().encode('abc');
    const oversizedBytes = new TextEncoder().encode('abcd');
    let destroys = 0;
    await expect(
      verifyIntegrityResponse(
        {
          body: body(
            [oversizedBytes],
            () => undefined,
            () => (destroys += 1),
          ),
          contentLength: expectedBytes.byteLength,
          contentType: 'text/html',
          metadata: { sha256: expected(expectedBytes).sha256, bytesize: String(expectedBytes.byteLength) },
        },
        expected(expectedBytes),
      ),
    ).resolves.toBe(false);
    expect(destroys).toBe(1);
  });

  it('rejects an expected size above the fixed 2 MiB bound before reading', async () => {
    const bytes = new Uint8Array([1]);
    let reads = 0;
    let destroys = 0;
    await expect(
      verifyIntegrityResponse(
        {
          body: body(
            [bytes],
            () => (reads += 1),
            () => (destroys += 1),
          ),
          contentLength: 2_097_153,
          contentType: 'text/html',
          metadata: { sha256: expected(bytes).sha256, bytesize: '2097153' },
        },
        expected(bytes, 2_097_153),
      ),
    ).resolves.toBe(false);
    expect({ reads, destroys }).toEqual({ reads: 0, destroys: 1 });
  });
});
