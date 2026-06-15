"use client";
import { useEffect, useState } from 'react';
import * as THREE from 'three';

/**
 * Phase 7: 3D Material Parity
 * A hook that bridges the gap between our CSS token dictionary and React Three Fiber.
 * It reads the injected DOM CSS variables (fetched from Cloudflare/DO CDN) and 
 * constructs native THREE.Color objects for the WebGL renderer.
 */
export function useThemeMaterial(
  cssVarName: string, 
  options?: { roughness?: number; metalness?: number }
) {
  // Default to white while the DOM boots up
  const [color, setColor] = useState<THREE.Color>(new THREE.Color(0xffffff));

  useEffect(() => {
    // Wait for the ThemeProvider (Phase 6) to inject the variables into :root
    const rootStyles = getComputedStyle(document.documentElement);
    let rawValue = rootStyles.getPropertyValue(cssVarName).trim();
    
    // If the CSS variable is missing, gracefully extract the fallback hex from the var() syntax
    if (!rawValue) {
      if (cssVarName.includes(',')) {
         rawValue = cssVarName.split(',')[1].replace(')', '').trim();
      } else {
         rawValue = 'var(--surface-panel)'; // ultimate fallback
      }
    }

    try {
// eslint-disable-next-line react-hooks/set-state-in-effect
      setColor(new THREE.Color(rawValue));
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      console.warn(`[Oando 3D] Failed to parse color for ${cssVarName}:`, rawValue);
    }
  }, [cssVarName]);

  return {
    color,
    roughness: options?.roughness ?? 0.6, // Wood/Fabric default roughness
    metalness: options?.metalness ?? 0.0, // Non-metallic default
  };
}
