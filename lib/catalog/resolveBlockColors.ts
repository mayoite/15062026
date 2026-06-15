/**
 * Resolves BLOCK_STYLE CSS variable tokens to concrete colors for SVG raster export.
 * Values match premium-light theme fallbacks in lib/catalog/styles/blocks2d.css.
 */
const TOKEN_COLORS: Record<string, string> = {
  "--block-surface": "#e6d3ba",
  "--block-surface-grad-end": "#d4b895",
  "--block-surface-stroke": "#c6a67d",
  "--block-seat": "#475569",
  "--block-seat-stroke": "#1e293b",
  "--block-seat-contour": "#64748b",
  "--block-seat-backrest": "#334155",
  "--block-seat-backrest-stroke": "#0f172a",
  "--block-armrest": "#1e293b",
  "--block-armrest-soft": "#334155",
  "--block-caster-base": "#e2e8f0",
  "--block-caster-spoke": "#94a3b8",
  "--block-caster-wheel": "#475569",
  "--block-sofa": "#78716c",
  "--block-sofa-stroke": "#44403c",
  "--block-sofa-arm": "#57534e",
  "--block-sofa-seam": "#a8a29e",
  "--block-panel": "#94a3b8",
  "--block-panel-grad-start": "#cbd5e1",
  "--block-screen-grad-start": "#334155",
  "--block-screen-grad-end": "#0f172a",
  "--block-shadow-color": "rgba(15, 23, 42, 0.15)",
  "--block-storage": "#e2e8f0",
  "--block-storage-grad-start": "#f1f5f9",
  "--block-storage-stroke": "#94a3b8",
  "--block-glyph": "#cbd5e1",
  "--block-glyph-dark": "#475569",
  "--block-equip-white": "#ffffff",
  "--block-equip-gray": "#e2e8f0",
  "--block-equip-dark": "#64748b",
  "--block-plant-base": "#65a30d",
  "--block-plant-dark": "#3f6212",
  "--block-plant-outline": "#365314",
  "--block-pot-base": "#78350f",
};

function parseCssVariables(css: string): Map<string, string> {
  const vars = new Map<string, string>(Object.entries(TOKEN_COLORS));
  const re = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(css)) !== null) {
    vars.set(`--${match[1]}`, match[2].trim());
  }
  return vars;
}

function resolveVarChain(value: string, vars: Map<string, string>, depth = 0): string {
  if (depth > 24) return value;
  const trimmed = value.trim();
  if (/^#([0-9a-f]{3,8})$/i.test(trimmed)) return trimmed;
  if (/^rgba?\(/i.test(trimmed)) return trimmed;

  const varMatch = trimmed.match(/^var\(--([a-z0-9-]+)(?:,\s*([^)]+))?\)$/i);
  if (varMatch) {
    const key = `--${varMatch[1]}`;
    const raw = vars.get(key) ?? varMatch[2]?.trim() ?? TOKEN_COLORS[key] ?? "#94a3b8";
    return resolveVarChain(raw, vars, depth + 1);
  }

  return trimmed.replace(
    /var\(--([a-z0-9-]+)(?:,\s*([^)]+))?\)/gi,
    (_, name: string, fallback?: string) => {
      const key = `--${name}`;
      const raw = vars.get(key) ?? fallback?.trim() ?? TOKEN_COLORS[key] ?? "#94a3b8";
      return resolveVarChain(raw, vars, depth + 1);
    },
  );
}

export type BlockColorResolver = (token: string | undefined) => string;

export function createBlockColorResolver(css?: string): BlockColorResolver {
  const vars = css ? parseCssVariables(css) : new Map(Object.entries(TOKEN_COLORS));
  return (token: string | undefined) => {
    if (!token) return "none";
    if (token === "none" || token === "currentColor") return token;
    if (/^#([0-9a-f]{3,8})$/i.test(token)) return token;
    if (/^rgba?\(/i.test(token)) return token;
    return resolveVarChain(token, vars);
  };
}

export function resolveSvgForRaster(svg: string, css: string): string {
  const vars = parseCssVariables(css);
  return svg
    .replace(/color-mix\([^)]+\)/gi, "#e8dcc8")
    .replace(/var\(--([a-z0-9-]+)(?:,\s*([^)]+))?\)/gi, (_, name: string, fallback?: string) => {
      const key = `--${name}`;
      const raw = vars.get(key) ?? fallback?.trim() ?? TOKEN_COLORS[key] ?? "#94a3b8";
      return resolveVarChain(raw, vars);
    });
}
