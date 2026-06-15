/**
 * PlannerMeasurementShapeUtil - tldraw ShapeUtil for measurement lines
 */

import { Rectangle2d, ShapeUtil, SVGContainer } from "@tldraw/editor";
import { useEditor } from "tldraw";
import { canvasUnitsToMillimeters, millimetersToCanvasUnits } from "@/features/planner/lib/calibrationScale";
import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";
import { TldrawMeasurementShapeProps } from "../tldrawShapeRegistry";
import type { PlannerMeasurementTLShape } from "../tldrawShapeTypes";

function EditableMeasurementLabel({
  shape,
  x,
  y,
  angleDeg,
  displayValue,
}: {
  shape: PlannerMeasurementTLShape;
  x: number;
  y: number;
  angleDeg: number;
  displayValue: string;
}) {
  const editor = useEditor();
  const mmPerUnit = usePlannerWorkspaceStore((s) => s.blueprint.mmPerUnit);
  const { startX, startY, endX, endY, fontSize, textColor } = shape.props;
  const geometryLengthMm = canvasUnitsToMillimeters(
    Math.hypot(endX - startX, endY - startY),
    mmPerUnit,
  );

  return (
    <g transform={`translate(${x}, ${y}) rotate(${angleDeg})`}>
      <rect
        x={-35}
        y={-fontSize / 2 - 2}
        width={70}
        height={fontSize + 4}
        fill="var(--surface-page)"
        stroke="none"
      />
      <text
        x={0}
        y={fontSize / 3}
        role="button"
        aria-label="Edit measurement length"
        fill={textColor || "var(--color-primary)"}
        stroke="none"
        fontSize={fontSize}
        fontFamily="var(--font-sans)"
        fontWeight="500"
        textAnchor="middle"
        style={{ cursor: "text", pointerEvents: "all" }}
        onDoubleClick={(event) => {
          event.stopPropagation();
          const next = window.prompt("Measurement length in meters", (geometryLengthMm / 1000).toFixed(2));
          if (!next) return;
          const nextM = Number(next);
          if (!Number.isFinite(nextM) || nextM <= 0) return;
          const currentLen = Math.hypot(endX - startX, endY - startY) || 1;
          const nextLenUnits = millimetersToCanvasUnits(nextM * 1000, mmPerUnit);
          const scale = nextLenUnits / currentLen;
          editor.updateShape({
            id: shape.id,
            type: "planner-measurement",
            props: {
              endX: startX + (endX - startX) * scale,
              endY: startY + (endY - startY) * scale,
              lengthMm: Math.round(nextM * 1000),
            },
          });
        }}
      >
        {displayValue}
      </text>
    </g>
  );
}

export class PlannerMeasurementShapeUtil extends ShapeUtil<PlannerMeasurementTLShape> {
  static override type = "planner-measurement" as const;
  static override props = TldrawMeasurementShapeProps;

  getDefaultProps(): PlannerMeasurementTLShape["props"] {
    return {
      startX: 0,
      startY: 0,
      endX: 120,
      endY: 0,
      lengthMm: 1200,
      unit: "mm",
      orientation: "horizontal",
      offset: 0,
      showValue: true,
      showUnit: true,
      precision: 0,
      showArrows: true,
      arrowSize: 8,
      arrowStyle: "filled",
      showExtensionLines: true,
      extensionLength: 10,
      referenceIds: [],
      referenceType: "custom",
      textColor: "var(--color-primary)",
      lineColor: "var(--color-accent)",
      fontSize: 12,
      color: "var(--color-accent)",
      strokeColor: "var(--color-accent)",
      strokeWidth: 1,
      fillColor: "var(--color-accent)",
    };
  }

  getGeometry(shape: PlannerMeasurementTLShape) {
    const { startX, startY, endX, endY } = shape.props;

    const minX = Math.min(startX, endX) - 6;
    const minY = Math.min(startY, endY) - 6;
    const w = Math.max(1, Math.abs(endX - startX) + 12);
    const h = Math.max(1, Math.abs(endY - startY) + 12);

    return new Rectangle2d({ x: minX, y: minY, width: w, height: h, isFilled: true });
  }

  component(shape: PlannerMeasurementTLShape) {
    return <MeasurementBody shape={shape} />;
  }

  getIndicatorPath(shape: PlannerMeasurementTLShape) {
    const { startX, startY, endX, endY } = shape.props;

    const minX = Math.min(startX, endX) - 6;
    const minY = Math.min(startY, endY) - 6;
    const w = Math.max(1, Math.abs(endX - startX) + 12);
    const h = Math.max(1, Math.abs(endY - startY) + 12);

    const path = new Path2D();
    path.rect(minX, minY, w, h);
    return path;
  }
}

function MeasurementBody({ shape }: { shape: PlannerMeasurementTLShape }) {
  const mmPerUnit = usePlannerWorkspaceStore((s) => s.blueprint.mmPerUnit);
  const { startX, startY, endX, endY, lineColor, strokeWidth, showValue } = shape.props;

  const dx = endX - startX;
  const dy = endY - startY;
  const len = Math.hypot(dx, dy);
  if (len < 1) return null;

  const angleRad = Math.atan2(dy, dx);
  const angleDeg = (angleRad * 180) / Math.PI;

  const mx = (startX + endX) / 2;
  const my = (startY + endY) / 2;

  const lengthMm = canvasUnitsToMillimeters(len, mmPerUnit);
  const displayValue = lengthMm >= 1000
    ? `${(lengthMm / 1000).toFixed(2)} m`
    : `${Math.round(lengthMm)} mm`;

  const tickLen = 6;
  const tickPath = (cx: number, cy: number) => {
    const dx1 = tickLen * Math.cos(angleRad + Math.PI / 4);
    const dy1 = tickLen * Math.sin(angleRad + Math.PI / 4);
    return `M ${cx - dx1} ${cy - dy1} L ${cx + dx1} ${cy + dy1}`;
  };

  return (
    <SVGContainer>
      <g stroke={lineColor || "var(--color-accent)"} strokeWidth={strokeWidth ?? 1.5} fill="none">
        <line x1={startX} y1={startY} x2={endX} y2={endY} />

        <path d={`${tickPath(startX, startY)} ${tickPath(endX, endY)}`} strokeWidth={(strokeWidth ?? 1.5) * 1.5} />

        {showValue && (
          <EditableMeasurementLabel
            shape={shape}
            x={mx}
            y={my}
            angleDeg={angleDeg}
            displayValue={displayValue}
          />
        )}
      </g>
    </SVGContainer>
  );
}
