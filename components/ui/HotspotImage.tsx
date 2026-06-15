"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface Hotspot {
  id: string;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  title?: string;
  description: string;
  linkUrl?: string;
}

interface HotspotImageProps {
  src: string;
  alt: string;
  hotspots: Hotspot[];
}

export function HotspotImage({ src, alt, hotspots }: HotspotImageProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div
      className="relative w-full h-[600px] overflow-hidden bg-soft group"
      style={{ contentVisibility: "auto", containIntrinsicSize: "auto 600px" }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        loading="lazy"
        decoding="async"
        sizes="100vw"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {hotspots.map((hotspot) => (
        <div
          key={hotspot.id}
          className="absolute"
          style={{ top: `${hotspot.y}%`, left: `${hotspot.x}%` }}
        >
          {/* Pulse Effect */}
          <span className="absolute -inset-2 rounded-full bg-white/30 animate-ping" />

          <button
            type="button"
            title={`View details for ${hotspot.title || hotspot.id}`}
            aria-label={`View details for ${hotspot.title || hotspot.id}`}
            aria-expanded={activeId === hotspot.id}
            onClick={() =>
              setActiveId(activeId === hotspot.id ? null : hotspot.id)
            }
            className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-theme-lift transition-colors focus-ring-theme ${
              activeId === hotspot.id
                ? "bg-primary text-inverse"
                : "bg-page text-primary bg-hover-soft"
            }`}
          >
            <Plus
              className={`w-5 h-5 transition-transform duration-300 ${
                activeId === hotspot.id ? "rotate-45" : ""
              }`}
            />
          </button>

          {/* Tooltip / Popover */}
          <AnimatePresence>
            {activeId === hotspot.id && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute left-1/2 -translate-x-1/2 bottom-12 w-64 scheme-panel p-4 z-20 pointer-events-auto text-left"
              >
                {hotspot.title && (
                  <h4 className="font-medium text-lg mb-1">
                    {hotspot.title}
                  </h4>
                )}
                <p className="text-sm text-muted font-light leading-relaxed">
                  {hotspot.description}
                </p>
                {hotspot.linkUrl && (
                  <a
                    href={hotspot.linkUrl}
                    className="inline-block mt-4 text-xs font-semibold uppercase tracking-wider text-primary hover:text-primary-hover transition-colors"
                  >
                    Explore Product →
                  </a>
                )}
                {/* Little triangle arrow */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-panel transform rotate-45 border-r border-b border-soft" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

