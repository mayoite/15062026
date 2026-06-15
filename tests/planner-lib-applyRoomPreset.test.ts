import { describe, expect, it, vi } from "vitest";
import type { Editor } from "tldraw";

import { ROOM_PRESETS } from "@/features/planner/catalog/roomPresets";
import { applyRoomPreset, buildRoomPresetShapes } from "@/features/planner/lib/applyRoomPreset";

const applyShapes = vi.fn();

vi.mock("@/features/planner/editor/plannerShapeFactories", () => ({
  applyShapes: (...args: unknown[]) => applyShapes(...args),
  buildRoomShape: vi.fn((x, y, w, h, label, roomType) => ({
    type: "room",
    x,
    y,
    w,
    h,
    label,
    roomType,
  })),
  buildZoneShape: vi.fn((x, y, w, h, label, zoneType) => ({
    type: "zone",
    x,
    y,
    w,
    h,
    label,
    zoneType,
  })),
}));

describe("planner apply room preset", () => {
  it("builds single-zone and multi-zone room preset shapes", () => {
    const single = buildRoomPresetShapes(ROOM_PRESETS[0], { x: 0, y: 0 });
    expect(single).toHaveLength(1);
    expect(single[0]).toMatchObject({ type: "room", label: "Cabin" });

    const multiZonePreset = ROOM_PRESETS.find((preset) => (preset.zones?.length ?? 0) > 1);
    expect(multiZonePreset).toBeDefined();
    const multi = buildRoomPresetShapes(multiZonePreset!, { x: 100, y: 200 });
    expect(multi.length).toBeGreaterThan(1);
    expect(multi.some((shape) => shape.type === "zone")).toBe(true);
  });

  it("centers presets in the viewport and applies generated shapes", () => {
    applyShapes.mockClear();
    const editor = {
      getViewportPageBounds: () => ({
        center: { x: 500, y: 400 },
      }),
    } as unknown as Editor;

    applyRoomPreset(editor, ROOM_PRESETS[1]);
    expect(applyShapes).toHaveBeenCalledTimes(1);
    expect(applyShapes.mock.calls[0]?.[0]).toBe(editor);
    expect(applyShapes.mock.calls[0]?.[1]?.length).toBeGreaterThan(0);
  });
});