import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const supabaseMocks = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: supabaseMocks.from,
  })),
}));

import {
  listPlannerManagedProductsForPlannerCatalog,
  upsertPlannerManagedProduct,
  deletePlannerManagedProduct,
} from "@/features/planner/store/plannerManagedProducts";

const rowPayload = {
  id: "550e8400-e29b-41d4-a716-446655440010",
  slug: "managed-desk",
  planner_source_slug: "managed-desk",
  name: "Managed Desk",
  description: "Server row",
  category: "Workstations",
  category_id: "workstations",
  category_name: "Workstations",
  series_id: "linear",
  series_name: "Linear",
  price: 0,
  flagship_image: "",
  images: [],
  specs: {},
  metadata: {},
  active: true,
  created_by: null,
  created_at: "2026-06-15T00:00:00.000Z",
  updated_at: "2026-06-15T00:00:00.000Z",
};

function createSupabaseClient(response: { data?: unknown; error?: { message: string } | null }) {
  const terminal = {
    single: vi.fn(async () => response),
    maybeSingle: vi.fn(async () => response),
  };
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(async () => response),
      })),
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

describe("plannerManagedProducts server module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty catalog when Supabase is unavailable", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockRejectedValueOnce(new Error("no server"));
    await expect(listPlannerManagedProductsForPlannerCatalog()).resolves.toEqual([]);
  });

  it("returns an empty catalog when the managed products table is missing", async () => {
    const client = createSupabaseClient({
      error: { message: "Could not find the table public.planner_managed_products" },
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValueOnce(client as never);
    await expect(listPlannerManagedProductsForPlannerCatalog()).resolves.toEqual([]);
  });

  it("maps active managed products into catalog entries", async () => {
    const client = createSupabaseClient({ data: [rowPayload], error: null });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValueOnce(client as never);
    const products = await listPlannerManagedProductsForPlannerCatalog();
    expect(products).toHaveLength(1);
    expect(products[0]?.name).toBe("Managed Desk");
  });

  it("filters inactive rows and tolerates generic list failures", async () => {
    const client = createSupabaseClient({
      data: [{ ...rowPayload, active: false }],
      error: null,
    });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValueOnce(client as never);
    await expect(listPlannerManagedProductsForPlannerCatalog()).resolves.toEqual([]);

    const errorClient = createSupabaseClient({
      error: { message: "relation planner_managed_products does not exist" },
    });
    vi.mocked(createClient).mockResolvedValueOnce(errorClient as never);
    await expect(listPlannerManagedProductsForPlannerCatalog()).resolves.toEqual([]);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const genericErrorClient = createSupabaseClient({
      error: { message: "permission denied" },
    });
    vi.mocked(createClient).mockResolvedValueOnce(genericErrorClient as never);
    await expect(listPlannerManagedProductsForPlannerCatalog()).resolves.toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("upserts and deletes through Supabase", async () => {
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
    expect(saved.slug).toBe("managed-desk");

    const deleted = await deletePlannerManagedProduct(client as never, rowPayload.id);
    expect(deleted).toBe(true);

    const missingDeleteClient = createSupabaseClient({ data: null, error: null });
    const missingDelete = await deletePlannerManagedProduct(missingDeleteClient as never, rowPayload.id);
    expect(missingDelete).toBe(false);
  });
});