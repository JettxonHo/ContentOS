import { Ajv2020 } from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';

import {
  parseUrlCaptureRequest,
  urlCaptureIntakeCollectionResponseSchema,
  urlCaptureRequestResponseSchema,
  urlCaptureRequestSchema,
} from './url-capture-contracts.js';
import { apiErrorSchema } from './error-contract.js';

describe('URL capture API contracts', () => {
  it('strictly compiles request, safe response, and error schemas', () => {
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    expect(() =>
      [urlCaptureRequestSchema, urlCaptureRequestResponseSchema, apiErrorSchema].map((schema) => ajv.compile(schema)),
    ).not.toThrow();
  });

  it('accepts the exact request and rejects extra or missing properties', () => {
    expect(
      parseUrlCaptureRequest({
        expectedPackageRevision: 1,
        role: 'primary',
        submittedUrl: 'https://example.com/article?private=keep#section',
      }),
    ).toEqual({
      ok: true,
      value: {
        expectedPackageRevision: 1,
        role: 'primary',
        submittedUrl: 'https://example.com/article?private=keep#section',
      },
    });
    expect(parseUrlCaptureRequest({ expectedPackageRevision: 1, role: 'primary' }).ok).toBe(false);
    expect(
      parseUrlCaptureRequest({
        expectedPackageRevision: 1,
        role: 'primary',
        submittedUrl: 'https://example.com',
        idempotencyKey: 'must-be-header-only',
      }).ok,
    ).toBe(false);
  });

  it('defines a response with only safe opaque references and no submitted URL field', () => {
    const schema = JSON.stringify(urlCaptureRequestResponseSchema);
    expect(schema).not.toContain('submittedUrl');
    expect(schema).not.toContain('finalUrl');
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    const validate = ajv.compile(urlCaptureRequestResponseSchema);
    expect(
      validate({
        data: {
          urlCaptureRequest: {
            id: '00000000-0000-4000-8000-000000000001',
            contentPackageId: '00000000-0000-4000-8000-000000000002',
            sourceReferenceId: '00000000-0000-4000-8000-000000000003',
            workflowInstanceId: '00000000-0000-4000-8000-000000000004',
            workflowNodeId: '00000000-0000-4000-8000-000000000005',
            taskId: '00000000-0000-4000-8000-000000000006',
            taskState: 'queued',
            createdAt: '2026-08-01T00:00:00.000Z',
          },
        },
      }),
    ).toBe(true);
  });

  it('strictly validates empty and discriminated owner URL intake collections', () => {
    const validate = new Ajv2020({ allErrors: true, strict: true }).compile(urlCaptureIntakeCollectionResponseSchema);
    const base = {
      id: '00000000-0000-4000-8000-000000000001',
      role: 'primary',
      submittedUrl: 'https://example.test/private-article',
      createdAt: '2026-08-07T00:00:00.000Z',
      updatedAt: '2026-08-07T00:00:01.000Z',
    };
    expect(validate({ data: { items: [] } })).toBe(true);
    expect(validate({ data: { items: [{ ...base, status: 'queued', failure: null, sourceId: null }] } })).toBe(true);
    expect(validate({ data: { items: [{ ...base, status: 'running', failure: null, sourceId: null }] } })).toBe(true);
    expect(
      validate({
        data: {
          items: [{ ...base, status: 'failed', failure: { category: 'timeout', code: 'TIMEOUT' }, sourceId: null }],
        },
      }),
    ).toBe(true);
    expect(
      validate({
        data: {
          items: [
            {
              ...base,
              status: 'succeeded',
              failure: null,
              sourceId: '00000000-0000-4000-8000-000000000002',
            },
          ],
        },
      }),
    ).toBe(true);
    expect(validate({ data: { items: [{ ...base, status: 'failed', failure: null, sourceId: null }] } })).toBe(false);
    expect(
      validate({
        data: { items: [{ ...base, status: 'succeeded', failure: null, sourceId: null, taskId: 'hidden' }] },
      }),
    ).toBe(false);
  });
});
