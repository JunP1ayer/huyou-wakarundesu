'use client'

import { useState, useEffect } from 'react'

interface CookieConsentProps {
  experimentId?: string
}

export default function CookieConsent({ experimentId }: CookieConsentProps) {
  const [showConsent, setShowConsent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      // Delay showing consent to avoid blocking initial page load
      const timer = setTimeout(() => setShowConsent(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = async () => {
    setIsLoading(true)
    
    // Set consent in localStorage
    localStorage.setItem('cookie-consent', 'accepted')
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    
    // Enable Google Analytics with consent mode
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'granted',
        'ad_storage': 'denied', // Still deny ad storage for privacy
        'ad_user_data': 'denied',
        'ad_personalization': 'denied'
      })
      
      // Track consent acceptance
      window.gtag('event', 'cookie_consent', {
        consent_action: 'accepted',
        experiment_id: experimentId || 'default'
      })
    }
    
    setShowConsent(false)
    setIsLoading(false)
  }

  const handleDecline = async () => {
    setIsLoading(true)
    
    // Set consent in localStorage
    localStorage.setItem('cookie-consent', 'declined')
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    
    // Keep Analytics disabled
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'denied',
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied'
      })
    }
    
    setShowConsent(false)
    setIsLoading(false)
  }

  const handleCustomize = () => {
    // For now, just accept with minimal tracking
    handleAccept()
  }

  if (!showConsent) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              Cookie の使用について
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              このサイトでは、サービス向上のため最小限の分析データを収集します。
              広告や追跡目的での使用はありません。
              <button 
                className="text-blue-600 hover:underline focus:outline-none focus:underline ml-1"
                onClick={() => window.open('/privacy-policy', '_blank')}
              >
                詳細を見る
              </button>
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={handleCustomize}
              disabled={isLoading}
              className="px-3 py-2 text-xs text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              設定
            </button>
            <button
              onClick={handleDecline}
              disabled={isLoading}
              className="px-3 py-2 text-xs text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              拒否
            </button>
            <button
              onClick={handleAccept}
              disabled={isLoading}
              className="px-4 py-2 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors font-medium"
            >
              {isLoading ? '設定中...' : '同意'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

