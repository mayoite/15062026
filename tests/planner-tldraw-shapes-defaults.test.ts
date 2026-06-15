import { describe, expect, it } from "vitest";

import { DEFAULT_DOOR_PROPS } from "@/features/planner/tldraw/shapes/DoorShape";
import { DEFAULT_FURNITURE_PROPS } from "@/features/planner/tldraw/shapes/FurnitureShape";
import { DEFAULT_MEASUREMENT_PROPS } from "@/features/planner/tldraw/shapes/MeasurementShape";
import { DEFAULT_ROOM_PROPS } from "@/features/planner/tldraw/shapes/RoomShape";
import { DEFAULT_WINDOW_PROPS } from "@/features/planner/tldraw/shapes/WindowShape";
import { DEFAULT_ZONE_PROPS } from "@/features/planner/tldraw/shapes/ZoneShape";
import { PLANNER_SHAPE_TYPES } from "@/features/planner/tldraw/shapes/index";
import { FURNITURE_CATEGORIES } from "@/features/planner/tldraw/shapes/sharedTypes";

describe("planner shape defaults", () => {
  it("exports canonical shape type list", () => {
    expect(PLANNER_SHAPE_TYPES).toContain("planner-wall");
    expect(PLANNER_SHAPE_TYPES.length).toBe(7);
  });

  it("DEFAULT_DOOR_PROPS has swing and frame defaults", () => {
    expect(DEFAULT_DOOR_PROPS.doorType).toBe("single");
    expect(DEFAULT_DOOR_PROPS.showSwingArc).toBe(true);
  });

  it("DEFAULT_WINDOW_PROPS has frame and glass defaults", () => {
    expect(DEFAULT_WINDOW_PROPS.windowType).toBe("single");
    expect(DEFAULT_WINDOW_PROPS.showGlass).toBe(true);
  });

  it("DEFAULT_FURNITURE_PROPS references workstation category", () => {
    expect(DEFAULT_FURNITURE_PROPS.furnitureCategory).toBe("workstation");
    expect(DEFAULT_FURNITURE_PROPS.showLabel).toBe(true);
  });

  it("DEFAULT_ROOM_PROPS uses office room type", () => {
    expect(DEFAULT_ROOM_PROPS.roomType).toBe("office");
    expect(DEFAULT_ROOM_PROPS.showArea).toBe(true);
  });

  it("DEFAULT_ZONE_PROPS uses focus zone type", () => {
    expect(DEFAULT_ZONE_PROPS.zoneType).toBe("focus");
    expect(DEFAULT_ZONE_PROPS.showBoundary).toBe(true);
  });

  it("DEFAULT_MEASUREMENT_PROPS defaults to mm unit", () => {
    expect(DEFAULT_MEASUREMENT_PROPS.unit).toBe("mm");
    expect(DEFAULT_MEASUREMENT_PROPS.showArrows).toBe(true);
  });

  it("FURNITURE_CATEGORIES lists planner categories", () => {
    expect(FURNITURE_CATEGORIES).toContain("workstation");
    expect(FURNITURE_CATEGORIES).toContain("partition");
  });
});