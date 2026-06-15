/**
 * PlannerWallShapeUtil - tldraw ShapeUtil for wall segments
 *
 * Renders as a proper filled rotated rectangle (architectural style),
 * not a stroked line. The rectangle is centred on the wall axis and
 * computed via perpendicular offsets so diagonal walls look correct.
 *
 * Doors and windows sitting on the wall axis cut real openings: the wall
 * body splits into solid spans with the gaps left open, the way
 * architectural plans (and planners like RoomSketcher) draw them.
 */

import { Polygon2d, ShapeUtil, SVGContainer, Vec, type Editor } from "@tldraw/editor";
import { useEditor, useValue } from "tldraw";
import { canvasUnitsToMillimeters, millimetersToCanvasUnits } from "@/features/planner/lib/calibrationScale";
import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";
import {
  computeSolidSpans,
  computeWallOpenings,
  doorPlanSize,
  rectCenterAt,
  windowPlanSize,
  type OpeningCandidate,
  type Span,
} from "@/features/planner/lib/geometry/wallOpenings";
import { TldrawWallShapeProps } from "../tldrawShapeRegistry";
import type {
  PlannerDoorTLShape,
  PlannerWallTLShape,
  PlannerWindowTLShape,
} from "../tldrawShapeTypes";

function EditableWallDimensionLabel({
  shape,
  x,
  y,
  angleDeg,
  labelOffsetY,
}: {
  shape: PlannerWallTLShape;
  x: number;
  y: number;
  angleDeg: number;
  labelOffsetY: number;
}) {
  const editor = useEditor();
  const mmPerUnit = usePlannerWorkspaceStore((s) => s.blueprint.mmPerUnit);
  const { startX, startY, endX, endY } = shape.props;
  const geometryLengthMm = canvasUnitsToMillimeters(
    Math.hypot(endX - startX, endY - startY),
    mmPerUnit,
  );
  const label = geometryLengthMm >= 1000
    ? `${(geometryLengthMm / 1000).toFixed(2)} m`
    : `${geometryLengthMm} mm`;

  return (
    <text
      x={x}
      y={y}
      role="button"
      aria-label="Edit wall length"
      textAnchor="middle"
      dominantBaseline="auto"
      fontSize={8}
      fontFamily="var(--font-sans)"
      fill="var(--text-muted)"
      style={{ cursor: "text", pointerEvents: "all" }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        const currentM = geometryLengthMm / 1000;
        const next = window.prompt("Wall length in meters", currentM.toFixed(2));
        if (!next) return;
        const nextM = Number(next);
        if (!Number.isFinite(nextM) || nextM <= 0) return;
        const currentLen = Math.hypot(endX - startX, endY - startY) || 1;
        const nextLenUnits = millimetersToCanvasUnits(nextM * 1000, mmPerUnit);
        const scale = nextLenUnits / currentLen;
        editor.updateShape({
          id: shape.id,
          type: "planner-wall",
          props: {
            endX: startX + (endX - startX) * scale,
            endY: startY + (endY - startY) * scale,
            lengthMm: Math.round(nextM * 1000),
          },
        });
      }}
      transform={`rotate(${angleDeg}, ${x}, ${y}) translate(0, ${labelOffsetY})`}
    >
      {label}
    </text>
  );
}

/** Compute the four corner points of the wall rectangle in local SVG coords. */
function wallRectPoints(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  thickness: number
): { x: number; y: number }[] {
  const dx = endX - startX;
  const dy = endY - startY;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  // Unit perpendicular (rotated 90°)
  const nx = (-dy / len) * (thickness / 2);
  const ny = (dx / len) * (thickness / 2);

  return [
    { x: startX + nx, y: startY + ny },
    { x: endX + nx,   y: endY + ny   },
    { x: endX - nx,   y: endY - ny   },
    { x: startX - nx, y: startY - ny },
  ];
}

function pointsToSVGPath(pts: { x: number; y: number }[]): string {
  return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ") + " Z";
}

/** Doors/windows on the current page, reduced to page-space opening candidates. */
function collectOpeningCandidates(editor: Editor): OpeningCandidate[] {
  const candidates: OpeningCandidate[] = [];

  for (const pageShape of editor.getCurrentPageShapes()) {
    if (pageShape.type === "planner-door") {
      const door = pageShape as PlannerDoorTLShape;
      const { width, depth } = doorPlanSize(door.props);
      candidates.push({
        id: String(door.id),
        kind: "door",
        center: rectCenterAt(door.x, door.y, width, depth, door.rotation),
        width,
      });
      continue;
    }
    if (pageShape.type === "planner-window") {
      const window = pageShape as PlannerWindowTLShape;
      const { width, depth } = windowPlanSize(window.props);
      candidates.push({
        id: String(window.id),
        kind: "window",
        center: rectCenterAt(window.x, window.y, width, depth, window.rotation),
        width,
      });
    }
  }

  return candidates;
}

/**
 * Solid spans of the wall in local axis distances. Rotated walls fall back to
 * a single solid span (tools always create walls with rotation 0).
 */
function useWallSolidSpans(shape: PlannerWallTLShape): Span[] {
  const editor = useEditor();

  return useValue(
    `wall-solid-spans-${shape.id}`,
    () => {
      const { startX, startY, endX, endY, thickness } = shape.props;
      const length = Math.hypot(endX - startX, endY - startY);
      const fullSpan: Span[] = [{ start: 0, end: length }];
      if (shape.rotation !== 0 || length === 0) return fullSpan;

      const openings = computeWallOpenings(
        {
          id: String(shape.id),
          start: { x: shape.x + startX, y: shape.y + startY },
          end: { x: shape.x + endX, y: shape.y + endY },
          thickness: Math.max(1, thickness),
        },
        collectOpeningCandidates(editor),
      );
      if (openings.length === 0) return fullSpan;
      return computeSolidSpans(length, openings);
    },
    [editor, shape],
  );
}

function WallBody({ shape }: { shape: PlannerWallTLShape }) {
  const {
    startX, startY, endX, endY, thickness,
    isLoadBearing, isExterior,
    strokeColor,
    showDimensions,
  } = shape.props;
  const t = Math.max(1, thickness);
  const spans = useWallSolidSpans(shape);

  const dx = endX - startX;
  const dy = endY - startY;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;

  // Colour roles map to semantic tokens.
  const fillCol = isExterior
    ? "var(--surface-panel)"
    : isLoadBearing
      ? "var(--surface-soft)"
      : "var(--surface-page)";
  const strokeCol = isExterior
    ? "var(--text-body)"
    : isLoadBearing
      ? "var(--color-accent)"
      : (strokeColor || "var(--text-body)");

  // Dimension label parameters
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
  // Label sits above the wall (perpendicular offset = half-thickness + small gap)
  const labelOffsetY = -(t / 2 + 4);

  return (
    <SVGContainer>
      {/* Solid wall body, split around door/window openings */}
      {spans.map((span) => {
        const pts = wallRectPoints(
          startX + ux * span.start,
          startY + uy * span.start,
          startX + ux * span.end,
          startY + uy * span.end,
          t,
        );
        return (
          <path
            key={`${span.start}-${span.end}`}
            d={pointsToSVGPath(pts)}
            fill={fillCol}
            stroke={strokeCol}
            strokeWidth={1.35}
            strokeLinejoin="miter"
          />
        );
      })}

      {/* Hatch dashes for load-bearing walls */}
      {isLoadBearing && (
        <line
          x1={startX} y1={startY}
          x2={endX}   y2={endY}
          stroke="var(--color-bronze-600)"
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.45}
        />
      )}

      {/* Dimension label */}
      {showDimensions && (
        <EditableWallDimensionLabel
          shape={shape}
          x={midX}
          y={midY}
          angleDeg={angleDeg}
          labelOffsetY={labelOffsetY}
        />
      )}
    </SVGContainer>
  );
}

export class PlannerWallShapeUtil extends ShapeUtil<PlannerWallTLShape> {
  static override type = "planner-wall" as const;
  static override props = TldrawWallShapeProps;

  getDefaultProps(): PlannerWallTLShape["props"] {
    return {
      startX: 0,
      startY: 0,
      endX: 120,
      endY: 0,
      thickness: millimetersToCanvasUnits(100),
      lengthMm: 1200,
      material: "drywall",
      isLoadBearing: false,
      isExterior: false,
      hasJunctionStart: false,
      hasJunctionEnd: false,
      showDimensions: true,
      showMaterial: false,
      color: "var(--text-body)",
      fillColor: "var(--surface-page)",
      strokeColor: "var(--text-body)",
      strokeWidth: 2,
    };
  }

  getGeometry(shape: PlannerWallTLShape) {
    const { startX, startY, endX, endY, thickness } = shape.props;
    const t = Math.max(1, thickness);
    const pts = wallRectPoints(startX, startY, endX, endY, t).map((p) => new Vec(p.x, p.y));
    return new Polygon2d({ points: pts, isFilled: true });
  }

  component(shape: PlannerWallTLShape) {
    return <WallBody shape={shape} />;
  }

  getIndicatorPath(shape: PlannerWallTLShape) {
    const { startX, startY, endX, endY, thickness } = shape.props;
    const t = Math.max(1, thickness);
    const pts = wallRectPoints(startX, startY, endX, endY, t);
    return new Path2D(pointsToSVGPath(pts));
  }
}
