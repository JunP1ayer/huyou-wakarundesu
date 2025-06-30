// Custom Service Worker for notifications and analytics
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'show-notification') {
    const { payload } = event.data
    
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/icons/icon.svg',
      badge: payload.badge || '/icons/icon.svg',
      tag: payload.tag || 'fuyou-notification',
      requireInteraction: payload.requireInteraction || false,
      data: payload.data,
      actions: [
        {
          action: 'view',
          title: 'ダッシュボードを見る'
        },
        {
          action: 'dismiss',
          title: '閉じる'
        }
      ]
    })
  }
})

// Handle notification clicks with analytics tracking
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  // Track notification click via postMessage to clients
  if (event.notification.data && event.notification.data.percentage) {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'track-notification-click',
          percentage: event.notification.data.percentage
        })
      })
    })
  }
  
  if (event.action === 'view') {
    // Open dashboard
    event.waitUntil(
      clients.openWindow('/dashboard')
    )
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return
  } else {
    // Default action: open dashboard
    event.waitUntil(
      clients.openWindow('/dashboard')
    )
  }
})

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag)
})

// Background sync for periodic checks (if supported)
if ('sync' in self.registration) {
  self.addEventListener('sync', (event) => {
    if (event.tag === 'threshold-check') {
      event.waitUntil(
        // This would be implemented for background checks
        console.log('Background threshold check triggered')
      )
    }
  })
}

// Listen for PWA install event tracking
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'track-pwa-install') {
    // Notify clients to track PWA install
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'track-pwa-install'
        })
      })
    })
  }
})

// Import the next-pwa generated service worker
// This ensures we don't lose PWA functionality
try {
  importScripts('/sw.js')
} catch (error) {
  console.log('Could not import next-pwa sw.js, running standalone')
}