// @ts-nocheck
"use client";

import { useEffect } from "react";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { setToastStoreRef } from "../data/plannerStore";
import { useToastStore } from "../data/toastStore";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setToastStoreRef(useToastStore.getState());
  }, []);

  return <ThemeProvider>{children}</ThemeProvider>;
}
