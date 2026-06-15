"use client";

import { useCallback } from "react";
import type { Editor } from "tldraw";

import { usePlannerWorkspaceStore } from "../store/workspaceStore";

export function CalibrationCapture({ editor }: { editor: Editor | null }) {
  const blueprint = usePlannerWorkspaceStore((s) => s.blueprint);
  const setBlueprint = usePlannerWorkspaceStore((s) => s.setBlueprint);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!editor || !blueprint.calibrating) return;
      e.preventDefault();
      e.stopPropagation();
      const point = editor.screenToPage({ x: e.clientX, y: e.clientY });
      const next = [...blueprint.calibrationPoints, point];
      if (next.length < 2) {
        setBlueprint({ calibrationPoints: next });
        return;
      }
      const [a, b] = next;
      const canvasDist = Math.hypot(b.x - a.x, b.y - a.y);
      if (canvasDist < 1) {
        setBlueprint({ calibrationPoints: [], calibrating: true });
        return;
      }
      setBlueprint({
        calibrationPoints: next,
        calibrating: false,
        mmPerUnit: blueprint.knownDistanceMm / canvasDist,
      });
    },
    [blueprint.calibrating, blueprint.calibrationPoints, blueprint.knownDistanceMm, editor, setBlueprint],
  );

  if (!blueprint.calibrating || !blueprint.dataUrl || !editor) return null;

  const line =
    blueprint.calibrationPoints.length === 2
      ? (() => {
          const a = editor.pageToScreen(blueprint.calibrationPoints[0]);
          const b = editor.pageToScreen(blueprint.calibrationPoints[1]);
          return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
        })()
      : blueprint.calibrationPoints.length === 1
        ? (() => {
            const a = editor.pageToScreen(blueprint.calibrationPoints[0]);
            return { x1: a.x, y1: a.y, x2: a.x, y2: a.y };
          })()
        : null;

  return (
    <>
      {line && (
        <svg className="pointer-events-none absolute inset-0 z-[29]" aria-hidden>
          <line
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="var(--color-primary)"
            strokeWidth={2}
            strokeDasharray="6 4"
          />
          {blueprint.calibrationPoints.map((pt, i) => {
            const s = editor.pageToScreen(pt);
            return <circle key={i} cx={s.x} cy={s.y} r={5} fill="var(--color-accent)" />;
          })}
        </svg>
      )}
      <div
        className="absolute inset-0 z-[30] cursor-crosshair bg-black/10"
        onClick={handleClick}
        role="presentation"
        aria-label="Calibration mode: click two reference points"
      />
    </>
  );
}
