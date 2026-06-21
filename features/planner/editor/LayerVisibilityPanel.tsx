"use client";

import { useEffect, useState } from "react";

import {
  Armchair,
  BrickWall,
  Eye,
  EyeOff,
  Layers2,
  RectangleHorizontal,
  Ruler,
  type LucideIcon,
} from "lucide-react";


import {
  getPlannerFabricRuntimeState,
  subscribePlannerFabricRuntimeState,
} from "@/features/planner/canvas-fabric";
import {
  PLANNER_LAYER_CATEGORIES,
  type PlannerLayerCategory,
  usePlannerWorkspaceStore,
} from "../store/workspaceStore";

const LABELS: Record<PlannerLayerCategory, string> = {
  
  walls: "Walls & openings",
  rooms: "Rooms",
  zones: "Zones",
  furniture: "Furniture",
  measurements: "Measurements",
};

const ICONS: Record<PlannerLayerCategory, LucideIcon> = {
  walls: BrickWall,
  rooms: RectangleHorizontal,
  zones: Layers2,
  furniture: Armchair,
  measurements: Ruler,
};

/** Shape type → layer category. Mirrors layerVisibility.ts SHAPE_LAYER map. */
const SHAPE_TYPE_LAYER: Record<string, PlannerLayerCategory> = {
  "planner-wall": "walls",
  "planner-door": "walls",
  "planner-window": "walls",
  "planner-room": "rooms",
  "planner-zone": "zones",
  "planner-furniture": "furniture",
  "planner-measurement": "measurements",
};

/** Pure helper: count canvas shapes per layer category. */
export function countShapesByLayer(
  shapes: ReadonlyArray<{ type: string }>,
): Record<PlannerLayerCategory, number> {
  const counts: Record<PlannerLayerCategory, number> = {
    walls: 0,
    rooms: 0,
    zones: 0,
    furniture: 0,
    measurements: 0,
  };
  for (const shape of shapes) {
    const category = SHAPE_TYPE_LAYER[shape.type];
    if (category) counts[category] += 1;
  }
  return counts;
}

interface LayerVisibilityPanelProps {
  editor?: null;
}

function readLayerCounts() {
  const serializedDraft = getPlannerFabricRuntimeState().serializedDraft;
  if (!serializedDraft) return undefined;
  try {
    const snapshot = JSON.parse(serializedDraft) as { objects?: Array<{ name?: string }> };
    const normalized = (snapshot.objects ?? []).map((object) => {
      const name = String(object.name ?? "");
      if (name.startsWith("WALL:") || name === "CORNER" || name.startsWith("DOOR") || name.startsWith("WINDOW")) {
        return { type: "planner-wall" };
      }
      if (name.startsWith("DRAW:measure")) {
        return { type: "planner-measurement" };
      }
      if (name.startsWith("DRAW:")) {
        return { type: "planner-zone" };
      }
      return { type: "planner-furniture" };
    });
    return countShapesByLayer(normalized);
  } catch {
    return undefined;
  }
}

export function LayerVisibilityPanel({ editor = null }: LayerVisibilityPanelProps) {
  void editor;
  const layerVisible = usePlannerWorkspaceStore((s) => s.layerVisible);
  const toggleLayer = usePlannerWorkspaceStore((s) => s.toggleLayer);
  const [counts, setCounts] = useState(readLayerCounts);

  useEffect(() => {
    const unsubscribe = subscribePlannerFabricRuntimeState(() => {
      setCounts(readLayerCounts());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="pwx-layers">
      <p className="typ-label text-muted">Layers</p>
      <div className="pwx-layers-list">
        {PLANNER_LAYER_CATEGORIES.map((category) => {
          const visible = layerVisible[category];
          const Icon = ICONS[category];
          const count = counts?.[category];

          return (
            <button
              key={category}
              type="button"
              className="pwx-layer-row"
              data-off={!visible}
              aria-pressed={visible}
              aria-label={`${visible ? "Hide" : "Show"} ${LABELS[category]} layer`}
              onClick={() => toggleLayer(category)}
            >
              <span className="pwx-layer-eye" aria-hidden>
                {visible ? <Eye size={14} strokeWidth={2} /> : <EyeOff size={14} strokeWidth={2} />}
              </span>
              <span className="pwx-layer-icon" aria-hidden>
                <Icon size={14} strokeWidth={2} />
              </span>
              <span className="pwx-layer-name">{LABELS[category]}</span>
              {count !== undefined && count > 0 && (
                <span className="pwx-layer-count" aria-label={`${count} elements`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
