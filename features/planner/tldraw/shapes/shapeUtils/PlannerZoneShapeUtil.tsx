/**
 * PlannerZoneShapeUtil - tldraw ShapeUtil for zone overlays
 */

import { Polygon2d, ShapeUtil, SVGContainer, Vec } from "@tldraw/editor";
import { TldrawZoneShapeProps } from "../tldrawShapeRegistry";
import type { PlannerZoneTLShape } from "../tldrawShapeTypes";
import { plannerCanvasUnits } from "./catalogBlockBridge";

export class PlannerZoneShapeUtil extends ShapeUtil<PlannerZoneTLShape> {
  static override type = "planner-zone" as const;
  static override props = TldrawZoneShapeProps;

  getDefaultProps(): PlannerZoneTLShape["props"] {
    return {
      points: [
        { x: 0, y: 0 },
        { x: 140, y: 0 },
        { x: 140, y: 90 },
        { x: 0, y: 90 },
      ],
      zoneType: "focus",
      areaSqm: 0,
      capacity: 0,
      currentOccupancy: 0,
      widthMm: 140,
      heightMm: 90,
      areaPerPerson: 10,
      maxCapacity: 0,
      showBoundary: true,
      showFill: true,
      showCapacity: true,
      showOccupancy: false,
      fillPattern: "solid",
      dashArray: [],
      zoneColor: "var(--color-ocean-boat-blue-500)",
      fillColor: "var(--surface-glass)",
      label: "Zone",
      showLabel: true,
      color: "var(--color-primary)",
      strokeColor: "var(--color-primary)",
      strokeWidth: 2,
    };
  }

  private getPoints(shape: PlannerZoneTLShape): Vec[] {
    const points = shape.props.points ?? [];
    if (points.length >= 3) {
      return points.map((p) => new Vec(
        p.x === 0 ? 0 : plannerCanvasUnits(p.x, p.y),
        p.y === 0 ? 0 : plannerCanvasUnits(p.y, p.x),
      ));
    }
    return [new Vec(0, 0), new Vec(140, 0), new Vec(140, 90), new Vec(0, 90)];
  }

  getGeometry(shape: PlannerZoneTLShape) {
    return new Polygon2d({ points: this.getPoints(shape), isFilled: true });
  }

  component(shape: PlannerZoneTLShape) {
    const points = this.getPoints(shape);
    if (points.length < 3) return null;
    const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

    const { label, showLabel, zoneType, fillColor, strokeColor, color, strokeWidth } = shape.props;

    const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length;

    return (
      <SVGContainer>
        <path
          d={d}
          fill={fillColor ?? "var(--surface-glass)"}
          stroke={strokeColor ?? color ?? "var(--color-primary)"}
          strokeWidth={strokeWidth ?? 2}
          strokeDasharray="4 4"
        />
        {showLabel && (
          <g transform={`translate(${cx}, ${cy})`} style={{ pointerEvents: "none" }}>
            <text
              x={0}
              y={0}
              fill="var(--color-primary)"
              fontSize={12}
              fontFamily="var(--font-sans)"
              fontWeight="600"
              textAnchor="middle"
              stroke="var(--surface-page)"
              strokeWidth={2}
              paintOrder="stroke"
            >
              {label || "Zone"} ({zoneType})
            </text>
          </g>
        )}
      </SVGContainer>
    );
  }

  getIndicatorPath(shape: PlannerZoneTLShape) {
    const points = this.getPoints(shape);
    const path = new Path2D();
    path.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) path.lineTo(points[i].x, points[i].y);
    path.closePath();
    return path;
  }
}
