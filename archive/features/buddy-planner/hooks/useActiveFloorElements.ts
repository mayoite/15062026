import { useMemo } from 'react'
import { useElementsStore } from '../stores/elementsStore'
import { useFloorStore } from '../stores/floorStore'
import type { CanvasElement } from '../types/elements'

/**
 * Single-floor contract: the active floor is always the live element source.
 * The `floorId` parameter is retained for compatibility with older callers
 * that still pass explicit ids, but the store only keeps one canonical floor.
 */
 
export function useFloorElements(_floorId: string): Record<string, CanvasElement> {
  const activeElements = useElementsStore((s) => s.elements)
  const floor = useFloorStore((s) => s.floors[0] ?? null)

  return useMemo(() => {
    if (!floor) return {}
    return activeElements
  }, [activeElements, floor])
}

/**
 * Compatibility wrapper for callers that still expect a per-floor array.
 * In strict single-floor mode this returns one live floor snapshot.
 */
export function useAllFloorElements(): Array<{
  floorId: string
  floorName: string
  elements: Record<string, CanvasElement>
}> {
  const activeElements = useElementsStore((s) => s.elements)
  const floor = useFloorStore((s) => s.floors[0] ?? null)

  return useMemo(() => {
    if (!floor) return []
    return [
      {
        floorId: floor.id,
        floorName: floor.name,
        elements: activeElements,
      },
    ]
  }, [floor, activeElements])
}



