import { describe, expect, it } from "vitest";

import {
  getStepLeftOpenDefault,
} from "@/features/planner/editor/usePlannerPanels";

describe("getStepLeftOpenDefault", () => {
  it("opens the catalog on place and draw, collapses on review", () => {
    expect(getStepLeftOpenDefault("place", false)).toBe(true);
    expect(getStepLeftOpenDefault("place", true)).toBe(true);
    expect(getStepLeftOpenDefault("draw", false)).toBe(true);
    expect(getStepLeftOpenDefault("draw", true)).toBe(true);
    expect(getStepLeftOpenDefault("review", false)).toBe(false);
  });
});

