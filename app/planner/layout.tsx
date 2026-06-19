import type { Viewport } from "next";
import "@/app/(site)/globals.css";
import "@/app/css/core/site/bundles/site-surfaces.css";
import "@/app/css/core/planner/bundles/marketing.css";
import QueryProvider from "@/app/(site)/providers/QueryProvider";
import { ciscoSans, helveticaNeue } from "@/lib/fonts";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { SITE_VIEWPORT } from "@/lib/siteViewport";
import { PlannerBodyTheme } from "@/features/planner/components/PlannerBodyTheme";


export const viewport: Viewport = SITE_VIEWPORT;

export default function PlannerRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" className={`${ciscoSans.variable} ${helveticaNeue.variable}`}>
      <body className="antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[9999] focus:bg-panel focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:outline-none focus:ring-2 focus:ring-primary"
        >
          Skip to main content
        </a>
        <QueryProvider>
          <ThemeProvider>
            <PlannerBodyTheme />
            <main id="main-content">{children}</main>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
