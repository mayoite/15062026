"use client";

import { useRef } from "react";

import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";

export function BlueprintMoveCapture() {
  const blueprint = usePlannerWorkspaceStore((s) => s.blueprint);
  const setBlueprint = usePlannerWorkspaceStore((s) => s.setBlueprint);
  const dragRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);

  if (!blueprint?.dataUrl || blueprint.interactionMode !== "move" || blueprint.calibrating) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 z-[3] cursor-move bg-transparent"
      role="presentation"
      onPointerDown={(event) => {
        dragRef.current = {
          x: event.clientX,
          y: event.clientY,
          originX: blueprint.x,
          originY: blueprint.y,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!dragRef.current) return;
        const deltaX = event.clientX - dragRef.current.x;
        const deltaY = event.clientY - dragRef.current.y;
        setBlueprint({
          x: dragRef.current.originX + deltaX,
          y: dragRef.current.originY + deltaY,
        });
      }}
      onPointerUp={(event) => {
        dragRef.current = null;
        event.currentTarget.releasePointerCapture(event.pointerId);
        setBlueprint({ interactionMode: "idle" });
      }}
    />
  );
}
