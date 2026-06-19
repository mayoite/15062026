import type { Viewport } from "next";

/** Shared mobile viewport + browser chrome colors (matches --surface-page tokens). */
export const SITE_VIEWPORT: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#05080C" },
  ],
};
