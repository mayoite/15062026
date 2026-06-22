"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { HOMEPAGE_COLLECTIONS_CONTENT } from "@/lib/site-data/homepage";
import { CollectionsSectionHeading } from "@/components/home/CollectionsSectionHeading";
import { fadeUp, useMotionSafeHover } from "@/lib/helpers/motion";

import "swiper/css";
import "swiper/css/navigation";

export function Collections() {
  const { catalogCta, items } = HOMEPAGE_COLLECTIONS_CONTENT;
  const navHover = useMotionSafeHover({ y: -1 }, { y: 0 });

  return (
    <section
      data-testid="home-collections"
      className="home-section--soft border-t border-b border-theme-soft section-y-sm"
    >
      <div className="home-shell-xl">
        <div className="home-frame home-frame--standard">
          <motion.div
            className="mb-8 flex flex-wrap items-center justify-between gap-6"
            {...fadeUp(14, 0.06)}
          >
            <CollectionsSectionHeading />

            <div className="flex shrink-0 items-center gap-4">
              <div className="hidden items-center gap-4 sm:flex">
                <motion.button
                  type="button"
                  aria-label="Previous slide"
                  className="swiper-button-prev-custom inline-flex h-12 w-12 items-center justify-center rounded-full border border-soft text-body transition-all duration-300 hover:border-strong hover:bg-hover disabled:cursor-not-allowed disabled:opacity-20"
                  {...navHover}
                >
                  <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                </motion.button>
                <motion.button
                  type="button"
                  aria-label="Next slide"
                  className="swiper-button-next-custom inline-flex h-12 w-12 items-center justify-center rounded-full border border-soft text-body transition-all duration-300 hover:border-strong hover:bg-hover disabled:cursor-not-allowed disabled:opacity-20"
                  {...navHover}
                >
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </motion.button>
              </div>
              <Link
                href={catalogCta.href}
                className="home-catalog-cta group typ-label inline-flex items-center gap-1.5 whitespace-nowrap sm:ml-2"
              >
                {catalogCta.label}
                <ArrowRight
                  className="h-3.5 w-3.5 shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </motion.div>

          <motion.div {...fadeUp(18, 0.14)}>
            <Swiper
              modules={[Navigation, Autoplay]}
              spaceBetween={24}
              slidesPerView={1}
              navigation={{
                prevEl: ".swiper-button-prev-custom",
                nextEl: ".swiper-button-next-custom",
              }}
              autoplay={{
                delay: 6500,
                disableOnInteraction: false,
              }}
              breakpoints={{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
                1280: { slidesPerView: 4 },
              }}
              className="pb-4"
            >
              {items.map((item) => (
                <SwiperSlide key={item.name}>
                  <div className="h-full">
                    <Link href={item.href} className="group home-collection-card block h-full">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                      className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                    />
                    <div className="home-collection-card__overlay" />
                    <div className="home-collection-card__footer absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 p-6 md:p-7">
                      <h3 className="typ-overlay-title text-inverse">{item.name}</h3>
                      <span className="home-collection-card__arrow shrink-0" aria-hidden="true">
                        <ArrowRight className="h-[18px] w-[18px]" />
                      </span>
                    </div>
                    </Link>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </motion.div>
        </div>
      </div>
    </section>
  );
}