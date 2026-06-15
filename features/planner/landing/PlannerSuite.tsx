"use client";

import { ArrowRight } from "@phosphor-icons/react";
import { TrackedLink } from "@/components/ui/TrackedLink";
import {
  HOMEPAGE_PLANNER_SUITE_CONTENT,
  HOMEPAGE_PROCESS_CONTENT,
  HOMEPAGE_STATS_CONTENT,
} from "@/data/site/homepage";

import { PlannerLayoutGraphic } from "./PlannerLayoutGraphic";

export function PlannerSuite() {
  const { titleLead, titleAccent, description, loginHref, loginLabel, overviewHref, overviewLabel } =
    HOMEPAGE_PLANNER_SUITE_CONTENT;
  const previewSteps = HOMEPAGE_PROCESS_CONTENT.steps.slice(0, 3);
  const previewStats = HOMEPAGE_STATS_CONTENT.slice(0, 3);

  return (
    <section
      className="home-section--dark border-t border-theme-soft section-y-sm"
      data-testid="home-planner-suite"
    >
      <div className="home-shell-xl">
        <div className="home-planner-suite-panel">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.92fr)] lg:items-start">
            <div className="min-w-0">
              <span className="home-chip home-chip--accent">Interactive planning</span>
              <h2 className="home-heading mt-5 text-inverse">
                {titleLead} <span className="text-accent-italic-on-dark">{titleAccent}</span>
              </h2>
              <p className="page-copy-sm mt-3 max-w-2xl text-inverse-body">{description}</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {previewStats.map((stat) => (
                  <div key={stat.label} className="home-planner-suite-metric">
                    <p className="home-planner-suite-metric__value">{stat.value}</p>
                    <p className="home-planner-suite-metric__label">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <TrackedLink
                  href={loginHref}
                  label={loginLabel}
                  surface="home-planner-suite"
                  className="btn-primary typ-cta inline-flex items-center gap-2 px-5 py-2.5"
                >
                  {loginLabel}
                  <ArrowRight size={15} weight="bold" />
                </TrackedLink>
                <TrackedLink
                  href={overviewHref}
                  label={overviewLabel}
                  surface="home-planner-suite"
                  className="btn-outline-light typ-cta inline-flex items-center gap-2 px-5 py-2.5"
                >
                  {overviewLabel}
                </TrackedLink>
              </div>
            </div>

            <div className="home-planner-suite-side">
              <PlannerLayoutGraphic className="flex w-full justify-start border-white/10 bg-white/5 text-white" />

              <div className="mt-5 grid gap-3">
                {previewSteps.map((step) => (
                  <div key={step.title} className="home-planner-suite-step">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="home-planner-suite-step__title">{step.title}</p>
                        <p className="home-planner-suite-step__copy">{step.description}</p>
                      </div>
                      <span className="home-planner-suite-step__meta">{step.sla}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
