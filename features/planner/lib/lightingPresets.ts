/**
 * 3D Material and Lighting Presets
 * 
 * Provides preset configurations for materials and lighting in the 3D view.
 * Materials can be applied per-furniture item, while lighting is global.
 * 
 * This is the canonical location for 3D presets. The old 3d/presets.ts is deprecated.
 */

// ============================================================================
// Material Presets
// ============================================================================

export type MaterialPreset = "wood" | "concrete" | "fabric";

export interface MaterialPresetConfig {
  id: MaterialPreset;
  name: string;
  description: string;
  /** Base color (hex) */
  color: string;
  /** Surface roughness (0 = mirror, 1 = matte) */
  roughness: number;
  /** Metalness (0 = dielectric, 1 = metal) */
  metalness: number;
  /** Optional accent color for details like legs/handles */
  accentColor?: string;
  accentRoughness?: number;
  accentMetalness?: number;
}

export const MATERIAL_PRESETS: Record<MaterialPreset, MaterialPresetConfig> = {
  wood: {
    id: "wood",
    name: "Wood",
    description: "Natural wood finish with warm tones",
    color: "var(--border-soft)",
    roughness: 0.6,
    metalness: 0.0,
    accentColor: "var(--border-soft)",
    accentRoughness: 0.2,
    accentMetalness: 0.8,
  },
  concrete: {
    id: "concrete",
    name: "Concrete",
    description: "Industrial concrete with matte finish",
    color: "var(--border-soft)",
    roughness: 0.9,
    metalness: 0.0,
    accentColor: "var(--text-body)",
    accentRoughness: 0.3,
    accentMetalness: 0.7,
  },
  fabric: {
    id: "fabric",
    name: "Fabric",
    description: "Soft upholstered fabric texture",
    color: "var(--border-soft)",
    roughness: 0.95,
    metalness: 0.0,
    accentColor: "var(--text-body)",
    accentRoughness: 0.1,
    accentMetalness: 0.9,
  },
};

export const MATERIAL_PRESET_LIST: MaterialPresetConfig[] = Object.values(MATERIAL_PRESETS);

/**
 * Get material properties for a given preset
 */
export function getMaterialPreset(preset: MaterialPreset | undefined): MaterialPresetConfig {
  return preset && MATERIAL_PRESETS[preset] ? MATERIAL_PRESETS[preset] : MATERIAL_PRESETS.wood;
}

// ============================================================================
// Lighting Presets
// ============================================================================

export type LightingPreset = "day" | "night" | "dusk";

export interface LightConfig {
  type: "ambient" | "directional" | "point";
  intensity: number;
  color: string;
  position?: [number, number, number];
  castShadow?: boolean;
  distance?: number;
  decay?: number;
}

export interface LightingPresetConfig {
  id: LightingPreset;
  name: string;
  description: string;
  /** Ambient light settings */
  ambient: {
    intensity: number;
    color: string;
  };
  /** Main directional light (sun/moon) */
  mainLight: {
    intensity: number;
    color: string;
    position: [number, number, number];
  };
  /** Fill light to soften shadows */
  fillLight: {
    intensity: number;
    color: string;
    position: [number, number, number];
  };
  /** Ceiling/interior point lights */
  pointLights: Array<{
    intensity: number;
    color: string;
    position: [number, number, number];
    distance: number;
    decay: number;
  }>;
  /** Fog settings for atmosphere */
  fog: {
    color: string;
    near: number;
    far: number;
  };
  /** Background color */
  backgroundColor: string;
}

export const LIGHTING_PRESETS: Record<LightingPreset, LightingPresetConfig> = {
  day: {
    id: "day",
    name: "Day",
    description: "Bright daylight with natural sunlight",
    ambient: {
      intensity: 0.5,
      color: "var(--surface-panel)",
    },
    mainLight: {
      intensity: 1.2,
      color: "var(--surface-panel)",
      position: [15, 20, 10],
    },
    fillLight: {
      intensity: 0.4,
      color: "var(--surface-panel)",
      position: [-15, 10, -10],
    },
    pointLights: [
      { intensity: 0.3, color: "var(--surface-panel)", position: [0, 4, 0], distance: 15, decay: 2 },
      { intensity: 0.2, color: "var(--surface-panel)", position: [5, 4, 5], distance: 10, decay: 2 },
      { intensity: 0.2, color: "var(--surface-panel)", position: [-5, 4, -5], distance: 10, decay: 2 },
    ],
    fog: {
      color: "var(--surface-panel)",
      near: 20,
      far: 50,
    },
    backgroundColor: "var(--surface-panel)",
  },
  night: {
    id: "night",
    name: "Night",
    description: "Evening ambiance with warm interior lighting",
    ambient: {
      intensity: 0.15,
      color: "var(--text-body)",
    },
    mainLight: {
      intensity: 0.2,
      color: "var(--border-soft)",
      position: [15, 20, 10],
    },
    fillLight: {
      intensity: 0.1,
      color: "var(--border-soft)",
      position: [-15, 10, -10],
    },
    pointLights: [
      { intensity: 0.8, color: "var(--border-soft)", position: [0, 4, 0], distance: 12, decay: 2 },
      { intensity: 0.6, color: "var(--border-soft)", position: [5, 4, 5], distance: 8, decay: 2 },
      { intensity: 0.6, color: "var(--border-soft)", position: [-5, 4, -5], distance: 8, decay: 2 },
      { intensity: 0.4, color: "var(--border-soft)", position: [3, 3, -3], distance: 6, decay: 2 },
    ],
    fog: {
      color: "var(--text-body)",
      near: 10,
      far: 30,
    },
    backgroundColor: "var(--text-body)",
  },
  dusk: {
    id: "dusk",
    name: "Dusk",
    description: "Golden hour with warm sunset tones",
    ambient: {
      intensity: 0.35,
      color: "var(--surface-panel)",
    },
    mainLight: {
      intensity: 0.8,
      color: "var(--border-soft)",
      position: [20, 8, 15],
    },
    fillLight: {
      intensity: 0.3,
      color: "var(--border-soft)",
      position: [-15, 10, -10],
    },
    pointLights: [
      { intensity: 0.4, color: "var(--border-soft)", position: [0, 4, 0], distance: 15, decay: 2 },
      { intensity: 0.3, color: "var(--border-soft)", position: [5, 4, 5], distance: 10, decay: 2 },
      { intensity: 0.3, color: "var(--border-soft)", position: [-5, 4, -5], distance: 10, decay: 2 },
    ],
    fog: {
      color: "var(--border-soft)",
      near: 15,
      far: 40,
    },
    backgroundColor: "var(--border-soft)",
  },
};

export const LIGHTING_PRESET_LIST: LightingPresetConfig[] = Object.values(LIGHTING_PRESETS);

/**
 * Get lighting configuration for a given preset
 */
export function getLightingPreset(preset: LightingPreset | undefined): LightingPresetConfig {
  return preset && LIGHTING_PRESETS[preset] ? LIGHTING_PRESETS[preset] : LIGHTING_PRESETS.day;
}

/**
 * Default lighting preset
 */
export const DEFAULT_LIGHTING_PRESET: LightingPreset = "day";

/**
 * Default material preset
 */
export const DEFAULT_MATERIAL_PRESET: MaterialPreset = "wood";