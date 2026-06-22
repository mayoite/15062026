"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, ExternalLink, Menu, X } from "lucide-react";
import { OneAndOnlyLogo } from "@/components/ui/Logo";
import { ADMIN_NAV_GROUPS } from "./adminNav";

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin" || pathname === "/admin/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="shell-admin-layout" data-admin-layout data-theme="light">
      <header className="shell-admin-header shell-admin-header--brand">
        <div className="shell-admin-bar shell-admin-bar--brand">
          <div className="shell-admin-bar__group">
            <button
              type="button"
              className="shell-admin-mobile-toggle md:hidden"
              onClick={() => setMobileOpen((open) => !open)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <Link href="/admin" className="shell-admin-brand" onClick={() => setMobileOpen(false)}>
              <OneAndOnlyLogo variant="white" className="h-7 w-auto" />
              <span className="shell-admin-brand__badge">Admin</span>
            </Link>
          </div>
          <div className="shell-admin-bar__actions">
            <Link href="/" className="shell-admin-header-link">
              View site
              <ArrowUpRight size={14} aria-hidden />
            </Link>
            <Link href="/planner/guest" className="shell-admin-header-cta">
              Open planner
              <ExternalLink size={14} aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      <div className="shell-admin-frame">
        <aside
          className={`shell-admin-sidebar ${mobileOpen ? "shell-admin-sidebar--open" : ""}`}
          aria-label="Admin navigation"
        >
          <nav className="shell-admin-sidebar__nav">
            {ADMIN_NAV_GROUPS.map((group) => (
              <div key={group.title} className="shell-admin-nav-group">
                <p className="shell-admin-nav-group__title">{group.title}</p>
                {group.items.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.description}
                      onClick={() => setMobileOpen(false)}
                      className={`shell-admin-nav-link${active ? " shell-admin-nav-link--active" : ""}`}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="shell-admin-nav-link__icon" aria-hidden>
                        <Icon size={16} />
                      </span>
                      <span className="shell-admin-nav-link__label">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
          <footer className="shell-admin-sidebar__footer">
            <p className="shell-admin-sidebar__footnote">O&amp;O workspace platform</p>
          </footer>
        </aside>

        {mobileOpen ? (
          <button
            type="button"
            className="shell-admin-sidebar-backdrop md:hidden"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}

        <div className="shell-admin-main min-w-0">{children}</div>
      </div>
    </div>
  );
}
