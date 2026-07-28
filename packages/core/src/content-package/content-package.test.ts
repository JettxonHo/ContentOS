import { describe, expect, it } from 'vitest';

import {
  ContentPackage,
  ContentPackageDomainError,
  type ContentPackageId,
  type ContentPackageOwnerId,
} from './content-package.js';

const id = '10000000-0000-4000-8000-000000000001' as ContentPackageId;
const ownerUserId = '00000000-0000-4000-8000-000000000001' as ContentPackageOwnerId;
const createdAt = new Date('2026-07-28T00:00:00.000Z');

function createPackage(): ContentPackage {
  return ContentPackage.create({
    id,
    ownerUserId,
    title: '  First package  ',
    description: '  Initial description  ',
    contentMode: 'deferred',
    requestedOutputs: ['xiaohongshu', 'blog', 'blog'],
    now: createdAt,
  });
}

describe('ContentPackage', () => {
  it('normalizes bounded metadata and creates a monotonic active revision', () => {
    expect(createPackage().state).toMatchObject({
      id,
      ownerUserId,
      title: 'First package',
      description: 'Initial description',
      contentMode: 'deferred',
      requestedOutputs: ['blog', 'xiaohongshu'],
      lifecycle: 'active',
      revision: 1,
      archivedAt: null,
    });
  });

  it('updates only metadata at the expected revision', () => {
    const updated = createPackage().updateMetadata(
      { title: 'Updated', description: null, contentMode: 'research_based' },
      1,
      new Date('2026-07-28T00:01:00.000Z'),
    );
    expect(updated.state).toMatchObject({
      title: 'Updated',
      description: null,
      contentMode: 'research_based',
      requestedOutputs: ['blog', 'xiaohongshu'],
      revision: 2,
      lifecycle: 'active',
    });
  });

  it('rejects stale, empty, and invalid metadata changes', () => {
    expect(() => createPackage().updateMetadata({ title: 'stale' }, 2, createdAt)).toThrowError(
      ContentPackageDomainError,
    );
    expect(() => createPackage().updateMetadata({}, 1, createdAt)).toThrowError(ContentPackageDomainError);
    expect(() => createPackage().updateMetadata({ title: ' '.repeat(5) }, 1, createdAt)).toThrowError(
      ContentPackageDomainError,
    );
    expect(() =>
      ContentPackage.create({
        id,
        ownerUserId,
        title: 'Invalid',
        description: null,
        contentMode: 'deferred',
        requestedOutputs: [],
        now: createdAt,
      }),
    ).toThrowError(ContentPackageDomainError);
    expect(() => ContentPackage.rehydrate({ ...createPackage().state, lifecycle: 'unknown' as 'active' })).toThrowError(
      ContentPackageDomainError,
    );
    expect(() => ContentPackage.rehydrate({ ...createPackage().state, updatedAt: new Date('invalid') })).toThrowError(
      ContentPackageDomainError,
    );
  });

  it('archives without deleting and rejects later mutation', () => {
    const archivedAt = new Date('2026-07-28T00:02:00.000Z');
    const archived = createPackage().archive(1, archivedAt);
    expect(archived.state).toMatchObject({ lifecycle: 'archived', revision: 2, archivedAt });
    expect(() => archived.updateMetadata({ title: 'not allowed' }, 2, archivedAt)).toThrowError(
      ContentPackageDomainError,
    );
    expect(() => archived.archive(2, archivedAt)).toThrowError(ContentPackageDomainError);
  });
});
