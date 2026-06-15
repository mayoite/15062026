"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PLANNER_GUEST_COOKIE } from "@/lib/auth/constants";
import { createClient } from "@/lib/supabase/client";
import { GlobalNavHeader } from "@/features/shared/shell/GlobalNavHeader";

interface DashboardClientProps {
  userEmail: string;
}

function readPlannerDraftCount(): number {
  if (typeof window === "undefined") return 0;

  try {
    const raw = window.localStorage.getItem("planner_project_index");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export function DashboardClient({ userEmail }: DashboardClientProps) {
  const router = useRouter();
  const [plannerDraftCount, setPlannerDraftCount] = useState(0);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
// eslint-disable-next-line react-hooks/set-state-in-effect
    setPlannerDraftCount(readPlannerDraftCount());
  }, []);

  const plannerSummary = useMemo(
    () =>
      plannerDraftCount > 0
        ? `${plannerDraftCount} saved local planner session${plannerDraftCount === 1 ? "" : "s"} ready to resume.`
        : "No saved local planner sessions yet. Start a layout and the workspace will begin tracking resumable drafts.",
    [plannerDraftCount],
  );

  async function handleSignOut() {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    document.cookie = `${PLANNER_GUEST_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
    router.replace("/access");
    router.refresh();
  }

  const cards = [
    {
      title: "Planner",
      eyebrow: "Spatial planning",
      href: "/planner",
      action: "Open planner",
      summary: plannerSummary,
      status: plannerDraftCount > 0 ? "Recent work available" : "Ready for first draft",
    }
  ] as const;

  return (
    <section className="min-h-screen" style={{ background: "linear-gradient(180deg, var(--surface-soft) 0%, var(--surface-page) 48%, var(--surface-muted) 100%)" }}>
      <GlobalNavHeader />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8">
        <div className="flex flex-col gap-5 rounded-[2rem] border p-8 lg:flex-row lg:items-end lg:justify-between" style={{ borderColor: "var(--border-soft)", background: "var(--overlay-panel-95)", boxShadow: "var(--shadow-panel)" }}>
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-accent-strong)" }}>
              Suite workspace
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight" style={{ color: "var(--text-heading)" }}>
              Launch the unified planner from one neutral shell.
            </h1>
            <p className="mt-4 text-sm leading-7 sm:text-base" style={{ color: "var(--text-muted)" }}>
              Signed in as {userEmail}. Choose the active product first, then move into Portal, CRM, or Admin from authenticated navigation instead of from the public front door.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/choose-product" className="rounded-full px-5 py-3 text-sm font-semibold" style={{ background: "var(--color-primary)", color: "var(--text-inverse)" }}>
              Choose product
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="rounded-full border px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              style={{ borderColor: "var(--border-soft)", color: "var(--text-body)", background: "var(--surface-page)" }}
            >
              {isSigningOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {cards.map((card) => (
            <article
              key={card.title}
              className="rounded-[2rem] border p-7"
              style={{
                borderColor: "var(--border-soft)",
                background: "var(--overlay-panel-92)",
                boxShadow: "var(--shadow-soft)",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--color-primary)" }}>
                    {card.eyebrow}
                  </p>
                  <h2 className="mt-4 text-3xl font-semibold tracking-tight" style={{ color: "var(--text-heading)" }}>
                    {card.title}
                  </h2>
                </div>
                <span className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]" style={{ background: "var(--surface-soft)", color: "var(--text-subtle)" }}>
                  {card.status}
                </span>
              </div>
              <p className="mt-5 text-sm leading-7" style={{ color: "var(--text-muted)" }}>
                {card.summary}
              </p>
              <div className="mt-8">
                <Link href={card.href} className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
                  {card.action} →
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_1fr_1fr]">
          {[
            {
              title: "Portal",
              body: "Logged-in review surface for member plan review and shared project context. It stays outside the chooser.",
              href: "/portal",
            },
            {
              title: "CRM",
              body: "Internal-only clients, projects, and quotes. Kept low-prominence inside the authenticated shell.",
              href: "/crm/clients",
            },
            {
              title: "Admin",
              body: "Internal oversight, flags, and catalog operations. Available downstream without crowding the front door.",
              href: "/admin",
            },
          ].map((item) => (
            <article key={item.title} className="rounded-[1.6rem] border p-6" style={{ borderColor: "var(--border-soft)", background: "var(--surface-page)" }}>
              <h3 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-heading)" }}>
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7" style={{ color: "var(--text-muted)" }}>
                {item.body}
              </p>
              <Link href={item.href} className="mt-5 inline-block text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
                Open {item.title} →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
