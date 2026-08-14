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
  meta,
}: {
  readonly status: WorkspaceStageStatus;
  readonly label: string;
  readonly reason: string;
  readonly actionLabel?: string;
  readonly disabled?: boolean;
  readonly disabledReason?: string;
  readonly busy?: boolean;
  readonly onAction?: (() => void) | undefined;
  readonly meta?: readonly { readonly label: string; readonly value: string }[];
}) {
  const explanationId = `next-action-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <aside className={`next-action-card status-${status}`} aria-labelledby={`${explanationId}-title`}>
      <div className="next-action-heading">
        <p className="eyebrow">当前状态</p>
        <span className="stage-status-label">{label}</span>
      </div>
      <h3 id={`${explanationId}-title`}>{actionLabel ?? '当前无需操作'}</h3>
      <p id={explanationId}>{disabled && disabledReason ? disabledReason : reason}</p>
      {meta?.length ? (
        <dl className="context-facts">
          {meta.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {onAction && actionLabel ? (
        <button
          className="primary-button next-action-button"
          type="button"
          aria-describedby={explanationId}
          disabled={disabled || busy}
          onClick={onAction}
        >
          {busy ? '处理中…' : actionLabel}
        </button>
      ) : null}
    </aside>
  );
}
