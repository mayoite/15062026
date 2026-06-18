"use client";

import { useMemo } from "react";
import { BLOCK_STYLE, blockToSvg } from "@/lib/catalog/blocks2d";
import { resolveCatalogItemBlock2D } from "@/features/planner/catalog/catalogBlockBridge";
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

function sizePreviewSvg(markup: string, width: number, height: number): string {
  return markup.replace(
    /(<svg\b[^>]*?)\s+width="[^"]*"\s+height="[^"]*"/,
    `$1 width="${width}" height="${height}"`,
  );
}

export function CatalogBlockPreview({ item }: CatalogBlockPreviewProps) {
  const block = useMemo(() => resolveCatalogItemBlock2D(item), [item]);
  const { w: previewW, h: previewH } = block
    ? previewDimensions(block.footprint.L, block.footprint.D)
    : { w: 40, h: 24 };

  const previewSvg = useMemo(() => {
    if (!block?.prims.length) return null;
    return sizePreviewSvg(blockToSvg(block), previewW, previewH);
  }, [block, previewW, previewH]);

  if (!previewSvg) {
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
    <div
      className="pw-catalog-block-preview"
      style={{ width: previewW, height: previewH }}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: previewSvg }}
    />
  );
}