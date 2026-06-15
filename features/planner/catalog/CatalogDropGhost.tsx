"use client";

import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";
import { CatalogBlockPreview } from "@/features/planner/catalog/CatalogBlockPreview";

interface CatalogDropGhostProps {
  item: CatalogItem;
  x: number;
  y: number;
  width: number;
  height: number;
  valid?: boolean;
}

export function CatalogDropGhost({
  item,
  x,
  y,
  width,
  height,
  valid = true,
}: CatalogDropGhostProps) {
  return (
    <div
      className="pw-drop-ghost"
      data-valid={valid}
      style={{
        left: x,
        top: y,
        width: width + 20,
        height: height + 28,
      }}
      aria-hidden
    >
      <div className="pw-drop-ghost-preview" style={{ width, height }}>
        <CatalogBlockPreview item={item} />
      </div>
      <p className="pw-drop-ghost-label">{item.shortName ?? item.name}</p>
    </div>
  );
}