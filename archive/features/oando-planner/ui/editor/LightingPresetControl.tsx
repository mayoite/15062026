import React from "react";
import { usePlannerStore } from "@/features/oando-planner/data/plannerStore";
import {
  LIGHTING_PRESET_LIST,
  type LightingPreset,
} from "@/features/oando-planner/r3f/presets";

/**
 * Global lighting preset picker for the 3D view.
 * Allows users to select day, night, or dusk lighting.
 */
export function LightingPresetControl() {
  const lightingPreset = usePlannerStore((s) => s.lightingPreset);
  const setLightingPreset = usePlannerStore((s) => s.setLightingPreset);

  const handlePresetChange = (preset: LightingPreset) => {
    setLightingPreset(preset);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-white/70">3D Lighting</label>
      <div className="flex gap-1">
        {LIGHTING_PRESET_LIST.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePresetChange(preset.id)}
            className={`
              flex-1 px-2 py-1.5 rounded-md text-[11px] font-medium transition-all
              ${
                lightingPreset === preset.id
                  ? "bg-[var(--color-accent,var(--border-soft))] text-white shadow-md ring-1 ring-white/20"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90"
              }
            `}
            title={preset.description}
            aria-pressed={lightingPreset === preset.id}
            aria-label={`Set lighting to ${preset.name}`}
          >
            <span className="flex items-center justify-center gap-1">
              <LightingIcon preset={preset.id} />
              {preset.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function LightingIcon({ preset }: { preset: LightingPreset }) {
  switch (preset) {
    case "day":
      return <span aria-hidden="true">☀️</span>;
    case "night":
      return <span aria-hidden="true">🌙</span>;
    case "dusk":
      return <span aria-hidden="true">🌅</span>;
    default:
      return null;
  }
}
