"use client";

import { motion } from "framer-motion";
import { HOMEPAGE_PROCESS_CONTENT } from "@/data/site/homepage";

interface ProcessSectionProps {
  dark?: boolean;
}

export function ProcessSection({ dark = true }: ProcessSectionProps) {
  return (
    <section
      className={`relative w-full border-t-2 border-t-[var(--color-accent)] py-10 md:py-14 ${
        dark ? "bg-[#0d0d0d] text-white" : "bg-panel text-body"
      }`}
    >
      <div className="container px-6 2xl:px-0">
        <div className="mb-16 grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 className="typ-section-title">
              {HOMEPAGE_PROCESS_CONTENT.titleLead}{" "}
              <span className="text-[var(--color-accent)] italic">
                {HOMEPAGE_PROCESS_CONTENT.titleAccent}
              </span>
            </h2>
          </div>
          <div className="flex flex-col items-start justify-start gap-6 md:flex-row lg:ml-10 lg:items-center">
            <p className="max-w-md text-sm font-light leading-relaxed opacity-50">
              Each project follows a transparent sequence so procurement, facilities, and leadership
              teams stay aligned from day one.
            </p>
            <a
              href="/contact"
              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-[var(--color-accent)] px-6 py-2.5 text-sm font-medium tracking-tight text-[var(--color-accent)] transition-all hover:bg-[var(--color-accent)] hover:text-black"
            >
              Start brief →
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 divide-y divide-white/8 sm:grid-cols-2 sm:divide-x sm:divide-y-0 sm:divide-[color-mix(in_srgb,var(--color-accent)_15%,transparent)] lg:grid-cols-4">
          {HOMEPAGE_PROCESS_CONTENT.steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.1 }}
              className="flex flex-col justify-between px-8 py-10 first:pl-0 last:pr-0"
            >
              <div>
                <span className="mb-4 block text-[2.75rem] font-thin leading-none tracking-tight text-[var(--color-accent)] opacity-60">
                  0{index + 1}
                </span>
                <h3 className="mb-3 text-xl font-medium tracking-tight text-white">{step.title}</h3>
                {step.description ? (
                  <p className="text-sm font-light leading-relaxed opacity-50">{step.description}</p>
                ) : null}
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                <span className="rounded border border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--color-accent)]">
                  {step.sla}
                </span>
                <span className="rounded border border-white/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-widest text-white/30">
                  {step.deliverable}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
