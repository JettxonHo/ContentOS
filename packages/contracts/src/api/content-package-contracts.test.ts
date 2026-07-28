import { describe, expect, it } from 'vitest';

import {
  parseArchiveContentPackageRequest,
  parseContentPackageListQuery,
  parseCreateContentPackageRequest,
  parseUpdateContentPackageRequest,
} from './content-package-contracts.js';

describe('content package contracts', () => {
  it('accepts bounded creation metadata including a null description', () => {
    expect(
      parseCreateContentPackageRequest({
        title: 'First package',
        description: null,
        contentMode: 'creator_led',
        requestedOutputs: ['blog', 'xiaohongshu'],
      }),
    ).toMatchObject({ ok: true });
  });

  it('rejects duplicate outputs and unknown fields', () => {
    expect(
      parseCreateContentPackageRequest({
        title: 'First package',
        requestedOutputs: ['blog', 'blog'],
        ownerUserId: 'not-client-controlled',
      }).ok,
    ).toBe(false);
  });

  it('requires a metadata change in addition to expectedRevision', () => {
    expect(parseUpdateContentPackageRequest({ expectedRevision: 1 }).ok).toBe(false);
    expect(parseUpdateContentPackageRequest({ expectedRevision: 1, description: null }).ok).toBe(true);
  });

  it('requires a positive archive revision', () => {
    expect(parseArchiveContentPackageRequest({ expectedRevision: 0 }).ok).toBe(false);
    expect(parseArchiveContentPackageRequest({ expectedRevision: 2 }).ok).toBe(true);
  });

  it('normalizes bounded list query defaults', () => {
    expect(parseContentPackageListQuery({})).toEqual({
      ok: true,
      value: { status: 'active', limit: 20 },
    });
    expect(parseContentPackageListQuery({ status: 'all', limit: '50', cursor: 'opaque' })).toEqual({
      ok: true,
      value: { status: 'all', limit: 50, cursor: 'opaque' },
    });
    expect(parseContentPackageListQuery({ limit: '51' }).ok).toBe(false);
  });
});
