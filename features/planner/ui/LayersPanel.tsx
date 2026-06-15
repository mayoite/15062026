"use client";

import { useSyncExternalStore } from "react";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  Lock,
  LockOpen,
  MousePointer2,
  Pin,
  PinOff,
  ScanSearch,
  X,
} from "lucide-react";
import { createShapeId, type Editor } from "tldraw";

import type { PlannerShapeMeta } from "@/features/planner/shared/types/planner";

import { getMetricLabelForShape, type MeasurementUnit } from "../lib/measurements";

const ROOM_BOUNDARY_SHAPE_ID = createShapeId("room-boundary");

interface LayersPanelProps {
  editor: Editor | null;
  unitSystem: MeasurementUnit;
  onClose: () => void;
  onFitSelection: () => void;
  onAlignSelection: (operation: "left" | "center-horizontal" | "right" | "top" | "center-vertical" | "bottom") => void;
  onDistributeSelection: (operation: "horizontal" | "vertical") => void;
  pinned: boolean;
  onTogglePin: () => void;
  showPinToggle?: boolean;
}

function getShapeMeta(meta: unknown): PlannerShapeMeta {
  return meta && typeof meta === "object" ? (meta as PlannerShapeMeta) : {};
}

function formatShapeMetrics(
  editor: Editor,
  shapeId: ReturnType<typeof createShapeId>,
  shapeType: string,
  unitSystem: MeasurementUnit,
) {
  return getMetricLabelForShape(editor, shapeId, unitSystem) ?? (shapeType === "line" ? "Length unavailable" : "No geometry");
}

function buildLayerEntries(
  editor: Editor | null,
  unitSystem: MeasurementUnit,
) {
  if (!editor) return [];
  return editor
    .getCurrentPageShapesSorted()
    .filter((shape) => {
      const meta = getShapeMeta(shape.meta);
      return shape.id !== ROOM_BOUNDARY_SHAPE_ID && !meta.isRoomDimension;
    })
    .map((shape) => {
      const meta = getShapeMeta(shape.meta);
      return {
        id: shape.id,
        type: shape.type,
        isLocked: !!shape.isLocked,
        isSelected: editor.getSelectedShapeIds().includes(shape.id),
        name:
          typeof meta.text === "string" && meta.text.trim().length > 0
            ? meta.text
            : meta.structureType === "door-opening"
              ? "Door Opening"
              : meta.structureType === "wall-segment"
                ? "Wall Segment"
                : meta.structureType === "room-shell"
                  ? "Room Shell"
                  : shape.type === "image"
                    ? "Placed Image"
                    : shape.type === "geo"
                      ? "Rectangle / Wall"
                      : shape.type === "line"
                        ? "Structural Line"
                        : shape.type === "draw"
                          ? "Freehand Wall"
                          : shape.type,
        metrics: formatShapeMetrics(editor, shape.id, shape.type, unitSystem),
      };
    })
    .reverse();
}

export function LayersPanel({
  editor,
  unitSystem,
  onClose,
  onFitSelection,
  onAlignSelection,
  onDistributeSelection,
  pinned,
  onTogglePin,
  showPinToggle = true,
}: LayersPanelProps) {
  const layerEntries = useSyncExternalStore(
    (onStoreChange) => {
      if (!editor) return () => {};
      const stopDocument = editor.store.listen(onStoreChange, { scope: "document" });
      const stopSession = editor.store.listen(onStoreChange, { scope: "session" });
      return () => {
        stopDocument();
        stopSession();
      };
    },
    () => buildLayerEntries(editor, unitSystem),
    () => [],
  );

  const actionableSelectedIds = layerEntries.filter((e) => e.isSelected).map((e) => e.id);
  const hasSelection = actionableSelectedIds.length > 0;
  const hasLockedSelection = layerEntries.some((e) => e.isSelected && e.isLocked);
  const canAlign = actionableSelectedIds.length >= 2;
  const canDistribute = actionableSelectedIds.length >= 3;
  const unitHint = unitSystem === "mm" ? "Measurements shown in millimeters." : "Measurements shown in feet and inches.";
  const selectionHint = hasSelection
    ? `${actionableSelectedIds.length} selected. Align with 2+, distribute with 3+.`
    : "Select layers to focus, lock, align, or distribute them.";

  const handleSelectShape = (shapeId: ReturnType<typeof createShapeId>) => {
    if (!editor) return;
    editor.select(shapeId);
  };

  const handleToggleShapeLock = (shapeId: ReturnType<typeof createShapeId>) => {
    if (!editor) return;
    editor.toggleLock([shapeId]);
  };

  const handleBringToFront = (shapeId: ReturnType<typeof createShapeId>) => {
    if (!editor) return;
    editor.bringToFront([shapeId]);
    editor.select(shapeId);
  };

  const handleSendToBack = (shapeId: ReturnType<typeof createShapeId>) => {
    if (!editor) return;
    editor.sendToBack([shapeId]);
    editor.select(shapeId);
  };

  const handleToggleSelectionLock = () => {
    if (!editor || actionableSelectedIds.length === 0) return;
    editor.toggleLock(actionableSelectedIds);
  };

  return (
    <div className="flex h-full flex-col bg-transparent">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div data-panel-drag-handle="true" className="border-b border-[color:var(--planner-border-soft)] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--planner-text-muted)]">Layers</span>
            <p className="mt-1 text-[11px] leading-[1.4] text-[color:var(--planner-text-body)]">{selectionHint}</p>
            <p className="mt-0.5 text-[10px] leading-[1.35] text-[color:var(--planner-text-muted)]">{unitHint}</p>
          </div>

          <div className="flex items-center gap-1">
            {showPinToggle ? (
              <button
                type="button"
                onClick={onTogglePin}
                aria-label={pinned ? "Float panel" : "Dock panel"}
                title={pinned ? "Float panel" : "Dock panel"}
                className={`border p-1.5 transition-colors ${
                  pinned
                    ? "border-[color:var(--planner-primary-soft)] bg-[color:var(--planner-primary-soft)] text-[color:var(--planner-primary)]"
                    : "border-[color:var(--planner-border-soft)] text-[color:var(--planner-text-subtle)] hover:bg-[color:var(--planner-primary-soft)] hover:text-[color:var(--planner-primary)]"
                }`}
              >
                {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="border border-transparent p-1.5 text-[color:var(--planner-text-subtle)] hover:text-[color:var(--planner-text-body)] transition-colors"
              aria-label="Close layers panel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Action Buttons ──────────────────────────────────────────────────── */}
      <div className="border-b border-[color:var(--planner-border-soft)] p-3">
        <div className="grid grid-cols-2 gap-2">
          <PanelActionButton
            icon={<MousePointer2 className="h-3.5 w-3.5" aria-hidden="true" />}
            label="Select All"
            onClick={() => editor?.selectAll()}
          />
          <PanelActionButton
            icon={<ScanSearch className="h-3.5 w-3.5" aria-hidden="true" />}
            label="Fit Selection"
            onClick={onFitSelection}
            disabled={!hasSelection}
          />
          <PanelActionButton
            icon={hasLockedSelection ? <LockOpen className="h-3.5 w-3.5" aria-hidden="true" /> : <Lock className="h-3.5 w-3.5" aria-hidden="true" />}
            label={hasLockedSelection ? "Unlock Selection" : "Lock Selection"}
            onClick={handleToggleSelectionLock}
            disabled={!hasSelection}
          />
          {/* Layer count badge */}
          <div
            className="flex h-10 items-center gap-2 border border-[color:var(--planner-border-soft)] bg-[color:var(--planner-panel-strong)] px-3"
            title={`${layerEntries.length} layers`}
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center border border-[color:var(--planner-border-soft)] bg-[color:var(--planner-surface-soft)] text-[10px] font-bold text-[color:var(--planner-primary)]">
              {layerEntries.length}
            </span>
            <span className="truncate text-[11px] font-semibold text-[color:var(--planner-text-subtle)]">Layers</span>
          </div>
        </div>

        {/* Arrange Selection */}
        <div className="mt-3 border border-[color:var(--planner-border-soft)] bg-[color:var(--planner-panel-strong)] px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--planner-text-muted)]">Arrange Selection</p>
            <div className="flex shrink-0 items-center gap-1.5">
              <IconControlButton label="Align Left"              disabled={!canAlign}     onClick={() => onAlignSelection("left")}        glyph={<ArrangeGlyph type="left" />} />
              <IconControlButton label="Align Top"               disabled={!canAlign}     onClick={() => onAlignSelection("top")}         glyph={<ArrangeGlyph type="top" />} />
              <IconControlButton label="Distribute Horizontally" disabled={!canDistribute} onClick={() => onDistributeSelection("horizontal")} glyph={<ArrangeGlyph type="horizontal" />} />
              <IconControlButton label="Distribute Vertically"   disabled={!canDistribute} onClick={() => onDistributeSelection("vertical")}   glyph={<ArrangeGlyph type="vertical" />} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Layer List ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3">
        {layerEntries.length === 0 ? (
          <div className="border border-[color:var(--planner-border-soft)] bg-[color:var(--planner-panel-strong)] px-4 py-5 text-center text-[11px] leading-5 text-[color:var(--planner-text-subtle)]">
            No editable layers yet. Draw walls or place items to build the plan.
          </div>
        ) : (
          <div className="space-y-1.5">
            {layerEntries.map((layer) => (
              <div
                key={layer.id}
                className={`border px-3 py-2.5 transition-colors ${
                  layer.isSelected
                    ? "border-[color:var(--planner-primary-soft)] bg-[color:var(--planner-primary-soft)]/72"
                    : "border-[color:var(--planner-border-soft)] bg-[color:var(--planner-panel-strong)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button type="button" onClick={() => handleSelectShape(layer.id)} className="min-w-0 flex-1 text-left" title={`Select ${layer.name}`}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate text-[13px] font-semibold leading-[1.15] text-[color:var(--planner-text-strong)]">{layer.name}</p>
                      <span className="border border-[color:var(--planner-border-soft)] bg-[color:var(--planner-panel)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--planner-text-muted)]">
                        {layer.type}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-[1.4] text-[color:var(--planner-text-body)]">{layer.metrics}</p>
                  </button>

                  <div className="flex shrink-0 items-center gap-1">
                    <LayerRowIconAction label={layer.isLocked ? "Unlock Layer" : "Lock Layer"} onClick={() => handleToggleShapeLock(layer.id)} active={layer.isLocked}>
                      {layer.isLocked ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
                    </LayerRowIconAction>
                    <LayerRowIconAction label="Bring To Front" onClick={() => handleBringToFront(layer.id)}>
                      <ArrowUpToLine className="h-3.5 w-3.5" />
                    </LayerRowIconAction>
                    <LayerRowIconAction label="Send To Back" onClick={() => handleSendToBack(layer.id)}>
                      <ArrowDownToLine className="h-3.5 w-3.5" />
                    </LayerRowIconAction>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function PanelActionButton({
  icon,
  label,
  onClick,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex h-10 items-center gap-2 border border-[color:var(--planner-border-soft)] bg-[color:var(--planner-panel-strong)] px-3 text-left transition-colors enabled:hover:border-[color:var(--planner-primary)] enabled:hover:text-[color:var(--planner-primary)] disabled:cursor-not-allowed disabled:opacity-35"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-[color:var(--planner-border-soft)] bg-[color:var(--planner-surface-soft)] text-[color:var(--planner-primary)] transition-colors group-enabled:group-hover:border-[color:var(--planner-primary)]">
        {icon}
      </span>
      <span className="truncate text-[11px] font-semibold">{label}</span>
    </button>
  );
}

function IconControlButton({
  label,
  glyph,
  onClick,
  disabled,
}: {
  label: string;
  glyph: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={label}
        aria-label={label}
        className="flex h-9 w-9 items-center justify-center border border-[color:var(--planner-border-soft)] bg-[color:var(--planner-panel)] text-[color:var(--planner-primary)] transition-colors enabled:hover:border-[color:var(--planner-primary)] enabled:hover:bg-[color:var(--planner-primary-soft)] disabled:cursor-not-allowed disabled:opacity-35"
      >
        {glyph}
      </button>
      <span className="pointer-events-none absolute top-[calc(100%+0.35rem)] left-1/2 z-10 -translate-x-1/2 border border-[color:var(--planner-border-soft)] bg-[color:var(--planner-text-strong)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white opacity-0 shadow-theme-panel transition-opacity group-hover:opacity-100 whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

function LayerRowIconAction({
  label,
  onClick,
  children,
  active = false,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        title={label}
        aria-label={label}
        className={`border p-1.5 transition-colors ${
          active
            ? "border-[color:var(--planner-accent-soft)] bg-[color:var(--planner-accent-soft)] text-[color:var(--planner-accent-strong)]"
            : "border-[color:var(--planner-border-soft)] text-[color:var(--planner-text-subtle)] hover:bg-[color:var(--planner-primary-soft)] hover:text-[color:var(--planner-primary)]"
        }`}
      >
        {children}
      </button>
      <span className="pointer-events-none absolute right-0 bottom-[calc(100%+0.35rem)] z-10 border border-[color:var(--planner-border-soft)] bg-[color:var(--planner-text-strong)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white opacity-0 shadow-theme-panel transition-opacity group-hover:opacity-100 whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

function ArrangeGlyph({ type }: { type: "left" | "top" | "horizontal" | "vertical" }) {
  if (type === "left") {
    return (
      <span className="relative h-4 w-4" aria-hidden="true">
        <span className="absolute left-0 top-0 h-4 w-[1.5px] bg-current" />
        <span className="absolute left-[4px] top-[2px] h-[1.5px] w-2.5 bg-current" />
        <span className="absolute left-[4px] top-[6px] h-[1.5px] w-3.5 bg-current" />
        <span className="absolute left-[4px] top-[10px] h-[1.5px] w-2 bg-current" />
      </span>
    );
  }

  if (type === "top") {
    return (
      <span className="relative h-4 w-4" aria-hidden="true">
        <span className="absolute left-0 top-0 h-[1.5px] w-4 bg-current" />
        <span className="absolute left-[2px] top-[4px] h-2.5 w-[1.5px] bg-current" />
        <span className="absolute left-[6px] top-[4px] h-3.5 w-[1.5px] bg-current" />
        <span className="absolute left-[10px] top-[4px] h-2 w-[1.5px] bg-current" />
      </span>
    );
  }

  if (type === "horizontal") {
    return (
      <span className="relative h-4 w-4" aria-hidden="true">
        <span className="absolute left-0 top-[7px] h-[1.5px] w-4 bg-current" />
        <span className="absolute left-[1px] top-[3px] h-2.5 w-[1.5px] bg-current" />
        <span className="absolute left-[7px] top-[1px] h-3.5 w-[1.5px] bg-current" />
        <span className="absolute right-[1px] top-[3px] h-2.5 w-[1.5px] bg-current" />
      </span>
    );
  }

  return (
    <span className="relative h-4 w-4" aria-hidden="true">
      <span className="absolute left-[7px] top-0 h-4 w-[1.5px] bg-current" />
      <span className="absolute left-[3px] top-[1px] h-[1.5px] w-2.5 bg-current" />
      <span className="absolute left-[1px] top-[7px] h-[1.5px] w-3.5 bg-current" />
      <span className="absolute left-[3px] bottom-[1px] h-[1.5px] w-2.5 bg-current" />
    </span>
  );
}
