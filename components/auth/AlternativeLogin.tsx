'use client'

import { useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'

interface AlternativeLoginProps {
  experimentId?: string
}

export default function AlternativeLogin({ experimentId }: AlternativeLoginProps) {
  const { t } = useTranslation('common')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createSupabaseClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    setMessage('')

    // GA4 event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'signup_start', {
        method: 'email',
        experiment_id: experimentId || 'default'
      })
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (error) {
        setMessage(t('auth.login.linkFailed'))
      } else {
        setMessage(t('auth.login.linkSent'))
      }
    } catch {
      setMessage(t('auth.login.linkFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-4">
          {t('auth.login.emailLogin')}
        </p>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="sr-only">
            {t('auth.login.emailPlaceholder')}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.login.emailPlaceholder')}
            className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            autoComplete="email"
            required
            aria-describedby={message ? 'email-message' : undefined}
            data-experiment-id={experimentId}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !email.trim()}
          className="w-full h-12 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          aria-label={t('auth.login.sendLink')}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block" />
              {t('auth.login.sending')}
            </>
          ) : (
            t('auth.login.sendLink')
          )}
        </button>
      </form>

      {message && (
        <div
          id="email-message"
          className={`p-3 text-sm text-center rounded-lg ${
            message.includes(t('auth.login.linkFailed').substring(0, 2))
              ? 'text-red-600 bg-red-50 border border-red-200'
              : 'text-green-600 bg-green-50 border border-green-200'
          }`}
          role="alert"
          aria-live="polite"
        >
          {message}
        </div>
      )}

      <div className="text-center pt-2">
        <p className="text-xs text-gray-500">
          {t('auth.login.checkEmail')}
        </p>
      </div>
    </div>
  )
}