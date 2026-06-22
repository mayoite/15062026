"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

import { PlannerHeroDemo } from "@/features/planner/landing/PlannerHeroDemo";
import {
  MOTION_EASE,
  MOTION_TOKENS,
  staggerContainer,
  staggerItem,
} from "@/lib/helpers/motion";

const cardHover: Variants = {
  rest: { y: 0, scale: 1 },
  hover: {
    y: -4,
    scale: 1.01,
    transition: { duration: MOTION_TOKENS.fast, ease: MOTION_EASE },
  },
};

const ctaArrow: Variants = {
  rest: { x: 0 },
  hover: {
    x: 5,
    transition: { duration: MOTION_TOKENS.fast, ease: MOTION_EASE },
  },
};

export type PlannerProofItem = { value: string; label: string };

export type PlannerToolsShowcaseProps = {
  sectionId?: string;
  testId?: string;
  headingLevel?: "h1" | "h2";
  kicker: string;
  title: { lead: string; accent: string };
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  demoHref: string;
  demoAriaLabel?: string;
  demoCaption?: string;
  demoTestId?: string;
  proof?: readonly PlannerProofItem[];
  /** Homepage: sparkle + launch card. Landing: direct CTA buttons. */
  variant?: "homepage" | "landing";
  /** Landing hero animates on mount; homepage on scroll into view. */
  reveal?: "mount" | "inView";
};

export function PlannerToolsShowcase({
  sectionId,
  testId,
  headingLevel = "h2",
  kicker,
  title,
  description,
  primaryCta,
  secondaryCta,
  demoHref,
  demoAriaLabel = "Open Oando Planner — example 10 by 8 metre office floor plan",
  demoCaption = "Example layout · 10 × 8 m · true-scale floor plan",
  demoTestId,
  proof,
  variant = "homepage",
  reveal = "inView",
}: PlannerToolsShowcaseProps) {
  const reduceMotion = useReducedMotion();
  const HeadingTag = headingLevel;
  const headingClass =
    headingLevel === "h1" ? "home-hero-title-homepage text-inverse" : "home-heading text-inverse";
  const isLanding = variant === "landing";

  const motionProps = isLanding
    ? { initial: false as const }
    : reveal === "mount"
      ? { initial: "hidden" as const, animate: "visible" as const }
      : {
          initial: "hidden" as const,
          whileInView: "visible" as const,
          viewport: { once: true, amount: 0.2 },
        };

  return (
    <section
      id={sectionId}
      data-testid={testId}
      className={
        isLanding
          ? "home-section home-section--accent-dark home-tools-band planner-landing-hero-band"
          : "home-section home-section--accent-dark home-tools-band section-y-sm"
      }
    >
      <div className="home-shell-xl">
        <div className="home-tools-panel grid items-center gap-8 md:gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(300px,1.08fr)] lg:gap-12">
          <motion.div className="home-tools-panel__copy" variants={staggerContainer} {...motionProps}>
            <motion.div variants={staggerItem} className="space-y-0">
              {variant === "homepage" ? (
                <motion.div
                  className="mb-4 flex items-center gap-2.5"
                  animate={reduceMotion ? undefined : { opacity: [0.72, 1, 0.72] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="h-4 w-4 shrink-0 text-[var(--color-accent)]" aria-hidden="true" />
                  <p className="home-kicker text-inverse-muted">{kicker}</p>
                </motion.div>
              ) : (
                <p className="home-kicker mb-4 text-inverse-muted">{kicker}</p>
              )}

              <HeadingTag className={headingClass}>
                {title.lead}
                <span className="text-accent-italic-on-dark">{title.accent}</span>
              </HeadingTag>

              <p className="page-copy-sm mt-5 max-w-xl text-inverse-muted">{description}</p>

              {variant === "landing" ? (
                <motion.div variants={staggerItem} className="home-actions mt-8">
                  <Link
                    href={primaryCta.href}
                    className="btn-hero-primary btn-primary inline-flex items-center gap-2 shadow-theme-panel"
                  >
                    {primaryCta.label}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  {secondaryCta ? (
                    <Link
                      href={secondaryCta.href}
                      className="btn-hero-secondary inline-flex items-center gap-2 shadow-theme-panel"
                    >
                      {secondaryCta.label}
                    </Link>
                  ) : null}
                </motion.div>
              ) : (
                <motion.div
                  variants={reduceMotion ? undefined : cardHover}
                  initial="rest"
                  whileHover={reduceMotion ? undefined : "hover"}
                  className="mt-8"
                >
                  <Link
                    href={primaryCta.href}
                    className="home-tool-card home-tool-card--dark home-tool-card--animated home-tool-card--row group inline-flex w-full max-w-md"
                  >
                    <div className="home-tool-card__body min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h3 className="home-tool-title--dark">Oando Planner</h3>
                        <span className="home-tool-badge home-tool-badge--dark home-tool-badge--inline">
                          Flagship
                        </span>
                      </div>
                      <p className="page-copy-sm text-inverse-muted">
                        Open the planner and start from a blank shell or your own plan.
                      </p>
                      <span className="home-tool-link home-tool-link--dark typ-cta">
                        {primaryCta.label}
                        <motion.span
                          variants={reduceMotion ? undefined : ctaArrow}
                          initial="rest"
                          className="inline-flex"
                        >
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </motion.span>
                      </span>
                    </div>
                  </Link>
                </motion.div>
              )}
            </motion.div>
          </motion.div>

          <div className="home-tools-panel__diagram home-floorplan-showcase">
            <Link
              href={demoHref}
              className="home-tools-floor-demo group block"
              aria-label={demoAriaLabel}
              data-testid={demoTestId}
            >
              <PlannerHeroDemo />
              <span className="home-tools-floor-demo__caption typ-label text-inverse-muted">
                {demoCaption}
              </span>
            </Link>
          </div>
        </div>

        {isLanding && proof && proof.length > 0 ? (
          <div className="planner-landing-hero-proof planner-landing-hero-proof--in-band">
            {proof.map((item) => (
              <div key={item.label} className="planner-landing-proof-cell">
                <p className="planner-landing-proof__value">{item.value}</p>
                <p className="planner-landing-proof__label">{item.label}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
