export interface SourceReviewHead {
  readonly latestVersionId: string | null;
  readonly reviewCandidateVersionId: string | null;
  readonly approvedVersionId: string | null;
}

export interface SourceReviewRequestToken {
  readonly session: number;
  readonly load: number | null;
}

/** Fences async continuations to one selected Source and makes review loads latest-wins. */
export class SourceReviewRequestFence {
  private session = 0;
  private load = 0;

  beginSession(): void {
    this.session += 1;
    this.load = 0;
  }

  capture(): SourceReviewRequestToken {
    return { session: this.session, load: null };
  }

  beginLoad(): SourceReviewRequestToken {
    this.load += 1;
    return { session: this.session, load: this.load };
  }

  isCurrent(token: SourceReviewRequestToken): boolean {
    return token.session === this.session;
  }

  isLatestLoad(token: SourceReviewRequestToken): boolean {
    return token.load !== null && token.session === this.session && token.load === this.load;
  }

  invalidateLoads(): void {
    this.load += 1;
  }

  commitMutation(token: SourceReviewRequestToken): boolean {
    if (!this.isCurrent(token)) return false;
    this.invalidateLoads();
    return true;
  }

  dispose(): void {
    this.beginSession();
  }
}

/** Serializes notification-driven recovery around Source review commands. */
export class SourceReviewRecoveryGate {
  private commandActive = false;
  private lastHandledRefreshSignal = 0;
  private deferredRefreshSignal: number | null = null;

  beginSession(currentRefreshSignal: number): void {
    this.commandActive = false;
    this.lastHandledRefreshSignal = currentRefreshSignal;
    this.deferredRefreshSignal = null;
  }

  beginCommand(): boolean {
    if (this.commandActive) return false;
    this.commandActive = true;
    return true;
  }

  requestRefresh(refreshSignal: number): boolean {
    if (refreshSignal === 0 || refreshSignal === this.lastHandledRefreshSignal) return false;
    if (this.commandActive) {
      this.deferredRefreshSignal = refreshSignal;
      return false;
    }
    this.lastHandledRefreshSignal = refreshSignal;
    return true;
  }

  endCommand(): boolean {
    if (!this.commandActive) return false;
    this.commandActive = false;
    if (this.deferredRefreshSignal === null || this.deferredRefreshSignal === this.lastHandledRefreshSignal) {
      this.deferredRefreshSignal = null;
      return false;
    }
    this.lastHandledRefreshSignal = this.deferredRefreshSignal;
    this.deferredRefreshSignal = null;
    return true;
  }
}

export function sourceReviewRefreshDraft(input: {
  readonly draft: string;
  readonly baselineAtRefreshStart: string;
  readonly incomingText: string;
  readonly dirtyAtRefreshStart: boolean;
}): string {
  return input.dirtyAtRefreshStart || input.draft !== input.baselineAtRefreshStart ? input.draft : input.incomingText;
}

export function sourceReviewView(input: {
  readonly revision: number;
  readonly checkpointedRevision: number | null;
  readonly text: string;
  readonly draft: string;
  readonly busy: boolean;
  readonly revisionConflict?: boolean;
  readonly versionId?: string;
  readonly head?: SourceReviewHead;
}): {
  readonly dirty: boolean;
  readonly canSaveWorkingCopy: boolean;
  readonly canCreateVersion: boolean;
  readonly canApproveVersion: boolean;
  readonly draftNavigationBlocked: boolean;
  readonly badges: readonly ('Latest' | 'Review candidate' | 'Current approved')[];
} {
  const dirty = input.text !== input.draft;
  const mutationBlocked = input.busy || input.revisionConflict === true;
  const head = input.head;
  const badges: ('Latest' | 'Review candidate' | 'Current approved')[] = [];
  if (input.versionId && head?.latestVersionId === input.versionId) badges.push('Latest');
  if (input.versionId && head?.reviewCandidateVersionId === input.versionId) badges.push('Review candidate');
  if (input.versionId && head?.approvedVersionId === input.versionId) badges.push('Current approved');
  return {
    dirty,
    canSaveWorkingCopy: dirty && !mutationBlocked,
    canCreateVersion: !dirty && input.revision !== input.checkpointedRevision && !mutationBlocked,
    canApproveVersion:
      !dirty &&
      !mutationBlocked &&
      input.versionId !== undefined &&
      head?.reviewCandidateVersionId === input.versionId &&
      head.approvedVersionId !== input.versionId,
    draftNavigationBlocked: dirty,
    badges,
  };
}
