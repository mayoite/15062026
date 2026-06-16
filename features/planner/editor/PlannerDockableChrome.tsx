"use client";

import { GripHorizontal, GripVertical } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";

import {
  PLANNER_CHROME_DOCK_DEFAULTS,
  readPlannerChromeDockPlacement,
  snapPlannerChromePlacement,
  writePlannerChromeDockPlacement,
  type PlannerChromeDockId,
  type PlannerChromeDockPlacement,
} from "@/features/planner/editor/plannerChromeDock";

interface PlannerDockableChromeProps {
  dockId: PlannerChromeDockId;
  layerRef: RefObject<HTMLElement | null>;
  label: string;
  className?: string;
  variant?: "default" | "compact";
  dockDisabled?: boolean;
  children: ReactNode;
}

export function PlannerDockableChrome({
  dockId,
  layerRef,
  label,
  className,
  variant = "default",
  dockDisabled = false,
  children,
}: PlannerDockableChromeProps) {
  const chromeRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<PlannerChromeDockPlacement>(() =>
    readPlannerChromeDockPlacement(dockId),
  );
  const [dragging, setDragging] = useState(false);
  const [dragCenter, setDragCenter] = useState<{ x: number; y: number } | null>(null);
  const dragPointerIdRef = useRef<number | null>(null);

  const persistPlacement = useCallback((next: PlannerChromeDockPlacement) => {
    setPlacement(next);
    writePlannerChromeDockPlacement(dockId, next);
  }, [dockId]);

  const finishDrag = useCallback((clientX: number, clientY: number) => {
    const layer = layerRef.current;
    if (!layer) return;
    const layerRect = layer.getBoundingClientRect();
    const next = snapPlannerChromePlacement(clientX, clientY, layerRect);
    persistPlacement(next);
    setDragging(false);
    setDragCenter(null);
    dragPointerIdRef.current = null;
  }, [layerRef, persistPlacement]);

  useEffect(() => {
    if (!dragging) return;

    const onPointerMove = (event: PointerEvent) => {
      if (dragPointerIdRef.current !== event.pointerId) return;
      const layer = layerRef.current;
      if (!layer) return;
      const layerRect = layer.getBoundingClientRect();
      setDragCenter({
        x: event.clientX - layerRect.left,
        y: event.clientY - layerRect.top,
      });
    };

    const onPointerUp = (event: PointerEvent) => {
      if (dragPointerIdRef.current !== event.pointerId) return;
      finishDrag(event.clientX, event.clientY);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [dragging, finishDrag, layerRef]);

  const onHandlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (dockDisabled) return;
    event.preventDefault();
    event.stopPropagation();

    const layer = layerRef.current;
    if (!layer) return;

    const layerRect = layer.getBoundingClientRect();
    dragPointerIdRef.current = event.pointerId;
    setDragging(true);
    setDragCenter({
      x: event.clientX - layerRect.left,
      y: event.clientY - layerRect.top,
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onHandleDoubleClick = () => {
    if (dockDisabled) return;
    persistPlacement(PLANNER_CHROME_DOCK_DEFAULTS[dockId]);
  };

  const dockStyle: CSSProperties = dragging && dragCenter
    ? {
        left: dragCenter.x,
        top: dragCenter.y,
        transform: "translate(-50%, -50%)",
      }
    : ({
        "--dock-offset": placement.offset,
        "--dock-x": placement.x ?? 0.5,
        "--dock-y": placement.y ?? 0.5,
      } as CSSProperties);

  const verticalDock = placement.edge === "left" || placement.edge === "right";
  const HandleIcon = verticalDock ? GripVertical : GripHorizontal;

  return (
    <div
      ref={chromeRef}
      className={`pw-dockable-chrome pw-canvas-chrome${className ? ` ${className}` : ""}`}
      data-dock-id={dockId}
      data-dock={dragging ? "free" : placement.edge}
      data-dragging={dragging || undefined}
      data-variant={variant}
      data-dock-disabled={dockDisabled || undefined}
      style={dockStyle}
    >
      {!dockDisabled ? (
        <button
          type="button"
          className="pw-dockable-chrome__handle"
          aria-label={`Move ${label}`}
          onPointerDown={onHandlePointerDown}
          onDoubleClick={onHandleDoubleClick}
        >
          <HandleIcon size={12} strokeWidth={2} aria-hidden />
        </button>
      ) : null}
      <div className="pw-dockable-chrome__body">{children}</div>
    </div>
  );
}