import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Client-side Supabase client (for compatibility with existing code)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null

// Browser client for client components
export function createSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and anon key are required')
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
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