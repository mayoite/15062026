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
import { createShapeId, type Editor } from "@/features/planner/shared/types/legacyEditorStub";

import type { PlannerShapeMeta } from "@/features/planner/shared/types/planner";

import { getMetricLabelForShape, type MeasurementUnit } from "../lib/measurements";

const ROOM_BOUNDARY_SHAPE_ID = createShapeId("room-boundary");

interface LayersPanelProps {
  editor?: Editor | null;
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
    () => buildLayerEntries(editor ?? null, unitSystem),
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
    <div className="pwx-panel-shell pwx-panel-shell--transparent">
      <div data-panel-drag-handle="true" className="pwx-panel-header">
        <div>
          <span className="pwx-panel-title">Layers</span>
          <p className="pwx-panel-subtitle">{selectionHint}</p>
          <p className="pwx-panel-meta">{unitHint}</p>
        </div>

        <div className="pwx-panel-header-actions">
          {showPinToggle ? (
            <button
              type="button"
              onClick={onTogglePin}
              aria-label={pinned ? "Float panel" : "Dock panel"}
              title={pinned ? "Float panel" : "Dock panel"}
              className={`pwx-panel-icon-btn ${pinned ? "pwx-panel-icon-btn--active" : ""}`}
            >
              {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="pwx-panel-icon-btn pwx-panel-icon-btn--ghost"
            aria-label="Close layers panel"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="pwx-panel-section">
        <span className="pwx-panel-section-label">Actions</span>
      </div>

      <div className="pwx-panel-section pwx-panel-section--controls">
        <div className="pwx-panel-toolbar">
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
          <div className="pwx-panel-metric" title={`${layerEntries.length} layers`}>
            <span className="pwx-panel-count">{layerEntries.length}</span>
            <span className="pwx-panel-metric-label">Layers</span>
          </div>
        </div>

        <div className="pwx-panel-arrange-box">
          <div className="pwx-panel-arrange-header">
            <p className="pwx-panel-section-label">Arrange Selection</p>
            <div className="pwx-panel-arrange-actions">
              <IconControlButton label="Align Left" disabled={!canAlign} onClick={() => onAlignSelection("left")} glyph={<ArrangeGlyph type="left" />} />
              <IconControlButton label="Align Top" disabled={!canAlign} onClick={() => onAlignSelection("top")} glyph={<ArrangeGlyph type="top" />} />
              <IconControlButton label="Distribute Horizontally" disabled={!canDistribute} onClick={() => onDistributeSelection("horizontal")} glyph={<ArrangeGlyph type="horizontal" />} />
              <IconControlButton label="Distribute Vertically" disabled={!canDistribute} onClick={() => onDistributeSelection("vertical")} glyph={<ArrangeGlyph type="vertical" />} />
            </div>
          </div>
        </div>
      </div>

      <div className="pwx-panel-content pwx-panel-content--padded">
        {layerEntries.length === 0 ? (
          <div className="pwx-panel-empty">
            No editable layers yet. Draw walls or place items to build the plan.
          </div>
        ) : (
          <div className="pwx-panel-card-list">
            {layerEntries.map((layer) => (
              <div
                key={layer.id}
                className="pwx-panel-card-item"
                data-active={layer.isSelected ? "true" : undefined}
              >
                <button type="button" onClick={() => handleSelectShape(layer.id)} className="pwx-layer-row-button" title={`Select ${layer.name}`}>
                  <div className="pwx-layer-row-heading">
                    <p className="pwx-layer-row-title">{layer.name}</p>
                    <span className="pwx-layer-row-chip">{layer.type}</span>
                  </div>
                  <p className="pwx-layer-row-metrics">{layer.metrics}</p>
                </button>

                <div className="pwx-layer-row-actions">
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
    <button type="button" onClick={onClick} disabled={disabled} className="pwx-panel-action">
      <span className="pwx-panel-action-icon">
        {icon}
      </span>
      <span className="pwx-panel-action-label">{label}</span>
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
    <div className="pwx-panel-arrange-control">
      <button type="button" onClick={onClick} disabled={disabled} title={label} aria-label={label} className="pwx-panel-arrange-btn">
        {glyph}
      </button>
      <span className="pwx-panel-tooltip">
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
    <div className="pwx-layer-row-action-wrap">
      <button
        type="button"
        onClick={onClick}
        title={label}
        aria-label={label}
        className="pwx-layer-row-action"
        data-active={active ? "true" : undefined}
      >
        {children}
      </button>
      <span className="pwx-layer-row-tooltip">
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
