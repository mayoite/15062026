import type { ReactNode } from "react";
import type { Metadata } from "next";
import "@/app/(site)/globals.css";
import "@/app/css/core/site/bundles/site-surfaces.css";
import "@/app/css/core/site/bundles/footer.css";
import AdminLayoutShell from "@/features/planner/admin/AdminLayoutShell";
import { CsrfBootstrap } from "@/components/security/CsrfBootstrap";
import { requireAdminUser } from "@/lib/auth/adminSession";
import { ciscoSans, helveticaNeue } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Admin | One&Only",
  description: "O&O platform admin console — planner, catalog, and operations.",
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdminUser("/admin");

  return (
    <html lang="en-IN" className={`${ciscoSans.variable} ${helveticaNeue.variable}`}>
      <body className="scheme-page antialiased selection:bg-primary selection:text-inverse">
        <CsrfBootstrap />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[9999] focus:bg-panel focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:outline-none focus:ring-2 focus:ring-primary"
        >
          Skip to main content
        </a>
        <AdminLayoutShell>
          <main id="main-content">{children}</main>
        </AdminLayoutShell>
      </body>
    </html>
  );
}
