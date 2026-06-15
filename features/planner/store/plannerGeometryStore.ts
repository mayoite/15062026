import { create } from "zustand";
import { v4 as uuid } from "uuid";
import { createZone } from "./plannerEntityFactories";
import { applyConnectedWallUpdates, buildConnectedWallUpdates, buildSplitWalls } from "./plannerWallEditUtils";
import { dist } from "./plannerStoreGeometry";
import { ZONE_COLORS } from "./plannerTypes";
import type { DoorItem, Point, Room, StructuralType, Wall, WindowItem, ZoneType, Zone } from "./plannerTypes";

interface MeasurementDraft {
  id: string;
  start: Point;
  end: Point;
  label: string;
}

interface StructuralElementDraft {
  id: string;
  type: StructuralType;
  points: Point[];
}

interface GeometryState {
  walls: Wall[];
  rooms: Room[];
  doors: DoorItem[];
  windows: WindowItem[];
  zones: Zone[];
  measurements: MeasurementDraft[];
  structuralElements: StructuralElementDraft[];
  drawingWall: { start: { x: number; y: number } } | null;
  drawingRoom: { x: number; y: number }[];
  drawingZone: { x: number; y: number }[];
  activeZoneType: ZoneType;
  snapDistance: number;
  gridSize: number;
  showGrid: boolean;
  wallDimensionUnit: "cm" | "mm" | "m" | "ft" | "in";

  addWall: (start: { x: number; y: number }, end: { x: number; y: number }) => void;
  updateWall: (id: string, updates: Partial<Wall>) => void;
  deleteWall: (id: string) => void;
  moveWallEndpoint: (wallId: string, endpoint: "start" | "end", newPos: { x: number; y: number }) => void;
  moveConnectedWalls: (wallId: string, endpoint: "start" | "end", newPos: { x: number; y: number }) => void;
  splitWallAtPoint: (wallId: string, point: { x: number; y: number }) => void;

  addRoom: (points: { x: number; y: number }[], name: string) => void;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  deleteRoom: (id: string) => void;

  addDoor: (wallId: string, position: number, width: number) => void;
  updateDoor: (id: string, updates: Partial<DoorItem>) => void;
  deleteDoor: (id: string) => void;

  addWindow: (wallId: string, position: number, width: number) => void;
  updateWindow: (id: string, updates: Partial<WindowItem>) => void;
  deleteWindow: (id: string) => void;

  addZone: (points: { x: number; y: number }[], name: string, type: ZoneType) => void;
  updateZone: (id: string, updates: Partial<Zone>) => void;
  deleteZone: (id: string) => void;
  addDrawingZonePoint: (p: { x: number; y: number }) => void;
  finishZone: () => void;
  setActiveZoneType: (type: ZoneType) => void;

  addMeasurement: (start: { x: number; y: number }, end: { x: number; y: number }) => void;
  updateMeasurement: (id: string, updates: Partial<MeasurementDraft>) => void;
  deleteMeasurement: (id: string) => void;

  addStructuralElement: (type: StructuralType, points: Point[]) => void;
  updateStructuralElement: (id: string, updates: Partial<StructuralElementDraft>) => void;
  deleteStructuralElement: (id: string) => void;

  setSnapDistance: (d: number) => void;
  setWallDimensionUnit: (u: "cm" | "mm" | "m" | "ft" | "in") => void;
  setShowGrid: (show: boolean) => void;
  setGridSize: (size: number) => void;

  setDrawingWall: (wall: { start: { x: number; y: number } } | null) => void;
  setDrawingRoom: (points: { x: number; y: number }[]) => void;
  addDrawingRoomPoint: (p: { x: number; y: number }) => void;
  
  cursorPosition: { x: number; y: number } | null;
  setCursorPosition: (pos: { x: number; y: number } | null) => void;
}

export const usePlannerGeometryStore = create<GeometryState>((set, get) => ({
  walls: [],
  rooms: [],
  doors: [],
  windows: [],
  zones: [],
  measurements: [],
  structuralElements: [],
  drawingWall: null,
  drawingRoom: [],
  drawingZone: [],
  activeZoneType: "Open Plan" as ZoneType,
  snapDistance: 10,
  gridSize: 20,
  showGrid: true,
  wallDimensionUnit: "cm",

  addWall: (start, end) => {
    const wall: Wall = { id: uuid(), start, end, thickness: 8, color: "var(--border-soft)" };
    set((s) => ({ walls: [...s.walls, wall] }));
  },

  updateWall: (id, updates) => {
    set((s) => ({
      walls: s.walls.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    }));
  },

  deleteWall: (id) => {
    set((s) => ({
      walls: s.walls.filter((w) => w.id !== id),
      doors: s.doors.filter((d) => d.wallId !== id),
      windows: s.windows.filter((w) => w.wallId !== id),
    }));
  },

  moveWallEndpoint: (wallId, endpoint, newPos) => {
    const s = get();
    const wall = s.walls.find((w) => w.id === wallId);
    if (!wall) return;
    const oldPos = endpoint === "start" ? wall.start : wall.end;

    const updatedWalls = s.walls.map((w) => {
      if (w.id === wallId) {
        return endpoint === "start" ? { ...w, start: newPos } : { ...w, end: newPos };
      }
      let changed = false;
      let newW = { ...w };
      if (Math.abs(w.start.x - oldPos.x) < 1 && Math.abs(w.start.y - oldPos.y) < 1) {
        newW = { ...newW, start: newPos };
        changed = true;
      }
      if (Math.abs(w.end.x - oldPos.x) < 1 && Math.abs(w.end.y - oldPos.y) < 1) {
        newW = { ...newW, end: newPos };
        changed = true;
      }
      return changed ? newW : w;
    });

    const updatedDoors = s.doors.map((d) => {
      if (d.wallId === wallId && d.position !== undefined) {
        const wallLen = dist(wall.start, wall.end);
        if (wallLen === 0) return d;
        const newWallLen = dist(
          endpoint === "start" ? newPos : wall.start,
          endpoint === "end" ? newPos : wall.end
        );
        const newPosition = (d.position / wallLen) * newWallLen;
        return { ...d, position: newPosition };
      }
      return d;
    });

    const updatedWindows = s.windows.map((w) => {
      if (w.wallId === wallId && w.position !== undefined) {
        const wallLen = dist(wall.start, wall.end);
        if (wallLen === 0) return w;
        const newWallLen = dist(
          endpoint === "start" ? newPos : wall.start,
          endpoint === "end" ? newPos : wall.end
        );
        const newPosition = (w.position / wallLen) * newWallLen;
        return { ...w, position: newPosition };
      }
      return w;
    });

    set({ walls: updatedWalls, doors: updatedDoors, windows: updatedWindows });
  },

  moveConnectedWalls: (wallId, endpoint, newPos) => {
    const s = get();
    const updatePlan = buildConnectedWallUpdates(s.walls, wallId, endpoint, newPos);
    if (!updatePlan) return;
    set((prev) => ({
      walls: applyConnectedWallUpdates(prev.walls, wallId, updatePlan.wallUpdate, updatePlan.connectedUpdates),
    }));
  },

  splitWallAtPoint: (wallId, point) => {
    const s = get();
    const wall = s.walls.find((w) => w.id === wallId);
    if (!wall) return;
    const [seg1, seg2] = buildSplitWalls(wall, point, uuid);
    set((prev) => ({
      walls: [...prev.walls.filter((w) => w.id !== wallId), seg1, seg2],
    }));
  },

  addRoom: (points, name) => {
    const room: Room = {
      id: uuid(),
      points,
      name,
      color: `hsl(${Math.random() * 360}, 50%, 85%)`,
      area: 0,
    };
    set((s) => ({ rooms: [...s.rooms, room] }));
  },

  updateRoom: (id, updates) => {
    set((s) => ({
      rooms: s.rooms.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
  },

  deleteRoom: (id) => {
    set((s) => ({ rooms: s.rooms.filter((r) => r.id !== id) }));
  },

  addDoor: (wallId, position, width) => {
    const door: DoorItem = { id: uuid(), x: 0, y: 0, rotation: 0, wallId, position, width, swing: 90, style: "single" };
    set((s) => ({ doors: [...s.doors, door] }));
  },

  updateDoor: (id, updates) => {
    set((s) => ({
      doors: s.doors.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    }));
  },

  deleteDoor: (id) => {
    set((s) => ({ doors: s.doors.filter((d) => d.id !== id) }));
  },

  addWindow: (wallId, position, width) => {
    const window: WindowItem = { id: uuid(), x: 0, y: 0, rotation: 0, wallId, position, width, style: "casement" };
    set((s) => ({ windows: [...s.windows, window] }));
  },

  updateWindow: (id, updates) => {
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    }));
  },

  deleteWindow: (id) => {
    set((s) => ({ windows: s.windows.filter((w) => w.id !== id) }));
  },

  addZone: (points, name, type) => {
    const zone = createZone(uuid(), points, name, type, ZONE_COLORS);
    set((s) => ({ zones: [...s.zones, zone], drawingZone: [] }));
  },

  updateZone: (id, updates) => {
    set((s) => ({
      zones: s.zones.map((z) => (z.id === id ? { ...z, ...updates } : z)),
    }));
  },

  deleteZone: (id) => {
    set((s) => ({ zones: s.zones.filter((z) => z.id !== id) }));
  },

  addDrawingZonePoint: (p) => set((s) => ({ drawingZone: [...s.drawingZone, p] })),

  finishZone: () => {
    const { drawingZone, activeZoneType } = get();
    if (drawingZone.length >= 3) {
      get().addZone(drawingZone, activeZoneType, activeZoneType);
    }
    set({ drawingZone: [] });
  },

  setActiveZoneType: (type) => set({ activeZoneType: type }),

  addMeasurement: (start, end) => {
    const measurement = { id: uuid(), start, end, label: "" };
    set((s) => ({ measurements: [...s.measurements, measurement] }));
  },

  updateMeasurement: (id, updates) => {
    set((s) => ({
      measurements: s.measurements.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  },

  deleteMeasurement: (id) => {
    set((s) => ({ measurements: s.measurements.filter((m) => m.id !== id) }));
  },

  addStructuralElement: (type, points) => {
    const element = { id: uuid(), type, points };
    set((s) => ({ structuralElements: [...s.structuralElements, element] }));
  },

  updateStructuralElement: (id, updates) => {
    set((s) => ({
      structuralElements: s.structuralElements.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  },

  deleteStructuralElement: (id) => {
    set((s) => ({ structuralElements: s.structuralElements.filter((e) => e.id !== id) }));
  },

  setSnapDistance: (d) => set({ snapDistance: d, gridSize: d }),
  setWallDimensionUnit: (u) => set({ wallDimensionUnit: u }),
  setShowGrid: (show) => set({ showGrid: show }),
  setGridSize: (size) => set({ gridSize: size, snapDistance: size }),

  setDrawingWall: (wall) => set({ drawingWall: wall }),
  setDrawingRoom: (points) => set({ drawingRoom: points }),
  addDrawingRoomPoint: (p) => set((s) => ({ drawingRoom: [...s.drawingRoom, p] })),
  
  cursorPosition: null,
  setCursorPosition: (pos) => set({ cursorPosition: pos }),
}));
