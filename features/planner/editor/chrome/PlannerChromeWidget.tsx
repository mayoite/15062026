"use client";

import { GripHorizontal, GripVertical } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";

import {
  getPlannerChromePreviewEdge,
  getPlannerChromeTooltipSide,
  movePlannerChromePlacementWithKeyboard,
  PLANNER_CHROME_DEFAULTS,
  resolvePlannerChromeCollisions,
  snapPlannerChromePlacement,
} from "@/features/planner/editor/chrome/plannerChromeLayout";
import {
  readPlannerChromeLayout,
  writePlannerChromeLayout,
} from "@/features/planner/editor/chrome/plannerChromeStorage";
import type {
  PlannerChromeDockEdge,
  PlannerChromeDockId,
  PlannerChromeDockPlacement,
  PlannerChromeReservedInsets,
  PlannerChromeWidgetSize,
} from "@/features/planner/editor/chrome/plannerChromeTypes";

type RenderState = {
  placement: PlannerChromeDockPlacement;
  previewEdge: PlannerChromeDockEdge | null;
  tooltipSide: "top" | "right" | "bottom" | "left";
};

interface PlannerChromeWidgetProps {
  dockId: PlannerChromeDockId;
  layerRef: RefObject<HTMLElement | null>;
  label: string;
  className?: string;
  variant?: "default" | "compact";
  dockDisabled?: boolean;
  reservedInsets?: PlannerChromeReservedInsets;
  onPlacementChange?: (placement: PlannerChromeDockPlacement) => void;
  resetToken?: number;
  children: ReactNode | ((state: RenderState) => ReactNode);
}

type DragState = {
  pointerOffset: { x: number; y: number };
  topLeft: { x: number; y: number };
};

const DEFAULT_WIDGET_SIZE: PlannerChromeWidgetSize = { width: 48, height: 48 };

export function PlannerChromeWidget({
  dockId,
  layerRef,
  label,
  className,
  variant = "default",
  dockDisabled = false,
  reservedInsets,
  onPlacementChange,
  resetToken: _resetToken = 0,
  children,
}: PlannerChromeWidgetProps) {
  const chromeRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<PlannerChromeDockPlacement>(() =>
    readPlannerChromeLayout()[dockId],
  );
  const [dragging, setDragging] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [previewEdge, setPreviewEdge] = useState<PlannerChromeDockEdge | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  const dragPointerIdRef = useRef<number | null>(null);
  const [widgetSize, setWidgetSize] = useState<PlannerChromeWidgetSize>(DEFAULT_WIDGET_SIZE);

  useLayoutEffect(() => {
    const element = chromeRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;

    const sync = () => {
      const rect = element.getBoundingClientRect();
      setWidgetSize({
        width: Math.max(1, rect.width),
        height: Math.max(1, rect.height),
      });
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const announcePlacement = useCallback((next: PlannerChromeDockPlacement) => {
    const location = next.edge === "free"
      ? "floating"
      : `docked ${next.edge}`;
    setLiveMessage(`${label} ${location}.`);
  }, [label]);

  const persistLayoutPlacement = useCallback((next: PlannerChromeDockPlacement) => {
    const layer = layerRef.current;
    const layerRect = layer?.getBoundingClientRect();
    const currentLayout = readPlannerChromeLayout();
    const nextLayout = resolvePlannerChromeCollisions(
      {
        ...currentLayout,
        [dockId]: next,
      },
      dockId,
      layerRect ?? undefined,
      {
        tools: dockId === "tools" ? widgetSize : undefined,
        steps: dockId === "steps" ? widgetSize : undefined,
        access: dockId === "access" ? widgetSize : undefined,
      },
      reservedInsets,
    );
    const resolved = nextLayout[dockId];
    setPlacement(resolved);
    writePlannerChromeLayout(nextLayout);
    onPlacementChange?.(resolved);
    announcePlacement(resolved);
  }, [announcePlacement, dockId, layerRef, onPlacementChange, reservedInsets, widgetSize]);

  const finishDrag = useCallback((clientX: number, clientY: number, dragPointerOffset: { x: number; y: number }) => {
    const layer = layerRef.current;
    if (!layer) return;
    const layerRect = layer.getBoundingClientRect();
    const centerX = clientX - dragPointerOffset.x + widgetSize.width / 2;
    const centerY = clientY - dragPointerOffset.y + widgetSize.height / 2;
    const next = snapPlannerChromePlacement(
      centerX,
      centerY,
      layerRect,
      widgetSize,
      undefined,
      reservedInsets,
    );
    persistLayoutPlacement(next);
    setDragging(false);
    setDragState(null);
    setPreviewEdge(null);
    dragPointerIdRef.current = null;
  }, [layerRef, persistLayoutPlacement, reservedInsets, widgetSize]);

  useEffect(() => {
    if (!dragging) return;

    const onPointerMove = (event: PointerEvent) => {
      if (dragPointerIdRef.current !== event.pointerId) return;
      const layer = layerRef.current;
      if (!layer || !dragState) return;
      const layerRect = layer.getBoundingClientRect();
      const nextTopLeft = {
        x: event.clientX - layerRect.left - dragState.pointerOffset.x,
        y: event.clientY - layerRect.top - dragState.pointerOffset.y,
      };
      const centerX = event.clientX - dragState.pointerOffset.x + widgetSize.width / 2;
      const centerY = event.clientY - dragState.pointerOffset.y + widgetSize.height / 2;
      setDragState((current) =>
        current
          ? {
              ...current,
              topLeft: nextTopLeft,
            }
          : current,
      );
      setPreviewEdge(getPlannerChromePreviewEdge(centerX, centerY, layerRect));
    };

    const onPointerUp = (event: PointerEvent) => {
      if (dragPointerIdRef.current !== event.pointerId || !dragState) return;
      finishDrag(event.clientX, event.clientY, dragState.pointerOffset);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [dragState, dragging, finishDrag, layerRef, widgetSize]);

  const onHandlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (dockDisabled) return;
    event.preventDefault();
    event.stopPropagation();

    const layer = layerRef.current;
    const chrome = chromeRef.current;
    if (!layer || !chrome) return;

    const layerRect = layer.getBoundingClientRect();
    const chromeRect = chrome.getBoundingClientRect();
    const pointerOffset = {
      x: event.clientX - chromeRect.left,
      y: event.clientY - chromeRect.top,
    };

    dragPointerIdRef.current = event.pointerId;
    setDragging(true);
    setDragState({
      pointerOffset,
      topLeft: {
        x: chromeRect.left - layerRect.left,
        y: chromeRect.top - layerRect.top,
      },
    });
    setPreviewEdge(placement.edge);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onHandleDoubleClick = () => {
    if (dockDisabled) return;
    persistLayoutPlacement(PLANNER_CHROME_DEFAULTS[dockId]);
  };

  const onHandleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (dockDisabled) return;
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();
    const layer = layerRef.current;
    const layerRect = layer?.getBoundingClientRect();
    const next = movePlannerChromePlacementWithKeyboard(
      placement,
      event.key as "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight" | "Home" | "End",
      layerRect
        ? {
            shiftKey: event.shiftKey,
            layerRect,
            widgetSize,
            reservedInsets,
          }
        : {
            shiftKey: event.shiftKey,
          },
    );
    persistLayoutPlacement(next);
  };

  const dockStyle: CSSProperties = dragging && dragState
    ? {
        left: dragState.topLeft.x,
        top: dragState.topLeft.y,
        transform: "none",
      }
    : ({
        "--dock-offset": placement.offset,
        "--dock-x": placement.x ?? 0.5,
        "--dock-y": placement.y ?? 0.5,
      } as CSSProperties);

  const visualEdge = dragging ? previewEdge ?? placement.edge : placement.edge;
  const verticalDock = visualEdge === "left" || visualEdge === "right";
  const HandleIcon = verticalDock ? GripVertical : GripHorizontal;
  const tooltipSide = useMemo(
    () => getPlannerChromeTooltipSide(visualEdge),
    [visualEdge],
  );

  const renderState: RenderState = {
    placement,
    previewEdge,
    tooltipSide,
  };

  return (
    <div
      ref={chromeRef}
      className={`pw-dockable-chrome pw-canvas-chrome${className ? ` ${className}` : ""}`}
      data-dock-id={dockId}
      data-dock={dragging ? "free" : placement.edge}
      data-preview-edge={dragging ? previewEdge ?? undefined : undefined}
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
          onKeyDown={onHandleKeyDown}
        >
          <HandleIcon size={12} strokeWidth={2} aria-hidden />
        </button>
      ) : null}
      <div className="pw-dockable-chrome__body">
        {typeof children === "function" ? children(renderState) : children}
      </div>
      <div className="pw-dockable-chrome__live" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </div>
    </div>
  );
}
