'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient, User, Session } from '@supabase/supabase-js'

type SupabaseContext = {
  supabase: SupabaseClient
  user: User | null
  session: Session | null
  loading: boolean
}

const Context = createContext<SupabaseContext | undefined>(undefined)

interface SupabaseProviderProps {
  children: React.ReactNode
  initialSession?: Session | null
}

export default function SupabaseProvider({ 
  children, 
  initialSession = null 
}: SupabaseProviderProps) {
  // Get environment variables with fallback for demo mode
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  // Helper function to check if a value is a valid (non-placeholder) environment variable
  const isValidEnvValue = (value: string): boolean => {
    if (!value) return false
    
    const placeholderPatterns = [
      'your-',
      'YOUR_',
      'replace-me',
      'REPLACE_ME',
      'example.com',
      'localhost:3000',
    ]
    
    return !placeholderPatterns.some(pattern => value.includes(pattern))
  }

  // Create Supabase client or null for demo mode
  const [supabase] = useState(() => {
    if (!isValidEnvValue(supabaseUrl) || !isValidEnvValue(supabaseAnonKey)) {
      console.warn('🟡 DEMO MODE: Invalid or missing Supabase credentials')
      if (typeof window !== 'undefined') {
        window.__demo_mode = true
      }
      return null
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey, {
      cookieOptions: {
        name: `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`,
        domain: undefined, // Use current domain
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false, // Must be false for browser client
      },
      isSingleton: true,
    })
  })

  const [user, setUser] = useState<User | null>(initialSession?.user ?? null)
  const [session, setSession] = useState<Session | null>(initialSession)
  const [loading, setLoading] = useState(!initialSession)

  useEffect(() => {
    if (!supabase) {
      // Demo mode - create mock session
      setUser({
        id: 'demo-user-001',
        email: 'demo@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
      } as User)
      setSession({
        access_token: 'demo-token',
        refresh_token: 'demo-refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'demo-user-001',
          email: 'demo@example.com',
        } as User,
      } as Session)
      setLoading(false)
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      setLoading(false)
    }

    if (!initialSession) {
      getInitialSession()
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('🔐 Auth state change:', event, currentSession?.user?.email)
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, initialSession])

  const contextValue: SupabaseContext = {
    supabase: supabase!,
    user,
    session,
    loading,
  }

  return (
    <Context.Provider value={contextValue}>
      {children}
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider')
  }
  return context
}