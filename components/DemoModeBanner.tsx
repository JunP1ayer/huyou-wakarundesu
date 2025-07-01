'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { config } from '@/lib/config'

export default function DemoModeBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  
  useEffect(() => {
    // Check if we should show the banner
    if (config.isDemoMode && !isDismissed) {
      setIsVisible(true)
    }
  }, [isDismissed])
  
  const handleDismiss = () => {
    setIsDismissed(true)
    setIsVisible(false)
    // Store dismissal in session storage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('demo-banner-dismissed', 'true')
    }
  }
  
  useEffect(() => {
    // Check if banner was previously dismissed
    if (typeof window !== 'undefined') {
      const dismissed = sessionStorage.getItem('demo-banner-dismissed')
      if (dismissed === 'true') {
        setIsDismissed(true)
        setIsVisible(false)
      }
    }
  }, [])
  
  if (!isVisible) return null
  
  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-50 border-b border-yellow-200 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-yellow-800 font-medium">
                デモモードで実行中
              </p>
              <p className="text-yellow-700">
                環境変数が設定されていないため、一部機能が制限されています。
                全機能を利用するには、Vercelダッシュボードで環境変数を設定してください。
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-yellow-600 hover:text-yellow-700 p-1"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}