 
import type { EngineAdapter, Scene2D, EnginePatch } from '../types'
import { engineCapabilityMatrix } from '../capabilityMatrix'
import type { ToolType } from '../../../stores/canvasStore'

/**
 * ThreeAdapter provides tool-capability metadata for ToolSelector.
 * The 3D view is rendered directly by ThreeScene JSX in EngineHost —
 * mount/unmount are intentional no-ops.
 */
export default class ThreeAdapter implements EngineAdapter {
  public supportedTools = new Set<ToolType>()

  constructor() {
    for (const [tool, engines] of Object.entries(engineCapabilityMatrix)) {
      if (engines.has('three3d')) {
        this.supportedTools.add(tool as ToolType)
      }
    }
  }

  mount(_container: HTMLElement, _scene: Scene2D) {}
  unmount() {}
  applyPatch(_prev: Scene2D, _next: Scene2D, _patch: EnginePatch) {}
  getViewport() { return { x: 0, y: 0, scale: 1 } }
  setViewport(_viewport: { x: number; y: number; scale: number }) {}
  hitTest(_x: number, _y: number): string | null { return null }
}



