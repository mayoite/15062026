import { describe, expect, it } from "vitest";
import {
  PLANNER_HERO,
  PLANNER_LANDING_FEATURES,
  PLANNER_PROOF,
} from "@/features/planner/landing/plannerLandingData";

describe("planner landing data", () => {
  it("hero leads with guest canvas", () => {
    expect(PLANNER_HERO.primaryCta.href).toBe("/planner/guest/");
    expect(PLANNER_HERO.primaryCta.label).toBe("Start free");
    expect(PLANNER_HERO.secondaryCta.label).toBe("Sign in");
  });

  it("landing shows four feature pillars with short titles", () => {
    expect(PLANNER_LANDING_FEATURES).toHaveLength(4);
    expect(PLANNER_LANDING_FEATURES.map((f) => f.slug)).toEqual([
      "measure",
      "catalog",
      "3d-view",
      "export",
    ]);
    expect(PLANNER_LANDING_FEATURES.map((f) => f.title)).toEqual([
      "Room sizes",
      "Catalog drop-in",
      "3D preview",
      "PDF export",
    ]);
  });

  it("proof surfaces three guest-friendly usps", () => {
    expect(PLANNER_PROOF).toHaveLength(3);
    expect(PLANNER_PROOF.map((item) => item.value)).toEqual([
      "Import sketch",
      "Export plan",
      "Start free",
    ]);
  });
});
