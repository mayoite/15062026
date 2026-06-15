"use client";

import {
  Move,
  RotateCw,
  Magnet,
  Grid3x3,
  Eye,
  Undo2,
  Redo2,
  Copy,
  Trash2,
  Orbit,
  ArrowDown,
  Footprints,
  Wand2,
  Grip,
  AlignStartVertical,
} from "lucide-react";
import { usePlannerR3FStore, type CameraMode, type TransformMode } from "../usePlannerR3FStore";

function ToolBtn({
  icon: Icon,
  label,
  shortcut,
  active,
  disabled,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const tip = shortcut ? `${label} (${shortcut})` : label;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={tip}
      aria-label={label}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-all
        ${active ? "bg-blue-100 text-blue-600 shadow-sm" : "text-neutral-500 hover:bg-neutral-200/60 hover:text-neutral-700"}
        ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function Sep() {
  return <div className="mx-1.5 h-5 w-px bg-neutral-300" />;
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mr-0.5 text-[9px] font-bold uppercase tracking-wider text-neutral-400 select-none">
      {children}
    </span>
  );
}

const CAMERA_MODES: { mode: CameraMode; icon: React.ComponentType<{ className?: string }>; label: string; shortcut: string }[] = [
  { mode: "orbit", icon: Orbit, label: "3D Orbit", shortcut: "1" },
  { mode: "top-down", icon: ArrowDown, label: "Top Down", shortcut: "2" },
  { mode: "walk", icon: Footprints, label: "Walk Mode", shortcut: "3" },
];

const TRANSFORM_MODES: { mode: TransformMode; icon: React.ComponentType<{ className?: string }>; label: string; shortcut: string }[] = [
  { mode: "translate", icon: Move, label: "Move", shortcut: "G" },
  { mode: "rotate", icon: RotateCw, label: "Rotate", shortcut: "R" },
];

export function SecondaryToolbar({ onAutoFurnish }: { onAutoFurnish?: () => void } = {}) {
  const cameraMode = usePlannerR3FStore((s) => s.cameraMode);
  const setCameraMode = usePlannerR3FStore((s) => s.setCameraMode);
  const transformMode = usePlannerR3FStore((s) => s.transformMode);
  const setTransformMode = usePlannerR3FStore((s) => s.setTransformMode);
  const snapEnabled = usePlannerR3FStore((s) => s.snapEnabled);
  const toggleSnap = usePlannerR3FStore((s) => s.toggleSnap);
  const magneticSnapEnabled = usePlannerR3FStore((s) => s.magneticSnapEnabled);
  const toggleMagneticSnap = usePlannerR3FStore((s) => s.toggleMagneticSnap);
  const wallRotationSnapEnabled = usePlannerR3FStore((s) => s.wallRotationSnapEnabled);
  const toggleWallRotationSnap = usePlannerR3FStore((s) => s.toggleWallRotationSnap);
  const showGrid = usePlannerR3FStore((s) => s.showGrid);
  const toggleGrid = usePlannerR3FStore((s) => s.toggleGrid);
  const showWalls = usePlannerR3FStore((s) => s.showWalls);
  const toggleWalls = usePlannerR3FStore((s) => s.toggleWalls);
  const undo = usePlannerR3FStore((s) => s.undo);
  const redo = usePlannerR3FStore((s) => s.redo);
  const undoStack = usePlannerR3FStore((s) => s.undoStack);
  const redoStack = usePlannerR3FStore((s) => s.redoStack);
  const selectedId = usePlannerR3FStore((s) => s.selectedId);
  const selectedIds = usePlannerR3FStore((s) => s.selectedIds);
  const removeItem = usePlannerR3FStore((s) => s.removeItem);
  const removeSelected = usePlannerR3FStore((s) => s.removeSelected);
  const duplicateItem = usePlannerR3FStore((s) => s.duplicateItem);

  const hasSelection = selectedIds.length > 0 || !!selectedId;

  return (
    <div className="flex h-10 shrink-0 items-center gap-1 overflow-x-auto border-b border-neutral-200 bg-neutral-100 px-3">
      <GroupLabel>Transform</GroupLabel>
      {TRANSFORM_MODES.map(({ mode, icon, label, shortcut }) => (
        <ToolBtn
          key={mode}
          icon={icon}
          label={label}
          shortcut={shortcut}
          active={transformMode === mode}
          onClick={() => setTransformMode(mode)}
        />
      ))}

      <Sep />

      <GroupLabel>View</GroupLabel>
      <ToolBtn icon={Grip} label="Snap to Grid" shortcut="S" active={snapEnabled} onClick={toggleSnap} />
      <ToolBtn icon={Magnet} label="Magnetic Snap" active={magneticSnapEnabled} onClick={toggleMagneticSnap} />
      <ToolBtn icon={AlignStartVertical} label="Wall Rotation Snap" active={wallRotationSnapEnabled} onClick={toggleWallRotationSnap} />
      <ToolBtn icon={Grid3x3} label="Toggle Grid" active={showGrid} onClick={toggleGrid} />
      <ToolBtn icon={Eye} label="Toggle Walls" shortcut="W" active={showWalls} onClick={toggleWalls} />

      <Sep />

      <GroupLabel>History</GroupLabel>
      <ToolBtn icon={Undo2} label="Undo" shortcut="Ctrl+Z" onClick={undo} disabled={undoStack.length === 0} />
      <ToolBtn icon={Redo2} label="Redo" shortcut="Ctrl+Y" onClick={redo} disabled={redoStack.length === 0} />
      <ToolBtn
        icon={Copy}
        label="Duplicate"
        shortcut="Ctrl+D"
        onClick={() => selectedId && duplicateItem(selectedId)}
        disabled={!hasSelection}
      />
      <ToolBtn
        icon={Trash2}
        label="Delete"
        shortcut="Del"
        onClick={() => {
          if (selectedIds.length > 1) removeSelected();
          else if (selectedId) removeItem(selectedId);
        }}
        disabled={!hasSelection}
      />

      <Sep />

      <GroupLabel>Camera</GroupLabel>
      {CAMERA_MODES.map(({ mode, icon, label, shortcut }) => (
        <ToolBtn
          key={mode}
          icon={icon}
          label={label}
          shortcut={shortcut}
          active={cameraMode === mode}
          onClick={() => setCameraMode(mode)}
        />
      ))}

      {onAutoFurnish && (
        <>
          <Sep />
          <GroupLabel>AI</GroupLabel>
          <ToolBtn icon={Wand2} label="Smart Furnish" onClick={onAutoFurnish} />
        </>
      )}
    </div>
  );
}
