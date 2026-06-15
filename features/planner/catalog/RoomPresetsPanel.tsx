"use client";

import { ROOM_PRESETS, type RoomPreset } from "@/features/planner/catalog/roomPresets";
import {
  formatDimensionPair,
  type MeasurementUnit,
} from "@/features/planner/lib/measurements";

interface RoomPresetsPanelProps {
  unitSystem: MeasurementUnit;
  onApply: (preset: RoomPreset) => void;
}

export function RoomPresetsPanel({ unitSystem, onApply }: RoomPresetsPanelProps) {
  return (
    <div className="pw-room-presets">
      <p className="pw-room-presets-label">Room presets</p>
      <p className="pw-room-presets-hint">Start from a ready-made room shell, then draw walls or drop furniture.</p>
      <ul className="pw-room-presets-list">
        {ROOM_PRESETS.map((preset) => (
          <li key={preset.id}>
            <button
              type="button"
              className="pw-room-preset-btn"
              onClick={() => onApply(preset)}
            >
              <span className="pw-room-preset-name">{preset.name}</span>
              <span className="pw-room-preset-dims">
                {formatDimensionPair(preset.widthMm, preset.heightMm, unitSystem)}
              </span>
              <span className="pw-room-preset-summary">{preset.summary}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
