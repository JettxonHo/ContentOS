import type { SourceListItemResource, SourceResource, UrlCaptureIntakeResource } from '@contentos/contracts';

export type SourceIntakeRole = 'primary' | 'supporting';

export interface SourceIntakeView {
  readonly primary: { readonly used: number; readonly limit: 1; readonly available: boolean };
  readonly supporting: { readonly used: number; readonly limit: 5; readonly available: boolean };
  readonly intake: UrlCaptureIntakeResource | null;
  readonly visibleSources: readonly SourceListItemResource[];
  readonly formalSourcesAvailable: boolean;
  readonly showIntakeActivity: boolean;
}

export type UrlSubmissionConfirmation = 'idle' | 'confirming' | 'confirmed';

export interface SourceTablePresentation {
  readonly label: '已批准' | '待审核' | '当前草稿';
  readonly action: '查看' | '审核' | '继续编辑';
  readonly updatedAt: string;
}

export function sourceTablePresentation(
  source: SourceListItemResource,
  detail: SourceResource | undefined,
): SourceTablePresentation {
  if (!detail) return { label: '待审核', action: '审核', updatedAt: source.createdAt };
  const pendingVersion =
    detail.reviewCandidateVersionId !== null && detail.reviewCandidateVersionId !== detail.approvedVersionId;
  const unapprovedLatest = detail.latestVersionId !== null && detail.latestVersionId !== detail.approvedVersionId;
  if (pendingVersion || unapprovedLatest) {
    return { label: '待审核', action: '审核', updatedAt: detail.workingCopy.updatedAt };
  }
  if (detail.approvedVersionId !== null && detail.latestVersionId === detail.approvedVersionId) {
    return { label: '已批准', action: '查看', updatedAt: detail.workingCopy.updatedAt };
  }
  return { label: '当前草稿', action: '继续编辑', updatedAt: detail.workingCopy.updatedAt };
}

export class SourceRefreshCoordinator<T> {
  private pending = false;
  private active: Promise<T | undefined> | null = null;
  private disposed = false;

  constructor(
    private readonly load: () => Promise<T>,
    private readonly commit: (value: T) => void,
  ) {}

  request(): Promise<T | undefined> {
    if (this.disposed) return Promise.resolve(undefined);
    this.pending = true;
    this.active ??= this.run();
    return this.active;
  }

  dispose(): void {
    this.disposed = true;
    this.pending = false;
  }

  private async run(): Promise<T | undefined> {
    let latest: T | undefined;
    try {
      while (this.pending && !this.disposed) {
        this.pending = false;
        const value = await this.load();
        if (this.disposed) return latest;
        latest = value;
        this.commit(value);
      }
      return latest;
    } finally {
      this.active = null;
    }
  }
}

export function reconcileUrlSubmission(
  _current: UrlSubmissionConfirmation,
  intakes: readonly UrlCaptureIntakeResource[],
): UrlSubmissionConfirmation {
  return intakes.length === 0 ? 'idle' : 'confirmed';
}

function intakeReserves(role: SourceIntakeRole, intake: UrlCaptureIntakeResource | null): boolean {
  return intake !== null && (intake.status === 'queued' || intake.status === 'running') && intake.role === role;
}

export function sourceIntakeView(
  sources: readonly SourceListItemResource[] | null,
  intakes: readonly UrlCaptureIntakeResource[],
): SourceIntakeView {
  const intake = intakes[0] ?? null;
  const visibleSources = sources ?? [];
  const formalSourcesAvailable = sources !== null;
  const exactSucceededSourceVisible =
    intake?.status === 'succeeded' && sources?.some((source) => source.id === intake.sourceId) === true;
  const used = (role: SourceIntakeRole): number =>
    visibleSources.filter((source) => source.role === role).length + (intakeReserves(role, intake) ? 1 : 0);
  const primaryUsed = used('primary');
  const supportingUsed = used('supporting');
  return {
    primary: { used: primaryUsed, limit: 1, available: primaryUsed < 1 },
    supporting: { used: supportingUsed, limit: 5, available: supportingUsed < 5 },
    intake,
    visibleSources,
    formalSourcesAvailable,
    showIntakeActivity: intake !== null && !exactSucceededSourceVisible,
  };
}

export function sourceTypeLabel(source: SourceListItemResource): string {
  switch (source.sourceType) {
    case 'pasted_text':
      return '粘贴文本';
    case 'uploaded_text':
      return '上传文件';
    case 'public_url':
      return '网页链接';
  }
}

export function intakeFailureCopy(intake: Extract<UrlCaptureIntakeResource, { readonly status: 'failed' }>): string {
  switch (intake.failure.category) {
    case 'validation_blocked':
    case 'redirect_blocked':
      return '该 URL 未通过安全抓取校验。';
    case 'unsupported_content':
      return '该 URL 未提供受支持的文本格式。';
    case 'too_large':
      return '该 URL 内容过大，无法抓取。';
    case 'timeout':
      return '该 URL 未能在规定时间内完成抓取。';
    case 'package_archived':
      return '抓取完成前，当前项目已归档。';
    case 'source_role_limit':
      return '该资料用途已满，无法创建资料。';
    case 'object_integrity_failed':
    case 'extraction_failed':
    case 'fetch_failed':
      return '该 URL 无法完成抓取。';
  }
}
