"use client";

import type { PlanMetrics } from "./planMetrics";

function fmtSqm(value: number): string {
  if (value <= 0) return "—";
  return value < 10 ? `${value.toFixed(1)} m²` : `${Math.round(value)} m²`;
}

interface PlannerStatusBarProps {
  metrics: PlanMetrics;
  selectionStatus?: string | null;
}

export function PlannerStatusBar({ metrics, selectionStatus }: PlannerStatusBarProps) {
  return (
    <div className="pw-status-bar" role="status" aria-label="Plan metrics" aria-live="polite">
      {selectionStatus ? (
        <span className="pw-status-selection">
          Selected <strong>{selectionStatus}</strong>
        </span>
      ) : null}
      <span>{metrics.shapeCount} objects</span>
      <span>{metrics.wallCount} walls</span>
      <span>{metrics.furnitureCount} furniture</span>
      <span>Rooms {fmtSqm(metrics.roomAreaSqm)}</span>
      <span>Zones {fmtSqm(metrics.zoneAreaSqm)}</span>
      <span>
        Floor <strong>{fmtSqm(metrics.totalFloorAreaSqm)}</strong>
        {metrics.calibrated ? " (calibrated)" : ""}
      </span>
    </div>
  );
}
