import type {
  BlogResource,
  ContentPackageModeDto,
  ContentPackageOutputDto,
  OpinionResource,
  ResearchResource,
  SourceResource,
  XiaohongshuResource,
} from '@contentos/contracts';

export type WorkspaceStageId = 'details' | 'sources' | 'research' | 'opinion-blog' | 'xiaohongshu';
export type WorkspaceStageStatus = 'loading' | 'ready' | 'in_review' | 'approved' | 'outdated' | 'blocked';

export interface WorkspaceStageView {
  readonly status: WorkspaceStageStatus;
  readonly label: string;
  readonly nextAction: string;
  readonly reason: string;
}

export interface WorkspaceStageProjection {
  readonly details: WorkspaceStageView;
  readonly sources: WorkspaceStageView;
  readonly research: WorkspaceStageView;
  readonly 'opinion-blog': WorkspaceStageView;
  readonly xiaohongshu: WorkspaceStageView;
}

export interface WorkspaceStageProjectionInput {
  readonly lifecycle: 'active' | 'archived';
  readonly configuredMode: ContentPackageModeDto;
  readonly requestedOutputs: readonly ContentPackageOutputDto[];
  readonly loading: boolean;
  readonly readError: boolean;
  readonly sources: readonly SourceResource[] | null;
  readonly research: ResearchResource | null;
  readonly opinion: OpinionResource | null;
  readonly blog: BlogResource | null;
  readonly xiaohongshu: XiaohongshuResource | null;
}

export type CandidateActionId =
  'select_mode' | 'generate' | 'refresh' | 'save' | 'checkpoint' | 'approve' | 'export' | 'complete';

export interface CandidateAction {
  readonly id: CandidateActionId;
  readonly label: string;
  readonly reason: string;
  readonly disabled: boolean;
}

interface CandidateResource {
  readonly outdated: boolean;
  readonly reviewCandidateOutdated: boolean;
  readonly workingCopy: {
    readonly revision: number;
    readonly checkpointedRevision: number | null;
  };
  readonly latestVersion: { readonly id: string };
  readonly approvedVersionId: string | null;
}

const LABELS: Record<WorkspaceStageStatus, string> = {
  loading: 'Loading…',
  ready: 'Ready',
  in_review: 'In review',
  approved: 'Approved',
  outdated: 'Outdated',
  blocked: 'Blocked',
};

export function workspaceStageStatusLabel(status: WorkspaceStageStatus): string {
  return LABELS[status];
}

function view(status: WorkspaceStageStatus, nextAction: string, reason: string): WorkspaceStageView {
  return { status, label: LABELS[status], nextAction, reason };
}

function candidateStatus(resource: CandidateResource, dirty = false): WorkspaceStageStatus {
  if (resource.reviewCandidateOutdated) return 'outdated';
  if (dirty) return 'in_review';
  if (resource.approvedVersionId === resource.latestVersion.id && !resource.outdated) return 'approved';
  // `outdated` can describe only an older Approved Version. A fresh current
  // candidate remains actionable and therefore presents as In review.
  return 'in_review';
}

function blogStage(blog: BlogResource | null, generateReason: string): WorkspaceStageView {
  if (!blog) return view('ready', 'Generate Blog Candidate', generateReason);
  const status = candidateStatus(blog);
  if (status === 'outdated')
    return view('outdated', 'Generate fresh Blog Candidate', 'The current candidate uses older approved dependencies.');
  if (status === 'approved')
    return view('approved', 'Export article.md', 'The exact Approved Blog Version is current.');
  return view('in_review', 'Review the Blog Candidate', 'Save, checkpoint, and approve the current candidate.');
}

export function deriveWorkspaceStageProjection(input: WorkspaceStageProjectionInput): WorkspaceStageProjection {
  const archived = input.lifecycle === 'archived';
  const details = archived
    ? view('blocked', 'Review package history', 'Archived packages are read-only.')
    : view('ready', 'Edit package metadata', 'Package settings are current and editable.');
  const unavailable = archived
    ? view('blocked', 'Review package history', 'Archived packages are read-only.')
    : input.loading
      ? view('loading', 'Wait for authoritative status', 'Loading current Artifact and Approval state.')
      : view('blocked', 'Reload authoritative status', 'Current stage state could not be loaded safely.');

  if (archived || input.loading || input.readError) {
    return {
      details,
      sources: unavailable,
      research: unavailable,
      'opinion-blog': unavailable,
      xiaohongshu: unavailable,
    };
  }

  const sources = input.sources ?? [];
  const primaryApproved = sources.some((source) => source.role === 'primary' && source.approvedVersionId !== null);
  const sourceReviewPending = sources.some(
    (source) => source.approvedVersionId === null || source.reviewCandidateVersionId !== source.approvedVersionId,
  );
  const sourceView =
    sources.length === 0
      ? view('ready', 'Add the Primary Source', 'Research starts from one human-approved Primary Source.')
      : sourceReviewPending
        ? view('in_review', 'Review and approve Sources', 'At least one Source still needs an exact Version Approval.')
        : view('approved', 'Continue to Research', 'Every current Source has an exact Approved Version.');

  const researchView = !primaryApproved
    ? view('blocked', 'Approve the Primary Source', 'Research requires an exact Approved Primary Source Version.')
    : !input.research
      ? view('ready', 'Generate Research', 'The Approved Source foundation is ready.')
      : candidateStatus(input.research) === 'outdated'
        ? view(
            'outdated',
            'Generate fresh Research Candidate',
            'The current Research Candidate uses older Approved Sources.',
          )
        : candidateStatus(input.research) === 'approved'
          ? view('approved', 'Continue to content creation', 'The exact Approved Research Version is current.')
          : view('in_review', 'Review the Research Candidate', 'Save, checkpoint, and approve the current candidate.');

  const researchCurrent = Boolean(input.research?.approvedVersionId && !input.research.outdated);
  let opinionBlogView: WorkspaceStageView;
  const effectiveMode =
    input.blog?.latestVersion.body.contentMode ??
    (input.configuredMode === 'deferred'
      ? input.opinion?.confirmedVersionId
        ? 'creator_led'
        : 'deferred'
      : input.configuredMode);
  if (!researchCurrent) {
    opinionBlogView = view(
      'blocked',
      'Approve current Research',
      'Content creation requires current Approved Research.',
    );
  } else if (effectiveMode === 'research_based') {
    opinionBlogView = blogStage(input.blog, 'Research-based creation uses Approved Research without personal claims.');
  } else if (effectiveMode === 'deferred') {
    opinionBlogView = view('ready', 'Choose a content mode', 'Choose Creator-led or Research-based before generation.');
  } else if (input.opinion?.outdated) {
    opinionBlogView = view(
      'outdated',
      'Re-interpret with current Research',
      'Approved Research changed; review and re-confirm the retained response against it.',
    );
  } else if (!input.opinion?.confirmedVersionId) {
    opinionBlogView = input.opinion
      ? view('in_review', 'Review and confirm Human Opinion', 'Only the user can confirm an exact Opinion Version.')
      : view('ready', 'Respond to the Opinion question', 'Creator-led content requires a current confirmed Opinion.');
  } else {
    opinionBlogView = blogStage(input.blog, 'Current Approved Research and Human Opinion are ready.');
  }

  const xhsRequested = input.requestedOutputs.includes('xiaohongshu');
  const xhsMode = input.xiaohongshu?.latestVersion.body.contentMode ?? effectiveMode;
  const opinionReady =
    xhsMode !== 'creator_led' || Boolean(input.opinion?.confirmedVersionId && !input.opinion.outdated);
  let xiaohongshuView: WorkspaceStageView;
  if (!xhsRequested) {
    xiaohongshuView = view('blocked', 'Enable Xiaohongshu output', 'This output is not requested for the package.');
  } else if (!researchCurrent) {
    xiaohongshuView = view('blocked', 'Approve current Research', 'Xiaohongshu requires current Approved Research.');
  } else if (!opinionReady) {
    xiaohongshuView = view(
      'blocked',
      'Confirm current Human Opinion',
      'Creator-led Xiaohongshu requires an Opinion bound to current Research.',
    );
  } else if (!input.xiaohongshu) {
    xiaohongshuView = view('ready', 'Generate Xiaohongshu Candidate', 'The current Content Foundation is ready.');
  } else {
    const status = candidateStatus(input.xiaohongshu);
    xiaohongshuView =
      status === 'outdated'
        ? view(
            'outdated',
            'Generate fresh Xiaohongshu Candidate',
            'The current candidate uses older approved dependencies.',
          )
        : status === 'approved'
          ? view('approved', 'Export post.md and pages.json', 'The exact Approved Xiaohongshu Version is current.')
          : view(
              'in_review',
              'Review the Xiaohongshu Candidate',
              'Save, checkpoint, and approve the current candidate.',
            );
  }

  return {
    details,
    sources: sourceView,
    research: researchView,
    'opinion-blog': opinionBlogView,
    xiaohongshu: xiaohongshuView,
  };
}

export function deriveCandidateAction(input: {
  readonly resource: CandidateResource | null;
  readonly dirty: boolean;
  readonly active: boolean;
  readonly busy: boolean;
  readonly noun: 'Research' | 'Blog' | 'Xiaohongshu';
  readonly exportLabel?: string;
}): CandidateAction {
  const { resource, dirty, active, busy, noun } = input;
  if (!resource) {
    return {
      id: 'generate',
      label: `Generate ${noun} Candidate`,
      reason: active
        ? `Create the first ${noun} Candidate from current approved dependencies.`
        : 'Archived packages are read-only.',
      disabled: !active || busy,
    };
  }
  if (resource.reviewCandidateOutdated) {
    return {
      id: 'refresh',
      label: `Generate fresh ${noun} Candidate`,
      reason: dirty
        ? 'Discard or save the local draft before replacing the stale candidate.'
        : 'Approved dependencies changed.',
      disabled: !active || busy || dirty,
    };
  }
  if (dirty) {
    return {
      id: 'save',
      label: 'Save changes',
      reason: 'The Working Copy differs from its last saved revision.',
      disabled: !active || busy,
    };
  }
  if (resource.workingCopy.checkpointedRevision !== resource.workingCopy.revision) {
    return {
      id: 'checkpoint',
      label: 'Create immutable Version',
      reason: 'Save is complete; checkpoint this exact Working Copy before Approval.',
      disabled: !active || busy,
    };
  }
  if (resource.approvedVersionId !== resource.latestVersion.id) {
    return {
      id: 'approve',
      label: 'Approve exact Version',
      reason: 'The current checkpointed Version is eligible for human Approval.',
      disabled: !active || busy,
    };
  }
  if (input.exportLabel) {
    return {
      id: 'export',
      label: input.exportLabel,
      reason: 'The exact Approved Version is current.',
      disabled: busy || resource.outdated,
    };
  }
  return {
    id: 'complete',
    label: 'Approved and current',
    reason: 'No review action is pending for this exact Version.',
    disabled: true,
  };
}

export function candidatePresentationStatus(resource: CandidateResource | null, dirty: boolean): WorkspaceStageStatus {
  return resource ? candidateStatus(resource, dirty) : 'ready';
}
