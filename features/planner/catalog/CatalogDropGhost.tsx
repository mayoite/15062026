"use client";

import { useMemo } from "react";

import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";
import { CatalogBlockPreview } from "@/features/planner/catalog/CatalogBlockPreview";

interface CatalogDropGhostProps {
  item: CatalogItem;
  x: number;
  y: number;
}

export function CatalogDropGhost({ item, x, y }: CatalogDropGhostProps) {
  const scale = useMemo(() => {
    const maxDim = Math.max(item.widthMm, item.heightMm, 1);
    return Math.min(1.4, Math.max(0.5, 900 / maxDim));
  }, [item.heightMm, item.widthMm]);

  const width = Math.round(item.widthMm * scale * 0.08);
  const height = Math.round(item.heightMm * scale * 0.08);

  return (
    <div
      className="pw-drop-ghost"
      style={{ left: x, top: y, width: width + 16, height: height + 16 }}
      aria-hidden
    >
      <div className="pw-drop-ghost-preview">
        <CatalogBlockPreview item={item} />
      </div>
      <p className="pw-drop-ghost-label">{item.name}</p>
    </div>
  );
}
