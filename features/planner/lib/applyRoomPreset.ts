import type { RoomPreset } from "@/features/planner/catalog/roomPresets";
import { getPlannerFabricRuntime } from "@/features/planner/canvas-fabric";

const MM_PER_INCH = 25.4;

/** Apply a catalog room preset through the Fabric runtime contract. */
export function applyRoomPreset(_editor: null, preset: RoomPreset): void {
  const runtime = getPlannerFabricRuntime();
  if (!runtime) return;

  runtime.insertObject({
    type: "ROOM",
    object: {
      title: preset.name,
      width: Math.round(preset.widthMm / MM_PER_INCH),
      height: Math.round(preset.heightMm / MM_PER_INCH),
    },
  });
}
