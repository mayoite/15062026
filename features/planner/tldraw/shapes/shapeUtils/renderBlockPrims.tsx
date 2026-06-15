import type { ReactElement } from "react";
import type { ArcPrim, CirclePrim, LinePrim, PathPrim, Prim, RectPrim } from "@/lib/catalog/blocks2d";

export interface PrimBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function updateBounds(
  bounds: PrimBounds,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  bounds.minX = Math.min(bounds.minX, x);
  bounds.minY = Math.min(bounds.minY, y);
  bounds.maxX = Math.max(bounds.maxX, x + w);
  bounds.maxY = Math.max(bounds.maxY, y + h);
}

export function getPrimBounds(prims: readonly Prim[]): PrimBounds | null {
  if (prims.length === 0) return null;

  const bounds: PrimBounds = {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  };

  for (const prim of prims) {
    switch (prim.kind) {
      case "rect":
        updateBounds(bounds, prim.x, prim.y, prim.w, prim.h);
        break;
      case "circle":
        updateBounds(bounds, prim.cx - prim.r, prim.cy - prim.r, prim.r * 2, prim.r * 2);
        break;
      case "line": {
        for (let i = 0; i < prim.points.length; i += 2) {
          updateBounds(bounds, prim.points[i], prim.points[i + 1], 0, 0);
        }
        break;
      }
      case "path": {
        const pathBounds = boundsFromPathData(prim.data);
        if (pathBounds) {
          updateBounds(bounds, pathBounds.minX, pathBounds.minY, pathBounds.maxX - pathBounds.minX, pathBounds.maxY - pathBounds.minY);
        }
        break;
      }
      case "arc":
        updateBounds(bounds, prim.cx - prim.r, prim.cy - prim.r, prim.r * 2, prim.r * 2);
        break;
      default:
        break;
    }
  }

  if (!Number.isFinite(bounds.minX)) return null;
  return bounds;
}

function boundsFromPathData(data: string): PrimBounds | null {
  const nums = data.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)?.map(Number) ?? [];
  if (nums.length < 2) return null;

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = nums[i];
    const y = nums[i + 1];
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  if (!Number.isFinite(minX)) return null;
  return { minX, minY, maxX, maxY };
}

function rectGradientId(prefix: string, index: number, prim: RectPrim): string | undefined {
  if (!prim.fillLinearGradientColorStops?.length) return undefined;
  return `${prefix}-rect-grad-${index}`;
}

function renderRectPrim(prim: RectPrim, index: number, idPrefix: string): ReactElement {
  const gradId = rectGradientId(idPrefix, index, prim);
  const fill = gradId ? `url(#${gradId})` : (prim.fill ?? "none");
  const stroke = prim.stroke ? prim.stroke : undefined;

  return (
    <g key={`rect-${index}`}>
      {gradId && prim.fillLinearGradientColorStops ? (
        <defs>
          <linearGradient
            id={gradId}
            x1={prim.fillLinearGradientStartPoint?.x ?? 0}
            y1={prim.fillLinearGradientStartPoint?.y ?? 0}
            x2={prim.fillLinearGradientEndPoint?.x ?? 0}
            y2={prim.fillLinearGradientEndPoint?.y ?? prim.h}
            gradientUnits="userSpaceOnUse"
          >
            {prim.fillLinearGradientColorStops.map((stop, stopIndex) => {
              if (typeof stop !== "number") return null;
              const color = prim.fillLinearGradientColorStops?.[stopIndex + 1];
              return (
                <stop
                  key={`${gradId}-stop-${stopIndex}`}
                  offset={`${stop * 100}%`}
                  stopColor={typeof color === "string" ? color : prim.fill ?? "currentColor"}
                />
              );
            })}
          </linearGradient>
        </defs>
      ) : null}
      <rect
        x={prim.x}
        y={prim.y}
        width={prim.w}
        height={prim.h}
        rx={prim.radius ?? 0}
        ry={prim.radius ?? 0}
        fill={fill}
        stroke={stroke}
        strokeWidth={prim.strokeWidth ?? 0}
        transform={
          prim.rotation
            ? `rotate(${prim.rotation} ${prim.offsetX ?? prim.x + prim.w / 2} ${prim.offsetY ?? prim.y + prim.h / 2})`
            : undefined
        }
      />
    </g>
  );
}

function renderCirclePrim(prim: CirclePrim, index: number): ReactElement {
  return (
    <circle
      key={`circle-${index}`}
      cx={prim.cx}
      cy={prim.cy}
      r={prim.r}
      fill={prim.fill ?? "none"}
      stroke={prim.stroke}
      strokeWidth={prim.strokeWidth ?? 0}
      strokeDasharray={prim.dash?.join(" ")}
    />
  );
}

function renderLinePrim(prim: LinePrim, index: number): ReactElement {
  const points = prim.points.reduce<string>((acc, value, pointIndex) => {
    if (pointIndex % 2 === 0) {
      const x = value;
      const y = prim.points[pointIndex + 1];
      return acc ? `${acc} ${x},${y}` : `${x},${y}`;
    }
    return acc;
  }, "");

  return (
    <polyline
      key={`line-${index}`}
      points={points}
      fill="none"
      stroke={prim.stroke}
      strokeWidth={prim.strokeWidth}
      strokeDasharray={prim.dash?.join(" ")}
      strokeLinecap={prim.lineCap ?? "round"}
    />
  );
}

function renderPathPrim(prim: PathPrim, index: number): ReactElement {
  return (
    <path
      key={`path-${index}`}
      d={prim.data}
      fill={prim.fill ?? "none"}
      stroke={prim.stroke}
      strokeWidth={prim.strokeWidth ?? 0}
      strokeLinecap={prim.lineCap ?? "round"}
    />
  );
}

function renderArcPrim(prim: ArcPrim, index: number): ReactElement {
  return (
    <path
      key={`arc-${index}`}
      d={`M ${prim.cx + prim.r * Math.cos(prim.startAngle)} ${prim.cy + prim.r * Math.sin(prim.startAngle)} A ${prim.r} ${prim.r} 0 0 1 ${prim.cx + prim.r * Math.cos(prim.endAngle)} ${prim.cy + prim.r * Math.sin(prim.endAngle)}`}
      fill={prim.fill ?? "none"}
      stroke={prim.stroke}
      strokeWidth={prim.strokeWidth}
      strokeLinecap={prim.lineCap ?? "round"}
    />
  );
}

function renderPrim(prim: Prim, index: number, idPrefix: string): ReactElement {
  switch (prim.kind) {
    case "rect":
      return renderRectPrim(prim, index, idPrefix);
    case "circle":
      return renderCirclePrim(prim, index);
    case "line":
      return renderLinePrim(prim, index);
    case "path":
      return renderPathPrim(prim, index);
    case "arc":
      return renderArcPrim(prim, index);
    default:
      return <g key={`unknown-${index}`} />;
  }
}

export interface RenderBlockPrimsProps {
  prims: readonly Prim[];
  width: number;
  height: number;
  padding?: number;
  /** Unique prefix for SVG gradient ids (avoids cross-tile collisions). */
  idPrefix?: string;
  resolveColor?: (value: string | undefined) => string;
}

function identityColor(value: string | undefined): string {
  return value ?? "none";
}

function withResolvedColors(prim: Prim, resolveColor: (value: string | undefined) => string): Prim {
  const resolvedStops = prim.fillLinearGradientColorStops?.map((stop) =>
    typeof stop === "string" ? resolveColor(stop) : stop,
  );
  return {
    ...prim,
    fill: "fill" in prim ? resolveColor(prim.fill) : undefined,
    stroke: "stroke" in prim ? resolveColor(prim.stroke) : undefined,
    shadowColor: resolveColor(prim.shadowColor),
    fillLinearGradientColorStops: resolvedStops,
  } as Prim;
}

export function RenderBlockPrims({
  prims,
  width,
  height,
  padding = 4,
  idPrefix = "block",
  resolveColor = identityColor,
}: RenderBlockPrimsProps) {
  const bounds = getPrimBounds(prims);
  if (!bounds) return null;

  const contentW = Math.max(1, bounds.maxX - bounds.minX);
  const contentH = Math.max(1, bounds.maxY - bounds.minY);
  const innerW = Math.max(1, width - padding * 2);
  const innerH = Math.max(1, height - padding * 2);
  const scale = Math.min(innerW / contentW, innerH / contentH);
  const offsetX = padding + (innerW - contentW * scale) / 2 - bounds.minX * scale;
  const offsetY = padding + (innerH - contentH * scale) / 2 - bounds.minY * scale;

  return (
    <g transform={`translate(${offsetX} ${offsetY}) scale(${scale})`}>
      {prims.map((prim, index) => renderPrim(withResolvedColors(prim, resolveColor), index, idPrefix))}
    </g>
  );
}
