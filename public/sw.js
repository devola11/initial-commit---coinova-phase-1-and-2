const CACHE_NAME = 'coinova-v3'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo.jpeg',
  '/manifest.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => console.log('SW install:', err))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  if (event.request.method !== 'GET') return
  if (!url.protocol.startsWith('http')) return
  if (url.hostname.includes('supabase.co')) return
  if (url.hostname.includes('coingecko.com')) return
  if (url.hostname.includes('alternative.me')) return
  if (url.hostname.includes('anthropic.com')) return
  if (url.pathname.startsWith('/api/')) return

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(event.request)

        if (!response || !response.ok || response.type === 'opaque' || response.status === 0) {
          return response || new Response('', { status: 404, statusText: 'Not Found' })
        }

        try {
          const clone = response.clone()
          const cache = await caches.open(CACHE_NAME)
          await cache.put(event.request, clone)
        } catch { /* ignore cache write failures */ }

        return response
      } catch (err) {
        const cached = await caches.match(event.request)
        if (cached) return cached

        if (event.request.destination === 'document') {
          const fallback = await caches.match('/index.html')
          if (fallback) return fallback
        }

        return new Response(
          JSON.stringify({ error: 'Offline' }),
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
    })()
  )
})

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Coinova',
      {
        body: data.body || 'You have a new notification',
        icon: '/logo.jpeg',
        badge: '/logo.jpeg',
        data: data.url || '/',
      }
    )
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data || '/'))
})
