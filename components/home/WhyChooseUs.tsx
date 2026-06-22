"use client";

import { motion } from "framer-motion";
import { Gauge, Plant, ShieldCheck, Stack } from "@phosphor-icons/react";
import { HOMEPAGE_WHY_CHOOSE_US_CONTENT } from "@/lib/site-data/homepage";
import { fadeUp, hoverLift, staggerContainer, staggerItem } from "@/lib/helpers/motion";

const features = [
  {
    icon: Gauge,
    iconClass: "home-feature-icon--ocean",
    title: "Performance-graded",
    tagline: "Load, cycle, ergonomics",
  },
  {
    icon: ShieldCheck,
    iconClass: "home-feature-icon--bronze",
    title: "Enterprise durability",
    tagline: "BIFMA · 5-year warranty",
  },
  {
    icon: Plant,
    iconClass: "home-feature-icon--sustain",
    title: "Sustainable build",
    tagline: "Low-emission materials",
  },
  {
    icon: Stack,
    iconClass: "home-feature-icon--midnight",
    title: "Scales with you",
    tagline: "Pilot to rollout",
  },
] as const;

export function WhyChooseUs() {
  const { titleLead, titleAccent } = HOMEPAGE_WHY_CHOOSE_US_CONTENT;

  return (
    <section
      data-testid="home-why"
      className="home-section--white border-t border-theme-soft section-y-sm"
    >
      <div className="home-shell-xl">
        <motion.div className="mb-10 max-w-3xl" {...fadeUp()}>
          <h2 className="home-heading">
            {titleLead}{" "}
            <span className="text-accent-italic">{titleAccent}</span>
          </h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.title} variants={staggerItem}>
                <motion.div
                  className="home-tool-card home-why-card group flex h-full flex-col items-center text-center"
                  variants={hoverLift}
                  initial="rest"
                  whileHover="hover"
                >
                  <span className={`home-why-icon ${feature.iconClass}`}>
                    <Icon size={34} weight="duotone" aria-hidden="true" />
                  </span>
                  <h3 className="home-why-card__title">{feature.title}</h3>
                  <p className="home-why-card__tagline">{feature.tagline}</p>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
