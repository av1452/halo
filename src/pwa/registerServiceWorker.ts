import { showToast } from '../components/toastStore'

/**
 * Registers the service worker in production builds. When a new version has
 * installed, the user is asked before it takes over, so nobody is reloaded
 * mid-task and nobody is stuck on a stale version.
 */
export function registerServiceWorker(base = import.meta.env.BASE_URL) {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator) || !window.isSecureContext) return

  // Reload only after the user accepts an update. The first install also
  // fires controllerchange (via clients.claim) and must not reload the page.
  let updateAccepted = false
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!updateAccepted || reloading) return
    reloading = true
    window.location.reload()
  })

  const promptUpdate = (worker: ServiceWorker) =>
    showToast(
      {
        message: 'A new version of Halo is ready.',
        actions: [
          {
            label: 'Reload',
            onSelect: () => {
              updateAccepted = true
              worker.postMessage({ type: 'SKIP_WAITING' })
            },
          },
        ],
      },
      60_000,
    )

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${base}sw.js`, { scope: base })
      .then((registration) => {
        // A previous visit may have left an update waiting
        if (registration.waiting && navigator.serviceWorker.controller) promptUpdate(registration.waiting)
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) promptUpdate(worker)
          })
        })
        // Installed PWAs can stay open for days; check again when they're brought back
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') registration.update().catch(() => undefined)
        })
      })
      .catch(() => {
        // Offline support is an enhancement; the app works without it
      })
  })
}
