"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

interface LogoProps {
  className?: string;
  variant?: "orange" | "white";
}

const ONE_AND_ONLY_LOGO_SRC: Record<NonNullable<LogoProps["variant"]>, string> = {
  orange: "/logo-v2.webp",
  white: "/images/brand/logo-sharp-white.png",
};

export function OneAndOnlyLogo({ className, variant = "orange" }: LogoProps) {
  return (
    <div className={cn("relative flex items-center", className)}>
      <Image
        src={ONE_AND_ONLY_LOGO_SRC[variant]}
        alt="One&Only Furniture"
        width={1024}
        height={263}
        priority
        sizes="(max-width: 768px) 150px, 240px"
        quality={100}
        unoptimized
        className="h-full w-auto object-contain"
      />
    </div>
  );
}
