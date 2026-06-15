import { useElementsStore } from '../stores/elementsStore'

import { useToastStore } from '../stores/toastStore'
import { useUIStore } from '../stores/uiStore'
import { emit } from './audit'
import type { CanvasElement, DoorElement, WindowElement } from '../types/elements'
import { isWallElement } from '../types/elements'
import { removeVertex } from './wallEditing'
import { locateOnStraightSegments } from './wallPath'

export function deleteElements(elementIds: string[]): void {
  const elementsState = useElementsStore.getState().elements

  const validIds = elementIds.filter((id) => {
    const el = elementsState[id]
    return !!el && !el.locked
  })
  if (validIds.length === 0) return

  const toDelete = new Set<string>(validIds)
  for (const id of validIds) {
    const el = elementsState[id]
    if (!el) continue
    if (isWallElement(el)) {
      for (const [childId, child] of Object.entries(elementsState)) {
        if (
          (child.type === 'door' || child.type === 'window') &&
          (child as DoorElement | WindowElement).parentWallId === id
        ) {
          toDelete.add(childId)
        }
      }
    }
  }

  const nextElements = { ...elementsState }
  for (const id of toDelete) delete nextElements[id]

  const cascadeChildIds: string[] = []
  for (const id of toDelete) {
    if (validIds.includes(id)) continue
    cascadeChildIds.push(id)
  }
  const wallsWithCascadeIds = validIds.filter((id) => {
    const el = elementsState[id]
    return el && isWallElement(el)
  })
  const shouldShowCascadeToast =
    wallsWithCascadeIds.length > 0 && cascadeChildIds.length > 0

  let cascadeSnapshot: {
    elements: Record<string, CanvasElement>
  } | null = null
  if (shouldShowCascadeToast) {
    const elemSnap: Record<string, CanvasElement> = {}
    for (const id of toDelete) {
      const el = elementsState[id]
      if (el) elemSnap[id] = el
    }
    cascadeSnapshot = { elements: elemSnap }
  }

  useElementsStore.setState({ elements: nextElements })

  for (const id of toDelete) {
    void emit('element.delete', 'element', id, {})
  }

  if (shouldShowCascadeToast && cascadeSnapshot) {
    const wallCount = wallsWithCascadeIds.length
    const childCount = cascadeChildIds.length
    const wallLabel = wallCount === 1 ? 'wall' : 'walls'
    const childLabel = childCount === 1 ? 'attached element' : 'attached elements'
    const title =
      wallCount === 1
        ? `Wall and ${childCount} ${childLabel} deleted`
        : `${wallCount} ${wallLabel} and ${childCount} ${childLabel} deleted`
    const snapshot = cascadeSnapshot
    const toasts = useToastStore.getState()
    const toastId = toasts.push({
      tone: 'info',
      title,
      action: {
        label: 'Undo',
        onClick: () => {
          const cur = useElementsStore.getState().elements
          const restoredElements = { ...cur, ...snapshot.elements }
          useElementsStore.setState({ elements: restoredElements })
          useToastStore.getState().dismiss(toastId)
        },
      },
    })
  }
}

export function removeWallVertex(wallId: string, vertexIndex: number): void {
  const elementsState = useElementsStore.getState().elements
  const wall = elementsState[wallId]
  if (!wall || !isWallElement(wall) || wall.locked) return

  const vertexCount = wall.points.length / 2
  if (vertexIndex < 0 || vertexIndex >= vertexCount) return

  const removed = removeVertex(wall, vertexIndex)
  if (!removed) {
    deleteElements([wallId])
    useUIStore.getState().setActiveVertex(null)
    return
  }

  const originalSegCount = vertexCount - 1
  const removedSegments = new Set<number>()
  if (vertexIndex === 0) {
    removedSegments.add(0)
  } else if (vertexIndex === vertexCount - 1) {
    removedSegments.add(originalSegCount - 1)
  } else {
    removedSegments.add(vertexIndex - 1)
    removedSegments.add(vertexIndex)
  }

  const childIdsToRemove: string[] = []
  for (const [childId, child] of Object.entries(elementsState)) {
    if (child.type !== 'door' && child.type !== 'window') continue
    const c = child as DoorElement | WindowElement
    if (c.parentWallId !== wallId) continue
    const located = locateOnStraightSegments(
      wall.points,
      wall.bulges,
      c.positionOnWall,
    )
    if (located === null || removedSegments.has(located.segmentIndex)) {
      childIdsToRemove.push(childId)
    }
  }

  const wallSnap: Record<string, CanvasElement> = { [wallId]: wall }
  const childSnap: Record<string, CanvasElement> = {}
  for (const id of childIdsToRemove) {
    const child = elementsState[id]
    if (child) childSnap[id] = child
  }

  const nextElements = { ...elementsState }
  nextElements[wallId] = removed
  for (const id of childIdsToRemove) delete nextElements[id]

  useElementsStore.setState({ elements: nextElements })

  if (childIdsToRemove.length > 0) {
    const count = childIdsToRemove.length
    const label = count === 1 ? 'attached element' : 'attached elements'
    const title = `Vertex removed (${count} ${label} deleted)`
    const toasts = useToastStore.getState()
    const toastId = toasts.push({
      tone: 'info',
      title,
      action: {
        label: 'Undo',
        onClick: () => {
          const cur = useElementsStore.getState().elements
          const restoredElements = { ...cur, ...wallSnap, ...childSnap }
          useElementsStore.setState({ elements: restoredElements })
          useToastStore.getState().dismiss(toastId)
        },
      },
    })
  }
}
