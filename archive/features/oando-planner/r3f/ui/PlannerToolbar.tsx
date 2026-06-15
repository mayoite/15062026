"use client";

import {
  Undo2,
  Redo2,
  Eye,
  Grid3x3,
  Magnet,
  Orbit,
  Footprints,
  Trash2,
  Copy,
  Download,
  Move,
  RotateCw,
  ShoppingCart,
} from "lucide-react";
import { usePlannerR3FStore, type CameraMode, type TransformMode } from "../usePlannerR3FStore";

function ToolButton({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all
        ${active ? "bg-blue-100 text-blue-600 shadow-sm" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"}
        ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-6 w-px bg-neutral-200" />;
}

const CAMERA_MODES: { mode: CameraMode; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { mode: "orbit", icon: Orbit, label: "3D Orbit" },
  { mode: "top-down", icon: Grid3x3, label: "Top Down" },
  { mode: "walk", icon: Footprints, label: "Walk Mode (WASD)" },
];

const TRANSFORM_MODES: { mode: TransformMode; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { mode: "translate", icon: Move, label: "Move" },
  { mode: "rotate", icon: RotateCw, label: "Rotate" },
];

export function PlannerToolbar({ onExport, onAddToQuote }: { onExport?: () => void; onAddToQuote?: () => void }) {
  const cameraMode = usePlannerR3FStore((s) => s.cameraMode);
  const setCameraMode = usePlannerR3FStore((s) => s.setCameraMode);
  const transformMode = usePlannerR3FStore((s) => s.transformMode);
  const setTransformMode = usePlannerR3FStore((s) => s.setTransformMode);
  const snapEnabled = usePlannerR3FStore((s) => s.snapEnabled);
  const toggleSnap = usePlannerR3FStore((s) => s.toggleSnap);
  const showGrid = usePlannerR3FStore((s) => s.showGrid);
  const toggleGrid = usePlannerR3FStore((s) => s.toggleGrid);
  const showWalls = usePlannerR3FStore((s) => s.showWalls);
  const toggleWalls = usePlannerR3FStore((s) => s.toggleWalls);
  const undo = usePlannerR3FStore((s) => s.undo);
  const redo = usePlannerR3FStore((s) => s.redo);
  const undoStack = usePlannerR3FStore((s) => s.undoStack);
  const redoStack = usePlannerR3FStore((s) => s.redoStack);
  const selectedId = usePlannerR3FStore((s) => s.selectedId);
  const removeItem = usePlannerR3FStore((s) => s.removeItem);
  const duplicateItem = usePlannerR3FStore((s) => s.duplicateItem);

  return (
    <div className="flex items-center gap-0.5 rounded-xl bg-white/95 backdrop-blur-sm border border-neutral-200 px-2 py-1.5 shadow-lg">
      {CAMERA_MODES.map(({ mode, icon, label }) => (
        <ToolButton
          key={mode}
          icon={icon}
          label={label}
          active={cameraMode === mode}
          onClick={() => setCameraMode(mode)}
        />
      ))}

      <Divider />

      {TRANSFORM_MODES.map(({ mode, icon, label }) => (
        <ToolButton
          key={mode}
          icon={icon}
          label={label}
          active={transformMode === mode}
          onClick={() => setTransformMode(mode)}
        />
      ))}

      <Divider />

      <ToolButton icon={Magnet} label="Toggle Snap" active={snapEnabled} onClick={toggleSnap} />
      <ToolButton icon={Grid3x3} label="Toggle Grid" active={showGrid} onClick={toggleGrid} />
      <ToolButton icon={Eye} label="Toggle Walls" active={showWalls} onClick={toggleWalls} />

      <Divider />

      <ToolButton icon={Undo2} label="Undo" onClick={undo} disabled={undoStack.length === 0} />
      <ToolButton icon={Redo2} label="Redo" onClick={redo} disabled={redoStack.length === 0} />

      <Divider />

      <ToolButton
        icon={Copy}
        label="Duplicate"
        onClick={() => selectedId && duplicateItem(selectedId)}
        disabled={!selectedId}
      />
      <ToolButton
        icon={Trash2}
        label="Delete"
        onClick={() => selectedId && removeItem(selectedId)}
        disabled={!selectedId}
      />

      {(onExport || onAddToQuote) && <Divider />}
      {onExport && <ToolButton icon={Download} label="Export BOQ (CSV)" onClick={onExport} />}
      {onAddToQuote && <ToolButton icon={ShoppingCart} label="Add to Quote" onClick={onAddToQuote} />}
    </div>
  );
}
