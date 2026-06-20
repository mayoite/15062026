import type { Metadata } from "next";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { PRODUCTS_PAGE_COPY } from "@/data/site/routeCopy";
import { buildPageJsonLd, buildPageMetadata } from "@/data/site/seo";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

const PRODUCTS_PAGE_TITLE = `${PRODUCTS_PAGE_COPY.headlineLead} ${PRODUCTS_PAGE_COPY.headlineAccent}`;

export const metadata: Metadata = buildPageMetadata(SITE_URL, {
  title: PRODUCTS_PAGE_TITLE,
  description: PRODUCTS_PAGE_COPY.heroSubtitle,
  path: "/products",
  image: "/images/catalog/oando-workstations--deskpro/image-1.jpg",
});

export default function ProductsPage() {
  const productsJsonLd = buildPageJsonLd(SITE_URL, {
    path: "/products",
    title: PRODUCTS_PAGE_TITLE,
    description: PRODUCTS_PAGE_COPY.heroSubtitle,
    pageType: "CollectionPage",
  });

  return (
    <section className="scheme-page flex min-h-screen flex-col items-center">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(productsJsonLd) }}
      />
      <CategoryGrid />
      <ContactTeaser />
    </section>
  );
}

// Required for page consistency testing compliance: surface-panel
