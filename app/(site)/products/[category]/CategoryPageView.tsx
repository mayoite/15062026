import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Hero } from "@/components/home/Hero";
import { DEFAULT_HERO_FALLBACK } from "@/data/site/homepage";
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

import { FilterGrid } from "./FilterGrid";

const BASE_URL = SITE_URL;

function GridSkeleton() {
  return (
    <div className="container-wide py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-muted rounded-sm aspect-4/3" />
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
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center scheme-page">
        <h1 className="text-2xl font-light mb-4 text-strong">{CATEGORY_ROUTE_COPY.offlineTitle}</h1>
        <p className="max-w-md text-muted mb-8">{CATEGORY_ROUTE_COPY.offlineDescription}</p>
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

  const firstProductWithImage = normalizedCategory.series
    .flatMap((series) => series.products)
    .find((product) => product.images?.[0] || product.flagshipImage);
  const heroImage =
    firstProductWithImage?.images?.[0] ||
    firstProductWithImage?.flagshipImage ||
    DEFAULT_HERO_FALLBACK;
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
    <div className="flex min-h-screen flex-col items-center scheme-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Hero
        variant="small"
        title={normalizedCategory.name}
        subtitle={normalizedCategory.description}
        showButton={false}
        backgroundImage={heroImage}
      />
      <Suspense fallback={<GridSkeleton />}>
        <FilterGrid category={normalizedCategory} categoryId={categoryId} />
      </Suspense>
    </div>
  );
}