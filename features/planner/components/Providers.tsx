"use client";

import type { ReactNode } from "react";

import { ThemeProvider } from "@/features/planner/components/WorkspaceThemeProvider";

/** Workspace editor providers (light/dark/system UI theme). */
export function Providers({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
