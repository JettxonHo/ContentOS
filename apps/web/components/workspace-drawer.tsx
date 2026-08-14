'use client';

import { type ReactNode, useEffect, useId, useRef } from 'react';

export function WorkspaceDrawer({
  open,
  title,
  eyebrow,
  onClose,
  children,
  footer,
  keepMounted = false,
}: {
  readonly open: boolean;
  readonly title: string;
  readonly eyebrow?: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly keepMounted?: boolean;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => !element.hidden);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const opener = openerRef.current;
      requestAnimationFrame(() => opener?.focus());
    };
  }, [open]);

  if (!open && !keepMounted) return null;
  return (
    <div
      className="drawer-backdrop"
      role="presentation"
      hidden={!open}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <aside
        ref={dialogRef}
        className="workspace-drawer"
        role="dialog"
        aria-modal={open ? 'true' : undefined}
        aria-labelledby={titleId}
      >
        <header className="drawer-header">
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h2 id={titleId}>{title}</h2>
          </div>
          <button ref={closeRef} className="icon-button" type="button" aria-label={`关闭${title}`} onClick={onClose}>
            ×
          </button>
        </header>
        <div className="drawer-body">{children}</div>
        {footer ? <footer className="drawer-footer">{footer}</footer> : null}
      </aside>
    </div>
  );
}
