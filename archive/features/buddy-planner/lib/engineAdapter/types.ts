import type { CanvasElement } from '../../types/elements'
import type { ToolType } from '../../stores/canvasStore'
export interface Scene2D {
  elements: Readonly<Record<string, CanvasElement>>
  selectedIds: readonly string[]
  hoveredId: string | null
  viewport: { x: number; y: number; scale: number }
  readOnly: boolean
}

export interface Wall3D {
  x: number
  y: number
  w: number
  d: number
  h: number
  rot?: number
}

export interface Room3D {
  x: number
  y: number
  w: number
  d: number
  label: string
  color: string
  rot?: number
}

export interface Furniture3D {
  x: number
  y: number
  w: number
  d: number
  h: number
  type: string
  label: string
  rot?: number
}

export interface Scene3D {
  walls: Wall3D[]
  rooms: Room3D[]
  furniture: Furniture3D[]
  bounds: { minX: number; minZ: number; maxX: number; maxZ: number }
}

export interface EnginePatch {
  elements?: Readonly<Record<string, CanvasElement>>
  selectedIds?: readonly string[]
  hoveredId?: string | null
  viewport?: { x: number; y: number; scale: number }
  readOnly?: boolean
}

export interface EngineAdapter {
  mount(container: HTMLElement, scene: Scene2D): void
  unmount(): void
  applyPatch(prev: Scene2D, next: Scene2D, patch: EnginePatch): void
  getViewport(): { x: number; y: number; scale: number }
  setViewport(viewport: { x: number; y: number; scale: number }): void
  hitTest(x: number, y: number): string | null
  supportedTools: Set<ToolType>
  exportPng?(): Promise<Blob>
  exportSvg?(): Promise<string>
}



