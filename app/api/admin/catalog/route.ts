import { randomUUID } from "node:crypto";
import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import {
  createAdminServiceClient,
  enforceAdminRateLimit,
  requireAdminSession,
  isMissingTableError,
} from "@/app/api/admin/_lib/server";
import { furnitureCatalog, categoryLabels } from "@/features/planner/store/catalogData";
import { normalizePlannerManagedProductRow } from "@/features/planner/store/plannerManagedProductsShared";

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

function parseInteger(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

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

export async function GET(req: NextRequest) {
  const rateError = await enforceAdminRateLimit(req, "catalog:get");
  if (rateError) return rateError;

  const authError = await requireAdminSession();
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const page = parseInteger(searchParams.get("page"), 1);
  const limit = parseInteger(searchParams.get("limit"), 50);
  const category = searchParams.get("category")?.trim().toLowerCase() || "";
  const search = searchParams.get("search")?.trim().toLowerCase() || "";
  const visibleFilter = searchParams.get("visible");

  const supabase = createAdminServiceClient();
  let items: CatalogResponseRow[] = [];
  let source = "local-catalog";

  if (supabase) {
    const { data, error } = await supabase
      .from("planner_managed_products")
      .select("*")
      .order("updated_at", { ascending: false });

    if (!error && data) {
      items = data.map(mapManagedRowToCatalogResponse);
      source = "planner_managed_products";
    } else if (!error || !isMissingTableError(error?.message)) {
      return NextResponse.json(
        { error: "Failed to fetch catalog items" },
        { status: 500 },
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
 
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        .some((value) => value!.toLowerCase().includes(search)),
    );
  }
  if (visibleFilter === "true" || visibleFilter === "false") {
    const expected = visibleFilter === "true";
    filtered = filtered.filter((item) => item.visible === expected);
  }

  const total = filtered.length;
  const from = (page - 1) * limit;
  const paged = filtered.slice(from, from + limit);

  return NextResponse.json({
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

export async function POST(req: NextRequest) {
  const rateError = await enforceAdminRateLimit(req, "catalog:post", 20);
  if (rateError) return rateError;

  const authError = await requireAdminSession();
  if (authError) return authError;

  const supabase = createAdminServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Catalog storage is not configured" },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const width = Number(body.width_mm) || 0;
  const depth = Number(body.depth_mm) || 0;
  const height = Number(body.height_mm) || 0;

  if (!name || !category || width <= 0 || depth <= 0 || height <= 0) {
    return NextResponse.json(
      { error: "Missing required catalog fields" },
      { status: 400 },
    );
  }

  const payload = buildManagedProductPayload(body);
  const { data, error } = await supabase
    .from("planner_managed_products")
    .insert(payload as never)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create catalog item" },
      { status: isMissingTableError(error.message) ? 503 : 500 },
    );
  }

  return NextResponse.json(
    { item: mapManagedRowToCatalogResponse(data), source: "planner_managed_products" },
    { status: 201 },
  );
}
