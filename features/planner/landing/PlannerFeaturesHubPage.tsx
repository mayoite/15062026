"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import { MOTION_EASE } from "@/lib/helpers/motion";
import { PlannerBreadcrumbs } from "./PlannerBreadcrumbs";
import { PLANNER_FEATURE_PAGES } from "./plannerFeaturePages";
import { PLANNER_HERO, PLANNER_HOW_IT_WORKS, PLANNER_STEPS } from "./plannerLandingData";



export function PlannerFeaturesHubPage() {
  return (
    <div className="scheme-page min-h-screen">
      <div className="home-shell-xl section-y-sm">
        <PlannerBreadcrumbs
          items={[{ label: "Planner", href: "/planner/" }, { label: "Features" }]}
        />

        <header className="max-w-3xl border-b border-theme-soft pb-10">
          <p className="typ-eyebrow text-[color:var(--color-bronze-500)]">What you can do</p>
          <h1 className="home-heading mt-3">
            Everything you need to plan an{" "}
            <span className="text-accent-italic">office layout</span>
          </h1>
          <p className="page-copy-sm mt-4 text-muted">
            From uploading your floor plan to exporting a PDF and quote — each feature is explained
            in plain language, with a live preview and step-by-step help when you need it.
          </p>
        </header>

        <section
          aria-labelledby="how-it-works-heading"
          className="border-b border-theme-soft py-12"
        >
          <div className="mb-8 max-w-2xl">
            <p className="typ-eyebrow text-[color:var(--color-bronze-500)]">
              {PLANNER_HOW_IT_WORKS.eyebrow}
            </p>
            <h2 id="how-it-works-heading" className="home-heading mt-3">
              {PLANNER_HOW_IT_WORKS.titleBefore}
              <span className="text-accent-italic">{PLANNER_HOW_IT_WORKS.titleAccent}</span>
              {PLANNER_HOW_IT_WORKS.titleAfter}
            </h2>
          </div>
          <div className="planner-landing-steps">
            {PLANNER_STEPS.map((item, index) => (
              <motion.div
                key={item.step}
                className="planner-landing-step"
                initial={{ y: 18 }}
                whileInView={{ y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: index * 0.12, ease: MOTION_EASE }}
              >
                <p className="planner-landing-step__num">{item.step}</p>
                <h3 className="typ-h3 mt-3 text-strong">{item.title}</h3>
                <p className="page-copy-sm mt-2 text-muted">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <div className="grid gap-5 py-12 sm:grid-cols-2 lg:grid-cols-3">
          {PLANNER_FEATURE_PAGES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.slug}
                href={`/planner/features/${feature.slug}/`}
                className="pfp-card group"
              >
                <div className="scheme-accent-wash flex h-12 w-12 items-center justify-center rounded-2xl text-[color:var(--color-accent-strong)]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <p className="typ-eyebrow text-muted">{feature.tagline}</p>
                  <h2 className="typ-h3 mt-1 text-strong">{feature.title}</h2>
                  <p className="page-copy-sm mt-2 text-muted">{feature.summary}</p>
                </div>
                <span className="typ-label inline-flex items-center gap-1.5 text-[color:var(--color-bronze-500)] transition-all group-hover:gap-2.5">
                  See how it works
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            );
          })}
        </div>

        <section aria-labelledby="features-cta">
          <div className="shell-dark-cta-panel flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 id="features-cta" className="typ-subsection-title text-inverse">
                Ready to plan your office?
              </h2>
              <p className="page-copy-sm mt-2 text-inverse-body">
                Start free in guest mode — no signup required. Sign in when you want to save and
                export.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={PLANNER_HERO.primaryCta.href} className="btn-primary typ-cta px-6 py-3">
                {PLANNER_HERO.primaryCta.label}
              </Link>
              <Link
                href={PLANNER_HERO.secondaryCta.href}
                className="btn-outline-light typ-cta px-6 py-3"
              >
                {PLANNER_HERO.secondaryCta.label}
              </Link>
              <Link
                href={PLANNER_HERO.helpCta.href}
                className="btn-outline-light typ-cta px-6 py-3"
              >
                {PLANNER_HERO.helpCta.label}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}