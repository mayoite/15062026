"use client";

/**
 * Custom fabric.js based floorplan canvas ported from the e:\floorplan-react prototype.
 * Per user decision (2026-06-18): this is the active 2D planner surface and theme/layout base.
 */

export { FloorplanCanvas } from "./FloorplanCanvas";
export { FabricCanvasWorkspace } from "./FabricCanvasWorkspace";
export { FabricCanvasSubToolbar } from "./FabricCanvasSubToolbar";
export { FabricDrawToolsBar } from "./FabricDrawToolsBar";
export { FabricCanvasContextMenu } from "./FabricCanvasContextMenu";
export type { FabricDrawTool } from "./fabricDrawToolTypes";
export { FabricLibraryPanel } from "./FabricLibraryPanel";
export { RoomPresetsModal, RoomPresetsOnOpen } from "./RoomPresetsModal";
export { FloorplanProvider, useFloorplan, type FloorplanOperation, type InsertPayload, type FloorplanCanvasApi } from "./context/FloorplanContext";
export { createFloorplanCanvasApi, type FloorplanCtx } from "./hooks/floorplanCanvas";
export { FURNISHINGS } from "./models/furnishings";
export { fabricSerializedToViewerShapes } from "./fabricToViewerShapes";
export {
  parseFabricObjects,
  resolveRoomMmFromFabricObjects,
  resolveRoomMmFromFabricSnapshot,
  fabricObjectCategory,
} from "./fabricSceneUtils";
export {
  getPlannerFabricRuntime,
  getPlannerFabricRuntimeState,
  setPlannerFabricRuntime,
  setPlannerFabricRuntimeState,
  subscribePlannerFabricRuntimeState,
  createPlannerFabricRuntimeCleanup,
  type PlannerFabricRuntime,
  type PlannerFabricRuntimeState,
  type PlannerFabricSelection,
} from "./plannerRuntime";
