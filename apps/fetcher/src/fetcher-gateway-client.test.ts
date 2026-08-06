import { createServer } from 'node:http';
import { once } from 'node:events';

import { afterEach, describe, expect, it } from 'vitest';

import type { FetcherResultSubmission } from '@contentos/core';

import {
  FetcherGatewayClientError,
  NodeFetcherGatewayClient,
  type GatewayRequester,
} from './fetcher-gateway-client.js';

const taskId = '00000000-0000-4000-8000-000000000001';
const claim = 'A'.repeat(43);
const originalProxyEnvironment = {
  HTTP_PROXY: process.env.HTTP_PROXY,
  HTTPS_PROXY: process.env.HTTPS_PROXY,
  NO_PROXY: process.env.NO_PROXY,
  NODE_USE_ENV_PROXY: process.env.NODE_USE_ENV_PROXY,
};

const failed: FetcherResultSubmission = {
  resultVersion: 'fetcher-result/v1',
  attemptNumber: 1,
  outcome: 'failed',
  category: 'fetch_failed',
  code: 'FETCH_FAILED',
};

const succeeded: FetcherResultSubmission = {
  resultVersion: 'fetcher-result/v1',
  attemptNumber: 1,
  outcome: 'succeeded',
  snapshot: {
    snapshotId: '00000000-0000-4000-8000-000000000002',
    storageKey: `fetcher/url-capture/${taskId}/1/raw/00000000-0000-4000-8000-000000000002`,
    sha256: 'a'.repeat(64),
    byteSize: 1,
    contentType: 'text/plain',
    contentEncoding: 'identity',
  },
  capture: {
    finalUrl: 'https://example.test/article',
    redirects: [],
    responseStatus: 200,
    encodedByteSize: 1,
    decodedByteSize: 1,
  },
  candidate: { schemaVersion: 'source/normalized/v1', text: 'candidate' },
};

function json(value: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(value));
}

afterEach(() => {
  for (const [key, value] of Object.entries(originalProxyEnvironment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe('Fetcher Gateway client', () => {
  it('sends the exact private Claim request and validates its flat response', async () => {
    let observed: Parameters<GatewayRequester>[0] | undefined;
    const client = new NodeFetcherGatewayClient('http://127.0.0.1:3001', 'S'.repeat(43), async (input) => {
      observed = input;
      return {
        statusCode: 200,
        body: json({
          data: {
            taskId,
            taskKind: 'url_capture',
            submittedUrl: 'https://example.test/article',
            connectionPolicyVersion: 'public-url-connection/v1',
            resourcePolicyVersion: 'public-url-resource/v1',
            attemptNumber: 1,
            leaseExpiresAt: '2026-08-06T00:01:00.000Z',
            claim,
          },
        }),
      };
    });

    await expect(client.claim(taskId, 2)).resolves.toMatchObject({ kind: 'claimed' });
    expect(observed).toMatchObject({
      method: 'POST',
      body: undefined,
      timeoutMs: 5_000,
      headers: {
        'x-contentos-fetcher-gateway-secret': 'S'.repeat(43),
        'x-contentos-fetcher-delivery-generation': '2',
      },
    });
    expect(observed?.url.pathname).toBe(`/internal/fetcher/tasks/${taskId}/claim`);
  });

  it('accepts only the route-specific stable conflict code', async () => {
    const client = new NodeFetcherGatewayClient('http://127.0.0.1:3001', 'S'.repeat(43), async () => ({
      statusCode: 409,
      body: json({ error: { code: 'FETCHER_TASK_UNAVAILABLE' } }),
    }));
    await expect(client.claim(taskId, 1)).resolves.toEqual({ kind: 'unavailable' });

    const mismatch = new NodeFetcherGatewayClient('http://127.0.0.1:3001', 'S'.repeat(43), async () => ({
      statusCode: 409,
      body: json({ error: { code: 'FETCHER_RESULT_UNAVAILABLE', detail: 'private detail' } }),
    }));
    await expect(mismatch.claim(taskId, 1)).rejects.toEqual(new FetcherGatewayClientError('protocol'));
  });

  it('validates Heartbeat task and expected attempt number', async () => {
    const valid = new NodeFetcherGatewayClient('http://127.0.0.1:3001', 'S'.repeat(43), async () => ({
      statusCode: 200,
      body: json({
        data: {
          taskId,
          attemptNumber: 2,
          leaseExpiresAt: '2026-08-06T00:01:00.000Z',
          renewed: true,
        },
      }),
    }));
    await expect(valid.heartbeat(taskId, claim, 2)).resolves.toBe('renewed');
    await expect(valid.heartbeat(taskId, claim, 1)).rejects.toEqual(new FetcherGatewayClientError('protocol'));
  });

  it('uses owned direct agents even when environment proxy variables are enabled', async () => {
    process.env.NODE_USE_ENV_PROXY = '1';
    process.env.HTTP_PROXY = 'http://127.0.0.1:1';
    process.env.HTTPS_PROXY = 'http://127.0.0.1:1';
    process.env.NO_PROXY = '';
    const server = createServer((_request, response) => {
      response.writeHead(409, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: { code: 'FETCHER_TASK_UNAVAILABLE' } }));
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    if (address === null || typeof address === 'string') throw new Error('gateway fixture did not bind');
    const client = new NodeFetcherGatewayClient(`http://127.0.0.1:${address.port}`, 'S'.repeat(43));
    try {
      await expect(client.claim(taskId, 1)).resolves.toEqual({ kind: 'unavailable' });
    } finally {
      client.close();
      server.close();
      await once(server, 'close');
    }
  });

  it('treats a malformed successful Result response as an unknown commit', async () => {
    const client = new NodeFetcherGatewayClient('http://127.0.0.1:3001', 'S'.repeat(43), async () => ({
      statusCode: 200,
      body: json({ data: { taskId } }),
    }));
    await expect(client.submitResult(taskId, claim, failed)).rejects.toEqual(
      new FetcherGatewayClientError('unknown_commit'),
    );
  });

  it('accepts only the two allowed terminal Result response shapes for a submitted success', async () => {
    const missingSource = new NodeFetcherGatewayClient('http://127.0.0.1:3001', 'S'.repeat(43), async () => ({
      statusCode: 200,
      body: json({
        data: {
          taskId,
          attemptNumber: 1,
          taskState: 'succeeded',
          resultCategory: 'success',
          sourceId: null,
          duplicate: false,
        },
      }),
    }));
    await expect(missingSource.submitResult(taskId, claim, succeeded)).rejects.toEqual(
      new FetcherGatewayClientError('unknown_commit'),
    );
  });

  it.each([
    { label: 'unparseable', body: new TextEncoder().encode('{') },
    {
      label: 'mismatched',
      body: json({
        data: {
          taskId: '00000000-0000-4000-8000-000000000099',
          attemptNumber: 1,
          taskState: 'failed',
          resultCategory: 'fetch_failed',
          sourceId: null,
          duplicate: false,
        },
      }),
    },
    { label: 'oversized', body: new Uint8Array(16 * 1024 + 1) },
  ])('preserves the unknown commit boundary for a $label HTTP 200 Result body', async ({ body }) => {
    const client = new NodeFetcherGatewayClient('http://127.0.0.1:3001', 'S'.repeat(43), async () => ({
      statusCode: 200,
      body,
    }));
    await expect(client.submitResult(taskId, claim, failed)).rejects.toEqual(
      new FetcherGatewayClientError('unknown_commit'),
    );
  });

  it('distinguishes an exact Result rejection from other definitive 4xx failures', async () => {
    const rejected = new NodeFetcherGatewayClient('http://127.0.0.1:3001', 'S'.repeat(43), async () => ({
      statusCode: 409,
      body: json({ error: { code: 'FETCHER_RESULT_UNAVAILABLE' } }),
    }));
    await expect(rejected.submitResult(taskId, claim, failed)).resolves.toEqual({ kind: 'rejected' });

    for (const statusCode of [401, 422]) {
      const client = new NodeFetcherGatewayClient('http://127.0.0.1:3001', 'S'.repeat(43), async () => ({
        statusCode,
        body: json({ error: { code: 'PRIVATE_DETAIL_MUST_NOT_ESCAPE' } }),
      }));
      await expect(client.submitResult(taskId, claim, succeeded)).rejects.toEqual(
        new FetcherGatewayClientError('protocol'),
      );
    }
  });

  it.each(['package_archived', 'source_role_limit', 'object_integrity_failed'] as const)(
    'accepts the server-derived %s Result without changing the submitted success',
    async (resultCategory) => {
      const client = new NodeFetcherGatewayClient('http://127.0.0.1:3001', 'S'.repeat(43), async () => ({
        statusCode: 200,
        body: json({
          data: {
            taskId,
            attemptNumber: 1,
            taskState: 'failed',
            resultCategory,
            sourceId: null,
            duplicate: false,
          },
        }),
      }));
      await expect(client.submitResult(taskId, claim, succeeded)).resolves.toEqual({ kind: 'accepted' });
    },
  );

  it.each([
    ['claim', 'FETCHER_TASK_UNAVAILABLE'],
    ['heartbeat', 'FETCHER_CLAIM_UNAVAILABLE'],
    ['result', 'FETCHER_RESULT_UNAVAILABLE'],
  ] as const)('rejects an oversized or mismatched %s conflict body', async (operation, expectedCode) => {
    const oversized = new NodeFetcherGatewayClient('http://127.0.0.1:3001', 'S'.repeat(43), async () => ({
      statusCode: 409,
      body: new Uint8Array(16 * 1024 + 1),
    }));
    const mismatched = new NodeFetcherGatewayClient('http://127.0.0.1:3001', 'S'.repeat(43), async () => ({
      statusCode: 409,
      body: json({ error: { code: `${expectedCode}_WRONG` } }),
    }));
    const call = (client: NodeFetcherGatewayClient): Promise<unknown> =>
      operation === 'claim'
        ? client.claim(taskId, 1)
        : operation === 'heartbeat'
          ? client.heartbeat(taskId, claim, 1)
          : client.submitResult(taskId, claim, failed);
    await expect(call(oversized)).rejects.toEqual(new FetcherGatewayClientError('protocol'));
    await expect(call(mismatched)).rejects.toEqual(new FetcherGatewayClientError('protocol'));
  });
});
