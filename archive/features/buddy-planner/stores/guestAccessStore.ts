import { create } from 'zustand'
import { useToastStore } from './toastStore'

interface GuestAccessState {
  enabled: boolean
  setEnabled: (enabled: boolean) => void
  announceBlocked: (action: string) => void
}

export const useGuestAccessStore = create<GuestAccessState>((set) => ({
  enabled: false,
  setEnabled: (enabled) => set({ enabled }),
  announceBlocked: (action) => {
    useToastStore.getState().push({
      tone: 'info',
      title: `${action} is disabled in guest mode`,
      body: 'Explore the full workspace, then sign in to save, import, export, or print.',
    })
  },
}))
