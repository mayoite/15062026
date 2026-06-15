import type { WallShapeProps } from "./WallShape";
import type { RoomShapeProps } from "./RoomShape";
import type { FurnitureShapeProps } from "./FurnitureShape";
import type { DoorShapeProps, WindowShapeProps } from "./DoorWindowShape";
import type { MeasurementShapeProps } from "./MeasurementShape";
import type { ZoneShapeProps } from "./ZoneShape";

declare module "@tldraw/tlschema" {
  interface TLGlobalShapePropsMap {
    "planner-wall": WallShapeProps;
    "planner-room": RoomShapeProps;
    "planner-furniture": FurnitureShapeProps;
    "planner-door": DoorShapeProps;
    "planner-window": WindowShapeProps;
    "planner-measurement": MeasurementShapeProps;
    "planner-zone": ZoneShapeProps;
  }
}
