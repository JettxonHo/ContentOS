'use client';

import Link from 'next/link';
import { type ReactNode, useState } from 'react';

import { UI_COPY } from '../lib/ui-copy';

export function AppShell({
  children,
  onLogout,
  active,
}: {
  children: ReactNode;
  onLogout: () => void;
  active: 'dashboard' | 'workspace';
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className={collapsed ? 'app-frame rail-collapsed' : 'app-frame'}>
      <aside className="sidebar">
        <div className="brand-row">
          <Link className="brand" href="/" aria-label="ContentOS 工作台">
            <span className="brand-mark">C</span>
            <span className="rail-label">ContentOS</span>
          </Link>
          <button
            className="rail-toggle"
            type="button"
            aria-label={collapsed ? '展开全局导航' : '收起全局导航'}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>
        <nav className="primary-nav" aria-label="全局导航">
          <Link className="nav-item is-active" href="/" aria-current={active === 'dashboard' ? 'page' : undefined}>
            <span aria-hidden="true">⌂</span> <span className="rail-label">{UI_COPY.shell.dashboard}</span>
          </Link>
          <span className="nav-item is-disabled" aria-disabled="true" title="设置暂未开放">
            <span aria-hidden="true">⚙</span> <span className="rail-label">{UI_COPY.shell.settings}</span>{' '}
            <small className="rail-label">{UI_COPY.shell.unavailable}</small>
          </span>
        </nav>
        <div className="sidebar-foot">
          <div className="owner-chip">
            <span className="owner-dot" aria-hidden="true" />
            <span className="rail-label">{UI_COPY.shell.owner}</span>
          </div>
          <button className="text-button" type="button" onClick={onLogout}>
            <span className="rail-label">{UI_COPY.shell.logout}</span>
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
