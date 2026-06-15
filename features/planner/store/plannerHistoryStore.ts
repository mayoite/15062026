import { create } from "zustand";
import { buildRedoState, buildUndoState } from "./plannerHistoryUtils";
import type { ClipboardEntry } from "./plannerTypes";
import type { HistorySnapshot } from "./plannerStoreSupport";

const MAX_UNDO = 50;

interface HistoryState {
  undoStack: HistorySnapshot[];
  redoStack: HistorySnapshot[];
  clipboard: ClipboardEntry | null;

  pushSnapshot: (snapshot: HistorySnapshot) => void;
  undo: (currentSnapshot: HistorySnapshot) => HistorySnapshot | null;
  redo: (currentSnapshot: HistorySnapshot) => HistorySnapshot | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  setClipboard: (clipboard: ClipboardEntry | null) => void;
  clearClipboard: () => void;
}

export const usePlannerHistoryStore = create<HistoryState>((set, get) => ({
  undoStack: [],
  redoStack: [],
  clipboard: null,

  pushSnapshot: (snapshot) => {
    set((prev) => ({
      undoStack: [...prev.undoStack.slice(-(MAX_UNDO - 1)), snapshot],
      redoStack: [],
    }));
  },

  undo: (currentSnapshot) => {
    const s = get();
    const result = buildUndoState(s, currentSnapshot);
    if (result) {
      set({ undoStack: result.undoStack, redoStack: result.redoStack });
      return result.snapshot;
    }
    return null;
  },

  redo: (currentSnapshot) => {
    const s = get();
    const result = buildRedoState(s, currentSnapshot);
    if (result) {
      set({ undoStack: result.undoStack, redoStack: result.redoStack });
      return result.snapshot;
    }
    return null;
  },

  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,
  setClipboard: (clipboard) => set({ clipboard }),
  clearClipboard: () => set({ clipboard: null }),
}));
