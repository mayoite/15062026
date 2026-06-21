"use client";

import { useMemo } from "react";

import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";

export function CalibrationCapture() {
  const blueprint = usePlannerWorkspaceStore((s) => s.blueprint);
  const setBlueprint = usePlannerWorkspaceStore((s) => s.setBlueprint);

  const markers = useMemo(
    () =>
      (blueprint?.calibrationPoints ?? []).map((point, index) => (
        <div
          key={`${point.x}-${point.y}-${index}`}
          className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[color:var(--color-primary)] shadow"
          style={{ left: point.x, top: point.y }}
        />
      )),
    [blueprint?.calibrationPoints],
  );

  if (!blueprint?.dataUrl || !blueprint.calibrating) return null;

  return (
    <button
      type="button"
      className="absolute inset-0 z-[3] cursor-crosshair bg-transparent text-left"
      aria-label="Capture blueprint calibration points"
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const points = [...blueprint.calibrationPoints, { x, y }].slice(-2);

        if (points.length < 2) {
          setBlueprint({ calibrationPoints: points });
          return;
        }

        const [start, end] = points;
        const pixelDistance = Math.hypot(end.x - start.x, end.y - start.y);
        if (pixelDistance < 3 || blueprint.scale <= 0) {
          setBlueprint({ calibrationPoints: [], mmPerUnit: null });
          return;
        }

        const canvasUnits = pixelDistance / blueprint.scale;
        const mmPerUnit = blueprint.knownDistanceMm / canvasUnits;

        setBlueprint({
          calibrationPoints: points,
          mmPerUnit: Number.isFinite(mmPerUnit) && mmPerUnit > 0 ? mmPerUnit : null,
          calibrating: false,
        });
      }}
    >
      {markers}
    </button>
  );
}
