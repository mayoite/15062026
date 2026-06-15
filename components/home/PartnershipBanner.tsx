"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { HOMEPAGE_PARTNERSHIP_CONTENT } from "@/data/site/homepage";
import { fadeUp } from "@/lib/helpers/motion";

export function PartnershipBanner() {
  const { image, title } = HOMEPAGE_PARTNERSHIP_CONTENT;

  return (
    <section className="w-full py-6 md:py-8">
      <div className="home-shell-xl">
        <motion.div
          className="home-partnership-panel flex flex-col items-center justify-between gap-8 px-8 py-10 text-center md:flex-row md:text-left md:gap-12 md:px-12"
          {...fadeUp(18, 0.04)}
        >
          {/* Partner logo */}
          <div className="shrink-0">
            <Image
              src={image.src}
              alt={image.alt}
              width={224}
              height={153}
              sizes="(max-width: 768px) 108px, 158px"
              quality={100}
              className="h-auto w-[108px] md:w-[158px]"
              priority
            />
          </div>

          {/* Heading + description */}
          <div className="flex-1 max-w-xl">
            <h2 className="home-heading">
              {title[0]}{" "}
              <span className="text-accent-italic">
                {title[1]}
              </span>
            </h2>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
