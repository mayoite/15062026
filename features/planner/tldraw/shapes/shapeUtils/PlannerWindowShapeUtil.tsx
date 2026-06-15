/**
 * PlannerWindowShapeUtil - tldraw ShapeUtil for window elements
 *
 * Props store real millimetres; the plan footprint converts to canvas units
 * (1 unit = 10 mm) via windowPlanSize. `heightMm` is the window's elevation
 * height (used by the 3D viewer), so the plan depth derives from the frame.
 * Drawn as the standard architectural plan symbol: frame outline with a
 * double glazing line.
 */

import { Rectangle2d, ShapeUtil, SVGContainer, type TLShapePartial } from "@tldraw/editor";
import { windowPlanSize } from "@/features/planner/lib/geometry/wallOpenings";
import { applyWindowWallSnap, resolveOpeningWallSnap } from "@/features/planner/tldraw/tools/openingWallSnap";
import { TldrawWindowShapeProps } from "../tldrawShapeRegistry";
import type { PlannerWindowTLShape } from "../tldrawShapeTypes";

export class PlannerWindowShapeUtil extends ShapeUtil<PlannerWindowTLShape> {
  static override type = "planner-window" as const;
  static override props = TldrawWindowShapeProps;

  getDefaultProps(): PlannerWindowTLShape["props"] {
    return {
      windowType: "single",
      widthMm: 1200,
      heightMm: 1200,
      sillHeightMm: 900,
      wallId: "",
      wallPosition: 0.5,
      isAttached: false,
      hasFrame: true,
      frameThicknessMm: 50,
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

  override onTranslate(
    _initial: PlannerWindowTLShape,
    current: PlannerWindowTLShape,
  ): TLShapePartial<PlannerWindowTLShape> | void {
    return applyWindowWallSnap(this.editor, current) ?? undefined;
  }

  override onTranslateEnd(
    initial: PlannerWindowTLShape,
    current: PlannerWindowTLShape,
  ): TLShapePartial<PlannerWindowTLShape> | void {
    const snap = resolveOpeningWallSnap(this.editor, current);
    if (snap?.blocked) {
      return {
        id: initial.id,
        type: "planner-window",
        x: initial.x,
        y: initial.y,
        rotation: initial.rotation,
        props: {
          ...initial.props,
          strokeColor: "var(--color-primary)",
        },
      };
    }
    const patch = applyWindowWallSnap(this.editor, current);
    return patch ?? undefined;
  }

  getGeometry(shape: PlannerWindowTLShape) {
    const { width: w, depth: h } = windowPlanSize(shape.props);
    return new Rectangle2d({ x: 0, y: 0, width: w, height: h, isFilled: true });
  }

  component(shape: PlannerWindowTLShape) {
    const { width: w, depth: h } = windowPlanSize(shape.props);
    const { glassColor, frameColor, strokeColor } = shape.props;
    const conflict = strokeColor === "var(--color-danger)";
    const jambWidth = Math.max(1.5, h / 5);

    return (
      <SVGContainer style={{ opacity: conflict ? 0.55 : 1 }}>
        <g stroke={conflict ? "var(--color-danger)" : (frameColor || "var(--color-primary)")} strokeWidth={1} fill="none">
          {/* Glass background fill */}
          <rect
            x={0}
            y={0}
            width={w}
            height={h}
            fill={glassColor || "var(--surface-glass)"}
            stroke="none"
          />

          {/* Frame outline */}
          <rect x={0} y={0} width={w} height={h} />

          {/* Jambs at either side of the opening */}
          <rect x={0} y={0} width={jambWidth} height={h} fill={frameColor || "var(--color-primary)"} />
          <rect x={w - jambWidth} y={0} width={jambWidth} height={h} fill={frameColor || "var(--color-primary)"} />

          {/* Double glazing lines */}
          <line
            x1={jambWidth}
            y1={h / 3}
            x2={w - jambWidth}
            y2={h / 3}
            strokeWidth={1}
            opacity={0.85}
          />
          <line
            x1={jambWidth}
            y1={(2 * h) / 3}
            x2={w - jambWidth}
            y2={(2 * h) / 3}
            strokeWidth={1}
            opacity={0.85}
          />
        </g>
      </SVGContainer>
    );
  }

  getIndicatorPath(shape: PlannerWindowTLShape) {
    const { width: w, depth: h } = windowPlanSize(shape.props);
    const path = new Path2D();
    path.rect(0, 0, w, h);
    return path;
  }
}
