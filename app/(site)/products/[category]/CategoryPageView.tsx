import { notFound } from "next/navigation";import { Suspense } from "react";

import { CATEGORY_ROUTE_COPY } from "@/data/site/routeCopy";
import { buildBreadcrumbJsonLd, buildPageJsonLd } from "@/data/site/seo";
import {
  buildRequestedCategoryCatalog,
  getCatalogCategoryDescription,
  getCatalogCategoryLabel,
} from "@/features/catalog/categories";
import type { CompatCategory } from "@/features/catalog/getProducts";
import { getCatalog } from "@/features/catalog/getProducts";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

import { FilterGrid } from "./FilterGrid";

const BASE_URL = SITE_URL;

function GridSkeleton() {
  return (
    <div className="home-shell-xl py-10">
      <div className="grid grid-cols-2 gap-4 sm:gap-5 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}

export async function CategoryPageView({ categoryId }: { categoryId: string }) {
  const requestedCatalog = buildRequestedCategoryCatalog(await getCatalog());
  const category = requestedCatalog.find((c: CompatCategory) => c.id === categoryId);

  if (requestedCatalog.length === 0) {
    return (
      <div className="scheme-page flex min-h-screen flex-col items-center justify-center p-8 text-center">
        <h1 className="mb-4 text-2xl font-light text-strong">{CATEGORY_ROUTE_COPY.offlineTitle}</h1>
        <p className="mb-8 max-w-md text-muted">{CATEGORY_ROUTE_COPY.offlineDescription}</p>
      </div>
    );
  }

  if (!category) {
    notFound();
  }

  const normalizedCategory: CompatCategory = {
    ...category,
    name: getCatalogCategoryLabel(categoryId, category.name),
    description: getCatalogCategoryDescription(categoryId, category.description),
  };

  const categoryPath = `/products/${categoryId}`;
  const categoryJsonLd = buildPageJsonLd(BASE_URL, {
    path: categoryPath,
    title: `${normalizedCategory.name} | ${CATEGORY_ROUTE_COPY.metadataSuffix}`,
    description: normalizedCategory.description,
    pageType: "CollectionPage",
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(BASE_URL, [
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name: normalizedCategory.name, path: categoryPath },
  ]);

  return (
    <div className="scheme-page flex min-h-screen flex-col pt-24 md:pt-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(categoryJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(breadcrumbJsonLd) }}
      />

      <Suspense fallback={<GridSkeleton />}>
        <FilterGrid category={normalizedCategory} categoryId={categoryId} />
      </Suspense>
    </div>
  );
}
