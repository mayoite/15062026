// @ts-nocheck
/**
 * SpatialIndex — RBush-backed R-tree over CanvasElement AABBs.
 *
 * Why: iterating Object.values(elements) on every render frame (and in
 * planHealth) is O(n) per query. At 5k+ elements this blows the 16ms
 * frame budget. The R-tree answers "which elements intersect this rect?"
 * in O(log n + k) where k is the result set — typically a small fraction
 * of total elements when the viewport is zoomed in.
 *
 * Usage:
 *   const idx = new SpatialIndex()
 *   idx.rebuild(elements)                      // full load / floor switch
 *   idx.update(id, elementBounds(el))          // single-element mutation
 *   idx.remove(id)                             // deletion
 *   const ids = idx.query({ x, y, width, height }) // viewport cull
 */
import RBush from 'rbush'
import { elementBounds } from './elementBounds'
import type { CanvasElement } from '../types/elements'

interface IndexEntry {
  minX: number
  minY: number
  maxX: number
  maxY: number
  id: string
}

export interface ViewportAABB {
  x: number
  y: number
  width: number
  height: number
}

export class SpatialIndex {
  private tree = new RBush<IndexEntry>()
  /** Fast id→entry lookup so updates/removes don't need a tree search. */
  private byId = new Map<string, IndexEntry>()

  /**
   * Full rebuild from a flat element map. Called on floor switch or
   * initial payload load. Cheaper than incremental on >1000 elements
   * (rbush bulk-load is O(n log n) vs repeated inserts at O(n log n) but
   * with better constant factor via OMT algorithm).
   */
  rebuild(elements: Record<string, CanvasElement>): void {
    this.tree.clear()
    this.byId.clear()
    const entries: IndexEntry[] = []
    for (const id in elements) {
      const b = elementBounds(elements[id])
      if (!b) continue
      const entry: IndexEntry = {
        minX: b.x,
        minY: b.y,
        maxX: b.x + b.width,
        maxY: b.y + b.height,
        id,
      }
      entries.push(entry)
      this.byId.set(id, entry)
    }
    this.tree.load(entries)
  }

  /**
   * Update a single element's bounding box. Called after position/size
   * mutations in elementsStore so the index stays in sync without a full
   * rebuild. No-op if the element has no computable AABB (e.g. a zero-
   * length wall that hasn't been committed yet).
   */
  update(id: string, el: CanvasElement): void {
    const b = elementBounds(el)
    if (!b) return
    const prev = this.byId.get(id)
    if (prev) this.tree.remove(prev)
    const entry: IndexEntry = {
      minX: b.x,
      minY: b.y,
      maxX: b.x + b.width,
      maxY: b.y + b.height,
      id,
    }
    this.tree.insert(entry)
    this.byId.set(id, entry)
  }

  /** Remove an element from the index on deletion. */
  remove(id: string): void {
    const entry = this.byId.get(id)
    if (!entry) return
    this.tree.remove(entry)
    this.byId.delete(id)
  }

  /**
   * Return element IDs whose AABBs intersect the given viewport rectangle.
   * The caller should pad the viewport by ~10% to avoid pop-in at edges.
   *
   * The returned array is unsorted — callers that need z-order must sort
   * by zIndex from the elements map after culling.
   */
  query(viewport: ViewportAABB): string[] {
    const results = this.tree.search({
      minX: viewport.x,
      minY: viewport.y,
      maxX: viewport.x + viewport.width,
      maxY: viewport.y + viewport.height,
    })
    return results.map((r) => r.id)
  }

  /**
   * Spatial join: for a given AABB, return IDs of elements that overlap it.
   * Used by the plan health analyzer instead of the O(n²) pair loop.
   */
  queryOverlapping(aabb: { x: number; y: number; width: number; height: number }): string[] {
    return this.query(aabb)
  }

  /** Total number of indexed elements. Useful for debugging. */
  get size(): number {
    return this.byId.size
  }

  /** True if the index contains an entry for this id. */
  has(id: string): boolean {
    return this.byId.has(id)
  }

  /**
   * Return the overall AABB of all indexed elements.
   * Useful for zoom-to-fit without recomputing elementBounds for every element.
   */
  getBounds(): ViewportAABB | null {
    if (this.byId.size === 0) return null
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const entry of this.byId.values()) {
      if (entry.minX < minX) minX = entry.minX
      if (entry.minY < minY) minY = entry.minY
      if (entry.maxX > maxX) maxX = entry.maxX
      if (entry.maxY > maxY) maxY = entry.maxY
    }
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }
}

/**
 * Global singleton index for the active floor. 
 * Managed by useSpatialIndex hook, but accessible for non-React reads (e.g. stores).
 */
export const globalSpatialIndex = new SpatialIndex()

/**
 * Expand a viewport AABB by a fractional padding so elements near the
 * edge are included before they are fully visible (prevents pop-in).
 * Default padding is 10% of each dimension.
 */
export function padViewport(viewport: ViewportAABB, factor = 0.1): ViewportAABB {
  const dx = viewport.width * factor
  const dy = viewport.height * factor
  return {
    x: viewport.x - dx,
    y: viewport.y - dy,
    width: viewport.width + dx * 2,
    height: viewport.height + dy * 2,
  }
}

/**
 * Convert a canvas viewport (stageX, stageY, stageScale, stageWidth,
 * stageHeight) into world-space AABB coordinates that the SpatialIndex
 * understands.
 */
export function viewportToWorldAABB(
  stageX: number,
  stageY: number,
  stageScale: number,
  stageWidth: number,
  stageHeight: number,
): ViewportAABB {
  const x = -stageX / stageScale
  const y = -stageY / stageScale
  return {
    x,
    y,
    width: stageWidth / stageScale,
    height: stageHeight / stageScale,
  }
}



