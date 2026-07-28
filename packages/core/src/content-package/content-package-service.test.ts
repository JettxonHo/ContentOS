import { describe, expect, it } from 'vitest';

import type { ContentPackage, ContentPackageId, ContentPackageOwnerId } from './content-package.js';
import {
  ContentPackageApplicationError,
  ContentPackageService,
  type ContentPackageListRequest,
  type ContentPackageRepository,
} from './content-package-service.js';

const owner = '00000000-0000-4000-8000-000000000001' as ContentPackageOwnerId;
const otherOwner = '00000000-0000-4000-8000-000000000002' as ContentPackageOwnerId;
const packageId = '10000000-0000-4000-8000-000000000001' as ContentPackageId;

class MemoryRepository implements ContentPackageRepository {
  readonly items = new Map<string, ContentPackage>();
  rejectNextWrite = false;

  async insert(contentPackage: ContentPackage): Promise<void> {
    this.items.set(contentPackage.state.id, contentPackage);
  }

  async findByIdForOwner(id: ContentPackageId, ownerUserId: ContentPackageOwnerId): Promise<ContentPackage | null> {
    const item = this.items.get(id);
    return item?.state.ownerUserId === ownerUserId ? item : null;
  }

  async listForOwner(request: ContentPackageListRequest): Promise<{ items: ContentPackage[]; hasMore: boolean }> {
    const matching = [...this.items.values()].filter(
      (item) =>
        item.state.ownerUserId === request.ownerUserId &&
        (request.filter === 'all' || item.state.lifecycle === request.filter),
    );
    return { items: matching.slice(0, request.limit), hasMore: matching.length > request.limit };
  }

  async updateMetadata(contentPackage: ContentPackage, expectedRevision: number): Promise<boolean> {
    if (this.rejectNextWrite) {
      this.rejectNextWrite = false;
      const current = this.items.get(contentPackage.state.id);
      if (current) {
        this.items.set(
          contentPackage.state.id,
          current.updateMetadata({ title: 'Concurrent' }, expectedRevision, new Date(0)),
        );
      }
      return false;
    }
    this.items.set(contentPackage.state.id, contentPackage);
    return true;
  }

  async archive(contentPackage: ContentPackage, expectedRevision: number): Promise<boolean> {
    return this.updateMetadata(contentPackage, expectedRevision);
  }
}

function fixture(): { service: ContentPackageService; repository: MemoryRepository } {
  const repository = new MemoryRepository();
  return {
    repository,
    service: new ContentPackageService(repository, { generate: () => packageId }, { now: () => new Date(0) }),
  };
}

describe('ContentPackageService', () => {
  it('enforces owner scope across create, get, list, and archive', async () => {
    const { service } = fixture();
    await service.create({
      ownerUserId: owner,
      title: 'Owned',
      description: null,
      contentMode: 'deferred',
      requestedOutputs: ['blog'],
    });

    await expect(service.get(packageId, owner)).resolves.toMatchObject({ title: 'Owned' });
    await expect(service.get(packageId, otherOwner)).rejects.toBeInstanceOf(ContentPackageApplicationError);
    await expect(service.list({ ownerUserId: otherOwner, filter: 'all', limit: 20 })).resolves.toEqual({
      items: [],
      nextPosition: null,
    });
  });

  it('classifies an atomic stale-write rejection without changing state', async () => {
    const { service, repository } = fixture();
    await service.create({
      ownerUserId: owner,
      title: 'Original',
      description: null,
      contentMode: 'deferred',
      requestedOutputs: ['blog'],
    });
    repository.rejectNextWrite = true;

    await expect(
      service.updateMetadata({ id: packageId, ownerUserId: owner, expectedRevision: 1, title: 'Stale' }),
    ).rejects.toMatchObject({ code: 'REVISION_CONFLICT' });
    await expect(service.get(packageId, owner)).resolves.toMatchObject({ title: 'Concurrent', revision: 2 });
  });
});
