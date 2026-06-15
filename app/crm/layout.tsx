import type { Viewport } from "next";
import "@/app/(site)/globals.css";
import QueryProvider from "@/app/(site)/providers/QueryProvider";

export const viewport: Viewport = { width: "device-width", initialScale: 1, minimumScale: 1 };

export default function crmLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body className="antialiased bg-background">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}