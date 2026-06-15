"use client";

import { useMemo } from "react";
import { BLOCK_STYLE } from "@/lib/catalog/blocks2d";
import { resolveCatalogItemBlock2D } from "@/features/planner/tldraw/shapes/shapeUtils/catalogBlockBridge";
import { RenderBlockPrims } from "@/features/planner/tldraw/shapes/shapeUtils/renderBlockPrims";
import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";

const PREVIEW_MAX_W = 52;
const PREVIEW_MAX_H = 36;

interface CatalogBlockPreviewProps {
  item: CatalogItem;
}

function previewDimensions(footprintL: number, footprintD: number): { w: number; h: number } {
  const aspect = footprintL / Math.max(1, footprintD);
  if (aspect >= 1.4) {
    return { w: PREVIEW_MAX_W, h: Math.max(20, Math.round(PREVIEW_MAX_W / aspect)) };
  }
  if (aspect <= 0.75) {
    return { w: Math.max(24, Math.round(PREVIEW_MAX_H * aspect)), h: PREVIEW_MAX_H };
  }
  return { w: PREVIEW_MAX_W, h: PREVIEW_MAX_H };
}

export function CatalogBlockPreview({ item }: CatalogBlockPreviewProps) {
  const block = useMemo(() => resolveCatalogItemBlock2D(item), [item]);
  const { w: previewW, h: previewH } = block
    ? previewDimensions(block.footprint.L, block.footprint.D)
    : { w: 40, h: 24 };

  if (!block?.prims.length) {
    return (
      <div
        aria-hidden
        className="rounded-sm border shadow-inner"
        style={{
          width: Math.min(item.widthMm * 0.12, 40),
          height: Math.min(item.heightMm * 0.12, 24),
          borderColor: BLOCK_STYLE.surfaceStroke,
          background: `color-mix(in srgb, ${BLOCK_STYLE.surface} 72%, transparent)`,
        }}
      />
    );
  }

  return (
    <svg
      width={previewW}
      height={previewH}
      viewBox={`0 0 ${previewW} ${previewH}`}
      aria-hidden
      className="overflow-visible"
    >
      <RenderBlockPrims
        prims={block.prims}
        width={previewW}
        height={previewH}
        padding={3}
        idPrefix={`cat-${item.id}`}
      />
    </svg>
  );
}
