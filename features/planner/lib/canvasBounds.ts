import plannerCanvasConfig from "@/config/planner-canvas.json";

type PlannerCanvasConfig = {
  scale: { mmPerCanvasUnit: number };
  bounds: { maxExtentMeters: number; minRoomDimensionMm: number; minCanvasUnit: number };
  layout: {
    defaultOriginCanvasUnits: number;
    estimateRoomMinWidthMm: number;
    estimateRoomMinDepthMm: number;
  };
  viewport: {
    fitPaddingPx: number;
    containerPadPx: number;
    minContainerWidthPx: number;
    minContainerHeightPx: number;
    zoomMinPercent: number;
    zoomMaxPercent: number;
    fitMaxZoomFactor: number;
    wheelZoomMin: number;
    wheelZoomMax: number;
    defaultZoomPercent: number;
    emptyViewportFitMeters: number;
  };
};

const config = plannerCanvasConfig as PlannerCanvasConfig;

export const PLANNER_CANVAS_CONFIG = config;

export const PLANNER_MM_PER_CANVAS_UNIT = config.scale.mmPerCanvasUnit;

export const PLANNER_MIN_CANVAS_UNIT = config.bounds.minCanvasUnit;

export const PLANNER_MIN_ROOM_DIMENSION_MM = config.bounds.minRoomDimensionMm;

export const PLANNER_MAX_CANVAS_METERS = config.bounds.maxExtentMeters;

export const PLANNER_MAX_CANVAS_MM = PLANNER_MAX_CANVAS_METERS * 1000;

export const PLANNER_MAX_CANVAS_UNITS = PLANNER_MAX_CANVAS_MM / PLANNER_MM_PER_CANVAS_UNIT;

export const PLANNER_LAYOUT_ORIGIN_UNITS = config.layout.defaultOriginCanvasUnits;

export const PLANNER_VIEWPORT = config.viewport;

export function plannerWorldBoundsRect(): CanvasRect {
  return {
    left: PLANNER_MIN_CANVAS_UNIT,
    top: PLANNER_MIN_CANVAS_UNIT,
    width: PLANNER_MAX_CANVAS_UNITS,
    height: PLANNER_MAX_CANVAS_UNITS,
  };
}

/**
 * Keep the Fabric viewport inside the configured world extent (0 … max canvas units).
 * Prevents pan/zoom from drifting into an infinite grey void.
 */
export function clampViewportTransform(
  viewportWidthPx: number,
  viewportHeightPx: number,
  zoom: number,
  translateX: number,
  translateY: number,
  paddingPx: number = PLANNER_VIEWPORT.fitPaddingPx,
): { translateX: number; translateY: number } {
  const max = PLANNER_MAX_CANVAS_UNITS;
  const pad = paddingPx;

  const minTx = viewportWidthPx - (max + pad) * zoom;
  const maxTx = pad * zoom;
  const minTy = viewportHeightPx - (max + pad) * zoom;
  const maxTy = pad * zoom;

  let tx = translateX;
  let ty = translateY;

  if (minTx <= maxTx) {
    tx = Math.max(minTx, Math.min(maxTx, tx));
  } else {
    tx = (viewportWidthPx - max * zoom) / 2;
  }

  if (minTy <= maxTy) {
    ty = Math.max(minTy, Math.min(maxTy, ty));
  } else {
    ty = (viewportHeightPx - max * zoom) / 2;
  }

  return { translateX: tx, translateY: ty };
}

export function canvasUnitsToMillimeters(units: number): number {
  return Math.round(units * PLANNER_MM_PER_CANVAS_UNIT);
}

export function millimetersToCanvasUnits(mm: number): number {
  return Math.round(mm / PLANNER_MM_PER_CANVAS_UNIT);
}

/** Default world square (in canvas units) framed when the plan is empty. */
export const PLANNER_EMPTY_VIEWPORT_FIT_UNITS = millimetersToCanvasUnits(
  config.viewport.emptyViewportFitMeters * 1000,
);

export function clampCanvasScalar(
  value: number,
  min: number = PLANNER_MIN_CANVAS_UNIT,
  max: number = PLANNER_MAX_CANVAS_UNITS,
): number {
  return Math.max(min, Math.min(max, value));
}

export function clampCanvasPoint(point: { x: number; y: number }): { x: number; y: number } {
  return {
    x: clampCanvasScalar(point.x),
    y: clampCanvasScalar(point.y),
  };
}

export type CanvasRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function clampCanvasRect(rect: CanvasRect): CanvasRect {
  const max = PLANNER_MAX_CANVAS_UNITS;
  let { left, top, width, height } = rect;
  width = Math.max(PLANNER_MIN_CANVAS_UNIT, width);
  height = Math.max(PLANNER_MIN_CANVAS_UNIT, height);
  if (width > max) width = max;
  if (height > max) height = max;
  if (left < PLANNER_MIN_CANVAS_UNIT) left = PLANNER_MIN_CANVAS_UNIT;
  if (top < PLANNER_MIN_CANVAS_UNIT) top = PLANNER_MIN_CANVAS_UNIT;
  if (left + width > max) left = max - width;
  if (top + height > max) top = max - height;
  return { left, top, width, height };
}

export function isWithinCanvasBounds(rect: CanvasRect): boolean {
  const max = PLANNER_MAX_CANVAS_UNITS;
  return (
    rect.left >= PLANNER_MIN_CANVAS_UNIT &&
    rect.top >= PLANNER_MIN_CANVAS_UNIT &&
    rect.left + rect.width <= max &&
    rect.top + rect.height <= max
  );
}

export function capMillimetersToCanvas(
  mm: number,
  minimumMm: number = PLANNER_MIN_ROOM_DIMENSION_MM,
): number {
  return Math.max(minimumMm, Math.min(mm, PLANNER_MAX_CANVAS_MM));
}

export function clampLayoutOrigin(
  originX: number,
  originY: number,
  widthUnits: number,
  heightUnits: number,
): { x: number; y: number } {
  const max = PLANNER_MAX_CANVAS_UNITS;
  return {
    x: clampCanvasScalar(originX, PLANNER_MIN_CANVAS_UNIT, Math.max(PLANNER_MIN_CANVAS_UNIT, max - widthUnits)),
    y: clampCanvasScalar(originY, PLANNER_MIN_CANVAS_UNIT, Math.max(PLANNER_MIN_CANVAS_UNIT, max - heightUnits)),
  };
}

export function capRoomEstimateMm(widthMm: number, depthMm: number): { widthMm: number; depthMm: number } {
  return {
    widthMm: capMillimetersToCanvas(widthMm),
    depthMm: capMillimetersToCanvas(depthMm),
  };
}

/** World-space center used for arrange / place-in-center actions. */
export function plannerCanvasWorldCenter(): { x: number; y: number } {
  const half = PLANNER_MAX_CANVAS_UNITS / 2;
  return { x: half, y: half };
}
