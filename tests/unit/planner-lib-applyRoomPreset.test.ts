import { afterEach, describe, expect, it } from "vitest";

import { ROOM_PRESETS } from "@/features/planner/catalog/roomPresets";
import { applyRoomPreset } from "@/features/planner/lib/applyRoomPreset";
import { resetFabricRuntimeState, seedFabricRuntime } from "../integration/planner-fabric-mockRuntime";

describe("planner apply room preset", () => {
  afterEach(() => {
    resetFabricRuntimeState();
  });

  it("inserts a Fabric room shell through the runtime contract", () => {
    const { insertObject } = seedFabricRuntime();
    const preset = ROOM_PRESETS[1];

    applyRoomPreset(null, preset);

    expect(insertObject).toHaveBeenCalledWith({
      type: "ROOM",
      object: {
        title: preset.name,
        width: Math.round(preset.widthMm / 25.4),
        height: Math.round(preset.heightMm / 25.4),
      },
    });
  });

  it("no-ops when the Fabric runtime is unavailable", () => {
    resetFabricRuntimeState();
    expect(() => applyRoomPreset(null, ROOM_PRESETS[0])).not.toThrow();
  });
});

