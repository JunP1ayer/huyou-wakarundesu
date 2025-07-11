'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Settings } from 'lucide-react'
import { trackEvent } from '@/lib/gtag'
import { useToastFallback } from '@/components/notifications/Toast'

export default function RequestPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)
  const { showToast, ToastContainer } = useToastFallback()

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (!isSupported) return

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      
      // Track permission result
      trackEvent.notificationPermission(result === 'granted')
      
      if (result === 'granted') {
        // Show test notification
        new Notification('通知が有効になりました！', {
          body: '扶養限度額の80%に達したときにお知らせします',
          icon: '/icons/icon.svg',
          badge: '/icons/icon.svg'
        })
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error)
    }
  }

  if (!isSupported) {
    return (
      <div className="bg-gray-50 rounded-2xl p-4">
        <div className="flex items-center">
          <BellOff className="h-5 w-5 text-gray-400 mr-2" />
          <div>
            <p className="text-sm text-gray-600">
              このブラウザは通知機能に対応していません
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (permission === 'granted') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
        <div className="flex items-center">
          <Bell className="h-5 w-5 text-green-600 mr-2" />
          <div>
            <p className="text-sm font-medium text-green-800">
              通知が有効です
            </p>
            <p className="text-xs text-green-600">
              扶養限度額の80%に達したらお知らせします
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BellOff className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-red-800">
                通知がブロックされています
              </p>
              <p className="text-xs text-red-600">
                ブラウザの設定から通知を許可してください
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              // Guide to browser settings
              showToast('ブラウザのアドレスバー左側の🔒アイコンをクリックし、通知を「許可」に変更してください', 'info')
            }}
            className="flex items-center text-xs text-red-600 hover:text-red-800"
          >
            <Settings className="h-4 w-4 mr-1" />
            設定
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Bell className="h-5 w-5 text-blue-600 mr-2" />
          <div>
            <p className="text-sm font-medium text-blue-800">
              通知を有効にする
            </p>
            <p className="text-xs text-blue-600">
              扶養限度額の80%に達したらお知らせします
            </p>
          </div>
        </div>
        <button
          onClick={requestPermission}
          className="bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          許可する
        </button>
      </div>
      </div>
      <ToastContainer />
    </>
  )
}