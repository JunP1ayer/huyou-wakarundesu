'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { createSupabaseClient } from '@/lib/supabase'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import dynamic from 'next/dynamic'

// Lazy load components for performance
const GoogleIcon = dynamic(() => import('@/components/icons/GoogleIcon'), { 
  loading: () => <div className="w-5 h-5 rounded-full bg-gray-200 animate-pulse" />
})
const AlternativeLogin = dynamic(() => import('@/components/auth/AlternativeLogin'), { 
  loading: () => <div className="h-8 bg-gray-100 rounded animate-pulse" />
})


function LoginContent() {
  const { session, loading } = useAuth()
  const router = useRouter()
  const { t } = useTranslation('common')
  const [isLoading, setIsLoading] = useState(false)
  const [showAlternative, setShowAlternative] = useState(false)
  const [error, setError] = useState('')
  const [supabase] = useState(() => {
    // Only create Supabase client on the client side
    if (typeof window === 'undefined') return null
    return createSupabaseClient()
  })
  const experimentId = 'default' // Default experiment ID

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (!loading && session) {
      router.replace('/dashboard')
    }
  }, [session, loading, router])

  // Handle error states from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errorCode = params.get('error')
    if (errorCode) {
      setError(t('auth.login.loginFailed'))
      router.replace('/login', undefined)
    }
  }, [router, t])

  const handleGoogleLogin = async () => {
    if (!supabase) {
      setError(t('auth.login.loginFailed'))
      return
    }
    
    setIsLoading(true)
    setError('')
    
    // GA4 event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'signup_start', {
        method: 'google',
        experiment_id: experimentId || 'default'
      })
    }
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
          scopes: 'openid email profile'
        }
      })

      if (error) {
        setError(t('auth.login.loginFailed'))
        setIsLoading(false)
      }
    } catch {
      setError(t('auth.login.loginFailed'))
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label={t('aria.loading')}>
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-4" role="main">
      <div className="w-full max-w-sm">
        {/* Minimal header - Google style */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-normal text-gray-900 mb-2">
            {t('app.name')}
          </h1>
          <p className="text-sm text-gray-600">
            {t('app.tagline')}
          </p>
        </div>

        {/* Primary action - Google login only */}
        <div className="space-y-6">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-12 flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
            aria-label={t('auth.login.googleLogin')}
            data-experiment-id={experimentId}
          >
            {!isLoading ? (
              <>
                <GoogleIcon />
                <span className="ml-3">{t('auth.login.googleLogin')}</span>
              </>
            ) : (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-3" />
                <span>{t('auth.login.loggingIn')}</span>
              </>
            )}
          </button>

          {/* Error message */}
          {error && (
            <div 
              className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg text-center"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          {/* Alternative options - Progressive disclosure */}
          <div className="text-center">
            <button
              onClick={() => setShowAlternative(!showAlternative)}
              className="text-sm text-blue-600 hover:text-blue-700 focus:outline-none focus:underline"
              aria-expanded={showAlternative}
              aria-controls="alternative-login"
            >
              {showAlternative ? t('auth.login.hideAlternative') : t('auth.login.alternativeLogin')}
            </button>
          </div>

          {/* Alternative login methods - Lazy loaded */}
          {showAlternative && (
            <div id="alternative-login" className="pt-4 border-t border-gray-100">
              <Suspense fallback={<div className="h-20 bg-gray-50 rounded animate-pulse" />}>
                <AlternativeLogin experimentId={experimentId} />
              </Suspense>
            </div>
          )}
        </div>

        {/* Privacy notice - Minimal */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            {t('auth.login.privacyNotice')}
            <button className="text-blue-600 hover:underline focus:outline-none focus:underline">
              {t('auth.login.termsOfService')}
            </button>
            {t('auth.login.agreeToTerms').includes('と') ? 'と' : ' and '}
            <button className="text-blue-600 hover:underline focus:outline-none focus:underline">
              {t('auth.login.privacyPolicy')}
            </button>
            {t('auth.login.agreeToTerms')}
          </p>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}

