/**
 * PLANNER_BRAND
 * Planner-specific brand tokens mapped to FOCSS design tokens.
 * All color values reference CSS custom properties from tokens/
 * For runtime use in TypeScript/React components.
 */

// Helper to get CSS custom property value at runtime
const getToken = (token: string): string => {
  if (typeof window !== "undefined") {
    return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  }
  return token; // Return token name for SSR
};

export const PLANNER_BRAND = {
  color: {
    primary: "var(--color-primary)",
    primaryHover: "var(--color-primary-hover)",
    accent: "var(--color-accent)",
    ocean: "var(--color-ocean-boat-blue-500)",
    darkSurface: "var(--surface-inverse)",
    lightSurface: "var(--surface-soft)",
    canvasBg: "var(--surface-page)",
    offline: "var(--color-offline)", // Offline indicator color (red)
    warning: "var(--color-warning)", // Warning/sync pending color (amber)
    focusRing: "var(--color-focus-ring)", // Focus ring color for accessibility
  },
  shape: {
    wallStroke: "var(--color-primary)",
    wallFill: "var(--surface-panel)",
    doorArc: "var(--color-ocean-boat-blue-500)",
    measureLine: "var(--color-accent)",
    measureLabel: "var(--color-primary)",
    selectionPrimary: "var(--color-ocean-boat-blue-500)",
    selectionSecondary: "var(--overlay-inverse-18)",
  },
  furniture: {
    workstation: { fill: "var(--color-bronze-100)", stroke: "var(--color-bronze-400)" },
    seating: { fill: "var(--color-dark-midnight-blue-100)", stroke: "var(--color-dark-midnight-blue-300)" },
    table: { fill: "var(--color-bronze-200)", stroke: "var(--color-bronze-400)" },
    storage: { fill: "var(--color-dark-midnight-blue-200)", stroke: "var(--color-dark-midnight-blue-400)" },
    softSeating: { fill: "var(--color-ocean-boat-blue-200)", stroke: "var(--color-ocean-boat-blue-700)" },
    accessory: { fill: "var(--color-ocean-boat-blue-100)", stroke: "var(--color-ocean-boat-blue-600)" },
    partition: { fill: "var(--color-ocean-boat-blue-300)", stroke: "var(--color-ocean-boat-blue-500)" },
    custom: { fill: "var(--color-ocean-boat-blue-50)", stroke: "var(--color-ocean-boat-blue-400)" },
  },
  // Runtime token accessors (use these in React components for dynamic theme support)
  tokens: {
    primary: () => getToken("--color-primary"),
    accent: () => getToken("--color-accent"),
    ocean: () => getToken("--color-ocean-boat-blue-500"),
    surfacePage: () => getToken("--surface-page"),
    textBody: () => getToken("--text-body"),
    focusRing: () => getToken("--color-focus-ring"),
  },
} as const;

/**
 * CSS Token References (for documentation)
 * Use these in CSS files via var()
 */
export const PLANNER_CSS_TOKENS = {
  // Brand colors
  primary: "var(--color-primary)", // var(--border-soft)
  primaryHover: "var(--color-primary-hover)", // var(--border-soft)
  accent: "var(--color-accent)", // var(--border-soft)
  ocean: "var(--color-ocean-boat-blue-500)", // var(--border-soft)
  offline: "var(--color-offline)", // var(--color-danger) (red for offline state)
  warning: "var(--color-warning)", // var(--color-warning) (amber for sync pending)
  focusRing: "var(--color-focus-ring)", // Focus ring color for accessibility

  // Surfaces
  surfacePage: "var(--surface-page)", // var(--surface-panel)
  surfaceCard: "var(--surface-card)", // var(--surface-panel)
  surfaceSoft: "var(--surface-soft)", // var(--surface-panel)

  // Text
  textBody: "var(--text-body)", // Dark Midnight Blue 700
  textStrong: "var(--text-strong)", // Dark Midnight Blue 950
  textInverse: "var(--text-inverse)", // var(--surface-panel)

  // Effects
  shadowPanel: "var(--shadow-panel)",
  radiusLg: "var(--radius-lg)",
  radiusXl: "var(--radius-xl)",
  radius2xl: "var(--radius-2xl)",
} as const;

/**
 * Admin Theme Tokens
 * Light and dark mode tokens for admin pages
 */
export const ADMIN_THEME_TOKENS = {
  light: {
    // Surfaces
    surfacePage: "var(--surface-page)",
    surfaceCard: "var(--surface-card)",
    surfaceSoft: "var(--surface-soft)",
    surfaceMuted: "var(--surface-muted)",
    // Text
    textStrong: "var(--text-strong)",
    textBody: "var(--text-body)",
    textMuted: "var(--text-muted)",
    textSubtle: "var(--text-subtle)",
    // Borders
    borderSoft: "var(--border-soft)",
    borderMuted: "var(--border-muted)",
    borderStrong: "var(--border-strong)",
    // Interactive
    primary: "var(--color-primary)",
    primaryHover: "var(--color-primary-hover)",
    accent: "var(--color-accent)",
    // Status
    success: "var(--color-success)",
    warning: "var(--color-warning)",
    danger: "var(--color-danger)",
  },
  dark: {
    // Surfaces
    surfacePage: "var(--surface-inverse)",
    surfaceCard: "var(--color-dark-midnight-blue-800)",
    surfaceSoft: "var(--color-dark-midnight-blue-700)",
    surfaceMuted: "var(--color-dark-midnight-blue-600)",
    // Text
    textStrong: "var(--text-inverse)",
    textBody: "var(--color-dark-midnight-blue-100)",
    textMuted: "var(--color-dark-midnight-blue-200)",
    textSubtle: "var(--color-dark-midnight-blue-300)",
    // Borders
    borderSoft: "var(--color-dark-midnight-blue-700)",
    borderMuted: "var(--color-dark-midnight-blue-600)",
    borderStrong: "var(--color-dark-midnight-blue-500)",
    // Interactive
    primary: "var(--color-ocean-boat-blue-500)",
    primaryHover: "var(--color-ocean-boat-blue-400)",
    accent: "var(--color-accent)",
    // Status
    success: "var(--color-sustain-400)",
    warning: "var(--color-raw-warning)",
    danger: "var(--color-raw-danger)",
  },
} as const;
