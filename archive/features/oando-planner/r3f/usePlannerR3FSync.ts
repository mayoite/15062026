// @ts-nocheck
"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "tldraw";
import type { Editor } from "tldraw";
import { usePlannerR3FStore, type PlacedItem, type RoomConfig } from "./usePlannerR3FStore";
import { assertPlannerEngine, PLANNER_2D_ENGINE } from "../lib/engineOwnership";
import { furnitureCatalog } from "../data/catalogData";
import { getUnifiedCatalog } from "../data/unifiedCatalog";
import type {
  PlannerFurnitureTLShape,
  PlannerRoomTLShape,
} from "../shapes/tldrawShapeTypes";
import {
  fromShapeId,
  type ShapePoint,
} from "../3d/plannerSyncMappings";

/** Module-level tldraw Editor reference — set by PlannerR3FSyncEditorBridge, read by export utilities. */
let _tldrawEditor: Editor | null = null;

/** Returns the live tldraw Editor instance, or null if not yet mounted. */
export function getTldrawEditor(): Editor | null {
  return _tldrawEditor;
}

interface PlannerR3FSyncSnapshot {
  room: RoomConfig;
  items: PlacedItem[];
  selectedId: string | null;
  selectedIds: string[];
}

function extractPlannerR3FSyncSnapshot(editor: Editor): PlannerR3FSyncSnapshot {
  const shapes = editor.getCurrentPageShapes();
  const items: PlacedItem[] = [];
  let room: RoomConfig = {
    widthMm: 6000,
    depthMm: 5000,
    wallHeightMm: 2800,
  };

  shapes.forEach((shape) => {
    const type = shape.type as string;
    
    if (type === "planner-room") {
      const roomShape = shape as PlannerRoomTLShape;
      const props = roomShape.props;
      const pts = (props.points ?? []).map((point: ShapePoint) => ({
        x: shape.x + point.x,
        y: shape.y + point.y,
      }));
      const xs = pts.map((p) => p.x);
      const ys = pts.map((p) => p.y);
      const minX = xs.length > 0 ? Math.min(...xs) : 0;
      const minY = ys.length > 0 ? Math.min(...ys) : 0;
      const maxX = xs.length > 0 ? Math.max(...xs) : 0;
      const maxY = ys.length > 0 ? Math.max(...ys) : 0;
      
      room = {
        widthMm: Math.round((maxX - minX) * 10),
        depthMm: Math.round((maxY - minY) * 10),
        wallHeightMm: 2800,
      };
      return;
    }

    if (type === "planner-furniture") {
      const furnitureShape = shape as PlannerFurnitureTLShape;
      const props = furnitureShape.props;
      const catalogEntry = furnitureCatalog.find((entry) => entry.id === props.catalogId);
      const unifiedEntry = getUnifiedCatalog().find((entry) => entry.id === props.catalogId);
      
      // Map furniture category to mesh family
      const category = props.furnitureCategory || props.furnitureType || "workstation";
      let meshType: PlacedItem["meshType"] = "desk-rect";
      switch (category) {
        case "seating":
        case "chair" as any:
          meshType = "task-chair";
          break;
        case "softseating" as any:
        case "sofa" as any:
          meshType = "sofa" as any;
          break;
        case "table":
          meshType = "table-rect";
          break;
        case "storage":
          meshType = "storage-cabinet";
          break;
        case "lounge" as any:
          meshType = "lounge-chair";
          break;
        case "desk-l" as any:
          meshType = "desk-l" as any;
          break;
        default:
          meshType = "desk-rect";
      }

      items.push({
        id: fromShapeId(shape.id),
        catalogId: props.catalogId || "desk",
        name: props.productName || "Desk",
        category: category,
        meshType,
        widthMm: props.widthMm ?? 1200,
        depthMm: props.heightMm ?? 700,
        heightMm: unifiedEntry?.heightMm ?? catalogEntry?.heightMm ?? 750,
        position: [shape.x / 1000, 0, shape.y / 1000],
        rotation: shape.rotation,
        color: props.color || unifiedEntry?.color || "#94a3b8",
      });
      return;
    }
  });

  const selectedShapeIds = editor.getSelectedShapeIds();
  return {
    room,
    items,
    selectedId: selectedShapeIds.length > 0 ? fromShapeId(selectedShapeIds[0]) : null,
    selectedIds: selectedShapeIds.map(fromShapeId),
  };
}

export function usePlannerR3FSync() {
  // Boundary guard: the planner sync layer is wired to tldraw and nothing else.
  assertPlannerEngine(PLANNER_2D_ENGINE);
  const editor = useEditor();
  const isSyncingRef = useRef(false);
  const lastSnapshotRef = useRef<PlannerR3FSyncSnapshot | null>(null);

  // Sync Tldraw -> R3F Store
  useEffect(() => {
    if (!editor) return;

    const syncTldrawToR3F = () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;

      try {
        const snapshot = extractPlannerR3FSyncSnapshot(editor);
        
        // Check if anything actually changed
        const prev = lastSnapshotRef.current;
        if (
          prev &&
          prev.room.widthMm === snapshot.room.widthMm &&
          prev.room.depthMm === snapshot.room.depthMm &&
          prev.room.wallHeightMm === snapshot.room.wallHeightMm &&
          prev.items.length === snapshot.items.length &&
          prev.items.every((item, i) => 
            item.id === snapshot.items[i]?.id &&
            item.position[0] === snapshot.items[i]?.position[0] &&
            item.position[2] === snapshot.items[i]?.position[2] &&
            item.rotation === snapshot.items[i]?.rotation
          ) &&
          prev.selectedId === snapshot.selectedId &&
          JSON.stringify(prev.selectedIds) === JSON.stringify(snapshot.selectedIds)
        ) {
          return;
        }
        
        lastSnapshotRef.current = snapshot;

        // Update room
        usePlannerR3FStore.getState().setRoom(snapshot.room);
        
        // Clear and rebuild items
        usePlannerR3FStore.getState().clearItems();
        snapshot.items.forEach((item) => {
          usePlannerR3FStore.getState().addItem({
            catalogId: item.catalogId,
            name: item.name,
            category: item.category,
            meshType: item.meshType,
            widthMm: item.widthMm,
            depthMm: item.depthMm,
            heightMm: item.heightMm,
            position: item.position,
            rotation: item.rotation,
            color: item.color,
          });
        });
        
        // Restore selection
        if (snapshot.selectedId) {
          usePlannerR3FStore.getState().setSelectedId(snapshot.selectedId);
        }
        if (snapshot.selectedIds.length > 1) {
          usePlannerR3FStore.getState().setSelectedId(snapshot.selectedIds);
        }
      } finally {
        isSyncingRef.current = false;
      }
    };

    // Listen to editor store events
    const cleanup = editor.store.listen(
      () => {
        syncTldrawToR3F();
      },
      { scope: "document", source: "user" }
    );

    // Initial sync
    syncTldrawToR3F();

    return () => {
      cleanup();
    };
  }, [editor]);
}

/**
 * Maps Zustand planner tool IDs to tldraw built-in / custom tool IDs.
 * Tools without a dedicated StateNode fall back to "select".
 */
export function PlannerR3FSyncEditorBridge() {
  const editor = useEditor();
  usePlannerR3FSync();

  // Store editor reference for use outside of React tree (e.g. export handlers)
  useEffect(() => {
    _tldrawEditor = editor;
    return () => {
      _tldrawEditor = null;
    };
  }, [editor]);

  // Bridge: when the R3F store tool changes, activate the matching tldraw tool
  // Note: R3F store doesn't have a tool concept, so we skip this for now
  // The tldraw tool is controlled by the 2D editor UI

  // Bridge: sync grid visibility from R3F store to tldraw
  useEffect(() => {
    if (!editor) return;

    const showGrid = usePlannerR3FStore.getState().showGrid;
    try {
      editor.updateInstanceState({ isGridMode: showGrid });
    } catch {
      // Ignore if the editor instance is not ready yet.
    }

    const unsubscribe = usePlannerR3FStore.subscribe((state) => {
      try {
        editor.updateInstanceState({ isGridMode: state.showGrid });
      } catch {
        // Ignore
      }
    });

    return () => {
      unsubscribe();
    };
  }, [editor]);

  return null;
}