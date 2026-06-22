'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Package, Settings, LayoutDashboard } from 'lucide-react';

interface AdminShellProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/inventory', label: 'Inventory', icon: Package },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="shell-admin-layout" data-admin-layout data-theme="dark">
      <header className="shell-admin-header">
        <div className="shell-admin-bar">
          <div className="shell-admin-bar__group">
            <div className="shell-admin-brand-mark">
              <LayoutDashboard className="h-4 w-4" />
            </div>
            <h1 className="shell-admin-heading">Oando Admin Platform</h1>
          </div>
          <div className="shell-admin-link">Admin Portal</div>
        </div>
      </header>
      <div className="shell-admin-frame">
        <aside className="shell-admin-sidebar">
          <nav className="shell-admin-sidebar__nav">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shell-admin-nav-link ${
                    active ? "shell-admin-nav-link--active" : ""
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="shell-admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}
