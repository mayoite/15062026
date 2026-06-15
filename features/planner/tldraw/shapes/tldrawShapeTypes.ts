import type { TLBaseShape } from "@tldraw/tlschema";
import type {
  DoorSwingDirection,
  DoorType,
  FloorMaterial,
  FurnitureCategory,
  MeasurementOrientation,
  MeasurementUnit,
  RoomType,
  WallMaterial,
  WindowType,
  ZoneType,
} from "./sharedTypes";

export interface PlannerWallShapePropsTL {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  thickness: number;
  lengthMm: number;
  material: WallMaterial;
  isLoadBearing: boolean;
  isExterior: boolean;
  hasJunctionStart: boolean;
  hasJunctionEnd: boolean;
  junctionTypeStart?: "T" | "L" | "cross";
  junctionTypeEnd?: "T" | "L" | "cross";
  showDimensions: boolean;
  showMaterial: boolean;
  color: string;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

export interface PlannerRoomShapePropsTL {
  points: Array<{ x: number; y: number }>;
  roomType: RoomType;
  areaSqm: number;
  perimeterMm: number;
  floorMaterial: FloorMaterial;
  widthMm: number;
  heightMm: number;
  showArea: boolean;
  showPerimeter: boolean;
  fillOpacity: number;
  label: string;
  showLabel: boolean;
  color: string;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

export interface PlannerFurnitureShapePropsTL {
  furnitureCategory: FurnitureCategory;
  furnitureType: string;
  widthMm: number;
  heightMm: number;
  depthMm?: number;
  height3dMm: number;
  catalogId: string;
  productSlug?: string;
  sku?: string;
  productName?: string;
  manufacturer?: string;
  imageUrl?: string;
  isAgainstWall: boolean;
  snapDistance: number;
  showDimensions: boolean;
  showLabel: boolean;
  renderStyle: "outline" | "filled" | "detailed";
  color: string;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  seatCount?: number;
  teamName?: string;
}

export interface PlannerDoorShapePropsTL {
  doorType: DoorType;
  swingDirection: DoorSwingDirection;
  swingAngle: number;
  widthMm: number;
  thicknessMm: number;
  wallId?: string;
  wallPosition: number;
  isAttached: boolean;
  showSwingArc: boolean;
  showDoorPanel: boolean;
  showFrame: boolean;
  isActiveLeaf: "left" | "right" | "both";
  frameColor: string;
  panelColor: string;
  color: string;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

export interface PlannerWindowShapePropsTL {
  windowType: WindowType;
  widthMm: number;
  heightMm: number;
  sillHeightMm: number;
  wallId?: string;
  wallPosition: number;
  isAttached: boolean;
  hasFrame: boolean;
  frameThicknessMm: number;
  hasSill: boolean;
  hasMullions: boolean;
  mullionCount: number;
  isOperable: boolean;
  opensDirection: "in" | "out" | "slide";
  showGlass: boolean;
  showFrame: boolean;
  showSill: boolean;
  glassColor: string;
  frameColor: string;
  color: string;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

export interface PlannerZoneShapePropsTL {
  points: Array<{ x: number; y: number }>;
  zoneType: ZoneType;
  areaSqm: number;
  capacity: number;
  currentOccupancy: number;
  widthMm: number;
  heightMm: number;
  areaPerPerson: number;
  maxCapacity: number;
  showBoundary: boolean;
  showFill: boolean;
  showCapacity: boolean;
  showOccupancy: boolean;
  fillPattern: "solid" | "hatch" | "dots" | "crosshatch";
  dashArray?: number[];
  zoneColor: string;
  fillColor: string;
  label: string;
  showLabel: boolean;
  color: string;
  strokeColor?: string;
  strokeWidth?: number;
}

export interface PlannerMeasurementShapePropsTL {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  lengthMm: number;
  unit: MeasurementUnit;
  orientation: MeasurementOrientation;
  offset: number;
  showValue: boolean;
  showUnit: boolean;
  precision: number;
  showArrows: boolean;
  arrowSize: number;
  arrowStyle: "filled" | "open";
  showExtensionLines: boolean;
  extensionLength: number;
  referenceIds: string[];
  referenceType: "wall" | "room" | "furniture" | "custom";
  textColor: string;
  lineColor: string;
  fontSize: number;
  color: string;
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
}

export type PlannerWallTLShape = TLBaseShape<"planner-wall", PlannerWallShapePropsTL>;
export type PlannerRoomTLShape = TLBaseShape<"planner-room", PlannerRoomShapePropsTL>;
export type PlannerFurnitureTLShape = TLBaseShape<"planner-furniture", PlannerFurnitureShapePropsTL>;
export type PlannerDoorTLShape = TLBaseShape<"planner-door", PlannerDoorShapePropsTL>;
export type PlannerWindowTLShape = TLBaseShape<"planner-window", PlannerWindowShapePropsTL>;
export type PlannerZoneTLShape = TLBaseShape<"planner-zone", PlannerZoneShapePropsTL>;
export type PlannerMeasurementTLShape = TLBaseShape<"planner-measurement", PlannerMeasurementShapePropsTL>;
