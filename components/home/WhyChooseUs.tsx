"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Zap, Leaf, Activity } from "lucide-react";
import { HOMEPAGE_WHY_CHOOSE_US_CONTENT } from "@/data/site/homepage";
import { useInViewOnce } from "@/lib/hooks/useInViewOnce";
import { staggerContainer, staggerItem } from "@/lib/helpers/motion";

const features = [
  {
    icon: Activity,
    title: "Performance-Graded Components",
    description:
      "Every system is selected for sustained enterprise use, with attention to load, cycle, and ergonomic performance.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise-Grade Durability",
    description:
      "Built for institutions that demand reliability. BIFMA-compliant structures with a 5-year performance warranty.",
  },
  {
    icon: Leaf,
    title: "Sustainable Engineering",
    description:
      "Low-emission materials, recycled substrates, and responsible supply chains support a longer-life workspace strategy.",
  },
  {
    icon: Zap,
    title: "Scalable System Design",
    description:
      "Modular by design, so teams can scale from pilot zones to large rollouts without rebuilding the whole specification.",
  },
] as const;

export function WhyChooseUs() {
  const { ref, isVisible } = useInViewOnce();
  const { titleLead, titleAccent } = HOMEPAGE_WHY_CHOOSE_US_CONTENT;

  return (
    <section className="home-section--white border-t border-b border-theme-soft section-y-sm">
      <div className="home-shell-xl">
        <div
          ref={ref}
          className={`mb-10 max-w-3xl reveal-on-scroll ${isVisible ? "visible" : ""}`}
        >
          <h2 className="home-heading">
            {titleLead}{" "}
            <span className="text-accent-italic">{titleAccent}</span>
          </h2>
        </div>

        <motion.div
          className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4"
          variants={staggerContainer}
          initial={false}
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={staggerItem}
              className="home-tool-card group flex h-full flex-col items-center text-center"
            >
              <span className="home-tool-icon mb-6">
                <feature.icon className="h-8 w-8" strokeWidth={1} aria-hidden="true" />
              </span>
              <h3 className="typ-h3 mb-2">{feature.title}</h3>
              <p className="page-copy-sm text-body">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
