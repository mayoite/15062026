"use client";

import { useEffect, useState } from "react";

import {
  type PlannerFabricSelection,
  getPlannerFabricRuntimeState,
  subscribePlannerFabricRuntimeState,
} from "@/features/planner/canvas-fabric";

interface LayerManagerPanelProps {
  editor?: null;
  unitSystem: "metric" | "imperial";
}

function readRows() {
  const { selections, serializedDraft } = getPlannerFabricRuntimeState();
  const selectedNames = new Set(
    selections.map((selection: PlannerFabricSelection) => String(selection.name ?? "")),
  );
  if (!serializedDraft) return [];

  try {
    const snapshot = JSON.parse(serializedDraft) as { objects?: Array<Record<string, unknown>> };
    return (snapshot.objects ?? []).map((object, index) => {
      const name = String(object.name ?? `Item ${index + 1}`);
      const parts = name.split(":");
      return {
        id: `${name}-${index}`,
        label: parts.slice(1).join(":") || parts[0],
        type: parts[0],
        selected: selectedNames.has(name),
      };
    });
  } catch {
    return [];
  }
}

export function LayerManagerPanel({ unitSystem }: LayerManagerPanelProps) {
  const [rows, setRows] = useState(readRows);

  useEffect(() => {
    const unsubscribe = subscribePlannerFabricRuntimeState(() => {
      setRows(readRows());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  if (!rows.length) {
    return (
      <div className="pwx-layer-manager pwx-layer-manager--empty">
        <p className="typ-label text-muted">Layer manager</p>
        <p className="text-xs text-soft">
          No canvas objects yet ({unitSystem} units).
        </p>
      </div>
    );
  }

  return (
    <div className="pwx-layer-manager">
      <p className="typ-label text-muted">Layer manager</p>
      <div className="mt-2 space-y-2">
        {rows.slice(0, 8).map((row) => (
          <div key={row.id} className="pwx-layer-row" data-off={!row.selected || undefined}>
            <span className="pwx-layer-name">{row.label}</span>
            <span className="pwx-layer-count">{row.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
