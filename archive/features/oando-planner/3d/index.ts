/**
 * @deprecated This module is deprecated. Use @/features/oando-planner/r3f instead.
 * 
 * The 3D system has been consolidated into the r3f/ folder which uses React Three Fiber.
 * This folder will be removed in a future version.
 * 
 * Migration guide:
 * - 3d/presets.ts → r3f/presets.ts
 * - 3d/usePlannerSync.ts → r3f/usePlannerR3FSync.ts
 * - 3d/PlannerScene.tsx → r3f/PlannerScene.tsx
 * - 3d/Planner3DViewer.tsx → r3f/R3FPlannerApp.tsx (different API)
 * - 3d/FurnitureMesh.tsx → r3f/meshes/resolveMesh.tsx (different API)
 */

// Re-export from r3f for backward compatibility during transition
export {
  MATERIAL_PRESETS,
  MATERIAL_PRESET_LIST,
  getMaterialPreset,
  LIGHTING_PRESETS,
  LIGHTING_PRESET_LIST,
  getLightingPreset,
  DEFAULT_LIGHTING_PRESET,
  DEFAULT_MATERIAL_PRESET,
} from "../r3f/presets";

export type {
  MaterialPreset,
  MaterialPresetConfig,
  LightingPreset,
  LightingPresetConfig,
  LightConfig,
} from "../r3f/presets";

// Re-export sync bridge from r3f
export {
  getTldrawEditor,
  PlannerR3FSyncEditorBridge as PlannerSyncEditorBridge,
  usePlannerR3FSync as usePlannerSync,
} from "../r3f/usePlannerR3FSync";

// Re-export types that are still used
export type { DetectedRoom } from "../tools/RoomDetectionTool";
export type { ClipboardEntry, SnapDistance, ViewMode } from "../data/plannerStore";
export type { WallMaterial, RoomType, FloorMaterial, FurnitureCategory, DoorType, WindowType, ZoneType } from "../shapes/sharedTypes";
export type { PlannerWallTLShape, PlannerRoomTLShape, PlannerFurnitureTLShape, PlannerDoorTLShape, PlannerWindowTLShape, PlannerZoneTLShape } from "../shapes/tldrawShapeTypes";

// Deprecated exports - will be removed
// export { PlannerScene } from "./PlannerScene";
// export { WallMesh } from "./WallMesh";
// export { FloorMesh } from "./FloorMesh";
// export { FurnitureMesh } from "./FurnitureMesh";
// export { DoorMesh } from "./DoorMesh";
// export { WindowMesh } from "./WindowMesh";
// export { CameraController } from "./CameraController";
// export { Lighting } from "./Lighting";
// export { PlannerSyncEditorBridge as default } from "./usePlannerSync";