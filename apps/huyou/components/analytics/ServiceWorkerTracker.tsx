'use client'

import { useEffect } from 'react'
import { trackEvent, event } from '@/lib/gtag'

export default function ServiceWorkerTracker() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const { data } = event

      switch (data.type) {
        case 'track-notification-click':
          if (data.percentage) {
            trackEvent.notificationClick(data.percentage)
          }
          break
          
        case 'track-pwa-install':
          trackEvent.pwaInstall()
          break
          
        default:
          break
      }
    }

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      
      // Track that install prompt was shown
      event('pwa_install_prompt_shown', {
        event_category: 'engagement',
        event_label: 'install_banner'
      })
    }

    // Listen for PWA install success
    const handleAppInstalled = () => {
      trackEvent.pwaInstall()
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // This component doesn't render anything
  return null
}