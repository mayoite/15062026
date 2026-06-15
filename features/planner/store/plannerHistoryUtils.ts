import type { HistorySnapshot } from "./plannerStoreSupport";

interface HistoryStacks {
  undoStack: HistorySnapshot[];
  redoStack: HistorySnapshot[];
}

export interface UndoRedoResult extends HistoryStacks {
  snapshot: HistorySnapshot;
}

export function buildUndoState(
  state: HistoryStacks,
  currentSnapshot: HistorySnapshot
): UndoRedoResult | null {
  if (state.undoStack.length === 0) return null;

  const previous = state.undoStack[state.undoStack.length - 1];
  return {
    snapshot: previous,
    undoStack: state.undoStack.slice(0, -1),
    redoStack: [...state.redoStack, currentSnapshot],
  };
}

export function buildRedoState(
  state: HistoryStacks,
  currentSnapshot: HistorySnapshot
): UndoRedoResult | null {
  if (state.redoStack.length === 0) return null;

  const next = state.redoStack[state.redoStack.length - 1];
  return {
    snapshot: next,
    redoStack: state.redoStack.slice(0, -1),
    undoStack: [...state.undoStack, currentSnapshot],
  };
}
