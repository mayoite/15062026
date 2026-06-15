import { create } from 'zustand'
import type { EngineId } from '../lib/engineAdapter/registry'
import type { EngineAdapter } from '../lib/engineAdapter/types'

interface EngineState {
  activeEngineId: EngineId
  show3D: boolean
  adapterRef: { current: EngineAdapter | null }
  setEngine: (engine: EngineId) => void
  toggle3D: () => void
  setShow3D: (show: boolean) => void
}

export const useEngineStore = create<EngineState>((set) => ({
  activeEngineId: 'tldraw',
  show3D: false,
  adapterRef: { current: null },
  setEngine: (engine) => set({ activeEngineId: engine }),
  toggle3D: () => set((s) => ({ show3D: !s.show3D })),
  setShow3D: (show) => set({ show3D: show }),
}))



