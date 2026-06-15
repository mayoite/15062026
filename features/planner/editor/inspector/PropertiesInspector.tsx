/**
 * PropertiesInspector - Properties panel for selected canvas items.
 *
 * Identity header (category icon + product name), position, mm dimensions,
 * rotation stepper, seat count, zone type, finish, and z-order / lock /
 * duplicate / delete actions. All chrome is FOCSS-tokenized via pwx-* classes.
 */

"use client";

import React, { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  BrickWall,
  Armchair,
  Copy,
  DoorOpen,
  Layers2,
  Lock,
  MousePointer2,
  PanelTop,
  RectangleHorizontal,
  RotateCcw,
  RotateCw,
  Ruler,
  Trash2,
  Unlock,
  type LucideIcon,
} from "lucide-react";
import type { Editor, TLShapeId } from "tldraw";
import {
  applyInspectorChanges,
  shapeToInspectorData,
} from "@/features/planner/editor/shapeInspectorBridge";
import type { PlannerStep } from "@/features/planner/editor/plannerStep";

function inspectorEmphasis(step: PlannerStep): "muted" | "soft" | "prominent" {
  if (step === "draw") return "muted";
  if (step === "review") return "prominent";
  return "soft";
}

// --- Types ---

export interface PropertiesInspectorData {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  widthMm: number;
  heightMm: number;
  rotation: number;
  isLocked: boolean;
  isCatalog: boolean;
  finish?: string;
  seatCount?: number;
  zoneType?: string;
}

interface PropertiesInspectorProps {
  editor: Editor | null;
  step?: PlannerStep;
}

type EditorShapeUpdate = Parameters<Editor["updateShape"]>[0];

const FINISH_VARIANTS = [
  { id: "oak", label: "Oak", color: "var(--finish-oak)" },
  { id: "walnut", label: "Walnut", color: "var(--finish-walnut)" },
  { id: "white", label: "White", color: "var(--finish-white)" },
  { id: "black", label: "Black", color: "var(--finish-black)" },
  { id: "natural", label: "Natural", color: "var(--finish-natural)" },
] as const;

const INSPECTOR_TIPS = [
  "Choose Select, then click a desk, zone, or wall on the canvas.",
  "Drag items from the library to place furniture.",
  "Use Templates to start from a ready-made layout.",
] as const;

/** Category icon per shape type — mirrors the tool rail icon language. */
const TYPE_ICONS: Record<string, LucideIcon> = {
  "planner-furniture": Armchair,
  "planner-room": RectangleHorizontal,
  "planner-zone": Layers2,
  "planner-wall": BrickWall,
  "planner-door": DoorOpen,
  "planner-window": PanelTop,
  "planner-measurement": Ruler,
};

function getSelectedProperties(editor: Editor): PropertiesInspectorData | null {
  const ids = editor.getSelectedShapeIds();
  if (ids.length !== 1) return null;

  const shape = editor.getShape(ids[0]);
  if (!shape) return null;

  const props = shape.props as Record<string, unknown>;
  const isCatalog = typeof props.catalogId === "string" && props.catalogId.length > 0;
  const finish = typeof props.finish === "string" ? props.finish : undefined;
  const bridgeData = shapeToInspectorData(shape);
  const label =
    typeof props.productName === "string"
      ? props.productName
      : typeof props.label === "string"
        ? props.label
        : shape.type;

  return {
    id: shape.id,
    type: shape.type,
    label,
    x: Math.round(shape.x),
    y: Math.round(shape.y),
    widthMm: bridgeData?.widthMm ?? 120,
    heightMm: bridgeData?.heightMm ?? 80,
    rotation: Math.round((shape.rotation * 180) / Math.PI) % 360,
    isLocked: shape.isLocked,
    isCatalog,
    finish,
    seatCount: bridgeData?.seatCount,
    zoneType: bridgeData?.zoneType,
  };
}

function getSelectedShape(editor: Editor, id: string | null) {
  if (!id) return null;
  return editor.getShape(id as TLShapeId);
}

// --- Component ---

export function PropertiesInspector({ editor, step = "review" }: PropertiesInspectorProps) {
  const emphasis = inspectorEmphasis(step);
  const [selectionVersion, setSelectionVersion] = useState(0);

  useEffect(() => {
    if (!editor) return;
    const cleanup = editor.store.listen(() => {
      setSelectionVersion((current) => current + 1);
    });
    return () => {
      cleanup();
    };
  }, [editor]);

  const data = editor ? getSelectedProperties(editor) : null;

  const handlePositionChange = useCallback(
    (field: "x" | "y", value: number) => {
      if (!editor || !data) return;
      const shape = getSelectedShape(editor, data.id);
      if (!shape) return;
      editor.updateShape({ id: shape.id, type: shape.type, [field]: value } as EditorShapeUpdate);
    },
    [editor, data],
  );

  const handleDimensionChange = useCallback(
    (field: "widthMm" | "heightMm", value: number) => {
      if (!editor || !data) return;
      applyInspectorChanges(editor, data.id, { [field]: value });
    },
    [editor, data],
  );

  const handleRotationChange = useCallback(
    (degrees: number) => {
      if (!editor || !data) return;
      const shape = getSelectedShape(editor, data.id);
      if (!shape) return;
      const clamped = ((degrees % 360) + 360) % 360;
      const radians = (clamped * Math.PI) / 180;
      editor.updateShape({ id: shape.id, type: shape.type, rotation: radians } as EditorShapeUpdate);
    },
    [editor, data],
  );

  const handleFinishChange = useCallback(
    (finish: string) => {
      if (!editor || !data) return;
      const shape = getSelectedShape(editor, data.id);
      if (!shape) return;
      editor.updateShape({
        id: shape.id,
        type: shape.type,
        props: { ...(shape.props as Record<string, unknown>), finish },
      } as EditorShapeUpdate);
    },
    [editor, data],
  );

  const handleDuplicate = useCallback(() => {
    if (!editor || !data) return;
    editor.duplicateShapes([data.id as TLShapeId], { x: 40, y: 40 });
  }, [editor, data]);

  const handleDelete = useCallback(() => {
    if (!editor || !data) return;
    editor.deleteShape(data.id as TLShapeId);
  }, [editor, data]);

  const handleBringToFront = useCallback(() => {
    if (!editor || !data) return;
    editor.select(data.id as TLShapeId);
    editor.bringToFront([data.id as TLShapeId]);
  }, [editor, data]);

  const handleSendToBack = useCallback(() => {
    if (!editor || !data) return;
    editor.select(data.id as TLShapeId);
    editor.sendToBack([data.id as TLShapeId]);
  }, [editor, data]);

  const handleToggleLock = useCallback(() => {
    if (!editor || !data) return;
    applyInspectorChanges(editor, data.id, { isLocked: !data.isLocked });
  }, [editor, data]);

  const handleSeatCountChange = useCallback(
    (seatCount: number) => {
      if (!editor || !data) return;
      applyInspectorChanges(editor, data.id, { seatCount });
    },
    [editor, data],
  );

  const handleZoneTypeChange = useCallback(
    (zoneType: string) => {
      if (!editor || !data) return;
      applyInspectorChanges(editor, data.id, { zoneType });
    },
    [editor, data],
  );

  if (!data) {
    return (
      <aside className="pwx-inspector" data-emphasis={emphasis} data-step={step}>
        <div className="pwx-inspector-header">
          <p className="typ-label text-muted">Properties</p>
          <p className="mt-1 text-xs text-soft">Nothing selected</p>
        </div>
        <div className="pwx-empty custom-scrollbar">
          <div className="pwx-empty-card">
            <div className="pwx-empty-icon" aria-hidden>
              <MousePointer2 size={20} />
            </div>
            <h3 className="text-sm font-semibold text-strong">Select an element</h3>
            <p className="mx-auto mt-2 max-w-[220px] text-xs leading-relaxed text-soft">
              Click a desk, zone, wall, or room on the plan to edit dimensions and actions here.
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
      </aside>
    );
  }

  const isFurniture = data.type === "planner-furniture";
  const dimensionsReadonly = data.isCatalog;
  const fieldKeyPrefix = `${data.id}-${selectionVersion}`;
  const TypeIcon = TYPE_ICONS[data.type] ?? RectangleHorizontal;

  return (
    <aside className="pwx-inspector" data-emphasis={emphasis} data-step={step}>
      <div className="pwx-inspector-header">
        <div className="pwx-inspector-id">
          <span className="pwx-inspector-icon" aria-hidden>
            <TypeIcon size={17} strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h3 className="pwx-inspector-name" title={data.label}>{data.label}</h3>
            <span className="pwx-inspector-kind">{data.type.replace("planner-", "")}</span>
          </div>
        </div>
      </div>

      <div className="pwx-inspector-body custom-scrollbar">
        <div className="pwx-inspector-section">
          <SectionLabel>Position</SectionLabel>
          <div className="pwx-grid-2">
            <NumberField
              key={`${fieldKeyPrefix}-x-${data.x}`}
              label="X"
              value={data.x}
              unit="cm"
              step={1}
              onChange={(v) => handlePositionChange("x", v)}
            />
            <NumberField
              key={`${fieldKeyPrefix}-y-${data.y}`}
              label="Y"
              value={data.y}
              unit="cm"
              step={1}
              onChange={(v) => handlePositionChange("y", v)}
            />
          </div>
        </div>

        <div className="pwx-inspector-section">
          <SectionLabel>Dimensions</SectionLabel>
          <div className="pwx-grid-2">
            <NumberField
              key={`${fieldKeyPrefix}-w-${data.widthMm}`}
              label="W"
              value={data.widthMm}
              unit="mm"
              step={10}
              readOnly={dimensionsReadonly}
              onChange={(v) => handleDimensionChange("widthMm", v)}
            />
            <NumberField
              key={`${fieldKeyPrefix}-h-${data.heightMm}`}
              label="D"
              value={data.heightMm}
              unit="mm"
              step={10}
              readOnly={dimensionsReadonly}
              onChange={(v) => handleDimensionChange("heightMm", v)}
            />
          </div>
          {dimensionsReadonly && (
            <p className="mt-2 text-[10px] italic text-soft">Catalog item — dimensions locked</p>
          )}
        </div>

        <div className="pwx-inspector-section">
          <SectionLabel>Rotation</SectionLabel>
          <div className="flex items-center gap-2">
            <NumberField
              key={`${fieldKeyPrefix}-r-${data.rotation}`}
              label="°"
              value={data.rotation}
              unit="deg"
              step={1}
              min={0}
              max={359}
              onChange={handleRotationChange}
            />
            <div className="pwx-stepper" role="group" aria-label="Rotate in 90° steps">
              <button
                type="button"
                className="pwx-stepper-btn"
                onClick={() => handleRotationChange((data.rotation + 270) % 360)}
                aria-label="Rotate 90° counter-clockwise"
                title="Rotate -90°"
              >
                <RotateCcw size={13} aria-hidden />
              </button>
              <button
                type="button"
                className="pwx-stepper-btn"
                onClick={() => handleRotationChange((data.rotation + 90) % 360)}
                aria-label="Rotate 90° clockwise"
                title="Rotate +90°"
              >
                <RotateCw size={13} aria-hidden />
              </button>
            </div>
            <RotationIndicator degrees={data.rotation} />
          </div>
        </div>

        {data.seatCount !== undefined && (
          <div className="pwx-inspector-section">
            <SectionLabel>Seating</SectionLabel>
            <div className="pwx-choice-row" role="group" aria-label="Seat count">
              {[1, 2, 4, 6].map((count) => (
                <button
                  key={count}
                  type="button"
                  className="pwx-choice"
                  data-active={data.seatCount === count}
                  aria-pressed={data.seatCount === count}
                  onClick={() => handleSeatCountChange(count)}
                >
                  {count}P
                </button>
              ))}
            </div>
          </div>
        )}

        {data.zoneType !== undefined && (
          <div className="pwx-inspector-section">
            <SectionLabel>Zone type</SectionLabel>
            <div className="pwx-select-wrap">
              <select
                value={data.zoneType}
                onChange={(e) => handleZoneTypeChange(e.target.value)}
                className="pwx-select"
                aria-label="Zone type"
              >
                <option value="collaborative">Collaborative</option>
                <option value="focus">Focus / deep work</option>
                <option value="social">Social & kitchen</option>
                <option value="quiet">Quiet zone</option>
                <option value="custom">Custom</option>
              </select>
              <span className="pwx-select-caret" aria-hidden>▾</span>
            </div>
          </div>
        )}

        {isFurniture && (
          <div className="pwx-inspector-section">
            <SectionLabel>Finish</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {FINISH_VARIANTS.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  className="pwx-swatch"
                  data-active={data.finish === variant.id}
                  style={{ backgroundColor: variant.color }}
                  title={variant.label}
                  aria-label={`Finish: ${variant.label}`}
                  aria-pressed={data.finish === variant.id}
                  onClick={() => handleFinishChange(variant.id)}
                >
                  {data.finish === variant.id && (
                    <span className="pwx-swatch-check" aria-hidden>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pwx-inspector-section pwx-inspector-section--actions">
          <SectionLabel>Actions</SectionLabel>
          <div className="pwx-action-row">
            <button
              type="button"
              className="pwx-action-btn"
              onClick={handleBringToFront}
              title="Bring to front"
            >
              <ArrowUpToLine size={14} aria-hidden /> Front
            </button>
            <button
              type="button"
              className="pwx-action-btn"
              onClick={handleSendToBack}
              title="Send to back"
            >
              <ArrowDownToLine size={14} aria-hidden /> Back
            </button>
            <button
              type="button"
              className="pwx-action-btn"
              onClick={handleDuplicate}
              title="Duplicate element"
            >
              <Copy size={14} aria-hidden /> Copy
            </button>
            <button
              type="button"
              className="pwx-action-btn"
              data-active={data.isLocked}
              aria-pressed={data.isLocked}
              onClick={handleToggleLock}
              title={data.isLocked ? "Unlock element" : "Lock element"}
            >
              {data.isLocked ? <Lock size={14} aria-hidden /> : <Unlock size={14} aria-hidden />}
              {data.isLocked ? "Locked" : "Lock"}
            </button>
          </div>
          <button type="button" className="pwx-delete-btn" onClick={handleDelete}>
            <Trash2 size={14} aria-hidden /> Delete
          </button>
        </div>
      </div>
    </aside>
  );
}

// --- Subcomponents ---

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="typ-label mb-2.5 text-muted">{children}</p>;
}

function NumberField({
  label,
  value,
  unit,
  step = 1,
  min,
  max,
  readOnly = false,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  step?: number;
  min?: number;
  max?: number;
  readOnly?: boolean;
  onChange: (value: number) => void;
}) {
  const [localValue, setLocalValue] = useState(String(value));

  const commit = useCallback(() => {
    const num = Number(localValue);
    if (!Number.isFinite(num)) {
      setLocalValue(String(value));
      return;
    }
    let clamped = num;
    if (min !== undefined) clamped = Math.max(min, clamped);
    if (max !== undefined) clamped = Math.min(max, clamped);
    onChange(clamped);
  }, [localValue, value, min, max, onChange]);

  return (
    <div className="pwx-field" data-readonly={readOnly}>
      <span className="pwx-field-label" aria-hidden>{label}</span>
      <input
        type="text"
        inputMode="numeric"
        className="pwx-field-input"
        value={localValue}
        readOnly={readOnly}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (!readOnly && e.key === "ArrowUp") {
            e.preventDefault();
            onChange(value + step);
          }
          if (!readOnly && e.key === "ArrowDown") {
            e.preventDefault();
            onChange(value - step);
          }
        }}
        aria-label={`${label} in ${unit}`}
      />
      <span className="pwx-field-unit">{unit}</span>
    </div>
  );
}

function RotationIndicator({ degrees }: { degrees: number }) {
  const rad = (degrees * Math.PI) / 180;
  const size = 32;
  const cx = size / 2;
  const cy = size / 2;
  const r = 12;
  const nx = cx + r * Math.cos(rad - Math.PI / 2);
  const ny = cy + r * Math.sin(rad - Math.PI / 2);

  return (
    <div
      className="shrink-0 rounded-full border border-soft bg-[var(--surface-soft)]"
      style={{ width: size, height: size }}
      title={`${degrees}°`}
      aria-label={`Rotation: ${degrees} degrees`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-soft)" strokeWidth={1} />
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke="var(--color-primary)"
          strokeWidth={2}
          strokeLinecap="round"
        />
        <circle cx={nx} cy={ny} r={2.5} fill="var(--color-primary)" />
      </svg>
    </div>
  );
}
