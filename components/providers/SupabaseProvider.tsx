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
  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Create Supabase client
  const [supabase] = useState(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables')
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
    supabase,
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