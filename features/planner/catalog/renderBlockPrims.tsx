"use client";

import { blockToSvg, type Block2D } from "@/lib/catalog/blocks2d";
import type { Prim } from "@/lib/catalog/blocks2d";

interface RenderBlockPrimsProps {
  prims: Prim[];
  width: number;
  height: number;
  padding?: number;
  idPrefix?: string;
  footprint?: { L: number; D: number };
}

/**
 * Renders catalog block primitives via the canonical blockToSvg serializer
 * (paths, arcs, lines, gradients, resolved colors).
 */
export function RenderBlockPrims({
  prims,
  width,
  height,
  footprint,
}: RenderBlockPrimsProps) {
  if (!prims.length) return null;

  const block: Block2D = {
    footprint: footprint ?? { L: width, D: height, H: 750 },
    prims,
    label: "preview",
  };

  const markup = blockToSvg(block).replace(
    /(<svg\b[^>]*?)\s+width="[^"]*"\s+height="[^"]*"/,
    `$1 width="${width}" height="${height}"`,
  );

  return (
    <div
      className="pw-catalog-block-preview"
      style={{ width, height }}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}