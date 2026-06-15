/**
 * PlannerRoomShapeUtil - tldraw ShapeUtil for room polygons
 */

import { Polygon2d, ShapeUtil, SVGContainer, Vec } from "@tldraw/editor";
import { useEditor } from "tldraw";
import { canvasUnitsToMillimeters, millimetersToCanvasUnits } from "@/features/planner/lib/calibrationScale";
import { TldrawRoomShapeProps } from "../tldrawShapeRegistry";
import type { PlannerRoomTLShape } from "../tldrawShapeTypes";
import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";

/** Convert square metres to square feet. */
const SQM_TO_SQFT = 10.7639;

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
  const unitSystem = usePlannerWorkspaceStore((s) => s.unitSystem);
  const mmPerUnit = usePlannerWorkspaceStore((s) => s.blueprint.mmPerUnit);
  const { widthMm, heightMm } = shape.props;
  const widthUnits = Math.max(1, widthMm);
  const heightUnits = Math.max(1, heightMm);
  const widthMetricMm = canvasUnitsToMillimeters(widthUnits, mmPerUnit);
  const heightMetricMm = canvasUnitsToMillimeters(heightUnits, mmPerUnit);

  const areaText =
    unitSystem === "imperial"
      ? `${(displayArea * SQM_TO_SQFT).toFixed(1)} ft²`
      : `${displayArea.toFixed(1)} m²`;

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
        const promptUnit = unitSystem === "imperial" ? "feet" : "meters";
        const currentW = unitSystem === "imperial" ? (widthMetricMm / 1000) * 3.28084 : widthMetricMm / 1000;
        const currentH = unitSystem === "imperial" ? (heightMetricMm / 1000) * 3.28084 : heightMetricMm / 1000;
        const next = window.prompt(
          `Room dimensions in ${promptUnit} (width x depth)`,
          `${currentW.toFixed(1)} x ${currentH.toFixed(1)}`
        );
        if (!next) return;
        const match = next.match(/^\\s*(\\d+(?:\\.\\d+)?)\\s*(?:x|,|by)\\s*(\\d+(?:\\.\\d+)?)\\s*$/i);
        if (!match) return;
        let nextWidth = Number(match[1]);
        let nextHeight = Number(match[2]);
        if (!Number.isFinite(nextWidth) || !Number.isFinite(nextHeight) || nextWidth <= 0 || nextHeight <= 0) return;
        // Convert imperial input to metric for storage
        if (unitSystem === "imperial") {
          nextWidth = nextWidth / 3.28084;
          nextHeight = nextHeight / 3.28084;
        }
        const nextWidthMm = nextWidth * 1000;
        const nextHeightMm = nextHeight * 1000;
        const nextWidthPx = millimetersToCanvasUnits(nextWidthMm, mmPerUnit);
        const nextHeightPx = millimetersToCanvasUnits(nextHeightMm, mmPerUnit);
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
            areaSqm: (nextWidthMm * nextHeightMm) / 1000000,
            perimeterMm: Math.round((nextWidthMm + nextHeightMm) * 2),
          },
        });
      }}
    >
      {areaText}
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
