/**
 * Theme Presets Registry — Phase 12
 *
 * Canonical theme presets that can be selected through the admin theme API.
 * Each preset is a flat key-value map of UI chrome CSS custom properties.
 * Block geometry/material tokens live in lib/catalog/styles — not here.
 */

export type ThemePreset = {
  id: string;
  name: string;
  description: string;
  tokens: Record<string, string>;
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "premium-light",
    name: "Premium Light",
    description: "Warm neutral palette with gold accent — default brand theme.",
    tokens: {
      "block-surface-alt": "#f8f7f5",
      "block-border": "#e8e5e0",
      "block-text": "#1a1a1a",
      "block-text-muted": "#6b6560",
      "block-accent": "#9d876c",
      "block-accent-hover": "#7f6a52",
      "block-radius": "0.75rem",
      "block-shadow": "0 2px 8px rgba(0,0,0,0.06)",
      "block-font-display": "var(--font-cisco-sans), CiscoSans, Helvetica, Arial, sans-serif",
      "block-font-body": "var(--font-helvetica-neue), HelveticaNeue, Helvetica, Arial, sans-serif",
    },
  },
  {
    id: "executive-dark",
    name: "Executive Dark",
    description: "Dark surface with muted gold accents — executive/boardroom context.",
    tokens: {
      "block-surface-alt": "#25252b",
      "block-border": "#3a3a42",
      "block-text": "#f0ede8",
      "block-text-muted": "#9a9590",
      "block-accent": "#9d876c",
      "block-accent-hover": "#7f6a52",
      "block-radius": "0.5rem",
      "block-shadow": "0 2px 12px rgba(0,0,0,0.3)",
      "block-font-display": "var(--font-cisco-sans), CiscoSans, Helvetica, Arial, sans-serif",
      "block-font-body": "var(--font-helvetica-neue), HelveticaNeue, Helvetica, Arial, sans-serif",
    },
  },
  {
    id: "minimal-white",
    name: "Minimal White",
    description: "Clean white with subtle gray borders — minimal/modern look.",
    tokens: {
      "block-surface-alt": "#fafafa",
      "block-border": "#eeeeee",
      "block-text": "#111111",
      "block-text-muted": "#888888",
      "block-accent": "#333333",
      "block-accent-hover": "#555555",
      "block-radius": "0.375rem",
      "block-shadow": "0 1px 4px rgba(0,0,0,0.04)",
      "block-font-display": "Inter, system-ui, sans-serif",
      "block-font-body": "Inter, system-ui, sans-serif",
    },
  },
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    description: "Cool blue tones — collaborative/tech-forward environments.",
    tokens: {
      "block-surface-alt": "#f1f5f9",
      "block-border": "#e2e8f0",
      "block-text": "#0f172a",
      "block-text-muted": "#64748b",
      "block-accent": "#2563eb",
      "block-accent-hover": "#1d4ed8",
      "block-radius": "0.5rem",
      "block-shadow": "0 2px 8px rgba(37,99,235,0.08)",
      "block-font-display": "ciscoSans, Helvetica, Arial, sans-serif",
      "block-font-body": "ciscoSans, Helvetica, Arial, sans-serif",
    },
  },
  {
    id: "warm-earth",
    name: "Warm Earth",
    description: "Natural earth tones — sustainable/biophilic design contexts.",
    tokens: {
      "block-surface-alt": "#f5f0e8",
      "block-border": "#e8dfd0",
      "block-text": "#2d2318",
      "block-text-muted": "#7a6b5a",
      "block-accent": "#8b6914",
      "block-accent-hover": "#a07a1a",
      "block-radius": "0.625rem",
      "block-shadow": "0 2px 6px rgba(139,105,20,0.08)",
      "block-font-display": "ciscoSans, Helvetica, Arial, sans-serif",
      "block-font-body": "ciscoSans, Helvetica, Arial, sans-serif",
    },
  },
];

/**
 * Get a theme preset by ID. Returns undefined if not found.
 */
export function getPresetById(id: string): ThemePreset | undefined {
  return THEME_PRESETS.find((p) => p.id === id);
}

/**
 * Get the default (active) preset.
 */
export function getDefaultPreset(): ThemePreset {
  return THEME_PRESETS[0];
}
