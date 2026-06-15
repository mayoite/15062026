/**
 * tldraw v5 Shape Registry Integration
 *
 * Runtime validators for planner custom-shape props.
 */

import type { RecordProps } from "@tldraw/tlschema";
import { T } from "@tldraw/validate";
import type {
  PlannerDoorTLShape,
  PlannerFurnitureTLShape,
  PlannerMeasurementTLShape,
  PlannerRoomTLShape,
  PlannerWallTLShape,
  PlannerWindowTLShape,
  PlannerZoneTLShape,
} from "./tldrawShapeTypes";

const pointValidator = T.object({ x: T.number, y: T.number });
const pointArrayValidator =
  T.arrayOf(pointValidator) as unknown as RecordProps<PlannerRoomTLShape>["points"];

export const TldrawWallShapeProps: RecordProps<PlannerWallTLShape> = {
  startX: T.number,
  startY: T.number,
  endX: T.number,
  endY: T.number,
  thickness: T.number,
  lengthMm: T.number,
  material: T.literalEnum("drywall", "brick", "glass", "concrete", "wood"),
  isLoadBearing: T.boolean,
  isExterior: T.boolean,
  hasJunctionStart: T.boolean,
  hasJunctionEnd: T.boolean,
  junctionTypeStart: T.literalEnum("T", "L", "cross").optional(),
  junctionTypeEnd: T.literalEnum("T", "L", "cross").optional(),
  showDimensions: T.boolean,
  showMaterial: T.boolean,
  color: T.string,
  fillColor: T.string.optional(),
  strokeColor: T.string.optional(),
  strokeWidth: T.number.optional(),
};

export const TldrawRoomShapeProps: RecordProps<PlannerRoomTLShape> = {
  points: pointArrayValidator,
  roomType: T.literalEnum("office", "meeting", "conference", "cafeteria", "lobby", "restroom", "utility", "storage", "custom"),
  areaSqm: T.number,
  perimeterMm: T.number,
  floorMaterial: T.literalEnum("carpet", "hardwood", "tile", "vinyl", "concrete", "custom"),
  widthMm: T.number,
  heightMm: T.number,
  showArea: T.boolean,
  showPerimeter: T.boolean,
  fillOpacity: T.number,
  label: T.string,
  showLabel: T.boolean,
  color: T.string,
  fillColor: T.string.optional(),
  strokeColor: T.string.optional(),
  strokeWidth: T.number.optional(),
};

export const TldrawFurnitureShapeProps: RecordProps<PlannerFurnitureTLShape> = {
  furnitureCategory: T.literalEnum("workstation", "seating", "table", "storage", "softSeating", "accessory", "partition", "custom"),
  furnitureType: T.string,
  widthMm: T.number,
  heightMm: T.number,
  depthMm: T.number.optional(),
  height3dMm: T.number,
  catalogId: T.string,
  productSlug: T.string.optional(),
  sku: T.string.optional(),
  productName: T.string.optional(),
  manufacturer: T.string.optional(),
  imageUrl: T.string.optional(),
  isAgainstWall: T.boolean,
  snapDistance: T.number,
  showDimensions: T.boolean,
  showLabel: T.boolean,
  renderStyle: T.literalEnum("outline", "filled", "detailed"),
  color: T.string,
  fillColor: T.string.optional(),
  strokeColor: T.string.optional(),
  strokeWidth: T.number.optional(),
  seatCount: T.number.optional(),
  teamName: T.string.optional(),
};

export const TldrawDoorShapeProps: RecordProps<PlannerDoorTLShape> = {
  doorType: T.literalEnum("single", "double", "sliding", "folding"),
  swingDirection: T.literalEnum("left", "right", "both"),
  swingAngle: T.number,
  widthMm: T.number,
  thicknessMm: T.number,
  wallId: T.string.optional(),
  wallPosition: T.number,
  isAttached: T.boolean,
  showSwingArc: T.boolean,
  showDoorPanel: T.boolean,
  showFrame: T.boolean,
  isActiveLeaf: T.literalEnum("left", "right", "both"),
  frameColor: T.string,
  panelColor: T.string,
  color: T.string,
  fillColor: T.string.optional(),
  strokeColor: T.string.optional(),
  strokeWidth: T.number.optional(),
};

export const TldrawWindowShapeProps: RecordProps<PlannerWindowTLShape> = {
  windowType: T.literalEnum("single", "double", "sliding", "fixed", "awning"),
  widthMm: T.number,
  heightMm: T.number,
  sillHeightMm: T.number,
  wallId: T.string.optional(),
  wallPosition: T.number,
  isAttached: T.boolean,
  hasFrame: T.boolean,
  frameThicknessMm: T.number,
  hasSill: T.boolean,
  hasMullions: T.boolean,
  mullionCount: T.number,
  isOperable: T.boolean,
  opensDirection: T.literalEnum("in", "out", "slide"),
  showGlass: T.boolean,
  showFrame: T.boolean,
  showSill: T.boolean,
  glassColor: T.string,
  frameColor: T.string,
  color: T.string,
  fillColor: T.string.optional(),
  strokeColor: T.string.optional(),
  strokeWidth: T.number.optional(),
};

export const TldrawZoneShapeProps: RecordProps<PlannerZoneTLShape> = {
  points: pointArrayValidator as RecordProps<PlannerZoneTLShape>["points"],
  zoneType: T.literalEnum("quiet", "collaborative", "focus", "social", "custom"),
  areaSqm: T.number,
  capacity: T.number,
  currentOccupancy: T.number,
  widthMm: T.number,
  heightMm: T.number,
  areaPerPerson: T.number,
  maxCapacity: T.number,
  showBoundary: T.boolean,
  showFill: T.boolean,
  showCapacity: T.boolean,
  showOccupancy: T.boolean,
  fillPattern: T.literalEnum("solid", "hatch", "dots", "crosshatch"),
  dashArray: T.arrayOf(T.number).optional(),
  zoneColor: T.string,
  fillColor: T.string,
  label: T.string,
  showLabel: T.boolean,
  color: T.string,
  strokeColor: T.string.optional(),
  strokeWidth: T.number.optional(),
};

export const TldrawMeasurementShapeProps: RecordProps<PlannerMeasurementTLShape> = {
  startX: T.number,
  startY: T.number,
  endX: T.number,
  endY: T.number,
  lengthMm: T.number,
  unit: T.literalEnum("mm", "cm", "m", "ft", "in", "ft-in"),
  orientation: T.literalEnum("horizontal", "vertical", "diagonal"),
  offset: T.number,
  showValue: T.boolean,
  showUnit: T.boolean,
  precision: T.number,
  showArrows: T.boolean,
  arrowSize: T.number,
  arrowStyle: T.literalEnum("filled", "open"),
  showExtensionLines: T.boolean,
  extensionLength: T.number,
  referenceIds: T.arrayOf(T.string),
  referenceType: T.literalEnum("wall", "room", "furniture", "custom"),
  textColor: T.string,
  lineColor: T.string,
  fontSize: T.number,
  color: T.string,
  strokeColor: T.string.optional(),
  strokeWidth: T.number.optional(),
  fillColor: T.string.optional(),
};

export const SHAPE_TYPES = {
  WALL: "planner-wall",
  ROOM: "planner-room",
  FURNITURE: "planner-furniture",
  DOOR: "planner-door",
  WINDOW: "planner-window",
  ZONE: "planner-zone",
  MEASUREMENT: "planner-measurement",
} as const;

export const SHAPE_METADATA = {
  [SHAPE_TYPES.WALL]: { props: TldrawWallShapeProps, isLine: true },
  [SHAPE_TYPES.ROOM]: { props: TldrawRoomShapeProps, isLine: false },
  [SHAPE_TYPES.FURNITURE]: { props: TldrawFurnitureShapeProps, isLine: false },
  [SHAPE_TYPES.DOOR]: { props: TldrawDoorShapeProps, isLine: true },
  [SHAPE_TYPES.WINDOW]: { props: TldrawWindowShapeProps, isLine: true },
  [SHAPE_TYPES.ZONE]: { props: TldrawZoneShapeProps, isLine: false },
  [SHAPE_TYPES.MEASUREMENT]: { props: TldrawMeasurementShapeProps, isLine: true },
} as const;

export function getShapeMetadata(shapeType: string) {
  return SHAPE_METADATA[shapeType as keyof typeof SHAPE_METADATA];
}

export function isValidShapeType(shapeType: string): shapeType is keyof typeof SHAPE_TYPES {
  return Object.values(SHAPE_TYPES).includes(shapeType as (typeof SHAPE_TYPES)[keyof typeof SHAPE_TYPES]);
}

export function getAllShapeTypes(): readonly string[] {
  return Object.values(SHAPE_TYPES);
}

export function getShapeProps(shapeType: string) {
  return getShapeMetadata(shapeType)?.props;
}
