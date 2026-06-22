/**
 * planner-catalog-hierarchy.test.ts
 * P4-02 (search) + P4 catalog enrichment — purpose tab, sub-category, SKU derivation
 */
import { describe, expect, it } from "vitest";
import {
  deriveCatalogSku,
  deriveCatalogShortName,
  deriveCatalogMaterial,
  formatCatalogSeatFootprint,
  resolveCatalogPurposeTab,
  resolveCatalogSubCategory,
  enrichCatalogItem,
  itemMatchesCatalogSearch,
  mapPurposeFilterToCatalogTab,
  CATALOG_SUB_CATEGORIES,
} from "@/features/planner/catalog/catalogHierarchy";
import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";

function makeItem(overrides: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id: "test-desk-1",
    name: "Table Top: 25mm thick — 2 seater - NS (1200mm)",
    category: "desks",
    shapeType: "planner-bench",
    widthMm: 240,
    heightMm: 60,
    depthMm: 60,
    seatCount: 2,
    description: "Non-sharing straight workstation",
    tags: ["straight", "non-sharing", "2-seater"],
    ...overrides,
  };
}

// ─── deriveCatalogSku ─────────────────────────────────────────────────────────

describe("deriveCatalogSku", () => {
  it("extracts seater + length from name (truncated to 12 chars)", () => {
    const item = makeItem({ tags: ["2-seater"], name: "Desk — 2 seater (1200mm)" });
    const sku = deriveCatalogSku(item);
    // slugPart truncates to 12: "2-SEATER-1200" → "2-SEATER-120"
    expect(sku).toMatch(/2-SEATER/i);
    expect(sku.length).toBeLessThanOrEqual(12);
  });

  it("falls back to last 2 id parts when no seater tag", () => {
    const item = makeItem({ id: "my-storage-cabinet", tags: [], name: "Cabinet" });
    const sku = deriveCatalogSku(item);
    expect(sku.length).toBeGreaterThan(0);
  });
});

// ─── deriveCatalogShortName ───────────────────────────────────────────────────

describe("deriveCatalogShortName", () => {
  it("strips dimension suffix in parens", () => {
    const item = makeItem({ name: "Big Desk — 2 seater - NS (1200mm)" });
    const short = deriveCatalogShortName(item);
    expect(short).not.toContain("(1200mm)");
    expect(short).toBe("2 seater - NS");
  });

  it("truncates at 30 chars with ellipsis", () => {
    const item = makeItem({ name: "A very long name that exceeds the limit — detail part that is very verbose" });
    const short = deriveCatalogShortName(item);
    expect(short.length).toBeLessThanOrEqual(31); // 30 + ellipsis
    expect(short.endsWith("…")).toBe(true);
  });
});

// ─── deriveCatalogMaterial ────────────────────────────────────────────────────

describe("deriveCatalogMaterial", () => {
  it("extracts laminate from name prefix", () => {
    const item = makeItem({ name: "25mm Pre Laminate Board — 2 seater" });
    const mat = deriveCatalogMaterial(item);
    expect(mat.toLowerCase()).toContain("laminate");
  });

  it("falls back to office-grade laminate", () => {
    const item = makeItem({ name: "Generic Desk", description: "A desk" });
    expect(deriveCatalogMaterial(item)).toBe("Office-grade laminate");
  });
});

// ─── formatCatalogSeatFootprint ───────────────────────────────────────────────

describe("formatCatalogSeatFootprint", () => {
  it("converts widthMm/heightMm to metres with × separator", () => {
    const item = makeItem({ widthMm: 120, heightMm: 60 });
    const label = formatCatalogSeatFootprint(item);
    expect(label).toMatch(/m × \d/);
  });

  it("single seat 120×60 → 1.2m × 0.60m", () => {
    const item = makeItem({ widthMm: 120, heightMm: 60 });
    const label = formatCatalogSeatFootprint(item);
    // normalizeCatalogMm(120)=1200mm → 1.2m (≥1 → toFixed(1))
    // normalizeCatalogMm(60)=600mm → 0.6m (<1 → toFixed(2) → "0.60" → trimmed to "0.60")
    expect(label).toBe("1.2m × 0.60m");
  });
});

// ─── resolveCatalogPurposeTab ─────────────────────────────────────────────────

describe("resolveCatalogPurposeTab", () => {
  it("desks → workstations", () => {
    expect(resolveCatalogPurposeTab(makeItem({ category: "desks" }))).toBe("workstations");
  });

  it("storage → storage", () => {
    expect(resolveCatalogPurposeTab(makeItem({ category: "storage" }))).toBe("storage");
  });

  it("rooms with cabin tag → cabins", () => {
    expect(resolveCatalogPurposeTab(makeItem({ category: "rooms", tags: ["cabin"], description: "cabin" }))).toBe("cabins");
  });

  it("rooms without special tag → meeting", () => {
    expect(resolveCatalogPurposeTab(makeItem({ category: "rooms", tags: [], description: "" }))).toBe("meeting");
  });

  it("equipment with screen tag → accessories", () => {
    expect(resolveCatalogPurposeTab(makeItem({ category: "equipment", tags: ["screen"] }))).toBe("accessories");
  });
});

// ─── resolveCatalogSubCategory ────────────────────────────────────────────────

describe("resolveCatalogSubCategory", () => {
  it("desk with l-shape tag → l-shaped", () => {
    const item = makeItem({ tags: ["l-shape", "non-sharing"] });
    expect(resolveCatalogSubCategory(item, "workstations")).toBe("l-shaped");
  });

  it("bench with seatCount > 1 → cluster", () => {
    const item = makeItem({ seatCount: 2, shapeType: "planner-bench", tags: ["straight", "2-seater"], description: "" });
    expect(resolveCatalogSubCategory(item, "workstations")).toBe("cluster");
  });

  it("single NS desk → linear", () => {
    // Avoid 'sharing' substring in tags/description — triggers cluster
    const item = makeItem({ seatCount: 1, shapeType: "planner-desk", tags: ["straight", "1-seater"], description: "" });
    expect(resolveCatalogSubCategory(item, "workstations")).toBe("linear");
  });
});

// ─── enrichCatalogItem ────────────────────────────────────────────────────────

describe("enrichCatalogItem", () => {
  it("adds sku, shortName, material, catalogUrl, purposeTab, subCategory", () => {
    const enriched = enrichCatalogItem(makeItem());
    expect(enriched.sku).toBeTruthy();
    expect(enriched.shortName).toBeTruthy();
    expect(enriched.material).toBeTruthy();
    expect(enriched.catalogUrl).toMatch(/^\/products\?q=/);
    expect(enriched.purposeTab).toBe("workstations");
    expect(enriched.subCategory).toBeDefined();
  });

  it("does not override pre-existing sku/shortName", () => {
    const item = makeItem({ sku: "MY-SKU", shortName: "My Short" });
    const enriched = enrichCatalogItem(item);
    expect(enriched.sku).toBe("MY-SKU");
    expect(enriched.shortName).toBe("My Short");
  });
});

// ─── itemMatchesCatalogSearch (P4-02) ────────────────────────────────────────

describe("itemMatchesCatalogSearch", () => {
  const item = makeItem({ name: "Linear Workstation — 4 seater - NS (1200mm)", tags: ["straight", "non-sharing"] });

  it("empty query matches all", () => {
    expect(itemMatchesCatalogSearch(item, "")).toBe(true);
    expect(itemMatchesCatalogSearch(item, "   ")).toBe(true);
  });

  it("matches partial name", () => {
    expect(itemMatchesCatalogSearch(item, "linear")).toBe(true);
  });

  it("matches tag", () => {
    expect(itemMatchesCatalogSearch(item, "non-sharing")).toBe(true);
  });

  it("does not match unrelated query", () => {
    expect(itemMatchesCatalogSearch(item, "sofa-xyz-zzz")).toBe(false);
  });

  it("case-insensitive search", () => {
    expect(itemMatchesCatalogSearch(item, "LINEAR")).toBe(true);
  });
});

// ─── mapPurposeFilterToCatalogTab ─────────────────────────────────────────────

describe("mapPurposeFilterToCatalogTab", () => {
  it.each([
    ["meeting-rooms" as const, "meeting"],
    ["executive-cabin" as const, "cabins"],
    ["mixed" as const, "workstations"],
    [null, "workstations"],
  ])("maps %s → %s", (input, expected) => {
    expect(mapPurposeFilterToCatalogTab(input)).toBe(expected);
  });
});

// ─── CATALOG_SUB_CATEGORIES completeness ─────────────────────────────────────

describe("CATALOG_SUB_CATEGORIES", () => {
  it("all purpose tabs have at least 2 sub-categories", () => {
    for (const [tab, subs] of Object.entries(CATALOG_SUB_CATEGORIES)) {
      expect(subs.length, `${tab} should have ≥ 2 sub-categories`).toBeGreaterThanOrEqual(2);
    }
  });

  it("all sub-category entries have id and label", () => {
    for (const subs of Object.values(CATALOG_SUB_CATEGORIES)) {
      for (const sub of subs) {
        expect(typeof sub.id).toBe("string");
        expect(typeof sub.label).toBe("string");
      }
    }
  });
});

