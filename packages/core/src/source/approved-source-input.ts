import type { ContentPackageId, ContentPackageOwnerId } from '../content-package/content-package.js';

import type {
  NormalizedSourceBody,
  SourceId,
  SourceRole,
  SourceVersionId,
  SOURCE_SCHEMA_VERSION,
} from './source-values.js';

/** Owner and Package boundary for a current Approved Source input read. */
export interface ApprovedSourceInputScope {
  readonly contentPackageId: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
}

/**
 * One current, exact, human-approved immutable Source Version.
 *
 * This is an input projection only. It does not decide Research readiness or
 * freeze a future execution's input set.
 */
export interface ApprovedSourceInput {
  readonly sourceId: SourceId;
  readonly role: SourceRole;
  readonly sourceVersionId: SourceVersionId;
  readonly versionNumber: number;
  readonly schemaVersion: typeof SOURCE_SCHEMA_VERSION;
  readonly body: NormalizedSourceBody;
}

/** Provider-neutral read seam for future owner-scoped Source consumers. */
export interface ApprovedSourceInputPort {
  listCurrentForPackage(scope: ApprovedSourceInputScope): Promise<readonly ApprovedSourceInput[]>;
}
