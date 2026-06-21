"use client";

import { useFloorplan } from "../context/FloorplanContext";
import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";
import { plannerUnitSystemToMeasurementUnit, formatLength } from "@/features/planner/lib/measurements";

const FABRIC_TO_MM = 10;

export function FabricPropertiesInspector() {
  const app = useFloorplan();
  const unitSystem = usePlannerWorkspaceStore((s) => s.unitSystem);
  const measurementUnit = plannerUnitSystemToMeasurementUnit(unitSystem);

  const formatDim = (value: number) => formatLength(Math.round(value * FABRIC_TO_MM), measurementUnit);

  if (app.selections.length === 0) {
    return null;
  }

  return (
    <div className="pwx-inspector-section mt-4 border-t border-soft pt-4">
      <p className="typ-label text-muted mb-2">Furniture Properties</p>
      <div className="overflow-x-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-soft">
              <th className="py-2 pr-4 typ-label text-muted font-normal whitespace-nowrap">No</th>
              <th className="py-2 pr-4 typ-label text-muted font-normal">Name</th>
              <th className="py-2 pr-4 typ-label text-muted font-normal">Model</th>
              <th className="py-2 typ-label text-muted font-normal whitespace-nowrap">L  &times;   W</th>
            </tr>
          </thead>
          <tbody>
            {app.selections.map((selected, i) => {
              const name = String(selected.name ?? "");
              const [type, label] = name.split(":");
              return (
                <tr key={i} className="border-b border-soft last:border-0 hover:bg-black/5 transition-colors">
                  <td className="py-2 pr-2 typ-body text-sm text-muted">{i + 1}</td>
                  <td className="py-2 pr-2 typ-body text-sm text-strong">{label || "Unknown"}</td>
                  <td className="py-2 pr-2 typ-body text-sm">{type}</td>
                  <td className="py-2 typ-body text-sm whitespace-nowrap text-muted">
                    {formatDim((Number(selected.width) || 0) * Number(selected.scaleX ?? 1))} &times; {formatDim((Number(selected.height) || 0) * Number(selected.scaleY ?? 1))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
