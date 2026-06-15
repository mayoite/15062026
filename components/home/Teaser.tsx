"use client";

import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/shared/Reveal";
import { cn } from "@/lib/utils";

interface TeaserProps {
  title: string;
  subtitle?: string;
  description?: string;
  linkText?: string;
  linkUrl?: string;
  imageSrc?: string;
  videoSrc?: string;
  imageAlt?: string;
  reversed?: boolean;
  lightMode?: boolean;
}

export function Teaser({
  title,
  subtitle,
  description,
  linkText = "Read more",
  linkUrl = "#",
  imageSrc,
  videoSrc,
  imageAlt = "Teaser image",
  reversed = false,
  lightMode = false,
  className,
}: TeaserProps & { className?: string }) {
  return (
    <section
      className={cn(
        "w-full py-14 md:py-20",
        lightMode ? "bg-panel text-strong" : "bg-inverse text-inverse",
        className,
      )}
    >
      <div className="container px-6 2xl:px-0">
        <div
          className={cn(
            "flex flex-col items-center gap-16",
            reversed ? "md:flex-row-reverse" : "md:flex-row",
          )}
        >
          <div className={cn("w-full space-y-8 md:w-1/2", reversed ? "md:text-right" : "md:text-left")}>
            {subtitle && (
              <Reveal>
                <div className="mb-4 flex items-center gap-4">
                  <span
                    className={cn(
                      "typ-cta",
                      lightMode ? "text-muted" : "text-inverse-body",
                    )}
                  >
                    {subtitle}
                  </span>
                </div>
              </Reveal>
            )}

            <Reveal delay={0.1}>
              <h2 className="typ-h1 text-balance leading-[1.04]">{title}</h2>
            </Reveal>

            {description && (
              <Reveal delay={0.2}>
                <p
                  className={cn(
                    "typ-h3 max-w-xl font-normal leading-relaxed",
                    lightMode ? "text-body" : "text-inverse-body",
                  )}
                >
                  {description}
                </p>
              </Reveal>
            )}

            <Reveal delay={0.3}>
              <Link
                href={linkUrl}
                className={cn(
                  "group mt-8 inline-flex items-center gap-4 border-b pb-2 transition-colors",
                  reversed ? "md:ml-auto" : "",
                  lightMode
                    ? "border-strong text-strong hover:border-primary-hover hover:text-primary"
                    : "border-inverse text-inverse hover:border-primary-hover hover:text-primary",
                )}
              >
                <span className="typ-cta">{linkText}</span>
                <span className="text-lg transition-transform group-hover:translate-x-1">{"->"}</span>
              </Link>
            </Reveal>
          </div>

          <div className="w-full md:w-1/2">
            <Reveal delay={0.2} width="100%">
              <div className="group relative aspect-4/3 overflow-hidden rounded-sm">
                {videoSrc ? (
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  >
                    <source src={videoSrc} type="video/mp4" />
                  </video>
                ) : (
                  <Image
                    src={imageSrc || ""}
                    alt={imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                )}
                <div className="home-teaser-overlay" />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

