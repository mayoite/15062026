"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Check } from "lucide-react";

import { PlannerBreadcrumbs } from "./PlannerBreadcrumbs";
import { PlannerFeatureDemo } from "./PlannerFeatureDemo";
import {
  PLANNER_FEATURE_BY_SLUG,
  PLANNER_FEATURE_PAGES,
  isPlannerFeatureSlug,
  type PlannerFeatureSlug,
} from "./plannerFeaturePages";
import { PLANNER_HERO } from "./plannerLandingData";



export function PlannerFeaturePageView({ slug }: { slug: PlannerFeatureSlug }) {
  const feature = PLANNER_FEATURE_BY_SLUG[slug];
  const Icon = feature.icon;
  const related = feature.relatedSlugs
    .filter(isPlannerFeatureSlug)
    .map((relatedSlug) => PLANNER_FEATURE_BY_SLUG[relatedSlug]);
  const index = PLANNER_FEATURE_PAGES.findIndex((page) => page.slug === slug);
  const previous = PLANNER_FEATURE_PAGES[index - 1];
  const next = PLANNER_FEATURE_PAGES[index + 1];

  return (
    <div className="scheme-page min-h-screen">
      <div className="home-shell-xl section-y-sm">
        <PlannerBreadcrumbs
          items={[
            { label: "Planner", href: "/planner/" },
            { label: "Features", href: "/planner/features/" },
            { label: feature.title },
          ]}
        />

        <header className="grid items-center gap-10 border-b border-theme-soft pb-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <div className="scheme-accent-wash mb-6 flex h-14 w-14 items-center justify-center rounded-2xl text-[color:var(--color-accent-strong)]">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="typ-eyebrow text-[color:var(--color-bronze-500)]">{feature.tagline}</p>
            <h1 className="home-heading mt-3">{feature.title}</h1>
            <p className="page-copy-sm mt-4 text-muted">{feature.summary}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={feature.tryPath}
                className="btn-primary typ-cta inline-flex items-center gap-2 px-6 py-3"
              >
                {PLANNER_HERO.primaryCta.label}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href={feature.memberPath} className="btn-outline typ-cta px-6 py-3">
                {PLANNER_HERO.secondaryCta.label}
              </Link>
            </div>
            <Link
              href={`/planner/help/#${feature.helpSectionId}`}
              className="pfp-card-link typ-label mt-5 inline-flex"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Read the help article
            </Link>
          </div>
          <PlannerFeatureDemo slug={slug} />
        </header>

        <section aria-labelledby="feature-capabilities" className="py-12">
          <h2 id="feature-capabilities" className="typ-subsection-title">
            What you can <span className="text-accent-italic">do</span>
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {feature.bullets.map((bullet) => (
              <li key={bullet} className="shell-card flex items-start gap-3 p-5">
                <span
                  className="scheme-accent-wash mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[color:var(--color-accent-strong)]"
                  aria-hidden="true"
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="page-copy-sm text-muted">{bullet}</span>
              </li>
            ))}
          </ul>
        </section>

        {related.length > 0 && (
          <section aria-labelledby="feature-related" className="border-t border-theme-soft py-12">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <h2 id="feature-related" className="typ-subsection-title">
                Works well <span className="text-accent-italic">with</span>
              </h2>
              <Link
                href="/planner/features/"
                className="typ-label inline-flex shrink-0 items-center gap-2 text-muted transition-colors hover:text-strong"
              >
                View all features
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {related.map((item) => {
                const RelatedIcon = item.icon;
                return (
                  <Link key={item.slug} href={`/planner/features/${item.slug}/`} className="pfp-card group">
                    <div className="flex items-center gap-3">
                      <span className="scheme-accent-wash flex h-10 w-10 items-center justify-center rounded-xl text-[color:var(--color-accent-strong)]">
                        <RelatedIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="typ-eyebrow text-muted">{item.tagline}</p>
                        <h3 className="typ-h3 mt-0.5 text-strong">{item.title}</h3>
                      </div>
                    </div>
                    <p className="page-copy-sm text-muted">{item.summary}</p>
                    <span className="typ-label inline-flex items-center gap-1.5 text-[color:var(--color-bronze-500)] transition-all group-hover:gap-2.5">
                      Learn more
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <nav aria-label="Feature pages" className="flex flex-wrap justify-between gap-3 border-t border-theme-soft py-8">
          {previous ? (
            <Link href={`/planner/features/${previous.slug}/`} className="pfp-card-link typ-label">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {previous.title}
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}
          {next && (
            <Link href={`/planner/features/${next.slug}/`} className="pfp-card-link typ-label">
              {next.title}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </nav>

        <section aria-labelledby="feature-cta">
          <div className="shell-dark-cta-panel flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 id="feature-cta" className="typ-subsection-title text-inverse">
                {PLANNER_HERO.bottomCta.title}
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={feature.tryPath} className="btn-primary typ-cta px-6 py-3">
                {PLANNER_HERO.primaryCta.label}
              </Link>
              <Link href={feature.memberPath} className="btn-outline-light typ-cta px-6 py-3">
                {PLANNER_HERO.secondaryCta.label}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
