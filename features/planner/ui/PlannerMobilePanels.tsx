"use client";

import type { Editor } from "tldraw";

import type { BoqItem, CatalogProduct, PlannerStep, RoomPreset } from "@/features/planner/shared/types/planner";
import type { PlannerSelectionDimensions } from "../lib/editorTools";

import { CatalogPanel } from "./CatalogPanel";
import { InspectorPanel } from "./InspectorPanel";
import { LayersPanel } from "./LayersPanel";
import { MobileDrawerSheet } from "./MobileDrawerSheet";

interface PlannerMobilePanelsProps {
  editor: Editor | null;
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
  return (
    <>
      <MobileDrawerSheet
        open={mobileCatalogOpen}
        onOpenChange={onOpenCatalogChange}
        title={currentStep === "room" ? "Room Builder" : "Catalog"}
        trigger={<span />}
      >
        {mobileCatalogOpen ? (
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
            onDropFurniture={(product) => {
              onDropFurniture(product);
              onOpenCatalogChange(false);
            }}
            onClose={() => onOpenCatalogChange(false)}
            pinned={false}
            onTogglePin={() => {}}
            showPinToggle={false}
          />
        ) : null}
      </MobileDrawerSheet>

      <MobileDrawerSheet
        open={mobileLayersOpen}
        onOpenChange={onOpenLayersChange}
        title="Layers"
        trigger={<span />}
      >
        {mobileLayersOpen ? (
          <LayersPanel
            editor={editor}
            unitSystem={unitSystem}
            onFitSelection={onFitSelection}
            onAlignSelection={onAlignSelection}
            onDistributeSelection={onDistributeSelection}
            onClose={() => onOpenLayersChange(false)}
            pinned={false}
            onTogglePin={() => {}}
            showPinToggle={false}
          />
        ) : null}
      </MobileDrawerSheet>

      <MobileDrawerSheet
        open={mobileInspectorOpen}
        onOpenChange={onOpenInspectorChange}
        title="Inspector"
        trigger={<span />}
      >
        {mobileInspectorOpen ? (
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
            onAdvanceBoqFlow={() => {
              onAdvanceBoqFlow();
              onOpenInspectorChange(false);
            }}
            onClose={() => onOpenInspectorChange(false)}
            pinned={false}
            onTogglePin={() => {}}
            showPinToggle={false}
          />
        ) : null}
      </MobileDrawerSheet>
    </>
  );
}
