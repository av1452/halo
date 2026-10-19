import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** Captured globally because the event can fire before Settings mounts. */
let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    listeners.forEach((l) => l())
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    listeners.forEach((l) => l())
  })
}

export function isStandalone() {
  const nav = navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches === true
}

export function isAppleMobile(ua = navigator.userAgent, platform = navigator.platform, touchPoints = navigator.maxTouchPoints) {
  // iPadOS reports itself as a Mac, so check for touch support too
  return /iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && touchPoints > 1)
}

export function useInstallState() {
  const [, setTick] = useState(0)
  useEffect(() => {
    const bump = () => setTick((t) => t + 1)
    listeners.add(bump)
    return () => {
      listeners.delete(bump)
    }
  }, [])

  return {
    standalone: isStandalone(),
    appleMobile: isAppleMobile(),
    canPrompt: deferredPrompt !== null,
    async prompt() {
      if (!deferredPrompt) return 'unavailable' as const
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      deferredPrompt = null
      listeners.forEach((l) => l())
      return outcome
    },
    offlineReady: 'serviceWorker' in navigator && window.isSecureContext,
  }
}
