import { z } from "zod";

// ============================================================================
// Product Categories
// ============================================================================

/**
 * PlannerManagedProduct - Planner-specific product representation and ownership boundary.
 *
 * Phase 2 Data & Model Ownership (MASTER_PLANNER_PLAN.md):
 * - Clarifies ownership of product data vs. planner-specific metadata:
 *   - Core product data (name, base dims, image, category, slug): owned by catalog system (lib/catalog, data/site, Supabase catalog tables).
 *   - Planner-managed overlay (planner-specific width/depth/heightMm, meshType for 3d rendering, visible flag for planner catalog filtering, optional productSlug link): owned here in features/planner/.
 * - Used for furniture placement, 3d meshes (FurnitureMesh), catalog UI, quote generation, compliance, exports.
 * - Bridge fns (productToCatalogItem / catalogItemToProduct) for persistence roundtrip.
 * - See plannerDocument.ts for how scene elements reference managed products; canPlaceProduct etc utils.
 *
 * This separation keeps catalog pure while planner adds layout/visibility/mesh concerns.
 * Legacy configurator has its own catalogue/ handling.
 */

export type ProductCategory =
  | "desk"
  | "chair"
  | "storage"
  | "table"
  | "meeting"
  | "sofa"
  | "accessory"
  | "plant"
  | "lighting"
  | "other";

export type ProductMeshType =
  | "box"
  | "cylinder"
  | "sphere"
  | "custom"
  | "glb"
  | "gltf";

// ============================================================================
// Planner Managed Product Schema
// ============================================================================

export const PlannerManagedProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(50),
  subcategory: z.string().min(1).max(50).optional(),
  widthMm: z.number().positive(),
  depthMm: z.number().positive(),
  heightMm: z.number().positive(),
  imageUrl: z.string().url(),
  meshType: z.string().min(1),
  visible: z.boolean(),
  productSlug: z.string().optional(),
});

export type PlannerManagedProduct = z.infer<typeof PlannerManagedProductSchema>;

// ============================================================================
// Database Row Types
// ============================================================================

export interface CatalogItemWrite {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  width_mm: number;
  depth_mm: number;
  height_mm: number;
  image_url: string;
  mesh_type: string;
  visible: boolean;
  product_slug: string | null;
}

export interface CatalogItemRead extends CatalogItemWrite {
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Bridge Functions
// ============================================================================

/**
 * Converts a PlannerManagedProduct to a catalog database row
 */
export function productToCatalogItem(product: PlannerManagedProduct): CatalogItemWrite {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    subcategory: product.subcategory ?? null,
    width_mm: product.widthMm,
    depth_mm: product.depthMm,
    height_mm: product.heightMm,
    image_url: product.imageUrl,
    mesh_type: product.meshType,
    visible: product.visible,
    product_slug: product.productSlug ?? null,
  };
}

/**
 * Converts a catalog database row to a PlannerManagedProduct
 */
export function catalogItemToProduct(row: CatalogItemRead): PlannerManagedProduct {
  return PlannerManagedProductSchema.parse({
    id: row.id,
    name: row.name,
    category: row.category,
    subcategory: row.subcategory ?? undefined,
    widthMm: row.width_mm,
    depthMm: row.depth_mm,
    heightMm: row.height_mm,
    imageUrl: row.image_url,
    meshType: row.mesh_type,
    visible: row.visible,
    productSlug: row.product_slug ?? undefined,
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validates if a product can be placed in the planner
 */
export function canPlaceProduct(product: PlannerManagedProduct): boolean {
  return (
    product.visible &&
    product.widthMm > 0 &&
    product.depthMm > 0 &&
    product.heightMm > 0
  );
}

/**
 * Gets the area of a product in square millimeters
 */
export function getProductAreaMm(product: PlannerManagedProduct): number {
  return product.widthMm * product.depthMm;
}

/**
 * Gets the area of a product in square meters
 */
export function getProductAreaSqM(product: PlannerManagedProduct): number {
  return getProductAreaMm(product) / 1_000_000;
}

/**
 * Filters products by category
 */
export function filterProductsByCategory(
  products: PlannerManagedProduct[],
  category: ProductCategory
): PlannerManagedProduct[] {
  return products.filter((p) => p.category === category);
}

/**
 * Filters visible products
 */
export function filterVisibleProducts(products: PlannerManagedProduct[]): PlannerManagedProduct[] {
  return products.filter((p) => p.visible);
}

/**
 * Sorts products by name
 */
export function sortProductsByName(products: PlannerManagedProduct[]): PlannerManagedProduct[] {
  return [...products].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Gets unique categories from a list of products
 */
export function getProductCategories(products: PlannerManagedProduct[]): string[] {
  const categories = new Set(products.map((p) => p.category));
  return Array.from(categories).sort();
}

const plannerManagedProductText = z.string().trim().min(1);
const plannerManagedProductOptionalText = z
  .string()
  .trim()
  .nullish()
  .transform((value) => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  });

const plannerManagedProductStringArray = z
  .array(z.string().trim())
  .default([])
  .transform((items) => items.filter((item) => item.length > 0));

const plannerManagedProductJsonRecord = z
  .record(z.string(), z.unknown())
  .default({});

export const plannerManagedProductRowSchema = z.object({
  id: z.string().uuid(),
  legacy_product_id: plannerManagedProductOptionalText,
  slug: plannerManagedProductText,
  planner_source_slug: plannerManagedProductText,
  name: plannerManagedProductText,
  description: z.string().default(""),
  category: plannerManagedProductText,
  category_id: plannerManagedProductText,
  category_name: plannerManagedProductText,
  series_id: plannerManagedProductText,
  series_name: plannerManagedProductText,
  flagship_image: z.string().default(""),
  images: plannerManagedProductStringArray,
  specs: plannerManagedProductJsonRecord,
  metadata: plannerManagedProductJsonRecord,
  active: z.boolean().default(true),
  created_by: z
    .string()
    .uuid()
    .nullish()
    .transform((value) => value ?? null),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

export const plannerManagedProductWriteSchema = plannerManagedProductRowSchema
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
  })
  .extend({
    id: z.string().uuid().optional(),
  });

export type PlannerManagedProductRow = z.infer<
  typeof plannerManagedProductRowSchema
>;
export type PlannerManagedProductWrite = z.infer<
  typeof plannerManagedProductWriteSchema
>;