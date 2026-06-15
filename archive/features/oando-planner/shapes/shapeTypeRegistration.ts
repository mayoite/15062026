/**
 * Shape Type Registration for OOFPL Planner
 *
 * Registers custom planner shape props with tldraw's global shape map.
 */

import "@tldraw/tlschema";

declare module "@tldraw/tlschema" {
  interface TLGlobalShapePropsMap {
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
    "planner-wall": import("./tldrawShapeTypes").PlannerWallShapePropsTL;
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
    "planner-room": import("./tldrawShapeTypes").PlannerRoomShapePropsTL;
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
    "planner-furniture": import("./tldrawShapeTypes").PlannerFurnitureShapePropsTL;
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
    "planner-door": import("./tldrawShapeTypes").PlannerDoorShapePropsTL;
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
    "planner-window": import("./tldrawShapeTypes").PlannerWindowShapePropsTL;
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
    "planner-zone": import("./tldrawShapeTypes").PlannerZoneShapePropsTL;
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
    "planner-measurement": import("./tldrawShapeTypes").PlannerMeasurementShapePropsTL;
  }
}

export { };

