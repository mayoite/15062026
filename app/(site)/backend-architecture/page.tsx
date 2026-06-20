import type { Metadata } from "next";
import { BackendArchitecturePageView } from "@/components/backend-architecture/BackendArchitecturePageView";
import { buildPageMetadata } from "@/data/site/seo";
import { SITE_URL } from "@/lib/siteUrl";

export const metadata: Metadata = buildPageMetadata(SITE_URL, {
  title: "Backend Architecture",
  description:
    "Architecture walkthrough for Supabase, DigitalOcean Postgres, Drizzle, R2, quote flow, and launch checks.",
  path: "/backend-architecture",
  image: "/images/backend-architecture/generated-architecture-board.png",
});

export default function BackendArchitecturePage() {
  return <BackendArchitecturePageView />;
}
