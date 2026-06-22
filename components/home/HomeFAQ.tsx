"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CaretDown } from "@phosphor-icons/react";
import { HOMEPAGE_FAQ_CONTENT } from "@/lib/site-data/homepage";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/helpers/motion";

export function HomeFAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="home-section home-section--white section-y">
      <div className="home-shell-xl">
        <div className="home-frame home-frame--standard">
          <motion.div className="mb-7 md:mb-8" {...fadeUp(12, 0.02)}>
            <h2 className="typ-section-title text-strong">
              {HOMEPAGE_FAQ_CONTENT.titleLead}
            </h2>
          </motion.div>

          <motion.dl
            className="divide-y divide-soft"
            variants={staggerContainer}
            initial={false}
            whileInView="visible"
            viewport={{ once: true, amount: 0.14 }}
          >
            {HOMEPAGE_FAQ_CONTENT.items.map((item, index) => {
              const btnId = `faq-btn-${index}`;
              const panelId = `faq-panel-${index}`;
              const isOpen = open === index;

              return (
                <motion.div key={index} className="py-3.5 md:py-4" variants={staggerItem}>
                  <dt>
                    <button
                      type="button"
                      id={btnId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      className="flex w-full items-center justify-between gap-4 py-1 text-left transition-colors duration-200 hover:text-strong"
                      onClick={() => setOpen(isOpen ? null : index)}
                    >
                      <span className="home-faq-question">
                        {item.q}
                      </span>
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.38 }}
                      >
                        <CaretDown size={18} weight="bold" className="shrink-0 text-subtle" aria-hidden="true" />
                      </motion.span>
                    </button>
                  </dt>
                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.dd
                        id={panelId}
                        role="region"
                        aria-labelledby={btnId}
                        className="mt-2 overflow-hidden page-copy-sm text-muted"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <div className="pb-1">{item.a}</div>
                      </motion.dd>
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.dl>
        </div>
      </div>
    </section>
  );
}
