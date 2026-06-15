"use client";

import { useState, useCallback } from "react";
import { Camera, Download, Plus, Trash2, RotateCcw } from "lucide-react";
import { usePlannerR3FStore } from "../usePlannerR3FStore";
import { cn } from "@/lib/utils";

export type CameraPreset = {
  id: string;
  name: string;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
};

interface CameraPresetsPanelProps {
  presets: CameraPreset[];
  onPresetsChange: (presets: CameraPreset[]) => void;
  onCapturePanorama: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  allowExport?: boolean;
}

export function CameraPresetsPanel({
  presets,
  onPresetsChange,
  onCapturePanorama,
  canvasRef,
  allowExport = true,
}: CameraPresetsPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const room = usePlannerR3FStore((s) => s.room);
  const applyCameraPreset = usePlannerR3FStore((s) => s.applyCameraPreset);
  const liveCameraState = usePlannerR3FStore((s) => s.liveCameraState);

  const w = room.widthMm / 1000;
  const d = room.depthMm / 1000;

  const handleSavePreset = useCallback(() => {
    const name = `View ${presets.length + 1}`;
    const pos: [number, number, number] = liveCameraState
      ? liveCameraState.position
      : [w / 2 + w * 0.8, w * 0.6, d / 2 + d * 0.8];
    const tgt: [number, number, number] = liveCameraState
      ? liveCameraState.target
      : [w / 2, 0, d / 2];
    const fov = liveCameraState ? liveCameraState.fov : 50;
    const newPreset: CameraPreset = {
      id: `preset-${Date.now()}`,
      name,
      position: pos,
      target: tgt,
      fov,
    };
    onPresetsChange([...presets, newPreset]);
  }, [presets, onPresetsChange, w, d, liveCameraState]);

  const handleRemovePreset = useCallback((id: string) => {
    onPresetsChange(presets.filter((p) => p.id !== id));
  }, [presets, onPresetsChange]);

  const handleRecallPreset = useCallback((preset: CameraPreset) => {
    applyCameraPreset({
      position: preset.position,
      target: preset.target,
      fov: preset.fov,
    });
  }, [applyCameraPreset]);

  const handleCaptureSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const link = document.createElement("a");
      link.download = `camera-snapshot-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // capture failed
    }
  }, [canvasRef]);

  return (
    <div className="absolute top-3 right-3 z-20">
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className={cn(
          "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold shadow-sm transition-colors",
          expanded
            ? "border-[var(--color-primary)] bg-white text-[var(--border-soft)]"
            : "border-neutral-300 bg-white/90 text-neutral-600 hover:bg-white"
        )}
      >
        <Camera className="h-3.5 w-3.5" />
        Camera
      </button>

      {expanded && (
        <div className="mt-1.5 w-56 rounded-lg border border-neutral-200 bg-white shadow-lg">
          <div className="border-b border-neutral-100 px-3 py-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Saved Positions</p>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {presets.length === 0 ? (
              <p className="px-3 py-4 text-center text-[10px] text-neutral-400">
                No saved camera positions yet.
              </p>
            ) : (
              presets.map((p) => (
                <div key={p.id} className="flex items-center gap-2 border-b border-neutral-50 px-3 py-1.5 group">
                  <button
                    type="button"
                    onClick={() => handleRecallPreset(p)}
                    className="flex-1 text-left text-[11px] font-medium text-neutral-700 hover:text-[var(--color-primary)] transition-colors"
                  >
                    {p.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemovePreset(p.id)}
                    className="text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-neutral-100 p-2 space-y-1">
            <button
              type="button"
              onClick={handleSavePreset}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[10px] font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <Plus className="h-3 w-3" />
              Save Current Position
            </button>
            <button
              type="button"
              onClick={handleCaptureSnapshot}
              disabled={!allowExport}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[10px] font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              <Download className="h-3 w-3" />
              Capture Snapshot
            </button>
            <button
              type="button"
              onClick={onCapturePanorama}
              disabled={!allowExport}
              className="flex w-full items-center gap-2 rounded-md bg-[var(--color-primary)] px-2 py-1.5 text-[10px] font-semibold text-white hover:bg-[var(--border-soft)] transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[var(--color-primary)]"
            >
              <RotateCcw className="h-3 w-3" />
              360\u00B0 Panorama Export
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
