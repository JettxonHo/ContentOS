import { describe, expect, it } from 'vitest';

import { requireState } from './env.js';
import { run } from './process.js';

describe('api smoke', () => {
  it('supports the harness-only assertion failure injection for cleanup verification', () => {
    if (process.env.CONTENTOS_SMOKE_INJECT_FAILURE === '1') {
      throw new Error('Injected integration assertion failure for cleanup verification.');
    }
  });

  it('GET /health/live returns the exact liveness contract over loopback', async () => {
    const state = requireState();
    const response = await fetch(`${state.apiOrigin}/health/live`);

    expect(response.ok).toBe(true);
    expect(await response.json()).toEqual({ status: 'ok', service: 'api' });
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('x-frame-options')).toBe('SAMEORIGIN');
  });

  it('publishes authentication, Content Package, and complete Source contracts as OpenAPI JSON without a documentation UI dependency', async () => {
    const state = requireState();
    const response = await fetch(`${state.apiOrigin}/openapi.json`);
    expect(response.status).toBe(200);
    const document = (await response.json()) as {
      paths?: Record<
        string,
        Record<
          string,
          {
            responses?: Record<string, { content?: Record<string, unknown> }>;
            parameters?: Array<{
              name?: string;
              in?: string;
              required?: boolean;
              schema?: { type?: string; default?: number; minimum?: number; maximum?: number };
            }>;
            requestBody?: unknown;
            security?: Array<Record<string, unknown>>;
          }
        >
      >;
      components?: { securitySchemes?: Record<string, unknown> };
    };
    expect(Object.keys(document.paths ?? {})).toEqual(
      expect.arrayContaining([
        '/v1/auth/login',
        '/v1/auth/session',
        '/v1/auth/logout',
        '/v1/content-packages',
        '/v1/content-packages/{id}',
        '/v1/content-packages/{id}/archive',
        '/v1/content-packages/{packageId}/sources',
        '/v1/content-packages/{packageId}/sources/{sourceId}',
        '/v1/content-packages/{packageId}/sources/{sourceId}/working-copy',
        '/v1/content-packages/{packageId}/sources/{sourceId}/versions',
        '/v1/content-packages/{packageId}/sources/{sourceId}/versions/{versionId}',
        '/v1/content-packages/{packageId}/sources/{sourceId}/approval',
        '/v1/content-packages/{packageId}/url-capture-requests',
        '/v1/content-packages/{packageId}/workflow',
        '/v1/content-packages/{packageId}/workflow/events',
        '/v1/content-packages/{packageId}/workflow/stream',
        '/v1/content-packages/{packageId}/research',
        '/v1/content-packages/{packageId}/research/generations',
        '/v1/content-packages/{packageId}/research/working-copy',
        '/v1/content-packages/{packageId}/research/versions',
        '/v1/content-packages/{packageId}/research/approval',
      ]),
    );
    expect(document.components?.securitySchemes).toHaveProperty('contentos_session');
    const sourcePaths = document.paths ?? {};
    expect(document.paths).not.toHaveProperty('/internal/fetcher/tasks/{taskId}/claim');
    expect(document.paths).not.toHaveProperty('/internal/fetcher/tasks/{taskId}/heartbeat');
    const expectedSourceResponses = [
      ['/v1/content-packages/{packageId}/sources', 'post', ['201', '400', '401', '403', '404', '409', '422', '500']],
      ['/v1/content-packages/{packageId}/sources', 'get', ['200', '401', '404', '409', '422']],
      ['/v1/content-packages/{packageId}/sources/{sourceId}', 'get', ['200', '401', '404', '409', '422']],
      ['/v1/content-packages/{packageId}/sources/{sourceId}/working-copy', 'get', ['200', '401', '404', '409', '422']],
      [
        '/v1/content-packages/{packageId}/sources/{sourceId}/working-copy',
        'patch',
        ['200', '400', '401', '403', '404', '409', '422'],
      ],
      [
        '/v1/content-packages/{packageId}/sources/{sourceId}/versions',
        'post',
        ['201', '400', '401', '403', '404', '409', '422'],
      ],
      ['/v1/content-packages/{packageId}/sources/{sourceId}/versions', 'get', ['200', '401', '404', '409', '422']],
      [
        '/v1/content-packages/{packageId}/sources/{sourceId}/versions/{versionId}',
        'get',
        ['200', '401', '404', '409', '422'],
      ],
      [
        '/v1/content-packages/{packageId}/sources/{sourceId}/approval',
        'post',
        ['200', '400', '401', '403', '404', '409', '422'],
      ],
    ] as const;
    for (const [pathName, method, expectedStatuses] of expectedSourceResponses) {
      const responses = sourcePaths[pathName]?.[method]?.responses ?? {};
      expect(Object.keys(responses).sort()).toEqual([...expectedStatuses].sort());
    }
    const expectedResearchResponses = [
      ['/v1/content-packages/{packageId}/research', 'get', ['200', '401', '404', '409', '422', '500']],
      [
        '/v1/content-packages/{packageId}/research/generations',
        'post',
        ['201', '401', '404', '409', '422', '500', '502'],
      ],
      ['/v1/content-packages/{packageId}/research/working-copy', 'patch', ['200', '401', '404', '409', '422', '500']],
      ['/v1/content-packages/{packageId}/research/versions', 'post', ['201', '401', '404', '409', '422', '500']],
      ['/v1/content-packages/{packageId}/research/approval', 'post', ['201', '401', '404', '409', '422', '500']],
    ] as const;
    for (const [pathName, method, expectedStatuses] of expectedResearchResponses) {
      const responses = sourcePaths[pathName]?.[method]?.responses ?? {};
      expect(Object.keys(responses).sort()).toEqual([...expectedStatuses].sort());
      expect(sourcePaths[pathName]?.[method]?.security).toEqual([{ contentos_session: [] }]);
    }
    const researchSuccess = JSON.stringify(
      sourcePaths['/v1/content-packages/{packageId}/research']?.get?.responses?.['200']?.content?.['application/json'],
    );
    expect(researchSuccess).toMatch(/workingCopy.*latestVersion.*approvedVersionId.*outdated/);
    expect(researchSuccess).not.toMatch(/rawOutput|providerAlias|safeErrorCode/i);
    const urlCaptureResponses =
      sourcePaths['/v1/content-packages/{packageId}/url-capture-requests']?.post?.responses ?? {};
    expect(Object.keys(urlCaptureResponses).sort()).toEqual(['201', '401', '404', '409', '422']);
    const urlCaptureIntake = sourcePaths['/v1/content-packages/{packageId}/url-capture-requests']?.get;
    expect(Object.keys(urlCaptureIntake?.responses ?? {}).sort()).toEqual(['200', '401', '404', '422', '500']);
    expect(urlCaptureIntake?.security).toEqual([{ contentos_session: [] }]);
    expect(urlCaptureIntake?.requestBody).toBeUndefined();
    expect(urlCaptureIntake?.parameters?.filter((parameter) => parameter.in === 'query') ?? []).toEqual([]);
    const intakeSuccessContract = JSON.stringify(urlCaptureIntake?.responses?.['200']?.content?.['application/json']);
    for (const stateName of ['queued', 'running', 'failed', 'succeeded'])
      expect(intakeSuccessContract).toContain(stateName);
    expect(intakeSuccessContract).not.toMatch(/taskId|claim|lease|attempt|outbox|objectKey|storageKey/i);
    for (const pathName of [
      '/v1/content-packages/{packageId}/workflow',
      '/v1/content-packages/{packageId}/workflow/events',
    ]) {
      const responses = sourcePaths[pathName]?.get?.responses ?? {};
      expect(Object.keys(responses).sort()).toEqual(['200', '401', '404', '422', '500']);
    }
    const stream = sourcePaths['/v1/content-packages/{packageId}/workflow/stream'];
    expect(Object.keys(stream ?? {})).toEqual(['get']);
    expect(Object.keys(stream?.get?.responses ?? {}).sort()).toEqual(['200', '401', '404', '422', '500']);
    expect(stream?.get?.security).toEqual([{ contentos_session: [] }]);
    expect(stream?.get?.requestBody).toBeUndefined();
    expect(stream?.get?.parameters?.filter((parameter) => parameter.in === 'query') ?? []).toEqual([]);
    expect(stream?.get?.responses?.['200']?.content).toEqual({
      'text/event-stream': { schema: { type: 'string' } },
    });
    for (const status of ['401', '404', '422', '500']) {
      expect(Object.keys(stream?.get?.responses?.[status]?.content ?? {})).toEqual(['application/json']);
    }
    const timelineParameters = sourcePaths['/v1/content-packages/{packageId}/workflow/events']?.get?.parameters ?? [];
    expect(timelineParameters).toEqual(
      expect.arrayContaining([
        {
          name: 'after',
          in: 'query',
          required: false,
          schema: { type: 'integer', default: 0, minimum: 0, maximum: 2_147_483_647 },
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: { type: 'integer', default: 20, minimum: 1, maximum: 50 },
        },
      ]),
    );
  });

  it('fails startup on invalid secret configuration without reflecting secret values', async () => {
    const state = requireState();
    const marker = 'configuration-secret-must-not-appear';
    const startup = await run(process.execPath, [`${state.repoRoot}/apps/api/dist/main.js`], {
      cwd: `${state.repoRoot}/apps/api`,
      env: {
        ...process.env,
        API_HOST: '127.0.0.1',
        API_PORT: '3001',
        CONTENTOS_ENV: 'test',
        CONTENTOS_OWNER_PASSWORD_HASH: marker,
        CONTENTOS_OWNER_USER_ID: '00000000-0000-4000-8000-000000000001',
        CONTENTOS_WEB_ORIGIN: state.webOrigin,
        CONTENTOS_OBJECT_STORAGE_ENDPOINT: 'http://127.0.0.1:8333',
        CONTENTOS_OBJECT_STORAGE_BUCKET: 'contentos-test-bucket',
        DATABASE_URL: `postgresql://owner:${marker}@127.0.0.1:5432/contentos`,
      },
      timeoutMs: 10_000,
    });
    expect(startup.ok).toBe(false);
    expect(startup.stderr).toContain('CONTENTOS_OWNER_PASSWORD_HASH');
    expect(startup.stderr).not.toContain(marker);
  });
});
