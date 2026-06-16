"use client";

import { Grid3x3 } from "lucide-react";

import {
  isPlannerDevToolsEnabled,
  PLANNER_TOOL_VISIBILITY_LABELS,
  PLANNER_TOOL_VISIBILITY_MODES,
  type PlannerToolVisibilityMode,
} from "@/features/planner/editor/plannerToolVisibility";
import { PLANNER_TLDRAW_TOOLS } from "@/features/planner/tldraw/plannerTldrawRegistration";

/** Bumped when planner tldraw registration changes — visible in dev status bar only. */
const PLANNER_TLDRAW_BUILD_STAMP = "2026-06-16-tools";
import type { PlanMetrics } from "./planMetrics";

function fmtSqm(value: number): string {
  if (value <= 0) return "—";
  return value < 10 ? `${value.toFixed(1)} m²` : `${Math.round(value)} m²`;
}

interface PlannerStatusBarProps {
  metrics: PlanMetrics;
  selectionStatus?: string | null;
  showGrid?: boolean;
  onToggleGrid?: () => void;
  toolVisibilityMode?: PlannerToolVisibilityMode;
  onToolVisibilityModeChange?: (mode: PlannerToolVisibilityMode) => void;
}

export function PlannerStatusBar({
  metrics,
  selectionStatus,
  showGrid = true,
  onToggleGrid,
  toolVisibilityMode = "balanced",
  onToolVisibilityModeChange,
}: PlannerStatusBarProps) {
  const showDevTools = isPlannerDevToolsEnabled() && onToolVisibilityModeChange;

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

      {onToggleGrid ? (
        <button
          type="button"
          className="pw-status-action"
          data-active={showGrid}
          onClick={onToggleGrid}
          aria-pressed={showGrid}
          aria-label={showGrid ? "Hide alignment grid" : "Show alignment grid"}
          title={showGrid ? "Hide grid (G)" : "Show grid (G)"}
        >
          <Grid3x3 size={12} strokeWidth={2} aria-hidden />
          Grid
        </button>
      ) : null}

      {showDevTools ? (
        <span
          className="pw-status-dev-build"
          title="Confirms this browser loaded the local planner tool registration bundle"
        >
          SDK {PLANNER_TLDRAW_BUILD_STAMP} · {PLANNER_TLDRAW_TOOLS.length} tools
        </span>
      ) : null}

      {showDevTools ? (
        <label className="pw-status-dev" htmlFor="planner-tool-visibility-mode">
          <span className="pw-status-dev-label">Tools</span>
          <select
            id="planner-tool-visibility-mode"
            name="planner-tool-visibility-mode"
            className="pw-status-dev-select"
            value={toolVisibilityMode}
            onChange={(event) =>
              onToolVisibilityModeChange(event.target.value as PlannerToolVisibilityMode)
            }
            aria-label="Tool visibility mode (development)"
          >
            {PLANNER_TOOL_VISIBILITY_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {PLANNER_TOOL_VISIBILITY_LABELS[mode]}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}