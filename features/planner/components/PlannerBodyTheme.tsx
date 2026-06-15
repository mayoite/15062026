"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const WORKSPACE_PREFIXES = ["/planner/canvas", "/planner/guest"];

function usesWorkspaceShell(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, "") || "/";
  return WORKSPACE_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}

/** Route-aware body classes: marketing = scheme-page, editor = planner-workspace. */
export function PlannerBodyTheme() {
  const pathname = usePathname();

  useEffect(() => {
    const workspace = usesWorkspaceShell(pathname);
    document.body.classList.toggle("planner-workspace", workspace);
    document.body.classList.toggle("scheme-page", !workspace);
    document.body.classList.remove("planner-dark-shell");

    if (workspace) {
      document.body.classList.add("h-screen", "w-screen", "overflow-hidden");
    } else {
      document.body.classList.remove("h-screen", "w-screen", "overflow-hidden");
    }

    return () => {
      document.body.classList.remove("planner-workspace", "scheme-page");
    };
  }, [pathname]);

  return null;
}
