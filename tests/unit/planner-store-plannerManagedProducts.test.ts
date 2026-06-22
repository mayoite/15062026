import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  normalizePlannerManagedProductRow,
  plannerManagedProductRowToCatalogProduct,
} from "@/features/planner/store/plannerManagedProductsShared";
import {
  listPlannerManagedProductsFromSupabase,
  upsertPlannerManagedProduct,
  deletePlannerManagedProduct,
} from "@/features/planner/store/plannerManagedProducts.client";

const rowPayload = {
  id: "550e8400-e29b-41d4-a716-446655440010",
  slug: "managed-chair",
  planner_source_slug: "managed-chair",
  name: "Managed Chair",
  description: "From admin",
  category: "Seating",
  category_id: "seating",
  category_name: "Seating",
  series_id: "task",
  series_name: "Task",
  price: 0,
  flagship_image: "top.png",
  images: ["a.png"],
  specs: { dimensions: "500 x 500 mm", materials: ["fabric", 1] },
  metadata: { legacyProductId: "legacy-1", description: "Meta desc" },
  active: true,
  created_by: "550e8400-e29b-41d4-a716-446655440001",
  created_at: "2026-06-15T00:00:00.000Z",
  updated_at: "2026-06-15T00:00:00.000Z",
};

function createSupabaseClient(response: { data?: unknown; error?: { message: string } | null }) {
  const terminal = {
    single: vi.fn(async () => response),
    maybeSingle: vi.fn(async () => response),
  };
  const selectChain = {
    order: vi.fn(() => ({ data: response.data ?? [], error: response.error ?? null })),
    single: terminal.single,
    maybeSingle: terminal.maybeSingle,
  };
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => selectChain),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: terminal.single,
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: terminal.maybeSingle,
          })),
        })),
      })),
    })),
  };
}

describe("planner managed products", () => {
  describe("plannerManagedProductsShared", () => {
    it("normalizes legacy metadata and active flags", () => {
      const normalized = normalizePlannerManagedProductRow({
        ...rowPayload,
        active: undefined,
        planner_visible: false,
        legacy_product_id: " ",
        metadata: { legacy_product_id: "legacy-meta" },
      });
      expect(normalized.active).toBe(false);
      expect(normalized.legacy_product_id).toBe("legacy-meta");
      expect(normalized.description).toBe("From admin");
    });

    it("falls back to planner_status and defaults for sparse rows", () => {
      const normalized = normalizePlannerManagedProductRow({
        ...rowPayload,
        active: undefined,
        planner_visible: undefined,
        planner_status: "approved",
        description: " ",
        flagship_image: " ",
        planner_top_view: "top-view.png",
        images: "not-an-array",
        specs: null,
        metadata: null,
        created_by: " ",
        created_by_user_id: "550e8400-e29b-41d4-a716-446655440099",
      });
      expect(normalized.active).toBe(true);
      expect(normalized.flagship_image).toBe("top-view.png");
      expect(normalized.created_by).toBe("550e8400-e29b-41d4-a716-446655440099");
    });

    it("maps normalized rows to catalog products", () => {
      const normalized = normalizePlannerManagedProductRow(rowPayload);
      const product = plannerManagedProductRowToCatalogProduct(normalized);
      expect(product.metadata.plannerManaged).toBe(true);
      expect(product.detailedInfo.dimensions).toBe("500 x 500 mm");
      expect(product.detailedInfo.materials).toEqual(["fabric"]);
    });
  });

  describe("plannerManagedProducts.client", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("lists managed products from Supabase", async () => {
      const client = createSupabaseClient({ data: [rowPayload], error: null });
      const rows = await listPlannerManagedProductsFromSupabase(client as never);
      expect(rows).toHaveLength(1);
      expect(rows[0]?.slug).toBe("managed-chair");
    });

    it("throws when list fails", async () => {
      const client = createSupabaseClient({ error: { message: "db down" } });
      await expect(listPlannerManagedProductsFromSupabase(client as never)).rejects.toThrow(/db down/);
    });

    it("upserts and deletes managed products", async () => {
      const client = createSupabaseClient({ data: rowPayload, error: null });
      const saved = await upsertPlannerManagedProduct(client as never, {
        slug: rowPayload.slug,
        planner_source_slug: rowPayload.planner_source_slug,
        name: rowPayload.name,
        category: rowPayload.category,
        category_id: rowPayload.category_id,
        category_name: rowPayload.category_name,
        series_id: rowPayload.series_id,
        series_name: rowPayload.series_name,
      });
      expect(saved.name).toBe("Managed Chair");

      const deleted = await deletePlannerManagedProduct(client as never, rowPayload.id);
      expect(deleted).toBe(true);
    });

    it("throws when upsert returns no data", async () => {
      const client = createSupabaseClient({ data: null, error: { message: "write failed" } });
      await expect(
        upsertPlannerManagedProduct(client as never, {
          slug: rowPayload.slug,
          planner_source_slug: rowPayload.planner_source_slug,
          name: rowPayload.name,
          category: rowPayload.category,
          category_id: rowPayload.category_id,
          category_name: rowPayload.category_name,
          series_id: rowPayload.series_id,
          series_name: rowPayload.series_name,
        }),
      ).rejects.toThrow(/write failed/);
    });
  });
});
