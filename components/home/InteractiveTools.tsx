"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Compass, LayoutGrid } from "lucide-react";

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
    <section className="home-section home-section--dark border-t border-theme-soft section-y-sm">
      <div className="home-shell-xl">
        <div className="mb-10 max-w-3xl">
          <h2 className="home-heading text-inverse">
            Design your <span className="text-accent-italic-on-dark">workspace</span>
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                <Link href={tool.href} className="home-tool-card home-tool-card--dark group h-full">
                  <span className="home-tool-icon home-tool-icon--dark">
                    <Icon className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <h3 className="home-tool-heading--dark">{tool.title}</h3>
                  <p className="page-copy-sm text-inverse-muted">{tool.description}</p>
                  <span className="home-tool-link home-tool-link--dark group-hover:gap-2">
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
