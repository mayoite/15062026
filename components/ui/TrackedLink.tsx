"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { trackSiteCtaClick } from "@/lib/analytics/siteEvents";

interface TrackedLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  label: string;
  surface: string;
  prefetch?: boolean;
  target?: string;
  rel?: string;
}

function isExternalHref(href: string) {
  return /^(https?:|mailto:|tel:)/i.test(href);
}

export function TrackedLink({
  href,
  children,
  className,
  label,
  surface,
  prefetch,
  target,
  rel,
}: TrackedLinkProps) {
  const pathname = usePathname() || "";

  const handleClick = () => {
    trackSiteCtaClick({
      href,
      label,
      pathname,
      surface,
    });
  };

  if (isExternalHref(href)) {
    return (
      <a href={href} className={className} target={target} rel={rel} onClick={handleClick}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className} prefetch={prefetch} onClick={handleClick}>
      {children}
    </Link>
  );
}
