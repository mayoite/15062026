/**
 * Wall-opening geometry for doors and windows.
 *
 * Doors and windows are independent shapes; walls discover which of them sit
 * on their axis and cut real openings (2D plan gaps, 3D voids). All functions
 * are pure so both the canvas and the 3D viewer share one
 * implementation, and everything is unit-testable.
 *
 * Units: planner canvas units are centimetres (1 unit = 10 mm). Shape props
 * such as `widthMm` store real millimetres and must be converted with
 * `mmToCanvasUnits` before hitting the canvas or the 3D scene.
 */

export const MM_PER_CANVAS_UNIT = 10;

export function mmToCanvasUnits(mm: number): number {
  return mm / MM_PER_CANVAS_UNIT;
}

export interface Point2 {
  x: number;
  y: number;
}

/** A wall segment in page coordinates (canvas units). */
export interface WallSegmentSpec {
  id: string;
  start: Point2;
  end: Point2;
  /** Wall thickness in canvas units. */
  thickness: number;
}

/** A door/window candidate, reduced to its plan-space center + width. */
export interface OpeningCandidate {
  id: string;
  kind: "door" | "window";
  /** Center of the opening in page coordinates (canvas units). */
  center: Point2;
  /** Opening width along the wall axis in canvas units. */
  width: number;
}

/** An opening cut into a specific wall, measured along the wall axis. */
export interface WallOpening {
  id: string;
  kind: "door" | "window";
  /** Distance from wall start to opening start (canvas units, clamped). */
  start: number;
  /** Distance from wall start to opening end (canvas units, clamped). */
  end: number;
}

export interface Span {
  start: number;
  end: number;
}

export interface SegmentProjection {
  /** Normalized position along the segment, clamped to [0, 1]. */
  t: number;
  /** Distance from segment start to the projected point (canvas units). */
  along: number;
  /** Perpendicular distance from the point to the segment (canvas units). */
  distance: number;
  /** The projected point on the segment. */
  point: Point2;
}

/** Extra perpendicular slack beyond half the wall thickness (canvas units). */
const PERPENDICULAR_TOLERANCE = 6;
/** Openings narrower than this after clamping are ignored (canvas units). */
const MIN_OPENING_WIDTH = 2;

export function projectPointOntoSegment(point: Point2, start: Point2, end: Point2): SegmentProjection {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) {
    return {
      t: 0,
      along: 0,
      distance: Math.hypot(point.x - start.x, point.y - start.y),
      point: { x: start.x, y: start.y },
    };
  }

  const raw = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSq;
  const t = Math.max(0, Math.min(1, raw));
  const projected = { x: start.x + dx * t, y: start.y + dy * t };
  return {
    t,
    along: t * Math.sqrt(lengthSq),
    distance: Math.hypot(point.x - projected.x, point.y - projected.y),
    point: projected,
  };
}

export function wallLength(wall: Pick<WallSegmentSpec, "start" | "end">): number {
  return Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
}

/**
 * Finds the candidates that actually sit on this wall and converts them to
 * clamped intervals along the wall axis, sorted by start position.
 *
 * A candidate counts as "on the wall" when its center is within
 * `thickness / 2 + tolerance` of the wall axis and its interval overlaps the
 * wall by at least MIN_OPENING_WIDTH.
 */
export function computeWallOpenings(
  wall: WallSegmentSpec,
  candidates: readonly OpeningCandidate[],
  tolerance: number = PERPENDICULAR_TOLERANCE,
): WallOpening[] {
  const length = wallLength(wall);
  if (length <= 0) return [];

  const maxDistance = wall.thickness / 2 + tolerance;
  const openings: WallOpening[] = [];

  for (const candidate of candidates) {
    if (candidate.width <= 0) continue;
    const projection = projectPointOntoSegment(candidate.center, wall.start, wall.end);
    if (projection.distance > maxDistance) continue;

    const start = Math.max(0, projection.along - candidate.width / 2);
    const end = Math.min(length, projection.along + candidate.width / 2);
    if (end - start < MIN_OPENING_WIDTH) continue;

    openings.push({ id: candidate.id, kind: candidate.kind, start, end });
  }

  openings.sort((a, b) => a.start - b.start);
  return openings;
}

/**
 * Subtracts openings from [0, length] and returns the remaining solid spans.
 * Overlapping openings merge; spans narrower than MIN_OPENING_WIDTH drop out.
 */
export function computeSolidSpans(length: number, openings: readonly Span[]): Span[] {
  if (length <= 0) return [];

  const sorted = [...openings]
    .map((opening) => ({
      start: Math.max(0, Math.min(length, opening.start)),
      end: Math.max(0, Math.min(length, opening.end)),
    }))
    .filter((opening) => opening.end > opening.start)
    .sort((a, b) => a.start - b.start);

  const spans: Span[] = [];
  let cursor = 0;
  for (const opening of sorted) {
    if (opening.start > cursor) {
      spans.push({ start: cursor, end: opening.start });
    }
    cursor = Math.max(cursor, opening.end);
  }
  if (cursor < length) {
    spans.push({ start: cursor, end: length });
  }

  return spans.filter((span) => span.end - span.start >= MIN_OPENING_WIDTH);
}

export interface WallAttachment {
  wallId: string;
  /** Normalized position along the wall, clamped to [0, 1]. */
  t: number;
  /** Distance from wall start (canvas units). */
  along: number;
  /** Perpendicular distance from the queried point (canvas units). */
  distance: number;
  /** Point on the wall axis. */
  point: Point2;
  /** Wall axis angle in radians (atan2 convention). */
  angle: number;
  /** Wall thickness in canvas units. */
  thickness: number;
}

/**
 * Finds the nearest wall whose axis passes within `maxDistance` of `point`.
 * Used to align a door/window to the wall it visually sits on.
 */
export function findWallAttachment(
  walls: readonly WallSegmentSpec[],
  point: Point2,
  maxDistance?: number,
): WallAttachment | null {
  let best: WallAttachment | null = null;

  for (const wall of walls) {
    const length = wallLength(wall);
    if (length <= 0) continue;

    const limit = maxDistance ?? wall.thickness / 2 + PERPENDICULAR_TOLERANCE;
    const projection = projectPointOntoSegment(point, wall.start, wall.end);
    if (projection.distance > limit) continue;
    if (best && projection.distance >= best.distance) continue;

    best = {
      wallId: wall.id,
      t: projection.t,
      along: projection.along,
      distance: projection.distance,
      point: projection.point,
      angle: Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x),
      thickness: wall.thickness,
    };
  }

  return best;
}

/**
 * Plan-space footprint (canvas units) of a door shape. The door's local
 * origin is its hinge corner; the frame occupies x ∈ [0, width], y ∈ [0, depth].
 */
export function doorPlanSize(props: { widthMm: number; thicknessMm: number }): {
  width: number;
  depth: number;
} {
  return {
    width: Math.max(1, mmToCanvasUnits(props.widthMm)),
    depth: Math.max(1, mmToCanvasUnits(props.thicknessMm)),
  };
}

/**
 * Plan-space footprint (canvas units) of a window shape. `heightMm` is the
 * window's elevation height, so the plan depth derives from the frame
 * thickness instead (clamped to read clearly against typical walls).
 */
export function windowPlanSize(props: { widthMm: number; frameThicknessMm?: number }): {
  width: number;
  depth: number;
} {
  const frameMm = props.frameThicknessMm && props.frameThicknessMm > 0 ? props.frameThicknessMm : 50;
  return {
    width: Math.max(1, mmToCanvasUnits(props.widthMm)),
    depth: Math.min(14, Math.max(8, mmToCanvasUnits(frameMm * 2))),
  };
}

/**
 * Center of a rectangle whose local origin is (0, 0), placed at page position
 * (x, y) with rotation in radians — matches canvas shape transforms.
 */
export function rectCenterAt(
  x: number,
  y: number,
  width: number,
  depth: number,
  rotation: number,
): Point2 {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const cx = width / 2;
  const cy = depth / 2;
  return {
    x: x + cx * cos - cy * sin,
    y: y + cx * sin + cy * cos,
  };
}
