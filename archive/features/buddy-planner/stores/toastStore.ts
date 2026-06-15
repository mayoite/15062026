import { create } from 'zustand'
import { toast as sonnerToast } from 'sonner'
import { nanoid } from 'nanoid'

export type ToastTone = 'info' | 'success' | 'warning' | 'error'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastItem {
  id: string
  tone: ToastTone
  title: string
  body?: string
  action?: ToastAction
}

interface ToastState {
  items: ToastItem[]
  push: (item: Omit<ToastItem, 'id'>) => string
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastState>(() => ({
  items: [], // no longer used natively, just fulfilling interface if someone reads it
  push: (item) => {
    const id = nanoid()
    const options = {
      id,
      description: item.body,
      action: item.action ? { label: item.action.label, onClick: item.action.onClick } : undefined
    }

    if (item.tone === 'error') {
      sonnerToast.error(item.title, options)
    } else if (item.tone === 'success') {
      sonnerToast.success(item.title, options)
    } else if (item.tone === 'warning') {
      sonnerToast.warning(item.title, options)
    } else {
      sonnerToast.info(item.title, options)
    }
    return id
  },
  dismiss: (id) => {
    sonnerToast.dismiss(id)
  },
}))



