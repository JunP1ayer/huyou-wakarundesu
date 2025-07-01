import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Singleton pattern for Supabase client to avoid multiple GoTrueClient warnings
let supabaseInstance: SupabaseClient | null = null

// Client-side Supabase client (legacy compatibility)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null

// Browser client for client components with singleton pattern
export function createSupabaseClient(): SupabaseClient | null {
  // Return cached instance if it exists
  if (supabaseInstance) {
    return supabaseInstance
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time or when env vars are missing, return null to prevent crash
    if (typeof window === 'undefined') {
      console.warn('Supabase client creation skipped during build - missing env vars')
      return null
    }
    throw new Error('Supabase URL and anon key are required')
  }
  
  // Create new instance and cache it
  supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return supabaseInstance
}

// Helper function for authenticated operations
export async function getAuthenticatedSupabaseClient(): Promise<{
  supabase: SupabaseClient
  user: { id: string; email?: string }
} | null> {
  const supabase = createSupabaseClient()
  
  if (!supabase) {
    console.error('Supabase client not available')
    return null
  }

  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    console.error('User not authenticated:', error?.message)
    return null
  }

  return { supabase, user }
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