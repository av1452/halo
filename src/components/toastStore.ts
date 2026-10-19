import { useSyncExternalStore } from 'react'

export interface ToastAction {
  label: string
  onSelect: () => void
}

export interface Toast {
  id: number
  message: string
  tone?: 'info' | 'success' | 'warning'
  actions?: ToastAction[]
}

let toasts: Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function showToast(toast: Omit<Toast, 'id'>, durationMs = toast.actions ? 8000 : 3500) {
  const id = nextId++
  toasts = [...toasts.slice(-2), { ...toast, id }]
  emit()
  setTimeout(() => dismissToast(id), durationMs)
  return id
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

export function useToasts() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => toasts,
    () => toasts,
  )
}
