"use client";

import type { PlannerSelectionDimensions } from "../lib/editorTools";
import type { BoqItem, CatalogProduct, PlannerStep, RoomPreset } from "@/features/planner/shared/types/planner";
import type { ReactNode } from "react";

import { CatalogPanel } from "./CatalogPanel";
import { InspectorPanel } from "./InspectorPanel";
import { LayersPanel } from "./LayersPanel";
import {
  DEFAULT_PLANNER_PANEL_DOCK_GAP_PX,
  DEFAULT_PLANNER_PANEL_WIDTH_PX,
  WorkspacePanel,
} from "./WorkspacePanel";

interface PlannerDesktopPanelsProps {
  editor?: null;
  catalogProducts: CatalogProduct[];
  roomPresets: RoomPreset[];
  boqItems: BoqItem[];
  totalBoq: number;
  currentStep: PlannerStep;
  canContinueFromRoom: boolean;
  roomMetrics: string;
  selectedMetrics: string | null;
  selectionDimensions: PlannerSelectionDimensions | null;
  unitSystem: "mm" | "ft-in";
  showCatalog: boolean;
  showLayers: boolean;
  showInspector: boolean;
  catalogPinned: boolean;
  layersPinned: boolean;
  inspectorPinned: boolean;
  activePanel: "catalog" | "layers" | "inspector" | null;
  isSnapMode: boolean;
  onDropFurniture: (product: CatalogProduct | { name: string; category: string }) => void;
  onApplyRoomPreset: (preset: RoomPreset) => void;
  onActivateWallTool: () => void;
  onActivateBasicShapeTool: () => void;
  onAddWallSegment: () => void;
  onAddDoorOpening: () => void;
  onResolveWallJoins: () => void;
  onFitSelection: () => void;
  onAlignSelection: (operation: "left" | "center-horizontal" | "right" | "top" | "center-vertical" | "bottom") => void;
  onDistributeSelection: (operation: "horizontal" | "vertical") => void;
  onCloseCatalog: () => void;
  onCloseLayers: () => void;
  onCloseInspector: () => void;
  onToggleCatalogPin: () => void;
  onToggleLayersPin: () => void;
  onToggleInspectorPin: () => void;
  onFocusCatalog: () => void;
  onFocusLayers: () => void;
  onFocusInspector: () => void;
  onToggleSnap: () => void;
  onUpdateSelectionDimensions: (next: { widthMm?: number; heightMm?: number | null }) => void;
  onUnitSystemChange: (unit: "mm" | "ft-in") => void;
  onAdvanceBoqFlow: () => void;
  topInsetPx?: number;
  panelDockedSpanPx?: number;
}

interface PlannerDesktopPanelShellProps {
  children: ReactNode;
  id: string;
  side: "left" | "right";
  docked: boolean;
  isActive: boolean;
  onFocus: () => void;
  topPx: number;
  offsetPx?: number;
}

function PlannerDesktopPanelShell({
  children,
  id,
  side,
  docked,
  isActive,
  onFocus,
  topPx,
  offsetPx,
}: PlannerDesktopPanelShellProps) {
  return (
    <WorkspacePanel
      id={id}
      side={side}
      docked={docked}
      isActive={isActive}
      onFocus={onFocus}
      offsetPx={offsetPx}
      topPx={topPx}
    >
      {children}
    </WorkspacePanel>
  );
}

export function PlannerDesktopPanels({
  editor,
  catalogProducts,
  roomPresets,
  boqItems,
  totalBoq,
  currentStep,
  canContinueFromRoom,
  roomMetrics,
  selectedMetrics,
  selectionDimensions,
  unitSystem,
  showCatalog,
  showLayers,
  showInspector,
  catalogPinned,
  layersPinned,
  inspectorPinned,
  activePanel,
  isSnapMode,
  onDropFurniture,
  onApplyRoomPreset,
  onActivateWallTool,
  onActivateBasicShapeTool,
  onAddWallSegment,
  onAddDoorOpening,
  onResolveWallJoins,
  onFitSelection,
  onAlignSelection,
  onDistributeSelection,
  onCloseCatalog,
  onCloseLayers,
  onCloseInspector,
  onToggleCatalogPin,
  onToggleLayersPin,
  onToggleInspectorPin,
  onFocusCatalog,
  onFocusLayers,
  onFocusInspector,
  onToggleSnap,
  onUpdateSelectionDimensions,
  onUnitSystemChange,
  onAdvanceBoqFlow,
  topInsetPx = 188,
  panelDockedSpanPx = DEFAULT_PLANNER_PANEL_WIDTH_PX + DEFAULT_PLANNER_PANEL_DOCK_GAP_PX,
}: PlannerDesktopPanelsProps) {
  const rightPanelOffset = showInspector && inspectorPinned ? panelDockedSpanPx : 0;

  return (
    <>
      {showCatalog ? (
        <PlannerDesktopPanelShell
          id="catalog-panel"
          side="left"
          docked={catalogPinned}
          isActive={activePanel === "catalog"}
          onFocus={onFocusCatalog}
          topPx={topInsetPx}
        >
          <CatalogPanel
            products={catalogProducts}
            editor={editor}
            currentStep={currentStep}
            canPlaceFurniture={currentStep === "catalog"}
            roomPresets={roomPresets}
            unitSystem={unitSystem}
            onApplyRoomPreset={onApplyRoomPreset}
            onActivateWallTool={onActivateWallTool}
            onActivateBasicShapeTool={onActivateBasicShapeTool}
            onAddWallSegment={onAddWallSegment}
            onAddDoorOpening={onAddDoorOpening}
            onResolveWallJoins={onResolveWallJoins}
            onDropFurniture={onDropFurniture}
            onClose={onCloseCatalog}
            pinned={catalogPinned}
            onTogglePin={onToggleCatalogPin}
          />
        </PlannerDesktopPanelShell>
      ) : null}

      {showInspector ? (
        <PlannerDesktopPanelShell
          id="inspector-panel"
          side="right"
          docked={inspectorPinned}
          isActive={activePanel === "inspector"}
          onFocus={onFocusInspector}
          topPx={topInsetPx}
        >
          <InspectorPanel
            boqItems={boqItems}
            totalBoq={totalBoq}
            currentStep={currentStep}
            canContinueFromRoom={canContinueFromRoom}
            roomMetrics={roomMetrics}
            selectedMetrics={selectedMetrics}
            selectionDimensions={selectionDimensions}
            unitSystem={unitSystem}
            onUnitSystemChange={onUnitSystemChange}
            isSnapMode={isSnapMode}
            onToggleSnap={onToggleSnap}
            onUpdateSelectionDimensions={onUpdateSelectionDimensions}
            onAdvanceBoqFlow={onAdvanceBoqFlow}
            onClose={onCloseInspector}
            pinned={inspectorPinned}
            onTogglePin={onToggleInspectorPin}
          />
        </PlannerDesktopPanelShell>
      ) : null}

      {showLayers ? (
        <PlannerDesktopPanelShell
          id="layers-panel"
          side="right"
          docked={layersPinned}
          isActive={activePanel === "layers"}
          onFocus={onFocusLayers}
          offsetPx={rightPanelOffset}
          topPx={topInsetPx}
        >
          <LayersPanel
            editor={editor}
            unitSystem={unitSystem}
            onFitSelection={onFitSelection}
            onAlignSelection={onAlignSelection}
            onDistributeSelection={onDistributeSelection}
            onClose={onCloseLayers}
            pinned={layersPinned}
            onTogglePin={onToggleLayersPin}
          />
        </PlannerDesktopPanelShell>
      ) : null}
    </>
  );
}
