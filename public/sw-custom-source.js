// Enhanced Service Worker for notifications, analytics, and aggressive cache management
// Import cache version from external file (updated on each deployment)
importScripts('/sw-version.js');

// Use imported version constants
const CACHE_VERSION = self.CACHE_VERSION || 'v3::' + Date.now();
const CHUNK_CACHE_NAME = 'chunks-' + CACHE_VERSION;
const STATIC_CACHE_NAME = 'static-' + CACHE_VERSION;

// Force immediate activation to prevent stale chunk issues
self.addEventListener('install', (event) => {
  console.log('[SW] Installing new service worker with version:', CACHE_VERSION)
  self.skipWaiting() // Immediately take control, bypassing waiting
})

// Aggressive cache cleanup - delete ALL caches that don't match current version
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new service worker with aggressive cache purge...')
  
  event.waitUntil(
    caches.keys().then((keys) => {
      console.log('[SW] Found existing caches:', keys)
      return Promise.all(
        keys.map((key) => {
          // Force delete ALL caches that don't start with current version
          if (!key.startsWith(CACHE_VERSION)) {
            console.log('[SW] Force deleting cache (version mismatch):', key)
            return caches.delete(key)
          } else {
            console.log('[SW] Keeping cache (version match):', key)
          }
        })
      )
    }).then(() => {
      console.log('[SW] Cache purge complete, claiming all clients...')
    })
  )
  
  self.clients.claim() // Take control of all clients immediately
})

// Custom notification handler
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
  
  // Handle manual cache refresh requests
  if (event.data && event.data.type === 'refresh-cache') {
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key.includes('chunks-') || key.includes('static-')) {
              console.log('[SW] Manual cache refresh, deleting:', key)
              return caches.delete(key)
            }
          })
        )
      )
    )
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