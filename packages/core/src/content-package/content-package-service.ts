import {
  ContentPackage,
  ContentPackageDomainError,
  type ContentPackageId,
  type ContentPackageOwnerId,
  type ContentPackageState,
  type CreateContentPackageInput,
  type UpdateContentPackageMetadata,
} from './content-package.js';

export type ContentPackageListFilter = 'active' | 'archived' | 'all';

export interface ContentPackageListPosition {
  readonly createdAt: Date;
  readonly id: ContentPackageId;
}

export interface ContentPackageListRequest {
  readonly ownerUserId: ContentPackageOwnerId;
  readonly filter: ContentPackageListFilter;
  readonly limit: number;
  readonly after?: ContentPackageListPosition;
}

export interface ContentPackageListResult {
  readonly items: readonly ContentPackage[];
  readonly hasMore: boolean;
}

export interface ContentPackageRepository {
  insert(contentPackage: ContentPackage): Promise<void>;
  findByIdForOwner(id: ContentPackageId, ownerUserId: ContentPackageOwnerId): Promise<ContentPackage | null>;
  listForOwner(request: ContentPackageListRequest): Promise<ContentPackageListResult>;
  updateMetadata(contentPackage: ContentPackage, expectedRevision: number): Promise<boolean>;
  archive(contentPackage: ContentPackage, expectedRevision: number): Promise<boolean>;
}

export interface ContentPackageIdGenerator {
  generate(): ContentPackageId;
}

export interface ContentPackageClock {
  now(): Date;
}

export type ContentPackageApplicationErrorCode = 'CONTENT_PACKAGE_NOT_FOUND' | 'REVISION_CONFLICT';

export class ContentPackageApplicationError extends Error {
  constructor(readonly code: ContentPackageApplicationErrorCode) {
    super(code);
    this.name = 'ContentPackageApplicationError';
  }
}

export interface CreateContentPackageCommand extends Omit<CreateContentPackageInput, 'id' | 'ownerUserId' | 'now'> {
  readonly ownerUserId: ContentPackageOwnerId;
}

export interface UpdateContentPackageCommand extends UpdateContentPackageMetadata {
  readonly id: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
  readonly expectedRevision: number;
}

export interface ArchiveContentPackageCommand {
  readonly id: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
  readonly expectedRevision: number;
}

export class ContentPackageService {
  constructor(
    private readonly repository: ContentPackageRepository,
    private readonly ids: ContentPackageIdGenerator,
    private readonly clock: ContentPackageClock,
  ) {}

  async create(command: CreateContentPackageCommand): Promise<ContentPackageState> {
    const contentPackage = ContentPackage.create({
      ...command,
      id: this.ids.generate(),
      now: this.clock.now(),
    });
    await this.repository.insert(contentPackage);
    return contentPackage.state;
  }

  async get(id: ContentPackageId, ownerUserId: ContentPackageOwnerId): Promise<ContentPackageState> {
    return (await this.requireOwned(id, ownerUserId)).state;
  }

  async list(request: ContentPackageListRequest): Promise<{
    readonly items: readonly ContentPackageState[];
    readonly nextPosition: ContentPackageListPosition | null;
  }> {
    if (!Number.isSafeInteger(request.limit) || request.limit < 1 || request.limit > 50) {
      throw new ContentPackageDomainError('INVALID_CONTENT_PACKAGE');
    }
    const result = await this.repository.listForOwner(request);
    const items = result.items.map((item) => item.state);
    const last = items.at(-1);
    return {
      items,
      nextPosition: result.hasMore && last ? { createdAt: last.createdAt, id: last.id } : null,
    };
  }

  async updateMetadata(command: UpdateContentPackageCommand): Promise<ContentPackageState> {
    const current = await this.requireOwned(command.id, command.ownerUserId);
    const candidate = current.updateMetadata(command, command.expectedRevision, this.clock.now());
    if (await this.repository.updateMetadata(candidate, command.expectedRevision)) {
      return candidate.state;
    }
    return this.classifyMutationFailure(command.id, command.ownerUserId, command.expectedRevision);
  }

  async archive(command: ArchiveContentPackageCommand): Promise<ContentPackageState> {
    const current = await this.requireOwned(command.id, command.ownerUserId);
    const candidate = current.archive(command.expectedRevision, this.clock.now());
    if (await this.repository.archive(candidate, command.expectedRevision)) {
      return candidate.state;
    }
    return this.classifyMutationFailure(command.id, command.ownerUserId, command.expectedRevision);
  }

  private async requireOwned(id: ContentPackageId, ownerUserId: ContentPackageOwnerId): Promise<ContentPackage> {
    const contentPackage = await this.repository.findByIdForOwner(id, ownerUserId);
    if (!contentPackage) {
      throw new ContentPackageApplicationError('CONTENT_PACKAGE_NOT_FOUND');
    }
    return contentPackage;
  }

  private async classifyMutationFailure(
    id: ContentPackageId,
    ownerUserId: ContentPackageOwnerId,
    expectedRevision: number,
  ): Promise<never> {
    const latest = await this.repository.findByIdForOwner(id, ownerUserId);
    if (!latest) {
      throw new ContentPackageApplicationError('CONTENT_PACKAGE_NOT_FOUND');
    }
    if (latest.state.revision !== expectedRevision) {
      throw new ContentPackageApplicationError('REVISION_CONFLICT');
    }
    throw new ContentPackageDomainError('CONTENT_PACKAGE_STATE_CONFLICT');
  }
}
