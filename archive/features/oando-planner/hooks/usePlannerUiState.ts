"use client";
import { useState, useCallback } from "react";
import { usePlannerStore, type Tool, type ViewMode } from "../data/plannerStore";

export interface UiState {
  tool: Tool;
  zoom: number;
  selectedId: string | null;
  viewMode: ViewMode;
  showGrid: boolean;
  activeDialog: "templates" | "shortcuts" | "boq" | "cluster" | "arrange" | "presentation" | "zones" | "integrations" | null;
}

export function usePlannerUiState() {
  const tool = usePlannerStore((s) => s.tool);
  const setTool = usePlannerStore((s) => s.setTool);
  const zoom = usePlannerStore((s) => s.zoom);
  const setZoom = usePlannerStore((s) => s.setZoom);
  const selectedId = usePlannerStore((s) => s.selectedId);
  const setSelected = usePlannerStore((s) => s.setSelected);
  const viewMode = usePlannerStore((s) => s.viewMode);
  const setViewMode = usePlannerStore((s) => s.setViewMode);
  const showGrid = usePlannerStore((s) => s.showGrid);
  const toggleGrid = usePlannerStore((s) => s.toggleGrid);

  const [activeDialog, setActiveDialogState] = useState<UiState["activeDialog"]>(null);

  const openDialog = useCallback((dialog: UiState["activeDialog"]) => {
    setActiveDialogState(dialog);
  }, []);

  const closeDialog = useCallback(() => {
    setActiveDialogState(null);
  }, []);

  return {
    // State
    tool,
    zoom,
    selectedId,
    viewMode,
    showGrid,
    activeDialog,

    // Actions
    setTool,
    setZoom,
    setSelected,
    setViewMode,
    toggleGrid,
    openDialog,
    closeDialog,
  };
}