"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { usePlannerR3FStore, type RoomPreset } from "../usePlannerR3FStore";

const PRESETS: {
  id: RoomPreset;
  label: string;
  desc: string;
  dims: string;
  svg: string;
}[] = [
  {
    id: "rectangle",
    label: "Rectangle",
    desc: "Standard rectangular room",
    dims: "6m × 5m",
    svg: "M4 4h32v24H4z",
  },
  {
    id: "l-shape",
    label: "Large Room",
    desc: "Larger rectangular layout",
    dims: "8m × 6m",
    svg: "M4 4h32v24H4z",
  },
  {
    id: "u-shape",
    label: "Conference",
    desc: "Conference room sized",
    dims: "10m × 7m",
    svg: "M4 4h32v28H4z",
  },
  {
    id: "open-plan",
    label: "Open Plan",
    desc: "Large open workspace",
    dims: "12m × 10m",
    svg: "M2 2h36v32H2z",
  },
];

function PresetCard({
  preset,
  selected,
  onSelect,
}: {
  preset: (typeof PRESETS)[0];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all hover:shadow-md ${
        selected
          ? "border-blue-500 bg-blue-50 shadow-sm"
          : "border-neutral-200 bg-white hover:border-blue-300"
      }`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-neutral-100">
        <svg viewBox="0 0 40 36" className="h-10 w-10" aria-hidden="true">
          <path
            d={preset.svg}
            fill="none"
            stroke={selected ? "var(--color-primary)" : "var(--border-soft)"}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-[13px] font-semibold text-neutral-800">{preset.label}</p>
        <p className="text-[11px] text-neutral-500">{preset.desc}</p>
        <p className="mt-0.5 text-[10px] font-medium text-blue-600">{preset.dims}</p>
      </div>
    </button>
  );
}

export function RoomPresetsModal() {
  const showRoomPresets = usePlannerR3FStore((s) => s.showRoomPresets);
  const applyRoomPreset = usePlannerR3FStore((s) => s.applyRoomPreset);
  const setShowRoomPresets = usePlannerR3FStore((s) => s.setShowRoomPresets);
  const [selected, setSelected] = useState<RoomPreset>("rectangle");
  const [customW, setCustomW] = useState("6000");
  const [customD, setCustomD] = useState("5000");
  const [showCustom, setShowCustom] = useState(false);

  if (!showRoomPresets) return null;

  const handleApply = () => {
    if (showCustom) {
      const w = parseInt(customW, 10);
      const d = parseInt(customD, 10);
      if (!isNaN(w) && !isNaN(d) && w > 0 && d > 0) {
        applyRoomPreset("custom", w, d);
      }
    } else {
      applyRoomPreset(selected);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl mx-4">
        <button
          type="button"
          onClick={() => setShowRoomPresets(false)}
          className="absolute right-4 top-4 rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5">
          <h2 className="text-lg font-bold text-neutral-900">Choose Room Shape</h2>
          <p className="text-[13px] text-neutral-500 mt-1">
            Select a preset or enter custom dimensions to get started.
          </p>
        </div>

        {!showCustom ? (
          <>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {PRESETS.map((p) => (
                <PresetCard
                  key={p.id}
                  preset={p}
                  selected={selected === p.id}
                  onSelect={() => setSelected(p.id)}
                />
              ))}
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowCustom(true)}
                className="text-[12px] font-medium text-blue-600 hover:text-blue-700 transition"
              >
                Custom dimensions...
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRoomPresets(false)}
                  className="rounded-lg border border-neutral-200 px-4 py-2 text-[12px] font-medium text-neutral-600 hover:bg-neutral-50 transition"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-[12px] font-semibold text-white hover:bg-blue-500 transition"
                >
                  Apply
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3 mb-5">
              <div className="flex items-center gap-3">
                <label className="w-20 text-[12px] font-medium text-neutral-600">Width</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={customW}
                    onChange={(e) => setCustomW(e.target.value)}
                    className="w-28 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-[13px] text-neutral-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  />
                  <span className="text-[11px] text-neutral-400">mm</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="w-20 text-[12px] font-medium text-neutral-600">Depth</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={customD}
                    onChange={(e) => setCustomD(e.target.value)}
                    className="w-28 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-[13px] text-neutral-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  />
                  <span className="text-[11px] text-neutral-400">mm</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowCustom(false)}
                className="text-[12px] font-medium text-neutral-500 hover:text-neutral-700 transition"
              >
                &larr; Back to presets
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRoomPresets(false)}
                  className="rounded-lg border border-neutral-200 px-4 py-2 text-[12px] font-medium text-neutral-600 hover:bg-neutral-50 transition"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-[12px] font-semibold text-white hover:bg-blue-500 transition"
                >
                  Apply
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
