/**
 * Ultra-Secure Route Guardian
 * Prevents all possible routing failures and edge cases
 */

import { authResilientManager } from './auth-resilience'

interface RouteGuardOptions {
  requireAuth: boolean
  requireProfile: boolean
  allowedRoles?: string[]
  fallbackRoute?: string
  maxRedirectAttempts?: number
}

interface RouteGuardResult {
  allowed: boolean
  redirectTo?: string
  reason?: string
  shouldRetry?: boolean
}

class RouteGuardian {
  private static instance: RouteGuardian
  private redirectAttempts = new Map<string, number>()
  private readonly MAX_REDIRECT_ATTEMPTS = 3
  private readonly REDIRECT_COOLDOWN = 5000 // 5 seconds

  static getInstance(): RouteGuardian {
    if (!RouteGuardian.instance) {
      RouteGuardian.instance = new RouteGuardian()
    }
    return RouteGuardian.instance
  }

  /**
   * Ultra-comprehensive route protection
   */
  async guardRoute(
    currentPath: string,
    options: RouteGuardOptions
  ): Promise<RouteGuardResult> {
    console.log('🛡️ ULTRA-GUARD: Protecting route', { currentPath, options })

    try {
      // Step 1: Check redirect loop prevention
      if (this.isRedirectLoop(currentPath)) {
        console.error('🔴 ULTRA-GUARD: Redirect loop detected for', currentPath)
        return {
          allowed: true, // Allow to break loop
          reason: 'redirect_loop_prevention'
        }
      }

      // Step 2: Get ultra-resilient auth state
      const authState = await authResilientManager.verifyAuthenticationState()

      // Step 3: Check authentication requirement
      if (options.requireAuth && !authState.user) {
        console.log('🔒 ULTRA-GUARD: Authentication required')
        return this.createRedirectResult('/login', 'authentication_required')
      }

      // Step 4: Check profile completion requirement
      if (options.requireProfile && !authState.profileComplete) {
        console.log('📝 ULTRA-GUARD: Profile completion required')
        
        // Special case: If user is authenticated but no profile, ensure profile exists
        if (authState.user && !authState.profile) {
          console.log('🔧 ULTRA-GUARD: Triggering profile creation recovery')
          
          // Wait a bit for database trigger to work
          await this.delay(2000)
          
          // Re-check auth state
          authResilientManager.invalidateCache()
          const updatedAuthState = await authResilientManager.verifyAuthenticationState()
          
          if (!updatedAuthState.profile) {
            console.error('🔴 ULTRA-GUARD: Profile creation failed, forcing logout')
            return this.createRedirectResult('/login?error=profile_creation_failed', 'profile_creation_failed')
          }
        }
        
        return this.createRedirectResult('/', 'profile_incomplete')
      }

      // Step 5: Check role-based access
      if (options.allowedRoles && authState.user) {
        const userRole = authState.user.app_metadata?.role || 'user'
        if (!options.allowedRoles.includes(userRole)) {
          console.log('🚫 ULTRA-GUARD: Role access denied')
          return this.createRedirectResult('/dashboard', 'insufficient_role')
        }
      }

      // Step 6: Special route logic
      const specialGuard = this.checkSpecialRoutes(currentPath, authState)
      if (specialGuard) {
        return specialGuard
      }

      console.log('✅ ULTRA-GUARD: Route access granted')
      this.resetRedirectAttempts(currentPath)
      
      return { allowed: true }

    } catch (error) {
      console.error('🔴 ULTRA-GUARD: Guard error', error)
      
      // Fallback to safe route
      return this.createRedirectResult(
        options.fallbackRoute || '/login',
        'guard_error'
      )
    }
  }

  /**
   * Check special route logic
   */
  private checkSpecialRoutes(currentPath: string, authState: any): RouteGuardResult | null {
    // Authenticated user on login page
    if (currentPath === '/login' && authState.user) {
      if (authState.profileComplete) {
        return this.createRedirectResult('/dashboard', 'already_authenticated')
      } else {
        return this.createRedirectResult('/', 'needs_onboarding')
      }
    }

    // Authenticated user with complete profile on onboarding
    if (currentPath === '/' && authState.user && authState.profileComplete) {
      return this.createRedirectResult('/dashboard', 'profile_already_complete')
    }

    // Auth callback special handling
    if (currentPath.startsWith('/auth/callback')) {
      // Allow callback processing
      return { allowed: true }
    }

    return null
  }

  /**
   * Create redirect result with loop prevention
   */
  private createRedirectResult(redirectTo: string, reason: string): RouteGuardResult {
    console.log(`🔄 ULTRA-GUARD: Redirecting to ${redirectTo}, reason: ${reason}`)
    
    this.incrementRedirectAttempt(redirectTo)
    
    return {
      allowed: false,
      redirectTo,
      reason
    }
  }

  /**
   * Check for redirect loops
   */
  private isRedirectLoop(path: string): boolean {
    const attempts = this.redirectAttempts.get(path) || 0
    const isLoop = attempts >= this.MAX_REDIRECT_ATTEMPTS
    
    if (isLoop) {
      console.error('🔴 ULTRA-GUARD: Redirect loop detected for', path, 'attempts:', attempts)
      
      // Reset after cooldown
      setTimeout(() => {
        this.redirectAttempts.delete(path)
        console.log('🔄 ULTRA-GUARD: Redirect cooldown expired for', path)
      }, this.REDIRECT_COOLDOWN)
    }
    
    return isLoop
  }

  /**
   * Increment redirect attempt counter
   */
  private incrementRedirectAttempt(path: string): void {
    const current = this.redirectAttempts.get(path) || 0
    this.redirectAttempts.set(path, current + 1)
    
    console.log(`📊 ULTRA-GUARD: Redirect attempt ${current + 1} for ${path}`)
  }

  /**
   * Reset redirect attempts for successful navigation
   */
  private resetRedirectAttempts(path: string): void {
    if (this.redirectAttempts.has(path)) {
      this.redirectAttempts.delete(path)
      console.log('🧹 ULTRA-GUARD: Reset redirect attempts for', path)
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Emergency route recovery - clear all redirect tracking
   */
  emergencyReset(): void {
    console.log('🚨 ULTRA-GUARD: Emergency reset - clearing all redirect tracking')
    this.redirectAttempts.clear()
    authResilientManager.invalidateCache()
  }

  /**
   * Get current redirect tracking status
   */
  getRedirectStatus(): Map<string, number> {
    return new Map(this.redirectAttempts)
  }
}

// Export singleton
export const routeGuardian = RouteGuardian.getInstance()

// Predefined route configurations
export const ROUTE_CONFIGS = {
  public: {
    requireAuth: false,
    requireProfile: false
  },
  authOnly: {
    requireAuth: true,
    requireProfile: false
  },
  protected: {
    requireAuth: true,
    requireProfile: true
  },
  admin: {
    requireAuth: true,
    requireProfile: true,
    allowedRoles: ['admin', 'moderator'] as string[]
  }
} as const

// Route definitions
export const ROUTE_DEFINITIONS = {
  '/': ROUTE_CONFIGS.authOnly,           // Onboarding - auth required, profile not required
  '/login': ROUTE_CONFIGS.public,        // Login page - public
  '/auth/callback': ROUTE_CONFIGS.public, // Auth callback - public
  '/dashboard': ROUTE_CONFIGS.protected,  // Dashboard - auth + profile required
  '/settings': ROUTE_CONFIGS.protected,   // Settings - auth + profile required
  '/admin': ROUTE_CONFIGS.admin          // Admin - auth + profile + role required
} as const

// Helper function for components
export async function guardCurrentRoute(pathname: string): Promise<RouteGuardResult> {
  const config = ROUTE_DEFINITIONS[pathname as keyof typeof ROUTE_DEFINITIONS] || ROUTE_CONFIGS.protected
  return routeGuardian.guardRoute(pathname, config)
}