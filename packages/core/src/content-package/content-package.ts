import type { UserId } from '../security/authentication.js';

export type ContentPackageId = string & { readonly __brand: 'ContentPackageId' };
export type ContentPackageOwnerId = UserId;

export const CONTENT_MODES = ['deferred', 'creator_led', 'research_based'] as const;
export type ContentMode = (typeof CONTENT_MODES)[number];

export const REQUESTED_OUTPUTS = ['blog', 'xiaohongshu'] as const;
export type RequestedOutput = (typeof REQUESTED_OUTPUTS)[number];

export const CONTENT_PACKAGE_LIFECYCLES = ['active', 'archived'] as const;
export type ContentPackageLifecycle = (typeof CONTENT_PACKAGE_LIFECYCLES)[number];

export interface ContentPackageMetadata {
  readonly title: string;
  readonly description: string | null;
  readonly contentMode: ContentMode;
  readonly requestedOutputs: readonly RequestedOutput[];
}

export interface ContentPackageState extends ContentPackageMetadata {
  readonly id: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
  readonly lifecycle: ContentPackageLifecycle;
  readonly revision: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly archivedAt: Date | null;
}

export interface CreateContentPackageInput extends ContentPackageMetadata {
  readonly id: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
  readonly now: Date;
}

export interface UpdateContentPackageMetadata {
  readonly title?: string;
  readonly description?: string | null;
  readonly contentMode?: ContentMode;
  readonly requestedOutputs?: readonly RequestedOutput[];
}

export type ContentPackageDomainErrorCode =
  'INVALID_CONTENT_PACKAGE' | 'REVISION_CONFLICT' | 'CONTENT_PACKAGE_STATE_CONFLICT';

export class ContentPackageDomainError extends Error {
  constructor(readonly code: ContentPackageDomainErrorCode) {
    super(code);
    this.name = 'ContentPackageDomainError';
  }
}

const CONTENT_MODE_SET = new Set<string>(CONTENT_MODES);
const REQUESTED_OUTPUT_SET = new Set<string>(REQUESTED_OUTPUTS);
const CONTENT_PACKAGE_LIFECYCLE_SET = new Set<string>(CONTENT_PACKAGE_LIFECYCLES);

function invalid(): never {
  throw new ContentPackageDomainError('INVALID_CONTENT_PACKAGE');
}

function normalizeTitle(title: string): string {
  const normalized = title.trim();
  if (normalized.length < 1 || normalized.length > 200) {
    invalid();
  }
  return normalized;
}

function normalizeDescription(description: string | null): string | null {
  if (description === null) {
    return null;
  }
  const normalized = description.trim();
  if (normalized.length > 2_000) {
    invalid();
  }
  return normalized === '' ? null : normalized;
}

function normalizeContentMode(contentMode: ContentMode): ContentMode {
  if (!CONTENT_MODE_SET.has(contentMode)) {
    invalid();
  }
  return contentMode;
}

function normalizeRequestedOutputs(outputs: readonly RequestedOutput[]): readonly RequestedOutput[] {
  const unique = [...new Set(outputs)];
  if (unique.length < 1 || unique.length > REQUESTED_OUTPUTS.length) {
    invalid();
  }
  if (unique.some((output) => !REQUESTED_OUTPUT_SET.has(output))) {
    invalid();
  }
  return REQUESTED_OUTPUTS.filter((output) => unique.includes(output));
}

function validateState(state: ContentPackageState): ContentPackageState {
  if (
    !state.id ||
    !state.ownerUserId ||
    !Number.isSafeInteger(state.revision) ||
    state.revision < 1 ||
    !CONTENT_PACKAGE_LIFECYCLE_SET.has(state.lifecycle) ||
    !Number.isFinite(state.createdAt.getTime()) ||
    !Number.isFinite(state.updatedAt.getTime()) ||
    (state.archivedAt !== null && !Number.isFinite(state.archivedAt.getTime()))
  ) {
    invalid();
  }
  if (state.updatedAt.getTime() < state.createdAt.getTime()) {
    invalid();
  }
  if (
    (state.lifecycle === 'active' && state.archivedAt !== null) ||
    (state.lifecycle === 'archived' && state.archivedAt === null)
  ) {
    invalid();
  }
  return {
    ...state,
    title: normalizeTitle(state.title),
    description: normalizeDescription(state.description),
    contentMode: normalizeContentMode(state.contentMode),
    requestedOutputs: normalizeRequestedOutputs(state.requestedOutputs),
  };
}

export class ContentPackage {
  private constructor(private readonly value: ContentPackageState) {}

  static create(input: CreateContentPackageInput): ContentPackage {
    return ContentPackage.rehydrate({
      id: input.id,
      ownerUserId: input.ownerUserId,
      title: input.title,
      description: input.description,
      contentMode: input.contentMode,
      requestedOutputs: input.requestedOutputs,
      lifecycle: 'active',
      revision: 1,
      createdAt: input.now,
      updatedAt: input.now,
      archivedAt: null,
    });
  }

  static rehydrate(state: ContentPackageState): ContentPackage {
    return new ContentPackage(validateState(state));
  }

  get state(): ContentPackageState {
    return this.value;
  }

  updateMetadata(update: UpdateContentPackageMetadata, expectedRevision: number, now: Date): ContentPackage {
    this.requireRevision(expectedRevision);
    this.requireActive();
    if (
      update.title === undefined &&
      update.description === undefined &&
      update.contentMode === undefined &&
      update.requestedOutputs === undefined
    ) {
      invalid();
    }
    return ContentPackage.rehydrate({
      ...this.value,
      title: update.title === undefined ? this.value.title : update.title,
      description: update.description === undefined ? this.value.description : update.description,
      contentMode: update.contentMode === undefined ? this.value.contentMode : update.contentMode,
      requestedOutputs: update.requestedOutputs === undefined ? this.value.requestedOutputs : update.requestedOutputs,
      revision: this.value.revision + 1,
      updatedAt: now,
    });
  }

  archive(expectedRevision: number, now: Date): ContentPackage {
    this.requireRevision(expectedRevision);
    this.requireActive();
    return ContentPackage.rehydrate({
      ...this.value,
      lifecycle: 'archived',
      revision: this.value.revision + 1,
      updatedAt: now,
      archivedAt: now,
    });
  }

  private requireRevision(expectedRevision: number): void {
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1 || expectedRevision !== this.value.revision) {
      throw new ContentPackageDomainError('REVISION_CONFLICT');
    }
  }

  private requireActive(): void {
    if (this.value.lifecycle !== 'active') {
      throw new ContentPackageDomainError('CONTENT_PACKAGE_STATE_CONFLICT');
    }
  }
}
