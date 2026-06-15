import type { ToolType } from '../../stores/canvasStore'
import type { EngineId } from './registry'

// Maps every ToolType to the set of engines that support it.
// Used by ToolSelector to disable unsupported tools and by
// adapter constructors to self-report their supported tool set.
export const engineCapabilityMatrix: Record<ToolType, Set<EngineId>> = {
  select:           new Set(['three3d']),
  pan:              new Set(['three3d']),
  wall:             new Set(),
  door:             new Set(),
  window:           new Set(),
  room:             new Set(),
  'rect-shape':     new Set(),
  ellipse:          new Set(),
  'line-shape':     new Set(),
  arrow:            new Set(),
  'free-text':      new Set(),
  measure:          new Set(),
  'calibrate-scale':new Set(),
  neighborhood:     new Set(),
  pin:              new Set(),
  book:             new Set(),
}



