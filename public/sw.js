const CACHE_NAME = 'coinova-v2'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo.jpeg',
  '/manifest.json',
  '/cnc-logo-192.png'
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  if (event.request.method !== 'GET') return
  if (!url.protocol.startsWith('http')) return
  if (url.hostname.includes('supabase.co')) return
  if (url.hostname.includes('coingecko.com')) return
  if (url.hostname.includes('alternative.me')) return
  if (url.pathname.startsWith('/api/')) return
  if (url.pathname.includes('chrome-extension')) return

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (!response || !response.ok || response.type === 'opaque') {
          return response
        }
        const clone = response.clone()
        caches.open(CACHE_NAME)
          .then(cache => {
            try {
              cache.put(event.request, clone)
            } catch(e) {}
          })
        return response
      })
      .catch(() => {
        return caches.match(event.request)
          .then(cached => {
            if (cached) return cached
            if (event.request.destination === 'document') {
              return caches.match('/index.html')
            }
          })
      })
  )
})

self.addEventListener('push', event => {
  const data = event.data?.json() || {}
  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Coinova',
      {
        body: data.body || 'You have a new notification',
        icon: '/logo.jpeg',
        badge: '/logo.jpeg',
        data: data.url || '/'
      }
    )
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  )
})
