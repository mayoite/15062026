"use client";

import type {
  CompatCategory as Category,
  CompatProduct as Product,
} from "@/features/catalog/getProducts";
import { useEffect, useState } from "react";

import { PRICE_RANGES } from "@/features/catalog/filters";
import { hasVerifiedHeadrest, hasVerifiedHeightAdjustable } from "@/features/catalog/traits";
import {
  sanitizeDisplayText,
  filterMeaningfulDimensionText,
  filterMeaningfulMaterialList,
} from "@/lib/displayText";
import { normalizeAssetPath } from "@/lib/assetPaths";

export interface FlatProduct extends Product {
  seriesId: string;
  seriesName: string;
  altText?: string;
  price?: number;
}

export interface FilterResponse {
  products: FlatProduct[];
  total: number;
  facets: {
    series: string[];
    subcategory: string[];
    material: string[];
    priceRange: string[];
    ecoMin: { min: number; max: number };
    featureAvailability: {
      hasHeadrest: boolean;
      isHeightAdjustable: boolean;
      bifmaCertified: boolean;
      isStackable: boolean;
    };
  };
  meta: {
    categoryId: string;
    catalogTotal: number;
  };
}

function normalizeToken(value?: string | null): string {
  return sanitizeDisplayText(String(value || "")).toLowerCase();
}

function dedupePriority(product: FlatProduct): number {
  const slug = String(product.slug || "").trim();
  let score = 0;
  if (slug.startsWith("oando-")) score += 4;
  if (slug.includes("--")) score += 2;
  if (product.metadata?.source === "oando.co.in") score += 1;
  return score;
}

function dedupeFlatProducts(products: FlatProduct[]): FlatProduct[] {
  const bestByKey = new Map<string, FlatProduct>();

  for (const product of products) {
    const key = `${normalizeToken(product.name)}|${normalizeToken(product.metadata?.subcategory || "")}`;
    const existing = bestByKey.get(key);
    if (!existing) {
      bestByKey.set(key, product);
      continue;
    }

    if (dedupePriority(product) > dedupePriority(existing)) {
      bestByKey.set(key, product);
    }
  }

  return Array.from(bestByKey.values());
}

const IMAGE_PLACEHOLDER_PATTERNS = [
  /assets_placeholder/i,
  /fallback\/category\.webp$/i,
  /\.svg$/i,
];

function isUsableImagePath(path: string): boolean {
  const value = path.trim();
  if (!value) return false;
  if (IMAGE_PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value))) {
    return false;
  }
  return true;
}

export function buildImageCandidates(product: Pick<FlatProduct, "images" | "flagshipImage">): string[] {
  const raw = [
    normalizeAssetPath(product.flagshipImage),
    ...(Array.isArray(product.images)
      ? product.images.map((image) => normalizeAssetPath(String(image || "").trim()))
      : []),
  ].filter(Boolean);

  const unique = Array.from(new Set(raw));
  const preferred = unique.filter(isUsableImagePath);
  return preferred.length > 0 ? preferred : unique;
}

function toTextList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

export function toInlineSpec(value: string, max = 72): string {
  const normalized = sanitizeDisplayText(value);
  if (!normalized) return "";
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
}

export function getDisplayDimensions(product: FlatProduct): string {
  const specs = product.specs && typeof product.specs === "object" && !Array.isArray(product.specs)
    ? (product.specs as Record<string, unknown>)
    : {};
  const specDimensions = typeof specs.dimensions === "string" ? specs.dimensions : "";
  const normalizedSpecDimensions = filterMeaningfulDimensionText(specDimensions);
  if (normalizedSpecDimensions) return toInlineSpec(normalizedSpecDimensions, 68);

  const detailed = typeof product.detailedInfo?.dimensions === "string"
    ? product.detailedInfo.dimensions
    : "";
  return toInlineSpec(filterMeaningfulDimensionText(detailed), 68);
}

export function getDisplayMaterials(product: FlatProduct): string {
  const specs = product.specs && typeof product.specs === "object" && !Array.isArray(product.specs)
    ? (product.specs as Record<string, unknown>)
    : {};
  const sourceMaterials = filterMeaningfulMaterialList(toTextList(specs.materials));
  if (sourceMaterials.length > 0) {
    return toInlineSpec(sourceMaterials.slice(0, 2).join(", "), 68);
  }

  const detailed = filterMeaningfulMaterialList(toTextList(product.detailedInfo?.materials));
  return toInlineSpec(detailed.slice(0, 2).join(", "), 68);
}

export function getDisplayUseCase(product: FlatProduct): string {
  const metadataUseCase = Array.isArray(product.metadata?.useCase)
    ? product.metadata?.useCase
    : [];
  if (metadataUseCase.length > 0) {
    return toInlineSpec(metadataUseCase.slice(0, 2).join(", "), 68);
  }

  const specs = product.specs && typeof product.specs === "object" && !Array.isArray(product.specs)
    ? (product.specs as Record<string, unknown>)
    : {};
  const specsUseCase = toTextList(specs.use_case);
  return toInlineSpec(specsUseCase.slice(0, 2).join(", "), 68);
}

export function getProductSignals(product: FlatProduct): string[] {
  const signals: string[] = [];

  if (hasVerifiedHeadrest(product)) signals.push("With headrest");
  if (product.metadata?.isHeightAdjustable) signals.push("Height adjustable");
  if (product.metadata?.isStackable) signals.push("Stackable");
  if (Array.isArray(product.variants) && product.variants.length > 1) {
    signals.push(`${product.variants.length} configurations`);
  }

  return signals.slice(0, 3);
}

export function fallbackAltText(productName: string, categoryName: string): string {
  return sanitizeDisplayText(
    `Product image of ${productName} in ${categoryName} category`,
  ).slice(0, 140);
}

export function getProductRouteKey(product: Pick<FlatProduct, "slug" | "id">): string {
  const slugValue = typeof product.slug === "string" ? product.slug.trim() : "";
  if (slugValue) return slugValue;
  const idValue = typeof product.id === "string" ? product.id.trim() : "";
  return idValue;
}

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function flattenCategoryProducts(category: Category): FlatProduct[] {
  const flattened = category.series.flatMap((series) =>
    series.products.map((product) => ({
      ...product,
      seriesId: series.id,
      seriesName: series.name,
      altText:
        (product as unknown as { altText?: string; alt_text?: string }).altText ||
        (product as unknown as { altText?: string; alt_text?: string }).alt_text ||
        (product.metadata as Record<string, unknown> | undefined)?.ai_alt_text?.toString() ||
        (product.metadata as Record<string, unknown> | undefined)?.aiAltText?.toString() ||
        fallbackAltText(product.name, category.name),
    })),
  );
  return dedupeFlatProducts(flattened);
}

export function buildFallbackFacets(
  categoryId: string,
  products: FlatProduct[],
): FilterResponse["facets"] {
  const uniqueSorted = (items: string[]) => Array.from(new Set(items.filter(Boolean))).sort((a, b) => a.localeCompare(b));

  const subcategoryValues = products.map((product) =>
    sanitizeDisplayText(product.metadata?.subcategory || ""),
  );
  const materialValues = products.flatMap((product) => {
    const specs = product.specs && typeof product.specs === "object" && !Array.isArray(product.specs)
      ? (product.specs as Record<string, unknown>)
      : {};
    return filterMeaningfulMaterialList(toTextList(specs.materials));
  });
  const ecoScores = products
    .map((product) => product.metadata?.sustainabilityScore)
    .filter((score): score is number => typeof score === "number" && Number.isFinite(score));

  const priceRangeSet = new Set<string>();
  let hasHeadrestCount = 0;
  let heightAdjCount = 0;
  let bifmaCount = 0;
  let stackableCount = 0;

  for (const product of products) {
    const price = product.price ?? 0;
    if (price > 0) {
      if (price < 5000) priceRangeSet.add("Under 5,000");
      else if (price < 10000) priceRangeSet.add("5,000-10,000");
      else if (price < 20000) priceRangeSet.add("10,000-20,000");
      else priceRangeSet.add("20,000+");
    }

    if (hasVerifiedHeadrest(product)) hasHeadrestCount += 1;
    if (hasVerifiedHeightAdjustable(product)) heightAdjCount += 1;
    if (product.metadata?.bifmaCertified) bifmaCount += 1;
    if (product.metadata?.isStackable) stackableCount += 1;
  }

  return {
    series: categoryId === "seating"
      ? []
      : uniqueSorted(products.map((product) => product.seriesName)),
    subcategory: uniqueSorted(subcategoryValues),
    material: uniqueSorted(materialValues),
    priceRange: PRICE_RANGES.filter((range) => priceRangeSet.has(range)),
    ecoMin: {
      min: ecoScores.length > 0 ? Math.min(...ecoScores) : 0,
      max: ecoScores.length > 0 ? Math.max(...ecoScores) : 10,
    },
    featureAvailability: {
      hasHeadrest: hasHeadrestCount > 0,
      isHeightAdjustable: heightAdjCount > 0,
      bifmaCertified: bifmaCount > 0,
      isStackable: stackableCount > 0,
    },
  };
}
