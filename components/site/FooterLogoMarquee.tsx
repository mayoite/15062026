"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { HOMEPAGE_TRUST_CONTENT } from "@/data/site/homepage";

export function FooterLogoMarquee() {
  const pathname = usePathname();
  const isHorizontalMarquee =
    pathname === "/" || pathname === "/about" || pathname.startsWith("/solutions");
  const trackLogos = [...HOMEPAGE_TRUST_CONTENT.logos, ...HOMEPAGE_TRUST_CONTENT.logos];
  const logos = isHorizontalMarquee ? trackLogos : HOMEPAGE_TRUST_CONTENT.logos;

  return (
    <section
      aria-hidden="true"
      className="footer-logo-marquee w-full border-y border-soft bg-panel py-4 md:py-5"
      style={isHorizontalMarquee ? { ["--marquee-duration" as string]: "110s" } : undefined}
    >
      <div className="relative overflow-hidden">
        <div
          className={
            isHorizontalMarquee
              ? "footer-logo-marquee__track flex w-max animate-marquee motion-reduce:animate-none"
              : "footer-logo-marquee__track grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-6"
          }
        >
          {logos.map((logo, index) => (
            <div
              key={`${logo.name}-${index}`}
              className="footer-logo-marquee__item flex h-12 w-34 shrink-0 items-center justify-center md:h-16 md:w-44"
            >
              <Image
                src={logo.src}
                alt={logo.name}
                width={208}
                height={72}
                className="h-10 w-auto object-contain opacity-100 saturate-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-150 motion-reduce:hover:scale-100 md:h-12"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
