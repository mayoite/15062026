"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "tldraw";

import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";
import {
  getBlueprintScreenFrame,
  moveBlueprintFromPageDelta,
} from "@/features/planner/editor/blueprintCanvasTransform";
import { formatBlueprintScalePercent } from "@/features/planner/editor/blueprintTransform";

export function BlueprintMoveCapture({ editor }: { editor: Editor | null }) {
  const blueprint = usePlannerWorkspaceStore((s) => s.blueprint);
  const setBlueprint = usePlannerWorkspaceStore((s) => s.setBlueprint);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    pointerId: number;
    startPage: { x: number; y: number };
    origin: { x: number; y: number };
  } | null>(null);

  const endDrag = useCallback(() => {
    dragRef.current = null;
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      if (!editor || !dragRef.current || event.pointerId !== dragRef.current.pointerId) {
        return;
      }

      const currentPage = editor.screenToPage({ x: event.clientX, y: event.clientY });
      const delta = {
        x: currentPage.x - dragRef.current.startPage.x,
        y: currentPage.y - dragRef.current.startPage.y,
      };

      setBlueprint(moveBlueprintFromPageDelta(dragRef.current.origin, delta));
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!dragRef.current || event.pointerId !== dragRef.current.pointerId) return;
      endDrag();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [editor, endDrag, isDragging, setBlueprint]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!editor || !blueprint.interactionMode || blueprint.interactionMode !== "move") return;

      event.preventDefault();
      event.stopPropagation();

      dragRef.current = {
        pointerId: event.pointerId,
        startPage: editor.screenToPage({ x: event.clientX, y: event.clientY }),
        origin: { x: blueprint.x, y: blueprint.y },
      };
      setIsDragging(true);
    },
    [blueprint.interactionMode, blueprint.x, blueprint.y, editor],
  );

  if (!editor || !blueprint.dataUrl || blueprint.calibrating || blueprint.interactionMode !== "move") {
    return null;
  }

  const topLeftScreen = editor.pageToScreen({ x: blueprint.x, y: blueprint.y });
  const frame = getBlueprintScreenFrame({
    pageTopLeft: topLeftScreen,
    widthPx: blueprint.widthPx,
    heightPx: blueprint.heightPx,
    scale: blueprint.scale * editor.getCamera().z,
  });

  return (
    <>
      <div
        className={`absolute inset-0 z-[28] ${isDragging ? "cursor-grabbing bg-black/5" : "cursor-grab bg-transparent"}`}
        onPointerDown={handlePointerDown}
        role="presentation"
        aria-label="Move blueprint underlay on canvas"
      />
      <div className="pointer-events-none absolute inset-0 z-[27]" aria-hidden>
        <div
          className="absolute border-2 border-dashed border-[color:var(--planner-primary)] bg-[color:var(--planner-primary-soft)]/10 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
          style={{
            left: frame.left,
            top: frame.top,
            width: frame.width,
            height: frame.height,
          }}
        >
          <div className="absolute left-2 top-2 rounded-full border border-[color:var(--planner-primary)] bg-[color:var(--planner-panel)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--planner-primary)]">
            Move blueprint · {formatBlueprintScalePercent(blueprint.scale)}
          </div>
        </div>
        <div
          className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[color:var(--planner-primary)] bg-[color:var(--planner-panel)]"
          style={{
            left: frame.centerX,
            top: frame.centerY,
          }}
        />
      </div>
    </>
  );
}
