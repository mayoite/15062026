import { describe, expect, it } from "vitest";

import { getBlueprintTraceGuide } from "@/features/planner/editor/blueprintTraceGuide";

describe("getBlueprintTraceGuide", () => {
  it("returns calibrated wall-tracing guidance", () => {
    const guide = getBlueprintTraceGuide("wall", true);
    expect(guide.title).toMatch(/Trace wall runs/i);
    expect(guide.body).toMatch(/known corner/i);
  });

  it("returns uncalibrated room guidance", () => {
    const guide = getBlueprintTraceGuide("room", false);
    expect(guide.title).toMatch(/room shell/i);
    expect(guide.tip).toMatch(/furniture/i);
  });
});
