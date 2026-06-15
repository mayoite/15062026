"use client";

import { motion } from "framer-motion";
import { HOMEPAGE_PROCESS_CONTENT } from "@/data/site/homepage";

interface ProcessSectionProps {
  dark?: boolean;
}

export function ProcessSection({ dark = true }: ProcessSectionProps) {
  return (
    <section
      className={`home-process-section ${
        dark ? "home-process-section--dark" : "home-process-section--light"
      }`}
    >
      <div className="container px-6 2xl:px-0 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-end mb-12">
          <div>
            <h2 className="typ-section-title">
              {HOMEPAGE_PROCESS_CONTENT.titleLead}{" "}
              <span className="home-process-accent">
                {HOMEPAGE_PROCESS_CONTENT.titleAccent}
              </span>
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-start sm:justify-end gap-6">
            <p className="home-process-copy">
              Each project follows a transparent sequence so procurement, facilities, and leadership teams stay aligned from day one.
            </p>
            <a
              href="/contact"
              className="home-process-cta"
            >
              Start brief →
            </a>
          </div>
        </div>

        <div className="home-process-grid divide-y divide-white/8 sm:divide-y-0 sm:divide-x sm:divide-(--color-accent)/15">
          {HOMEPAGE_PROCESS_CONTENT.steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.1 }}
              className="home-process-step first:pl-0 last:pr-0 sm:first:pl-0 sm:[&:nth-child(2)]:pr-0 sm:[&:nth-child(2)]:lg:pr-6 sm:[&:nth-child(3)]:pl-0 sm:[&:nth-child(3)]:lg:pl-6 lg:px-8"
            >
              <div>
                <span className="home-process-step-number">
                  0{index + 1}
                </span>
                <h3 className="home-process-step-title">
                  {step.title}
                </h3>
                {step.description && (
                  <p className="home-process-step-copy">
                    {step.description}
                  </p>
                )}
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                <span className="home-process-meta home-process-meta--accent">
                  {step.sla}
                </span>
                <span className="home-process-meta home-process-meta--muted">
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
