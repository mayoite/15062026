"use client";

import Link from "next/link";
import { ArrowRight, CompassTool } from "@phosphor-icons/react";
import { motion } from "framer-motion";

import { PRODUCT_SUITE } from "@/data/site/productSuite";

interface ChooseProductPageProps {
  guestMode: boolean;
  authenticated: boolean;
}

const PLANNER = PRODUCT_SUITE.planner;

export function ChooseProductPage({
  guestMode,
  authenticated,
}: ChooseProductPageProps) {
  const entryHref = guestMode ? PLANNER.routes.guest : PLANNER.routes.canvas;
  const landingHref = PLANNER.routes.landing;

  return (
    <section className="scheme-page relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
      >
        <div className="absolute left-[-10%] top-[-10%] h-[50vw] w-[50vw] animate-pulse rounded-full bg-[color:var(--color-bronze-300)] opacity-30 mix-blend-multiply blur-[120px] [animation-duration:8s]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[60vw] w-[60vw] animate-pulse rounded-full bg-[color:var(--color-ocean-boat-blue-500)] opacity-20 mix-blend-multiply blur-[140px] [animation-duration:12s]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 mb-12 w-full max-w-3xl text-center"
      >
        <p className="typ-eyebrow text-[color:var(--color-bronze-500)]">
          {guestMode ? "Guest access" : "Member access"}
        </p>
        <h1 className="typ-page-title mt-4">
          Open the{" "}
          <span className="text-accent-italic">workspace planner</span>
        </h1>
        <p className="page-copy mx-auto mt-4 max-w-2xl text-muted">
          {guestMode
            ? "One surface for layout, catalog furniture, 3D review, and export. Guest mode keeps the live canvas open with save restricted until you sign in."
            : "Authenticated members open the same unified planner with save, export, and dashboard continuity."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <span className="typ-chip rounded-full border border-soft bg-panel px-4 py-2 text-strong">
            {guestMode ? "Guest path" : authenticated ? "Member path" : "Access check pending"}
          </span>
          <span className="typ-chip rounded-full border border-soft bg-panel px-4 py-2 text-strong">
            Portal · CRM · Admin stay separate
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-xl"
      >
        <Link
          href={entryHref}
          className="card-lift group flex h-full flex-col gap-6 rounded-huge border border-soft bg-panel p-8 md:p-10"
        >
          <div className="scheme-accent-wash flex h-14 w-14 items-center justify-center rounded-2xl text-[color:var(--color-accent-strong)]">
            <CompassTool size={30} weight="duotone" aria-hidden="true" />
          </div>

          <div>
            <p className="typ-eyebrow text-[color:var(--color-bronze-500)]">
              Unified workspace
            </p>
            <h2 className="typ-h3 mt-2 text-heading">{PLANNER.label}</h2>
            <p className="page-copy-sm mt-3 text-muted">{PLANNER.description}</p>
          </div>

          <ul className="space-y-2 text-body">
            <li className="page-copy-sm">2D edit · 3D preview · branded PDF export</li>
            <li className="page-copy-sm">Catalog furniture and symbolic IT placement</li>
            <li className="page-copy-sm">AI layout assist on the same canvas</li>
          </ul>

          <div className="mt-auto flex items-center justify-between border-t border-soft pt-5">
            <span className="typ-cta text-strong group-hover:text-primary">
              {guestMode ? "Open guest canvas" : "Open member canvas"}
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-soft text-strong transition-all group-hover:translate-x-0.5 group-hover:bg-primary group-hover:text-inverse">
              <ArrowRight size={18} weight="bold" aria-hidden="true" />
            </span>
          </div>
        </Link>

        <p className="typ-body-sm mt-6 text-center text-muted">
          <Link href={landingHref} className="text-primary hover:underline">
            View planner overview
          </Link>
          {authenticated ? (
            <>
              {" · "}
              <Link href="/portal" className="text-primary hover:underline">
                Open portal
              </Link>
            </>
          ) : null}
        </p>
      </motion.div>
    </section>
  );
}
