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

  // Handle route protection and redirects using Ultra Route Guardian
  const handleRouteProtection = useCallback(async () => {
    console.log('🛡️ ULTRA: Starting route protection', { pathname, loading })
    
    // If loading, don't redirect yet
    if (loading) {
      console.log('⏳ ULTRA: Skipping redirect - still loading')
      return
    }

    try {
      // Use ultra-resilient route guardian
      const guardResult = await guardCurrentRoute(pathname)
      
      console.log('🛡️ ULTRA: Route guard result', guardResult)
      
      if (!guardResult.allowed && guardResult.redirectTo) {
        console.log(`🔄 ULTRA: Redirecting to ${guardResult.redirectTo}, reason: ${guardResult.reason}`)
        router.push(guardResult.redirectTo)
      }
      
    } catch (error) {
      console.error('🔴 ULTRA: Route protection error', error)
      
      // Emergency fallback - try original logic
      const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
      
      if (!user && !isPublicRoute) {
        console.log('🚨 ULTRA: Emergency redirect to login')
        router.push('/login')
      }
    }
  }, [pathname, loading, router, user])

  // Initialize authentication state with ultra-resilience
  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    const initializeAuth = async () => {
      try {
        logAuthEvent('auth_init', { pathname }, pathname)
        console.log('🚀 ULTRA: Initializing authentication with resilience')
        
        // Use ultra-resilient auth state verification
        const authState = await getUltraResilientAuthState()
        
        console.log('📊 ULTRA: Auth state initialized', {
          hasUser: !!authState.user,
          hasSession: !!authState.session,
          hasProfile: !!authState.profile,
          profileComplete: authState.profileComplete
        })
        
        logAuthEvent('auth_state_loaded', {
          hasUser: !!authState.user,
          hasSession: !!authState.session,
          hasProfile: !!authState.profile,
          profileComplete: authState.profileComplete,
          userId: authState.user?.id
        }, pathname)
        
        setUser(authState.user as User | null)
        setSession(authState.session as Session | null)
        setProfile(authState.profile)
        setProfileComplete(authState.profileComplete)
        
      } catch (error) {
        logAuthError('auth_init_failed', error, { pathname }, pathname)
        console.error('🔴 ULTRA: Auth initialization failed:', error)
        
        // Fallback to original logic
        try {
          logAuthEvent('fallback_triggered', { reason: 'auth_init_failed' }, pathname)
          
          if (!initialSession) {
            const { data: { session: currentSession } } = await supabase.auth.getSession()
            setSession(currentSession)
            setUser(currentSession?.user || null)
          }

          const currentUser = initialSession?.user || user
          if (currentUser) {
            const profileData = await fetchProfile(currentUser.id)
            setProfile(profileData)
            setProfileComplete(isProfileComplete(profileData))
          }
          
          logAuthEvent('fallback_success', { hasUser: !!currentUser }, pathname)
        } catch (fallbackError) {
          logAuthError('fallback_failed', fallbackError, { pathname }, pathname)
          console.error('🔴 ULTRA: Fallback auth initialization failed:', fallbackError)
        }
      } finally {
        setLoading(false)
      }
    }

    if (!initialSession) {
      initializeAuth()
    } else {
      setLoading(false)
    }
  }, [initialSession, supabase, user, fetchProfile, pathname])

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