"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import { SiteFooter } from "@/components/site/Footer";
import { FooterLogoMarquee } from "@/components/site/FooterLogoMarquee";
import { SiteHeader } from "@/components/site/Header";
import { MOTION_EASE } from "@/lib/helpers/motion";
import { PlannerBreadcrumbs } from "./PlannerBreadcrumbs";
import { PlannerHeroDemo } from "./PlannerHeroDemo";
import { PLANNER_FEATURE_PAGES } from "./plannerFeaturePages";
import {
  PLANNER_HERO,
  PLANNER_HERO_IMAGES,
  PLANNER_HOW_IT_WORKS,
  PLANNER_PROOF,
  PLANNER_STEPS,
} from "./plannerLandingData";

export function PlannerFeaturesHubPage() {
  return (
    <>
      <SiteHeader />
      <div className="scheme-page min-h-screen pfp-page">
        <section className="pfp-hero-band">
          <div className="pfp-hero-media">
            <Image
              src={PLANNER_HERO_IMAGES[0].src}
              alt={PLANNER_HERO_IMAGES[0].alt}
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="pfp-hero-overlay" />
          </div>

          <div className="home-shell-xl relative z-10">
            <div className="pfp-hero-shell">
              <PlannerBreadcrumbs
                items={[{ label: "Planner", href: "/planner/" }, { label: "Features" }]}
              />

              <div className="pfp-hero-layout">
                <div className="pfp-hero-copy">
                  <p className="typ-eyebrow text-[color:var(--color-bronze-300)]">
                    {PLANNER_HERO.kicker}
                  </p>
                  <h1 className="home-hero-title-homepage mt-3 text-inverse">
                    {PLANNER_HERO.lines[0]}
                    <br />
                    {PLANNER_HERO.lines[1]}
                    <br />
                    <span className="text-accent-italic-on-dark">{PLANNER_HERO.lines[2]}</span>
                  </h1>
                  <p className="hero-subtitle mt-5 max-w-xl text-inverse-body">
                    {PLANNER_HERO.description}
                  </p>

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Link
                      href={PLANNER_HERO.primaryCta.href}
                      className="btn-hero-primary btn-primary typ-cta inline-flex items-center gap-2 px-6 py-3"
                    >
                      {PLANNER_HERO.primaryCta.label}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <Link
                      href={PLANNER_HERO.secondaryCta.href}
                      className="btn-hero-secondary btn-accent typ-cta px-6 py-3"
                    >
                      {PLANNER_HERO.secondaryCta.label}
                    </Link>
                  </div>

                  <div className="planner-landing-hero-proof">
                    {PLANNER_PROOF.map((item) => (
                      <div key={item.label}>
                        <p className="planner-landing-proof__value">{item.value}</p>
                        <p className="planner-landing-proof__label">{item.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-4 text-sm">
                    <Link href={PLANNER_HERO.featuresCta.href} className="pfp-inline-link pfp-inline-link--inverse">
                      {PLANNER_HERO.featuresCta.label}
                    </Link>
                    <Link href={PLANNER_HERO.helpCta.href} className="pfp-inline-link pfp-inline-link--inverse">
                      {PLANNER_HERO.helpCta.label}
                    </Link>
                  </div>
                </div>

                <motion.div
                  className="pfp-hero-demo-wrap"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.7, ease: MOTION_EASE }}
                >
                  <PlannerHeroDemo />
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-theme-soft bg-[color:var(--surface-page)] py-8">
          <div className="home-shell-xl">
            <div className="pfp-feature-strip">
              {PLANNER_FEATURE_PAGES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Link
                    key={feature.slug}
                    href={`/planner/features/${feature.slug}/`}
                    className="pfp-feature-pill group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="pfp-feature-pill__icon">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <h2 className="typ-h3 text-strong">{feature.tagline}</h2>
                    </div>
                    <ArrowRight
                      className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section aria-labelledby="how-it-works-heading" className="border-t border-theme-soft py-14">
          <div className="home-shell-xl">
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
          </div>
        </section>

        <section aria-labelledby="features-cta" className="border-t border-theme-soft py-14">
          <div className="home-shell-xl">
            <div className="shell-dark-cta-panel flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <h2 id="features-cta" className="typ-subsection-title text-inverse">
                  Ready to plan your office?
                </h2>
                <p className="page-copy-sm mt-2 text-inverse-body">
                  Start free in guest mode, then sign in when you want to save and export.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href={PLANNER_HERO.primaryCta.href} className="btn-primary typ-cta px-6 py-3">
                  Start free
                </Link>
                <Link
                  href={PLANNER_HERO.secondaryCta.href}
                  className="btn-outline-light typ-cta px-6 py-3"
                >
                  Saved layouts
                </Link>
                <Link
                  href={PLANNER_HERO.helpCta.href}
                  className="btn-outline-light typ-cta px-6 py-3"
                >
                  Help
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
      <FooterLogoMarquee />
      <SiteFooter />
    </>
  );
}
