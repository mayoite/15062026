import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { temporal } from 'zundo'
import { nanoid } from 'nanoid'
import type { CanvasElement } from '../types/elements'

import { UNDO_LIMIT } from '../lib/constants'

interface ElementsState {
  elements: Record<string, CanvasElement>

  // CRUD
  addElement: (element: CanvasElement) => void
  /**
   * Batched additive create. The whole array is added in a single store
   * mutation so zundo records ONE history entry — undo rolls back the
   * entire batch. Used by the rectangle/room tool (4 walls in one
   * gesture) and by anything else that creates multiple elements as a
   * single user-visible action. `addElement` per-element would record
   * N history entries instead and force the user to undo N times.
   */
  addElements: (elements: CanvasElement[]) => void
  updateElement: (id: string, updates: Partial<CanvasElement>) => void
  removeElement: (id: string) => void
  removeElements: (ids: string[]) => void
  setElements: (elements: Record<string, CanvasElement>) => void

  // Bulk
  duplicateElements: (ids: string[]) => string[]
  moveElements: (ids: string[], dx: number, dy: number) => void

  // Z-ordering
  bringToFront: (id: string) => void
  sendToBack: (id: string) => void
  bringForward: (id: string) => void
  sendBackward: (id: string) => void

  // Grouping
  groupElements: (ids: string[]) => string
  ungroupElements: (groupId: string) => void

  // Helpers
  getMaxZIndex: () => number
  getElementsByGroup: (groupId: string) => CanvasElement[]
}


export const useElementsStore = create<ElementsState>()(
  subscribeWithSelector(
    temporal(
      (set, get) => ({
      elements: {},

      addElement: (element) =>
        set((state) => ({
          elements: { ...state.elements, [element.id]: element },
        })),

      addElements: (els) =>
        set((state) => {
          if (els.length === 0) return state
          const next = { ...state.elements }
          for (const el of els) next[el.id] = el
          return { elements: next }
        }),

      updateElement: (id, updates) =>
        set((state) => {
          const existing = state.elements[id]
          if (!existing) return state
          return {
            elements: {
              ...state.elements,
              [id]: { ...existing, ...updates } as CanvasElement,
            },
          }
        }),

      removeElement: (id) =>
        set((state) => {
          const { [id]: _removed, ...rest } = state.elements
          void _removed
          return { elements: rest }
        }),

      removeElements: (ids) =>
        set((state) => {
          const next = { ...state.elements }
          for (const id of ids) {
            delete next[id]
          }
          return { elements: next }
        }),

      setElements: (elements) => set({ elements }),

      duplicateElements: (ids) => {
        const newIds: string[] = []
        const newGroupId = nanoid()
        set((state) => {
          const next = { ...state.elements }
          for (const id of ids) {
            const el = state.elements[id]
            if (!el) continue
            const newId = nanoid()
            newIds.push(newId)
            next[newId] = {
              ...el,
              id: newId,
              x: el.x + 20,
              y: el.y + 20,
              groupId: ids.length > 1 ? newGroupId : el.groupId,
              zIndex: get().getMaxZIndex() + 1,
            } as CanvasElement
          }
          return { elements: next }
        })
        return newIds
      },

      moveElements: (ids, dx, dy) =>
        set((state) => {
          const next = { ...state.elements }
          for (const id of ids) {
            const el = next[id]
            if (!el || el.locked) continue
            next[id] = { ...el, x: el.x + dx, y: el.y + dy } as CanvasElement
          }
          return { elements: next }
        }),

      bringToFront: (id) =>
        set((state) => {
          const el = state.elements[id]
          if (!el) return state
          return {
            elements: {
              ...state.elements,
              [id]: { ...el, zIndex: get().getMaxZIndex() + 1 } as CanvasElement,
            },
          }
        }),

      sendToBack: (id) =>
        set((state) => {
          const el = state.elements[id]
          if (!el) return state
          // Manual loop instead of Math.min(...arr) to avoid hitting the JS
          // argument-count limit on very large element sets.
          let minZ = Infinity
          for (const e of Object.values(state.elements)) {
            if (e.zIndex < minZ) minZ = e.zIndex
          }
          if (minZ === Infinity) minZ = 0
          return {
            elements: {
              ...state.elements,
              [id]: { ...el, zIndex: minZ - 1 } as CanvasElement,
            },
          }
        }),

      bringForward: (id) =>
        set((state) => {
          const el = state.elements[id]
          if (!el) return state
          return {
            elements: {
              ...state.elements,
              [id]: { ...el, zIndex: el.zIndex + 1 } as CanvasElement,
            },
          }
        }),

      sendBackward: (id) =>
        set((state) => {
          const el = state.elements[id]
          if (!el) return state
          return {
            elements: {
              ...state.elements,
              [id]: { ...el, zIndex: el.zIndex - 1 } as CanvasElement,
            },
          }
        }),

      groupElements: (ids) => {
        const groupId = nanoid()
        set((state) => {
          const next = { ...state.elements }
          for (const id of ids) {
            const el = next[id]
            if (!el) continue
            next[id] = { ...el, groupId } as CanvasElement
          }
          return { elements: next }
        })
        return groupId
      },

      ungroupElements: (groupId) =>
        set((state) => {
          const next = { ...state.elements }
          for (const [id, el] of Object.entries(next)) {
            if (el.groupId === groupId) {
              next[id] = { ...el, groupId: null } as CanvasElement
            }
          }
          return { elements: next }
        }),

      getMaxZIndex: () => {
        // Manual loop instead of Math.max(...arr) to avoid hitting the JS
        // argument-count limit on very large element sets.
        let maxZ = -Infinity
        for (const e of Object.values(get().elements)) {
          if (e.zIndex > maxZ) maxZ = e.zIndex
        }
        return maxZ === -Infinity ? 0 : maxZ
      },

      getElementsByGroup: (groupId) =>
        Object.values(get().elements).filter((e) => e.groupId === groupId),
      }),
      {
        limit: UNDO_LIMIT,

      }
    )
  )
)



