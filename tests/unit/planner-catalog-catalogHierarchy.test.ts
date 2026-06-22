import { describe, expect, it } from "vitest";

import {
  CATALOG_SUB_CATEGORIES,
  deriveCatalogMaterial,
  deriveCatalogShortName,
  deriveCatalogSku,
  deriveCatalogUrl,
  enrichCatalogItem,
  enrichCatalogItems,
  formatCatalogDimensionsLabel,
  formatCatalogSeatFootprint,
  itemMatchesCatalogSearch,
  mapPurposeFilterToCatalogTab,
  resolveCatalogPurposeTab,
  resolveCatalogSubCategory,
} from "@/features/planner/catalog/catalogHierarchy";
import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";

function item(overrides: Partial<CatalogItem> & Pick<CatalogItem, "id" | "name" | "category">): CatalogItem {
  return {
    shapeType: "planner-desk",
    widthMm: 120,
    heightMm: 60,
    depthMm: 60,
    description: "Test item",
    tags: [],
    ...overrides,
  };
}

describe("planner/catalog/catalogHierarchy", () => {
  it("maps onboarding purpose filters to catalog tabs", () => {
    expect(mapPurposeFilterToCatalogTab("meeting-rooms")).toBe("meeting");
    expect(mapPurposeFilterToCatalogTab("executive-cabin")).toBe("cabins");
    expect(mapPurposeFilterToCatalogTab("mixed")).toBe("workstations");
    expect(mapPurposeFilterToCatalogTab("workstations")).toBe("workstations");
    expect(mapPurposeFilterToCatalogTab(null)).toBe("workstations");
  });

  it("derives sku from seater tags and footprint length", () => {
    const desk = item({
      id: "linear-4",
      name: "Series — 4 seater - SH (1200mm)",
      category: "desks",
      tags: ["4-seater", "sharing"],
      shapeType: "planner-bench",
    });
    expect(deriveCatalogSku(desk)).toBe("4-SEATER-120");
    expect(deriveCatalogSku(item({ id: "room-meeting-8", name: "Meeting Room (8p)", category: "rooms" }))).toBeTruthy();
  });

  it("derives short names and truncates long labels", () => {
    const short = item({
      id: "desk-1",
      name: "Laminate — Compact desk (1200mm)",
      category: "desks",
    });
    expect(deriveCatalogShortName(short)).toBe("Compact desk");

    const longName = "A".repeat(40);
    const truncated = deriveCatalogShortName(item({ id: "x", name: longName, category: "desks" }));
    expect(truncated.length).toBeLessThanOrEqual(30);
    expect(truncated.endsWith("…")).toBe(true);
  });

  it("derives material from name, description, or default", () => {
    expect(
      deriveCatalogMaterial(
        item({ id: "a", name: "CRCA steel frame — Desk", category: "desks", description: "" }),
      ),
    ).toContain("CRCA");

    const longMaterial = `${"Veneer finish panel ".repeat(4)}extra`;
    expect(
      deriveCatalogMaterial(
        item({ id: "b", name: longMaterial, category: "desks", description: "" }),
      ).endsWith("…"),
    ).toBe(true);

    expect(
      deriveCatalogMaterial(
        item({ id: "c", name: "Desk", category: "desks", description: "Particle board laminate top" }),
      ),
    ).toContain("Particle");

    expect(deriveCatalogMaterial(item({ id: "d", name: "Desk", category: "desks" }))).toBe(
      "Office-grade laminate",
    );
  });

  it("formats catalog URLs and dimension labels", () => {
    const desk = enrichCatalogItem(
      item({ id: "desk-1", name: "Task desk", category: "desks", widthMm: 120, heightMm: 60 }),
    );
    expect(deriveCatalogUrl(desk)).toContain("/products?q=");
    expect(formatCatalogSeatFootprint(desk)).toMatch(/m × .*m/);
    expect(formatCatalogDimensionsLabel(desk)).toContain("mm ×");
  });

  it("resolves purpose tabs across catalog categories", () => {
    expect(resolveCatalogPurposeTab(item({ id: "d", name: "Desk", category: "desks" }))).toBe("workstations");
    expect(resolveCatalogPurposeTab(item({ id: "s", name: "Locker", category: "storage" }))).toBe("storage");
    expect(
      resolveCatalogPurposeTab(
        item({ id: "c", name: "Executive cabin", category: "rooms", tags: ["executive", "cabin"] }),
      ),
    ).toBe("cabins");
    expect(
      resolveCatalogPurposeTab(item({ id: "m", name: "Meeting room", category: "rooms", tags: ["meeting"] })),
    ).toBe("meeting");
    expect(
      resolveCatalogPurposeTab(
        item({ id: "e", name: "Task chair", category: "equipment", tags: ["chair", "seat"] }),
      ),
    ).toBe("seating");
    expect(
      resolveCatalogPurposeTab(
        item({ id: "a", name: "Monitor arm", category: "equipment", tags: ["accessory", "screen"] }),
      ),
    ).toBe("accessories");
    expect(resolveCatalogPurposeTab(item({ id: "z", name: "Zone", category: "zones" }))).toBe("meeting");
    expect(resolveCatalogPurposeTab(item({ id: "x", name: "Misc", category: "infrastructure" }))).toBe(
      "accessories",
    );
    expect(
      resolveCatalogPurposeTab(
        item({ id: "preset", name: "Custom", category: "desks", purposeTab: "cabins" }),
      ),
    ).toBe("cabins");
  });

  it("resolves sub-categories for each purpose tab", () => {
    const linear = item({ id: "l", name: "Linear desk", category: "desks", tags: ["straight"] });
    const cluster = item({
      id: "c",
      name: "Sharing bench",
      category: "desks",
      seatCount: 4,
      shapeType: "planner-bench",
      tags: ["sharing"],
    });
    const lShape = item({ id: "ls", name: "L shape desk", category: "desks", tags: ["l-shape"] });
    const adjustable = item({ id: "ha", name: "Height adjustable desk", category: "desks", tags: ["height"] });

    expect(resolveCatalogSubCategory(linear, "workstations")).toBe("linear");
    expect(resolveCatalogSubCategory(cluster, "workstations")).toBe("cluster");
    expect(resolveCatalogSubCategory(lShape, "workstations")).toBe("l-shaped");
    expect(resolveCatalogSubCategory(adjustable, "workstations")).toBe("height-adjustable");

    expect(resolveCatalogSubCategory(item({ id: "st", name: "Bar stool", category: "equipment", tags: ["stool"] }), "seating")).toBe("stool");
    expect(resolveCatalogSubCategory(item({ id: "lo", name: "Lounge sofa", category: "equipment", tags: ["lounge"] }), "seating")).toBe("lounge");
    expect(resolveCatalogSubCategory(item({ id: "be", name: "Waiting bench", category: "equipment", tags: ["bench"] }), "seating")).toBe("bench");
    expect(resolveCatalogSubCategory(item({ id: "tc", name: "Task chair", category: "equipment", tags: ["chair"] }), "seating")).toBe("task-chair");

    expect(
      resolveCatalogSubCategory(item({ id: "pb", name: "Phone pod", category: "rooms", tags: ["phone", "booth"] }), "meeting"),
    ).toBe("phone-booth");
    expect(
      resolveCatalogSubCategory(item({ id: "cf", name: "Conference room", category: "rooms", tags: ["conference"] }), "meeting"),
    ).toBe("conference");
    expect(
      resolveCatalogSubCategory(item({ id: "sm", name: "Small room (4p)", category: "rooms" }), "meeting"),
    ).toBe("small");
    expect(
      resolveCatalogSubCategory(item({ id: "md", name: "Medium room", category: "rooms", seatCount: 8 }), "meeting"),
    ).toBe("medium");

    expect(resolveCatalogSubCategory(item({ id: "pe", name: "Pedestal", category: "storage", tags: ["pedestal"] }), "storage")).toBe("pedestal");
    expect(resolveCatalogSubCategory(item({ id: "lk", name: "Locker", category: "storage", tags: ["locker"] }), "storage")).toBe("locker");
    expect(resolveCatalogSubCategory(item({ id: "wa", name: "Wardrobe", category: "storage", tags: ["wardrobe"] }), "storage")).toBe("wardrobe");
    expect(resolveCatalogSubCategory(item({ id: "ca", name: "Cabinet", category: "storage" }), "storage")).toBe("cabinet");

    expect(resolveCatalogSubCategory(item({ id: "br", name: "Boardroom", category: "rooms", tags: ["boardroom"] }), "cabins")).toBe("boardroom");
    expect(resolveCatalogSubCategory(item({ id: "ex", name: "Executive cabin", category: "rooms", tags: ["executive"] }), "cabins")).toBe("executive");
    expect(resolveCatalogSubCategory(item({ id: "mg", name: "Manager cabin", category: "rooms" }), "cabins")).toBe("manager");

    expect(resolveCatalogSubCategory(item({ id: "kb", name: "Keyboard tray", category: "equipment", tags: ["keyboard"] }), "accessories")).toBe("keyboard");
    expect(resolveCatalogSubCategory(item({ id: "cpu", name: "CPU holder", category: "equipment", tags: ["cpu"] }), "accessories")).toBe("cpu");
    expect(resolveCatalogSubCategory(item({ id: "sc", name: "Display screen", category: "equipment", tags: ["screen"] }), "accessories")).toBe("screens");
    expect(resolveCatalogSubCategory(item({ id: "pw", name: "Power strip", category: "equipment" }), "accessories")).toBe("power");
  });

  it("enriches items in bulk and preserves explicit fields", () => {
    const preset = item({
      id: "preset",
      name: "Preset desk",
      category: "desks",
      sku: "SKU-1",
      shortName: "Preset",
      material: "Steel",
      catalogUrl: "/products/preset",
      subCategory: "linear",
      purposeTab: "workstations",
    });
    const [enriched] = enrichCatalogItems([preset]);
    expect(enriched.sku).toBe("SKU-1");
    expect(enriched.shortName).toBe("Preset");
    expect(enriched.material).toBe("Steel");
    expect(enriched.catalogUrl).toBe("/products/preset");
    expect(enriched.subCategory).toBe("linear");
    expect(CATALOG_SUB_CATEGORIES.workstations.length).toBeGreaterThan(0);
  });

  it("matches catalog search across enriched fields", () => {
    const desk = enrichCatalogItem(
      item({ id: "desk-1", name: "Alpha workstation", category: "desks", description: "Compact bench", tags: ["sharing"] }),
    );
    expect(itemMatchesCatalogSearch(desk, "")).toBe(true);
    expect(itemMatchesCatalogSearch(desk, "alpha")).toBe(true);
    expect(itemMatchesCatalogSearch(desk, "compact")).toBe(true);
    expect(itemMatchesCatalogSearch(desk, "sharing")).toBe(true);
    expect(itemMatchesCatalogSearch(desk, desk.sku!.toLowerCase())).toBe(true);
    expect(itemMatchesCatalogSearch(desk, "zzzznotfound")).toBe(false);
  });
});
