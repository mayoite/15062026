/**
 * PlannerWallShapeUtil - tldraw ShapeUtil for wall segments
 *
 * Renders as a proper filled rotated rectangle (architectural style),
 * not a stroked line. The rectangle is centred on the wall axis and
 * computed via perpendicular offsets so diagonal walls look correct.
 */

import { Polygon2d, ShapeUtil, SVGContainer, Vec } from "@tldraw/editor";
import { useEditor } from "tldraw";
import { TldrawWallShapeProps } from "../tldrawShapeRegistry";
import type { PlannerWallTLShape } from "../tldrawShapeTypes";

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
  const { startX, startY, endX, endY, lengthMm } = shape.props;
  const label = lengthMm >= 1000
    ? `${(lengthMm / 1000).toFixed(2)} m`
    : `${lengthMm} mm`;

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
        const currentM = lengthMm / 1000;
        const next = window.prompt("Wall length in meters", currentM.toFixed(2));
        if (!next) return;
        const nextM = Number(next);
        if (!Number.isFinite(nextM) || nextM <= 0) return;
        const currentLen = Math.hypot(endX - startX, endY - startY) || 1;
        const nextLenPx = nextM * 100;
        const scale = nextLenPx / currentLen;
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

export class PlannerWallShapeUtil extends ShapeUtil<PlannerWallTLShape> {
  static override type = "planner-wall" as const;
  static override props = TldrawWallShapeProps;

  getDefaultProps(): PlannerWallTLShape["props"] {
    return {
      startX: 0,
      startY: 0,
      endX: 120,
      endY: 0,
      thickness: 8,
      lengthMm: 1200,
      material: "drywall",
      isLoadBearing: false,
      isExterior: false,
      hasJunctionStart: false,
      hasJunctionEnd: false,
      showDimensions: true,
      showMaterial: false,
      color: "var(--color-primary)",
      fillColor: "var(--color-primary)",
      strokeColor: "var(--color-primary)",
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
    const {
      startX, startY, endX, endY, thickness,
      isLoadBearing, isExterior,
      color, strokeColor,
      showDimensions,
    } = shape.props;
    const t = Math.max(1, thickness);

    const pts = wallRectPoints(startX, startY, endX, endY, t);
    const d = pointsToSVGPath(pts);

    // Colour roles map to semantic tokens.
    const fillCol = isExterior
      ? "var(--surface-inverse)"
      : isLoadBearing
        ? "var(--color-accent-strong)"
        : (color || "var(--color-primary)");
    const strokeCol = isExterior
      ? "var(--text-inverse)"
      : isLoadBearing
        ? "var(--color-accent)"
        : (strokeColor || fillCol);

    // Dimension label parameters
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const dx = endX - startX;
    const dy = endY - startY;
    const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
    // Label sits above the wall (perpendicular offset = half-thickness + small gap)
    const labelOffsetY = -(t / 2 + 4);

    return (
      <SVGContainer>
        {/* Filled wall body */}
        <path
          d={d}
          fill={fillCol}
          stroke={strokeCol}
          strokeWidth={1}
          strokeLinejoin="miter"
        />

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

  getIndicatorPath(shape: PlannerWallTLShape) {
    const { startX, startY, endX, endY, thickness } = shape.props;
    const t = Math.max(1, thickness);
    const pts = wallRectPoints(startX, startY, endX, endY, t);
    return new Path2D(pointsToSVGPath(pts));
  }
}
