"use client";

import { useMemo } from "react";

import { ZONE_PREVIEW_COLORS } from "./aiAdvisorConfig";
import { buildLayoutPreviewModel } from "./layoutPreviewBounds";
import type { SuggestedLayoutJson } from "./types";

type LayoutPreviewSvgProps = {
  layout: SuggestedLayoutJson;
  className?: string;
};

function mapPoint(
  x: number,
  y: number,
  bounds: { x: number; y: number; w: number; h: number },
  width: number,
  height: number,
  pad: number,
): { x: number; y: number } {
  const scale = Math.min((width - pad * 2) / bounds.w, (height - pad * 2) / bounds.h);
  return {
    x: pad + (x - bounds.x) * scale,
    y: pad + (y - bounds.y) * scale,
  };
}

export function LayoutPreviewSvg({ layout, className }: LayoutPreviewSvgProps) {
  const model = useMemo(() => buildLayoutPreviewModel(layout), [layout]);

  const viewW = 280;
  const viewH = 168;
  const pad = 10;
  const scale = Math.min(
    (viewW - pad * 2) / model.bounds.w,
    (viewH - pad * 2) / model.bounds.h,
  );

  const toSvgRect = (rect: { x: number; y: number; w: number; h: number }) => {
    const origin = mapPoint(rect.x, rect.y, model.bounds, viewW, viewH, pad);
    return {
      x: origin.x,
      y: origin.y,
      w: rect.w * scale,
      h: rect.h * scale,
    };
  };

  const room = toSvgRect(model.room);

  return (
    <figure className={className ?? "pw-ai-layout-preview"} aria-label="Layout preview">
      <svg
        viewBox={`0 0 ${viewW} ${viewH}`}
        width="100%"
        height="auto"
        role="img"
        aria-hidden
      >
        <rect
          x={room.x}
          y={room.y}
          width={room.w}
          height={room.h}
          rx={4}
          fill="var(--surface-panel)"
          stroke="var(--color-primary)"
          strokeWidth={1.5}
        />

        {model.zones.map((zone) => {
          const z = toSvgRect(zone);
          const colors =
            ZONE_PREVIEW_COLORS[zone.zoneType as keyof typeof ZONE_PREVIEW_COLORS] ??
            ZONE_PREVIEW_COLORS.focus;
          return (
            <rect
              key={`${zone.label}-${zone.x}-${zone.y}`}
              x={z.x}
              y={z.y}
              width={z.w}
              height={z.h}
              rx={3}
              fill={colors.fill}
              stroke={colors.stroke}
              strokeWidth={1}
              strokeDasharray="4 3"
              opacity={0.9}
            />
          );
        })}

        {model.walls.map((wall, index) => {
          const start = mapPoint(wall.x1, wall.y1, model.bounds, viewW, viewH, pad);
          const end = mapPoint(wall.x2, wall.y2, model.bounds, viewW, viewH, pad);
          return (
            <line
              key={`wall-${index}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke="var(--text-strong)"
              strokeWidth={2}
              strokeLinecap="round"
            />
          );
        })}

        {model.furniture.map((piece) => {
          const f = toSvgRect(piece);
          return (
            <rect
              key={`${piece.catalogItemId}-${piece.x}-${piece.y}`}
              x={f.x}
              y={f.y}
              width={Math.max(3, f.w)}
              height={Math.max(3, f.h)}
              rx={2}
              fill="color-mix(in srgb, var(--color-primary) 22%, var(--surface-panel))"
              stroke="var(--color-primary)"
              strokeWidth={1}
            />
          );
        })}
      </svg>
    </figure>
  );
}