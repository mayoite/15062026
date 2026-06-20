import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  deletePlannerManagedProduct as deleteManagedClient,
  listPlannerManagedProductsFromSupabase,
  upsertPlannerManagedProduct as upsertManagedClient,
} from "@/features/planner/catalog/plannerManagedProducts.client";
import {
  deletePlannerManagedProduct,
  listPlannerManagedProductsForPlannerCatalog,
  upsertPlannerManagedProduct,
} from "@/features/planner/catalog/plannerManagedProducts";
import {
  normalizePlannerManagedProductRow,
  plannerManagedProductRowToCatalogProduct,
} from "@/features/planner/catalog/plannerManagedProductsShared";

const managedRow = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  legacy_product_id: "prod-legacy",
  slug: "alpha-desk-v2",
  planner_source_slug: "alpha-desk",
  name: "Alpha Desk",
  description: "Managed desk",
  category: "desk",
  category_id: "cat-1",
  category_name: "Workstations",
  series_id: "series-1",
  series_name: "Executive",
  price: 45000,
  flagship_image: "/desk.png",
  images: ["/desk-1.png"],
  specs: { dimensions: "1600 mm", materials: ["Wood"] },
  metadata: { legacyProductId: "prod-legacy" },
  active: true,
  created_by: "660e8400-e29b-41d4-a716-446655440001",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-02T00:00:00.000Z",
};

const { createServerSupabaseClientMock } = vi.hoisted(() => ({
  createServerSupabaseClientMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createServerSupabaseClientMock,
}));

function createSupabaseMock(handlers: {
  selectResult?: { data: unknown[] | null; error: { message: string } | null };
  upsertResult?: { data: unknown | null; error: { message: string } | null };
  deleteResult?: { data: { id: string } | null; error: { message: string } | null };
}) {
  const select = vi.fn().mockReturnValue({
    order: vi.fn().mockResolvedValue(
      handlers.selectResult ?? { data: [managedRow], error: null },
    ),
  });
  const upsert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue(
        handlers.upsertResult ?? { data: managedRow, error: null },
      ),
    }),
  });
  const maybeSingle = vi.fn().mockResolvedValue(
    handlers.deleteResult ?? { data: { id: managedRow.id }, error: null },
  );
  const eq = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({ maybeSingle }),
  });
  const del = vi.fn().mockReturnValue({ eq });

  return {
    from: vi.fn(() => ({
      select,
      upsert,
      delete: del,
    })),
    maybeSingle,
  } as unknown as SupabaseClient & { maybeSingle: typeof maybeSingle };
}

describe("planner/catalog managed products", () => {
  beforeEach(() => {
    createServerSupabaseClientMock.mockReset();
  });

  it("defaults active state when visibility metadata is absent", () => {
    const { active: _active, planner_visible: _visible, ...row } = managedRow;
    const normalized = normalizePlannerManagedProductRow(row);
    expect(normalized.active).toBe(true);
  });

  it("normalizes managed rows and maps them to catalog products", () => {
    const normalized = normalizePlannerManagedProductRow({
      ...managedRow,
      active: undefined,
      planner_visible: false,
    });
    expect(normalized.active).toBe(false);

    const approved = normalizePlannerManagedProductRow({
      ...managedRow,
      active: undefined,
      planner_status: "approved",
    });
    expect(approved.active).toBe(true);

    const catalogProduct = plannerManagedProductRowToCatalogProduct(normalized);
    expect(catalogProduct).toMatchObject({
      id: managedRow.id,
      slug: managedRow.slug,
      plannerSourceSlug: managedRow.planner_source_slug,
      metadata: expect.objectContaining({ plannerManaged: true, legacyProductId: "prod-legacy" }),
    });
    expect(catalogProduct.detailedInfo.materials).toEqual(["Wood"]);
  });

  it("loads planner-managed products for the server catalog path", async () => {
    createServerSupabaseClientMock.mockResolvedValue(createSupabaseMock({}));
    const products = await listPlannerManagedProductsForPlannerCatalog();
    expect(products).toHaveLength(1);
    expect(products[0].slug).toBe("alpha-desk-v2");
  });

  it("returns an empty list when the server client is unavailable", async () => {
    createServerSupabaseClientMock.mockRejectedValue(new Error("no server"));
    await expect(listPlannerManagedProductsForPlannerCatalog()).resolves.toEqual([]);
  });

  it("returns an empty list when the managed products table is missing", async () => {
    createServerSupabaseClientMock.mockResolvedValue(
      createSupabaseMock({
        selectResult: {
          data: null,
          error: { message: "Could not find the table public.planner_managed_products" },
        },
      }),
    );
    await expect(listPlannerManagedProductsForPlannerCatalog()).resolves.toEqual([]);
  });

  it("logs and returns an empty list for unexpected server read errors", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    createServerSupabaseClientMock.mockResolvedValue(
      createSupabaseMock({
        selectResult: { data: null, error: { message: "permission denied" } },
      }),
    );
    await expect(listPlannerManagedProductsForPlannerCatalog()).resolves.toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("normalizes metadata fallbacks and inactive planner_visible rows", () => {
    const { active: _active, ...rowWithoutActive } = managedRow;
    const normalized = normalizePlannerManagedProductRow({
      ...rowWithoutActive,
      legacy_product_id: undefined,
      metadata: { legacy_product_id: "legacy-from-meta" },
      planner_visible: false,
      specs: "invalid",
    });
    expect(normalized.legacy_product_id).toBe("legacy-from-meta");
    expect(normalized.active).toBe(false);
    expect(plannerManagedProductRowToCatalogProduct(normalized).metadata.legacyProductId).toBe(
      "legacy-from-meta",
    );
  });

  it("filters inactive managed rows out of the server catalog list", async () => {
    createServerSupabaseClientMock.mockResolvedValue(
      createSupabaseMock({
        selectResult: {
          data: [{ ...managedRow, active: false }],
          error: null,
        },
      }),
    );
    await expect(listPlannerManagedProductsForPlannerCatalog()).resolves.toEqual([]);
  });

  it("lists, upserts, and deletes managed products through the client adapter", async () => {
    const client = createSupabaseMock({});
    const rows = await listPlannerManagedProductsFromSupabase(client);
    expect(rows).toHaveLength(1);

    const saved = await upsertManagedClient(client, managedRow);
    expect(saved.slug).toBe("alpha-desk-v2");

    await expect(deleteManagedClient(client, managedRow.id)).resolves.toBe(true);

    client.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    await expect(deleteManagedClient(client, "missing-id")).resolves.toBe(false);
  });

  it("saves managed products through the server adapter", async () => {
    const client = createSupabaseMock({});
    const saved = await upsertPlannerManagedProduct(client, managedRow);
    expect(saved.slug).toBe("alpha-desk-v2");

    client.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    await expect(deletePlannerManagedProduct(client, "missing-id")).resolves.toBe(false);
  });

  it("throws when client write operations fail", async () => {
    const writeClient = createSupabaseMock({
      upsertResult: { data: null, error: { message: "write failed" } },
      deleteResult: { data: null, error: { message: "delete failed" } },
    });
    const readClient = createSupabaseMock({
      selectResult: { data: null, error: { message: "read failed" } },
    });

    await expect(upsertPlannerManagedProduct(writeClient, managedRow)).rejects.toThrow(/Unable to save/);

    const noDataClient = createSupabaseMock({
      upsertResult: { data: null, error: null },
    });
    await expect(upsertManagedClient(noDataClient, managedRow)).rejects.toThrow(/Unknown error/);
    await expect(deletePlannerManagedProduct(writeClient, managedRow.id)).rejects.toThrow(/Unable to delete/);
    await expect(listPlannerManagedProductsFromSupabase(readClient)).rejects.toThrow(/Unable to load/);
  });
});