"use client";

import { useState } from "react";
import { LayoutGrid, Map, PanelLeftClose, Sparkles, type LucideIcon } from "lucide-react";
import type { Editor } from "tldraw";

import { AIAssistDrawer } from "@/features/planner/ai/AIAssistDrawer";
import { CatalogSidebar } from "@/features/planner/catalog/CatalogSidebar";
import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";
import type { MeasurementUnit } from "@/features/planner/lib/measurements";
import type { PlannerStep } from "@/features/planner/editor/plannerStep";
import { BlueprintPanel } from "./BlueprintPanel";

import { getStepLeftTab, type PlannerLeftTab } from "./plannerStepBindings";

const TAB_META: Record<PlannerLeftTab, { label: string; Icon: LucideIcon }> = {
  blueprint: { label: "Blueprint", Icon: Map },
  library: { label: "Library", Icon: LayoutGrid },
  "ai-assist": { label: "AI Assist", Icon: Sparkles },
};

function getTabsForStep(step: PlannerStep): PlannerLeftTab[] {
  switch (step) {
    case "draw":
      return ["blueprint", "library", "ai-assist"];
    case "place":
      return ["library", "blueprint", "ai-assist"];
    case "review":
      return ["blueprint", "ai-assist", "library"];
    default:
      return ["library", "blueprint", "ai-assist"];
  }
}

function getStepNote(step: PlannerStep, tab: PlannerLeftTab): string {
  switch (step) {
    case "draw":
      return tab === "library"
        ? "Browse products now, or switch to Blueprint to define the space shell first."
        : tab === "ai-assist"
          ? "Use AI for layout ideas, then return to Blueprint or Library to keep editing."
          : "Start by tracing a blueprint or defining the space shell.";
    case "place":
      return tab === "blueprint"
        ? "Keep the shell visible while you place furniture, doors, and windows."
        : tab === "ai-assist"
          ? "Use AI for arrangement ideas, then place products directly on the canvas."
          : "Use the library for furniture, then place doors and windows on the canvas.";
    case "review":
      return "Review measurements, properties, and export on the right. Jump back to Draw or Place anytime.";
    default:
      return "";
  }
}

interface PlannerLeftPanelProps {
  guestMode: boolean;
  editor?: Editor | null;
  plannerStep?: PlannerStep;
  panelOpen?: boolean;
  showPanelToggle?: boolean;
  onTogglePanel?: () => void;
  activeTab?: PlannerLeftTab;
  onTabChange?: (tab: PlannerLeftTab) => void;
  onItemClick: (item: CatalogItem) => void;
  onDragStart: (item: CatalogItem) => void;
  onDragEnd?: () => void;
  unitSystem?: MeasurementUnit;
}

export function PlannerLeftPanel({
  guestMode,
  editor = null,
  plannerStep = "draw",
  panelOpen = true,
  showPanelToggle = false,
  onTogglePanel,
  activeTab,
  onTabChange,
  onItemClick,
  onDragStart,
  onDragEnd,
}: PlannerLeftPanelProps) {
  const [pickedTab, setPickedTab] = useState<PlannerLeftTab | null>(null);
  const [lastStep, setLastStep] = useState(plannerStep);

  if (lastStep !== plannerStep) {
    setLastStep(plannerStep);
    if (!activeTab) setPickedTab(null);
  }

  const tab = activeTab ?? pickedTab ?? getStepLeftTab(plannerStep);
  const stepNote = getStepNote(plannerStep, tab);
  const tabs = getTabsForStep(plannerStep);
  const primaryTab = tabs[0];

  const selectTab = (next: PlannerLeftTab) => {
    if (onTabChange) onTabChange(next);
    else setPickedTab(next);
  };

  return (
    <aside
      data-coach="catalog"
      data-step={plannerStep}
      data-open={panelOpen ? true : undefined}
      className="pw-left-panel"
    >
      <div className="pw-panel-tabs" role="tablist" aria-label="Left panel">
        {tabs.map((tabId) => {
          const { label, Icon } = TAB_META[tabId];
          return (
            <button
              key={tabId}
              type="button"
              role="tab"
              className="pw-panel-tab pwx-panel-tab"
              data-active={tab === tabId}
              data-relevant={tabId === primaryTab}
              aria-selected={tab === tabId}
              onClick={() => selectTab(tabId)}
            >
              <Icon size={12} strokeWidth={2} aria-hidden />
              {label}
            </button>
          );
        })}
        {showPanelToggle && onTogglePanel ? (
          <button
            type="button"
            className="pw-panel-collapse pw-icon-btn"
            onClick={onTogglePanel}
            aria-label="Close left panel"
          >
            <PanelLeftClose size={14} strokeWidth={2} aria-hidden />
          </button>
        ) : null}
      </div>
      <div className="pw-panel-body" data-active-tab={tab}>
        <p className="pw-panel-step-note">{stepNote}</p>
        {tab === "library" ? (
          <CatalogSidebar
            embedded
            onItemClick={onItemClick}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ) : tab === "blueprint" ? (
          <BlueprintPanel guestMode={guestMode} embedded />
        ) : (
          <AIAssistDrawer editor={editor} embedded defaultExpanded />
        )}
      </div>
    </aside>
  );
}