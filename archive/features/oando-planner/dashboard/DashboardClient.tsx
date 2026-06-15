"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GlobalNavHeader } from "@/features/shared/shell/GlobalNavHeader";
import { getSubmittedQuotes } from "@/features/oando-planner/lib/quoteSubmission";
import { createClient } from "@/lib/supabase/client";
import {
  type SavedPlanSnapshot,
  getSavedPlanSnapshots,
} from "@/features/oando-planner/lib/projectIndex";

interface DashboardClientProps {
  userEmail: string;
}

export function DashboardClient({ userEmail }: DashboardClientProps) {
  const router = useRouter();
  const [plans, setPlans] = useState<SavedPlanSnapshot[]>([]);
  const [quoteCount, setQuoteCount] = useState(0);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
// eslint-disable-next-line react-hooks/set-state-in-effect
    setPlans(getSavedPlanSnapshots());
    setQuoteCount(getSubmittedQuotes().length);
  }, []);

  const totalFurniture = useMemo(
    () => plans.reduce((sum, plan) => sum + plan.furniture.length, 0),
    [plans],
  );
  const totalRooms = useMemo(
    () => plans.reduce((sum, plan) => sum + plan.rooms.length, 0),
    [plans],
  );
  const latestPlan = useMemo(
    () =>
      [...plans]
        .filter((plan) => plan.savedAt)
        .sort((a, b) => b.savedAt.localeCompare(a.savedAt))[0] ?? null,
    [plans],
  );

  async function handleSignOut() {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/oando-planner/login");
    router.refresh();
  }

  return (
    <section className="shell-workspace-page">
      <GlobalNavHeader />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-8">
        <div className="shell-workspace-hero flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="shell-workspace-eyebrow text-[11px] font-semibold uppercase tracking-[0.32em]">
              Workspace Dashboard
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">
              Keep planning, review, and portal handoff in one flow.
            </h1>
            <p className="shell-workspace-muted mt-4 max-w-2xl text-sm leading-7">
              Signed in as {userEmail}. Launch the planner, review saved local
              sessions, and move approved concepts into the client-facing
              portal from a single admin workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/oando-planner/canvas"
              className="btn-primary"
            >
              Open Planner
            </Link>
            <Link
              href="/admin"
              className="btn-outline-light"
            >
              Open Admin
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="btn-outline-light disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSigningOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Saved plans", value: plans.length.toString() },
            { label: "Quoted projects", value: quoteCount.toString() },
            { label: "Mapped rooms", value: totalRooms.toString() },
            { label: "Placed items", value: totalFurniture.toString() },
          ].map((stat) => (
            <article
              key={stat.label}
              className="shell-workspace-card"
            >
              <p className="shell-workspace-faint text-[11px] font-semibold uppercase tracking-[0.26em]">
                {stat.label}
              </p>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-white">
                {stat.value}
              </p>
            </article>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="shell-workspace-panel">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="shell-workspace-eyebrow text-[11px] font-semibold uppercase tracking-[0.26em]">
                  Recent Plan Activity
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  Saved workspace sessions
                </h2>
              </div>
              <Link href="/portal" className="shell-workspace-link text-sm">
                Open portal
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {plans.length ? (
                plans
                  .slice()
                  .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
                  .slice(0, 5)
                  .map((plan) => (
                    <article
                      key={plan.id}
                      className="shell-workspace-row flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{plan.name}</p>
                        <p className="shell-workspace-subtle mt-1 text-xs">
                          {plan.savedAt
                            ? new Date(plan.savedAt).toLocaleString()
                            : "Saved locally"}
                        </p>
                      </div>
                      <div className="shell-workspace-subtle text-right text-xs">
                        <p>{plan.rooms.length} rooms</p>
                        <p>{plan.furniture.length} items</p>
                      </div>
                    </article>
                  ))
              ) : (
                <div className="shell-workspace-row border-dashed px-5 py-8 text-sm leading-7 shell-workspace-muted">
                  No saved planner sessions yet. Open the planner, create a
                  layout, and your local workspace activity will appear here.
                </div>
              )}
            </div>
          </section>

          <section className="shell-workspace-panel">
            <p className="shell-workspace-eyebrow text-[11px] font-semibold uppercase tracking-[0.26em]">
              Workspace Shortcuts
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              Continue where the team left off
            </h2>

            <div className="mt-6 space-y-3">
              {[
                {
                  href: "/oando-planner/canvas",
                  title: "Planner editor",
                  description: "Jump straight into drafting, 3D review, and furniture placement.",
                },
                {
                  href: "/portal",
                  title: "Client portal",
                  description: "Review published plans and customer-facing shared views.",
                },
                {
                  href: "/admin",
                  title: "Admin operations",
                  description: "Manage feature flags, plans, catalog, and planner analytics.",
                },
                {
                  href: "/planning",
                  title: "Planning services",
                  description: "Reference the planning workflow and deliverables while scoping work.",
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="shell-workspace-row block transition hover:border-white/20"
                >
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="shell-workspace-muted mt-1 text-sm leading-6">
                    {item.description}
                  </p>
                </Link>
              ))}
            </div>

            <div className="shell-workspace-callout mt-6 text-sm leading-6">
              {latestPlan ? (
                <>
                  Latest saved plan:{" "}
                  <span className="font-semibold text-white">{latestPlan.name}</span>
                </>
              ) : (
                "Your latest saved plan will appear here once the first workspace draft is created."
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
