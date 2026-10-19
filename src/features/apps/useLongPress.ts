import { useRef, type PointerEvent } from 'react'

/**
 * Fires after a sustained touch or mouse press, and on right-click. Sets a
 * flag so the click that follows a long press can be swallowed.
 */
export function useLongPress(onLongPress: () => void, delayMs = 480) {
  const timer = useRef<number | undefined>(undefined)
  const fired = useRef(false)
  const origin = useRef<{ x: number; y: number } | null>(null)

  const cancel = () => {
    window.clearTimeout(timer.current)
    origin.current = null
  }

  return {
    onPointerDown(e: PointerEvent) {
      if (e.button !== 0) return
      fired.current = false
      origin.current = { x: e.clientX, y: e.clientY }
      timer.current = window.setTimeout(() => {
        fired.current = true
        onLongPress()
      }, delayMs)
    },
    onPointerMove(e: PointerEvent) {
      // Treat movement as a scroll, not a press
      if (origin.current && Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y) > 10) cancel()
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
    onContextMenu(e: { preventDefault: () => void }) {
      e.preventDefault()
      cancel()
      fired.current = true
      onLongPress()
    },
    /** True if the current click is the tail of a long press */
    consumeLongPress() {
      const was = fired.current
      fired.current = false
      return was
    },
  }
}
