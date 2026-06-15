import { normalizeAssetList, normalizeAssetPath } from "@/lib/assetPaths";
import type { CompatProduct, Product } from "./types";

export function isMissingTableError(message: string | undefined, tableName: string): boolean {
  const normalized = String(message || "").toLowerCase();
  if (!normalized) return false;

  return (
    (normalized.includes("schema cache") &&
      (normalized.includes(`'public.${tableName.toLowerCase()}'`) ||
        normalized.includes(tableName.toLowerCase()))) ||
    (normalized.includes("could not find the table") && normalized.includes(tableName.toLowerCase())) ||
    (normalized.includes("relation") &&
      normalized.includes(tableName.toLowerCase()) &&
      normalized.includes("does not exist"))
  );
}

export function normalizeProducts(rows: Product[]): Product[] {
  return (rows ?? []).map((product) => ({
    ...product,
    images: normalizeAssetList(product.images),
    flagship_image: normalizeAssetPath(product.flagship_image),
    "3d_model": normalizeAssetPath(product["3d_model"]),
    category_id: product.category_id,
  }));
}

export function toCompatProduct(product: Product): CompatProduct {
  const specsObject =
    product.specs && typeof product.specs === "object" && !Array.isArray(product.specs)
      ? (product.specs as Record<string, unknown>)
      : {};
  const specsDimensions =
    typeof specsObject.dimensions === "string" ? specsObject.dimensions.trim() : "";
  const specsMaterials = Array.isArray(specsObject.materials)
    ? specsObject.materials.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const specsFeatures = Array.isArray(specsObject.features)
    ? specsObject.features.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const modelPath = normalizeAssetPath(product["3d_model"]);
  const explicitAlt =
    product.alt_text ||
    product.metadata?.ai_alt_text ||
    product.metadata?.aiAltText ||
    `${product.name} product image`;
  const normalizedImages = normalizeAssetList(product.images);
  const normalizedFlagshipImage = normalizeAssetPath(product.flagship_image);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description || "",
    flagshipImage: normalizedFlagshipImage,
    sceneImages: [],
    variants: [],
    detailedInfo: {
      overview: product.description || "",
      features: specsFeatures,
      dimensions: specsDimensions,
      materials: specsMaterials,
    },
    metadata: {
      ...(product.metadata ?? {}),
      sustainabilityScore: product.specs?.sustainability_score ?? 5,
    },
    "3d_model": modelPath,
    threeDModelUrl: modelPath,
    images: normalizedImages,
    altText: explicitAlt.replace(/\s+/g, " ").trim().slice(0, 140),
    specs: specsObject,
  };
}
