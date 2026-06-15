import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { CATEGORY_ROUTE_COPY } from "@/data/site/routeCopy";
import { buildPageMetadata } from "@/data/site/seo";
import {
  Catalog_CATEGORY_ORDER,
  buildRequestedCategoryCatalog,
  getCatalogCategoryDescription,
  getCatalogCategoryLabel,
  normalizeRequestedCategoryId,
} from "@/features/catalog/categories";
import type { CompatCategory } from "@/features/catalog/getProducts";
import { getCatalog } from "@/features/catalog/getProducts";
import { supabase } from "@/platform/drizzle/db";
import { fetchWithSupabaseRetry } from "@/platform/supabase/safe";
import { SITE_URL } from "@/lib/siteUrl";

import { CategoryPageView } from "./CategoryPageView";

const BASE_URL = SITE_URL;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: categoryId } = await params;
  const canonicalCategoryId = normalizeRequestedCategoryId(categoryId) || categoryId;
  const requestedCatalog = buildRequestedCategoryCatalog(await getCatalog());
  const category = requestedCatalog.find(
    (c: CompatCategory) => c.id === canonicalCategoryId,
  );
  if (!category) return {};
  const displayName = getCatalogCategoryLabel(canonicalCategoryId, category.name);
  const displayDescription = getCatalogCategoryDescription(
    canonicalCategoryId,
    category.description,
  );
  const title = `${displayName} | ${CATEGORY_ROUTE_COPY.metadataSuffix}`;
  const description = `${displayDescription} ${CATEGORY_ROUTE_COPY.metadataTail.replace(
    "{category}",
    displayName.toLowerCase(),
  )}`;
  return buildPageMetadata(BASE_URL, {
    title,
    description,
    path: `/products/${canonicalCategoryId}`,
  });
}

export async function generateStaticParams() {
  const data = await fetchWithSupabaseRetry<Array<{ category_id: string | null }>>(
    "category-static-params",
    async () => supabase.from("products").select("category_id"),
    [],
  );
  const categoryIds = [
    ...new Set(
      (data ?? [])
        .map((p) => (p.category_id ? normalizeRequestedCategoryId(p.category_id) : null))
        .filter(Boolean),
    ),
  ] as string[];
  const merged = [...new Set([...Catalog_CATEGORY_ORDER, ...categoryIds])];
  return merged.map((category) => ({ category }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categoryId } = await params;
  const canonicalCategoryId = normalizeRequestedCategoryId(categoryId);
  if (!canonicalCategoryId) {
    notFound();
  }
  if (canonicalCategoryId !== categoryId) {
    redirect(`/products/${canonicalCategoryId}`);
  }

  return CategoryPageView({ categoryId: canonicalCategoryId });
}