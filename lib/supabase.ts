import { SupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

// Use environment variables directly to avoid build issues
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if we're in demo mode (no real Supabase connection)
export const isDemoMode = !supabaseUrl || !supabaseAnonKey

// Browser client singleton - prevents multiple GoTrueClient instances
export function createSupabaseClient(): SupabaseClient | null {
  // Server-side rendering check
  if (typeof window === 'undefined') {
    return null
  }

  // Check for existing singleton instance
  const windowWithSupabase = window as typeof window & { __supabase_singleton?: SupabaseClient }
  if (windowWithSupabase.__supabase_singleton) {
    return windowWithSupabase.__supabase_singleton
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    // In production without env vars, enable demo mode
    if (process.env.NODE_ENV === 'production' || !supabaseUrl || !supabaseAnonKey) {
      console.warn('🟡 DEMO MODE: Missing Supabase credentials')
      console.warn(`📊 URL: ${supabaseUrl ? '✅ SET' : '❌ MISSING'}`)
      console.warn(`🔑 KEY: ${supabaseAnonKey ? '✅ SET' : '❌ MISSING'}`)
      
      // Set demo mode flag
      if (typeof window !== 'undefined') {
        (window as typeof window & { __demo_mode?: boolean }).__demo_mode = true
      }
      return null
    }
    
    console.error('Supabase URL and anon key are required')
    return null
  }
  
  // Create singleton instance with @supabase/ssr proper configuration
  const client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    // @supabase/ssr uses these specific options
    cookieOptions: {
      name: supabaseUrl ? `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token` : 'sb-auth-token',
      lifetime: 60 * 60 * 24 * 7, // 7 days (SSR uses 'lifetime' not 'maxAge')
      domain: undefined, // Use current domain
      path: '/',
      sameSite: 'lax',
    },
    isSingleton: true,
  })
  
  // Store singleton instance
  windowWithSupabase.__supabase_singleton = client
  return client
}

// Helper function for authenticated operations
export async function getAuthenticatedSupabaseClient(): Promise<{
  supabase: SupabaseClient
  user: { id: string; email?: string }
} | null> {
  // Check for demo mode
  if (typeof window !== 'undefined' && (window as typeof window & { __demo_mode?: boolean }).__demo_mode) {
    // Return a mock authenticated user for demo mode
    return {
      supabase: {} as SupabaseClient, // Mock client
      user: {
        id: 'demo-user-001',
        email: 'demo@example.com'
      }
    }
  }
  
  const supabase = createSupabaseClient()
  
  if (!supabase) {
    console.error('🔴 Supabase client not available')
    console.error('📋 Check environment variables in Vercel Dashboard:')
    console.error('   - NEXT_PUBLIC_SUPABASE_URL')
    console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY')
    return null
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Auth error:', error.message)
      return null
    }
    
    if (!user) {
      console.error('User not authenticated: Auth session missing!')
      return null
    }

    return { supabase, user }
  } catch (error) {
    console.error('Authentication check failed:', error)
    return null
  }
}

// Database types
export interface UserProfile {
  user_id: string
  is_student: boolean
  support_type: 'full' | 'partial' | 'none'
  insurance: 'national' | 'employee' | 'none'
  company_large: boolean
  weekly_hours: number
  fuyou_line: number
  hourly_wage: number
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  date: string
  amount: number
  description?: string
  created_at: string
}

export interface UserStats {
  user_id: string
  ytd_income: number
  remaining: number
  remaining_hours: number
  updated_at: string
}

export interface TaxParameter {
  key: string
  value: number
  effective_year: number
  description?: string
  created_at: string
  updated_at: string
}

export interface UserMoneytreeTokens {
  user_id: string
  access_token: string
  refresh_token: string
  expires_at: string
  created_at: string
  updated_at: string
}