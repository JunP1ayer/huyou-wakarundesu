'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'

export default function AuthCallback() {
  const router = useRouter()
  const { supabase } = useSupabase()

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (!supabase) {
        router.replace('/login?error=no_supabase')
        return
      }

      try {
        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.replace('/login?error=auth_failed')
          return
        }

        if (data.session) {
          console.log('✅ Authentication successful:', data.session.user.email)
          // Redirect to dashboard on successful auth
          router.replace('/dashboard')
        } else {
          console.log('❌ No session found after callback')
          router.replace('/login?error=no_session')
        }
      } catch (error) {
        console.error('Callback handling error:', error)
        router.replace('/login?error=callback_failed')
      }
    }

    handleAuthCallback()
  }, [supabase, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-sm text-gray-600">認証処理中...</p>
        <p className="mt-2 text-xs text-gray-500">
          少々お待ちください
        </p>
      </div>
    </div>
  )
}