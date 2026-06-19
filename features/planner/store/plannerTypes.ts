import type { MaterialPreset, LightingPreset } from "@/features/planner/lib/lightingPresets";
export type { LightingPreset };
import type { FloorTemplate } from "./floorTemplates";
import type { HistorySnapshot } from "./plannerStoreSupport";

export type Tool =
  | "select"
  | "wall"
  | "room"
  | "door"
  | "window"
  | "furniture"
  | "eraser"
  | "measure"
  | "zone"
  | "pan";

export type ZoneType =
  | "Open Plan"
  | "Executive"
  | "Meeting"
  | "Reception"
  | "Cafeteria"
  | "Server Room"
  | "Custom";

export const ZONE_COLORS: Record<ZoneType, string> = {
  "Open Plan": "var(--color-ocean-boat-blue-500)",
  "Executive": "var(--color-ocean-boat-blue-300)",
  "Meeting": "var(--color-sustain-400)",
  "Reception": "var(--color-bronze-300)",
  "Cafeteria": "var(--color-warning)",
  "Server Room": "var(--color-danger)",
  "Custom": "var(--color-dark-midnight-blue-200)",
};

export interface Zone {
  id: string;
  points: Point[];
  name: string;
  type: ZoneType;
  color: string;
  opacity: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Wall {
  id: string;
  start: Point;
  end: Point;
  thickness: number;
  color: string;
}

export type FloorMaterial = "default" | "wood" | "tile" | "marble" | "concrete";

export interface BackgroundImage {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  opacity: number;
  isCalibrating: boolean;
  isLocked: boolean;
  calibrationPoints?: Point[];
  calibrationDistanceMm?: number;
}

/** Draft structural element used internally by the geometry store (no x/y/width/height). */
export interface StructuralElementDraft {
  id: string;
  type: StructuralType;
  points: Point[];
}

export interface Room {
  id: string;
  points: Point[];
  name: string;
  color: string;
  floorMaterial?: FloorMaterial;
  wallColor?: string;
  /** Computed area in square units */
  area?: number;
}

export interface FurnitureItem {
  id: string;
  catalogId: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  shape: string;
  zIndex: number;
  /** Curated Oando finish variant id */
  finish?: string;
  /** 3D material preset for rendering */
  materialPreset?: MaterialPreset;
}

export interface DoorItem {
  id: string;
  x: number;
  y: number;
  width: number;
  rotation: number;
  swing: "left" | "right" | "double" | number;
  openAngle?: number;
  /** Wall ID this door is attached to (geometry store model) */
  wallId?: string;
  /** Position along wall (0-1 normalized or absolute px) */
  position?: number;
  style?: "single" | "double" | "french";
}

export interface WindowItem {
  id: string;
  x: number;
  y: number;
  width: number;
  rotation: number;
  style: "single" | "double" | "sliding" | "casement";
  /** Wall ID this window is attached to (geometry store model) */
  wallId?: string;
  /** Position along wall (0-1 normalized or absolute px) */
  position?: number;
}

export interface MeasurementItem {
  id: string;
  start: Point;
  end: Point;
  label?: string;
}

/** Alias for backwards compatibility */
export type MeasurementDraft = MeasurementItem;

/** Project index entry for saved projects list */
export interface ProjectIndexEntry {
  id: string;
  name: string;
  updatedAt?: string;
  thumbnail?: string;
}

/** Loaded project data from storage */
export interface LoadedProjectData {
  walls: Wall[];
  rooms: Room[];
  furniture: FurnitureItem[];
  doors: DoorItem[];
  windows: WindowItem[];
  measurements: MeasurementItem[];
  zones: Zone[];
  textLabels: TextLabel[];
  structuralElements: StructuralElement[];
  selectedId: string | null;
  selectedIds: string[];
  zoom: number;
  panOffset: Point;
  gridSize: number;
  showGrid: boolean;
  viewMode: ViewMode;
  projectName: string;
  tags?: string[];
}

/** Alias for document stored in storage */
export type PlannerDocument = LoadedProjectData;

export interface TextLabel {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  rotation: number;
}

export type StructuralType = "column" | "stair" | "electrical";

export interface StructuralElement {
  id: string;
  type: StructuralType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  label: string;
}

export type ClipboardEntry =
  | { type: "furniture"; data: FurnitureItem }
  | { type: "door"; data: DoorItem }
  | { type: "window"; data: WindowItem };

export type SnapDistance = 5 | 10 | 20;

/**
 * Planner view modes — strictly 2d, 3d, and split.
 * "fabric" is a configurator engine mode and must NEVER appear here.
 * Architecture rule: features/oando-planner owns Fabric + Three/R3F only.
 */
export type ViewMode = "2d" | "3d" | "split";

// Tag validation constants
export const MAX_TAGS = 20;
export const MAX_TAG_LENGTH = 30;

export interface PlannerState {
  tool: Tool;
  walls: Wall[];
  rooms: Room[];
  furniture: FurnitureItem[];
  doors: DoorItem[];
  windows: WindowItem[];
  measurements: MeasurementItem[];
  zones: Zone[];
  textLabels: TextLabel[];
  structuralElements: StructuralElementDraft[];
  selectedId: string | null;
  selectedIds: string[];
  drawingWall: { start: Point } | null;
  drawingRoom: Point[];
  drawingZone: Point[];
  cursorPosition: Point | null;
  activeZoneType: ZoneType;
  activeCatalogId: string | null;
  zoom: number;
  panOffset: Point;
  gridSize: number;
  showGrid: boolean;
  show3D: boolean;
  viewMode: ViewMode;
  sidebarCollapsed: boolean;
  undoStack: HistorySnapshot[];
  redoStack: HistorySnapshot[];
  clipboard: ClipboardEntry | null;
  projectName: string;
  currentProjectKey: string | null;
  isDirty: boolean;
  lastSavedAt: string | null;
  isSaving: boolean;
  saveError: string | null;
  snapDistance: number;
  wallDimensionUnit: "cm" | "mm" | "m" | "ft" | "in";
  backgroundImage: BackgroundImage | null;
  tags: string[];
  /** Global lighting preset for 3D view */
  lightingPreset: LightingPreset;

  setBackgroundImage: (bg: BackgroundImage | null) => void;
  updateBackgroundImage: (updates: Partial<BackgroundImage>) => void;

  setTool: (tool: Tool) => void;
  addWall: (start: Point, end: Point) => void;
  updateWall: (id: string, updates: Partial<Wall>) => void;
  moveWallEndpoint: (wallId: string, endpoint: "start" | "end", newPos: Point) => void;
  addRoom: (points: Point[], name: string) => void;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  addFurniture: (item: Omit<FurnitureItem, "id" | "zIndex">) => void;
  addDoor: (x: number, y: number, rotation: number) => void;
  addWindow: (x: number, y: number, rotation: number) => void;
  updateFurniture: (id: string, updates: Partial<FurnitureItem>) => void;
  updateFurnitureDebounced: (id: string, updates: Partial<FurnitureItem>) => void;
  updateDoor: (id: string, updates: Partial<DoorItem>) => void;
  updateDoorDebounced: (id: string, updates: Partial<DoorItem>) => void;
  updateWindow: (id: string, updates: Partial<WindowItem>) => void;
  updateWindowDebounced: (id: string, updates: Partial<WindowItem>) => void;
  updateWallDebounced: (id: string, updates: Partial<Wall>) => void;
  updateRoomDebounced: (id: string, updates: Partial<Room>) => void;
  flushDebouncedUndo: () => void;
  deleteItem: (id: string) => void;
  setSelected: (id: string | null) => void;
  setDrawingWall: (dw: { start: Point } | null) => void;
  setCursorPosition: (pos: Point | null) => void;
  addDrawingRoomPoint: (p: Point) => void;
  finishRoom: () => string | null;
  cancelDrawing: () => void;
  setZoom: (z: number) => void;
  setPanOffset: (p: Point) => void;
  toggleGrid: () => void;
  toggle3D: () => void;
  toggleSidebar: () => void;
  setViewMode: (mode: ViewMode) => void;
  setProjectName: (n: string) => void;
  saveProject: (thumbnail?: string) => void;
  saveAsCopy: (name: string) => { success: boolean; key?: string; error?: string };
  loadProject: (key: string) => void;
  getSavedProjects: () => string[];
  clearAll: () => void;
  snapToGrid: (p: Point) => Point;
  loadTemplate: (template: FloorTemplate) => void;
  hasContent: () => boolean;
  setDirty: (d: boolean) => void;

  addMeasurement: (start: Point, end: Point) => void;
  deleteMeasurement: (id: string) => void;

  addTextLabel: (x: number, y: number, text: string) => void;
  updateTextLabel: (id: string, updates: Partial<TextLabel>) => void;
  deleteTextLabel: (id: string) => void;

  addStructuralElement: (type: StructuralType, x: number, y: number) => void;
  updateStructuralElement: (id: string, updates: Partial<StructuralElementDraft>) => void;
  deleteStructuralElement: (id: string) => void;

  addZone: (points: Point[], name: string, type: ZoneType) => void;
  updateZone: (id: string, updates: Partial<Zone>) => void;
  deleteZone: (id: string) => void;
  addDrawingZonePoint: (p: Point) => void;
  finishZone: () => void;
  setActiveZoneType: (type: ZoneType) => void;
  setActiveCatalogId: (id: string | null) => void;
  setSelectedIds: (ids: string[]) => void;
  toggleSelectedId: (id: string) => void;
  addFurnitureBatch: (items: Omit<FurnitureItem, "id" | "zIndex">[]) => void;
  updateFurnitureBatch: (updates: { id: string; changes: Partial<FurnitureItem> }[]) => void;

  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;

  setSnapDistance: (d: number) => void;
  setWallDimensionUnit: (u: "cm" | "mm" | "m" | "ft" | "in") => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  pushSnapshot: () => void;

  copySelected: () => void;
  paste: () => void;
  duplicateSelected: () => void;
  selectAll: () => void;
  moveConnectedWalls: (wallId: string, endpoint: "start" | "end", newPos: Point) => void;
  splitWallAtPoint: (wallId: string, point: Point) => void;

  getSelectedItemType: () => "wall" | "room" | "furniture" | "door" | "window" | null;
  getSelectedItem: () => Wall | Room | FurnitureItem | DoorItem | WindowItem | null;

  // Tag management
  setTags: (tags: string[]) => void;

  // 3D preset management
  setLightingPreset: (preset: LightingPreset) => void;
  addTag: (tag: string) => { success: boolean; error?: string };
  removeTag: (tag: string) => void;
}
