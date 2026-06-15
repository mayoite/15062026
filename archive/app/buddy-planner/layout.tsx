import type { Viewport } from "next";
import "@/app/(site)/globals.css";
import QueryProvider from "@/app/(site)/providers/QueryProvider";
import { ciscoSans, helveticaNeue } from "@/lib/fonts";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";

export const viewport: Viewport = { width: "device-width", initialScale: 1, minimumScale: 1 };

export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${ciscoSans.variable} ${helveticaNeue.variable}`}>
      <body className="antialiased h-screen w-screen overflow-hidden">
        <QueryProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
