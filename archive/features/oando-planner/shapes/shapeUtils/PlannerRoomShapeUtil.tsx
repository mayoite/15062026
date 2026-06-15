/**
 * PlannerRoomShapeUtil - tldraw ShapeUtil for room polygons
 */

import { Polygon2d, ShapeUtil, SVGContainer, Vec } from "@tldraw/editor";
import { useEditor } from "tldraw";
import { TldrawRoomShapeProps } from "../tldrawShapeRegistry";
import type { PlannerRoomTLShape } from "../tldrawShapeTypes";

function EditableRoomDimensionLabel({
  shape,
  x,
  y,
  displayArea,
}: {
  shape: PlannerRoomTLShape;
  x: number;
  y: number;
  displayArea: number;
}) {
  const editor = useEditor();
  const { widthMm, heightMm } = shape.props;

  return (
    <text
      x={x}
      y={y}
      role="button"
      aria-label="Edit room dimensions"
      fill="var(--color-accent)"
      fontSize={10}
      fontFamily="var(--font-sans)"
      fontWeight="500"
      textAnchor="middle"
      stroke="var(--surface-page)"
      strokeWidth={2.5}
      paintOrder="stroke"
      style={{ cursor: "text", pointerEvents: "all" }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        const next = window.prompt("Room dimensions in meters (width x depth)", `${(widthMm / 100).toFixed(1)} x ${(heightMm / 100).toFixed(1)}`);
        if (!next) return;
        const match = next.match(/^\s*(\d+(?:\.\d+)?)\s*(?:x|,|by)\s*(\d+(?:\.\d+)?)\s*$/i);
        if (!match) return;
        const nextWidth = Number(match[1]);
        const nextHeight = Number(match[2]);
        if (!Number.isFinite(nextWidth) || !Number.isFinite(nextHeight) || nextWidth <= 0 || nextHeight <= 0) return;
        const nextWidthPx = nextWidth * 100;
        const nextHeightPx = nextHeight * 100;
        editor.updateShape({
          id: shape.id,
          type: "planner-room",
          props: {
            points: [
              { x: 0, y: 0 },
              { x: nextWidthPx, y: 0 },
              { x: nextWidthPx, y: nextHeightPx },
              { x: 0, y: nextHeightPx },
            ],
            widthMm: nextWidthPx,
            heightMm: nextHeightPx,
            areaSqm: nextWidth * nextHeight,
            perimeterMm: Math.round((nextWidth + nextHeight) * 2 * 1000),
          },
        });
      }}
    >
      {displayArea.toFixed(1)} m²
    </text>
  );
}

export class PlannerRoomShapeUtil extends ShapeUtil<PlannerRoomTLShape> {
  static override type = "planner-room" as const;
  static override props = TldrawRoomShapeProps;

  getDefaultProps(): PlannerRoomTLShape["props"] {
    return {
      points: [
        { x: 0, y: 0 },
        { x: 120, y: 0 },
        { x: 120, y: 80 },
        { x: 0, y: 80 },
      ],
      roomType: "office",
      areaSqm: 0,
      perimeterMm: 0,
      floorMaterial: "carpet",
      widthMm: 120,
      heightMm: 80,
      showArea: true,
      showPerimeter: false,
      fillOpacity: 0.3,
      label: "Room",
      showLabel: true,
      color: "var(--color-primary)",
      fillColor: "var(--surface-glass)",
      strokeColor: "var(--color-primary)",
      strokeWidth: 2,
    };
  }

  private getPoints(shape: PlannerRoomTLShape): Vec[] {
    const points = shape.props.points ?? [];
    if (points.length >= 3) return points.map((p) => new Vec(p.x, p.y));
    return [new Vec(0, 0), new Vec(120, 0), new Vec(120, 80), new Vec(0, 80)];
  }

  getGeometry(shape: PlannerRoomTLShape) {
    return new Polygon2d({ points: this.getPoints(shape), isFilled: true });
  }

  component(shape: PlannerRoomTLShape) {
    const points = this.getPoints(shape);
    if (points.length < 3) return null;
    const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

    const { label, showLabel, showArea, areaSqm, fillColor, strokeColor, color, strokeWidth } = shape.props;

    const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length;

    let displayArea = areaSqm;
    if (displayArea === 0) {
      let shoelaceArea = 0;
      for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        shoelaceArea += points[i].x * points[j].y;
        shoelaceArea -= points[j].x * points[i].y;
      }
      displayArea = (Math.abs(shoelaceArea) / 2) * 0.0001;
    }

    return (
      <SVGContainer>
        <path
          d={d}
          fill={fillColor ?? "var(--surface-glass)"}
          stroke={strokeColor ?? color ?? "var(--color-primary)"}
          strokeWidth={strokeWidth ?? 2}
        />
        {showLabel && (
          <g transform={`translate(${cx}, ${cy})`} style={{ pointerEvents: "none" }}>
            <text
              x={0}
              y={showArea ? -4 : 4}
              fill="var(--color-primary)"
              fontSize={13}
              fontFamily="var(--font-sans)"
              fontWeight="600"
              textAnchor="middle"
              stroke="var(--surface-page)"
              strokeWidth={2.5}
              paintOrder="stroke"
            >
              {label || "Room"}
            </text>
            {showArea && (
              <EditableRoomDimensionLabel
                shape={shape}
                x={0}
                y={12}
                displayArea={displayArea}
              />
            )}
          </g>
        )}
      </SVGContainer>
    );
  }

  getIndicatorPath(shape: PlannerRoomTLShape) {
    const points = this.getPoints(shape);
    const path = new Path2D();
    path.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) path.lineTo(points[i].x, points[i].y);
    path.closePath();
    return path;
  }
}
