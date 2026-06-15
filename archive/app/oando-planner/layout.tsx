import type { Viewport } from "next";
import "@/app/(site)/globals.css"; // Reuse globals from site
import QueryProvider from "@/app/(site)/providers/QueryProvider";
import { ciscoSans, helveticaNeue } from "@/lib/fonts";

import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { AuthProvider } from "@/features/shared/auth/lib/session";

export const viewport: Viewport = { width: "device-width", initialScale: 1, minimumScale: 1 };

export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${ciscoSans.variable} ${helveticaNeue.variable}`}>
      <body className="planner-dark-shell antialiased h-screen w-screen overflow-hidden">
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}