import type {
  BlogResource,
  ContentPackageModeDto,
  ContentPackageOutputDto,
  OpinionResource,
  ResearchResource,
  SourceResource,
  XiaohongshuResource,
} from '@contentos/contracts';
import { UI_COPY } from './ui-copy';

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
  loading: UI_COPY.status.loading,
  ready: UI_COPY.status.ready,
  in_review: UI_COPY.status.in_review,
  approved: UI_COPY.status.approved,
  outdated: UI_COPY.status.outdated,
  blocked: UI_COPY.status.blocked,
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
  if (!blog) return view('ready', '生成文章候选', generateReason);
  const status = candidateStatus(blog);
  if (status === 'outdated') return view('outdated', '生成新版文章候选', '当前候选仍绑定旧的已批准依赖。');
  if (status === 'approved') return view('approved', '导出 article.md', '当前精确文章版本已批准且依赖有效。');
  return view('in_review', '审核文章候选', '保存当前草稿，保存为不可变版本，再由你批准。');
}

export function deriveWorkspaceStageProjection(input: WorkspaceStageProjectionInput): WorkspaceStageProjection {
  const archived = input.lifecycle === 'archived';
  const details = archived
    ? view('blocked', '查看项目历史', '已归档项目为只读。')
    : view('ready', '编辑项目信息', '项目设置可编辑。');
  const unavailable = archived
    ? view('blocked', '查看项目历史', '已归档项目为只读。')
    : input.loading
      ? view('loading', '等待状态读取', '正在读取当前内容与批准状态。')
      : view('blocked', '重新读取状态', '无法安全读取当前阶段状态。');

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
      ? view('ready', '添加主资料', '研究从一份经人工批准的主资料开始。')
      : sourceReviewPending
        ? view('in_review', '审核并批准资料', '至少一份资料仍需批准精确版本。')
        : view('approved', '进入研究', '每份当前资料都已有精确批准版本。');

  const researchView = !primaryApproved
    ? view('blocked', '批准主资料', '研究需要精确批准的主资料版本。')
    : !input.research
      ? view('ready', '生成研究候选', '已批准的资料基础已经就绪。')
      : candidateStatus(input.research) === 'outdated'
        ? view('outdated', '生成新版研究候选', '当前研究候选仍使用旧的已批准资料。')
        : candidateStatus(input.research) === 'approved'
          ? view('approved', '进入内容创作', '当前精确研究版本已批准且依赖有效。')
          : view('in_review', '审核研究候选', '保存当前草稿，保存为不可变版本，再由你批准。');

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
    opinionBlogView = view('blocked', '批准当前研究', '内容创作需要当前有效的已批准研究。');
  } else if (effectiveMode === 'research_based') {
    opinionBlogView = blogStage(input.blog, '研究驱动创作只使用已批准研究，不代替创作者表达个人经历。');
  } else if (effectiveMode === 'deferred') {
    opinionBlogView = view('ready', '选择内容模式', '生成前请选择创作者主导或研究驱动。');
  } else if (input.opinion?.outdated) {
    opinionBlogView = view(
      'outdated',
      '基于当前研究重新解读',
      '已批准研究发生变化；请保留原回答，重新解读、审核并确认。',
    );
  } else if (!input.opinion?.confirmedVersionId) {
    opinionBlogView = input.opinion
      ? view('in_review', '审核并确认观点', '只有你可以确认精确观点版本。')
      : view('ready', '回答观点问题', '创作者主导内容需要当前有效的已确认观点。');
  } else {
    opinionBlogView = blogStage(input.blog, '当前已批准研究和已确认观点均已就绪。');
  }

  const xhsRequested = input.requestedOutputs.includes('xiaohongshu');
  const xhsMode = input.xiaohongshu?.latestVersion.body.contentMode ?? effectiveMode;
  const opinionReady =
    xhsMode !== 'creator_led' || Boolean(input.opinion?.confirmedVersionId && !input.opinion.outdated);
  let xiaohongshuView: WorkspaceStageView;
  if (!xhsRequested) {
    xiaohongshuView = view('blocked', '启用小红书输出', '此项目尚未请求小红书输出。');
  } else if (!researchCurrent) {
    xiaohongshuView = view('blocked', '批准当前研究', '小红书需要当前有效的已批准研究。');
  } else if (!opinionReady) {
    xiaohongshuView = view('blocked', '确认当前观点', '创作者主导的小红书内容需要绑定当前研究的观点。');
  } else if (!input.xiaohongshu) {
    xiaohongshuView = view('ready', '生成小红书候选', '当前内容基础已经就绪。');
  } else {
    const status = candidateStatus(input.xiaohongshu);
    xiaohongshuView =
      status === 'outdated'
        ? view('outdated', '生成新版小红书候选', '当前候选仍绑定旧的已批准依赖。')
        : status === 'approved'
          ? view('approved', '导出 post.md 与 pages.json', '当前精确小红书版本已批准且依赖有效。')
          : view('in_review', '审核小红书候选', '保存当前草稿，保存为不可变版本，再由你批准。');
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
  const nounLabel = noun === 'Research' ? '研究' : noun === 'Blog' ? '文章' : '小红书';
  if (!resource) {
    return {
      id: 'generate',
      label: `生成${nounLabel}候选`,
      reason: active ? `基于当前已批准依赖创建第一份${nounLabel}候选。` : '已归档项目为只读。',
      disabled: !active || busy,
    };
  }
  if (resource.reviewCandidateOutdated) {
    return {
      id: 'refresh',
      label: `生成新版${nounLabel}候选`,
      reason: dirty ? '替换旧候选前，请先保存或放弃本地草稿。' : '已批准依赖发生变化。',
      disabled: !active || busy || dirty,
    };
  }
  if (dirty) {
    return {
      id: 'save',
      label: '保存修改',
      reason: '当前草稿与上次保存的版本不同。',
      disabled: !active || busy,
    };
  }
  if (resource.workingCopy.checkpointedRevision !== resource.workingCopy.revision) {
    return {
      id: 'checkpoint',
      label: '保存为版本',
      reason: '草稿已保存；批准前请把当前内容保存为不可变版本。',
      disabled: !active || busy,
    };
  }
  if (resource.approvedVersionId !== resource.latestVersion.id) {
    return {
      id: 'approve',
      label: '批准此版本',
      reason: '当前不可变版本已满足人工批准条件。',
      disabled: !active || busy,
    };
  }
  if (input.exportLabel) {
    return {
      id: 'export',
      label: input.exportLabel,
      reason: '当前精确版本已批准且依赖有效。',
      disabled: busy || resource.outdated,
    };
  }
  return {
    id: 'complete',
    label: '已批准且有效',
    reason: '当前精确版本没有待处理审核动作。',
    disabled: true,
  };
}

export function candidatePresentationStatus(resource: CandidateResource | null, dirty: boolean): WorkspaceStageStatus {
  return resource ? candidateStatus(resource, dirty) : 'ready';
}
