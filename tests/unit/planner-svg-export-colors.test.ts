import { describe, expect, it } from "vitest";

import {
  createPlannerSvgColorResolver,
  finalizePlannerExportSvg,
} from "@/features/planner/lib/plannerSvgExportColors";

const THEME_CSS = `
  :root {
    --color-white-50: #ffffff;
    --color-bronze-400: #8a6b49;
    --color-bronze-600: #66533f;
    --color-dark-midnight-blue-500: #1b2940;
    --surface-page: var(--color-white-50);
    --text-body: var(--color-dark-midnight-blue-500);
    --text-muted: #3f5168;
    --color-accent: var(--color-bronze-400);
    --block-surface: #e6d3ba;
  }
`;

describe("planner SVG export colors", () => {
  it("resolves planner theme tokens for shape export", () => {
    const resolve = createPlannerSvgColorResolver(THEME_CSS);
    expect(resolve("var(--surface-page)")).toBe("#ffffff");
    expect(resolve("var(--color-accent)")).toBe("#8a6b49");
    expect(resolve("var(--block-surface)")).toBe("#e6d3ba");
  });

  it("finalizes exported svg without css variables", () => {
    const svg =
      '<svg><path fill="var(--surface-page)" stroke="var(--color-accent)"/><rect fill="color-mix(in srgb, white 50%, black)"/></svg>';
    const resolved = finalizePlannerExportSvg(svg, THEME_CSS);
    expect(resolved).toContain('fill="#ffffff"');
    expect(resolved).toContain('stroke="#8a6b49"');
    expect(resolved).not.toContain("var(--");
    expect(resolved).not.toContain("color-mix");
  });
});
