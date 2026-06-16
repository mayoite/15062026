"use client";

import { getAssetUrls } from "@tldraw/assets/selfHosted";
import dynamic from "next/dynamic";
import type { Editor, TLComponents } from "tldraw";

import type { PlannerStep } from "@/features/planner/shared/types/planner";

import type { CanvasMeasurement } from "../lib/measurements";

interface PlannerCanvasProps {
  currentStep: PlannerStep;
  onMount: (app: Editor) => void;
  isGridVisible: boolean;
  topInsetPx?: number;
  leftInsetPx?: number;
  rightInsetPx?: number;
  gridState: {
    originX: number;
    originY: number;
    zoom: number;
  };
  measurements: CanvasMeasurement[];
}

const CANVAS_COMPONENTS: TLComponents = {
  SharePanel: null,
};

const localAssetUrls = getAssetUrls({ baseUrl: "/tldraw-assets/" });

const TldrawCanvas = dynamic(
  () => import("tldraw").then((module) => module.Tldraw),
  {
    ssr: false,
  },
);

export function PlannerCanvas({
  currentStep,
  onMount,
  isGridVisible,
  topInsetPx = 0,
  leftInsetPx = 0,
  rightInsetPx = 0,
  gridState,
  measurements,
}: PlannerCanvasProps) {
  const minorGrid = Math.max(14, Math.round(24 * gridState.zoom));
  const majorGrid = minorGrid * 5;

  return (
    <div className="absolute z-0" data-planner-step={currentStep} style={{ top: topInsetPx, left: leftInsetPx, right: rightInsetPx, bottom: 0 }}>
      <TldrawCanvas
        onMount={onMount}
        className="absolute inset-0"
        assetUrls={localAssetUrls}
        components={CANVAS_COMPONENTS}
      />

      {isGridVisible ? (
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(148, 163, 184, 0.18) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(148, 163, 184, 0.18) 1px, transparent 1px),
              linear-gradient(to right, rgba(71, 85, 105, 0.22) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(71, 85, 105, 0.22) 1px, transparent 1px)
            `,
            backgroundSize: `${minorGrid}px ${minorGrid}px, ${minorGrid}px ${minorGrid}px, ${majorGrid}px ${majorGrid}px, ${majorGrid}px ${majorGrid}px`,
            backgroundPosition: `${gridState.originX}px ${gridState.originY}px, ${gridState.originX}px ${gridState.originY}px, ${gridState.originX}px ${gridState.originY}px, ${gridState.originX}px ${gridState.originY}px`,
          }}
        />
      ) : null}

      {measurements.map((measurement) => (
        <div
          key={measurement.id}
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${measurement.x}px`,
            top: `${measurement.y}px`,
            transform: `translate(-50%, -50%) rotate(${measurement.rotateDeg ?? 0}deg)`,
          }}
        >
          <div
            className={`min-w-[8rem] border px-3 py-2 shadow-theme-panel backdrop-blur-md ${
              measurement.tone === "selection"
                ? "border-[color:var(--planner-accent-soft)] bg-[color:var(--planner-accent-soft)]/96 text-[color:var(--planner-accent-strong)]"
                : "border-[color:var(--planner-primary-soft)] bg-[color:var(--planner-panel-strong)] text-[color:var(--planner-text-strong)]"
            }`}
          >
            <div className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--planner-text-muted)]">
              {measurement.caption}
            </div>
            <div className="mt-0.5 font-mono text-[0.9rem] font-semibold tracking-[0.03em]">
              {measurement.value}
            </div>
          </div>

        </div>
      ))}
    </div>
  );
}
