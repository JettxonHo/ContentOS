import { createHash } from 'node:crypto';

import { PublicUrlTransportError, type VerifiedFetchResponse } from '../public-url-transport/index.js';
import { describe, expect, it } from 'vitest';

import { createFetcherCapturePreparer } from './index.js';

const taskId = '00000000-0000-4000-8000-000000000101';
const snapshotId = '00000000-0000-4000-8000-000000000102';

function response(input: {
  readonly encoded: Uint8Array;
  readonly decoded: Uint8Array | readonly Uint8Array[];
  readonly contentType: VerifiedFetchResponse['contentType'];
  readonly declaredCharset?: string | null;
  readonly contentEncoding?: VerifiedFetchResponse['contentEncoding'];
  readonly remainingMs?: () => number;
  readonly consumeFailure?: PublicUrlTransportError;
}): VerifiedFetchResponse {
  const controller = new AbortController();
  return {
    budget: {
      startedAtMonotonicMs: 10,
      absoluteDeadlineMonotonicMs: 30_010,
      signal: controller.signal,
      remainingMs: input.remainingMs ?? (() => 30_000),
    },
    finalUrl: 'https://fixture.test/final',
    redirects: [],
    responseStatus: 200,
    contentType: input.contentType,
    declaredCharset: input.declaredCharset ?? null,
    contentEncoding: input.contentEncoding ?? 'identity',
    consume: async (sinks) => {
      if (input.consumeFailure !== undefined) {
        controller.abort(input.consumeFailure);
        throw input.consumeFailure;
      }
      await sinks.onEncoded(input.encoded);
      const decodedChunks = Array.isArray(input.decoded) ? input.decoded : [input.decoded];
      for (const chunk of decodedChunks) await sinks.onDecoded(chunk);
      return {
        encodedByteSize: input.encoded.byteLength,
        decodedByteSize: decodedChunks.reduce((total, chunk) => total + chunk.byteLength, 0),
      };
    },
    dispose: () => undefined,
  };
}

describe('Fetcher capture preparation', () => {
  it('keeps encoded snapshot bytes distinct from decoded review text', async () => {
    const encoded = new TextEncoder().encode('compressed-body');
    const decoded = new TextEncoder().encode('A review candidate.');
    const writes: Uint8Array[] = [];
    const preparer = createFetcherCapturePreparer({
      snapshots: {
        putImmutable: async (input) => {
          writes.push(input.bytes);
          return {
            storageKey: `fetcher/url-capture/${input.taskId}/${input.attemptNumber}/raw/${input.snapshotId}`,
            sha256: createHash('sha256').update(input.bytes).digest('hex'),
            byteSize: input.bytes.byteLength,
            contentType: input.contentType,
          };
        },
        readForIntegrity: async () => true,
        deleteForCompensation: async () => undefined,
      },
      snapshotIds: { generate: () => snapshotId },
    });

    await expect(
      preparer.prepare({
        taskId,
        attemptNumber: 1,
        response: response({ encoded, decoded, contentType: 'text/plain', contentEncoding: 'gzip' }),
      }),
    ).resolves.toEqual({
      resultVersion: 'fetcher-result/v1',
      attemptNumber: 1,
      outcome: 'succeeded',
      snapshot: {
        snapshotId,
        storageKey: `fetcher/url-capture/${taskId}/1/raw/${snapshotId}`,
        sha256: createHash('sha256').update(encoded).digest('hex'),
        byteSize: encoded.byteLength,
        contentType: 'text/plain',
        contentEncoding: 'gzip',
      },
      capture: {
        finalUrl: 'https://fixture.test/final',
        redirects: [],
        responseStatus: 200,
        encodedByteSize: encoded.byteLength,
        decodedByteSize: decoded.byteLength,
      },
      candidate: { schemaVersion: 'source/normalized/v1', text: 'A review candidate.' },
    });
    expect(writes).toEqual([encoded]);
  });

  it('uses strict UTF-8 across decoded chunks and normalizes literal Markdown line endings', async () => {
    const encoded = new TextEncoder().encode('encoded bytes');
    const decoded = new TextEncoder().encode('# caf\u00e9\r\n\rbody');
    const preparer = createFetcherCapturePreparer({
      snapshots: successfulSnapshots(),
      snapshotIds: { generate: () => snapshotId },
    });

    const result = await preparer.prepare({
      taskId,
      attemptNumber: 1,
      response: response({
        encoded,
        decoded: [decoded.subarray(0, 6), decoded.subarray(6, 7), decoded.subarray(7)],
        contentType: 'text/markdown',
      }),
    });

    expect(result).toMatchObject({
      outcome: 'succeeded',
      candidate: { schemaVersion: 'source/normalized/v1', text: '# caf\u00e9\n\nbody' },
    });
  });

  it.each([null, 'utf-8', 'UTF8', ' "utf-8" '] as const)(
    'accepts the approved charset form %s and omits one leading BOM from the Candidate',
    async (declaredCharset) => {
      const preparer = createFetcherCapturePreparer({
        snapshots: successfulSnapshots(),
        snapshotIds: { generate: () => snapshotId },
      });

      await expect(
        preparer.prepare({
          taskId,
          attemptNumber: 1,
          response: response({
            encoded: new TextEncoder().encode('raw'),
            decoded: new TextEncoder().encode('\ufeffreview text'),
            contentType: 'text/plain',
            declaredCharset,
          }),
        }),
      ).resolves.toMatchObject({ outcome: 'succeeded', candidate: { text: 'review text' } });
    },
  );

  it('recovers malformed HTML while preserving block order and suppressing the fixed inert subtree set', async () => {
    const preparer = createFetcherCapturePreparer({
      snapshots: successfulSnapshots(),
      snapshotIds: { generate: () => snapshotId },
    });

    const result = await preparer.prepare({
      taskId,
      attemptNumber: 1,
      response: response({
        encoded: new TextEncoder().encode('raw'),
        decoded: new TextEncoder().encode(
          '<h1> Heading <p>First <b>line</b><script>script</script><style>style</style>' +
            '<noscript>noscript</noscript><template>template</template><iframe>iframe</iframe>' +
            '<object>object</object><embed src="ignored"><svg>svg</svg><canvas>canvas</canvas>' +
            '<section>Second   phrase<br>third</section>',
        ),
        contentType: 'text/html',
      }),
    });

    expect(result).toMatchObject({
      outcome: 'succeeded',
      candidate: { text: 'Heading\nFirst line\nSecond phrase\nthird' },
    });
  });

  it.each([
    {
      label: 'a declared non-UTF-8 charset',
      input: response({
        encoded: new TextEncoder().encode('raw'),
        decoded: new TextEncoder().encode('text'),
        contentType: 'text/plain',
        declaredCharset: 'iso-8859-1',
      }),
      category: 'unsupported_content',
    },
    {
      label: 'invalid UTF-8 after the final decoder flush',
      input: response({
        encoded: new Uint8Array([1, 2]),
        decoded: new Uint8Array([0xc3]),
        contentType: 'text/plain',
      }),
      category: 'unsupported_content',
    },
    {
      label: 'invalid UTF-8 split across decoded chunks',
      input: response({
        encoded: new Uint8Array([1, 2]),
        decoded: [new Uint8Array([0xe2]), new Uint8Array([0x28, 0xa1])],
        contentType: 'text/plain',
      }),
      category: 'unsupported_content',
    },
    {
      label: 'blank extracted text',
      input: response({
        encoded: new TextEncoder().encode('raw'),
        decoded: new TextEncoder().encode(' \r\n\t '),
        contentType: 'text/plain',
      }),
      category: 'extraction_failed',
    },
  ])('returns $category for $label without a snapshot write', async ({ input, category }) => {
    let writes = 0;
    const preparer = createFetcherCapturePreparer({
      snapshots: {
        ...successfulSnapshots(),
        putImmutable: async () => {
          writes += 1;
          throw new Error('not reached');
        },
      },
      snapshotIds: { generate: () => snapshotId },
    });

    await expect(preparer.prepare({ taskId, attemptNumber: 1, response: input })).resolves.toMatchObject({
      outcome: 'failed',
      category,
    });
    expect(writes).toBe(0);
  });

  it.each([
    { label: 'embedded NUL', text: 'before\u0000after', category: 'extraction_failed', expectedWrites: 0 },
    { label: 'exact 100,000-byte Candidate', text: 'a'.repeat(100_000), category: null, expectedWrites: 1 },
    { label: '100,001-byte Candidate', text: 'a'.repeat(100_001), category: 'too_large', expectedWrites: 0 },
  ] as const)('enforces the Candidate boundary for $label', async ({ text, category, expectedWrites }) => {
    let writes = 0;
    const preparer = createFetcherCapturePreparer({
      snapshots: {
        ...successfulSnapshots(),
        putImmutable: async (input) => {
          writes += 1;
          return successfulStoredObject(input);
        },
      },
      snapshotIds: { generate: () => snapshotId },
    });

    const result = await preparer.prepare({
      taskId,
      attemptNumber: 1,
      response: response({
        encoded: new TextEncoder().encode('raw'),
        decoded: new TextEncoder().encode(text),
        contentType: 'text/plain',
      }),
    });

    expect(result).toMatchObject(category === null ? { outcome: 'succeeded' } : { outcome: 'failed', category });
    expect(writes).toBe(expectedWrites);
  });

  it.each(['too_large', 'fetch_failed', 'unsupported_content', 'timeout'] as const)(
    'preserves the typed %s failure when consume aborts the inherited signal',
    async (category) => {
      const preparer = createFetcherCapturePreparer({
        snapshots: successfulSnapshots(),
        snapshotIds: { generate: () => snapshotId },
      });

      await expect(
        preparer.prepare({
          taskId,
          attemptNumber: 1,
          response: response({
            encoded: new Uint8Array([1]),
            decoded: new Uint8Array([1]),
            contentType: 'text/plain',
            consumeFailure: new PublicUrlTransportError(category),
          }),
        }),
      ).resolves.toMatchObject({ outcome: 'failed', category });
    },
  );

  it('compensates only the created Task/Attempt snapshot after failed read-back', async () => {
    const deleted: unknown[] = [];
    const preparer = createFetcherCapturePreparer({
      snapshots: {
        ...successfulSnapshots(),
        readForIntegrity: async () => false,
        deleteForCompensation: async (input) => void deleted.push(input),
      },
      snapshotIds: { generate: () => snapshotId },
    });

    await expect(
      preparer.prepare({
        taskId,
        attemptNumber: 4,
        response: response({
          encoded: new TextEncoder().encode('raw'),
          decoded: new TextEncoder().encode('review text'),
          contentType: 'text/plain',
        }),
      }),
    ).resolves.toMatchObject({ outcome: 'failed', category: 'fetch_failed' });
    expect(deleted).toEqual([expect.objectContaining({ taskId, attemptNumber: 4, snapshotId })]);
  });

  it('maps a compensation failure to one safe fetch_failed Result', async () => {
    const preparer = createFetcherCapturePreparer({
      snapshots: {
        ...successfulSnapshots(),
        readForIntegrity: async () => false,
        deleteForCompensation: async () => {
          throw new Error('private provider detail');
        },
      },
      snapshotIds: { generate: () => snapshotId },
    });

    await expect(
      preparer.prepare({
        taskId,
        attemptNumber: 1,
        response: response({
          encoded: new TextEncoder().encode('raw'),
          decoded: new TextEncoder().encode('review text'),
          contentType: 'text/plain',
        }),
      }),
    ).resolves.toEqual({
      resultVersion: 'fetcher-result/v1',
      attemptNumber: 1,
      outcome: 'failed',
      category: 'fetch_failed',
      code: 'FETCH_FAILED',
    });
  });

  it('cannot return success after its inherited budget expires', async () => {
    const preparer = createFetcherCapturePreparer({
      snapshots: successfulSnapshots(),
      snapshotIds: { generate: () => snapshotId },
    });

    await expect(
      preparer.prepare({
        taskId,
        attemptNumber: 1,
        response: response({
          encoded: new TextEncoder().encode('raw'),
          decoded: new TextEncoder().encode('review text'),
          contentType: 'text/plain',
          remainingMs: () => 0,
        }),
      }),
    ).resolves.toMatchObject({ outcome: 'failed', category: 'timeout' });
  });

  it.each([
    { label: 'after the synchronous parse', deadlineCheck: 6, expectedWrites: 0, expectedReads: 0 },
    { label: 'after the immutable write', deadlineCheck: 7, expectedWrites: 1, expectedReads: 0 },
    { label: 'after read-back verification', deadlineCheck: 8, expectedWrites: 1, expectedReads: 1 },
  ])('cannot return success when its inherited budget expires $label', async (expectation) => {
    let checks = 0;
    let writes = 0;
    let reads = 0;
    const preparer = createFetcherCapturePreparer({
      snapshots: {
        ...successfulSnapshots(),
        putImmutable: async (input) => {
          writes += 1;
          return successfulStoredObject(input);
        },
        readForIntegrity: async () => {
          reads += 1;
          return true;
        },
      },
      snapshotIds: { generate: () => snapshotId },
    });

    await expect(
      preparer.prepare({
        taskId,
        attemptNumber: 1,
        response: response({
          encoded: new TextEncoder().encode('raw'),
          decoded: new TextEncoder().encode('<p>review text</p>'),
          contentType: 'text/html',
          remainingMs: () => {
            checks += 1;
            return checks >= expectation.deadlineCheck ? 0 : 1;
          },
        }),
      }),
    ).resolves.toMatchObject({ outcome: 'failed', category: 'timeout' });
    expect({ writes, reads }).toEqual({ writes: expectation.expectedWrites, reads: expectation.expectedReads });
  });
});

function successfulSnapshots() {
  return {
    putImmutable: async (input: {
      readonly taskId: string;
      readonly attemptNumber: number;
      readonly snapshotId: string;
      readonly bytes: Uint8Array;
      readonly contentType: VerifiedFetchResponse['contentType'];
    }) => successfulStoredObject(input),
    readForIntegrity: async () => true,
    deleteForCompensation: async () => undefined,
  };
}

function successfulStoredObject(input: {
  readonly taskId: string;
  readonly attemptNumber: number;
  readonly snapshotId: string;
  readonly bytes: Uint8Array;
  readonly contentType: VerifiedFetchResponse['contentType'];
}) {
  return {
    storageKey: `fetcher/url-capture/${input.taskId}/${input.attemptNumber}/raw/${input.snapshotId}`,
    sha256: createHash('sha256').update(input.bytes).digest('hex'),
    byteSize: input.bytes.byteLength,
    contentType: input.contentType,
  };
}
