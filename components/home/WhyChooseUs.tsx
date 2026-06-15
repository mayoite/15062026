"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Zap, Leaf, Activity } from "lucide-react";
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

  return (
    <section className="scheme-section-soft scheme-border w-full border-y section-y">
      <div className="container px-6 2xl:px-0">
        <div
          ref={ref}
          className={`mb-12 max-w-3xl reveal-on-scroll ${isVisible ? "visible" : ""}`}
        >
          <h2 className="typ-section-title">
            We engineer workspace systems,{" "}
            <span className="text-accent-italic">not just furniture.</span>
          </h2>
          <p className="typ-section-subtitle max-w-2xl">
            We build planning-led furniture systems that improve usability, durability, and rollout
            confidence for corporate, government, and institutional teams across Bihar and beyond.
          </p>

          <ul className="mt-8 flex flex-wrap gap-4">
            {[
              "Performance-graded components",
              "Enterprise-grade durability",
              "Sustainable engineering",
            ].map((bullet) => (
              <li
                key={bullet}
                className="scheme-panel scheme-border text-body typ-body-sm flex items-center gap-2 rounded-full border px-4 py-2 font-medium"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {bullet}
              </li>
            ))}
          </ul>
        </div>

        <motion.div
          className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={staggerItem}
              className="scheme-panel scheme-border group rounded-xl border p-8 transition-colors hover:border-strong"
            >
              <div className="mb-6 text-strong transition-colors group-hover:text-primary">
                <feature.icon className="h-8 w-8" strokeWidth={1} />
              </div>
              <h3 className="typ-h3 mb-3 text-strong">
                {feature.title}
              </h3>
              <p className="page-copy-sm text-body">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
