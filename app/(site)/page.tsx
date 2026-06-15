import type { Metadata } from "next";
import "@/app/css/core/site/bundles/homepage.css";
import { HomepageHero } from "@/components/home/HomepageHero";
import { PartnershipBanner } from "@/components/home/PartnershipBanner";
import { BrandStatement } from "@/components/home/BrandStatement";
import { Collections } from "@/components/home/Collections";
import { PlannerSuite } from "@/features/planner/landing/PlannerSuite";
import { Projects } from "@/components/home/Projects";
import { ContactTeaser } from "@/components/shared/ContactTeaser";

import { SITE_BRAND } from "@/lib/analytics/seo";
import { buildPageJsonLd, buildPageMetadata } from "@/lib/analytics/seo";
import { SITE_URL } from "@/lib/siteUrl";

export const metadata: Metadata = buildPageMetadata(SITE_URL, {
  title: SITE_BRAND.defaultTitle,
  description: SITE_BRAND.description,
  path: "/",
});

export default function Home() {
  const homeJsonLd = buildPageJsonLd(SITE_URL, {
    path: "/",
    title: SITE_BRAND.defaultTitle,
    description: SITE_BRAND.description,
    pageType: "WebPage",
  });

  return (
    <div className="min-h-screen overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />

      <HomepageHero />
      <PartnershipBanner />
      <BrandStatement />
      <Collections />
      <Projects />
      <PlannerSuite />
      <ContactTeaser />
    </div>
  );
}
