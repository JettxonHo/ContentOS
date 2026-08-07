import type { SourceListItemResource, UrlCaptureIntakeResource } from '@contentos/contracts';

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
      return 'Pasted text';
    case 'uploaded_text':
      return 'Uploaded text';
    case 'public_url':
      return 'Public URL';
  }
}

export function intakeFailureCopy(intake: Extract<UrlCaptureIntakeResource, { readonly status: 'failed' }>): string {
  switch (intake.failure.category) {
    case 'validation_blocked':
    case 'redirect_blocked':
      return 'This URL could not be captured safely.';
    case 'unsupported_content':
      return 'This URL did not provide a supported text format.';
    case 'too_large':
      return 'This URL was too large to capture.';
    case 'timeout':
      return 'This URL did not finish capturing in time.';
    case 'package_archived':
      return 'This package was archived before capture could finish.';
    case 'source_role_limit':
      return 'This URL could not create a Source because the role is full.';
    case 'object_integrity_failed':
    case 'extraction_failed':
    case 'fetch_failed':
      return 'This URL could not be captured.';
  }
}
