import { describe, expect, it } from "vitest";
import { PLANNER_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";
import {
  PLANNER_HERO,
  PLANNER_LANDING_FEATURES,
  PLANNER_PROOF,
} from "@/features/planner/landing/plannerLandingData";

describe("planner landing data", () => {
  it("hero leads with guest canvas", () => {
    expect(PLANNER_HERO.primaryCta.href).toBe("/planner/guest/");
  });

  it("landing shows four feature pillars", () => {
    expect(PLANNER_LANDING_FEATURES).toHaveLength(4);
    expect(PLANNER_LANDING_FEATURES.map((f) => f.slug)).toEqual([
      "measure",
      "catalog",
      "3d-view",
      "export",
    ]);
  });

  it("proof surfaces live catalog item count", () => {
    expect(PLANNER_PROOF[0]?.value).toBe(String(PLANNER_CATALOG_ITEMS.length));
    expect(PLANNER_PROOF[0]?.label).toBe("Furniture items ready to place");
  });
});
