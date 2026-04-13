const CACHE_NAME = 'coinova-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo.jpeg',
  '/manifest.json'
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  if (event.request.method !== 'GET') return
  if (!url.protocol.startsWith('http')) return
  if (url.pathname.startsWith('/api/')) return
  if (url.hostname.includes('supabase.co')) return
  if (url.hostname.includes('coingecko.com')) return

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (
          response.ok &&
          url.protocol.startsWith('http')
        ) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => {
            try {
              cache.put(event.request, clone)
            } catch(e) {}
          })
        }
        return response
      })
      .catch(() => {
        return caches.match(event.request)
          .then(cached => cached ||
            caches.match('/index.html'))
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
