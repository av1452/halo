/* Halo service worker. Built by the halo-service-worker Vite plugin, which
 * injects the cache name and the exact list of build files to precache. */

const CACHE = '__HALO_CACHE__'
const PRECACHE = __HALO_PRECACHE__
const SHELL = 'index.html'
const OFFLINE = 'offline.html'
const NETWORK_TIMEOUT_MS = 4000
// Some servers send `Vary: Origin`, and module scripts carry an Origin header,
// which would make cache lookups miss. Precached files are same-origin and
// content-addressed, so Vary can safely be ignored.
const MATCH = { ignoreVary: true }

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)))
  // Don't skipWaiting here: the page asks the user before activating an update
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('halo-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting()
})

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // Only same-origin requests are handled. API calls (weather, App Store,
  // news) and third-party images always go to the network and are never
  // stored, so no personal data ends up in the cache.
  if (url.origin !== self.location.origin) return

  // App navigations: network first so updates arrive promptly, falling back
  // to the cached shell (the router handles the path) and then the offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      withTimeout(fetch(request), NETWORK_TIMEOUT_MS)
        .then((response) => (response.ok || response.status === 404 ? response : Promise.reject(new Error('bad status'))))
        .then((response) => (response.status === 404 ? caches.match(SHELL, MATCH).then((shell) => shell || response) : response))
        .catch(() => caches.match(SHELL, MATCH).then((shell) => shell || caches.match(OFFLINE, MATCH))),
    )
    return
  }

  // Build assets are content-hashed, so the cached copy is always correct
  event.respondWith(caches.match(request, MATCH).then((cached) => cached || fetch(request)))
})
