"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS } from "./adminNav";

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin" || pathname === "/admin/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";

  return (
    <div className="min-h-screen bg-subtle text-strong">
      <header className="border-b border-soft bg-panel">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-soft">Internal</p>
            <h1 className="text-lg font-semibold text-strong">Oando admin</h1>
          </div>
          <Link href="/planner/canvas" className="text-sm text-muted hover:text-strong">
            Open planner
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-0 md:gap-6">
        <aside className="hidden w-60 shrink-0 border-r border-soft bg-panel md:block">
          <nav className="sticky top-0 flex flex-col gap-1 p-4" aria-label="Admin navigation">
            {ADMIN_NAV_ITEMS.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted hover:bg-subtle hover:text-strong"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={16} className="mt-0.5 shrink-0" aria-hidden />
                  <span>
                    {item.label}
                    <span className="mt-0.5 block text-xs font-normal text-soft">{item.description}</span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
