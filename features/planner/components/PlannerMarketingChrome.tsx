"use client";

import { usePathname } from "next/navigation";

import { RouteChrome } from "@/components/site/RouteChrome";

const WORKSPACE_PREFIXES = ["/planner/canvas", "/planner/guest"];

function isWorkspaceRoute(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, "") || "/";
  return WORKSPACE_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}

/** Site nav/footer on planner marketing routes only (`/planner`, `/planner/help`). */
export function PlannerMarketingChrome({ position }: { position: "top" | "bottom" }) {
  const pathname = usePathname() ?? "/";
  if (isWorkspaceRoute(pathname)) {
    return null;
  }
  return <RouteChrome position={position} />;
}
