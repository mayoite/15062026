import { supabase } from '@/platform/drizzle/db';
import { normalizeAssetPath } from "@/lib/assetPaths";
import { fetchWithSupabaseRetry } from '@/platform/supabase/safe';

type ProductSpecsRow = {
  product_id: string;
  specs: Record<string, unknown> | null;
};

type ProductImageKind = "flagship" | "gallery" | "scene" | "variant" | "other";

type ProductImageRow = {
  product_id: string;
  image_url: string | null;
  image_kind: ProductImageKind | null;
  sort_order: number | null;
};

export type ProductImageBundle = {
  flagshipImage: string;
  images: string[];
  sceneImages: string[];
};

let specsTableMissing = false;
let imagesTableMissing = false;
let loggedSpecsMissing = false;
let loggedImagesMissing = false;

function toSpecsObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  return { ...(input as Record<string, unknown>) };
}

function isMissingTableError(message?: string): boolean {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes("could not find the table") ||
    normalized.includes("does not exist") ||
    normalized.includes("relation \"public.")
  );
}

function uniqueIds(productIds: readonly string[]): string[] {
  return [...new Set(productIds.filter(Boolean))];
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function fetchProductSpecsMap(
  productIds: readonly string[],
): Promise<Map<string, Record<string, unknown>>> {
  const ids = uniqueIds(productIds).filter(isUuidLike);
  const result = new Map<string, Record<string, unknown>>();
  if (ids.length === 0 || specsTableMissing) return result;

  const data = await fetchWithSupabaseRetry<ProductSpecsRow[]>(
    "product_specs",
    async () => {
      const response = await supabase
        .from("product_specs")
        .select("product_id, specs")
        .in("product_id", ids);

      if (response.error && isMissingTableError(response.error.message)) {
        specsTableMissing = true;
        if (!loggedSpecsMissing) {
          loggedSpecsMissing = true;
          console.warn("[product_specs] table missing; falling back to products.specs");
        }
        return { data: [], error: null };
      }

      return response;
    },
    [],
  );

  for (const row of (data ?? []) as ProductSpecsRow[]) {
    result.set(row.product_id, toSpecsObject(row.specs));
  }

  return result;
}

export async function fetchProductImagesMap(
  productIds: readonly string[],
): Promise<Map<string, ProductImageBundle>> {
  const ids = uniqueIds(productIds).filter(isUuidLike);
  const result = new Map<string, ProductImageBundle>();
  if (ids.length === 0 || imagesTableMissing) return result;

  const data = await fetchWithSupabaseRetry<ProductImageRow[]>(
    "product_images",
    async () => {
      const response = await supabase
        .from("product_images")
        .select("product_id, image_url, image_kind, sort_order")
        .in("product_id", ids)
        .order("sort_order", { ascending: true });

      if (response.error && isMissingTableError(response.error.message)) {
        imagesTableMissing = true;
        if (!loggedImagesMissing) {
          loggedImagesMissing = true;
          console.warn(
            "[product_images] table missing; falling back to products image columns",
          );
        }
        return { data: [], error: null };
      }

      return response;
    },
    [],
  );

  for (const row of (data ?? []) as ProductImageRow[]) {
    const normalized = normalizeAssetPath(row.image_url);
    if (!normalized) continue;

    const current = result.get(row.product_id) || {
      flagshipImage: "",
      images: [],
      sceneImages: [],
    };

    const kind = row.image_kind || "gallery";
    if (kind === "flagship") {
      if (!current.flagshipImage) current.flagshipImage = normalized;
    } else if (kind === "scene") {
      current.sceneImages.push(normalized);
    } else {
      current.images.push(normalized);
    }

    result.set(row.product_id, current);
  }

  for (const [productId, bundle] of result.entries()) {
    result.set(productId, {
      flagshipImage: bundle.flagshipImage,
      images: dedupe(bundle.images),
      sceneImages: dedupe(bundle.sceneImages),
    });
  }

  return result;
}
