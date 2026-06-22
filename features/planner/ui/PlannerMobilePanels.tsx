"use client";

import type { BoqItem, CatalogProduct, PlannerStep, RoomPreset } from "@/features/planner/shared/types/planner";
import type { PlannerSelectionDimensions } from "../lib/editorTools";
import type { ReactNode } from "react";

import { CatalogPanel } from "./CatalogPanel";
import { InspectorPanel } from "./InspectorPanel";
import { LayersPanel } from "./LayersPanel";
import { MobileDrawerSheet } from "./MobileDrawerSheet";

interface PlannerMobilePanelsProps {
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
  mobileCatalogOpen: boolean;
  mobileLayersOpen: boolean;
  mobileInspectorOpen: boolean;
  isSnapMode: boolean;
  onOpenCatalogChange: (open: boolean) => void;
  onOpenLayersChange: (open: boolean) => void;
  onOpenInspectorChange: (open: boolean) => void;
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
  onToggleSnap: () => void;
  onUpdateSelectionDimensions: (next: { widthMm?: number; heightMm?: number | null }) => void;
  onUnitSystemChange: (unit: "mm" | "ft-in") => void;
  onAdvanceBoqFlow: () => void;
}

interface PlannerMobileDrawerProps {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
}

function PlannerMobileDrawer({
  children,
  open,
  onOpenChange,
  title,
}: PlannerMobileDrawerProps) {
  return (
    <MobileDrawerSheet open={open} onOpenChange={onOpenChange} title={title} trigger={<span />}>
      {open ? children : null}
    </MobileDrawerSheet>
  );
}

export function PlannerMobilePanels({
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
  mobileCatalogOpen,
  mobileLayersOpen,
  mobileInspectorOpen,
  isSnapMode,
  onOpenCatalogChange,
  onOpenLayersChange,
  onOpenInspectorChange,
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
  onToggleSnap,
  onUpdateSelectionDimensions,
  onUnitSystemChange,
  onAdvanceBoqFlow,
}: PlannerMobilePanelsProps) {
  const closeCatalog = () => onOpenCatalogChange(false);
  const closeLayers = () => onOpenLayersChange(false);
  const closeInspector = () => onOpenInspectorChange(false);

  const handleCatalogDropFurniture = (product: CatalogProduct | { name: string; category: string }) => {
    onDropFurniture(product);
    closeCatalog();
  };

  const handleAdvanceBoqFlow = () => {
    onAdvanceBoqFlow();
    closeInspector();
  };

  return (
    <>
      <PlannerMobileDrawer
        open={mobileCatalogOpen}
        onOpenChange={onOpenCatalogChange}
        title={currentStep === "room" ? "Room Builder" : "Catalog"}
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
          onDropFurniture={handleCatalogDropFurniture}
          onClose={closeCatalog}
          pinned={false}
          onTogglePin={() => {}}
          showPinToggle={false}
        />
      </PlannerMobileDrawer>

      <PlannerMobileDrawer
        open={mobileLayersOpen}
        onOpenChange={onOpenLayersChange}
        title="Layers"
      >
        <LayersPanel
          editor={editor}
          unitSystem={unitSystem}
          onFitSelection={onFitSelection}
          onAlignSelection={onAlignSelection}
          onDistributeSelection={onDistributeSelection}
          onClose={closeLayers}
          pinned={false}
          onTogglePin={() => {}}
          showPinToggle={false}
        />
      </PlannerMobileDrawer>

      <PlannerMobileDrawer
        open={mobileInspectorOpen}
        onOpenChange={onOpenInspectorChange}
        title="Inspector"
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
          onAdvanceBoqFlow={handleAdvanceBoqFlow}
          onClose={closeInspector}
          pinned={false}
          onTogglePin={() => {}}
          showPinToggle={false}
        />
      </PlannerMobileDrawer>
    </>
  );
}
