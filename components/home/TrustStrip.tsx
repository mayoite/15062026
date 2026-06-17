"use client";

import { motion } from "framer-motion";
import type { BusinessStats } from "@/lib/types/businessStats";
import { staggerContainer, staggerItem } from "@/lib/helpers/motion";
import { KpiCounter } from "@/components/home/KpiCounter";

interface TrustStripProps {
  stats: BusinessStats;
  embedded?: boolean;
  dark?: boolean;
}

export function TrustStrip({ stats, embedded = false }: TrustStripProps) {
  const items = [
    {
      value: stats.yearsExperience,
      label: "Years of experience",
      testId: "kpi-years-experience",
    },
    {
      value: stats.projectsDelivered,
      label: "Projects completed",
      testId: "kpi-projects-delivered",
    },
    {
      value: stats.clientOrganisations,
      label: "Corporate clients",
      testId: "kpi-client-organisations",
    },
    {
      value: stats.locationsServed,
      label: "Locations serviced",
      testId: "kpi-locations-served",
    },
  ];

  const content = (
    <motion.div
      className="grid grid-cols-2 gap-4 md:grid-cols-4"
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
    >
      {items.map(({ value, label, testId }) => (
        <motion.div
          key={label}
          variants={staggerItem}
          className="home-trust-kpi home-trust-kpi--light"
          {...(testId ? { "data-testid": testId } : {})}
        >
          <KpiCounter value={value} className="typ-stat text-primary" />
          <p className="typ-label mt-2">{label}</p>
        </motion.div>
      ))}
    </motion.div>
  );

  if (embedded) {
    return content;
  }

  return (
    <section
      data-testid="home-trust"
      className="home-section--white w-full border-t border-theme-soft section-y-sm"
    >
      <div className="home-shell-xl">{content}</div>
    </section>
  );
}