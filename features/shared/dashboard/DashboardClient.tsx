"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import { PLANNER_GUEST_COOKIE } from "@/lib/auth/constants";
import { createClient } from "@/lib/supabase/client";
import { GlobalNavHeader } from "@/features/shared/shell/GlobalNavHeader";
import {
  WORKSPACE_HUB_SECTIONS,
  canAccessWorkspaceItem,
  type WorkspaceHubItem,
} from "./workspaceHub";

interface DashboardClientProps {
  userEmail: string;
  isAdmin: boolean;
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

function HubCard({
  item,
  enabled,
}: {
  item: WorkspaceHubItem;
  enabled: boolean;
}) {
  const Icon = item.icon;
  const className =
    "workspace-hub-card group flex h-full flex-col rounded-[1.35rem] border p-5 transition-[border-color,box-shadow,transform] duration-200";

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          className="workspace-hub-card__icon inline-flex h-10 w-10 items-center justify-center rounded-xl"
          aria-hidden
        >
          <Icon size={18} />
        </span>
        {!enabled ? (
          <span className="workspace-hub-card__lock inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.08em]">
            <Lock size={10} aria-hidden />
            Admin
          </span>
        ) : (
          <ArrowRight
            size={16}
            className="workspace-hub-card__arrow shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden
          />
        )}
      </div>
      <h3 className="workspace-hub-card__title mt-4 text-base font-semibold tracking-tight">{item.label}</h3>
      <p className="workspace-hub-card__desc mt-2 flex-1 text-sm leading-6">{item.description}</p>
      {enabled ? (
        <span className="workspace-hub-card__cta mt-4 text-xs font-bold uppercase tracking-[0.1em]">Open</span>
      ) : (
        <span className="workspace-hub-card__locked mt-4 text-xs leading-5">
          Your account does not have admin access.
        </span>
      )}
    </>
  );

  if (!enabled) {
    return (
      <div className={`${className} workspace-hub-card--locked`} aria-disabled="true">
        {inner}
      </div>
    );
  }

  return (
    <Link href={item.href} className={`${className} workspace-hub-card--link`}>
      {inner}
    </Link>
  );
}

export function DashboardClient({ userEmail, isAdmin }: DashboardClientProps) {
  const router = useRouter();
  const [plannerDraftCount, setPlannerDraftCount] = useState(0);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => setPlannerDraftCount(readPlannerDraftCount()));
  }, []);

  const plannerSummary = useMemo(
    () =>
      plannerDraftCount > 0
        ? `${plannerDraftCount} local planner draft${plannerDraftCount === 1 ? "" : "s"} ready to resume.`
        : "No local planner drafts yet — open the canvas to start a layout.",
    [plannerDraftCount],
  );

  const accessibleCount = useMemo(
    () =>
      WORKSPACE_HUB_SECTIONS.reduce(
        (total, section) =>
          total + section.items.filter((item) => canAccessWorkspaceItem(item.access, isAdmin)).length,
        0,
      ),
    [isAdmin],
  );

  async function handleSignOut() {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    document.cookie = `${PLANNER_GUEST_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
    router.replace("/access");
    router.refresh();
  }

  return (
    <section className="workspace-hub min-h-screen">
      <GlobalNavHeader />

      <div className="workspace-hub__frame mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-8">
        <header className="workspace-hub__hero rounded-[2rem] border p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="workspace-hub__eyebrow text-[11px] font-semibold uppercase tracking-[0.3em]">
                Workspace hub
              </p>
              <h1 className="workspace-hub__title mt-4 text-4xl font-semibold tracking-tight">
                One dashboard for every tool
              </h1>
              <p className="workspace-hub__lead mt-4 text-sm leading-7 sm:text-base">
                Signed in as <strong>{userEmail}</strong>. {plannerSummary} Pick any destination below — planner,
                CRM, and admin use the same sign-in.
              </p>
              <p className="workspace-hub__meta mt-3 text-xs">
                {accessibleCount} destinations available
                {isAdmin ? " · admin access enabled" : " · admin tools shown but locked"}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/planner/canvas" className="workspace-hub__primary-btn rounded-full px-5 py-3 text-sm font-semibold">
                Open planner
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="workspace-hub__ghost-btn rounded-full border px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSigningOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>
        </header>

        {WORKSPACE_HUB_SECTIONS.map((section) => (
          <section key={section.title} className="workspace-hub__section" aria-labelledby={`hub-${section.title}`}>
            <header className="workspace-hub__section-header mb-4">
              <h2 id={`hub-${section.title}`} className="workspace-hub__section-title text-lg font-semibold tracking-tight">
                {section.title}
              </h2>
              <p className="workspace-hub__section-copy mt-1 text-sm">{section.summary}</p>
            </header>
            <div className="workspace-hub__grid grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {section.items.map((item) => (
                <HubCard
                  key={item.href}
                  item={item}
                  enabled={canAccessWorkspaceItem(item.access, isAdmin)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
