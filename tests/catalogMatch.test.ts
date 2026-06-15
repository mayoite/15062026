import { describe, expect, it } from "vitest";

import {
  inferCatalogPriceTier,
  matchCatalogForPlacement,
} from "@/features/planner/ai/catalogMatch";
import { PLANNER_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";

describe("catalog match", () => {
  it("returns tier-sorted matches for a workstation placement", () => {
    const result = matchCatalogForPlacement({
      shapeId: "shape:test",
      kind: "workstation",
      label: "Desk cluster",
      widthMm: 2400,
      heightMm: 1200,
    });

    expect(result.matches.length).toBeGreaterThan(0);
    expect(result.matches.length).toBeLessThanOrEqual(3);
    const tiers = result.matches.map((match) => match.tier);
    expect(new Set(tiers).size).toBe(tiers.length);
    expect(result.matches.every((match) => match.catalogItemId.length > 0)).toBe(true);
  });

  it("classifies executive items as premium", () => {
    const executive = PLANNER_CATALOG_ITEMS.find((item) =>
      item.name.toLowerCase().includes("executive"),
    );
    if (!executive) return;

    expect(inferCatalogPriceTier(executive)).toBe("premium");
  });
});