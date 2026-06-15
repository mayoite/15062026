"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Shared navigation header for authenticated suite surfaces.
 *
 * Renders the suite logo and downstream navigation links with
 * aria-current="page" on the active route. Keep this component in shared
 * ownership so dashboard, portal, CRM, and admin shells do not depend on a
 * product feature module.
 */
export function GlobalNavHeader() {
  const pathname = usePathname();

  const isPortal = pathname?.startsWith("/portal");
  const isClients = pathname?.startsWith("/crm/clients");
  const isProjects = pathname?.startsWith("/crm/projects");
  const isQuotes = pathname?.startsWith("/crm/quotes");
  const isAdmin = pathname?.startsWith("/admin");
  const isDashboard =
    !isPortal &&
    !isClients &&
    !isProjects &&
    !isQuotes &&
    !isAdmin &&
    (pathname === "/oando-planner/dashboard" ||
      pathname === "/oando-planner/dashboard/" ||
      pathname === "/dashboard" ||
      pathname === "/dashboard/");

  return (
    <header
      className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-4 border-b px-4 backdrop-blur-md sm:px-6"
      style={{
        borderColor: "var(--border-soft)",
        background: "rgba(255, 255, 255, 0.92)",
      }}
    >
      <Link
        href="/dashboard"
        className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90"
        aria-label="One&Only workspace - Go to dashboard"
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{
            background: "var(--color-primary)",
          }}
        >
          <span className="text-[10px] font-bold tracking-tight text-white">
            O&amp;O
          </span>
        </div>
        <span
          className="hidden text-[15px] font-semibold tracking-tight sm:inline"
          style={{ color: "var(--text-strong)" }}
        >
          One&amp;Only Suite
        </span>
      </Link>

      <div className="flex-1" />

      <nav className="flex items-center gap-1" aria-label="Main navigation">
        {[
          { label: "Dashboard", href: "/dashboard", active: isDashboard },
          {
            label: "Choose Product",
            href: "/choose-product",
            active: pathname === "/choose-product",
          },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={link.active ? "page" : undefined}
            className="rounded-lg px-3 py-2 text-[13px] transition-colors"
            style={{
              color: link.active ? "var(--color-primary)" : "var(--text-body)",
              fontWeight: link.active ? 600 : 400,
              background: link.active ? "var(--surface-soft)" : "transparent",
            }}
          >
            {link.label}
          </Link>
        ))}

        <div
          className="mx-2 h-5 w-px shrink-0"
          style={{ background: "var(--border-soft)" }}
          aria-hidden="true"
        />

        {[
          { label: "Portal", href: "/portal", active: isPortal },
          { label: "Clients", href: "/crm/clients", active: isClients },
          { label: "Projects", href: "/crm/projects", active: isProjects },
          { label: "Quotes", href: "/crm/quotes", active: isQuotes },
          { label: "Admin", href: "/admin", active: isAdmin },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={link.active ? "page" : undefined}
            className="rounded-lg px-2.5 py-1.5 text-[12px] transition-colors"
            style={{
              color: link.active ? "var(--color-primary)" : "var(--text-soft, var(--text-body))",
              fontWeight: link.active ? 600 : 400,
              opacity: link.active ? 1 : 0.65,
              background: link.active ? "var(--surface-soft)" : "transparent",
            }}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
