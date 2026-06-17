"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Compass, LayoutGrid } from "lucide-react";
import { fadeUp, MOTION_TOKENS } from "@/lib/helpers/motion";

const tools = [
  {
    title: "Oando Planner",
    description:
      "Sketch a floor, place catalog furniture, and export a layout before you quote.",
    href: "/planner",
    icon: Compass,
  },
  {
    title: "Planning service",
    description:
      "Work with our team on zoning, BOQ drafts, and implementation-ready workplace plans.",
    href: "/planning",
    icon: LayoutGrid,
  },
] as const;

export function InteractiveTools() {
  return (
    <section
      data-testid="home-tools"
      className="home-section home-section--accent-dark section-y-sm"
    >
      <div className="home-shell-xl">
        <motion.div className="mb-10 w-full" {...fadeUp(MOTION_TOKENS.distanceSm, 0.06)}>
          <h2 className="home-heading text-inverse">
            Design your <span className="text-accent-italic-on-dark">workspace</span>
          </h2>
        </motion.div>

        <div className="grid items-stretch gap-5 md:grid-cols-2">
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.title}
                className="h-full"
                {...fadeUp(MOTION_TOKENS.distanceSm, 0.1 + index * 0.12)}
              >
                <Link href={tool.href} className="home-tool-card home-tool-card--dark group h-full">
                  <span className="home-tool-icon home-tool-icon--dark">
                    <Icon className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <h3 className="typ-h3 mb-2 text-inverse">{tool.title}</h3>
                  <p className="page-copy-sm text-inverse-muted">{tool.description}</p>
                  <span className="home-tool-link home-tool-link--dark typ-cta group-hover:gap-2">
                    Launch
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}