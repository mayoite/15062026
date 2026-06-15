/**
 * PlannerWindowShapeUtil - tldraw ShapeUtil for window elements
 */

import { Rectangle2d, ShapeUtil, SVGContainer } from "@tldraw/editor";
import { TldrawWindowShapeProps } from "../tldrawShapeRegistry";
import type { PlannerWindowTLShape } from "../tldrawShapeTypes";

export class PlannerWindowShapeUtil extends ShapeUtil<PlannerWindowTLShape> {
  static override type = "planner-window" as const;
  static override props = TldrawWindowShapeProps;

  getDefaultProps(): PlannerWindowTLShape["props"] {
    return {
      windowType: "single",
      widthMm: 100,
      heightMm: 20,
      sillHeightMm: 90,
      wallId: "",
      wallPosition: 0.5,
      isAttached: false,
      hasFrame: true,
      frameThicknessMm: 4,
      hasSill: true,
      hasMullions: false,
      mullionCount: 0,
      isOperable: true,
      opensDirection: "out",
      showGlass: true,
      showFrame: true,
      showSill: true,
      glassColor: "var(--surface-glass)",
      frameColor: "var(--color-primary)",
      color: "var(--color-primary)",
      fillColor: "var(--surface-glass)",
      strokeColor: "var(--color-primary)",
      strokeWidth: 2,
    };
  }

  getGeometry(shape: PlannerWindowTLShape) {
    const w = Math.max(1, shape.props.widthMm);
    const h = Math.max(1, shape.props.heightMm);
    return new Rectangle2d({ x: 0, y: 0, width: w, height: h, isFilled: true });
  }

  component(shape: PlannerWindowTLShape) {
    const w = Math.max(1, shape.props.widthMm);
    const h = Math.max(1, shape.props.heightMm);
    const { glassColor, frameColor, strokeWidth } = shape.props;

    return (
      <SVGContainer>
        <g stroke={frameColor || "var(--color-primary)"} strokeWidth={strokeWidth ?? 2} fill="none">
          {/* Glass background fill */}
          <rect
            x={0}
            y={0}
            width={w}
            height={h}
            fill={glassColor || "var(--surface-glass)"}
            stroke="none"
          />
          
          {/* Outer Frame boundaries */}
          <line x1={0} y1={0} x2={w} y2={0} />
          <line x1={0} y1={h} x2={w} y2={h} />
          
          {/* Side frame posts */}
          <rect x={0} y={0} width={4} height={h} fill={frameColor || "var(--color-primary)"} />
          <rect x={w - 4} y={0} width={4} height={h} fill={frameColor || "var(--color-primary)"} />
          
          {/* Glass pane centerline */}
          <line
            x1={4}
            y1={h / 2}
            x2={w - 4}
            y2={h / 2}
            stroke={frameColor || "var(--color-primary)"}
            strokeWidth={1.5}
            opacity={0.8}
          />
        </g>
      </SVGContainer>
    );
  }

  getIndicatorPath(shape: PlannerWindowTLShape) {
    const w = Math.max(1, shape.props.widthMm);
    const h = Math.max(1, shape.props.heightMm);
    const path = new Path2D();
    path.rect(0, 0, w, h);
    return path;
  }
}
