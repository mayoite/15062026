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

  return (
    <div className="fcw-workspace" aria-label="Fabric canvas workspace">
      <FabricCanvasContextMenu />
      <div
        className="fcw-workspace-grid"
        data-left-open={leftOpen || undefined}
        data-left-collapsed={leftCollapsed || undefined}
      >
        {leftPanel}
        <section className="fcw-stage-card">
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