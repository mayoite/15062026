import { useEffect, useRef } from "react";
import { useEditor } from "tldraw";
import type { Editor } from "tldraw";
import { usePlannerStore } from "../data/plannerStore";
import { assertPlannerEngine, PLANNER_2D_ENGINE } from "../lib/engineOwnership";
import { activatePlannerTool, syncPlannerGrid } from "./plannerSyncBridge";
import { extractPlannerSyncSnapshot, type PlannerSyncSnapshot } from "./plannerSyncSerialize";
import { syncPlannerStateToEditor } from "./plannerSyncStateSync";

/** Module-level tldraw Editor reference — set by PlannerSyncEditorBridge, read by export utilities. */
let _tldrawEditor: Editor | null = null;

/** Returns the live tldraw Editor instance, or null if not yet mounted. */
export function getTldrawEditor(): Editor | null {
  return _tldrawEditor;
}

export function usePlannerSync() {
  // Boundary guard: the planner sync layer is wired to tldraw and nothing else.
  assertPlannerEngine(PLANNER_2D_ENGINE);
  const editor = useEditor();
  const isSyncingRef = useRef(false);
  const lastZustandSnapshotRef = useRef<PlannerSyncSnapshot | null>(null);

  // Sync Tldraw -> Zustand
  useEffect(() => {
    if (!editor) return;

    const syncTldrawToZustand = () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;

      try {
        usePlannerStore.setState(extractPlannerSyncSnapshot(editor));
      } finally {
        isSyncingRef.current = false;
      }
    };

    // Listen to editor store events
    const cleanup = editor.store.listen(
      () => {
        syncTldrawToZustand();
      },
      { scope: "document", source: "user" }
    );

    // Initial sync
    syncTldrawToZustand();

    return () => {
      cleanup();
    };
  }, [editor]);

  // Sync Zustand -> Tldraw (when Zustand is updated from external panels/actions)
  useEffect(() => {
    if (!editor) return;

    const unsubscribe = usePlannerStore.subscribe((state) => {
      const prev = lastZustandSnapshotRef.current;
      if (
        prev &&
        prev.walls === state.walls &&
        prev.rooms === state.rooms &&
        prev.furniture === state.furniture &&
        prev.doors === state.doors &&
        prev.windows === state.windows &&
        prev.measurements === state.measurements &&
        prev.zones === state.zones &&
        prev.selectedId === state.selectedId &&
        prev.selectedIds === state.selectedIds
      ) {
        return;
      }
      lastZustandSnapshotRef.current = {
        walls: state.walls,
        rooms: state.rooms,
        furniture: state.furniture,
        doors: state.doors,
        windows: state.windows,
        measurements: state.measurements,
        zones: state.zones,
        selectedId: state.selectedId,
        selectedIds: state.selectedIds,
      };

      if (isSyncingRef.current) return;
      isSyncingRef.current = true;

      try {
        editor.run(() => syncPlannerStateToEditor(editor, state), {
          history: "ignore",
        });
      } finally {
        isSyncingRef.current = false;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [editor]);
}

/**
 * Maps Zustand planner tool IDs to tldraw built-in / custom tool IDs.
 * Tools without a dedicated StateNode fall back to "select".
 */
export function PlannerSyncEditorBridge() {
  const editor = useEditor();
  usePlannerSync();

  // Store editor reference for use outside of React tree (e.g. export handlers)
  useEffect(() => {
    _tldrawEditor = editor;
    return () => {
      _tldrawEditor = null;
    };
  }, [editor]);

  // Bridge: when the Zustand tool changes, activate the matching tldraw tool
  useEffect(() => {
    if (!editor) return;

    activatePlannerTool(editor, usePlannerStore.getState().tool);

    const unsubscribe = usePlannerStore.subscribe((state) => {
      activatePlannerTool(editor, state.tool);
    });

    return () => {
      unsubscribe();
    };
  }, [editor]);

  // Bridge: sync grid visibility from Zustand to tldraw
  useEffect(() => {
    if (!editor) return;

    syncPlannerGrid(editor, usePlannerStore.getState().showGrid);

    const unsubscribe = usePlannerStore.subscribe((state) => {
      syncPlannerGrid(editor, state.showGrid);
    });

    return () => {
      unsubscribe();
    };
  }, [editor]);

  return null;
}
