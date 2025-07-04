'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { User, Session } from '@supabase/supabase-js'
import { createSupabaseClient } from '@/lib/supabase'
import { UserProfile } from '@/lib/supabase'
import { isProfileComplete } from '@/lib/profile-validation'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  profileComplete: boolean
  loading: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/auth/callback']

// Routes that require authentication but not profile completion
const AUTH_ONLY_ROUTES = ['/onboarding']

interface AuthProviderProps {
  children: React.ReactNode
  initialSession?: Session | null
}

export default function AuthProvider({ 
  children, 
  initialSession = null 
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialSession?.user || null)
  const [session, setSession] = useState<Session | null>(initialSession)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileComplete, setProfileComplete] = useState(false)
  const [loading, setLoading] = useState(!initialSession)
  const [supabase] = useState(() => createSupabaseClient())
  
  const router = useRouter()
  const pathname = usePathname()

  // Fetch user profile
  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('🔴 Profile fetch error:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('🔴 Profile fetch failed:', error)
      return null
    }
  }

  // Refresh profile data
  const refreshProfile = async () => {
    if (!user) return

    const profileData = await fetchProfile(user.id)
    setProfile(profileData)
    setProfileComplete(isProfileComplete(profileData))
  }

  // Handle route protection and redirects
  const handleRouteProtection = () => {
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
    const isAuthOnlyRoute = AUTH_ONLY_ROUTES.includes(pathname)
    
    // If loading, don't redirect yet
    if (loading) return

    // Not authenticated
    if (!user || !session) {
      if (!isPublicRoute) {
        console.log('🔄 Redirecting to login - no authentication')
        router.push('/login')
      }
      return
    }

    // Authenticated but profile incomplete
    if (!profileComplete && !isAuthOnlyRoute && !isPublicRoute) {
      console.log('🔄 Redirecting to onboarding - profile incomplete')
      router.push('/onboarding')
      return
    }

    // Authenticated with complete profile but on onboarding page
    if (profileComplete && pathname === '/onboarding') {
      console.log('🔄 Redirecting to dashboard - profile complete')
      router.push('/dashboard')
      return
    }

    // Authenticated user on login page
    if (user && isPublicRoute && pathname === '/login') {
      if (profileComplete) {
        console.log('🔄 Redirecting to dashboard - already authenticated')
        router.push('/dashboard')
      } else {
        console.log('🔄 Redirecting to onboarding - authentication complete')
        router.push('/onboarding')
      }
      return
    }
  }

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get current session if not provided
        if (!initialSession) {
          const { data: { session: currentSession } } = await supabase.auth.getSession()
          setSession(currentSession)
          setUser(currentSession?.user || null)
        }

        // Fetch profile if user exists
        const currentUser = initialSession?.user || user
        if (currentUser) {
          const profileData = await fetchProfile(currentUser.id)
          setProfile(profileData)
          setProfileComplete(isProfileComplete(profileData))
        }
      } catch (error) {
        console.error('🔴 Auth initialization failed:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!initialSession) {
      initializeAuth()
    } else {
      setLoading(false)
    }
  }, [initialSession, supabase])

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('🔐 Auth state change:', event, currentSession?.user?.email)
        
        setSession(currentSession)
        setUser(currentSession?.user || null)

        if (currentSession?.user) {
          // Fetch profile for new session
          const profileData = await fetchProfile(currentSession.user.id)
          setProfile(profileData)
          setProfileComplete(isProfileComplete(profileData))
        } else {
          // Clear profile data when logged out
          setProfile(null)
          setProfileComplete(false)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  // Handle route protection
  useEffect(() => {
    handleRouteProtection()
  }, [user, session, profileComplete, loading, pathname])

  const contextValue: AuthContextType = {
    user,
    session,
    profile,
    profileComplete,
    loading,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook for requiring authentication
export const useRequireAuth = () => {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  return { user, loading }
}

// Hook for requiring complete profile
export const useRequireProfile = () => {
  const { user, profile, profileComplete, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else if (!profileComplete) {
        router.push('/onboarding')
      }
    }
  }, [user, profileComplete, loading, router])

  return { user, profile, profileComplete, loading }
}