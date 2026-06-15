/**
 * ElementInspector - Right panel for selected element properties
 */

"use client";

import React, { useState, useCallback, type ReactNode } from "react";
import { Lock, Unlock, RotateCw, Trash2, Copy, MousePointer2 } from "lucide-react";

export interface InspectorData {
  id: string;
  type: string;
  label: string;
  widthMm: number;
  heightMm: number;
  rotation: number;
  isLocked: boolean;
  teamId?: string;
  teamName?: string;
  seatCount?: number;
  capacity?: number;
  zoneType?: string;
  color?: string;
}

interface ElementInspectorProps {
  element: InspectorData | null;
  onUpdate?: (id: string, changes: Partial<InspectorData>) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

export function ElementInspector({ element, onUpdate, onDelete, onDuplicate }: ElementInspectorProps) {
  return (
    <aside className="flex min-h-0 w-full flex-1 flex-col overflow-hidden text-strong">
      <InspectorHeader
        element={element}
        onToggleLock={
          element
            ? () => onUpdate?.(element.id, { isLocked: !element.isLocked })
            : undefined
        }
      />

      {!element ? (
        <InspectorEmptyState />
      ) : (
        <div className="flex flex-1 flex-col overflow-y-auto custom-scrollbar">
          <div className="space-y-3 border-b border-soft p-4">
            <SectionLabel>Dimensions</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="W"
                value={element.widthMm}
                unit="mm"
                onChange={(v) => onUpdate?.(element.id, { widthMm: v })}
              />
              <NumberField
                label="H"
                value={element.heightMm}
                unit="mm"
                onChange={(v) => onUpdate?.(element.id, { heightMm: v })}
              />
            </div>
            <div className="flex items-center gap-3">
              <NumberField
                label="Rot."
                value={element.rotation}
                unit="°"
                onChange={(v) => onUpdate?.(element.id, { rotation: v })}
              />
              <button
                onClick={() => onUpdate?.(element.id, { rotation: (element.rotation + 90) % 360 })}
                className="rounded-lg border border-soft bg-[var(--surface-soft)] p-2 text-muted transition-colors hover:border-muted hover:text-strong"
                aria-label="Rotate 90°"
                title="Rotate 90°"
              >
                <RotateCw size={14} />
              </button>
            </div>
          </div>

          {element.seatCount !== undefined && (
            <div className="space-y-3 border-b border-soft p-4">
              <SectionLabel>Seating</SectionLabel>
              <div className="flex gap-1.5 rounded-xl border border-soft bg-[var(--surface-soft)] p-1.5">
                {[1, 2, 4, 6].map((count) => (
                  <button
                    key={count}
                    onClick={() => onUpdate?.(element.id, { seatCount: count })}
                    className={`flex-1 rounded-lg py-1.5 text-[10px] font-semibold transition-colors ${
                      element.seatCount === count
                        ? "bg-[var(--color-primary)] text-[var(--text-inverse)]"
                        : "text-muted hover:bg-panel hover:text-strong"
                    }`}
                  >
                    {count}P
                  </button>
                ))}
              </div>
            </div>
          )}

          {element.zoneType !== undefined && (
            <div className="space-y-3 border-b border-soft p-4">
              <SectionLabel>Zone type</SectionLabel>
              <div className="relative">
                <select
                  value={element.zoneType}
                  onChange={(e) => onUpdate?.(element.id, { zoneType: e.target.value })}
                  className="w-full appearance-none rounded-xl border border-soft bg-[var(--surface-soft)] px-3 py-2.5 text-xs text-strong outline-none focus:border-[var(--color-primary)]"
                  aria-label="Zone type"
                >
                  <option value="collaborative">Collaborative</option>
                  <option value="focus">Focus / deep work</option>
                  <option value="social">Social & kitchen</option>
                  <option value="quiet">Quiet zone</option>
                  <option value="custom">Custom</option>
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                  ▼
                </div>
              </div>
            </div>
          )}

          <div className="mt-auto space-y-2 p-4">
            <button
              onClick={() => onDuplicate?.(element.id)}
              className="btn-outline flex w-full items-center justify-center gap-2 py-2.5 text-xs"
            >
              <Copy size={14} /> Duplicate
            </button>
            <button
              onClick={() => onDelete?.(element.id)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--color-danger)] bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)] py-2.5 text-xs font-semibold text-[color:var(--color-danger)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-danger)_14%,transparent)]"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

function InspectorHeader({
  element,
  onToggleLock,
}: {
  element: InspectorData | null;
  onToggleLock?: () => void;
}) {
  return (
    <div className="pw-panel-header shrink-0 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="typ-label text-muted">Properties</p>
          {element ? (
            <>
              <h3 className="typ-subsection-title mt-1 truncate">
                {element.label || element.type}
              </h3>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-primary)]">
                {element.type}
              </p>
            </>
          ) : (
            <p className="mt-1 text-xs text-soft">Nothing selected</p>
          )}
        </div>
        {element && onToggleLock && (
          <button
            onClick={onToggleLock}
            className={`shrink-0 rounded-lg border p-1.5 transition-colors ${
              element.isLocked
                ? "border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-[var(--color-primary)]"
                : "border-soft bg-[var(--surface-soft)] text-muted hover:text-strong"
            }`}
            aria-label={element.isLocked ? "Unlock element" : "Lock element"}
            title={element.isLocked ? "Unlock" : "Lock"}
          >
            {element.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

function InspectorEmptyState() {
  const tips = [
    "Choose Select, then click a desk, zone, or wall on the canvas.",
    "Drag items from the library to place furniture.",
    "Use Templates to start from a ready-made layout.",
  ];

  return (
    <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
      <div className="rounded-2xl border border-dashed border-soft bg-[var(--surface-soft)] px-4 py-8 text-center">
        <div
          aria-hidden
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-soft bg-panel text-muted"
        >
          <MousePointer2 size={20} />
        </div>
        <h3 className="text-sm font-semibold text-strong">Select an element</h3>
        <p className="mx-auto mt-2 max-w-[220px] text-xs leading-relaxed text-soft">
          Click a desk, zone, wall, or room on the plan to edit dimensions and actions here.
        </p>
      </div>

      <div className="mt-4 space-y-2">
        <p className="typ-label text-muted">Quick tips</p>
        <ul className="space-y-2">
          {tips.map((tip) => (
            <li
              key={tip}
              className="rounded-xl border border-soft bg-panel px-3 py-2.5 text-[11px] leading-relaxed text-muted"
            >
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="typ-label text-muted">{children}</p>;
}

function NumberField({
  label,
  value,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  const [localValue, setLocalValue] = useState(String(value));

  const handleBlur = useCallback(() => {
    const num = Number(localValue);
    if (Number.isFinite(num) && num >= 0) {
      onChange(num);
    } else {
      setLocalValue(String(value));
    }
  }, [localValue, value, onChange]);

  return (
    <div className="flex items-center gap-2 rounded-xl border border-soft bg-[var(--surface-soft)] px-2 py-1.5 transition-colors focus-within:border-[var(--color-primary)]">
      <span className="w-5 text-center text-[10px] font-semibold text-muted">{label}</span>
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => e.key === "Enter" && handleBlur()}
        className="flex-1 border-none bg-transparent text-right text-xs text-strong outline-none"
        aria-label={`${label} in ${unit}`}
      />
      <span className="text-[9px] font-semibold text-muted">{unit}</span>
    </div>
  );
}
