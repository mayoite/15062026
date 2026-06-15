"use client";

import React from "react";
import { Box, FileText, Magnet, MousePointer2, Pin, PinOff, Tag, Settings2, X } from "lucide-react";
import type { BoqItem, PlannerStep } from "@/features/planner/shared/types/planner";
import type { PlannerSelectionDimensions } from "../lib/editorTools";
import { formatMeasurementInputValue, parseMeasurementInput } from "../lib/measurements";

interface InspectorPanelProps {
  boqItems: BoqItem[];
  totalBoq: number;
  currentStep: PlannerStep;
  canContinueFromRoom: boolean;
  roomMetrics: string;
  selectedMetrics: string | null;
  selectionDimensions: PlannerSelectionDimensions | null;
  unitSystem: "mm" | "ft-in";
  onUnitSystemChange: (unit: "mm" | "ft-in") => void;
  isSnapMode: boolean;
  onToggleSnap: () => void;
  onUpdateSelectionDimensions: (next: { widthMm?: number; heightMm?: number | null }) => void;
  onAdvanceBoqFlow: () => void;
  onClose: () => void;
  pinned: boolean;
  onTogglePin: () => void;
  showPinToggle?: boolean;
}

// ── Area helpers ──────────────────────────────────────────────────────────────
function parseRoomDims(metrics: string): { wMm: number; hMm: number } | null {
  const m = /W\s*([\d,]+)\s*mm.*?H\s*([\d,]+)\s*mm/i.exec(metrics);
  if (!m) return null;
  return { wMm: parseInt(m[1].replace(/,/g, ""), 10), hMm: parseInt(m[2].replace(/,/g, ""), 10) };
}

function fmtArea(wMm: number, hMm: number): { sqm: string; sqft: string } {
  const sqm = (wMm * hMm) / 1_000_000;
  const sqft = sqm * 10.7639;
  return {
    sqm: sqm >= 10 ? sqm.toFixed(1) : sqm.toFixed(2),
    sqft: sqft.toFixed(1),
  };
}

/** Row in the shortcuts table */
function ShortcutRow({ name, kbd }: { name: string; kbd: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-[color:var(--planner-border-soft)] last:border-0">
      <span className="pw-ui-xs text-[color:var(--planner-text-body)]">{name}</span>
      <kbd className="border border-[color:var(--planner-border-soft)] bg-[color:var(--planner-panel-strong)] px-2 py-0.5 font-mono pw-ui-2xs text-[color:var(--planner-text-muted)]">
        {kbd}
      </kbd>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function InspectorPanel({
  boqItems,
  totalBoq,
  currentStep,
  canContinueFromRoom,
  roomMetrics,
  selectedMetrics,
  selectionDimensions,
  unitSystem,
  onUnitSystemChange,
  isSnapMode,
  onToggleSnap,
  onUpdateSelectionDimensions,
  onAdvanceBoqFlow,
  onClose,
  pinned,
  onTogglePin,
  showPinToggle = true,
}: InspectorPanelProps) {
  const [tab, setTab] = React.useState<"items" | "settings">("items");
  const selectionInputKey = selectionDimensions
    ? `${selectionDimensions.shapeName}:${selectionDimensions.widthMm}:${selectionDimensions.heightMm ?? ""}:${selectionDimensions.mode}:${unitSystem}`
    : `none:${unitSystem}`;
  const [dimensionInputs, setDimensionInputs] = React.useState({ width: "", height: "" });
  const [trackedSelectionKey, setTrackedSelectionKey] = React.useState(selectionInputKey);
  if (trackedSelectionKey !== selectionInputKey) {
    setTrackedSelectionKey(selectionInputKey);
    setDimensionInputs({
      width: selectionDimensions ? formatMeasurementInputValue(selectionDimensions.widthMm, unitSystem) : "",
      height:
        selectionDimensions && typeof selectionDimensions.heightMm === "number"
          ? formatMeasurementInputValue(selectionDimensions.heightMm, unitSystem)
          : "",
    });
  }
  const widthInput = dimensionInputs.width;
  const heightInput = dimensionInputs.height;
  const setWidthInput = (value: string) => {
    setDimensionInputs((current) => ({ ...current, width: value }));
  };
  const setHeightInput = (value: string) => {
    setDimensionInputs((current) => ({ ...current, height: value }));
  };

  const isRoomStep = currentStep === "room";
  const isCatalogStep = currentStep === "catalog";
  const isMeasureStep = currentStep === "measure";
  const hasBoqData = boqItems.length > 0 || totalBoq > 0;

  const primaryActionLabel = isRoomStep
    ? "Continue to Catalog"
    : isCatalogStep ? "Continue to Measure"
    : isMeasureStep ? "Continue to Review" : "Open BOQ Enquiry";

  const primaryDisabled = isRoomStep || isCatalogStep || isMeasureStep ? !canContinueFromRoom : !hasBoqData;

  const emptyBody = isRoomStep
    ? "Draw the room shell to unlock catalog placement."
    : isCatalogStep ? "Add products from the catalog to start the BOQ."
    : isMeasureStep ? "Use the line tool to measure distances. Select shapes to see dimensions."
    : "Review the measured plan and send the BOQ enquiry.";

  const unitLabel = unitSystem === "ft-in" ? "ft/in" : "mm";
  const widthValueMm = parseMeasurementInput(widthInput, unitSystem);
  const heightValueMm = selectionDimensions?.mode === "box" ? parseMeasurementInput(heightInput, unitSystem) : null;
  const canApply = selectionDimensions
    ? selectionDimensions.mode === "line" ? widthValueMm !== null : widthValueMm !== null && heightValueMm !== null
    : false;

  const dimHint = unitSystem === "ft-in" ? `e.g. 6' 8"` : "e.g. 3600";

  const roomDims = parseRoomDims(roomMetrics);
  const area = roomDims ? fmtArea(roomDims.wMm, roomDims.hMm) : null;

  return (
    <div className="flex h-full flex-col bg-[color:var(--planner-panel)] font-sans">

      {/* Header */}
      <div data-panel-drag-handle="true"
        className="flex h-9 shrink-0 items-center justify-between border-b border-[color:var(--planner-border-soft)] px-3">
        <span className="pw-ui-2xs font-bold uppercase tracking-[0.14em] text-[color:var(--planner-text-muted)]">Inspector</span>
        <div className="flex items-center gap-0.5">
          {showPinToggle && (
            <button type="button" onClick={onTogglePin}
              aria-label={pinned ? "Float panel" : "Dock panel"} title={pinned ? "Float panel" : "Dock panel"}
              className={`flex h-6 w-6 items-center justify-center transition-colors ${pinned ? "text-[color:var(--planner-primary)]" : "text-[color:var(--planner-text-subtle)] hover:text-[color:var(--planner-text-body)]"}`}>
              {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            </button>
          )}
          <button type="button" onClick={onClose} aria-label="Close"
            className="flex h-6 w-6 items-center justify-center text-[color:var(--planner-text-subtle)] hover:text-[color:var(--planner-text-body)] transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs — flat, no rounded */}
      <div className="flex shrink-0 border-b border-[color:var(--planner-border-soft)]">
        {(["items", "settings"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2 pw-ui-2xs font-semibold uppercase tracking-[0.12em] transition-colors border-b-2 ${
              tab === t
                ? "border-[color:var(--planner-primary)] text-[color:var(--planner-primary)]"
                : "border-transparent text-[color:var(--planner-text-subtle)] hover:text-[color:var(--planner-primary)]"
            }`}>
            {t === "items" ? <Tag className="h-3.5 w-3.5" /> : <Settings2 className="h-3.5 w-3.5" />}
            {t === "items" ? `Items (${boqItems.length})` : "Settings"}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">

        {/* ── ITEMS TAB ─────────────────────────────────────────────────────── */}
        {tab === "items" && (
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto divide-y divide-[color:var(--planner-border-soft)]">
              {boqItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center">
                  <MousePointer2 className="h-6 w-6 text-[color:var(--planner-text-subtle)]" />
                  <p className="text-[14px] font-semibold text-[color:var(--planner-text-strong)]">No items yet</p>
                  <p className="pw-ui-xs leading-5 text-[color:var(--planner-text-muted)]">{emptyBody}</p>
                </div>
              ) : (
                boqItems.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 px-3 py-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[color:var(--planner-primary-soft)] text-[color:var(--planner-primary)]">
                      <Box className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-[color:var(--planner-text-strong)]">{item.name}</p>
                      <p className="pw-ui-2xs font-medium uppercase tracking-[0.08em] text-[color:var(--planner-text-muted)]">{item.category}</p>
                      {item.dimensions && (
                        <p className="mt-0.5 font-mono pw-ui-2xs text-[color:var(--planner-text-subtle)]">{item.dimensions}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="shrink-0 border-t border-[color:var(--planner-border-soft)] p-3">
              {hasBoqData && (
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="pw-ui-2xs font-semibold uppercase tracking-[0.14em] text-[color:var(--planner-text-muted)]">BOQ Lines</span>
                  <span className="text-[14px] font-bold text-[color:var(--planner-primary)]">{boqItems.length}</span>
                </div>
              )}
              <button onClick={onAdvanceBoqFlow} disabled={primaryDisabled}
                className="flex w-full items-center justify-center gap-2 bg-[color:var(--planner-primary)] py-2.5 pw-ui-xs font-semibold text-white transition-colors hover:bg-[color:var(--planner-primary-hover)] disabled:bg-[color:var(--planner-border-soft)] disabled:text-[color:var(--planner-text-subtle)]">
                <FileText className="h-4 w-4" /> {primaryActionLabel}
              </button>
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ──────────────────────────────────────────────────── */}
        {tab === "settings" && (
          <div className="divide-y divide-[color:var(--planner-border-soft)]">

            {/* Room Shell — centered, with area */}
            <div className="px-3 py-3 text-center">
              <p className="mb-2 pw-ui-2xs font-semibold uppercase tracking-[0.14em] text-[color:var(--planner-text-muted)]">Room Shell</p>
              <p className="font-mono text-[13px] font-semibold text-[color:var(--planner-text-strong)]">{roomMetrics}</p>
              {area && (
                <div className="mt-1.5 flex items-center justify-center gap-3">
                  <span className="pw-ui-xs font-semibold text-[color:var(--planner-primary)]">{area.sqm} m²</span>
                  <span className="pw-ui-2xs text-[color:var(--planner-text-subtle)]">·</span>
                  <span className="pw-ui-xs text-[color:var(--planner-text-muted)]">{area.sqft} sq ft</span>
                </div>
              )}
            </div>

            {/* Selection Metrics */}
            <div className="px-3 py-3">
              <p className="mb-1.5 pw-ui-2xs font-semibold uppercase tracking-[0.14em] text-[color:var(--planner-text-muted)]">Selection</p>
              <p className="font-mono pw-ui-xs font-semibold text-[color:var(--planner-text-strong)]">
                {selectedMetrics ?? "Select a wall or item"}
              </p>
            </div>

            {/* Inspector Edit — W × H inputs */}
            <div className="px-3 py-3">
              <p className="mb-2 pw-ui-2xs font-semibold uppercase tracking-[0.14em] text-[color:var(--planner-text-muted)]">Edit Size</p>
              {selectionDimensions ? (
                <div className="space-y-2">
                  <p className="pw-ui-xs font-medium text-[color:var(--planner-text-body)]">{selectionDimensions.shapeName}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block pw-ui-2xs font-semibold uppercase tracking-[0.08em] text-[color:var(--planner-text-subtle)] mb-1">
                        {selectionDimensions.mode === "line" ? "Length" : "Width"} ({unitLabel})
                      </label>
                      <input value={widthInput} onChange={(e) => setWidthInput(e.target.value)}
                        placeholder={dimHint}
                        className="w-full border border-[color:var(--planner-border-soft)] bg-[color:var(--planner-panel-strong)] px-2 py-1.5 pw-ui-xs text-[color:var(--planner-text-body)] outline-none transition focus:border-[color:var(--planner-primary)]" />
                    </div>
                    <div>
                      <label className="block pw-ui-2xs font-semibold uppercase tracking-[0.08em] text-[color:var(--planner-text-subtle)] mb-1">
                        {selectionDimensions.mode === "line" ? "Locked" : `Depth (${unitLabel})`}
                      </label>
                      <input
                        value={selectionDimensions.mode === "line" ? "n/a" : heightInput}
                        disabled={selectionDimensions.mode === "line"}
                        onChange={(e) => setHeightInput(e.target.value)}
                        placeholder={dimHint}
                        className="w-full border border-[color:var(--planner-border-soft)] bg-[color:var(--planner-panel-strong)] px-2 py-1.5 pw-ui-xs text-[color:var(--planner-text-body)] outline-none transition focus:border-[color:var(--planner-primary)] disabled:opacity-40" />
                    </div>
                  </div>
                  <button type="button" disabled={!canApply}
                    onClick={() => {
                      if (widthValueMm === null) return;
                      if (selectionDimensions.mode === "box" && heightValueMm === null) return;
                      onUpdateSelectionDimensions({ widthMm: widthValueMm, heightMm: selectionDimensions.mode === "line" ? null : heightValueMm });
                    }}
                    className="w-full bg-[color:var(--planner-primary)] py-2 pw-ui-xs font-semibold text-white transition-colors hover:bg-[color:var(--planner-primary-hover)] disabled:bg-[color:var(--planner-border-soft)] disabled:text-[color:var(--planner-text-subtle)]">
                    Apply Size
                  </button>
                </div>
              ) : (
                <p className="pw-ui-xs text-[color:var(--planner-text-subtle)]">Select a wall or room shape to edit.</p>
              )}
            </div>

            {/* Unit System — flat, rectangular */}
            <div className="flex items-center justify-between px-3 py-3">
              <span className="pw-ui-xs font-semibold text-[color:var(--planner-text-body)]">Units</span>
              <div className="flex border border-[color:var(--planner-border-soft)]">
                {(["mm", "ft-in"] as const).map((u) => (
                  <button key={u} type="button" onClick={() => onUnitSystemChange(u)}
                    className={`px-3 py-1.5 pw-ui-2xs font-semibold uppercase tracking-[0.06em] transition-colors ${
                      unitSystem === u
                        ? "bg-[color:var(--planner-primary)] text-white"
                        : "bg-[color:var(--planner-panel-strong)] text-[color:var(--planner-text-muted)] hover:text-[color:var(--planner-primary)]"
                    }`}>
                    {u === "mm" ? "mm" : "ft/in"}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid Snap — flat toggle */}
            <div className="flex items-center justify-between px-3 py-3">
              <div className="flex items-center gap-2">
                <Magnet className="h-3.5 w-3.5 text-[color:var(--planner-primary)]" />
                <span className="pw-ui-xs font-semibold text-[color:var(--planner-text-body)]">Grid Snap</span>
              </div>
              <button onClick={onToggleSnap}
                className={`relative h-5 w-9 transition-colors ${isSnapMode ? "bg-[color:var(--planner-primary)]" : "bg-[color:var(--planner-border-soft)]"}`}>
                <div className={`absolute top-0.5 h-4 w-4 bg-white transition-all ${isSnapMode ? "left-4" : "left-0.5"}`} />
              </button>
            </div>

            {/* Shortcuts */}
            <div className="px-3 py-3">
              <p className="mb-2 pw-ui-2xs font-semibold uppercase tracking-[0.14em] text-[color:var(--planner-text-muted)]">Shortcuts</p>
              {[["Select", "V"], ["Draw", "D"], ["Eraser", "E"], ["Rectangle", "R"], ["Undo", "Ctrl+Z"]].map(([n, k]) => (
                <ShortcutRow key={n} name={n} kbd={k} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
