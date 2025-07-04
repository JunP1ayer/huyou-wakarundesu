'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { User, Session } from '@supabase/supabase-js'
import { createSupabaseClient } from '@/lib/supabase'
import { UserProfile } from '@/lib/supabase'
import { isProfileComplete } from '@/lib/profile-validation'
import { guardCurrentRoute } from '@/lib/route-guardian'
import { getUltraResilientAuthState } from '@/lib/auth-resilience'
import { logAuthEvent, logAuthError } from '@/lib/auth-monitor'

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
// const AUTH_ONLY_ROUTES = ['/']

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
  const [supabase] = useState(() => {
    // Only create Supabase client on the client side
    if (typeof window === 'undefined') return null
    return createSupabaseClient()
  })
  
  const router = useRouter()
  const pathname = usePathname()

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    if (!supabase) return null
    
    try {
      console.log('🔍 Fetching profile for user:', userId)
      const { data, error } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('🔴 Profile fetch error:', error.message, error.code)
        if (error.code === 'PGRST116') {
          console.log('📝 No profile found - will be created by database trigger')
        }
        return null
      }

      console.log('✅ Profile fetched:', {
        userId: data.user_id,
        profileCompleted: data.profile_completed,
        onboardingStep: data.onboarding_step,
        hasRequiredFields: {
          birthYear: !!data.birth_year,
          studentType: !!data.student_type,
          supportType: data.support_type !== 'unknown',
          insurance: data.insurance !== 'unknown',
          monthlyIncomeTarget: !!data.monthly_income_target
        }
      })

      return data
    } catch (error) {
      console.error('🔴 Profile fetch failed:', error)
      return null
    }
  }, [supabase])

  // Refresh profile data
  const refreshProfile = async () => {
    if (!user) return

    console.log('🔄 Refreshing profile for user:', user.id)
    const profileData = await fetchProfile(user.id)
    const complete = isProfileComplete(profileData)
    
    console.log('📊 Profile completion check:', {
      profileExists: !!profileData,
      isComplete: complete,
      previouslyComplete: profileComplete
    })
    
    setProfile(profileData)
    setProfileComplete(complete)
  }

  // Simplified route protection to avoid redirect loops
  const handleRouteProtection = useCallback(() => {
    console.log('🛡️ Simple route protection', { pathname, loading, hasUser: !!user, profileComplete })
    
    // If loading, don't redirect yet
    if (loading) {
      console.log('⏳ Skipping redirect - still loading')
      return
    }

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
    
    // Simple logic to avoid loops
    if (!user && !isPublicRoute) {
      console.log('🔄 Redirecting to login - no user')
      router.push('/login')
    } else if (user && !profileComplete && pathname === '/dashboard') {
      console.log('🔄 Redirecting to onboarding - incomplete profile')
      router.push('/')
    } else if (user && profileComplete && pathname === '/') {
      console.log('🔄 Redirecting to dashboard - profile complete')
      router.push('/dashboard')
    } else if (user && pathname === '/login') {
      console.log('🔄 Redirecting authenticated user away from login')
      router.push(profileComplete ? '/dashboard' : '/')
    }
  }, [pathname, loading, router, user, profileComplete])

  // Simplified authentication initialization
  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    const initializeAuth = async () => {
      try {
        logAuthEvent('auth_init', { pathname }, pathname)
        console.log('🚀 Simple: Initializing authentication')
        
        // Use simple approach first
        if (!initialSession) {
          const { data: { session: currentSession } } = await supabase.auth.getSession()
          setSession(currentSession)
          setUser(currentSession?.user || null)
          
          if (currentSession?.user) {
            const profileData = await fetchProfile(currentSession.user.id)
            setProfile(profileData)
            setProfileComplete(isProfileComplete(profileData))
          }
        } else {
          // Use initial session
          if (initialSession.user) {
            const profileData = await fetchProfile(initialSession.user.id)
            setProfile(profileData)
            setProfileComplete(isProfileComplete(profileData))
          }
        }
        
        logAuthEvent('auth_state_loaded', {
          hasUser: !!user,
          hasSession: !!session
        }, pathname)
        
      } catch (error) {
        logAuthError('auth_init_failed', error, { pathname }, pathname)
        console.error('🔴 Simple: Auth initialization failed:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!initialSession) {
      initializeAuth()
    } else {
      const initialize = async () => {
        if (initialSession.user) {
          const profileData = await fetchProfile(initialSession.user.id)
          setProfile(profileData)
          setProfileComplete(isProfileComplete(profileData))
        }
        setLoading(false)
      }
      initialize()
    }
  }, [initialSession, supabase, fetchProfile, pathname])

  // Listen for auth state changes
  useEffect(() => {
    if (!supabase) return

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
  }, [supabase, fetchProfile])

  // Handle route protection
  useEffect(() => {
    handleRouteProtection()
  }, [handleRouteProtection])

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