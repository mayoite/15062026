import { describe, expect, it } from "vitest";

import {
  enrichCatalogItem,
  formatCatalogSeatFootprint,
  mapPurposeFilterToCatalogTab,
  resolveCatalogPurposeTab,
  resolveCatalogSubCategory,
} from "@/features/planner/catalog/catalogHierarchy";
import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";

const sampleDesk: CatalogItem = {
  id: "bench-4-seater",
  name: "Table Top: 25mm thick Pre laminate — 4 seater- NS (1200mm)",
  category: "desks",
  shapeType: "planner-bench",
  widthMm: 480,
  heightMm: 60,
  depthMm: 60,
  seatCount: 4,
  description: "Non-sharing straight workstation",
  tags: ["straight", "non-sharing", "4-seater"],
};

describe("catalog hierarchy", () => {
  it("maps desks to workstations with cluster sub-category", () => {
    expect(resolveCatalogPurposeTab(sampleDesk)).toBe("workstations");
    expect(resolveCatalogSubCategory(sampleDesk, "workstations")).toBe("cluster");
  });

  it("enriches sku, short name, and footprint", () => {
    const enriched = enrichCatalogItem(sampleDesk);
    expect(enriched.sku).toBeTruthy();
    expect(enriched.shortName!.length).toBeLessThanOrEqual(30);
    expect(enriched.material).toBeTruthy();
    expect(formatCatalogSeatFootprint(enriched)).toMatch(/m × .*m/);
  });

  it("maps onboarding purpose filter to catalog tabs", () => {
    expect(mapPurposeFilterToCatalogTab("meeting-rooms")).toBe("meeting");
    expect(mapPurposeFilterToCatalogTab("executive-cabin")).toBe("cabins");
    expect(mapPurposeFilterToCatalogTab("workstations")).toBe("workstations");
  });

  it("maps phone booths to meeting purpose", () => {
    const booth: CatalogItem = {
      ...sampleDesk,
      id: "booth-phone-1",
      category: "rooms",
      name: "Phone Booth",
      tags: ["booth", "phone", "private"],
    };
    expect(resolveCatalogPurposeTab(booth)).toBe("meeting");
    expect(resolveCatalogSubCategory(booth, "meeting")).toBe("phone-booth");
  });
});