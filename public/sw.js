// NeuralFlow Service Worker - Web Push Notifications & Background Handler

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Listen for Web Push events from Nuxt Nitro backend
self.addEventListener('push', (event) => {
  let data = {
    title: 'NeuralFlow Focus Session Completed! 🎯',
    body: 'Great job! Time for a recharge break.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    url: '/recovery'
  }

  if (event.data) {
    try {
      const parsed = event.data.json()
      data = { ...data, ...parsed }
    } catch (e) {
      data.body = event.data.text() || data.body
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon || '/favicon.svg',
    badge: data.badge || '/favicon.svg',
    vibrate: [200, 100, 200, 100, 300],
    data: {
      url: data.url || '/recovery'
    },
    actions: [
      { action: 'open', title: 'Open App ⚡' }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  )
})

// Handle notification click to bring PWA window back to focus
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/execute'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus open window if available
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus()
          if ('navigate' in client) {
            return client.navigate(targetUrl)
          }
          return
        }
      }
      // Open new window if none is currently focused
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
