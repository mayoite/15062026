/**
 * PropertiesInspector - Properties panel for selected canvas items.
 */

"use client";

import { useEffect, useState } from "react";
import { Lock, MousePointer2, Trash2, Unlock } from "lucide-react";

import { useFloorplan } from "@/features/planner/canvas-fabric";
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
  const app = useFloorplan();
  const emphasis = inspectorEmphasis(step);
  const [data, setData] = useState(() => readInspectorSelection());

  useEffect(() => {
    return syncSelectionFromEditor(editor ?? null, setData);
  }, [editor]);

  const handleDimensionChange = (field: "widthMm" | "heightMm", value: string) => {
    const num = parseInt(value, 10);
    if (!data || isNaN(num) || num <= 0) return;
    applyInspectorChanges(null, data.id, { [field]: num });
  };

  const handleRotationBlur = (value: string) => {
    if (!data || data.isLocked) return;
    const angle = Number(value);
    if (!isNaN(angle)) {
      app.setObjectRotation(data.id, angle);
    }
  };

  return (
    <section className="pwx-inspector" data-emphasis={emphasis} data-step={step} aria-label="Properties Inspector">
      <div className="pwx-inspector-header">
        <p className="text-sm font-semibold">{data ? data.label : "Nothing selected"}</p>
        {data ? (
          <button
            type="button"
            className="pw-icon-btn text-danger flex items-center gap-1 text-xs"
            onClick={() => app.deleteSelection()}
            title="Delete selected"
          >
            <Trash2 size={14} aria-hidden />
            Delete
          </button>
        ) : null}
      </div>
      {data ? (
        <div className="pwx-inspector-body custom-scrollbar">
          <div className="pwx-inspector-section">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="typ-label text-muted mb-1">Type</p>
                <p className="text-sm text-strong">{data.type}</p>
              </div>
              <button
                type="button"
                className="pw-icon-btn"
                onClick={() => app.setObjectLock(data.id, !data.isLocked)}
                title={data.isLocked ? "Unlock" : "Lock"}
                aria-label={data.isLocked ? "Unlock selection" : "Lock selection"}
              >
                {data.isLocked ? <Lock size={14} aria-hidden /> : <Unlock size={14} aria-hidden />}
              </button>
            </div>
          </div>
          <div className="pwx-inspector-section">
            <p className="typ-label text-muted mb-2">Dimensions</p>
            <div className="pwx-grid-2">
              <div className="pwx-field">
                <span className="pwx-field-label">W</span>
                <input
                  key={`${data.id}-width-${data.widthMm}`}
                  type="number"
                  className="pwx-field-input"
                  defaultValue={String(data.widthMm)}
                  onBlur={(e) => handleDimensionChange("widthMm", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur();
                    }
                  }}
                  min="1"
                  disabled={data.isLocked}
                  aria-label="Width in millimeters"
                />
                <span className="pwx-field-unit">mm</span>
              </div>
              <div className="pwx-field">
                <span className="pwx-field-label">D</span>
                <input
                  key={`${data.id}-depth-${data.heightMm}`}
                  type="number"
                  className="pwx-field-input"
                  defaultValue={String(data.heightMm)}
                  onBlur={(e) => handleDimensionChange("heightMm", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur();
                    }
                  }}
                  min="1"
                  disabled={data.isLocked}
                  aria-label="Depth in millimeters"
                />
                <span className="pwx-field-unit">mm</span>
              </div>
            </div>
          </div>
          <div className="pwx-inspector-section">
            <p className="typ-label text-muted mb-2">Rotation</p>
            <div className="pwx-field">
              <input
                key={`${data.id}-rotation-${Math.round(data.rotation)}`}
                type="number"
                className="pwx-field-input"
                defaultValue={String(Math.round(data.rotation))}
                onBlur={(e) => handleRotationBlur(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
                disabled={data.isLocked}
                aria-label="Rotation in degrees"
              />
              <span className="pwx-field-unit">°</span>
            </div>
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
    </section>
  );
}
