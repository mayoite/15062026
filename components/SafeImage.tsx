"use client";

import type { ImageProps } from "next/image";
import Image from "next/image";
import type { CSSProperties } from "react";
import { useState } from "react";

interface SafeImageProps extends Omit<ImageProps, "src" | "alt"> {
  src?: string | null;
  alt: string;
  fallbackSrc?: string;
}

export function SafeImage({
  src,
  alt,
  fallbackSrc = "/images/products/60x30-workstation-1.webp",
  ...props
}: SafeImageProps) {
  const [error, setError] = useState(false);
  const imgSrc = error || !src ? fallbackSrc : src;
  const isPriority = props.priority === true;
  const mergedStyle: CSSProperties | undefined = isPriority
    ? props.style
    : {
        contentVisibility: "auto",
        containIntrinsicSize: "auto 320px",
        ...(props.style || {}),
      };

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      sizes={props.sizes ?? "100vw"}
      loading={props.loading ?? (isPriority ? undefined : "lazy")}
      decoding={props.decoding ?? "async"}
      style={mergedStyle}
      onError={() => setError(true)}
    />
  );
}
