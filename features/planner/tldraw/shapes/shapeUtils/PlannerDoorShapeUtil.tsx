/**
 * PlannerDoorShapeUtil - tldraw ShapeUtil for door elements
 *
 * Props store real millimetres; rendering converts to canvas units
 * (1 unit = 10 mm) via doorPlanSize, so a 900 mm door measures 90 units —
 * matching wall scale and the openings cut by PlannerWallShapeUtil.
 */

import { Rectangle2d, ShapeUtil, SVGContainer } from "@tldraw/editor";
import { doorPlanSize } from "@/features/planner/lib/geometry/wallOpenings";
import { TldrawDoorShapeProps } from "../tldrawShapeRegistry";
import type { PlannerDoorTLShape } from "../tldrawShapeTypes";

export class PlannerDoorShapeUtil extends ShapeUtil<PlannerDoorTLShape> {
  static override type = "planner-door" as const;
  static override props = TldrawDoorShapeProps;

  getDefaultProps(): PlannerDoorTLShape["props"] {
    return {
      doorType: "single",
      swingDirection: "right",
      swingAngle: 90,
      widthMm: 900,
      thicknessMm: 40,
      wallId: "",
      wallPosition: 0.5,
      isAttached: false,
      showSwingArc: true,
      showDoorPanel: true,
      showFrame: true,
      isActiveLeaf: "both",
      frameColor: "var(--color-primary)",
      panelColor: "var(--color-accent-soft)",
      color: "var(--color-primary)",
      fillColor: "var(--color-accent-soft)",
      strokeColor: "var(--color-primary)",
      strokeWidth: 2,
    };
  }

  getGeometry(shape: PlannerDoorTLShape) {
    const { width: w, depth: h } = doorPlanSize(shape.props);
    const isLeft = shape.props.swingDirection === "left";
    return new Rectangle2d({
      x: 0,
      y: isLeft ? -w : 0,
      width: w,
      height: Math.max(h, w),
      isFilled: true,
    });
  }

  component(shape: PlannerDoorTLShape) {
    const { width: w, depth: h } = doorPlanSize(shape.props);
    const { swingDirection, swingAngle, showSwingArc, showDoorPanel, frameColor, panelColor } = shape.props;

    const angleRad = (swingAngle * Math.PI) / 180;
    const dir = swingDirection === "left" ? -1 : 1;

    const px = w * Math.cos(angleRad * dir);
    const py = w * Math.sin(angleRad * dir);

    const sweepFlag = swingDirection === "left" ? 0 : 1;
    const arcPath = `M ${w} ${h / 2} A ${w} ${w} 0 0 ${sweepFlag} ${px} ${py}`;
    const jambWidth = Math.max(1.5, h / 2);

    return (
      <SVGContainer>
        <g stroke={frameColor || "var(--color-primary)"} strokeWidth={1} fill="none">
          {/* Threshold line across the wall opening */}
          <line x1={0} y1={h / 2} x2={w} y2={h / 2} strokeDasharray="3 3" opacity={0.5} />

          {/* Door jambs (frame posts at either side of the opening) */}
          <rect x={0} y={0} width={jambWidth} height={h} fill={frameColor || "var(--color-primary)"} />
          <rect x={w - jambWidth} y={0} width={jambWidth} height={h} fill={frameColor || "var(--color-primary)"} />

          {/* Door leaf, hinged at the origin jamb */}
          {showDoorPanel && (
            <line
              x1={0}
              y1={h / 2}
              x2={px}
              y2={py}
              stroke={panelColor || "var(--color-accent)"}
              strokeWidth={Math.max(1.5, h * 0.6)}
              strokeLinecap="round"
            />
          )}

          {/* Swing arc */}
          {showSwingArc && (
            <path
              d={arcPath}
              stroke={panelColor || "var(--color-accent)"}
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.7}
            />
          )}
        </g>
      </SVGContainer>
    );
  }

  getIndicatorPath(shape: PlannerDoorTLShape) {
    const { width: w, depth: h } = doorPlanSize(shape.props);
    const isLeft = shape.props.swingDirection === "left";
    const path = new Path2D();
    path.rect(0, isLeft ? -w : 0, w, Math.max(h, w));
    return path;
  }
}
