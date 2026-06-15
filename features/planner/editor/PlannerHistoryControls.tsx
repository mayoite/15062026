"use client";

import { useEffect, useState } from "react";
import { Eraser, Redo2, Undo2 } from "lucide-react";
import type { Editor } from "tldraw";

import { confirmResetPlannerCanvas } from "@/features/planner/editor/resetPlannerCanvas";
import { PlannerIconButton } from "@/features/planner/ui/PlannerTooltip";

interface PlannerHistoryControlsProps {
  editor: Editor | null;
  onReset?: () => void;
  tooltipSide?: "top" | "right" | "bottom" | "left";
}

export function PlannerHistoryControls({
  editor,
  onReset,
  tooltipSide = "bottom",
}: PlannerHistoryControlsProps) {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [shapeCount, setShapeCount] = useState(0);

  useEffect(() => {
    if (!editor) return;

    const sync = () => {
      setCanUndo(editor.getCanUndo());
      setCanRedo(editor.getCanRedo());
      setShapeCount(editor.getCurrentPageShapes().length);
    };

    sync();
    return editor.store.listen(sync);
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="pw-history" data-coach="history" role="group" aria-label="Canvas history">
      <PlannerIconButton
        label="Undo"
        hint="Step back one change"
        shortcut="Ctrl+Z"
        tooltipSide={tooltipSide}
        className="pw-icon-btn pw-history-btn"
        disabled={!canUndo}
        onClick={() => editor.undo()}
      >
        <Undo2 size={15} strokeWidth={1.75} aria-hidden />
      </PlannerIconButton>
      <PlannerIconButton
        label="Redo"
        hint="Step forward one change"
        shortcut="Ctrl+Shift+Z"
        tooltipSide={tooltipSide}
        className="pw-icon-btn pw-history-btn"
        disabled={!canRedo}
        onClick={() => editor.redo()}
      >
        <Redo2 size={15} strokeWidth={1.75} aria-hidden />
      </PlannerIconButton>
      <span className="pw-history-divider" aria-hidden />
      <PlannerIconButton
        label="Clear canvas"
        hint="Remove all shapes and start blank"
        tooltipSide={tooltipSide}
        className="pw-icon-btn pw-history-btn pw-history-btn--reset"
        disabled={shapeCount === 0}
        onClick={() => {
          if (confirmResetPlannerCanvas(editor)) {
            onReset?.();
          }
        }}
      >
        <Eraser size={15} strokeWidth={1.75} aria-hidden />
        <span className="pw-history-reset-label">Clear</span>
      </PlannerIconButton>
    </div>
  );
}
