import { useEffect, useState } from "react";

import type { PlannerDrawingTool, PlannerStep } from "@/features/planner/shared/types/planner";

import type { MeasurementUnit } from "../lib/measurements";

interface UsePlannerUiStateOptions {
  mode: "desktop" | "mobile" | "auto";
}

export function usePlannerUiState({ mode }: UsePlannerUiStateOptions) {
  const [isAutoMobileMode, setIsAutoMobileMode] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 1024 : false,
  );
  const [currentStep, setCurrentStep] = useState<PlannerStep>("room");
  const [activeDrawingTool, setActiveDrawingTool] = useState<PlannerDrawingTool>("line");
  const [showCatalog, setShowCatalog] = useState(true);
  const [showLayers, setShowLayers] = useState(false);
  const [showInspector, setShowInspector] = useState(true);
  const [catalogPinned, setCatalogPinned] = useState(true);
  const [layersPinned, setLayersPinned] = useState(false);
  const [inspectorPinned, setInspectorPinned] = useState(true);
  const [isSnapMode, setIsSnapMode] = useState(true);
  const [isGridVisible, setIsGridVisible] = useState(true);
  const [unitSystem, setUnitSystem] = useState<MeasurementUnit>("mm");
  const [activePanel, setActivePanel] = useState<"catalog" | "layers" | "inspector" | null>(null);
  const [showAi, setShowAi] = useState(true);
  const [mobileCatalogOpen, setMobileCatalogOpen] = useState(false);
  const [mobileLayersOpen, setMobileLayersOpen] = useState(false);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);

  useEffect(() => {
    if (mode !== "auto") return;

    const syncViewportMode = () => {
      setIsAutoMobileMode(window.innerWidth < 1024);
    };

    syncViewportMode();
    window.addEventListener("resize", syncViewportMode);

    return () => {
      window.removeEventListener("resize", syncViewportMode);
    };
  }, [mode]);

  return {
    isMobileMode: mode === "mobile" || (mode === "auto" && isAutoMobileMode),
    currentStep,
    activeDrawingTool,
    showCatalog,
    showLayers,
    showInspector,
    catalogPinned,
    layersPinned,
    inspectorPinned,
    isSnapMode,
    isGridVisible,
    unitSystem,
    activePanel,
    showAi,
    mobileCatalogOpen,
    mobileLayersOpen,
    mobileInspectorOpen,
    setCurrentStep,
    setActiveDrawingTool,
    setShowCatalog,
    setShowLayers,
    setShowInspector,
    setCatalogPinned,
    setLayersPinned,
    setInspectorPinned,
    setIsSnapMode,
    setIsGridVisible,
    setUnitSystem,
    setActivePanel,
    setShowAi,
    setMobileCatalogOpen,
    setMobileLayersOpen,
    setMobileInspectorOpen,
  };
}
