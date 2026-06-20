import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { fetchWithSupabaseRetry } = vi.hoisted(() => ({
  fetchWithSupabaseRetry: vi.fn(),
}));

vi.mock("@/platform/supabase/safe", () => ({
  fetchWithSupabaseRetry,
}));

vi.mock("@/platform/drizzle/db", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  },
}));

import { buildProductStaticParams, deriveSourceSlug } from "@/lib/catalog/productStaticParams";

describe("product static params", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchWithSupabaseRetry.mockResolvedValue([]);
  });

  describe("deriveSourceSlug", () => {
    it("prefers metadata sourceSlug", () => {
      expect(
        deriveSourceSlug({
          metadata: { sourceSlug: "  sway  " },
          slug: "oando-seating--ignored",
        }),
      ).toBe("sway");
    });

    it("parses slug suffix after delimiter", () => {
      expect(deriveSourceSlug({ slug: "oando-seating--sway" })).toBe("sway");
      expect(deriveSourceSlug({ slug: "plain-slug" })).toBe("plain-slug");
      expect(deriveSourceSlug({ slug: "  " })).toBe("");
      expect(deriveSourceSlug({})).toBe("");
    });
  });

  describe("buildProductStaticParams", () => {
    it("merges fallback products and deduplicates by category and slug", async () => {
      const params = await buildProductStaticParams();
      expect(params.length).toBeGreaterThan(0);
      expect(new Set(params.map((entry) => `${entry.category}::${entry.product}`)).size).toBe(params.length);
      expect(params.every((entry) => entry.category.length > 0 && entry.product.length > 0)).toBe(true);
    });

    it("prefers canonical oando slugs when duplicate source keys exist", async () => {
      fetchWithSupabaseRetry.mockResolvedValue([
        {
          slug: "legacy-chair",
          category_id: "seating",
          name: "Task Chair",
          metadata: { sourceSlug: "task-chair" },
        },
        {
          slug: "oando-seating--task-chair",
          category_id: "seating",
          name: "Task Chair",
          metadata: { sourceSlug: "task-chair" },
        },
      ]);

      const params = await buildProductStaticParams();
      const seatingTask = params.filter(
        (entry) => entry.category === "seating" && entry.product.includes("task-chair"),
      );
      expect(seatingTask.some((entry) => entry.product === "oando-seating--task-chair")).toBe(true);
      expect(seatingTask.some((entry) => entry.product === "legacy-chair")).toBe(false);
    });

    it("classifies category ids from series and product metadata", async () => {
      fetchWithSupabaseRetry.mockResolvedValue([
        {
          slug: "oando-workstations--panel-desk",
          category_id: "unknown-workstations",
          series_name: "Panel Series",
          name: "Panel Desk",
          description: "Panel workstation",
          metadata: {},
        },
      ]);

      const params = await buildProductStaticParams();
      expect(params.some((entry) => entry.category === "workstations")).toBe(true);
    });

    it("skips rows without slug or source slug", async () => {
      fetchWithSupabaseRetry.mockResolvedValue([
        { slug: "", category_id: "seating", name: "No Slug" },
        { slug: "   ", category_id: "seating", name: "Blank Slug" },
        { slug: "   ", category_id: "seating", name: "Blank Source", metadata: { sourceSlug: "   " } },
      ]);

      const params = await buildProductStaticParams();
      expect(params.some((entry) => entry.product.trim() === "")).toBe(false);
      expect(params.length).toBeGreaterThan(0);
    });
  });
});
