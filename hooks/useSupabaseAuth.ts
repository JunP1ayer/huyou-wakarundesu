'use client'

import { useState, useEffect, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createSupabaseClient } from '@/lib/supabase'
import useSWR, { mutate } from 'swr'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

// SWR-optimized auth fetcher
const authFetcher = async (): Promise<{ user: User | null; session: Session | null }> => {
  const supabase = createSupabaseClient()
  
  // Use getUser() for proper validation
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { user: null, session: null }
  }
  
  // Get session only if user is authenticated
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError) {
    console.warn('Session fetch failed after user validation:', sessionError.message)
    return { user, session: null }
  }
  
  return { user, session }
}

/**
 * Optimized auth hook using SWR for caching and automatic revalidation
 * Prevents unnecessary auth calls and provides better UX
 */
export function useSupabaseAuth(): AuthState & {
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
} {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Use SWR for auth state with optimistic updates
  const { data, error: swrError, mutate: mutateAuth } = useSWR(
    'supabase-auth',
    authFetcher,
    {
      revalidateOnFocus: false, // Don't refetch on window focus
      revalidateOnReconnect: true, // Refetch on network reconnect
      refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
      onSuccess: () => {
        setLoading(false)
        setError(null)
      },
      onError: (err) => {
        setLoading(false)
        setError(err.message || 'Authentication failed')
      }
    }
  )

  // Initialize loading state
  useEffect(() => {
    if (data !== undefined) {
      setLoading(false)
    }
  }, [data])

  // Listen for auth state changes
  useEffect(() => {
    const supabase = createSupabaseClient()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state change:', event)
        
        // Optimistically update cache
        if (event === 'SIGNED_OUT') {
          mutateAuth({ user: null, session: null }, false)
        } else if (event === 'SIGNED_IN' && session) {
          mutateAuth({ user: session.user, session }, false)
        } else {
          // Revalidate for other events
          mutateAuth()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [mutateAuth])

  const signOut = useCallback(async () => {
    const supabase = createSupabaseClient()
    setError(null)
    
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear all auth-related cache
      mutate(() => true, undefined, { revalidate: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed')
      throw err
    }
  }, [])

  const refreshAuth = useCallback(async () => {
    setError(null)
    await mutateAuth()
  }, [mutateAuth])

  return {
    user: data?.user || null,
    session: data?.session || null,
    loading: loading || (!data && !swrError),
    error: error || (swrError?.message || null),
    signOut,
    refreshAuth
  }
}

/**
 * Hook for profile data with SWR optimization
 */
export function useUserProfile(userId?: string) {
  const profileFetcher = useCallback(async (userId: string) => {
    const supabase = createSupabaseClient()
    
    const { data, error } = await supabase
      .from('user_profile')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      throw error
    }
    
    return data
  }, [])

  return useSWR(
    userId ? `user-profile-${userId}` : null,
    () => profileFetcher(userId!),
    {
      revalidateOnFocus: false,
      refreshInterval: 10 * 60 * 1000, // Refresh every 10 minutes
    }
  )
}

/**
 * Hook for dashboard data with SWR optimization
 */
export function useDashboardData(userId?: string) {
  const dashboardFetcher = useCallback(async (userId: string) => {
    const response = await fetch('/api/dashboard/batch', {
      headers: { 'X-User-ID': userId }
    })
    
    if (!response.ok) {
      throw new Error('Dashboard data fetch failed')
    }
    
    return response.json()
  }, [])

  return useSWR(
    userId ? `dashboard-${userId}` : null,
    () => dashboardFetcher(userId!),
    {
      revalidateOnFocus: false,
      refreshInterval: 2 * 60 * 1000, // Refresh every 2 minutes
      errorRetryCount: 3,
      errorRetryInterval: 1000,
    }
  )
}