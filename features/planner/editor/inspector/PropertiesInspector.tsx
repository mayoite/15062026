/**
 * PropertiesInspector - Properties panel for selected canvas items.
 */

"use client";

import { useEffect, useState } from "react";
import { MousePointer2 } from "lucide-react";

import type { PlannerStep } from "@/features/planner/editor/plannerStep";
import {
  applyInspectorChanges,
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

  const handleDimensionChange = (field: "widthMm" | "heightMm", value: string) => {
    const num = parseInt(value, 10);
    if (!data || isNaN(num) || num <= 0) return;
    const changes = { [field]: num };
    applyInspectorChanges(null, data.id, changes);
  };

  return (
    <aside className="pwx-inspector" data-emphasis={emphasis} data-step={step}>
      <div className="pwx-inspector-header">
        <p className="typ-label text-muted">Properties</p>
        <p className="mt-1 text-xs text-soft">{data ? data.label : "Nothing selected"}</p>
      </div>
      {data ? (
        <div className="pwx-inspector-body custom-scrollbar">
          <div className="pwx-inspector-section">
            <p className="typ-label text-muted mb-2">Type</p>
            <p className="text-sm text-strong">{data.type}</p>
          </div>
          <div className="pwx-inspector-section">
            <p className="typ-label text-muted mb-2">Dimensions</p>
            <div className="pwx-grid-2">
              <div className="pwx-field">
                <span className="pwx-field-label">W</span>
                <input
                  type="number"
                  className="pwx-field-input"
                  defaultValue={data.widthMm}
                  onBlur={(e) => handleDimensionChange("widthMm", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur();
                    }
                  }}
                  min="1"
                  aria-label="Width in millimeters"
                />
                <span className="pwx-field-unit">mm</span>
              </div>
              <div className="pwx-field">
                <span className="pwx-field-label">H</span>
                <input
                  type="number"
                  className="pwx-field-input"
                  defaultValue={data.heightMm}
                  onBlur={(e) => handleDimensionChange("heightMm", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur();
                    }
                  }}
                  min="1"
                  aria-label="Height in millimeters"
                />
                <span className="pwx-field-unit">mm</span>
              </div>
            </div>
          </div>
          <div className="pwx-inspector-section">
            <p className="typ-label text-muted mb-2">Rotation</p>
            <p className="text-sm text-strong">{data.rotation}°</p>
          </div>
          <div className="pwx-inspector-section">
            <p className="typ-label text-muted mb-2">Status</p>
            <p className="text-sm text-strong">{data.isLocked ? "Locked" : "Editable"}</p>
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
