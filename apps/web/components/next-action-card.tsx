import type { WorkspaceStageStatus } from '../lib/workspace-stage-view';

export function NextActionCard({
  status,
  label,
  reason,
  actionLabel,
  disabled = false,
  disabledReason,
  busy = false,
  onAction,
}: {
  readonly status: WorkspaceStageStatus;
  readonly label: string;
  readonly reason: string;
  readonly actionLabel?: string;
  readonly disabled?: boolean;
  readonly disabledReason?: string;
  readonly busy?: boolean;
  readonly onAction?: (() => void) | undefined;
}) {
  const explanationId = `next-action-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <aside className={`next-action-card status-${status}`} aria-labelledby={`${explanationId}-title`}>
      <div className="next-action-heading">
        <p className="eyebrow">Current state</p>
        <span className="stage-status-label">{label}</span>
      </div>
      <h3 id={`${explanationId}-title`}>{actionLabel ?? 'No action required'}</h3>
      <p id={explanationId}>{disabled && disabledReason ? disabledReason : reason}</p>
      {onAction && actionLabel ? (
        <button
          className="primary-button next-action-button"
          type="button"
          aria-describedby={explanationId}
          disabled={disabled || busy}
          onClick={onAction}
        >
          {busy ? 'Working…' : actionLabel}
        </button>
      ) : null}
    </aside>
  );
}
