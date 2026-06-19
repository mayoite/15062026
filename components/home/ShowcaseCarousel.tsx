"use client";

import { type KeyboardEvent, useCallback, useEffect, useState, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fadeUp, useMotionSafeHover } from "@/lib/helpers/motion";
import { PartnershipPanel } from "@/components/home/PartnershipBanner";

export interface CarouselItem {
  id: string;
  name: string;
  label: string;
  image: string;
  link: string;
  description?: string;
}

interface ShowcaseCarouselProps {
  sectionLabel: string;
  sectionAriaLabel: string;
  sectionTitle: ReactNode;
  items: CarouselItem[];
  browseLink?: string;
  browseLabel?: string;
  className?: string;
  dark?: boolean;
  showPartnership?: boolean;
}

export function ShowcaseCarousel({
  sectionLabel,
  sectionAriaLabel,
  sectionTitle,
  items,
  browseLink,
  browseLabel = "Browse all",
  className = "",
  dark = false,
  showPartnership = false,
}: ShowcaseCarouselProps) {
  const navHover = useMotionSafeHover({ scale: 1.04 }, { scale: 0.98 });
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const navButtonClass = `home-showcase-nav-button ${
    dark ? "home-showcase-nav-button--dark" : "home-showcase-nav-button--light"
  }`;
  const browseLinkClass = `home-showcase-browse-link ${
    dark ? "home-showcase-browse-link--dark" : "home-showcase-browse-link--light"
  }`;
  const sectionClass = `home-showcase-section section-y-sm ${
    dark ? "home-showcase-section--dark" : "home-showcase-section--light"
  }`;

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    const frameId = window.requestAnimationFrame(onSelect);
    return () => {
      window.cancelAnimationFrame(frameId);
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!emblaApi) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      emblaApi.scrollPrev();
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      emblaApi.scrollNext();
    }
  }

  return (
    <section
      data-testid="home-showcase"
      className={`${sectionClass} ${className}`.trim()}
      aria-label={sectionAriaLabel}
    >
      <div className="home-shell-xl">
        {showPartnership ? (
          <div className="mb-10">
            <PartnershipPanel />
          </div>
        ) : null}

        <motion.div
          className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
          {...fadeUp(16, 0.06)}
        >
          <div>
            {sectionLabel ? (
              <p
                className={`typ-label mb-3 ${
                  dark ? "text-inverse-muted" : "text-body"
                }`}
              >
                {sectionLabel}
              </p>
            ) : null}
            <h2
              className={`home-heading ${
                dark ? "text-inverse" : "text-heading"
              }`}
            >
              {sectionTitle}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              type="button"
              aria-label="Previous project"
              onClick={() => emblaApi?.scrollPrev()}
              disabled={!canScrollPrev}
              className={navButtonClass}
              {...navHover}
            >
              <ChevronLeft className="h-5 w-5" />
            </motion.button>
            <motion.button
              type="button"
              aria-label="Next project"
              onClick={() => emblaApi?.scrollNext()}
              disabled={!canScrollNext}
              className={navButtonClass}
              {...navHover}
            >
              <ChevronRight className="h-5 w-5" />
            </motion.button>
            {browseLink ? (
              <Link href={browseLink} className={`${browseLinkClass} typ-cta`}>
                {browseLabel}
              </Link>
            ) : null}
          </div>
        </motion.div>

        <motion.div {...fadeUp(22, 0.18)}>
          <div
            ref={emblaRef}
            className="overflow-hidden"
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
          <div className="flex gap-5">
            {items.map((item) => (
              <article
                key={item.id}
                className="group relative min-w-0 shrink-0 grow-0 basis-[min(88vw,22rem)] sm:basis-[min(72vw,24rem)] lg:basis-[min(42vw,28rem)]"
              >
                <Link href={item.link} className="block overflow-hidden rounded-[var(--radius-giant)]">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 88vw, (max-width: 1280px) 42vw, 28rem"
                      className="object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="home-showcase-overlay" />
                    <div className="home-showcase-card__caption">
                      <h3 className="typ-overlay-title text-inverse">{item.name}</h3>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
          </div>
        </motion.div>

        <motion.div className="mt-8 flex items-center justify-between gap-4" {...fadeUp(10, 0.26)}>
          {items.length > 5 ? (
            <p
              className={`home-showcase-mobile-count ${
                dark ? "text-inverse-muted" : "text-muted"
              }`}
            >
              {selectedIndex + 1} / {items.length}
            </p>
          ) : (
            <div className="flex gap-2">
              {items.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Go to slide ${index + 1}`}
                  onClick={() => emblaApi?.scrollTo(index)}
                  className={`home-showcase-dot ${
                    selectedIndex === index
                      ? dark
                        ? "home-showcase-dot--active-dark"
                        : "home-showcase-dot--active-light"
                      : dark
                        ? "home-showcase-dot--inactive-dark"
                        : "home-showcase-dot--inactive-light"
                  }`}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
