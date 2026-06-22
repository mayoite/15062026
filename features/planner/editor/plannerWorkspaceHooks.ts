import { useCallback, useEffect, useState } from "react";
import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";
import { useFloorplan } from "@/features/planner/canvas-fabric/context/FloorplanContext";
import type { PlannerToolBinding } from "./plannerKeyboardShortcuts";

export function usePlannerViewMode() {
  const [viewMode, setViewMode] = useState<"2d" | "3d" | "split">("2d");

  const handleViewModeChange = useCallback((mode: "2d" | "3d" | "split") => {
    setViewMode(mode);
  }, []);

  return { viewMode, handleViewModeChange, setViewMode };
}

export function usePlannerCatalogDrop(_canvasSurfaceRef: React.RefObject<HTMLDivElement>) {
  const [dragItem, setDragItem] = useState<CatalogItem | null>(null);
  const [isCatalogOverCanvas, setIsCatalogOverCanvas] = useState(false);
  const { insertObject } = useFloorplan();

  const handleCanvasDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const item = (e.dataTransfer as DataTransfer & { catalogItem?: CatalogItem }).catalogItem;
    if (item) {
      setIsCatalogOverCanvas(true);
      setDragItem(item);
    }
  }, []);

  const handleCanvasDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsCatalogOverCanvas(false);
      const item = (e.dataTransfer as DataTransfer & { catalogItem?: CatalogItem }).catalogItem;
      if (item) {
        insertObject({
          type: "CATALOG",
          object: { catalogItemId: item.id },
        });
      }
      setDragItem(null);
    },
    [insertObject]
  );

  return {
    dragItem,
    isCatalogOverCanvas,
    handleCanvasDragOver,
    handleCanvasDrop,
    setDragItem,
    setIsCatalogOverCanvas,
  };
}

export function usePlannerDocument() {
  const { exportDraft, importDraft } = useFloorplan();

  const saveDocument = useCallback(async (name: string) => {
    const state = exportDraft();
    if (!state) return null;
    return { name, data: state, timestamp: Date.now() };
  }, [exportDraft]);

  const loadDocument = useCallback(
    async (data: string) => {
      await importDraft(data);
    },
    [importDraft]
  );

  return { saveDocument, loadDocument };
}

export function usePlannerKeyboardHandlers(applyToolBinding: (binding: PlannerToolBinding) => void) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      const bindings: Record<string, PlannerToolBinding> = {
        w: { toolId: "planner-wall", plannerTool: "wall" },
        v: { toolId: "select", plannerTool: "select" },
      };
      const binding = bindings[e.key.toLowerCase()];
      if (binding) {
        e.preventDefault();
        applyToolBinding(binding);
      }
    },
    [applyToolBinding]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
