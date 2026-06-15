import type { PlannerCatalogProduct } from "./plannerCatalogCore";
import { plannerManagedProductRowSchema, type PlannerManagedProductRow } from "../model";

function readPlannerManagedProductString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readPlannerManagedProductObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function resolvePlannerManagedProductActiveState(row: Record<string, unknown>): boolean {
  if (typeof row.active === "boolean") {
    return row.active;
  }
  if (typeof row.planner_visible === "boolean") {
    return row.planner_visible;
  }
  if (typeof row.planner_status === "string") {
    return row.planner_status === "approved";
  }
  return true;
}

export function normalizePlannerManagedProductRow(row: unknown): PlannerManagedProductRow {
  const rowObject = readPlannerManagedProductObject(row);
  const specs = readPlannerManagedProductObject(rowObject.specs);
  const metadata = readPlannerManagedProductObject(rowObject.metadata);

  return plannerManagedProductRowSchema.parse({
    ...rowObject,
    legacy_product_id:
      readPlannerManagedProductString(rowObject.legacy_product_id) ??
      readPlannerManagedProductString(metadata.legacyProductId) ??
      readPlannerManagedProductString(metadata.legacy_product_id) ??
      null,
    description:
      readPlannerManagedProductString(rowObject.description) ??
      readPlannerManagedProductString(metadata.description) ??
      "",
    flagship_image:
      readPlannerManagedProductString(rowObject.flagship_image) ??
      readPlannerManagedProductString(rowObject.planner_top_view) ??
      "",
    images: Array.isArray(rowObject.images) ? rowObject.images : [],
    specs,
    metadata,
    active: resolvePlannerManagedProductActiveState(rowObject),
    created_by:
      readPlannerManagedProductString(rowObject.created_by) ??
      readPlannerManagedProductString(rowObject.created_by_user_id) ??
      null,
  });
}

export function plannerManagedProductRowToCatalogProduct(row: PlannerManagedProductRow): PlannerCatalogProduct {
  const metadata = {
    ...row.metadata,
    plannerSourceSlug: row.planner_source_slug,
    plannerCatalogProductId: row.id,
    plannerCatalogSlug: row.slug,
    plannerCatalogCategoryId: row.category_id,
    plannerCatalogCategoryName: row.category_name,
    plannerCatalogSeriesId: row.series_id,
    plannerCatalogSeriesName: row.series_name,
    plannerManaged: true,
    legacyProductId: row.legacy_product_id,
  } satisfies Record<string, unknown>;

  return {
    id: row.id,
    slug: row.slug,
    plannerSourceSlug: row.planner_source_slug,
    name: row.name,
    category: row.category,
    categoryId: row.category_id,
    categoryName: row.category_name,
    seriesId: row.series_id,
    seriesName: row.series_name,
    description: row.description,
    price: row.price,
    flagship_image: row.flagship_image,
    images: row.images,
    specs: row.specs,
    metadata,
    altText: row.name,
    variants: [],
    detailedInfo: {
      overview: row.description,
      features: [],
      dimensions: typeof row.specs.dimensions === "string" ? row.specs.dimensions : "",
      materials: Array.isArray(row.specs.materials)
        ? row.specs.materials.filter((value): value is string => typeof value === "string")
        : [],
    },
    sceneImages: row.images,
    technicalDrawings: [],
    documents: [],
  };
}
