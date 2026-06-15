import type { EngineAdapter, Scene2D, EnginePatch } from '../types'
import type { ToolType } from '../../../stores/canvasStore'
import { engineCapabilityMatrix } from '../capabilityMatrix'

/**
 * TldrawAdapter — Tldraw handles all tools natively.
 * Rendering is done via JSX (<Tldraw />) inside EngineHost,
 * so mount/unmount and imperative patching are intentional no-ops.
 */
export default class TldrawAdapter implements EngineAdapter {
  public supportedTools: Set<ToolType>

  constructor() {
    // Tldraw supports every tool in the matrix
    this.supportedTools = new Set<ToolType>(
      Object.keys(engineCapabilityMatrix) as ToolType[]
    )
  }

  mount(_container: HTMLElement, _scene: Scene2D) {}
  unmount() {}
  applyPatch(_prev: Scene2D, _next: Scene2D, _patch: EnginePatch) {}
  getViewport() { return { x: 0, y: 0, scale: 1 } }
  setViewport(_viewport: { x: number; y: number; scale: number }) {}
  hitTest(_x: number, _y: number): string | null { return null }
}
