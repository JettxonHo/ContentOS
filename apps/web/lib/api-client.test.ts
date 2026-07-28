import { describe, expect, it, vi } from 'vitest';

import { ContentOsApiClient } from './api-client';
import type { WebApiError } from './api-client';

describe('ContentOsApiClient', () => {
  it('always uses cookie credentials and JSON for a mutation', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ data: { contentPackage: { id: 'package-id' } } }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const client = new ContentOsApiClient('http://127.0.0.1:3001', fetcher);
    await client.create({ title: 'Package', requestedOutputs: ['blog'] });
    expect(fetcher).toHaveBeenCalledWith(
      'http://127.0.0.1:3001/v1/content-packages',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
      }),
    );
  });

  it('maps the common API envelope without exposing response details', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'REVISION_CONFLICT', message: 'private detail' } }), {
        status: 409,
      }),
    );
    const client = new ContentOsApiClient('http://127.0.0.1:3001', fetcher);
    await expect(client.update('package-id', { expectedRevision: 1, title: 'Stale' })).rejects.toEqual(
      expect.objectContaining<WebApiError>({ status: 409, code: 'REVISION_CONFLICT' }),
    );
  });

  it('normalizes network failures to a safe error', async () => {
    const client = new ContentOsApiClient(
      'http://127.0.0.1:3001',
      vi.fn<typeof fetch>().mockRejectedValue(new Error('sensitive network detail')),
    );
    await expect(client.session()).rejects.toEqual(
      expect.objectContaining<WebApiError>({ status: 0, code: 'NETWORK_ERROR' }),
    );
  });
});
