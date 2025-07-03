'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import LoginPrompt from './LoginPrompt'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
  fallback?: React.ReactNode
  requireAuth?: boolean
}

export default function AuthGuard({ 
  children, 
  redirectTo = '/login',
  fallback,
  requireAuth = true
}: AuthGuardProps) {
  const { session, loading } = useSupabase()
  const router = useRouter()

  useEffect(() => {
    if (!loading && requireAuth && !session) {
      router.push(redirectTo)
    }
  }, [session, loading, requireAuth, redirectTo, router])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    )
  }

  // Not authenticated and auth is required
  if (requireAuth && !session) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    return (
      <LoginPrompt 
        message="この機能を利用するにはログインが必要です"
        onLogin={() => router.push(redirectTo)}
      />
    )
  }

  // Authenticated or auth not required
  return <>{children}</>
}

// Convenience hook for auth status
export function useAuthGuard() {
  const { session, loading, user } = useSupabase()
  
  return {
    isAuthenticated: !!session,
    isLoading: loading,
    user,
    session
  }
}