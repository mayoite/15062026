"use client";

import type { ReactNode } from "react";
import { useFloorplan } from "./context/FloorplanContext";
import { FloorplanCanvas } from "./FloorplanCanvas";
import { FabricCanvasContextMenu } from "./FabricCanvasContextMenu";
import { plannerUnitSystemToMeasurementUnit, formatLength } from "@/features/planner/lib/measurements";
import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";

type FabricCanvasWorkspaceProps = {
  onExport?: () => void;
  leftPanel?: ReactNode;
  leftOpen?: boolean;
  leftCollapsed?: boolean;
};

const FABRIC_TO_MM = 10;

export function FabricCanvasWorkspace({
  onExport: _onExport,
  leftPanel,
  leftOpen = false,
  leftCollapsed = false,
}: FabricCanvasWorkspaceProps) {
  const app = useFloorplan();
  const unitSystem = usePlannerWorkspaceStore((s) => s.unitSystem);
  const measurementUnit = plannerUnitSystemToMeasurementUnit(unitSystem);

  const formatDim = (value: number) => formatLength(Math.round(value * FABRIC_TO_MM), measurementUnit);

  // P7-04: describe canvas state for screen readers.
  const objectCount = app.selections.length > 0
    ? app.selections.length
    : undefined;
  const canvasLabel = objectCount !== undefined
    ? `Floor plan: ${objectCount} object${objectCount !== 1 ? "s" : ""} selected`
    : "Floor plan canvas";

  // P7-04: announce selection changes to aria-live region.
  const selectionAnnouncement = app.selections.length > 0
    ? app.selections.map((s) => String(s.name ?? "Object").split(":")[1] || String(s.name ?? "Object")).join(", ")
    : "";

  return (
    <div className="fcw-workspace">
      {/* P7-04: visually-hidden live region for selection announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {selectionAnnouncement ? `Selected: ${selectionAnnouncement}` : ""}
      </div>
      <FabricCanvasContextMenu />
      <div
        className="fcw-workspace-grid"
        data-left-open={leftOpen || undefined}
        data-left-collapsed={leftCollapsed || undefined}
      >
        {leftPanel}
        {/* P7-04: role="application" marks the canvas as a complex interactive widget. */}
        <section
          className="fcw-stage-card"
          role="application"
          aria-label={canvasLabel}
          data-testid="planner-fabric-ready"
        >
          <FloorplanCanvas />
        </section>
      </div>

      <table className="fcw-status-bar">
        <thead>
          <tr>
            <th>Type</th>
            <th>Name</th>
            <th>Left</th>
            <th>Top</th>
            <th>Rotation</th>
            <th>Width</th>
            <th>Height</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {app.selections.map((selected, i) => {
            const name = String(selected.name ?? "");
            const [type, label] = name.split(":");
            return (
              <tr key={i}>
                <td>{type}</td>
                <td>{label}</td>
                <td>{formatDim(Number(selected.left) || 0)}</td>
                <td>{formatDim(Number(selected.top) || 0)}</td>
                <td>{String(selected.angle ?? "")}°</td>
                <td>{formatDim(Number(selected.width) || 0)}</td>
                <td>{formatDim(Number(selected.height) || 0)}</td>
                <td>
                  {type === "TABLE" && Array.isArray((selected as { _objects?: unknown[] })._objects)
                    ? `${((selected as { _objects: unknown[] })._objects.length ?? 1) - 1} Chairs`
                    : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}