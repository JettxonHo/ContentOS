import type { ContentPackageId, ContentPackageOwnerId } from '../content-package/content-package.js';

export type ArtifactId = string & { readonly __brand: 'ArtifactId' };
export type WorkingCopyId = string & { readonly __brand: 'WorkingCopyId' };
export type VersionId = string & { readonly __brand: 'VersionId' };

export interface ArtifactIdentity {
  readonly id: ArtifactId;
  readonly contentPackageId: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
  readonly artifactType: string;
}

export interface WorkingCopyIdentity {
  readonly id: WorkingCopyId;
  readonly artifactId: ArtifactId;
  readonly revision: number;
  readonly baseVersionId: VersionId | null;
}

export interface ImmutableVersionIdentity {
  readonly id: VersionId;
  readonly artifactId: ArtifactId;
  readonly versionNumber: number;
  readonly parentVersionId: VersionId | null;
  readonly contentHash: string;
  readonly schemaVersion: string;
  readonly createdAt: Date;
}

export interface ArtifactHead {
  readonly artifactId: ArtifactId;
  readonly workingCopyId: WorkingCopyId;
  readonly latestVersionId: VersionId | null;
  readonly reviewCandidateVersionId: VersionId | null;
  readonly approvedVersionId: VersionId | null;
}

export class ArtifactVersioningInvariantError extends Error {
  constructor() {
    super('INVALID_ARTIFACT_VERSIONING_IDENTITY');
    this.name = 'ArtifactVersioningInvariantError';
  }
}

function requireIdentity(value: string): void {
  if (value.trim() === '') {
    throw new ArtifactVersioningInvariantError();
  }
}

export function defineArtifactIdentity(identity: ArtifactIdentity): ArtifactIdentity {
  requireIdentity(identity.id);
  requireIdentity(identity.contentPackageId);
  requireIdentity(identity.ownerUserId);
  requireIdentity(identity.artifactType);
  return { ...identity };
}

export function defineWorkingCopyIdentity(identity: WorkingCopyIdentity): WorkingCopyIdentity {
  requireIdentity(identity.id);
  requireIdentity(identity.artifactId);
  if (!Number.isSafeInteger(identity.revision) || identity.revision < 1) {
    throw new ArtifactVersioningInvariantError();
  }
  return { ...identity };
}

export function advanceWorkingCopyRevision(
  identity: WorkingCopyIdentity,
  expectedRevision: number,
): WorkingCopyIdentity {
  if (identity.revision !== expectedRevision) {
    throw new ArtifactVersioningInvariantError();
  }
  return { ...identity, revision: identity.revision + 1 };
}

export function defineImmutableVersionIdentity(identity: ImmutableVersionIdentity): ImmutableVersionIdentity {
  requireIdentity(identity.id);
  requireIdentity(identity.artifactId);
  requireIdentity(identity.contentHash);
  requireIdentity(identity.schemaVersion);
  if (!Number.isSafeInteger(identity.versionNumber) || identity.versionNumber < 1) {
    throw new ArtifactVersioningInvariantError();
  }
  return { ...identity };
}

export function defineArtifactHead(head: ArtifactHead): ArtifactHead {
  requireIdentity(head.artifactId);
  requireIdentity(head.workingCopyId);
  return { ...head };
}
