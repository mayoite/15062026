"use client";

import { type KeyboardEvent, useState } from "react";
import Image from "next/image";
import clsx from "clsx";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const fallbackImg = "/images/products/imported/fluid/image-1.webp";

  // Ensure selectedIndex is valid (e.g. if images array changes)
  const safeIndex = selectedIndex >= images.length ? 0 : selectedIndex;
  const currentImage = images[safeIndex] || fallbackImg;

  const handleGalleryKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setSelectedIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    }
  };

  return (
    <div
      className="product-gallery"
      role="region"
      aria-roledescription="carousel"
      aria-label={`${productName} gallery`}
      tabIndex={0}
      onKeyDown={handleGalleryKeyDown}
      style={{ contentVisibility: "auto", containIntrinsicSize: "auto 720px" }}
    >
      {/* Thumbnails */}
      <div className="product-gallery__thumbs">
        {images.map((img, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setSelectedIndex(idx)}
            aria-label={`Show gallery image ${idx + 1} of ${images.length} for ${productName}`}
            aria-pressed={safeIndex === idx}
            className={clsx(
              "relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 bg-neutral-100 transition-all outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 md:h-20 md:w-20",
              safeIndex === idx
                ? "product-gallery__thumb--active border-neutral-900 opacity-100"
                : "border-transparent opacity-60 hover:opacity-100 hover:border-neutral-300",
            )}
            title={`View ${productName} image ${idx + 1}`}
          >
            <Image
              src={img}
              alt={`Gallery image ${idx + 1} of ${productName}`}
              fill
              loading="lazy"
              decoding="async"
              sizes="(max-width: 768px) 18vw, 80px"
              style={{
                objectFit: "contain",
                contentVisibility: "auto",
                containIntrinsicSize: "80px",
              }}
              className="p-1.5"
            />
          </button>
        ))}
      </div>

      {/* Main image */}
      <div className="product-gallery__main">
        <Image
          src={currentImage}
          alt={`Primary product gallery image of ${productName}`}
          fill
          priority
          fetchPriority="high"
          decoding="async"
          sizes="(max-width: 768px) 100vw, 70vw"
          style={{ objectFit: "contain" }}
          className="p-6 transition-opacity duration-500 sm:p-8 lg:p-12"
        />

        {/* Image count badge */}
        {images.length > 0 && (
          <div className="product-gallery__count">
            {safeIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
}
