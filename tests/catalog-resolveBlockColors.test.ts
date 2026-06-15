import { describe, expect, it } from "vitest";

import {
  createBlockColorResolver,
  resolveSvgForRaster,
} from "@/lib/catalog/resolveBlockColors";

describe("resolve block colors", () => {
  it("resolves CSS variable tokens to concrete colors", () => {
    const resolve = createBlockColorResolver();
    expect(resolve("var(--block-surface)")).toBe("#e6d3ba");
    expect(resolve("#112233")).toBe("#112233");
    expect(resolve("rgba(15, 23, 42, 0.15)")).toBe("rgba(15, 23, 42, 0.15)");
    expect(resolve(undefined)).toBe("none");
    expect(resolve("none")).toBe("none");
  });

  it("overrides tokens from provided CSS and follows var chains", () => {
    const css = `
      :root {
        --block-surface: var(--custom-surface, #abcdef);
        --custom-surface: #fedcba;
      }
    `;
    const resolve = createBlockColorResolver(css);
    expect(resolve("var(--block-surface)")).toBe("#fedcba");
  });

  it("inlines variables for raster export", () => {
    const css = ":root { --block-seat: #111111; }";
    const svg = '<rect fill="var(--block-seat)" stroke="var(--block-unknown, #222222)"/>';
    const resolved = resolveSvgForRaster(svg, css);
    expect(resolved).toContain('fill="#111111"');
    expect(resolved).toContain('stroke="#222222"');
    expect(resolved).not.toContain("var(--block-seat)");
  });

  it("replaces unsupported color-mix declarations", () => {
    const resolved = resolveSvgForRaster(
      '<rect fill="color-mix(in srgb, white 50%, black)"/>',
      "",
    );
    expect(resolved).toContain('fill="#e8dcc8"');
  });

  it("stops resolving deeply nested var chains", () => {
    let css = ":root {";
    for (let i = 0; i < 30; i += 1) {
      css += `--level-${i}: var(--level-${i + 1}, #010203);`;
    }
    css += "--level-30: #0a0b0c; }";

    const resolve = createBlockColorResolver(css);
    const resolved = resolve("var(--level-0)");
    expect(resolved).toBeTruthy();
    expect(resolved.length).toBeLessThan(80);
  });
});