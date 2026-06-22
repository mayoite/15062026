import { afterEach, describe, expect, it } from "vitest";

import {
  applyLayerVisibility,
  isShapeLayerHidden,
} from "@/features/planner/editor/layerVisibility";
import type { PlannerLayerCategory } from "@/features/planner/store/workspaceStore";
import { resetFabricRuntimeState, seedFabricRuntime } from "../integration/planner-fabric-mockRuntime";

const allVisible: Record<PlannerLayerCategory, boolean> = {
  walls: true,
  rooms: true,
  zones: true,
  furniture: true,
  measurements: true,
  underlay: true,
};

describe("fabric layer visibility bridge", () => {
  afterEach(() => {
    resetFabricRuntimeState();
  });

  it("always reports shapes as visible in the legacy helper", () => {
    expect(isShapeLayerHidden({ type: "planner-furniture", meta: { layerHidden: true } })).toBe(false);
    expect(isShapeLayerHidden({ type: "planner-furniture" })).toBe(false);
  });

  it("delegates visibility toggles to the Fabric runtime", () => {
    const { setLayerVisibility } = seedFabricRuntime();
    const hiddenFurniture = { ...allVisible, furniture: false };

    applyLayerVisibility(null, hiddenFurniture);

    expect(setLayerVisibility).toHaveBeenCalledWith(hiddenFurniture);
  });

  it("no-ops when the Fabric runtime is not mounted", () => {
    resetFabricRuntimeState();
    expect(() => applyLayerVisibility(null, allVisible)).not.toThrow();
  });
});

