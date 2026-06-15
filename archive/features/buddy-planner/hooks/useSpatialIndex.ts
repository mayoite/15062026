/**
 * useSpatialIndex — React hook that keeps a SpatialIndex in sync with
 * elementsStore.
 *
 * Design decisions:
 * - The index is stored in a ref (not state) so it never triggers a React
 *   re-render; callers subscribe to elementsStore directly for their own
 *   render triggers.
 * - `rebuild` is called on floor switch (the whole element map is replaced)
 *   and on initial mount. Single-element CRUD mutations (add/update/remove)
 *   are patched incrementally to avoid O(n) bulk-load on every keystroke.
 * - The returned `query` function is stable across renders (useCallback with
 *   empty deps) because it closes over the ref, not the index instance.
 */
import { useEffect, useRef, useCallback } from 'react'
import { useElementsStore } from '../stores/elementsStore'
import { padViewport, viewportToWorldAABB, globalSpatialIndex } from '../lib/spatialIndex'
import type { ViewportAABB , SpatialIndex} from '../lib/spatialIndex'
import type { CanvasElement } from '../types/elements'

export interface UseSpatialIndexReturn {
  /**
   * Query element IDs visible in the given viewport. Applies 10% padding
   * so elements near the viewport edge are included before they are fully
   * on-screen. The returned array is unsorted.
   */
  query: (viewport: ViewportAABB) => string[]
  /**
   * Query element IDs visible given raw canvas stage coordinates. Convenience
   * wrapper used by CanvasStage to avoid repeating the stageX/Y/scale math.
   */
  queryStage: (stageX: number, stageY: number, scale: number, width: number, height: number) => string[]
  /**
   * Return element IDs whose AABBs overlap the given AABB. Used by the plan
   * health analyzer desk-overlap check.
   */
  queryOverlapping: (aabb: ViewportAABB) => string[]
  /** Current number of indexed elements (for debugging/devtools). */
  size: () => number
}

export function useSpatialIndex(): UseSpatialIndexReturn {
  const indexRef = useRef<SpatialIndex>(globalSpatialIndex)

  // Full rebuild on mount and whenever the element map reference is replaced
  // (which happens on floor switch via setElements()).
  useEffect(() => {
    const rebuild = () => {
      const elements = useElementsStore.getState().elements
      indexRef.current.rebuild(elements)
    }

    // Initial build
    rebuild()

    // Subscribe to elementsStore. Zustand's subscribe gives us (nextState,
    // prevState) — we compare element map references to detect full reloads
    // vs. incremental mutations.
    const unsub = useElementsStore.subscribe((state) => state.elements, (nextElements, prevElements) => {
      // Detect full replacement (floor switch / setElements) — element map
      // reference changes but the new map shares no keys with the previous.
      // Heuristic: if the overlap of ids is < 10% of the larger set, treat
      // as a full rebuild. Otherwise patch incrementally.
      const nextIds = Object.keys(nextElements)
      const prevIds = new Set(Object.keys(prevElements))

      const overlap = nextIds.filter((id) => prevIds.has(id)).length
      const maxSize = Math.max(nextIds.length, prevIds.size)
      const isFullReplace = maxSize > 0 && overlap / maxSize < 0.1

      if (isFullReplace) {
        indexRef.current.rebuild(nextElements)
        return
      }

      // Incremental patch: find added/updated/removed ids.
      const nextSet = new Set(nextIds)

      // Removed
      for (const id of prevIds) {
        if (!nextSet.has(id)) indexRef.current.remove(id)
      }

      // Added or updated — compare the element reference for cheap equality
      for (const id of nextIds) {
        const prevEl: CanvasElement | undefined = prevElements[id]
        const nextEl = nextElements[id]
        if (prevEl !== nextEl) {
          indexRef.current.update(id, nextEl)
        }
      }
    })

    return unsub
  }, [])

  const query = useCallback((viewport: ViewportAABB): string[] => {
    return indexRef.current.query(padViewport(viewport))
  }, [])

  const queryStage = useCallback(
    (stageX: number, stageY: number, scale: number, width: number, height: number): string[] => {
      const worldAABB = viewportToWorldAABB(stageX, stageY, scale, width, height)
      return indexRef.current.query(padViewport(worldAABB))
    },
    [],
  )

  const queryOverlapping = useCallback((aabb: ViewportAABB): string[] => {
    // No padding for overlap queries — we want exact intersection, not
    // the fuzzy viewport-edge padding.
    return indexRef.current.queryOverlapping(aabb)
  }, [])

  const size = useCallback((): number => {
    return indexRef.current.size
  }, [])

  return { query, queryStage, queryOverlapping, size }
}



