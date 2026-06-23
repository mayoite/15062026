import type { Viewport } from "next";
import "@/app/(site)/globals.css";
import { requireAdminUser } from "@/lib/auth/adminSession";
import { SITE_VIEWPORT } from "@/lib/siteViewport";

export const viewport: Viewport = SITE_VIEWPORT;

/** Legacy /ops/* URLs — admin session required, then forward into the admin console. */
export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  await requireAdminUser("/admin/customer-queries");
  return children;
}
