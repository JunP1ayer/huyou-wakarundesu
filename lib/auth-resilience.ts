/**
 * Ultra-Resilient Authentication System
 * Handles all edge cases and failure scenarios for bulletproof auth flow
 */

import { createSupabaseClient } from '@/lib/supabase'
import { UserProfile } from '@/lib/supabase'
import { isProfileComplete } from '@/lib/profile-validation'

interface AuthState {
  user: any | null
  session: any | null
  profile: UserProfile | null
  profileComplete: boolean
  lastCheck: number
  retryCount: number
}

interface AuthRecoveryOptions {
  maxRetries: number
  retryDelay: number
  forceRefresh: boolean
  clearLocalStorage: boolean
}

class AuthResilientManager {
  private static instance: AuthResilientManager
  private authState: AuthState = {
    user: null,
    session: null,
    profile: null,
    profileComplete: false,
    lastCheck: 0,
    retryCount: 0
  }
  
  private supabase = createSupabaseClient()
  private readonly RETRY_DELAYS = [1000, 3000, 5000, 10000] // Progressive backoff
  private readonly MAX_RETRIES = 4
  private readonly CACHE_DURATION = 30000 // 30 seconds

  static getInstance(): AuthResilientManager {
    if (!AuthResilientManager.instance) {
      AuthResilientManager.instance = new AuthResilientManager()
    }
    return AuthResilientManager.instance
  }

  /**
   * Ultra-robust session verification with multiple fallbacks
   */
  async verifyAuthenticationState(): Promise<AuthState> {
    console.log('🔍 ULTRA: Starting authentication state verification')
    
    try {
      // Step 1: Check cached state first
      if (this.isCacheValid()) {
        console.log('✅ ULTRA: Using cached auth state')
        return this.authState
      }

      // Step 2: Verify Supabase session with retries
      const session = await this.getSessionWithRetries()
      
      if (!session?.user) {
        console.log('❌ ULTRA: No valid session found')
        this.clearAuthState()
        return this.authState
      }

      console.log('✅ ULTRA: Session verified', {
        userId: session.user.id,
        email: session.user.email,
        expiresAt: session.expires_at,
        provider: session.user.app_metadata?.provider
      })

      // Step 3: Verify profile with recovery mechanisms
      const profile = await this.getProfileWithRecovery(session.user.id)
      
      // Step 4: Update state
      this.updateAuthState({
        user: session.user,
        session,
        profile,
        profileComplete: isProfileComplete(profile),
        lastCheck: Date.now(),
        retryCount: 0
      })

      return this.authState

    } catch (error) {
      console.error('🔴 ULTRA: Authentication verification failed', error)
      return this.handleAuthenticationFailure(error)
    }
  }

  /**
   * Get session with progressive retry mechanism
   */
  private async getSessionWithRetries(): Promise<any> {
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        console.log(`🔄 ULTRA: Session attempt ${attempt + 1}/${this.MAX_RETRIES}`)
        
        const { data, error } = await this.supabase.auth.getSession()
        
        if (error) {
          throw new Error(`Session fetch error: ${error.message}`)
        }
        
        if (data.session) {
          console.log('✅ ULTRA: Session retrieved successfully')
          return data.session
        }
        
        // No session but no error - might be timing issue
        if (attempt < this.MAX_RETRIES - 1) {
          await this.delay(this.RETRY_DELAYS[attempt])
        }
        
      } catch (error) {
        console.error(`❌ ULTRA: Session attempt ${attempt + 1} failed:`, error)
        
        if (attempt < this.MAX_RETRIES - 1) {
          await this.delay(this.RETRY_DELAYS[attempt])
        } else {
          throw error
        }
      }
    }
    
    return null
  }

  /**
   * Get profile with recovery and auto-creation
   */
  private async getProfileWithRecovery(userId: string): Promise<UserProfile | null> {
    console.log('🔍 ULTRA: Attempting profile fetch with recovery')
    
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        const { data, error } = await this.supabase
          .from('user_profile')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (error) {
          console.error(`❌ ULTRA: Profile fetch attempt ${attempt + 1} failed:`, error)
          
          // Profile doesn't exist - trigger creation
          if (error.code === 'PGRST116') {
            console.log('🔧 ULTRA: Profile not found, attempting creation')
            await this.createMinimalProfile(userId)
            
            // Retry fetch after creation
            await this.delay(2000)
            continue
          }
          
          // Other errors - retry
          if (attempt < this.MAX_RETRIES - 1) {
            await this.delay(this.RETRY_DELAYS[attempt])
            continue
          }
          
          throw error
        }

        console.log('✅ ULTRA: Profile retrieved successfully')
        return data

      } catch (error) {
        console.error(`🔴 ULTRA: Profile recovery attempt ${attempt + 1} failed:`, error)
        
        if (attempt < this.MAX_RETRIES - 1) {
          await this.delay(this.RETRY_DELAYS[attempt])
        }
      }
    }

    console.error('🔴 ULTRA: All profile recovery attempts failed')
    return null
  }

  /**
   * Create minimal profile if database trigger failed
   */
  private async createMinimalProfile(userId: string): Promise<void> {
    console.log('🔧 ULTRA: Creating minimal profile for user:', userId)
    
    try {
      const { error } = await this.supabase
        .from('user_profile')
        .insert({
          user_id: userId,
          support_type: 'unknown',
          insurance: 'unknown',
          is_student: false,
          weekly_hours: 0,
          fuyou_line: 1030000,
          hourly_wage: 1200,
          profile_completed: false,
          onboarding_step: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('❌ ULTRA: Manual profile creation failed:', error)
        throw error
      }

      console.log('✅ ULTRA: Minimal profile created successfully')
    } catch (error) {
      console.error('🔴 ULTRA: Profile creation error:', error)
      throw error
    }
  }

  /**
   * Handle authentication failures with recovery
   */
  private async handleAuthenticationFailure(error: any): Promise<AuthState> {
    console.error('🔴 ULTRA: Handling authentication failure', error)
    
    this.authState.retryCount++
    
    // Try recovery strategies
    if (this.authState.retryCount <= this.MAX_RETRIES) {
      console.log(`🔄 ULTRA: Attempting recovery ${this.authState.retryCount}/${this.MAX_RETRIES}`)
      
      // Strategy 1: Clear local storage and retry
      if (this.authState.retryCount === 1) {
        this.clearLocalStorage()
        await this.delay(2000)
        return this.verifyAuthenticationState()
      }
      
      // Strategy 2: Force refresh session
      if (this.authState.retryCount === 2) {
        await this.forceSessionRefresh()
        await this.delay(3000)
        return this.verifyAuthenticationState()
      }
      
      // Strategy 3: Clear all auth state
      if (this.authState.retryCount === 3) {
        await this.clearAllAuthState()
        await this.delay(5000)
        return this.verifyAuthenticationState()
      }
    }
    
    // All recovery attempts failed
    console.error('🔴 ULTRA: All recovery attempts exhausted')
    this.clearAuthState()
    return this.authState
  }

  /**
   * Force session refresh from Supabase
   */
  private async forceSessionRefresh(): Promise<void> {
    console.log('🔄 ULTRA: Forcing session refresh')
    
    try {
      const { error } = await this.supabase.auth.refreshSession()
      if (error) {
        console.error('❌ ULTRA: Session refresh failed:', error)
      } else {
        console.log('✅ ULTRA: Session refreshed successfully')
      }
    } catch (error) {
      console.error('🔴 ULTRA: Session refresh error:', error)
    }
  }

  /**
   * Clear all authentication state
   */
  private async clearAllAuthState(): Promise<void> {
    console.log('🧹 ULTRA: Clearing all auth state')
    
    try {
      await this.supabase.auth.signOut()
      this.clearLocalStorage()
      this.clearAuthState()
      console.log('✅ ULTRA: All auth state cleared')
    } catch (error) {
      console.error('❌ ULTRA: Error clearing auth state:', error)
    }
  }

  /**
   * Clear browser local storage
   */
  private clearLocalStorage(): void {
    if (typeof window !== 'undefined') {
      console.log('🧹 ULTRA: Clearing local storage')
      try {
        localStorage.clear()
        sessionStorage.clear()
        // Clear Supabase-specific items
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key)
          }
        })
      } catch (error) {
        console.error('❌ ULTRA: Local storage clear error:', error)
      }
    }
  }

  /**
   * Check if cached state is still valid
   */
  private isCacheValid(): boolean {
    const age = Date.now() - this.authState.lastCheck
    const isValid = age < this.CACHE_DURATION && this.authState.lastCheck > 0
    
    console.log('🔍 ULTRA: Cache check', {
      age,
      isValid,
      lastCheck: new Date(this.authState.lastCheck).toISOString()
    })
    
    return isValid
  }

  /**
   * Update internal auth state
   */
  private updateAuthState(newState: Partial<AuthState>): void {
    this.authState = { ...this.authState, ...newState }
    console.log('📊 ULTRA: Auth state updated', {
      hasUser: !!this.authState.user,
      hasSession: !!this.authState.session,
      hasProfile: !!this.authState.profile,
      profileComplete: this.authState.profileComplete,
      retryCount: this.authState.retryCount
    })
  }

  /**
   * Clear auth state
   */
  private clearAuthState(): void {
    this.authState = {
      user: null,
      session: null,
      profile: null,
      profileComplete: false,
      lastCheck: Date.now(),
      retryCount: 0
    }
    console.log('🧹 ULTRA: Auth state cleared')
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get current auth state
   */
  getAuthState(): AuthState {
    return { ...this.authState }
  }

  /**
   * Force cache invalidation
   */
  invalidateCache(): void {
    console.log('🔄 ULTRA: Invalidating auth cache')
    this.authState.lastCheck = 0
  }
}

// Export singleton instance
export const authResilientManager = AuthResilientManager.getInstance()

// Utility functions for components
export async function getUltraResilientAuthState() {
  return authResilientManager.verifyAuthenticationState()
}

export function invalidateAuthCache() {
  authResilientManager.invalidateCache()
}

export function getCurrentAuthState() {
  return authResilientManager.getAuthState()
}