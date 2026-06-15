import type {
  BackgroundImage,
  DoorItem,
  FurnitureItem,
  MeasurementItem,
  PlannerState,
  Room,
  StructuralElement,
  TextLabel,
  Wall,
  WindowItem,
  Zone,
} from "./plannerStore";

type ProjectSnapshotFields = Pick<
  PlannerState,
  | "walls"
  | "rooms"
  | "furniture"
  | "doors"
  | "windows"
  | "measurements"
  | "zones"
  | "textLabels"
  | "structuralElements"
  | "tags"
  | "backgroundImage"
  | "lightingPreset"
>;

export interface LoadedProjectData {
  projectName: string;
  currentProjectKey: string;
  tool: PlannerState["tool"];
  walls: Wall[];
  rooms: Room[];
  furniture: FurnitureItem[];
  doors: DoorItem[];
  windows: WindowItem[];
  measurements: MeasurementItem[];
  zones: Zone[];
  textLabels: TextLabel[];
  structuralElements: StructuralElement[];
  tags: string[];
  lightingPreset: PlannerState["lightingPreset"];
  selectedId: string | null;
  selectedIds: string[];
  zoom: number;
  panOffset: { x: number; y: number };
  gridSize: number;
  showGrid: boolean;
  viewMode: "2d" | "3d" | "split";
  isDirty: false;
  lastSavedAt: string | null;
  backgroundImage: BackgroundImage | null;
  undoStack: [];
  redoStack: [];
}

export function buildProjectSaveData(
  state: ProjectSnapshotFields & {
    projectName: string;
    selectedId?: string | null;
    selectedIds?: string[];
    zoom?: number;
    panOffset?: { x: number; y: number };
    gridSize?: number;
    showGrid?: boolean;
    viewMode?: "2d" | "3d" | "split";
    thumbnail?: string;
  }
) {
  return {
    projectName: state.projectName,
    walls: state.walls,
    rooms: state.rooms,
    furniture: state.furniture,
    doors: state.doors,
    windows: state.windows,
    measurements: state.measurements,
    zones: state.zones,
    textLabels: state.textLabels,
    structuralElements: state.structuralElements,
    tags: state.tags ?? [],
    lightingPreset: state.lightingPreset,
    savedAt: new Date().toISOString(),
    thumbnail: state.thumbnail ?? null,
    backgroundImage: state.backgroundImage,
    selectedId: state.selectedId ?? null,
    selectedIds: state.selectedIds ?? [],
    zoom: state.zoom ?? 1,
    panOffset: state.panOffset ?? { x: 0, y: 0 },
    gridSize: state.gridSize ?? 20,
    showGrid: state.showGrid ?? true,
    viewMode: state.viewMode ?? "2d",
  };
}

export function buildProjectCopyData(
  state: ProjectSnapshotFields,
  projectName: string,
  now: string
) {
  return {
    projectName,
    walls: JSON.parse(JSON.stringify(state.walls)),
    rooms: JSON.parse(JSON.stringify(state.rooms)),
    furniture: JSON.parse(JSON.stringify(state.furniture)),
    doors: JSON.parse(JSON.stringify(state.doors)),
    windows: JSON.parse(JSON.stringify(state.windows)),
    measurements: JSON.parse(JSON.stringify(state.measurements)),
    zones: JSON.parse(JSON.stringify(state.zones)),
    textLabels: JSON.parse(JSON.stringify(state.textLabels)),
    structuralElements: JSON.parse(JSON.stringify(state.structuralElements)),
    tags: JSON.parse(JSON.stringify(state.tags)),
    backgroundImage: state.backgroundImage ? JSON.parse(JSON.stringify(state.backgroundImage)) : null,
    createdAt: now,
    savedAt: now,
    thumbnail: null,
    clientName: "",
    description: "",
  };
}

export function normalizeLoadedProjectData(rawData: Record<string, unknown>): LoadedProjectData {
  return {
    projectName: (rawData.projectName as string) || "Untitled",
    currentProjectKey: "",
    tool:
      rawData.tool === "select" ||
      rawData.tool === "wall" ||
      rawData.tool === "room" ||
      rawData.tool === "door" ||
      rawData.tool === "window" ||
      rawData.tool === "furniture" ||
      rawData.tool === "eraser" ||
      rawData.tool === "measure" ||
      rawData.tool === "zone" ||
      rawData.tool === "pan"
        ? (rawData.tool as PlannerState["tool"])
        : "select",
    walls: (rawData.walls as Wall[]) || [],
    rooms: (rawData.rooms as Room[]) || [],
    furniture: ((rawData.furniture as FurnitureItem[]) || []).map((item, index) => ({
      ...item,
      zIndex: item.zIndex ?? index,
    })),
    doors: (rawData.doors as DoorItem[]) || [],
    windows: (rawData.windows as WindowItem[]) || [],
    measurements: (rawData.measurements as MeasurementItem[]) || [],
    zones: (rawData.zones as Zone[]) || [],
    textLabels: (rawData.textLabels as TextLabel[]) || [],
    structuralElements: (rawData.structuralElements as StructuralElement[]) || [],
    tags: Array.isArray(rawData.tags) ? (rawData.tags as string[]) : [],
    lightingPreset: (rawData.lightingPreset as PlannerState["lightingPreset"]) || "day",
    selectedId: (rawData.selectedId as string | null) ?? null,
    selectedIds: Array.isArray(rawData.selectedIds) ? (rawData.selectedIds as string[]) : [],
    zoom: typeof rawData.zoom === "number" ? rawData.zoom : 1,
    panOffset: rawData.panOffset ? (rawData.panOffset as { x: number; y: number }) : { x: 0, y: 0 },
    gridSize: typeof rawData.gridSize === "number" ? rawData.gridSize : 20,
    showGrid: typeof rawData.showGrid === "boolean" ? rawData.showGrid : true,
    viewMode: rawData.viewMode === "2d" || rawData.viewMode === "3d" || rawData.viewMode === "split" ? rawData.viewMode : "2d",
    isDirty: false,
    lastSavedAt: (rawData.savedAt as string) || null,
    backgroundImage: rawData.backgroundImage
      ? { ...(rawData.backgroundImage as BackgroundImage), isLocked: (rawData.backgroundImage as BackgroundImage).isLocked ?? false }
      : null,
    undoStack: [],
    redoStack: [],
  };
}
