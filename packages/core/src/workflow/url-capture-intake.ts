import type { ContentPackageId, ContentPackageOwnerId } from '../content-package/content-package.js';
import type { WorkflowProjectionFailure } from './workflow-query.js';

export interface UrlCaptureIntakeQueryScope {
  readonly contentPackageId: ContentPackageId;
  readonly ownerUserId: ContentPackageOwnerId;
}

interface UrlCaptureIntakeBase {
  readonly id: string;
  readonly sourceReferenceId: string;
  readonly role: 'primary' | 'supporting';
  readonly submittedUrl: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type UrlCaptureIntake =
  | (UrlCaptureIntakeBase & {
      readonly status: 'queued' | 'running';
      readonly failure: null;
      readonly sourceId: null;
    })
  | (UrlCaptureIntakeBase & {
      readonly status: 'failed';
      readonly failure: WorkflowProjectionFailure;
      readonly sourceId: null;
    })
  | (UrlCaptureIntakeBase & {
      readonly status: 'succeeded';
      readonly failure: null;
      readonly sourceId: string;
    });

/** Provider-neutral, owner-scoped durable URL intake read seam. */
export interface UrlCaptureIntakeQueryPort {
  list(scope: UrlCaptureIntakeQueryScope): Promise<readonly UrlCaptureIntake[]>;
}
