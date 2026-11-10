const CACHE = 'fittrack-v2'
const ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/pwa-192.svg', '/pwa-512.svg']
const DEV_PATHS = ['/@vite', '/@react-refresh', '/@id/', '/@fs/', '/src/', '/node_modules/']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  )
})

// Network first so a new deploy (or the Vite dev server) always wins; cache is only the offline fallback.
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (DEV_PATHS.some((p) => url.pathname.startsWith(p))) return

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() =>
        caches.match(request).then(
          (cached) => cached || (request.mode === 'navigate' ? caches.match('/index.html') : undefined),
        ),
      ),
  )
})
