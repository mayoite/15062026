"use client";

import Image from "next/image";
import { ArrowRight } from "@phosphor-icons/react";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { HOMEPAGE_SOLUTIONS_CONTENT } from "@/data/site/homepage";

export function Collections() {
  const { kicker, title, description, compareCta, catalogCta, capabilities } =
    HOMEPAGE_SOLUTIONS_CONTENT;

  return (
    <section className="home-section--white border-t border-b border-theme-soft section-y-sm">
      <div className="home-solutions-shell">
        <div className="home-solutions-panel">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="home-solutions-kicker">{kicker}</p>
              <h2 className="home-solutions-title">{title}</h2>
              <p className="home-solutions-copy">{description}</p>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              <TrackedLink
                href="/compare"
                label={compareCta}
                surface="home-solutions"
                className="btn-outline"
              >
                {compareCta}
              </TrackedLink>
              <TrackedLink
                href="/products"
                label={catalogCta}
                surface="home-solutions"
                className="btn-primary"
              >
                {catalogCta}
              </TrackedLink>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {capabilities.map((capability) => (
              <TrackedLink
                key={capability.title}
                href={capability.href}
                label={capability.title}
                surface="home-solutions-card"
                className="home-solutions-card group"
              >
                <div className="home-solutions-card__media">
                  <Image
                    src={capability.image}
                    alt={capability.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    className="home-solutions-card__image"
                  />
                  <div className="home-solutions-card__wash" />
                </div>

                <div className="flex flex-1 flex-col gap-4 p-5">
                  <h3 className="home-solutions-card-title">{capability.title}</h3>
                  <p className="typ-body-sm text-body">{capability.outcome}</p>
                  <span className="home-solutions-link mt-auto">
                    Explore
                    <ArrowRight size={14} weight="bold" />
                  </span>
                </div>
              </TrackedLink>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
