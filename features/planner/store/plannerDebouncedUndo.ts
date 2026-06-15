import type { PlannerState } from "./plannerTypes";
import { takeSnapshot, type Snapshot } from "./plannerStoreSupport";

type Get = () => PlannerState;
type Set = (
  partial:
    | Partial<PlannerState>
    | ((state: PlannerState) => Partial<PlannerState>)
) => void;

const DEBOUNCE_MS = 500;

/**
 * Shared debounce-then-commit-to-undo controller used by every
 * `update*Debounced` action. A single pending snapshot is captured at the
 * start of a rapid edit burst and committed once the burst settles, so a
 * drag/scrub produces exactly one undo entry instead of one per frame.
 */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let debounceSnapshot: Snapshot | null = null;

/** Capture the pre-edit snapshot once at the start of an edit burst. */
export function captureDebounceSnapshot(state: PlannerState): void {
  if (!debounceSnapshot) {
    debounceSnapshot = takeSnapshot(state);
  }
}

function commit(get: Get, set: Set, maxUndo: number): void {
  if (!debounceSnapshot) return;
  const stack = [...get().undoStack, debounceSnapshot];
  if (stack.length > maxUndo) stack.shift();
  set({ undoStack: stack, redoStack: [] });
  debounceSnapshot = null;
}

/** (Re)start the settle timer that commits the pending snapshot. */
export function scheduleDebounceCommit(get: Get, set: Set, maxUndo: number): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    commit(get, set, maxUndo);
    debounceTimer = null;
  }, DEBOUNCE_MS);
}

/** Flush any pending debounced edit into the undo stack immediately. */
export function flushDebounce(get: Get, set: Set, maxUndo: number): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  commit(get, set, maxUndo);
}
