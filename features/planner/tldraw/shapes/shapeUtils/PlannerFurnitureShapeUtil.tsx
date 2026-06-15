/**
 * PlannerFurnitureShapeUtil — catalog block primitives on the tldraw canvas.
 */

import { Rectangle2d, ShapeUtil, SVGContainer, type SvgExportContext, type TLShapePartial } from "@tldraw/editor";
import { BLOCK_STYLE } from "@/lib/catalog/blocks2d";
import { createPlannerSvgColorResolver } from "@/features/planner/lib/plannerSvgExportColors";
import { TldrawFurnitureShapeProps } from "../tldrawShapeRegistry";
import type { PlannerFurnitureTLShape } from "../tldrawShapeTypes";
import { applyFurnitureWallSnap } from "@/features/planner/tldraw/tools/furnitureWallSnap";
import { plannerCanvasUnits, resolveBuddyBlock2D } from "./catalogBlockBridge";
import { RenderBlockPrims } from "./renderBlockPrims";

/** Canvas footprint in planner cm units (matches wall/room geometry). */
function footprintCanvas(shape: PlannerFurnitureTLShape) {
  return {
    w: Math.max(1, plannerCanvasUnits(shape.props.widthMm, shape.props.heightMm)),
    h: Math.max(1, plannerCanvasUnits(shape.props.heightMm, shape.props.widthMm)),
  };
}

/**
 * Catalog product names are very long (e.g. "Table Top: 25mm thick Pre laminate
 * particle board with 2mm PV — 2 seater - NS (1200mm)"). SVG `<text>` does not
 * wrap or clip, so the raw name sprawls several times past the furniture
 * footprint and overlaps neighbouring shapes. Clamp the on-canvas label to the
 * number of characters that fit roughly within the footprint width.
 */
export function fitCanvasLabel(label: string, footprintWidth: number, fontSize: number): string {
  const text = label.trim();
  if (!text) return "";
  // ~0.6em average glyph advance; keep at least a few characters for tiny items.
  const maxChars = Math.max(6, Math.floor(footprintWidth / Math.max(1, fontSize * 0.6)));
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…`;
}

function FurnitureGraphic({
  shape,
  exportColors = false,
}: {
  shape: PlannerFurnitureTLShape;
  exportColors?: boolean;
}) {
  const { w, h } = footprintCanvas(shape);
  const { productName, showLabel } = shape.props;
  const block = resolveBuddyBlock2D(shape);
  const idPrefix = `furn-${String(shape.id).replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const resolveColor = exportColors
    ? createPlannerSvgColorResolver()
    : ((value: string | undefined) => value ?? "none");
  const surface = resolveColor(BLOCK_STYLE.surface);
  const againstWall = shape.props.isAgainstWall;
  const surfaceStroke = resolveColor(
    againstWall ? "var(--color-accent)" : BLOCK_STYLE.surfaceStroke,
  );
  const glyphDark = resolveColor(BLOCK_STYLE.glyphDark);

  return (
    <>
      {block?.prims.length ? (
        <RenderBlockPrims
          prims={block.prims}
          width={w}
          height={h}
          padding={Math.max(2, Math.min(w, h) * 0.06)}
          idPrefix={idPrefix}
          resolveColor={resolveColor}
        />
      ) : (
        <rect
          x={0}
          y={0}
          width={w}
          height={h}
          rx={6}
          fill={surface}
          stroke={surfaceStroke}
          strokeWidth={BLOCK_STYLE.surfaceStrokeWidth}
        />
      )}
      {showLabel && w >= 48 && h >= 24 && (() => {
        const labelFontSize = Math.max(9, Math.min(13, w * 0.085));
        const label = fitCanvasLabel(productName || "Furniture", w, labelFontSize);
        const clipId = `${idPrefix}-label-clip`;
        return (
          <>
            <defs>
              <clipPath id={clipId}>
                <rect x={0} y={0} width={w} height={h} rx={4} />
              </clipPath>
            </defs>
            <rect
              x={2}
              y={h - labelFontSize - 4}
              width={Math.max(0, w - 4)}
              height={labelFontSize + 2}
              rx={2}
              fill={surface}
              opacity={0.82}
            />
            <text
              x={w / 2}
              y={h - 4}
              fill={glyphDark}
              fontSize={labelFontSize}
              fontFamily={exportColors ? "Arial, Helvetica, sans-serif" : "var(--font-sans)"}
              fontWeight="500"
              textAnchor="middle"
              clipPath={`url(#${clipId})`}
              opacity={0.9}
            >
              {label}
            </text>
          </>
        );
      })()}
    </>
  );
}

export class PlannerFurnitureShapeUtil extends ShapeUtil<PlannerFurnitureTLShape> {
  static override type = "planner-furniture" as const;
  static override props = TldrawFurnitureShapeProps;

  getDefaultProps(): PlannerFurnitureTLShape["props"] {
    return {
      furnitureCategory: "workstation",
      furnitureType: "desk",
      widthMm: 120,
      heightMm: 60,
      depthMm: 60,
      height3dMm: 750,
      catalogId: "",
      productSlug: "",
      sku: "",
      productName: "Desk",
      manufacturer: "",
      imageUrl: "",
      isAgainstWall: false,
      snapDistance: 0,
      showDimensions: false,
      showLabel: true,
      renderStyle: "filled",
      color: BLOCK_STYLE.surfaceStroke,
      fillColor: BLOCK_STYLE.surface,
      strokeColor: BLOCK_STYLE.surfaceStroke,
      strokeWidth: BLOCK_STYLE.surfaceStrokeWidth,
    };
  }

  getGeometry(shape: PlannerFurnitureTLShape) {
    const { w, h } = footprintCanvas(shape);
    return new Rectangle2d({
      x: 0,
      y: 0,
      width: w,
      height: h,
      isFilled: true,
    });
  }

  override onTranslate(
    _initial: PlannerFurnitureTLShape,
    current: PlannerFurnitureTLShape,
  ): TLShapePartial<PlannerFurnitureTLShape> | void {
    return applyFurnitureWallSnap(this.editor, current) ?? undefined;
  }

  override onTranslateEnd(
    _initial: PlannerFurnitureTLShape,
    current: PlannerFurnitureTLShape,
  ): TLShapePartial<PlannerFurnitureTLShape> | void {
    const patch = applyFurnitureWallSnap(this.editor, current);
    return patch ?? undefined;
  }

  component(shape: PlannerFurnitureTLShape) {
    const { w, h } = footprintCanvas(shape);
    return (
      <SVGContainer width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
        <FurnitureGraphic shape={shape} />
      </SVGContainer>
    );
  }

  toSvg(shape: PlannerFurnitureTLShape, _ctx: SvgExportContext) {
    return (
      <g>
        <FurnitureGraphic shape={shape} exportColors />
      </g>
    );
  }

  indicator(shape: PlannerFurnitureTLShape) {
    const { w, h } = footprintCanvas(shape);
    return <rect width={w} height={h} rx={4} />;
  }

  getIndicatorPath(shape: PlannerFurnitureTLShape) {
    const { w, h } = footprintCanvas(shape);
    return new Path2D(`M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`);
  }
}
