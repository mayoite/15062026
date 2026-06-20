import { afterEach, describe, expect, it, vi } from "vitest";

import {
  applyInspectorChanges,
  deleteInspectorShape,
  duplicateInspectorShape,
  readInspectorSelection,
  shapeToInspectorData,
  syncSelectionFromEditor,
} from "@/features/planner/editor/shapeInspectorBridge";
import { resetFabricRuntimeState, seedFabricRuntime } from "../integration/planner-fabric-mockRuntime";

describe("shapeInspectorBridge", () => {
  afterEach(() => {
    resetFabricRuntimeState();
  });

  it("maps Fabric selections to inspector data", () => {
    const data = shapeToInspectorData({
      id: "desk-1",
      name: "GENERIC:Desk",
      width: 120,
      height: 60,
      angle: 45,
      stroke: "#111",
      selectable: true,
    });

    expect(data).toMatchObject({
      id: "desk-1",
      type: "GENERIC",
      label: "Desk",
      widthMm: 1200,
      heightMm: 600,
      rotation: 45,
      isLocked: false,
      color: "#111",
    });
  });

  it("reads the active Fabric selection from runtime state", () => {
    seedFabricRuntime({
      selections: [{ name: "TABLE:Meeting", width: 80, height: 40, angle: 0 }],
    });

    expect(readInspectorSelection()).toMatchObject({
      type: "TABLE",
      label: "Meeting",
    });
  });

  it("subscribes to runtime selection changes", () => {
    seedFabricRuntime({ selections: [] });
    const onChange = vi.fn();
    const unsubscribe = syncSelectionFromEditor(null, onChange);

    expect(onChange).toHaveBeenCalledWith(null);
    unsubscribe();
  });

  it("keeps inspector mutations as no-ops until edit wiring lands", () => {
    expect(() => applyInspectorChanges(null, "desk-1", { label: "Updated" })).not.toThrow();
    expect(() => deleteInspectorShape(null, "desk-1")).not.toThrow();
    expect(() => duplicateInspectorShape(null, "desk-1")).not.toThrow();
  });
});
