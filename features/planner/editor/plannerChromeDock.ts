export type PlannerChromeDockId = "tools" | "steps" | "panel-left" | "panel-right";

export type PlannerChromeDockEdge = "left" | "right" | "top" | "bottom" | "free";

export type PlannerChromeDockPlacement = {
  edge: PlannerChromeDockEdge;
  /** Position along a dock edge, 0–1. */
  offset: number;
  /** Free-floating center, 0–1 within the chrome layer. */
  x?: number;
  y?: number;
};

export const PLANNER_CHROME_DOCK_STORAGE_KEY = "planner-chrome-dock-v1";

export const PLANNER_CHROME_DOCK_DEFAULTS: Record<PlannerChromeDockId, PlannerChromeDockPlacement> = {
  tools: { edge: "left", offset: 0.5 },
  steps: { edge: "top", offset: 0.5 },
  "panel-left": { edge: "left", offset: 0.08 },
  "panel-right": { edge: "right", offset: 0.08 },
};

const SNAP_THRESHOLD = 0.15;

export function clampDockRatio(value: number, min = 0.08, max = 0.92): number {
  return Math.min(max, Math.max(min, value));
}

export function snapPlannerChromePlacement(
  clientX: number,
  clientY: number,
  layerRect: Pick<DOMRect, "left" | "top" | "width" | "height">,
  threshold = SNAP_THRESHOLD,
): PlannerChromeDockPlacement {
  const x = (clientX - layerRect.left) / layerRect.width;
  const y = (clientY - layerRect.top) / layerRect.height;

  const distLeft = x;
  const distRight = 1 - x;
  const distTop = y;
  const distBottom = 1 - y;
  const min = Math.min(distLeft, distRight, distTop, distBottom);

  if (min > threshold) {
    return {
      edge: "free",
      offset: 0.5,
      x: clampDockRatio(x),
      y: clampDockRatio(y),
    };
  }

  if (min === distLeft) {
    return { edge: "left", offset: clampDockRatio(y) };
  }
  if (min === distRight) {
    return { edge: "right", offset: clampDockRatio(y) };
  }
  if (min === distTop) {
    return { edge: "top", offset: clampDockRatio(x) };
  }
  return { edge: "bottom", offset: clampDockRatio(x) };
}

export function readPlannerChromeDockPlacement(dockId: PlannerChromeDockId): PlannerChromeDockPlacement {
  if (typeof window === "undefined") {
    return PLANNER_CHROME_DOCK_DEFAULTS[dockId];
  }

  try {
    const raw = window.localStorage.getItem(PLANNER_CHROME_DOCK_STORAGE_KEY);
    if (!raw) return PLANNER_CHROME_DOCK_DEFAULTS[dockId];
    const parsed = JSON.parse(raw) as Partial<Record<PlannerChromeDockId, PlannerChromeDockPlacement>>;
    const stored = parsed[dockId];
    if (!stored || !isValidPlacement(stored)) {
      return PLANNER_CHROME_DOCK_DEFAULTS[dockId];
    }
    return stored;
  } catch {
    return PLANNER_CHROME_DOCK_DEFAULTS[dockId];
  }
}

export function writePlannerChromeDockPlacement(
  dockId: PlannerChromeDockId,
  placement: PlannerChromeDockPlacement,
): void {
  if (typeof window === "undefined") return;

  try {
    const raw = window.localStorage.getItem(PLANNER_CHROME_DOCK_STORAGE_KEY);
    const parsed = raw
      ? (JSON.parse(raw) as Partial<Record<PlannerChromeDockId, PlannerChromeDockPlacement>>)
      : {};
    parsed[dockId] = placement;
    window.localStorage.setItem(PLANNER_CHROME_DOCK_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore storage failures in private mode or quota errors.
  }
}

function isValidPlacement(value: PlannerChromeDockPlacement): value is PlannerChromeDockPlacement {
  if (!value || typeof value !== "object") return false;
  const edges: PlannerChromeDockEdge[] = ["left", "right", "top", "bottom", "free"];
  if (!edges.includes(value.edge)) return false;
  if (typeof value.offset !== "number" || Number.isNaN(value.offset)) return false;
  if (value.edge === "free") {
    return typeof value.x === "number" && typeof value.y === "number";
  }
  return true;
}