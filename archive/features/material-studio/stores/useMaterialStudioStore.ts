import { create } from 'zustand';
import type * as THREE from 'three';

export type ThemeName = 'premium-light' | 'executive-dark';

export interface ThemeTokens {
  'color-base': string;
  'color-bevel': string;
  'material-roughness': number;
  'material-metalness': number;
  'bevel-size': number;
  'bevel-roundness': number;
}

export const THEMES: Record<ThemeName, ThemeTokens> = {
  'premium-light': {
    'color-base': '#ffffff',
    'color-bevel': '#f8fafc',
    'material-roughness': 0.8,
    'material-metalness': 0.1,
    'bevel-size': 2.0,
    'bevel-roundness': 0.5,
  },
  'executive-dark': {
    'color-base': '#1e293b',
    'color-bevel': '#0f172a',
    'material-roughness': 0.5,
    'material-metalness': 0.4,
    'bevel-size': 3.0,
    'bevel-roundness': 0.8,
  },
};

interface MaterialStudioState {
  theme: ThemeName;
  tokens: ThemeTokens;
  setTheme: (theme: ThemeName) => void;
  
  // 3D material references (transient, no React render on update)
  materialRefs: Set<THREE.MeshStandardMaterial>;
  registerMaterial: (material: THREE.MeshStandardMaterial) => void;
  unregisterMaterial: (material: THREE.MeshStandardMaterial) => void;

  // High-frequency updater
  updateToken: <K extends keyof ThemeTokens>(key: K, value: ThemeTokens[K]) => void;
}

export const useMaterialStudioStore = create<MaterialStudioState>((set, get) => ({
  theme: 'premium-light',
  tokens: THEMES['premium-light'],
  
  materialRefs: new Set(),
  
  registerMaterial: (material) => {
    get().materialRefs.add(material);
    // Initialize material with current tokens
    applyTokensToMaterial(material, get().tokens);
  },
  
  unregisterMaterial: (material) => {
    get().materialRefs.delete(material);
  },

  setTheme: (theme) => {
    const tokens = THEMES[theme];
    set({ theme, tokens });
    
    // Inject to DOM (2D)
    Object.entries(tokens).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--ms-${key}`, String(value));
    });

    // Mutate 3D
    get().materialRefs.forEach(material => {
      applyTokensToMaterial(material, tokens);
    });
  },

  updateToken: (key, value) => {
    // 1. Update transient state
    const currentTokens = get().tokens;
    currentTokens[key] = value;
    
    // Do not call set() to avoid React re-renders on high frequency updates like dragging a slider
    
    // 2. Sync to DOM (2D)
    document.documentElement.style.setProperty(`--ms-${key}`, String(value));

    // 3. Sync to 3D materials
    get().materialRefs.forEach(material => {
      applyTokenToMaterial(material, key, value);
    });
  }
}));

// Helper to apply all tokens to a material
function applyTokensToMaterial(material: THREE.MeshStandardMaterial, tokens: ThemeTokens) {
  material.color.set(tokens['color-base']);
  material.roughness = tokens['material-roughness'];
  material.metalness = tokens['material-metalness'];
  material.needsUpdate = true;
}

// Helper to apply a single token to a material
function applyTokenToMaterial(material: THREE.MeshStandardMaterial, key: keyof ThemeTokens, value: string | number) {
  if (key === 'color-base') {
    material.color.set(value as string);
  } else if (key === 'material-roughness') {
    material.roughness = value as number;
  } else if (key === 'material-metalness') {
    material.metalness = value as number;
  }
  material.needsUpdate = true;
}

// Initialize default theme to DOM on load if in browser
if (typeof window !== 'undefined') {
  const defaultTokens = THEMES['premium-light'];
  Object.entries(defaultTokens).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--ms-${key}`, String(value));
  });
}
