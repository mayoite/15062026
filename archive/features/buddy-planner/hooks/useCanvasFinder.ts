import { useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { useCanvasFinderStore, type FinderMatch } from '../stores/canvasFinderStore'
import { useElementsStore } from '../stores/elementsStore'
import { useFloorStore } from '../stores/floorStore'
import { focusOnElement } from '../lib/canvasFocus'
import {
  isDeskElement,
  isWorkstationElement,
  isPrivateOfficeElement,
  isConferenceRoomElement,
  isCommonAreaElement,
  isTableElement,
  isWallElement,
  type CanvasElement,
} from '../types/elements'

/**
 * Builds the live match list for the canvas finder, drives focus-on-cycle,
 * and watches for floor/route changes that should auto-close the finder.
 *
 * Search semantics (active floor only):
 *   - Desks / workstations / private offices: match `deskId` and label.
 *   - Conference rooms: `roomName` and `label`.
 *   - Common areas: `areaName` and `label`.
 *   - Tables / walls / everything else: `label` only.
 *
 * Empty / whitespace-only query → `matches: []` (no dimming).
 */
export function useCanvasFinder() {
  const open = useCanvasFinderStore((s) => s.open)
  const query = useCanvasFinderStore((s) => s.query)
  const activeIndex = useCanvasFinderStore((s) => s.activeIndex)
  const setMatches = useCanvasFinderStore((s) => s.setMatches)
  const reset = useCanvasFinderStore((s) => s.reset)

  const elements = useElementsStore((s) => s.elements)
  const activeFloorId = useFloorStore((s) => s.activeFloorId)

  const pathname = usePathname()

  const matches = useMemo<FinderMatch[]>(() => {
    if (!open) return []
    const q = query.trim().toLowerCase()
    if (q.length === 0) return []

    const out: FinderMatch[] = []
    const elementValues = Object.values(elements)

    // --- Elements on the active floor --------------------------------------
    for (const el of elementValues) {
      const matched = matchElement(el, q)
      if (matched) {
        out.push({
          kind: 'element',
          id: el.id,
          anchorId: el.id,
          label: matched,
        })
      }
    }

    return out
  }, [open, query, elements])

  // Push the computed matches into the store
  useEffect(() => {
    setMatches(matches)
  }, [matches, setMatches])

  // Pan to the active match
  useEffect(() => {
    if (!open) return
    const list = useCanvasFinderStore.getState().matches
    if (list.length === 0) return
    const m = list[activeIndex]
    if (!m) return
    const el = useElementsStore.getState().elements[m.anchorId]
    if (el) {
      focusOnElement(
        { x: el.x, y: el.y, width: el.width, height: el.height },
        m.anchorId,
      )
    }
  }, [open, activeIndex, matches.length])

  // Auto-close when the active floor changes
  useEffect(() => {
    return () => {
      reset()
    }
  }, [activeFloorId, pathname, reset])
}

function matchElement(
  el: CanvasElement,
  q: string,
): string | null {
  if (isWallElement(el)) {
    if (el.label && el.label.toLowerCase().includes(q)) return el.label
    return null
  }

  if (isConferenceRoomElement(el)) {
    if (el.roomName && el.roomName.toLowerCase().includes(q)) return el.roomName
    if (el.label && el.label.toLowerCase().includes(q)) return el.label
    return null
  }

  if (isCommonAreaElement(el)) {
    if (el.areaName && el.areaName.toLowerCase().includes(q)) return el.areaName
    if (el.label && el.label.toLowerCase().includes(q)) return el.label
    return null
  }

  if (isDeskElement(el)) {
    if (el.deskId && el.deskId.toLowerCase().includes(q)) return el.deskId
    if (el.label && el.label.toLowerCase().includes(q)) return el.label
    return null
  }

  if (isWorkstationElement(el)) {
    if (el.deskId && el.deskId.toLowerCase().includes(q)) return el.deskId
    if (el.label && el.label.toLowerCase().includes(q)) return el.label
    return null
  }

  if (isPrivateOfficeElement(el)) {
    if (el.deskId && el.deskId.toLowerCase().includes(q)) return el.deskId
    if (el.label && el.label.toLowerCase().includes(q)) return el.label
    return null
  }

  if (isTableElement(el)) {
    if (el.label && el.label.toLowerCase().includes(q)) return el.label
    return null
  }

  if (el.label && el.label.toLowerCase().includes(q)) return el.label
  return null
}
