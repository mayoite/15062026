import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { Floor } from '../types/floor'
import type { CanvasElement } from '../types/elements'

export const CANONICAL_FLOOR_ID = nanoid()

function makeFloor(): Floor {
  return { id: CANONICAL_FLOOR_ID, name: 'Floor 1', order: 0, elements: {} }
}

interface FloorState {
  floors: Floor[]
  activeFloorId: string

  setActiveFloor: (floorId: string) => void
  getActiveFloor: () => Floor | undefined
  getFloorElements: (floorId: string) => Record<string, CanvasElement>
  setFloorElements: (floorId: string, elements: Record<string, CanvasElement>) => void
}

export const useFloorStore = create<FloorState>((set, get) => ({
  floors: [makeFloor()],
  activeFloorId: CANONICAL_FLOOR_ID,

  setActiveFloor: () => {},

  getActiveFloor: () => get().floors[0],

  getFloorElements: () => get().floors[0]?.elements ?? {},

  setFloorElements: (_floorId, elements) =>
    set((state) => {
      const single = state.floors[0]
      if (!single) return state
      return { floors: [{ ...single, elements }], activeFloorId: single.id }
    }),
}))



