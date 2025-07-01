import { SupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

// Development fallback values - DO NOT USE IN PRODUCTION
const DEVELOPMENT_SUPABASE_URL = 'https://xyzcompany.supabase.co'
const DEVELOPMENT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emNvbXBhbnkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYyNTY3MjQwMCwiZXhwIjoxOTQxMjQ4NDAwfQ.AQcFUykdFmIDXGuQNL1cGayHoYqBsyFQSy2vSaGWiSU'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || (process.env.NODE_ENV === 'development' ? DEVELOPMENT_SUPABASE_URL : '')
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (process.env.NODE_ENV === 'development' ? DEVELOPMENT_ANON_KEY : '')

// Check if we're in demo mode (no real Supabase connection)
export const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NODE_ENV === 'production'

// Global singleton instance to prevent multiple GoTrueClient warnings
let globalSupabaseInstance: SupabaseClient | null = null

// Legacy compatibility - DO NOT USE (causes multiple clients)
export const supabase = null

// Browser client for client components with strict singleton pattern
export function createSupabaseClient(): SupabaseClient | null {
  // Return cached global instance if it exists
  if (globalSupabaseInstance) {
    return globalSupabaseInstance
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time or when env vars are missing
    if (typeof window === 'undefined') {
      console.warn('Supabase client creation skipped during build - missing env vars')
      return null
    }
    
    // In production without env vars, return a mock client for demo mode
    if (process.env.NODE_ENV === 'production') {
      console.warn('Running in DEMO MODE - No Supabase credentials provided')
      // Return null but set demo mode flag
      if (typeof window !== 'undefined') {
        (window as typeof window & { __demo_mode?: boolean }).__demo_mode = true
      }
      return null
    }
    
    console.error('Supabase URL and anon key are required')
    return null
  }
  
  // Create new instance ONLY if none exists globally
  if (typeof window !== 'undefined') {
    // Check if instance already exists in window scope
    const windowWithSupabase = window as typeof window & { __supabase_client?: SupabaseClient }
    if (!windowWithSupabase.__supabase_client) {
      windowWithSupabase.__supabase_client = createBrowserClient(supabaseUrl, supabaseAnonKey)
    }
    globalSupabaseInstance = windowWithSupabase.__supabase_client
  }
  
  return globalSupabaseInstance
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
    console.error('Supabase client not available - check environment variables')
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