import { describe, expect, it } from "vitest";

import { PLANNER_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";
import { resolveCatalogItemBlock2D } from "@/features/planner/catalog/catalogBlockBridge";
import { blockToSvg } from "@/lib/catalog/blocks2d";

describe("catalog SVG visual QA gate", () => {
  it("exposes at least 100 catalog items", () => {
    expect(PLANNER_CATALOG_ITEMS.length).toBeGreaterThanOrEqual(100);
  });

  it("renders every catalog item as inline SVG with mm footprint", () => {
    const failures: string[] = [];

    for (const item of PLANNER_CATALOG_ITEMS) {
      const block = resolveCatalogItemBlock2D(item);
      if (!block) {
        failures.push(`${item.id}: no block`);
        continue;
      }

      if (block.footprint.L <= 0 || block.footprint.D <= 0) {
        failures.push(`${item.id}: invalid footprint ${block.footprint.L}×${block.footprint.D}`);
      }

      if (block.prims.length === 0) {
        failures.push(`${item.id}: empty primitives`);
        continue;
      }

      const svg = blockToSvg(block);
      if (!svg.includes("<svg") || !svg.includes("</svg>")) {
        failures.push(`${item.id}: malformed svg`);
      }
      if (/data:image|\.png|\.jpe?g/i.test(svg)) {
        failures.push(`${item.id}: raster fallback detected`);
      }
    }

    expect(failures, failures.slice(0, 8).join("\n")).toEqual([]);
  });
});

