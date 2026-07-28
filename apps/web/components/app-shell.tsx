'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

export function AppShell({
  children,
  onLogout,
  active,
}: {
  children: ReactNode;
  onLogout: () => void;
  active: 'dashboard' | 'workspace';
}) {
  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="ContentOS dashboard">
          <span className="brand-mark">C</span>
          <span>ContentOS</span>
        </Link>
        <nav className="primary-nav" aria-label="Primary navigation">
          <Link className={active === 'dashboard' ? 'nav-item is-active' : 'nav-item'} href="/">
            <span aria-hidden="true">⌂</span> Dashboard
          </Link>
          <span className="nav-item is-disabled" aria-disabled="true" title="Settings are not available in M1">
            <span aria-hidden="true">⚙</span> Settings <small>Later</small>
          </span>
        </nav>
        <div className="sidebar-foot">
          <div className="owner-chip">
            <span className="owner-dot" aria-hidden="true" />
            Private owner workspace
          </div>
          <button className="text-button" type="button" onClick={onLogout}>
            Log out
          </button>
        </div>
      </aside>
      <main className="main-panel">{children}</main>
    </div>
  );
}

export function StatusMessage({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'info' }) {
  return (
    <div className={`status-message ${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
