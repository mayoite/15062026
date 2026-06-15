"use client";

import React from "react";
import { ThemeProvider as CanonicalThemeProvider } from "@/lib/theme/ThemeProvider";

export function ThemeProvider({
  children,
  defaultTheme: _defaultTheme = "premium-light",
}: {
  children: React.ReactNode;
  defaultTheme?: string;
}) {
  return <CanonicalThemeProvider>{children}</CanonicalThemeProvider>;
}
