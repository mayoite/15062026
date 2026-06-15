"use client";

import { useState } from "react";
import { LayoutGrid, Map, Sparkles } from "lucide-react";
import type { Editor } from "tldraw";

import { AIAssistDrawer } from "@/features/planner/ai/AIAssistDrawer";
import { CatalogSidebar } from "@/features/planner/catalog/CatalogSidebar";
import { RoomPresetsPanel } from "@/features/planner/catalog/RoomPresetsPanel";
import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";
import type { RoomPreset } from "@/features/planner/catalog/roomPresets";
import type { MeasurementUnit } from "@/features/planner/lib/measurements";
import type { PlannerStep } from "@/features/planner/editor/plannerStep";
import { BlueprintPanel } from "./BlueprintPanel";

import type { PlannerLeftTab } from "./plannerStepBindings";

interface PlannerLeftPanelProps {
  guestMode: boolean;
  editor?: Editor | null;
  plannerStep?: PlannerStep;
  activeTab?: PlannerLeftTab;
  onTabChange?: (tab: PlannerLeftTab) => void;
  onItemClick: (item: CatalogItem) => void;
  onDragStart: (item: CatalogItem) => void;
  onApplyRoomPreset?: (preset: RoomPreset) => void;
  unitSystem?: MeasurementUnit;
}

export function PlannerLeftPanel({
  guestMode,
  editor = null,
  plannerStep = "catalog",
  activeTab,
  onTabChange,
  onItemClick,
  onDragStart,
  onApplyRoomPreset,
  unitSystem = "mm",
}: PlannerLeftPanelProps) {
  const [internalTab, setInternalTab] = useState<PlannerLeftTab>("library");
  const tab = activeTab ?? internalTab;
  const showRoomPresets = plannerStep === "room" && Boolean(onApplyRoomPreset);

  const selectTab = (next: PlannerLeftTab) => {
    if (onTabChange) onTabChange(next);
    else setInternalTab(next);
  };

  return (
    <aside data-coach="catalog" className="pw-left-panel">
      <div className="pw-panel-tabs" role="tablist" aria-label="Left panel">
        <button
          type="button"
          role="tab"
          className="pw-panel-tab pwx-panel-tab"
          data-active={tab === "library"}
          aria-selected={tab === "library"}
          onClick={() => selectTab("library")}
        >
          <LayoutGrid size={12} strokeWidth={2} aria-hidden />
          Library
        </button>
        <button
          type="button"
          role="tab"
          className="pw-panel-tab pwx-panel-tab"
          data-active={tab === "blueprint"}
          aria-selected={tab === "blueprint"}
          onClick={() => selectTab("blueprint")}
        >
          <Map size={12} strokeWidth={2} aria-hidden />
          Blueprint
        </button>
        <button
          type="button"
          role="tab"
          className="pw-panel-tab pwx-panel-tab"
          data-active={tab === "ai-assist"}
          aria-selected={tab === "ai-assist"}
          onClick={() => selectTab("ai-assist")}
        >
          <Sparkles size={12} strokeWidth={2} aria-hidden />
          AI Assist
        </button>
      </div>
      <div className="pw-panel-body">
        {showRoomPresets && onApplyRoomPreset ? <RoomPresetsPanel unitSystem={unitSystem} onApply={onApplyRoomPreset} /> : null}
        {tab === "library" ? (
          <CatalogSidebar embedded onItemClick={onItemClick} onDragStart={onDragStart} />
        ) : tab === "blueprint" ? (
          <BlueprintPanel guestMode={guestMode} embedded />
        ) : (
          <AIAssistDrawer editor={editor} embedded defaultExpanded />
        )}
      </div>
    </aside>
  );
}
