import { describe, expect, it } from 'vitest';

import type { ContentPackageId, ContentPackageOwnerId } from '../content-package/content-package.js';
import {
  advanceWorkingCopyRevision,
  ArtifactVersioningInvariantError,
  defineArtifactHead,
  defineArtifactIdentity,
  defineImmutableVersionIdentity,
  defineWorkingCopyIdentity,
  type ArtifactId,
  type VersionId,
  type WorkingCopyId,
} from './artifact-versioning.js';

const artifactId = 'artifact-1' as ArtifactId;
const workingCopyId = 'working-copy-1' as WorkingCopyId;

describe('artifact versioning identity foundation', () => {
  it('keeps Artifact, mutable Working Copy, immutable Version, and Head identities separate', () => {
    expect(
      defineArtifactIdentity({
        id: artifactId,
        contentPackageId: 'package-1' as ContentPackageId,
        ownerUserId: 'owner-1' as ContentPackageOwnerId,
        artifactType: 'blog',
      }),
    ).toMatchObject({ id: artifactId, artifactType: 'blog' });

    const workingCopy = defineWorkingCopyIdentity({
      id: workingCopyId,
      artifactId,
      revision: 1,
      baseVersionId: null,
    });
    expect(advanceWorkingCopyRevision(workingCopy, 1).revision).toBe(2);

    const version = defineImmutableVersionIdentity({
      id: 'version-1' as VersionId,
      artifactId,
      versionNumber: 1,
      parentVersionId: null,
      contentHash: 'sha256:content',
      schemaVersion: 'blog/v1',
      createdAt: new Date(0),
    });
    expect(version).toEqual(expect.objectContaining({ versionNumber: 1, contentHash: 'sha256:content' }));

    expect(
      defineArtifactHead({
        artifactId,
        workingCopyId,
        latestVersionId: version.id,
        reviewCandidateVersionId: null,
        approvedVersionId: null,
      }),
    ).toMatchObject({ latestVersionId: version.id, approvedVersionId: null });
  });

  it('rejects invalid revisions without introducing a universal body', () => {
    expect(() =>
      defineWorkingCopyIdentity({ id: workingCopyId, artifactId, revision: 0, baseVersionId: null }),
    ).toThrowError(ArtifactVersioningInvariantError);
  });
});
