import React from "react";
import { usePlannerStore, type FurnitureItem } from "@/features/oando-planner/data/plannerStore";
import {
  MATERIAL_PRESET_LIST,
  type MaterialPreset,
} from "@/features/oando-planner/r3f/presets";

interface MaterialPresetControlProps {
  /** The furniture item to control material for */
  item: FurnitureItem;
}

/**
 * Per-furniture material preset picker for the 3D view.
 * Allows users to select wood, concrete, or fabric materials.
 */
export function MaterialPresetControl({ item }: MaterialPresetControlProps) {
  const updateFurniture = usePlannerStore((s) => s.updateFurniture);

  const handlePresetChange = (preset: MaterialPreset) => {
    updateFurniture(item.id, { materialPreset: preset });
  };

  const currentPreset = item.materialPreset || "wood";

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-white/70">3D Material</label>
      <div className="flex gap-1">
        {MATERIAL_PRESET_LIST.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePresetChange(preset.id)}
            className={`
              flex-1 px-2 py-1.5 rounded-md text-[11px] font-medium transition-all
              ${
                currentPreset === preset.id
                  ? "bg-[var(--color-accent,var(--border-soft))] text-white shadow-md ring-1 ring-white/20"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90"
              }
            `}
            title={preset.description}
            aria-pressed={currentPreset === preset.id}
            aria-label={`Set material to ${preset.name}`}
          >
            <span className="flex items-center justify-center gap-1">
              <MaterialIcon preset={preset.id} />
              {preset.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MaterialIcon({ preset }: { preset: MaterialPreset }) {
  switch (preset) {
    case "wood":
      return <span aria-hidden="true">🪵</span>;
    case "concrete":
      return <span aria-hidden="true">🧱</span>;
    case "fabric":
      return <span aria-hidden="true">🧵</span>;
    default:
      return null;
  }
}
