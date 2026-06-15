"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";

import { MOTION_EASE } from "@/lib/helpers/motion";
import { PlannerHeroDemo } from "./PlannerHeroDemo";
import { PLANNER_LANDING_ICONS } from "./plannerLandingIcons";
import {
  PLANNER_HERO,
  PLANNER_HERO_IMAGES,
  PLANNER_LANDING_FEATURES,
  PLANNER_PROOF,
  PLANNER_STEPS,
} from "./plannerLandingData";



const INTERVAL_MS = 9000;
const CROSSFADE_S = 2;

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const wordVariants: Variants = {
  hidden: { y: "105%", opacity: 0, rotate: 2 },
  visible: {
    y: 0,
    opacity: 1,
    rotate: 0,
    transition: { duration: 0.85, ease: MOTION_EASE },
  },
};

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: MOTION_EASE } },
};

export function PlannerLandingPage() {
  const reducedMotion = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const advance = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % PLANNER_HERO_IMAGES.length);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = setInterval(advance, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [advance, reducedMotion]);

  useEffect(() => {
    for (const image of PLANNER_HERO_IMAGES) {
      const img = new window.Image();
      img.src = image.src;
    }
  }, []);

  const currentImage = PLANNER_HERO_IMAGES[currentIndex];

  return (
    <div className="scheme-page">
      <section
        id="planner-hero"
        className="relative min-h-[72vh] w-full overflow-hidden bg-inverse pt-20 md:min-h-[78vh] md:pt-24"
      >
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentIndex}
            className="absolute inset-0 h-[115%] w-full -top-[7%] origin-center"
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1.04 }}
            exit={{ opacity: 0 }}
            transition={{ duration: CROSSFADE_S, ease: "easeInOut" }}
          >
            <Image
              src={currentImage.src}
              alt={currentImage.alt}
              fill
              priority
              loading="eager"
              sizes="100vw"
              className="object-cover object-[68%_52%] md:object-[64%_48%]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/82 via-black/48 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
          </motion.div>
        </AnimatePresence>

        <div className="home-shell-xl relative z-10 grid min-h-[calc(72vh-5rem)] items-center gap-10 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end md:py-14">
          <motion.div
            className="max-w-3xl space-y-6 md:space-y-7"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.p
              variants={fadeUpVariants}
              className="typ-eyebrow text-[color:var(--color-bronze-300)]"
            >
              {PLANNER_HERO.kicker}
            </motion.p>
            <h1 className="home-hero-title-homepage text-inverse">
              {PLANNER_HERO.lines.map((line, i) => (
                <span key={line} className="block overflow-hidden">
                  <motion.span
                    className={`inline-block${
                      i === PLANNER_HERO.accentLineIndex ? " text-accent-italic-on-dark" : ""
                    }`}
                    variants={wordVariants}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>
            <motion.p variants={fadeUpVariants} className="hero-subtitle max-w-xl text-inverse-body">
              {PLANNER_HERO.description}
            </motion.p>
            <motion.div variants={fadeUpVariants} className="home-actions">
              <Link
                href={PLANNER_HERO.primaryCta.href}
                className="btn-hero-primary btn-primary inline-flex items-center gap-2 shadow-theme-panel"
              >
                {PLANNER_HERO.primaryCta.label}
                <ArrowRight size={16} weight="bold" />
              </Link>
              <Link
                href={PLANNER_HERO.secondaryCta.href}
                className="btn-hero-secondary btn-accent inline-flex items-center gap-2 shadow-theme-panel"
              >
                {PLANNER_HERO.secondaryCta.label}
              </Link>
            </motion.div>
            <motion.div variants={fadeUpVariants} className="flex flex-wrap gap-4 text-sm">
              <Link href={PLANNER_HERO.featuresCta.href} className="text-inverse-body hover:text-inverse">
                {PLANNER_HERO.featuresCta.label}
              </Link>
              <span className="text-inverse-muted" aria-hidden="true">
                ·
              </span>
              <Link href={PLANNER_HERO.helpCta.href} className="text-inverse-body hover:text-inverse">
                {PLANNER_HERO.helpCta.label}
              </Link>
            </motion.div>
            <motion.div variants={containerVariants} className="planner-landing-hero-proof">
              {PLANNER_PROOF.map((item) => (
                <motion.div key={item.label} variants={fadeUpVariants}>
                  <p className="planner-landing-proof__value">{item.value}</p>
                  <p className="planner-landing-proof__label">{item.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className="flex w-full justify-start lg:justify-end lg:pb-6"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: MOTION_EASE }}
          >
            <PlannerHeroDemo />
          </motion.div>
        </div>

        <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {PLANNER_HERO_IMAGES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentIndex(i)}
              aria-label={`Show planner image ${i + 1}`}
              aria-current={i === currentIndex ? "true" : undefined}
              className="inline-flex h-6 min-w-6 items-center justify-center rounded-full"
            >
              <span
                aria-hidden="true"
                className={`block h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex ? "home-hero-progress--active w-6" : "home-hero-progress w-1.5"
                }`}
              />
            </button>
          ))}
        </div>
      </section>

      <section className="home-section--white border-t border-b border-theme-soft section-y-sm">
        <motion.div
          className="home-shell-xl"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-90px" }}
          transition={{ duration: 0.7, ease: MOTION_EASE }}
        >
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="home-heading">
              Plan faster with tools built for{" "}
              <span className="text-accent-italic">office teams</span>
            </h2>
            <Link
              href={PLANNER_HERO.featuresCta.href}
              className="typ-label inline-flex shrink-0 items-center gap-2 text-muted hover:text-strong"
            >
              {PLANNER_HERO.featuresCta.label}
              <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
          <div className="planner-landing-features">
            {PLANNER_LANDING_FEATURES.map((feature) => {
              const Icon = PLANNER_LANDING_ICONS[feature.slug];
              return (
                <Link key={feature.slug} href={feature.href} className="planner-landing-feature group">
                  <span className="planner-landing-feature__icon">
                    {Icon ? <Icon size={22} weight="duotone" /> : null}
                  </span>
                  <div>
                    <p className="typ-eyebrow text-muted">{feature.tagline}</p>
                    <h3 className="typ-h3 mt-1 text-strong">{feature.title}</h3>
                    <p className="page-copy-sm mt-2 line-clamp-3 text-muted">{feature.body}</p>
                  </div>
                  <span className="typ-label mt-auto inline-flex items-center gap-1.5 text-primary group-hover:gap-2">
                    See how it works
                    <ArrowRight size={12} weight="bold" />
                  </span>
                </Link>
              );
            })}
          </div>
        </motion.div>
      </section>

      <section className="home-section--soft border-t border-theme-soft section-y-sm">
        <motion.div
          className="home-shell-xl"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-90px" }}
          transition={{ duration: 0.7, ease: MOTION_EASE }}
        >
          <div className="mb-8 max-w-2xl">
            <h2 className="home-heading">
              Three steps from blank floor to{" "}
              <span className="text-accent-italic">shareable</span> layout
            </h2>
          </div>
          <div className="planner-landing-steps">
            {PLANNER_STEPS.map((item, index) => (
              <motion.div
                key={item.step}
                className="planner-landing-step"
                initial={{ y: 18 }}
                whileInView={{ y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: index * 0.12, ease: MOTION_EASE }}
              >
                <p className="planner-landing-step__num">{item.step}</p>
                <h3 className="typ-h3 mt-3 text-strong">{item.title}</h3>
                <p className="page-copy-sm mt-2 text-muted">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="home-section--white border-t border-theme-soft section-y-sm">
        <div className="home-shell-xl">
          <div className="shell-dark-cta-panel flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="typ-subsection-title text-inverse">
                {PLANNER_HERO.bottomCta.title}
              </h2>
              <p className="page-copy-sm mt-2 text-inverse-body">
                {PLANNER_HERO.bottomCta.body}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={PLANNER_HERO.primaryCta.href} className="btn-primary typ-cta px-6 py-3">
                {PLANNER_HERO.primaryCta.label}
              </Link>
              <Link
                href="/login/?next=%2Fplanner%2Fcanvas%2F"
                className="btn-outline-light typ-cta px-6 py-3"
              >
                {PLANNER_HERO.bottomCta.memberLoginLabel}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
