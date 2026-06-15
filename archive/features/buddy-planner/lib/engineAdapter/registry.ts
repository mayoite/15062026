import type { EngineAdapter } from './types'

export type EngineId = 'three3d' | 'tldraw'

type EngineFactory = () => Promise<{ default: new () => EngineAdapter }>

export const engineRegistry: Record<EngineId, EngineFactory> = {
  three3d: () => import('./three3d/ThreeAdapter').then((m) => m as unknown as { default: new () => EngineAdapter }),
  tldraw: () => import('./tldraw/TldrawAdapter').then((m) => m as unknown as { default: new () => EngineAdapter }),
}
