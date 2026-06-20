import { normalizeAssetList, normalizeAssetPath } from "@/lib/assetPaths";
import type { CatalogProduct, ProductSpecs } from "../shared/catalog/types";
import type { CompatCategory, CompatProduct } from '@/features/catalog/getProducts';

export interface PlannerCatalogProduct extends CatalogProduct {
  id: string;
  slug: string;
  category: string;
  price: number;
  flagship_image: string;
  images: string[];
  specs: ProductSpecs;
  metadata: Record<string, unknown>;
  categoryId: string;
  categoryName: string;
  seriesId: string;
  seriesName: string;
  plannerSourceSlug: string;
}

export interface PlannerProductReference {
  productId?: string;
  productSlug?: string;
  plannerSourceSlug?: string;
}

export interface PlannerCatalogIndex {
  byId: Map<string, PlannerCatalogProduct>;
  bySlug: Map<string, PlannerCatalogProduct>;
  bySourceSlug: Map<string, PlannerCatalogProduct>;
}

interface PlannerCatalogLookupAliases {
  ids: string[];
  slugs: string[];
  sourceSlugs: string[];
}

function normalizeLookupKey(value: string | undefined | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.toLowerCase() : null;
}

function readTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function uniqueStrings(values: readonly unknown[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const trimmed = readTrimmedString(value);
    if (!trimmed) continue;

    const normalized = normalizeLookupKey(trimmed);
    if (!normalized || seen.has(normalized)) continue;

    seen.add(normalized);
    result.push(trimmed);
  }

  return result;
}

function mergeStringLists(
  primary: readonly unknown[] | undefined,
  fallback: readonly unknown[] | undefined,
): string[] {
  return uniqueStrings([...(primary ?? []), ...(fallback ?? [])]);
}

function isNonEmptyPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length > 0
  );
}

function hasPresentValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function readMetadataStringList(
  metadata: Record<string, unknown> | undefined,
  key: string,
): string[] {
  const value = metadata?.[key];
  if (!Array.isArray(value)) return [];
  return uniqueStrings(value);
}

function collectPlannerCatalogLookupAliases(
  product: Pick<
    PlannerCatalogProduct,
    "id" | "slug" | "plannerSourceSlug" | "metadata"
  >,
): PlannerCatalogLookupAliases {
  const metadata = product.metadata ?? {};

  return {
    ids: uniqueStrings([
      product.id,
      metadata.plannerCatalogProductId,
      ...readMetadataStringList(metadata, "plannerCatalogLookupIds"),
    ]),
    slugs: uniqueStrings([
      product.slug,
      metadata.plannerCatalogSlug,
      ...readMetadataStringList(metadata, "plannerCatalogLookupSlugs"),
    ]),
    sourceSlugs: uniqueStrings([
      product.plannerSourceSlug,
      metadata.plannerSourceSlug,
      ...readMetadataStringList(metadata, "plannerCatalogLookupSourceSlugs"),
    ]),
  };
}

function buildPlannerCatalogLookupMetadata(
  product: PlannerCatalogProduct,
): Record<string, unknown> {
  const aliases = collectPlannerCatalogLookupAliases(product);

  return {
    ...product.metadata,
    plannerSourceSlug: product.plannerSourceSlug,
    plannerCatalogProductId: product.id,
    plannerCatalogSlug: product.slug,
    plannerCatalogCategoryId: product.categoryId,
    plannerCatalogCategoryName: product.categoryName,
    plannerCatalogSeriesId: product.seriesId,
    plannerCatalogSeriesName: product.seriesName,
    plannerCatalogLookupIds: aliases.ids,
    plannerCatalogLookupSlugs: aliases.slugs,
    plannerCatalogLookupSourceSlugs: aliases.sourceSlugs,
  };
}

function collectPlannerCatalogMergeKeys(product: PlannerCatalogProduct): {
  ids: string[];
  slugLike: string[];
} {
  const aliases = collectPlannerCatalogLookupAliases(product);
  return {
    ids: aliases.ids
      .map((value) => normalizeLookupKey(value))
      .filter((value): value is string => Boolean(value)),
    slugLike: uniqueStrings([...aliases.slugs, ...aliases.sourceSlugs])
      .map((value) => normalizeLookupKey(value))
      .filter((value): value is string => Boolean(value)),
  };
}

function pickFallbackPriceRange(product: CompatProduct) {
  return String(product.metadata?.priceRange ?? "").toLowerCase();
}

function resolvePlannerProductPrice(product: CompatProduct): number {
  const priceRange = pickFallbackPriceRange(product);
  if (priceRange === "budget") return 18000;
  if (priceRange === "mid") return 25000;
  if (priceRange === "premium") return 45000;
  if (priceRange === "luxury") return 65000;
  return 25000;
}

function resolvePlannerSourceSlug(product: CompatProduct): string {
  const slug =
    normalizeLookupKey(product.slug) ??
    normalizeLookupKey(product.metadata?.canonicalSlugV2);
  return slug ?? product.id;
}

function resolvePlannerSpecs(product: CompatProduct): ProductSpecs {
  const specs =
    product.specs &&
    typeof product.specs === "object" &&
    !Array.isArray(product.specs)
      ? product.specs
      : {};

  return {
    ...specs,
    dimensions:
      typeof specs.dimensions === "string" && specs.dimensions.trim().length > 0
        ? specs.dimensions.trim()
        : product.detailedInfo.dimensions,
    features:
      Array.isArray(specs.features) && specs.features.length > 0
        ? specs.features
        : product.detailedInfo.features,
    materials:
      Array.isArray(specs.materials) && specs.materials.length > 0
        ? specs.materials
        : product.detailedInfo.materials,
  };
}

export function normalizePlannerCatalogProduct(
  category: CompatCategory,
  series: CompatCategory["series"][number],
  product: CompatProduct,
): PlannerCatalogProduct {
  const plannerSourceSlug = resolvePlannerSourceSlug(product);
  const flagshipImage = normalizeAssetPath(product.flagshipImage);
  const images = normalizeAssetList(product.images ?? product.sceneImages);
  const categoryName = category.name.trim();
  const seriesName = series.name.trim();
  const resolvedCategory =
    String(
      (product.metadata?.category ?? categoryName) || "Workstations",
    ).trim() || "Workstations";
  const resolvedCategoryId =
    normalizeLookupKey(product.metadata?.categoryIdCanonical ?? category.id) ??
    category.id;
  const resolvedSeriesId =
    normalizeLookupKey(
      product.metadata?.canonicalSeriesId ??
        product.metadata?.seriesId ??
        series.id,
    ) ?? series.id;
  const resolvedSlug =
    normalizeLookupKey(product.slug) ??
    normalizeLookupKey(product.metadata?.canonicalSlugV2) ??
    product.id;

  const normalizedProduct: PlannerCatalogProduct = {
    ...product,
    id: product.id,
    slug: resolvedSlug,
    name: product.name,
    category: resolvedCategory,
    price: resolvePlannerProductPrice(product),
    flagship_image: flagshipImage,
    images,
    specs: resolvePlannerSpecs(product),
    metadata: {
      ...product.metadata,
    },
    categoryId: resolvedCategoryId,
    categoryName,
    seriesId: resolvedSeriesId,
    seriesName,
    plannerSourceSlug,
  };

  normalizedProduct.metadata =
    buildPlannerCatalogLookupMetadata(normalizedProduct);
  return normalizedProduct;
}

export function normalizePlannerCatalogProducts(
  catalog: CompatCategory[],
): PlannerCatalogProduct[] {
  return catalog.flatMap((category) =>
    category.series.flatMap((series) =>
      series.products.map((product) =>
        normalizePlannerCatalogProduct(category, series, product),
      ),
    ),
  );
}

export function mergePlannerCatalogProducts(
  legacyProducts: readonly PlannerCatalogProduct[],
  plannerManagedProducts: readonly PlannerCatalogProduct[] = [],
): PlannerCatalogProduct[] {
  if (plannerManagedProducts.length === 0) return [...legacyProducts];
  if (legacyProducts.length === 0) {
    return plannerManagedProducts.map((product) => ({
      ...product,
      metadata: buildPlannerCatalogLookupMetadata(product),
    }));
  }

  const mergedEntries: Array<{
    active: boolean;
    product: PlannerCatalogProduct;
  }> = legacyProducts.map((product) => ({
    active: true,
    product: {
      ...product,
      metadata: buildPlannerCatalogLookupMetadata(product),
    },
  }));

  const idToIndex = new Map<string, number>();
  const slugToIndex = new Map<string, number>();

  const indexProduct = (product: PlannerCatalogProduct, index: number) => {
    const mergeKeys = collectPlannerCatalogMergeKeys(product);
    for (const key of mergeKeys.ids) idToIndex.set(key, index);
    for (const key of mergeKeys.slugLike) slugToIndex.set(key, index);
  };

  for (let index = 0; index < mergedEntries.length; index += 1) {
    indexProduct(mergedEntries[index].product, index);
  }

  for (const plannerManagedProduct of plannerManagedProducts) {
    const normalizedManagedProduct: PlannerCatalogProduct = {
      ...plannerManagedProduct,
      metadata: buildPlannerCatalogLookupMetadata(plannerManagedProduct),
    };
    const mergeKeys = collectPlannerCatalogMergeKeys(normalizedManagedProduct);
    const matchingIndexes = [
      ...new Set([
        ...mergeKeys.ids.map((key) => idToIndex.get(key)),
        ...mergeKeys.slugLike.map((key) => slugToIndex.get(key)),
      ]),
    ].filter(
      (value): value is number =>
        value !== undefined && mergedEntries[value]?.active,
    );

    if (matchingIndexes.length === 0) {
      const nextIndex = mergedEntries.length;
      mergedEntries.push({ active: true, product: normalizedManagedProduct });
      indexProduct(normalizedManagedProduct, nextIndex);
      continue;
    }

    const [targetIndex, ...duplicateIndexes] = matchingIndexes;
    let mergedProduct = mergePlannerCatalogProductRecords(
      normalizedManagedProduct,
      mergedEntries[targetIndex].product,
    );

    for (const duplicateIndex of duplicateIndexes) {
      mergedProduct = mergePlannerCatalogProductRecords(
        mergedProduct,
        mergedEntries[duplicateIndex].product,
      );
      mergedEntries[duplicateIndex].active = false;
    }

    mergedEntries[targetIndex].product = mergedProduct;
    indexProduct(mergedProduct, targetIndex);
  }

  return mergedEntries
    .filter((entry) => entry.active)
    .map((entry) => entry.product);
}

function mergePlannerCatalogProductRecords(
  preferred: PlannerCatalogProduct,
  fallback: PlannerCatalogProduct,
): PlannerCatalogProduct {
  const merged = { ...fallback } as PlannerCatalogProduct;

  for (const [key, value] of Object.entries(preferred)) {
    if (key === "images" || key === "metadata" || key === "specs") continue;
    if (hasPresentValue(value)) {
      (merged as Record<string, unknown>)[key] = value;
    }
  }

  merged.images = mergeStringLists(preferred.images, fallback.images);
  merged.specs = {
    ...(isNonEmptyPlainObject(fallback.specs) ? fallback.specs : {}),
    ...(isNonEmptyPlainObject(preferred.specs) ? preferred.specs : {}),
  };
  merged.metadata = {
    ...(isNonEmptyPlainObject(fallback.metadata) ? fallback.metadata : {}),
    ...(isNonEmptyPlainObject(preferred.metadata) ? preferred.metadata : {}),
  };
  merged.flagship_image =
    readTrimmedString(preferred.flagship_image) ??
    readTrimmedString(fallback.flagship_image) ??
    "";
  merged.id = readTrimmedString(preferred.id) ?? fallback.id;
  merged.slug = readTrimmedString(preferred.slug) ?? fallback.slug;
  merged.category = readTrimmedString(preferred.category) ?? fallback.category;
  merged.plannerSourceSlug =
    readTrimmedString(preferred.plannerSourceSlug) ??
    fallback.plannerSourceSlug;
  merged.categoryId =
    readTrimmedString(preferred.categoryId) ?? fallback.categoryId;
  merged.categoryName =
    readTrimmedString(preferred.categoryName) ?? fallback.categoryName;
  merged.seriesId = readTrimmedString(preferred.seriesId) ?? fallback.seriesId;
  merged.seriesName =
    readTrimmedString(preferred.seriesName) ?? fallback.seriesName;
  merged.name = readTrimmedString(preferred.name) ?? fallback.name;
  merged.price = typeof preferred.price === "number" ? preferred.price : fallback.price;
  merged.metadata = buildPlannerCatalogLookupMetadata(merged);

  return merged;
}

export function buildPlannerCatalogIndex(
  products: readonly PlannerCatalogProduct[],
): PlannerCatalogIndex {
  const byId = new Map<string, PlannerCatalogProduct>();
  const bySlug = new Map<string, PlannerCatalogProduct>();
  const bySourceSlug = new Map<string, PlannerCatalogProduct>();

  for (const product of products) {
    const aliases = collectPlannerCatalogLookupAliases(product);

    for (const id of aliases.ids) {
      const normalizedId = normalizeLookupKey(id);
      if (normalizedId && !byId.has(normalizedId))
        byId.set(normalizedId, product);
    }

    for (const slug of aliases.slugs) {
      const normalizedSlug = normalizeLookupKey(slug);
      if (normalizedSlug && !bySlug.has(normalizedSlug))
        bySlug.set(normalizedSlug, product);
    }

    for (const sourceSlug of aliases.sourceSlugs) {
      const normalizedSourceSlug = normalizeLookupKey(sourceSlug);
      if (normalizedSourceSlug && !bySourceSlug.has(normalizedSourceSlug))
        bySourceSlug.set(normalizedSourceSlug, product);
    }
  }

  return { byId, bySlug, bySourceSlug };
}

export function resolvePlannerCatalogProductByReference(
  products: readonly PlannerCatalogProduct[],
  reference: PlannerProductReference | null | undefined,
): PlannerCatalogProduct | null {
  if (!reference) return null;
  const index = buildPlannerCatalogIndex(products);

  const candidateId = normalizeLookupKey(reference.productId);
  if (candidateId) {
    const byId = index.byId.get(candidateId);
    if (byId) return byId;
  }

  const candidateSlug = normalizeLookupKey(reference.productSlug);
  if (candidateSlug) {
    const bySlug = index.bySlug.get(candidateSlug);
    if (bySlug) return bySlug;
  }

  const candidateSourceSlug = normalizeLookupKey(reference.plannerSourceSlug);
  if (candidateSourceSlug) {
    const bySourceSlug = index.bySourceSlug.get(candidateSourceSlug);
    if (bySourceSlug) return bySourceSlug;
  }

  return null;
}

export function resolvePlannerCatalogProductById(
  products: readonly PlannerCatalogProduct[],
  productId: string,
): PlannerCatalogProduct | null {
  return resolvePlannerCatalogProductByReference(products, { productId });
}

export function resolvePlannerCatalogProductBySlug(
  products: readonly PlannerCatalogProduct[],
  productSlug: string,
): PlannerCatalogProduct | null {
  return resolvePlannerCatalogProductByReference(products, { productSlug });
}
