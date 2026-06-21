/**
 * catalogAdminHandlers — shared handlers for the consolidated catalog admin
 * routes. Eliminates the three duplicate configurator-catalog route trees
 * (`admin/buddy-catalog`, `admin/configurator-catalog`, `admin/planner-catalog`)
 * and the separate standard-catalog tree by dispatching on a `type` param.
 *
 * Supported `type` values:
 *   - `standard`     -> `planner_managed_products` (legacy `admin/catalog`)
 *   - `configurator` -> `configurator_products`    (legacy `buddy`/`planner`/`configurator`)
 *   - `buddy`        -> alias for `configurator` (kept for backwards compat)
 *
 * Auth + rate limiting are handled by `withAuth` at the route layer; these
 * handlers receive the validated request and return a NextResponse.
 */

import { randomUUID } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createAdminServiceClient,
  isMissingTableError,
} from "@/app/api/admin/_lib/server";
import { furnitureCatalog, categoryLabels } from "@/features/planner/store/catalogData";
import { normalizePlannerManagedProductRow } from "@/features/planner/store/plannerManagedProductsShared";
import { buildConfiguratorRow } from "@/lib/catalog/configuratorCatalogPayload";
import { ApiError, API_ERROR_CODES } from "./ApiError";
import { success, error, validationError } from "./apiResponse";
import {
  ConfiguratorActiveToggleSchema,
  ConfiguratorCatalogListQuerySchema,
  ConfiguratorProductBodySchema,
  CreateStandardCatalogItemSchema,
  PatchStandardCatalogItemSchema,
  StandardCatalogListQuerySchema,
} from "./schemas";

/** Catalog type discriminator for the parameterized route. */
export type CatalogType = "standard" | "configurator" | "buddy";

/** Canonical catalog types (buddy is an alias for configurator). */
export const CATALOG_TYPES: CatalogType[] = ["standard", "configurator", "buddy"];

/** Resolve `buddy` -> `configurator`; validate the type. */
export function resolveCatalogType(raw: string): CatalogType {
  if (raw === "buddy") return "configurator";
  if (raw === "standard" || raw === "configurator") return raw;
  throw new ApiError(
    400,
    API_ERROR_CODES.INVALID_INPUT,
    `Invalid catalog type: ${raw}. Expected one of: ${CATALOG_TYPES.join(", ")}`,
  );
}

// ---------------------------------------------------------------------------
// Standard catalog (planner_managed_products)
// ---------------------------------------------------------------------------

type CatalogResponseRow = {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  width_mm: number;
  depth_mm: number;
  height_mm: number;
  price: number | null;
  image_url: string | null;
  mesh_type: string;
  visible: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function mapLocalCatalogCategory(category: string, shape: string) {
  if (category === "desks") return "workstation";
  if (category === "tables") return "table";
  if (category === "storage") return "storage";
  if (category === "seating" || category === "soft-seating") return "seating";
  if (shape.includes("screen") || shape.includes("partition")) return "partition";
  return "misc";
}

function buildLocalCatalogRows(): CatalogResponseRow[] {
  const now = new Date().toISOString();
  return furnitureCatalog.map((item) => ({
    id: item.id,
    name: item.name,
    category: mapLocalCatalogCategory(item.category, item.shape),
    subcategory: item.shape,
    width_mm: item.widthMm,
    depth_mm: item.depthMm,
    height_mm: item.heightMm,
    price: item.priceInr || null,
    image_url: item.iconPath || null,
    mesh_type: item.shape,
    visible: true,
    description: `${categoryLabels[item.category]} catalog item`,
    created_at: now,
    updated_at: now,
  }));
}

function mapManagedRowToCatalogResponse(row: unknown): CatalogResponseRow {
  const normalized = normalizePlannerManagedProductRow(row);
  const specs = normalized.specs || {};
  const width = Number(specs.widthMm ?? specs.width_mm ?? 0) || 0;
  const depth = Number(specs.depthMm ?? specs.depth_mm ?? 0) || 0;
  const height = Number(specs.heightMm ?? specs.height_mm ?? 0) || 0;
  const price = Number(specs.priceInr ?? specs.price ?? 0) || null;

  return {
    id: normalized.id,
    name: normalized.name,
    category: normalized.category,
    subcategory: normalized.series_name || null,
    width_mm: width,
    depth_mm: depth,
    height_mm: height,
    price,
    image_url: normalized.flagship_image || null,
    mesh_type: typeof specs.meshType === "string" ? specs.meshType : "box",
    visible: normalized.active,
    description: normalized.description || null,
    created_at: normalized.created_at,
    updated_at: normalized.updated_at,
  };
}

function buildManagedProductPayload(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const subcategory =
    typeof body.subcategory === "string" ? body.subcategory.trim() : "";
  const width = Number(body.width_mm) || 0;
  const depth = Number(body.depth_mm) || 0;
  const height = Number(body.height_mm) || 0;
  const price = Number(body.price) || 0;
  const meshType =
    typeof body.mesh_type === "string" && body.mesh_type.trim()
      ? body.mesh_type.trim()
      : "box";

  const slugBase = slugify(name || `${category}-${subcategory}` || "catalog-item");
  const timestamp = new Date().toISOString();

  return {
    id:
      typeof body.id === "string" && body.id.trim()
        ? body.id.trim()
        : randomUUID(),
    slug: slugBase,
    planner_source_slug: slugBase,
    name,
    description:
      typeof body.description === "string" ? body.description.trim() : "",
    category,
    category_id: slugify(category || "catalog"),
    category_name: category || "Catalog",
    series_id: slugify(subcategory || category || "general"),
    series_name: subcategory || category || "General",
    flagship_image:
      typeof body.image_url === "string" ? body.image_url.trim() : "",
    images:
      typeof body.image_url === "string" && body.image_url.trim()
        ? [body.image_url.trim()]
        : [],
    specs: {
      widthMm: width,
      depthMm: depth,
      heightMm: height,
      priceInr: price,
      meshType,
      dimensions: `${width} x ${depth} x ${height} mm`,
    },
    metadata: {
      source: "admin-catalog",
    },
    active: body.visible !== false,
    created_by: null,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

/** GET handler for the standard catalog (planner_managed_products). */
export async function listStandardCatalog(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const parsed = StandardCatalogListQuerySchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
    visible: url.searchParams.get("visible") ?? undefined,
  });
  if (!parsed.success) return validationError(parsed.error.issues);
  const { page, limit, category, search, visible } = parsed.data;

  const supabase = createAdminServiceClient();
  let items: CatalogResponseRow[] = [];
  let source = "local-catalog";

  if (supabase) {
    const { data, error: dbError } = await supabase
      .from("planner_managed_products")
      .select("*")
      .order("updated_at", { ascending: false });

    if (!dbError && data) {
      items = data.map(mapManagedRowToCatalogResponse);
      source = "planner_managed_products";
    } else if (!dbError || !isMissingTableError(dbError?.message)) {
      return error(
        new ApiError(500, API_ERROR_CODES.DATABASE_ERROR, "Failed to fetch catalog items"),
      );
    }
  }

  if (items.length === 0) {
    items = buildLocalCatalogRows();
  }

  let filtered = items;
  if (category) {
    filtered = filtered.filter((item) => item.category.toLowerCase() === category);
  }
  if (search) {
    filtered = filtered.filter((item) =>
      [item.name, item.category, item.subcategory, item.description]
        .filter(Boolean)
        .some((value) => value ? value.toLowerCase().includes(search) : false),
    );
  }
  if (visible === "true" || visible === "false") {
    const expected = visible === "true";
    filtered = filtered.filter((item) => item.visible === expected);
  }

  const total = filtered.length;
  const from = (page - 1) * limit;
  const paged = filtered.slice(from, from + limit);

  return success({
    items: paged,
    catalog_items: paged,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    source,
  });
}

/** POST handler for the standard catalog (planner_managed_products). */
export async function createStandardCatalog(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = CreateStandardCatalogItemSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error.issues);
  const validated = parsed.data;

  const supabase = createAdminServiceClient();
  if (!supabase) {
    return error(
      new ApiError(503, API_ERROR_CODES.SERVICE_UNAVAILABLE, "Catalog storage is not configured"),
    );
  }

  const payload = buildManagedProductPayload(validated as Record<string, unknown>);
  const { data, error: dbError } = await supabase
    .from("planner_managed_products")
    .insert(payload as never)
    .select("*")
    .single();

  if (dbError) {
    return error(
      new ApiError(
        isMissingTableError(dbError.message) ? 503 : 500,
        isMissingTableError(dbError.message)
          ? API_ERROR_CODES.SERVICE_UNAVAILABLE
          : API_ERROR_CODES.DATABASE_ERROR,
        "Failed to create catalog item",
      ),
    );
  }

  return success(
    { item: mapManagedRowToCatalogResponse(data), source: "planner_managed_products" },
    201,
  );
}

/** PATCH handler for a standard catalog item by id. */
export async function patchStandardCatalog(
  req: NextRequest,
  id: string,
): Promise<NextResponse> {
  if (!id?.trim()) {
    return error(
      new ApiError(400, API_ERROR_CODES.MISSING_REQUIRED_FIELD, "Item ID is required"),
    );
  }
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = PatchStandardCatalogItemSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error.issues);
  const validated = parsed.data;

  const supabase = createAdminServiceClient();
  if (!supabase) {
    return error(
      new ApiError(503, API_ERROR_CODES.SERVICE_UNAVAILABLE, "Catalog storage is not configured"),
    );
  }

  const { data: existing, error: existingError } = await supabase
    .from("planner_managed_products")
    .select("*")
    .eq("id", id)
    .single();

  if (existingError || !existing) {
    return error(
      new ApiError(
        isMissingTableError(existingError?.message) ? 503 : 404,
        isMissingTableError(existingError?.message)
          ? API_ERROR_CODES.SERVICE_UNAVAILABLE
          : API_ERROR_CODES.RESOURCE_NOT_FOUND,
        "Catalog item not found",
      ),
    );
  }

  const row = normalizePlannerManagedProductRow(existing);
  const nextName =
    typeof validated.name === "string" && validated.name.trim() ? validated.name.trim() : row.name;
  const nextCategory =
    typeof validated.category === "string" && validated.category.trim()
      ? validated.category.trim()
      : row.category;
  const nextSubcategory =
    typeof validated.subcategory === "string" && validated.subcategory.trim()
      ? validated.subcategory.trim()
      : row.series_name;
  const nextImage =
    typeof validated.image_url === "string" ? validated.image_url.trim() : row.flagship_image;
  const nextDescription =
    typeof validated.description === "string" ? validated.description.trim() : row.description;

  const existingSpecs = row.specs || {};
  const width = Number(validated.width_mm ?? existingSpecs.widthMm ?? existingSpecs.width_mm ?? 0) || 0;
  const depth = Number(validated.depth_mm ?? existingSpecs.depthMm ?? existingSpecs.depth_mm ?? 0) || 0;
  const height = Number(validated.height_mm ?? existingSpecs.heightMm ?? existingSpecs.height_mm ?? 0) || 0;
  const price = Number(validated.price ?? existingSpecs.priceInr ?? existingSpecs.price ?? 0) || 0;
  const meshType =
    typeof validated.mesh_type === "string" && validated.mesh_type.trim()
      ? validated.mesh_type.trim()
      : typeof existingSpecs.meshType === "string"
        ? existingSpecs.meshType
        : "box";

  const payload = {
    slug: slugify(nextName) || row.slug,
    planner_source_slug: slugify(nextName) || row.planner_source_slug,
    name: nextName,
    description: nextDescription,
    category: nextCategory,
    category_id: slugify(nextCategory || "catalog") || row.category_id,
    category_name: nextCategory,
    series_id: slugify(nextSubcategory || nextCategory || "general") || row.series_id,
    series_name: nextSubcategory || nextCategory || "General",
    flagship_image: nextImage,
    images: nextImage ? [nextImage] : [],
    specs: {
      ...existingSpecs,
      widthMm: width,
      depthMm: depth,
      heightMm: height,
      priceInr: price,
      meshType,
      dimensions: `${width} x ${depth} x ${height} mm`,
    },
    metadata: {
      ...(row.metadata || {}),
      source: "admin-catalog",
    },
    active: validated.visible === undefined ? row.active : validated.visible !== false,
    updated_at: new Date().toISOString(),
  };

  const { data, error: dbError } = await supabase
    .from("planner_managed_products")
    .update(payload as never)
    .eq("id", id)
    .select("*")
    .single();

  if (dbError) {
    return error(
      new ApiError(
        isMissingTableError(dbError.message) ? 503 : 500,
        isMissingTableError(dbError.message)
          ? API_ERROR_CODES.SERVICE_UNAVAILABLE
          : API_ERROR_CODES.DATABASE_ERROR,
        "Failed to update catalog item",
      ),
    );
  }

  return success({
    item: mapManagedRowToCatalogResponse(data),
    source: "planner_managed_products",
  });
}

/** DELETE handler for a standard catalog item by id. */
export async function deleteStandardCatalog(id: string): Promise<NextResponse> {
  if (!id?.trim()) {
    return error(
      new ApiError(400, API_ERROR_CODES.MISSING_REQUIRED_FIELD, "Item ID is required"),
    );
  }
  const supabase = createAdminServiceClient();
  if (!supabase) {
    return error(
      new ApiError(503, API_ERROR_CODES.SERVICE_UNAVAILABLE, "Catalog storage is not configured"),
    );
  }

  const { error: dbError } = await supabase
    .from("planner_managed_products")
    .delete()
    .eq("id", id);

  if (dbError) {
    return error(
      new ApiError(
        isMissingTableError(dbError.message) ? 503 : 500,
        isMissingTableError(dbError.message)
          ? API_ERROR_CODES.SERVICE_UNAVAILABLE
          : API_ERROR_CODES.DATABASE_ERROR,
        "Failed to delete catalog item",
      ),
    );
  }

  return success({ source: "planner_managed_products" });
}

// ---------------------------------------------------------------------------
// Configurator catalog (configurator_products)
// ---------------------------------------------------------------------------

const CONFIGURATOR_TABLE = "configurator_products";

/** GET handler for the configurator catalog. */
export async function listConfiguratorCatalog(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const parsed = ConfiguratorCatalogListQuerySchema.safeParse({
    category: url.searchParams.get("category") ?? undefined,
    active: url.searchParams.get("active") ?? undefined,
  });
  if (!parsed.success) return validationError(parsed.error.issues);
  const { category, active } = parsed.data;

  const supabase = createAdminServiceClient();
  if (!supabase) {
    return error(
      new ApiError(503, API_ERROR_CODES.SERVICE_UNAVAILABLE, "Catalog storage is not configured"),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as SupabaseClient<any>)
    .from(CONFIGURATOR_TABLE)
    .select("*")
    .order("category")
    .order("name");
  if (category) query = query.eq("category", category);
  if (active === "true" || active === "false") {
    query = query.eq("active", active === "true");
  }

  const { data, error: dbError } = await query;
  if (dbError) {
    return error(
      new ApiError(
        isMissingTableError(dbError.message) ? 503 : 500,
        isMissingTableError(dbError.message)
          ? API_ERROR_CODES.SERVICE_UNAVAILABLE
          : API_ERROR_CODES.DATABASE_ERROR,
        "Failed to fetch configurator catalog",
      ),
    );
  }

  return success({ items: data ?? [], total: (data ?? []).length });
}

/** POST handler for the configurator catalog. */
export async function createConfiguratorCatalog(req: NextRequest): Promise<NextResponse> {
  const supabase = createAdminServiceClient();
  if (!supabase) {
    return error(
      new ApiError(503, API_ERROR_CODES.SERVICE_UNAVAILABLE, "Catalog storage is not configured"),
    );
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = ConfiguratorProductBodySchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error.issues);

  const result = buildConfiguratorRow(body);
  if ("error" in result) {
    return error(
      new ApiError(400, API_ERROR_CODES.VALIDATION_ERROR, result.error),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: dbError } = await (supabase as SupabaseClient<any>)
    .from(CONFIGURATOR_TABLE)
    .insert(result.row)
    .select("*")
    .single();

  if (dbError) {
    const conflict = dbError.code === "23505";
    return error(
      new ApiError(
        conflict ? 409 : isMissingTableError(dbError.message) ? 503 : 500,
        conflict
          ? API_ERROR_CODES.RESOURCE_EXISTS
          : isMissingTableError(dbError.message)
            ? API_ERROR_CODES.SERVICE_UNAVAILABLE
            : API_ERROR_CODES.DATABASE_ERROR,
        conflict ? "A product with this slug already exists" : "Failed to create product",
      ),
    );
  }

  return success({ item: data }, 201);
}

/** PATCH handler for a configurator product by id. */
export async function patchConfiguratorCatalog(
  req: NextRequest,
  id: string,
): Promise<NextResponse> {
  const supabase = createAdminServiceClient();
  if (!supabase) {
    return error(
      new ApiError(503, API_ERROR_CODES.SERVICE_UNAVAILABLE, "Catalog storage is not configured"),
    );
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  // Lightweight active-only toggle (skip full validation).
  const keys = Object.keys(body);
  if (keys.length === 1 && keys[0] === "active") {
    const parsed = ConfiguratorActiveToggleSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error.issues);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: dbError } = await (supabase as SupabaseClient<any>)
      .from(CONFIGURATOR_TABLE)
      .update({ active: parsed.data.active })
      .eq("id", id)
      .select("*")
      .single();
    if (dbError) {
      return error(
        new ApiError(500, API_ERROR_CODES.DATABASE_ERROR, "Failed to update visibility"),
      );
    }
    return success({ item: data });
  }

  const parsed = ConfiguratorProductBodySchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error.issues);

  const result = buildConfiguratorRow(body);
  if ("error" in result) {
    return error(new ApiError(400, API_ERROR_CODES.VALIDATION_ERROR, result.error));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: dbError } = await (supabase as SupabaseClient<any>)
    .from(CONFIGURATOR_TABLE)
    .update(result.row)
    .eq("id", id)
    .select("*")
    .single();

  if (dbError) {
    const conflict = dbError.code === "23505";
    return error(
      new ApiError(
        conflict ? 409 : isMissingTableError(dbError.message) ? 503 : 500,
        conflict
          ? API_ERROR_CODES.RESOURCE_EXISTS
          : isMissingTableError(dbError.message)
            ? API_ERROR_CODES.SERVICE_UNAVAILABLE
            : API_ERROR_CODES.DATABASE_ERROR,
        conflict ? "A product with this slug already exists" : "Failed to update product",
      ),
    );
  }

  return success({ item: data });
}

/** DELETE (soft-archive) handler for a configurator product by id. */
export async function deleteConfiguratorCatalog(id: string): Promise<NextResponse> {
  const supabase = createAdminServiceClient();
  if (!supabase) {
    return error(
      new ApiError(503, API_ERROR_CODES.SERVICE_UNAVAILABLE, "Catalog storage is not configured"),
    );
  }

  // SOFT delete (active=false) so existing Spaces/quotes keep resolving.
  // Hard delete is intentionally not exposed.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: dbError } = await (supabase as SupabaseClient<any>)
    .from(CONFIGURATOR_TABLE)
    .update({ active: false })
    .eq("id", id)
    .select("id, active")
    .single();

  if (dbError) {
    return error(
      new ApiError(500, API_ERROR_CODES.DATABASE_ERROR, "Failed to archive product"),
    );
  }
  return success({ item: data, archived: true });
}
