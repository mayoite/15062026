"use client";

import Image from "next/image";
import Link from "next/link";
import { HOMEPAGE_TRUST_CONTENT } from "@/lib/site-data/homepage";

export function HomeTrustStrip() {
  const trackLogos = [...HOMEPAGE_TRUST_CONTENT.logos, ...HOMEPAGE_TRUST_CONTENT.logos];

  return (
    <section
      className="home-trust-strip section-y-sm border-y border-theme-soft"
      aria-label={HOMEPAGE_TRUST_CONTENT.logoLabel}
    >
      <div className="home-shell-xl">
        <div className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="typ-label text-muted">{HOMEPAGE_TRUST_CONTENT.logoLabel}</p>
          <Link
            href="/trusted-by"
            className="home-section-cta typ-label inline-flex items-center gap-2 text-muted hover:text-strong"
          >
            {HOMEPAGE_TRUST_CONTENT.projectsCta}
          </Link>
        </div>
        <div className="home-trust-strip__track relative overflow-hidden">
          <div
            className="footer-logo-marquee__track flex w-max animate-marquee motion-reduce:animate-none"
            style={{ ["--marquee-duration" as string]: "95s" }}
          >
            {trackLogos.map((logo, index) => (
              <div
                key={`${logo.name}-${index}`}
                className="footer-logo-marquee__item flex h-12 w-34 shrink-0 items-center justify-center md:h-14 md:w-40"
              >
                <Image
                  src={logo.src}
                  alt={logo.name}
                  width={160}
                  height={56}
                  className="h-9 w-auto object-contain opacity-90 md:h-10"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
