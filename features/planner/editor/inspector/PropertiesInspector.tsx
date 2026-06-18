/**
 * PropertiesInspector - Properties panel for selected canvas items.
 */

"use client";

import { useEffect, useState } from "react";
import { MousePointer2 } from "lucide-react";

import type { PlannerStep } from "@/features/planner/editor/plannerStep";
import {
  readInspectorSelection,
  syncSelectionFromEditor,
} from "@/features/planner/editor/shapeInspectorBridge";

function inspectorEmphasis(step: PlannerStep): "muted" | "soft" | "prominent" {
  if (step === "draw") return "muted";
  if (step === "review") return "prominent";
  return "soft";
}

interface PropertiesInspectorProps {
  editor?: null;
  step?: PlannerStep;
}

const INSPECTOR_TIPS = [
  "Choose Select, then click a desk, zone, or wall on the canvas.",
  "Drag items from the library to place furniture.",
  "Use Templates to start from a ready-made layout.",
] as const;

export function PropertiesInspector({ editor, step = "review" }: PropertiesInspectorProps) {
  const emphasis = inspectorEmphasis(step);
  const [data, setData] = useState(() => readInspectorSelection());

  useEffect(() => {
    return syncSelectionFromEditor(editor ?? null, setData);
  }, [editor]);

  return (
    <aside className="pwx-inspector" data-emphasis={emphasis} data-step={step}>
      <div className="pwx-inspector-header">
        <p className="typ-label text-muted">Properties</p>
        <p className="mt-1 text-xs text-soft">{data ? data.label : "Nothing selected"}</p>
      </div>
      {data ? (
        <div className="pwx-empty custom-scrollbar">
          <div className="pwx-tip-list">
            <div className="pwx-tip"><span className="pwx-tip-num">1</span>{data.type}</div>
            <div className="pwx-tip"><span className="pwx-tip-num">2</span>{data.widthMm} mm × {data.heightMm} mm</div>
            <div className="pwx-tip"><span className="pwx-tip-num">3</span>Rotation {data.rotation}°</div>
            <div className="pwx-tip"><span className="pwx-tip-num">4</span>{data.isLocked ? "Locked" : "Editable"}</div>
          </div>
        </div>
      ) : (
        <div className="pwx-empty custom-scrollbar">
          <div className="pwx-empty-card">
            <div className="pwx-empty-icon" aria-hidden>
              <MousePointer2 size={20} />
            </div>
            <h3 className="text-sm font-semibold text-strong">Select an element</h3>
            <p className="mx-auto mt-2 max-w-[220px] text-xs leading-relaxed text-soft">
              Click a desk, zone, wall, or room on the plan to inspect it here.
            </p>
          </div>
          <div className="mt-4">
            <p className="typ-label text-muted">Quick tips</p>
            <ul className="pwx-tip-list">
              {INSPECTOR_TIPS.map((tip, index) => (
                <li key={tip} className="pwx-tip">
                  <span className="pwx-tip-num" aria-hidden>{index + 1}</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </aside>
  );
}
