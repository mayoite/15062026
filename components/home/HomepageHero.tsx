"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, SealCheck } from "@phosphor-icons/react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

import {
  HOMEPAGE_HERO_CONTENT,
  HOMEPAGE_HERO_IMAGES,
} from "@/data/site/homepage";
import { MOTION_EASE } from "@/lib/helpers/motion";

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14, delayChildren: 0.2 } },
};

const wordVariants: Variants = {
  hidden: { y: "105%", opacity: 0, rotate: 3 },
  visible: {
    y: 0,
    opacity: 1,
    rotate: 0,
    transition: { duration: 0.9, ease: MOTION_EASE },
  },
};

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: MOTION_EASE } },
};

export function HomepageHero() {
  const { kicker, title, primaryCta, secondaryCta, glassProof } = HOMEPAGE_HERO_CONTENT;
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentImage = HOMEPAGE_HERO_IMAGES[currentIndex];

  return (
    <section
      id="home-hero"
      className="relative min-h-[78vh] w-full overflow-hidden bg-inverse pt-20 md:min-h-[85vh] md:pt-24"
    >
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={currentIndex}
          className="absolute inset-0 h-[115%] w-full -top-[7%] origin-center"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        >
          <Image
            src={currentImage.src}
            alt={currentImage.alt}
            fill
            priority={currentIndex === 0}
            loading={currentIndex === 0 ? "eager" : undefined}
            sizes="100vw"
            className="object-cover object-[68%_52%] md:object-[64%_48%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/62 to-black/48 lg:bg-gradient-to-r lg:from-black/86 lg:via-black/58 lg:to-black/18" />
          <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-black/78 via-black/28 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="home-hero__layout relative z-10 min-h-[calc(78vh-5rem)] py-10 md:py-16 lg:py-20">
        <motion.div
          className="home-hero__copy w-full max-w-4xl space-y-6 md:space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <h1 className="home-hero-title-homepage text-inverse">
            {title.map((line, i) => (
              <span key={line} className="block overflow-hidden">
                <motion.span
                  className={`inline-block${i === title.length - 1 ? " text-accent-italic-on-dark" : ""}`}
                  variants={wordVariants}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.div variants={fadeUpVariants} className="home-actions">
            <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={primaryCta.href}
                className="btn-hero-primary btn-primary shadow-theme-panel"
              >
                {primaryCta.label}
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={secondaryCta.href}
                className="btn-hero-secondary btn-accent shadow-theme-panel"
              >
                {secondaryCta.label}
              </Link>
            </motion.div>
          </motion.div>

          <motion.p
            variants={fadeUpVariants}
            className="home-kicker text-[color:var(--color-bronze-300)]"
          >
            {kicker}
          </motion.p>
        </motion.div>

        <motion.div
          className="home-hero-glass-stack"
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
        >
          <Link href={glassProof.href} className="home-hero-proof-panel group typ-body-sm text-inverse">
            <span className="home-hero-proof-panel__badge">
              <SealCheck className="shrink-0" size={16} weight="fill" aria-hidden="true" />
              {glassProof.badge}
            </span>
            <p className="home-hero-proof-panel__lead">{glassProof.lead}</p>
            <p className="home-hero-proof-panel__support text-inverse-body">{glassProof.support}</p>
            <span className="home-hero-proof-panel__cta">
              {glassProof.cta}
              <ArrowRight className="shrink-0" size={16} weight="bold" aria-hidden="true" />
            </span>
          </Link>
        </motion.div>
      </div>

      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {HOMEPAGE_HERO_IMAGES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrentIndex(i)}
            aria-label={`Show project image ${i + 1}`}
            aria-current={i === currentIndex ? "true" : undefined}
            className="inline-flex h-6 min-w-6 items-center justify-center rounded-full"
          >
            <span
              aria-hidden="true"
              className={`block h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex ? "home-hero-progress--active" : "home-hero-progress"
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
