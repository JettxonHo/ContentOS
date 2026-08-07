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

  it('reads the authoritative Workflow projection through the same credentialed client boundary', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ data: { workflow: null } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const client = new ContentOsApiClient('http://127.0.0.1:3001', fetcher);
    const abort = new AbortController();
    await expect(client.workflow('00000000-0000-4000-8000-000000000001', abort.signal)).resolves.toEqual({
      data: { workflow: null },
    });
    expect(fetcher).toHaveBeenCalledWith(
      'http://127.0.0.1:3001/v1/content-packages/00000000-0000-4000-8000-000000000001/workflow',
      expect.objectContaining({
        credentials: 'include',
        headers: { accept: 'application/json' },
        signal: abort.signal,
      }),
    );
  });

  it('preserves caller idempotency headers and leaves multipart boundaries to the browser', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(
        async () => new Response(JSON.stringify({ data: { urlCaptureRequest: {} } }), { status: 201 }),
      );
    const client = new ContentOsApiClient('http://127.0.0.1:3001', fetcher);
    await client.submitUrlCapture(
      '00000000-0000-4000-8000-000000000001',
      { expectedPackageRevision: 1, role: 'primary', submittedUrl: 'https://example.test/article' },
      'browser-generated-key',
    );
    expect(fetcher).toHaveBeenLastCalledWith(
      'http://127.0.0.1:3001/v1/content-packages/00000000-0000-4000-8000-000000000001/url-capture-requests',
      expect.objectContaining({
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'idempotency-key': 'browser-generated-key',
        },
      }),
    );

    const form = new FormData();
    form.append('role', 'supporting');
    form.append('file', new Blob(['text']), 'notes.md');
    await client.uploadSource('00000000-0000-4000-8000-000000000001', form);
    const options = fetcher.mock.calls.at(-1)?.[1] as RequestInit;
    expect(options.headers).toEqual({ accept: 'application/json' });
  });

  it('uses encoded Source review paths and the bounded Timeline cursor', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(
        async () =>
          new Response(JSON.stringify({ data: {} }), { status: 200, headers: { 'content-type': 'application/json' } }),
      );
    const client = new ContentOsApiClient('http://127.0.0.1:3001', fetcher);
    await client.getSource('package / id', 'source / id');
    await client.getWorkingCopy('package / id', 'source / id');
    await client.editWorkingCopy('package / id', 'source / id', { expectedRevision: 2, body: { text: 'Review text' } });
    await client.createVersion('package / id', 'source / id', { expectedRevision: 2 });
    await client.listVersions('package / id', 'source / id');
    await client.getVersion('package / id', 'source / id', 'version / id');
    await client.approveVersion('package / id', 'source / id', { versionId: 'version / id' });
    await client.workflowTimeline('package / id', 4);
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      'http://127.0.0.1:3001/v1/content-packages/package%20%2F%20id/sources/source%20%2F%20id',
      'http://127.0.0.1:3001/v1/content-packages/package%20%2F%20id/sources/source%20%2F%20id/working-copy',
      'http://127.0.0.1:3001/v1/content-packages/package%20%2F%20id/sources/source%20%2F%20id/working-copy',
      'http://127.0.0.1:3001/v1/content-packages/package%20%2F%20id/sources/source%20%2F%20id/versions',
      'http://127.0.0.1:3001/v1/content-packages/package%20%2F%20id/sources/source%20%2F%20id/versions',
      'http://127.0.0.1:3001/v1/content-packages/package%20%2F%20id/sources/source%20%2F%20id/versions/version%20%2F%20id',
      'http://127.0.0.1:3001/v1/content-packages/package%20%2F%20id/sources/source%20%2F%20id/approval',
      'http://127.0.0.1:3001/v1/content-packages/package%20%2F%20id/workflow/events?after=4&limit=20',
    ]);
    expect(fetcher.mock.calls[2]?.[1]).toEqual(
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ expectedRevision: 2, body: { text: 'Review text' } }),
      }),
    );
    expect(fetcher.mock.calls[3]?.[1]).toEqual(
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ expectedRevision: 2 }) }),
    );
    expect(fetcher.mock.calls[6]?.[1]).toEqual(
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ versionId: 'version / id' }) }),
    );
  });
});
