import { NextResponse } from "next/server";
import type { CompatProduct } from '@/features/catalog/getProducts';
import { getCatalog } from '@/features/catalog/getProducts';
import {
  Catalog_CATEGORY_ORDER,
  Catalog_SUBCATEGORY_LABELS,
  classifyToRequestedCategory,
  classifyToRequestedSubcategory,
  getCanonicalSubcategoryId,
  getCatalogCategoryLabel,
} from '@/features/catalog/categories';
import { groupCategories, type CategoryApiItem } from "@/lib/navigation";
import { enforcePublicApiRateLimit } from "@/app/api/_lib/public";

export const dynamic = "force-dynamic";

type FlattenedProduct = {
  product: CompatProduct;
  baseCategoryId: string;
  seriesName: string;
};

export async function GET(request: Request) {
  const rateError = await enforcePublicApiRateLimit(request, "nav-categories:get", 25);
  if (rateError) return rateError;

  try {
    const baseCatalog = await getCatalog();
    const flat: FlattenedProduct[] = [];

    for (const category of baseCatalog) {
      for (const series of category.series) {
        for (const product of series.products) {
          flat.push({
            product,
            baseCategoryId: category.id,
            seriesName: series.name,
          });
        }
      }
    }

    const countMap = new Map<string, number>();
    const subMap = new Map<string, Map<string, number>>();

    for (const categoryId of Catalog_CATEGORY_ORDER) {
      countMap.set(categoryId, 0);
      subMap.set(categoryId, new Map<string, number>());
    }

    for (const item of flat) {
      const mappedCategory = classifyToRequestedCategory({
        product: item.product,
        baseCategoryId: item.baseCategoryId,
        seriesName: item.seriesName,
      });
      countMap.set(mappedCategory, (countMap.get(mappedCategory) || 0) + 1);

      const subcategory = classifyToRequestedSubcategory(mappedCategory, {
        product: item.product,
        baseCategoryId: item.baseCategoryId,
        seriesName: item.seriesName,
      });
 
      const bucket = subMap.get(mappedCategory) as Map<string, number>;
      bucket.set(subcategory, (bucket.get(subcategory) || 0) + 1);
    }

    const categories: CategoryApiItem[] = Catalog_CATEGORY_ORDER.map((categoryId) => {
      const counts = subMap.get(categoryId) || new Map<string, number>();
      const canonicalOrder = Catalog_SUBCATEGORY_LABELS[categoryId] || [];
      const ordered = [...canonicalOrder];

      for (const name of counts.keys()) {
        if (!ordered.includes(name)) ordered.push(name);
      }

      const subcategories = ordered.map((name) => ({
          id: getCanonicalSubcategoryId(categoryId, name),
          name,
          count: counts.get(name) ?? 0,
          href: `/products/${categoryId}?sub=${encodeURIComponent(name)}`,
        }));

      return {
        id: categoryId,
        name: getCatalogCategoryLabel(categoryId, categoryId),
        count: countMap.get(categoryId) || 0,
        subcategories,
      };
    });

    const groups = groupCategories(categories);
    return NextResponse.json({ groups, categories });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nav categories fetch failed" },
      { status: 500 },
    );
  }
}
