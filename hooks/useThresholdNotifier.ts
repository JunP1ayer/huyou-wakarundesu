'use client'

import { useEffect, useRef } from 'react'
import { isOverThreshold, getThresholdStatus } from '@/utils/threshold'

interface NotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  requireInteraction?: boolean
}

export function useThresholdNotifier(income: number, limit: number = 1030000) {
  const lastNotifiedRef = useRef<number>(0)
  const hasNotifiedThresholdRef = useRef<boolean>(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return
    }

    // Check permission
    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted')
      return
    }

    const status = getThresholdStatus(income, limit)
    
    // Only notify when crossing the 80% threshold
    if (status.isOverThreshold && !hasNotifiedThresholdRef.current) {
      showThresholdNotification(status.percentage, income, limit)
      hasNotifiedThresholdRef.current = true
      lastNotifiedRef.current = income
    } else if (!status.isOverThreshold) {
      // Reset the flag if income drops below threshold
      hasNotifiedThresholdRef.current = false
    }
  }, [income, limit])

  const showThresholdNotification = async (percentage: number, income: number, limit: number) => {
    try {
      // Try to use Service Worker if available
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        if (registration.active) {
          registration.active.postMessage({
            type: 'show-notification',
            payload: {
              title: '⚠️ 扶養限度額に注意！',
              body: `年収が${percentage}%に達しました（${income.toLocaleString()}円）`,
              icon: '/icons/icon.svg',
              badge: '/icons/icon.svg',
              tag: 'threshold-alert',
              requireInteraction: true,
              data: {
                type: 'threshold',
                income,
                limit,
                percentage
              }
            }
          })
          return
        }
      }

      // Fallback to direct notification
      const notification = new Notification('⚠️ 扶養限度額に注意！', {
        body: `年収が${percentage}%に達しました（${income.toLocaleString()}円）`,
        icon: '/icons/icon.svg',
        badge: '/icons/icon.svg',
        tag: 'threshold-alert',
        requireInteraction: true,
        data: {
          type: 'threshold',
          income,
          limit,
          percentage
        }
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
        // Navigate to dashboard if not already there
        if (window.location.pathname !== '/dashboard') {
          window.location.href = '/dashboard'
        }
      }

    } catch (error) {
      console.error('Failed to show threshold notification:', error)
    }
  }

  return {
    showTestNotification: () => {
      if (Notification.permission === 'granted') {
        showThresholdNotification(80, income, limit)
      }
    }
  }
}