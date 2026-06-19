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

export function InteractiveTools() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      data-testid="home-tools"
      className="home-section home-section--accent-dark home-tools-band section-y-sm"
    >
      <div className="home-shell-xl">
        <div className="home-tools-panel grid items-center gap-8 md:gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(300px,1.08fr)] lg:gap-12">
          <motion.div
            className="home-tools-panel__copy"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.div variants={staggerItem} className="space-y-0">
              <motion.div
                className="mb-4 flex items-center gap-2.5"
                animate={reduceMotion ? undefined : { opacity: [0.72, 1, 0.72] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="h-4 w-4 shrink-0 text-[var(--color-accent)]" aria-hidden="true" />
                <p className="home-kicker text-inverse-muted">Workspace planning</p>
              </motion.div>
              <h2 className="home-heading text-inverse">
                Design your <span className="text-accent-italic-on-dark">workspace</span>
              </h2>
              <p className="page-copy-sm mt-5 max-w-xl text-inverse-muted">
                True-scale floor plans with catalog furniture, zones, and dimensions — export layouts
                before you quote.
              </p>

              <motion.div
                variants={reduceMotion ? undefined : cardHover}
                initial="rest"
                whileHover={reduceMotion ? undefined : "hover"}
                className="mt-8"
              >
                <Link
                  href="/planner"
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
                      Launch planner
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
            </motion.div>
          </motion.div>

          <div className="home-tools-panel__diagram home-floorplan-showcase">
            <Link
              href="/planner"
              className="home-tools-floor-demo group block"
              aria-label="Open Oando Planner — example 10 by 8 metre office floor plan"
              data-testid="home-tools-floorplan"
            >
              <PlannerHeroDemo />
              <span className="home-tools-floor-demo__caption typ-label text-inverse-muted">
                Example layout · 10 × 8 m · true-scale floor plan
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
