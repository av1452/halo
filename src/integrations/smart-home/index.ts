import { useEffect, useSyncExternalStore } from 'react'
import { demoProvider } from './demoProvider'
import type { SmartHomeProvider } from './types'

export * from './types'
export { isSceneActive, TARGET_MAX, TARGET_MIN } from './logic'

/**
 * The active provider. Only the demo exists today; a real integration would
 * be selected here based on a saved configuration.
 */
export const smartHome: SmartHomeProvider = demoProvider

export function useSmartHome() {
  return useSyncExternalStore(smartHome.subscribe, smartHome.getSnapshot, smartHome.getSnapshot)
}

/** Runs the demo simulation while the page is visible. */
export function useDemoSimulation(intervalMs = 4000) {
  useEffect(() => {
    if (!smartHome.simulated) return
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') demoProvider.tick()
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
}
