import type { Viewport } from "next";
import "@/app/(site)/globals.css";
import "@/app/css/core/site/bundles/footer.css";
import "@/app/css/core/site/bundles/contact.css";
import "@/app/css/core/site/bundles/site-surfaces.css";
import "@/app/css/core/site/bundles/legal.css";
import "@/app/css/core/site/bundles/error.css";
import QueryProvider from "@/app/(site)/providers/QueryProvider";
import { RouteChrome } from "@/components/site/RouteChrome";
import { ciscoSans, helveticaNeue } from "@/lib/fonts";

import { SITE_VIEWPORT } from "@/lib/siteViewport";

export const viewport: Viewport = SITE_VIEWPORT;

export default function opsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-IN"
      data-scroll-behavior="smooth"
      className={`${ciscoSans.variable} ${helveticaNeue.variable} scroll-smooth`}
    >
      <body className="scheme-page antialiased selection:bg-primary selection:text-inverse">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-9999 focus:bg-panel focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:outline-none focus:ring-2 focus:ring-primary"
        >
          Skip to main content
        </a>
        <QueryProvider>
          <RouteChrome position="top" />
          <main id="main-content">{children}</main>
          <RouteChrome position="bottom" />
        </QueryProvider>
      </body>
    </html>
  );
}
