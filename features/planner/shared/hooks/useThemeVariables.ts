'use client';

import { useMemo } from 'react';

/**
 * Extracts computed CSS variables from the document root.
 * This is critical for HTML5 Canvas engines (Konva) which cannot natively parse
 * `var(--color-block-wall)` in their fill/stroke properties.
 */
export function useThemeVariables() {
  // Use a simple memo to avoid re-extracting unless necessary.
  // Note: Since this reads from document.documentElement, it must only run on the client.
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        blockWall: '#1e293b',
        blockWallHover: '#334155',
        blockWallActive: '#f59e0b',
        blockDesk: '#475569',
        blockDeskHover: '#64748b',
        blockDeskActive: '#f59e0b',
        blockChair: '#94a3b8',
        blockChairHover: '#cbd5e1',
        blockChairActive: '#f59e0b',
        canvasBg: '#0f172a',
        canvasGrid: '#1e293b',
      };
    }

    const computed = window.getComputedStyle(document.documentElement);
    
    // Helper to safely extract and fallback
    const getVar = (name: string, fallback: string) => {
      const val = computed.getPropertyValue(name).trim();
      return val ? val : fallback;
    };

    return {
      blockWall: getVar('--color-block-wall', '#111E2D'),
      blockWallHover: getVar('--color-block-wall-hover', '#142436'),
      blockWallActive: getVar('--color-block-wall-active', '#9D876C'),
      blockDesk: getVar('--color-block-desk', '#182A40'),
      blockDeskHover: getVar('--color-block-desk-hover', '#1B3049'),
      blockDeskActive: getVar('--color-block-desk-active', '#9D876C'),
      blockChair: getVar('--color-block-chair', '#335479'),
      blockChairHover: getVar('--color-block-chair-hover', '#3F628C'),
      blockChairActive: getVar('--color-block-chair-active', '#9D876C'),
      canvasBg: getVar('--color-canvas-bg', '#05080C'),
      canvasGrid: getVar('--color-canvas-grid', '#070D12'),
    };
  }, []);
}
