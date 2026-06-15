"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { HOMEPAGE_COLLECTIONS_CONTENT } from "@/data/site/homepage";
import { fadeUp } from "@/lib/helpers/motion";

import "swiper/css";
import "swiper/css/navigation";

export function Collections() {
  const { titleLead, titleAccent, catalogCta, items } = HOMEPAGE_COLLECTIONS_CONTENT;

  return (
    <section className="home-section--soft border-t border-b border-theme-soft section-y-sm">
      <div className="home-shell-xl">
        <div className="home-frame home-frame--standard">
          <motion.div
            className="mb-8 flex items-center justify-between gap-6"
            {...fadeUp(14, 0.03)}
          >
            <h2 className="home-heading max-w-2xl">
              {titleLead}{" "}
              <span className="text-accent-italic">{titleAccent}</span>
            </h2>

            <div className="hidden shrink-0 items-center gap-4 sm:flex">
              <motion.button
                type="button"
                aria-label="Previous slide"
                className="swiper-button-prev-custom inline-flex h-12 w-12 items-center justify-center rounded-full border border-soft text-body transition-all duration-300 hover:border-strong hover:bg-hover disabled:cursor-not-allowed disabled:opacity-20"
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
              >
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              </motion.button>
              <motion.button
                type="button"
                aria-label="Next slide"
                className="swiper-button-next-custom inline-flex h-12 w-12 items-center justify-center rounded-full border border-soft text-body transition-all duration-300 hover:border-strong hover:bg-hover disabled:cursor-not-allowed disabled:opacity-20"
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
              >
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </motion.button>
              <Link
                href={catalogCta.href}
                className="home-catalog-cta group typ-label ml-2 inline-flex items-center gap-1.5 whitespace-nowrap sm:ml-4"
              >
                {catalogCta.label}
                <ArrowRight
                  className="h-3.5 w-3.5 shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </motion.div>

          <motion.div {...fadeUp(18, 0.08)}>
            <Swiper
              modules={[Navigation, Autoplay]}
              spaceBetween={24}
              slidesPerView={1}
              navigation={{
                prevEl: ".swiper-button-prev-custom",
                nextEl: ".swiper-button-next-custom",
              }}
              autoplay={{
                delay: 5000,
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
                  <motion.div
                    className="h-full"
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link href={item.href} className="group home-collection-card block h-full">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="home-collection-card__overlay" />
                    <div className="home-collection-card__footer absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 p-6 md:p-7">
                      <h3 className="typ-overlay-title text-inverse">{item.name}</h3>
                      <span className="home-collection-card__arrow shrink-0" aria-hidden="true">
                        <ArrowRight className="h-[18px] w-[18px]" />
                      </span>
                    </div>
                    </Link>
                  </motion.div>
                </SwiperSlide>
              ))}
            </Swiper>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
