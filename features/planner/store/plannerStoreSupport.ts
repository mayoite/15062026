import type { PlannerState, Room } from "./plannerStore";

export interface Snapshot {
  walls: PlannerState["walls"];
  rooms: Room[];
  furniture: PlannerState["furniture"];
  doors: PlannerState["doors"];
  windows: PlannerState["windows"];
  measurements: PlannerState["measurements"];
  zones: PlannerState["zones"];
  textLabels: PlannerState["textLabels"];
  structuralElements: PlannerState["structuralElements"];
}

export type HistorySnapshot = Snapshot;

export const ROOM_COLORS = [
  "var(--surface-glass)",
  "var(--surface-glass)",
  "var(--surface-glass)",
  "var(--surface-glass)",
  "var(--surface-glass)",
  "var(--surface-glass)",
];

export function takeSnapshot(state: PlannerState): HistorySnapshot {
  return {
    walls: JSON.parse(JSON.stringify(state.walls)),
    rooms: JSON.parse(JSON.stringify(state.rooms)),
    furniture: JSON.parse(JSON.stringify(state.furniture)),
    doors: JSON.parse(JSON.stringify(state.doors)),
    windows: JSON.parse(JSON.stringify(state.windows)),
    measurements: JSON.parse(JSON.stringify(state.measurements)),
    zones: JSON.parse(JSON.stringify(state.zones)),
    textLabels: JSON.parse(JSON.stringify(state.textLabels)),
    structuralElements: JSON.parse(JSON.stringify(state.structuralElements)),
  };
}

export function pushUndo(
  state: PlannerState,
  maxUndo: number
): { undoStack: Snapshot[]; redoStack: Snapshot[] } {
  const snapshot = takeSnapshot(state);
  const stack = [...state.undoStack, snapshot];
  if (stack.length > maxUndo) stack.shift();
  return { undoStack: stack, redoStack: [] };
}
