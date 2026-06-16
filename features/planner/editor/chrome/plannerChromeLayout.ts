import type {
  PlannerChromeDockEdge,
  PlannerChromeDockId,
  PlannerChromeDockPlacement,
  PlannerChromeLayoutState,
  PlannerChromeReservedInsets,
  PlannerChromeWidgetSize,
} from "@/features/planner/editor/chrome/plannerChromeTypes";

export const PLANNER_CHROME_DEFAULTS: Record<PlannerChromeDockId, PlannerChromeDockPlacement> = {
  tools: { edge: "left", offset: 0.5 },
  steps: { edge: "top", offset: 0.5 },
  access: { edge: "top", offset: 0.1 },
};

const SNAP_THRESHOLD = 0.15;
const EDGE_MIN = 0.08;
const EDGE_MAX = 0.92;
const COLLISION_STAGGER = 0.12;
const SAFE_GUTTER_PX = 16;
const EDGES: PlannerChromeDockEdge[] = ["left", "right", "top", "bottom", "free"];

type LayerRect = Pick<DOMRect, "left" | "top" | "width" | "height">;

function getReservedInset(
  insets: PlannerChromeReservedInsets | undefined,
  edge: keyof PlannerChromeReservedInsets,
): number {
  return Math.max(0, insets?.[edge] ?? 0);
}

function toRatio(px: number, total: number): number {
  if (!Number.isFinite(px) || !Number.isFinite(total) || total <= 0) return 0;
  return px / total;
}

export function clampDockRatio(value: number, min = EDGE_MIN, max = EDGE_MAX): number {
  return Math.min(max, Math.max(min, value));
}

export function getDockAxisBounds(
  edge: Exclude<PlannerChromeDockEdge, "free">,
  layerRect: Pick<DOMRect, "width" | "height">,
  widgetSize: PlannerChromeWidgetSize,
  reservedInsets?: PlannerChromeReservedInsets,
): { min: number; max: number } {
  const isVerticalEdge = edge === "left" || edge === "right";
  const layerSpan = isVerticalEdge ? layerRect.height : layerRect.width;
  const widgetSpan = isVerticalEdge ? widgetSize.height : widgetSize.width;
  const startInset = isVerticalEdge
    ? getReservedInset(reservedInsets, "top")
    : getReservedInset(reservedInsets, "left");
  const endInset = isVerticalEdge
    ? getReservedInset(reservedInsets, "bottom")
    : getReservedInset(reservedInsets, "right");

  const min = clampDockRatio(toRatio(startInset + widgetSpan / 2 + SAFE_GUTTER_PX, layerSpan));
  const max = clampDockRatio(
    1 - toRatio(endInset + widgetSpan / 2 + SAFE_GUTTER_PX, layerSpan),
  );

  return min <= max ? { min, max } : { min: 0.5, max: 0.5 };
}

function getFreeBounds(
  layerRect: Pick<DOMRect, "width" | "height">,
  widgetSize: PlannerChromeWidgetSize,
  reservedInsets?: PlannerChromeReservedInsets,
): { xMin: number; xMax: number; yMin: number; yMax: number } {
  const xMin = clampDockRatio(
    toRatio(getReservedInset(reservedInsets, "left") + widgetSize.width / 2 + SAFE_GUTTER_PX, layerRect.width),
  );
  const xMax = clampDockRatio(
    1 - toRatio(getReservedInset(reservedInsets, "right") + widgetSize.width / 2 + SAFE_GUTTER_PX, layerRect.width),
  );
  const yMin = clampDockRatio(
    toRatio(getReservedInset(reservedInsets, "top") + widgetSize.height / 2 + SAFE_GUTTER_PX, layerRect.height),
  );
  const yMax = clampDockRatio(
    1 - toRatio(getReservedInset(reservedInsets, "bottom") + widgetSize.height / 2 + SAFE_GUTTER_PX, layerRect.height),
  );

  return {
    xMin: xMin <= xMax ? xMin : 0.5,
    xMax: xMin <= xMax ? xMax : 0.5,
    yMin: yMin <= yMax ? yMin : 0.5,
    yMax: yMin <= yMax ? yMax : 0.5,
  };
}

export function normalizePlannerChromePlacement(
  placement: Partial<PlannerChromeDockPlacement> | null | undefined,
  fallback: PlannerChromeDockPlacement,
  options?: {
    layerRect?: Pick<DOMRect, "width" | "height">;
    widgetSize?: PlannerChromeWidgetSize;
    reservedInsets?: PlannerChromeReservedInsets;
  },
): PlannerChromeDockPlacement {
  if (!placement || typeof placement !== "object") {
    return fallback;
  }

  if (!placement.edge || !EDGES.includes(placement.edge)) {
    return fallback;
  }

  const layerRect = options?.layerRect;
  const widgetSize = options?.widgetSize;
  const reservedInsets = options?.reservedInsets;

  if (placement.edge === "free") {
    if (
      typeof placement.x !== "number"
      || Number.isNaN(placement.x)
      || typeof placement.y !== "number"
      || Number.isNaN(placement.y)
    ) {
      return fallback;
    }

    if (layerRect && widgetSize) {
      const bounds = getFreeBounds(layerRect, widgetSize, reservedInsets);
      return {
        edge: "free",
        offset: 0.5,
        x: clampDockRatio(placement.x, bounds.xMin, bounds.xMax),
        y: clampDockRatio(placement.y, bounds.yMin, bounds.yMax),
      };
    }

    return {
      edge: "free",
      offset: 0.5,
      x: clampDockRatio(placement.x),
      y: clampDockRatio(placement.y),
    };
  }

  if (typeof placement.offset !== "number" || Number.isNaN(placement.offset)) {
    return fallback;
  }

  if (layerRect && widgetSize) {
    const bounds = getDockAxisBounds(placement.edge, layerRect, widgetSize, reservedInsets);
    return {
      edge: placement.edge,
      offset: clampDockRatio(placement.offset, bounds.min, bounds.max),
    };
  }

  return {
    edge: placement.edge,
    offset: clampDockRatio(placement.offset),
  };
}

export function getPlannerChromePreviewEdge(
  centerX: number,
  centerY: number,
  layerRect: LayerRect,
  threshold = SNAP_THRESHOLD,
): PlannerChromeDockEdge {
  const x = (centerX - layerRect.left) / layerRect.width;
  const y = (centerY - layerRect.top) / layerRect.height;

  const distLeft = x;
  const distRight = 1 - x;
  const distTop = y;
  const distBottom = 1 - y;
  const min = Math.min(distLeft, distRight, distTop, distBottom);

  if (min > threshold) {
    return "free";
  }
  if (min === distLeft) return "left";
  if (min === distRight) return "right";
  if (min === distTop) return "top";
  return "bottom";
}

export function resolvePlannerChromeCollisions(
  layout: PlannerChromeLayoutState,
  activeDockId: PlannerChromeDockId,
  layerRect?: Pick<DOMRect, "width" | "height">,
  widgetSizes?: Partial<Record<PlannerChromeDockId, PlannerChromeWidgetSize>>,
  reservedInsets?: PlannerChromeReservedInsets,
): PlannerChromeLayoutState {
  const next = { ...layout };
  const active = next[activeDockId];
  if (!active || active.edge === "free") {
    return next;
  }

  const edgeSiblings = (Object.keys(next) as PlannerChromeDockId[])
    .filter((dockId) => dockId !== activeDockId && next[dockId].edge === active.edge)
    .sort();

  if (edgeSiblings.length === 0) {
    return next;
  }

  let candidate = active.offset;
  const occupied = edgeSiblings.map((dockId) => next[dockId].offset);
  while (occupied.some((offset) => Math.abs(offset - candidate) < COLLISION_STAGGER * 0.9)) {
    candidate += COLLISION_STAGGER;
  }

  if (layerRect && widgetSizes?.[activeDockId]) {
    const bounds = getDockAxisBounds(active.edge, layerRect, widgetSizes[activeDockId], reservedInsets);
    candidate = clampDockRatio(candidate, bounds.min, bounds.max);
    while (occupied.some((offset) => Math.abs(offset - candidate) < COLLISION_STAGGER * 0.9)) {
      candidate -= COLLISION_STAGGER;
      candidate = clampDockRatio(candidate, bounds.min, bounds.max);
      if (candidate === bounds.min || candidate === bounds.max) break;
    }
  } else {
    candidate = clampDockRatio(candidate);
  }

  next[activeDockId] = { ...active, offset: candidate };
  return next;
}

export function snapPlannerChromePlacement(
  centerX: number,
  centerY: number,
  layerRect: LayerRect,
  widgetSize: PlannerChromeWidgetSize = { width: 0, height: 0 },
  threshold = SNAP_THRESHOLD,
  reservedInsets?: PlannerChromeReservedInsets,
): PlannerChromeDockPlacement {
  const edge = getPlannerChromePreviewEdge(centerX, centerY, layerRect, threshold);
  const x = (centerX - layerRect.left) / layerRect.width;
  const y = (centerY - layerRect.top) / layerRect.height;

  if (edge === "free") {
    return normalizePlannerChromePlacement(
      { edge: "free", offset: 0.5, x, y },
      { edge: "free", offset: 0.5, x: 0.5, y: 0.5 },
      { layerRect, widgetSize, reservedInsets },
    );
  }

  const offset = edge === "left" || edge === "right" ? y : x;
  return normalizePlannerChromePlacement(
    { edge, offset },
    { edge, offset: 0.5 },
    { layerRect, widgetSize, reservedInsets },
  );
}

export function movePlannerChromePlacementWithKeyboard(
  placement: PlannerChromeDockPlacement,
  key: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight" | "Home" | "End",
  options?: {
    shiftKey?: boolean;
    layerRect?: Pick<DOMRect, "width" | "height">;
    widgetSize?: PlannerChromeWidgetSize;
    reservedInsets?: PlannerChromeReservedInsets;
  },
): PlannerChromeDockPlacement {
  const step = options?.shiftKey ? 0.08 : 0.03;

  if (placement.edge === "free") {
    const fallback = { edge: "free" as const, offset: 0.5, x: 0.5, y: 0.5 };
    let nextX = placement.x ?? 0.5;
    let nextY = placement.y ?? 0.5;

    if (key === "ArrowLeft") nextX -= step;
    if (key === "ArrowRight") nextX += step;
    if (key === "ArrowUp") nextY -= step;
    if (key === "ArrowDown") nextY += step;
    if (key === "Home") {
      nextX = EDGE_MIN;
      nextY = EDGE_MIN;
    }
    if (key === "End") {
      nextX = EDGE_MAX;
      nextY = EDGE_MAX;
    }

    return normalizePlannerChromePlacement(
      { edge: "free", offset: 0.5, x: nextX, y: nextY },
      fallback,
      options?.layerRect && options?.widgetSize
        ? {
            layerRect: options.layerRect,
            widgetSize: options.widgetSize,
            reservedInsets: options.reservedInsets,
          }
        : undefined,
    );
  }

  const fallback = { edge: placement.edge, offset: 0.5 };
  if (key === "Home" || key === "End") {
    const minMax = options?.layerRect && options?.widgetSize
      ? getDockAxisBounds(placement.edge, options.layerRect, options.widgetSize, options.reservedInsets)
      : { min: EDGE_MIN, max: EDGE_MAX };

    return normalizePlannerChromePlacement(
      { edge: placement.edge, offset: key === "Home" ? minMax.min : minMax.max },
      fallback,
      options?.layerRect && options?.widgetSize
        ? {
            layerRect: options.layerRect,
            widgetSize: options.widgetSize,
            reservedInsets: options.reservedInsets,
          }
        : undefined,
    );
  }

  let delta = 0;
  if (placement.edge === "left" || placement.edge === "right") {
    if (key === "ArrowUp") delta = -step;
    if (key === "ArrowDown") delta = step;
  } else {
    if (key === "ArrowLeft") delta = -step;
    if (key === "ArrowRight") delta = step;
  }

  return normalizePlannerChromePlacement(
    { edge: placement.edge, offset: placement.offset + delta },
    fallback,
    options?.layerRect && options?.widgetSize
      ? {
          layerRect: options.layerRect,
          widgetSize: options.widgetSize,
          reservedInsets: options.reservedInsets,
        }
      : undefined,
  );
}

export function getPlannerChromeTooltipSide(edge: PlannerChromeDockEdge): "top" | "right" | "bottom" | "left" {
  if (edge === "left") return "right";
  if (edge === "right") return "left";
  if (edge === "bottom") return "top";
  return "bottom";
}
