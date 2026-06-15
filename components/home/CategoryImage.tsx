"use client";

import { useState } from "react";
import Image from "next/image";

const FALLBACK = "/images/catalog/oando-workstations--deskpro/image-1.jpg";

export function CategoryImage({ src, alt }: { src: string; alt: string }) {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={1200}
      height={1200}
      className="w-full h-full object-contain p-4 transition-all duration-700 ease-out group-hover:scale-103"
      onError={() => setImgSrc(FALLBACK)}
    />
  );
}
