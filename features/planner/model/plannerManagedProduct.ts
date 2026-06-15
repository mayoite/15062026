import { z } from "zod";

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

export function canPlaceProduct(product: PlannerManagedProduct): boolean {
  return product.visible && product.widthMm > 0 && product.depthMm > 0 && product.heightMm > 0;
}

export function getProductAreaMm(product: PlannerManagedProduct): number {
  return product.widthMm * product.depthMm;
}

export function getProductAreaSqM(product: PlannerManagedProduct): number {
  return getProductAreaMm(product) / 1_000_000;
}

export function filterProductsByCategory(
  products: PlannerManagedProduct[],
  category: ProductCategory,
): PlannerManagedProduct[] {
  return products.filter((product) => product.category === category);
}

export function filterVisibleProducts(products: PlannerManagedProduct[]): PlannerManagedProduct[] {
  return products.filter((product) => product.visible);
}

export function sortProductsByName(products: PlannerManagedProduct[]): PlannerManagedProduct[] {
  return [...products].sort((left, right) => left.name.localeCompare(right.name));
}

export function getProductCategories(products: PlannerManagedProduct[]): string[] {
  return Array.from(new Set(products.map((product) => product.category))).sort();
}

const plannerManagedProductText = z.string().trim().min(1);
const plannerManagedProductOptionalText = z.string().trim().nullish().transform((value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
});

const plannerManagedProductStringArray = z
  .array(z.string().trim())
  .default([])
  .transform((items) => items.filter((item) => item.length > 0));

const plannerManagedProductJsonRecord = z.record(z.string(), z.unknown()).default({});

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
  price: z.number().int().nonnegative().default(0),
  flagship_image: z.string().default(""),
  images: plannerManagedProductStringArray,
  specs: plannerManagedProductJsonRecord,
  metadata: plannerManagedProductJsonRecord,
  active: z.boolean().default(true),
  created_by: z.string().uuid().nullish().transform((value) => value ?? null),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

export const plannerManagedProductWriteSchema = plannerManagedProductRowSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  id: z.string().uuid().optional(),
});

export type PlannerManagedProductRow = z.infer<typeof plannerManagedProductRowSchema>;
export type PlannerManagedProductWrite = z.infer<typeof plannerManagedProductWriteSchema>;
