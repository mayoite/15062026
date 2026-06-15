import type { FloorTemplate } from "./floorTemplates";
import { instantiateTemplate } from "./floorTemplates";
import type { PlannerState, Point } from "./plannerStore";

export interface ClearedPlannerState {
  geometry: {
    walls: [];
    rooms: [];
    doors: [];
    windows: [];
    measurements: [];
    zones: [];
    structuralElements: [];
    drawingWall: null;
    drawingRoom: [];
    drawingZone: [];
  };
  furniture: {
    furniture: [];
    selectedId: null;
    selectedIds: [];
  };
  ui: {
    zoom: number;
    panOffset: { x: number; y: number };
    viewMode: "2d";
    backgroundImage: null;
    tags: [];
    lightingPreset: "day";
  };
  history: {
    undoStack: [];
    redoStack: [];
    clipboard: null;
  };
}

export function buildClearedPlannerState(): ClearedPlannerState {
  return {
    geometry: {
      walls: [],
      rooms: [],
      doors: [],
      windows: [],
      measurements: [],
      zones: [],
      structuralElements: [],
      drawingWall: null,
      drawingRoom: [],
      drawingZone: [],
    },
    furniture: {
      furniture: [],
      selectedId: null,
      selectedIds: [],
    },
    ui: {
      zoom: 1,
      panOffset: { x: 0, y: 0 },
      viewMode: "2d",
      backgroundImage: null,
      tags: [],
      lightingPreset: "day",
    },
    history: {
      undoStack: [],
      redoStack: [],
      clipboard: null,
    },
  };
}

export function snapPointToGrid(point: Point, snapDistance: number): Point {
  return {
    x: Math.round(point.x / snapDistance) * snapDistance,
    y: Math.round(point.y / snapDistance) * snapDistance,
  };
}

export function buildTemplateLoadedState(template: FloorTemplate): Partial<PlannerState> {
  const data = instantiateTemplate(template);
  return {
    walls: data.walls,
    rooms: data.rooms,
    doors: data.doors,
    windows: data.windows,
    furniture: data.furniture,
    zones: [],
    selectedId: null,
    selectedIds: [],
    drawingWall: null,
    drawingRoom: [],
    drawingZone: [],
    isDirty: true,
    undoStack: [],
    redoStack: [],
  };
}

export function plannerHasContent(state: Pick<
  PlannerState,
  | "walls"
  | "rooms"
  | "furniture"
  | "doors"
  | "windows"
  | "zones"
  | "textLabels"
  | "structuralElements"
>): boolean {
  return (
    state.walls.length > 0 ||
    state.rooms.length > 0 ||
    state.furniture.length > 0 ||
    state.doors.length > 0 ||
    state.windows.length > 0 ||
    state.zones.length > 0 ||
    state.textLabels.length > 0 ||
    state.structuralElements.length > 0
  );
}
