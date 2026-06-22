import { afterEach, describe, expect, it } from "vitest";

import { getEditorSelectionStatus } from "@/features/planner/editor/editorSelectionStatus";
import { resetFabricRuntimeState, seedFabricRuntime } from "../integration/planner-fabric-mockRuntime";

describe("getEditorSelectionStatus", () => {
  afterEach(() => {
    resetFabricRuntimeState();
  });

  it("returns null when nothing is selected", () => {
    seedFabricRuntime({ selections: [] });
    expect(getEditorSelectionStatus(null)).toBeNull();
  });

  it("formats a single furniture selection label", () => {
    seedFabricRuntime({
      selections: [{ name: "GENERIC:Four-seater desk", width: 480, height: 120, angle: 90 }],
    });
    expect(getEditorSelectionStatus(null)).toBe("Four-seater desk");
  });

  it("reports multi-select count", () => {
    seedFabricRuntime({
      selections: [{ name: "GENERIC:a" }, { name: "GENERIC:b" }, { name: "GENERIC:c" }],
    });
    expect(getEditorSelectionStatus(null)).toBe("3 items");
  });

  it("formats wall and room names from Fabric metadata", () => {
    seedFabricRuntime({
      selections: [{ name: "WALL:North", width: 100, height: 4 }],
    });
    expect(getEditorSelectionStatus(null)).toBe("North");
  });
});

