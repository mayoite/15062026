import {
  createBlockColorResolver,
  resolveSvgForRaster,
  type BlockColorResolver,
} from "@/lib/catalog/resolveBlockColors";

/** Collect loaded stylesheet rules so export can resolve live theme tokens. */
export function collectPlannerExportCss(): string {
  if (typeof document === "undefined") return "";

  const chunks: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        chunks.push(rule.cssText);
      }
    } catch {
      // Cross-origin stylesheets are not readable.
    }
  }
  return chunks.join("\n");
}

/** Resolve planner + block CSS variables to concrete colors for vector export. */
export function createPlannerSvgColorResolver(css = collectPlannerExportCss()): BlockColorResolver {
  return createBlockColorResolver(css);
}

/** Inline any remaining CSS variables / color-mix for standalone SVG files. */
export function finalizePlannerExportSvg(svg: string, css = collectPlannerExportCss()): string {
  return resolveSvgForRaster(svg, css);
}