import { useEffect, useSyncExternalStore } from 'react'

/** Whether the search overlay is open; shared by every page header. */
let open = false
const listeners = new Set<() => void>()

export function setSearchOpen(next: boolean) {
  if (open === next) return
  open = next
  listeners.forEach((l) => l())
}

export function useSearchOpen() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => open,
    () => open,
  )
}

function isTypingTarget(el: EventTarget | null) {
  return el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
}

/** ⌘K / Ctrl+K anywhere, or "/" when not typing, opens search. */
export function useSearchShortcut() {
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      } else if (e.key === '/' && !isTypingTarget(e.target)) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
}
