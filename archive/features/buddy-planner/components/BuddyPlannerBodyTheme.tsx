"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const LIGHT_ROUTE_PREFIXES = ["/buddy-planner/guest", "/buddy-planner/login"];

function buddyRouteUsesDarkShell(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, "") || "/";
  if (
    LIGHT_ROUTE_PREFIXES.some(
      (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
    )
  ) {
    return false;
  }
  return normalized.startsWith("/buddy-planner");
}

/**
 * Applies `planner-dark-shell` only on authenticated/editor buddy routes.
 * Guest and login stay on the site light palette.
 */
export function BuddyPlannerBodyTheme() {
  const pathname = usePathname();

  useEffect(() => {
    const useDarkShell = buddyRouteUsesDarkShell(pathname);
    document.body.classList.toggle("planner-dark-shell", useDarkShell);
    return () => {
      document.body.classList.remove("planner-dark-shell");
    };
  }, [pathname]);

  return null;
}
