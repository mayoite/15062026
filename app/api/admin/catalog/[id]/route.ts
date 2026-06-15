import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import {
  createAdminServiceClient,
  enforceAdminRateLimit,
  requireAdminSession,
  isMissingTableError,
} from "@/app/api/admin/_lib/server";
import { normalizePlannerManagedProductRow } from "@/features/planner/store/plannerManagedProductsShared";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function mapManagedRowToCatalogResponse(row: unknown) {
  const normalized = normalizePlannerManagedProductRow(row);
  const specs = normalized.specs || {};
  return {
    id: normalized.id,
    name: normalized.name,
    category: normalized.category,
    subcategory: normalized.series_name || null,
    width_mm: Number(specs.widthMm ?? specs.width_mm ?? 0) || 0,
    depth_mm: Number(specs.depthMm ?? specs.depth_mm ?? 0) || 0,
    height_mm: Number(specs.heightMm ?? specs.height_mm ?? 0) || 0,
    price: Number(specs.priceInr ?? specs.price ?? 0) || null,
    image_url: normalized.flagship_image || null,
    mesh_type: typeof specs.meshType === "string" ? specs.meshType : "box",
    visible: normalized.active,
    description: normalized.description || null,
    created_at: normalized.created_at,
    updated_at: normalized.updated_at,
  };
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const rateError = await enforceAdminRateLimit(req, "catalog:patch", 20);
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

  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const { data: existing, error: existingError } = await supabase
    .from("planner_managed_products")
    .select("*")
    .eq("id", id)
    .single();

  if (existingError || !existing) {
    return NextResponse.json(
      { error: "Catalog item not found" },
      { status: isMissingTableError(existingError?.message) ? 503 : 404 },
    );
  }

  const row = normalizePlannerManagedProductRow(existing);
  const nextName =
    typeof body.name === "string" && body.name.trim() ? body.name.trim() : row.name;
  const nextCategory =
    typeof body.category === "string" && body.category.trim()
      ? body.category.trim()
      : row.category;
  const nextSubcategory =
    typeof body.subcategory === "string" && body.subcategory.trim()
      ? body.subcategory.trim()
      : row.series_name;
  const nextImage =
    typeof body.image_url === "string" ? body.image_url.trim() : row.flagship_image;
  const nextDescription =
    typeof body.description === "string" ? body.description.trim() : row.description;

  const existingSpecs = row.specs || {};
  const width = Number(body.width_mm ?? existingSpecs.widthMm ?? existingSpecs.width_mm ?? 0) || 0;
  const depth = Number(body.depth_mm ?? existingSpecs.depthMm ?? existingSpecs.depth_mm ?? 0) || 0;
  const height = Number(body.height_mm ?? existingSpecs.heightMm ?? existingSpecs.height_mm ?? 0) || 0;
  const price = Number(body.price ?? existingSpecs.priceInr ?? existingSpecs.price ?? 0) || 0;
  const meshType =
    typeof body.mesh_type === "string" && body.mesh_type.trim()
      ? body.mesh_type.trim()
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
    active: body.visible === undefined ? row.active : body.visible !== false,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("planner_managed_products")
    .update(payload as never)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update catalog item" },
      { status: isMissingTableError(error.message) ? 503 : 500 },
    );
  }

  return NextResponse.json({
    item: mapManagedRowToCatalogResponse(data),
    source: "planner_managed_products",
  });
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const rateError = await enforceAdminRateLimit(req, "catalog:delete", 15);
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

  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("planner_managed_products")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete catalog item" },
      { status: isMissingTableError(error.message) ? 503 : 500 },
    );
  }

  return NextResponse.json({ success: true, source: "planner_managed_products" });
}
