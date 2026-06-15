"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Hash, Search } from "lucide-react";

import { PlannerBreadcrumbs } from "@/features/planner/landing/PlannerBreadcrumbs";
import { isPlannerFeatureSlug } from "@/features/planner/landing/plannerFeaturePages";
import { PLANNER_HELP_SECTIONS } from "./helpSections";



export function PlannerHelpPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PLANNER_HELP_SECTIONS;
    return PLANNER_HELP_SECTIONS.filter(
      (section) =>
        section.title.toLowerCase().includes(q) ||
        section.summary.toLowerCase().includes(q) ||
        section.keywords.some((kw) => kw.includes(q)),
    );
  }, [query]);

  return (
    <div className="scheme-page min-h-screen">
      <div className="home-shell-xl section-y-sm">
        <PlannerBreadcrumbs
          items={[{ label: "Planner", href: "/planner/" }, { label: "Help" }]}
        />

        <div className="mb-10 flex flex-col gap-6 border-b border-theme-soft pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="typ-eyebrow text-[color:var(--color-bronze-500)]">Help center</p>
            <h1 className="home-heading mt-3">
              Workspace planner <span className="text-accent-italic">guide</span>
            </h1>
            <p className="page-copy-sm mt-4 text-muted">
              Everything you need to draw, furnish, measure, and export a client-ready floor plan.
            </p>
          </div>
          <div className="w-full max-w-md">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search help…"
                aria-label="Search help topics"
                className="typ-body-sm w-full rounded-full border border-soft bg-panel py-3 pl-11 pr-4 text-strong outline-none focus-ring-theme"
              />
            </div>
            <p aria-live="polite" className="typ-micro mt-2 pl-4 text-subtle">
              {filtered.length} of {PLANNER_HELP_SECTIONS.length} topics
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((section) => (
            <article key={section.id} id={section.id} className="pfp-card scroll-mt-24">
              <div className="flex items-start justify-between gap-2">
                <h2 className="typ-h3 text-strong">{section.title}</h2>
                <a
                  href={`#${section.id}`}
                  className="pfp-anchor mt-1"
                  aria-label={`Link to ${section.title}`}
                >
                  <Hash className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
              <p className="page-copy-sm text-muted">{section.summary}</p>
              <div className="pfp-card-links typ-label">
                <Link href="/planner/guest/" className="pfp-card-link">
                  Open the canvas
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                {section.featureSlug && isPlannerFeatureSlug(section.featureSlug) && (
                  <Link href={`/planner/features/${section.featureSlug}/`} className="pfp-card-link">
                    Feature page
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="page-copy-sm py-12 text-center text-muted">
            No topics match your search.{" "}
            <button
              type="button"
              onClick={() => setQuery("")}
              className="focus-ring-theme rounded font-semibold text-primary underline-offset-2 hover:underline"
            >
              Clear search
            </button>
          </p>
        )}

        <section aria-labelledby="help-cta" className="mt-16">
          <div className="shell-dark-cta-panel flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 id="help-cta" className="typ-subsection-title text-inverse">
                Ready to plan?
              </h2>
              <p className="page-copy-sm mt-2 text-inverse-body">
                Open the canvas and place your first desk in under a minute.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/planner/guest/" className="btn-primary typ-cta px-6 py-3">
                Try free
              </Link>
              <Link href="/planner/canvas/" className="btn-outline-light typ-cta px-6 py-3">
                Open planner
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
