import { describe, expect, it } from "vitest";

import * as toolsIndex from "@/features/planner/tldraw/tools/index";
import {
  checkClearanceViolations,
  DoorWindowPlacementUtils,
  FurniturePlacementUtils,
  MeasurementUtils,
  PlannerDoorWindowTool,
  PlannerFurnitureTool,
  PlannerMeasurementTool,
  PlannerRoomTool,
  PlannerWallTool,
  PlannerZoneTool,
  RoomDetectionUtils,
  ShapeRegistrationSystem,
  WallDrawingUtils,
  ZoneOverlayUtils,
} from "@/features/planner/tldraw/tools/index";

describe("tldraw tools index exports", () => {
  it("re-exports tool classes and utils", () => {
    expect(toolsIndex.PlannerWallTool).toBe(PlannerWallTool);
    expect(toolsIndex.WallDrawingUtils).toBe(WallDrawingUtils);
    expect(toolsIndex.RoomDetectionUtils).toBe(RoomDetectionUtils);
    expect(toolsIndex.ShapeRegistrationSystem).toBe(ShapeRegistrationSystem);
    expect(toolsIndex.ZoneOverlayUtils).toBe(ZoneOverlayUtils);
    expect(toolsIndex.FurniturePlacementUtils).toBe(FurniturePlacementUtils);
    expect(toolsIndex.DoorWindowPlacementUtils).toBe(DoorWindowPlacementUtils);
    expect(toolsIndex.MeasurementUtils).toBe(MeasurementUtils);
    expect(toolsIndex.PlannerRoomTool).toBe(PlannerRoomTool);
    expect(toolsIndex.PlannerZoneTool).toBe(PlannerZoneTool);
    expect(toolsIndex.PlannerFurnitureTool).toBe(PlannerFurnitureTool);
    expect(toolsIndex.PlannerDoorWindowTool).toBe(PlannerDoorWindowTool);
    expect(toolsIndex.PlannerMeasurementTool).toBe(PlannerMeasurementTool);
    expect(toolsIndex.checkClearanceViolations).toBe(checkClearanceViolations);
  });
});