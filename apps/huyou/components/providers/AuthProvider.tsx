'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { User, Session } from '@supabase/supabase-js'
import { createSupabaseClient } from '@/lib/supabase'
import { UserProfile } from '@/lib/supabase'
import { isProfileComplete } from '@/lib/profile-validation'
import { logAuthEvent, logAuthError } from '@/lib/auth-monitor'
import { debugLog } from '@/lib/debug'

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
    // Use safe client creation to prevent SSR issues
    if (typeof window === 'undefined') return null
    try {
      return createSupabaseClient()
    } catch (error) {
      console.error('Failed to initialize Supabase client in AuthProvider:', error)
      return null
    }
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

  // Improved route protection with better stability
  const handleRouteProtection = useCallback(() => {
    console.log('🛡️ Route protection check', { 
      pathname, 
      loading, 
      hasUser: !!user, 
      profileComplete,
      hasSession: !!session 
    })
    
    // If loading, don't redirect yet
    if (loading) {
      console.log('⏳ Skipping redirect - still loading')
      return
    }

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
    const isAuthCallbackRoute = pathname.startsWith('/auth/callback')
    
    // Don't redirect during auth callback
    if (isAuthCallbackRoute) {
      console.log('🔄 Skipping redirect - auth callback in progress')
      return
    }
    
    // Simple logic to avoid loops with additional safeguards
    if (!user && !isPublicRoute && !isAuthCallbackRoute) {
      console.log('🔄 Redirecting to login - no user')
      router.push('/login')
    } else if (user && !profileComplete && pathname === '/dashboard') {
      console.log('🔄 Redirecting to onboarding - incomplete profile')
      router.push('/')
    } else if (user && profileComplete && pathname === '/' && !loading) {
      console.log('🔄 Redirecting to dashboard - profile complete')
      router.push('/dashboard')
    } else if (user && pathname === '/login' && !loading) {
      console.log('🔄 Redirecting authenticated user away from login')
      router.push(profileComplete ? '/dashboard' : '/')
    }
  }, [pathname, loading, router, user, profileComplete, session])

  // Simplified authentication initialization
  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    const initializeAuth = async () => {
      try {
        logAuthEvent('auth_init', { pathname }, pathname)
        debugLog('[DEBUG] AuthProvider: Starting authentication initialization')
        
        // Use getUser() instead of getSession() for proper authentication
        if (!initialSession) {
          console.log('[AUTH DEBUG] 🔍 Starting user authentication check')
          const getUserStartTime = Date.now()
          const { data: { user: currentUser }, error } = await supabase.auth.getUser()
          const getUserEndTime = Date.now()
          
          console.log('[AUTH DEBUG] 📊 getUser() result:', {
            duration: getUserEndTime - getUserStartTime,
            hasUser: !!currentUser,
            userId: currentUser?.id?.substring(0, 8) + '...',
            userEmail: currentUser?.email,
            hasError: !!error,
            errorMessage: error?.message,
            errorName: error?.name,
            timestamp: new Date().toISOString()
          })
          
          if (error) {
            console.log('🔴 Auth: User validation failed:', error.message)
            setSession(null)
            setUser(null)
          } else {
            // If user is authenticated, get the current session
            console.log('[AUTH DEBUG] 🔍 User authenticated, fetching session details')
            const getSessionStartTime = Date.now()
            const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
            const getSessionEndTime = Date.now()
            
            console.log('[AUTH DEBUG] 📊 getSession() result:', {
              duration: getSessionEndTime - getSessionStartTime,
              hasSession: !!currentSession,
              hasAccessToken: !!currentSession?.access_token,
              hasRefreshToken: !!currentSession?.refresh_token,
              tokenType: currentSession?.token_type,
              expiresAt: currentSession?.expires_at,
              expiresIn: currentSession?.expires_in,
              sessionUserId: currentSession?.user?.id?.substring(0, 8) + '...',
              sessionUserEmail: currentSession?.user?.email,
              providerToken: currentSession?.provider_token ? 'present' : 'absent',
              hasSessionError: !!sessionError,
              sessionErrorMessage: sessionError?.message,
              timestamp: new Date().toISOString()
            })
            
            if (sessionError) {
              console.error('[AUTH DEBUG] 🔴 Session fetch error:', {
                message: sessionError.message,
                name: sessionError.name,
                status: sessionError.status
              })
            }
            
            setSession(currentSession)
            setUser(currentUser)
          
            if (currentUser) {
              console.log('[AUTH DEBUG] 👤 User authenticated, fetching profile...')
              const profileData = await fetchProfile(currentUser.id)
              setProfile(profileData)
              setProfileComplete(isProfileComplete(profileData))
            }
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
        debugLog('[DEBUG] AuthProvider: Setting loading to false')
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
        debugLog('[DEBUG] AuthProvider: Initial session processing complete, setting loading to false')
        setLoading(false)
      }
      initialize()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSession, supabase, fetchProfile, pathname])

  // Listen for auth state changes
  useEffect(() => {
    if (!supabase) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('🔐 Auth state change:', event, currentSession?.user?.email)
        
        console.log('[AUTH DEBUG] 🔄 Auth state change detailed analysis:', {
          event: event,
          timestamp: new Date().toISOString(),
          hasSession: !!currentSession,
          sessionDetails: {
            hasUser: !!currentSession?.user,
            userId: currentSession?.user?.id?.substring(0, 8) + '...',
            userEmail: currentSession?.user?.email,
            hasAccessToken: !!currentSession?.access_token,
            hasRefreshToken: !!currentSession?.refresh_token,
            tokenType: currentSession?.token_type,
            expiresAt: currentSession?.expires_at,
            expiresIn: currentSession?.expires_in,
            providerToken: currentSession?.provider_token ? 'present' : 'absent',
            providerRefreshToken: currentSession?.provider_refresh_token ? 'present' : 'absent'
          },
          userMetadata: currentSession?.user ? {
            aud: currentSession.user.aud,
            emailConfirmed: currentSession.user.email_confirmed_at ? 'confirmed' : 'unconfirmed',
            provider: currentSession.user.app_metadata?.provider,
            providers: currentSession.user.app_metadata?.providers,
            createdAt: currentSession.user.created_at,
            lastSignIn: currentSession.user.last_sign_in_at
          } : null
        })
        
        // Additional validation of session integrity
        if (currentSession && !currentSession.access_token) {
          console.error('[AUTH DEBUG] 🔴 Invalid session: missing access_token')
        }
        if (currentSession && !currentSession.user) {
          console.error('[AUTH DEBUG] 🔴 Invalid session: missing user object')
        }
        if (currentSession && currentSession.expires_at && currentSession.expires_at < Date.now() / 1000) {
          console.warn('[AUTH DEBUG] ⚠️ Session appears to be expired', {
            expiresAt: new Date(currentSession.expires_at * 1000).toISOString(),
            currentTime: new Date().toISOString()
          })
        }
        
        setSession(currentSession)
        setUser(currentSession?.user || null)

        if (currentSession?.user) {
          console.log('[AUTH DEBUG] 👤 Session user found, fetching profile...')
          // Fetch profile for new session
          const profileData = await fetchProfile(currentSession.user.id)
          setProfile(profileData)
          setProfileComplete(isProfileComplete(profileData))
        } else {
          console.log('[AUTH DEBUG] 🚪 No session user, clearing profile data')
          // Clear profile data when logged out
          setProfile(null)
          setProfileComplete(false)
        }

        console.log('[AUTH DEBUG] ✅ Auth state change processing complete')
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, fetchProfile]) // session and user are set by this effect, not dependencies

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