import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { Ajv2020 } from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';

import {
  approveSourceVersionRequestSchema,
  createSourceRequestSchema,
  createSourceVersionRequestSchema,
  editSourceWorkingCopyRequestSchema,
  parseApproveSourceVersionRequest,
  parseCreateSourceRequest,
  parseCreateSourceVersionRequest,
  parseEditSourceWorkingCopyRequest,
  parseSourceListQuery,
  sourceApprovalResponseSchema,
  sourceListResponseSchema,
  sourceResponseSchema,
  sourceVersionDetailResponseSchema,
  sourceVersionListResponseSchema,
  sourceVersionResourceSchema,
  sourceVersionResponseSchema,
  sourceWorkingCopyResponseSchema,
} from './source-contracts.js';
import { apiErrorSchema } from './error-contract.js';
import type { NormalizedSourceBody } from '../source/normalized-source-body.js';

describe('source contracts', () => {
  it('strictly compiles every exported Source request, response, resource, and error schema', () => {
    const strictAjv = new Ajv2020({ allErrors: true, strict: true });
    const schemas = [
      createSourceRequestSchema,
      editSourceWorkingCopyRequestSchema,
      createSourceVersionRequestSchema,
      approveSourceVersionRequestSchema,
      sourceResponseSchema,
      sourceListResponseSchema,
      sourceWorkingCopyResponseSchema,
      sourceVersionResourceSchema,
      sourceVersionResponseSchema,
      sourceVersionDetailResponseSchema,
      sourceVersionListResponseSchema,
      sourceApprovalResponseSchema,
      apiErrorSchema,
    ];
    expect(() => schemas.map((schema) => strictAjv.compile(schema))).not.toThrow();
  });
  it('accepts a valid capture request', () => {
    const parsed = parseCreateSourceRequest({
      sourceType: 'pasted_text',
      role: 'primary',
      text: 'Some pasted text content',
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.sourceType).toBe('pasted_text');
      expect(parsed.value.role).toBe('primary');
    }
  });

  it('accepts a capture request with an optional label', () => {
    const parsed = parseCreateSourceRequest({
      sourceType: 'pasted_text',
      role: 'supporting',
      text: 'Supporting content',
      label: 'My label',
    });
    expect(parsed.ok).toBe(true);
  });

  it('rejects unknown sourceType, unknown role, missing text, or extra fields', () => {
    expect(parseCreateSourceRequest({ sourceType: 'url', role: 'primary', text: 'x' }).ok).toBe(false);
    expect(parseCreateSourceRequest({ sourceType: 'pasted_text', role: 'reference', text: 'x' }).ok).toBe(false);
    expect(parseCreateSourceRequest({ sourceType: 'pasted_text', role: 'primary' }).ok).toBe(false);
    expect(
      parseCreateSourceRequest({
        sourceType: 'pasted_text',
        role: 'primary',
        text: 'x',
        ownerUserId: '123',
      }).ok,
    ).toBe(false);
  });

  it('rejects empty text', () => {
    expect(parseCreateSourceRequest({ sourceType: 'pasted_text', role: 'primary', text: '' }).ok).toBe(false);
  });

  it('rejects NUL and lone surrogates while accepting supplementary-plane text', () => {
    for (const text of ['before\u0000after', 'lone high \ud800', 'lone low \udc00']) {
      expect(parseCreateSourceRequest({ sourceType: 'pasted_text', role: 'primary', text }).ok).toBe(false);
      expect(parseEditSourceWorkingCopyRequest({ expectedRevision: 1, body: { text } }).ok).toBe(false);
    }
    const supplementary = 'valid \u{1f680} text';
    expect(parseCreateSourceRequest({ sourceType: 'pasted_text', role: 'primary', text: supplementary }).ok).toBe(true);
    expect(parseEditSourceWorkingCopyRequest({ expectedRevision: 1, body: { text: supplementary } }).ok).toBe(true);
  });

  it('rejects unsafe labels through the same persistence-compatible Unicode rule', () => {
    for (const label of ['bad\u0000label', 'bad\ud800label', 'bad\udc00label']) {
      expect(parseCreateSourceRequest({ sourceType: 'pasted_text', role: 'supporting', text: 'valid', label }).ok).toBe(
        false,
      );
    }
  });

  it('counts label maxLength by Unicode scalar values', () => {
    const parseLabel = (label: string) =>
      parseCreateSourceRequest({ sourceType: 'pasted_text', role: 'supporting', text: 'valid', label }).ok;
    const supplementary = '\u{1f680}';
    expect(parseLabel(supplementary.repeat(100))).toBe(true);
    expect(parseLabel(supplementary.repeat(200))).toBe(true);
    expect(parseLabel(`${'a'.repeat(100)}${supplementary.repeat(100)}`)).toBe(true);
    expect(parseLabel(supplementary.repeat(201))).toBe(false);
    expect(parseLabel(`${'a'.repeat(101)}${supplementary.repeat(100)}`)).toBe(false);
  });

  it('requires expectedRevision and body for working-copy edit', () => {
    expect(parseEditSourceWorkingCopyRequest({ expectedRevision: 1, body: { text: 'text' } }).ok).toBe(true);
    expect(parseEditSourceWorkingCopyRequest({ expectedRevision: 1, body: 'text' }).ok).toBe(false);
    expect(parseEditSourceWorkingCopyRequest({ body: { text: 'text' } }).ok).toBe(false);
    expect(parseEditSourceWorkingCopyRequest({ expectedRevision: 0, body: { text: 'text' } }).ok).toBe(false);
    expect(parseEditSourceWorkingCopyRequest({ expectedRevision: 1, body: { text: 'x', extra: true } }).ok).toBe(false);
  });

  it('requires expectedRevision for version creation', () => {
    expect(parseCreateSourceVersionRequest({ expectedRevision: 1 }).ok).toBe(true);
    expect(parseCreateSourceVersionRequest({}).ok).toBe(false);
  });

  it('requires a valid UUID versionId for approval and forbids extra fields', () => {
    expect(parseApproveSourceVersionRequest({ versionId: '550e8400-e29b-41d4-a716-446655440000' }).ok).toBe(true);
    expect(parseApproveSourceVersionRequest({ versionId: 'abc-123' }).ok).toBe(false);
    expect(parseApproveSourceVersionRequest({}).ok).toBe(false);
    expect(parseApproveSourceVersionRequest({ versionId: 'x', force: true }).ok).toBe(false);
    expect(parseApproveSourceVersionRequest({ versionId: 'not-a-uuid' }).ok).toBe(false);
    expect(parseApproveSourceVersionRequest({ versionId: '' }).ok).toBe(false);
  });

  it('normalizes Source list query defaults', () => {
    const parsed = parseSourceListQuery({});
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.limit).toBe(20);
    }
  });

  it('rejects out-of-range limit', () => {
    expect(parseSourceListQuery({ limit: '51' }).ok).toBe(false);
    expect(parseSourceListQuery({ limit: '0' }).ok).toBe(false);
  });
});

describe('normalized source body JSON Schema synchronization', () => {
  const schemaPath = fileURLToPath(new URL('../../../../schemas/source/normalized-source-v1.json', import.meta.url));
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile(schema);

  it('validates a representative NormalizedSourceBody fixture', () => {
    const body: NormalizedSourceBody = { text: 'This is normalized source content.' };
    expect(validate(body)).toBe(true);
  });

  it('rejects missing text field', () => {
    expect(validate({})).toBe(false);
  });

  it('rejects non-string text', () => {
    expect(validate({ text: 123 })).toBe(false);
  });

  it('rejects additional properties', () => {
    expect(validate({ text: 'x', extra: 1 })).toBe(false);
  });

  it('rejects empty text', () => {
    expect(validate({ text: '' })).toBe(false);
  });

  it('rejects persistence-incompatible Unicode and accepts a supplementary-plane scalar', () => {
    for (const text of ['before\u0000after', 'lone high \ud800', 'lone low \udc00']) {
      expect(validate({ text })).toBe(false);
    }
    expect(validate({ text: 'valid \u{1f680} text' })).toBe(true);
  });

  it('keeps TypeScript NormalizedSourceBody synchronized with the JSON Schema', () => {
    const sample: NormalizedSourceBody = { text: 'Synchronized fixture.' };
    expect(validate(sample)).toBe(true);
    expect(validate({ ...sample, unknownExtra: 1 })).toBe(false);
  });
});
