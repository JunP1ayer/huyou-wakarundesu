import { SupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validation function for environment variables
function validateSupabaseConfig(): void {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  const placeholderPatterns = [
    'your-',
    'YOUR_',
    'replace-me',
    'REPLACE_ME',
    'example.com',
    'localhost:3000',
  ]

  const hasPlaceholder = placeholderPatterns.some(pattern => 
    supabaseUrl.includes(pattern) || supabaseAnonKey.includes(pattern)
  )

  if (hasPlaceholder) {
    throw new Error('Supabase environment variables contain placeholder values. Please set proper values.')
  }
}

// Browser client singleton - prevents multiple GoTrueClient instances
export function createSupabaseClient(): SupabaseClient {
  // Server-side rendering check
  if (typeof window === 'undefined') {
    throw new Error('createSupabaseClient() can only be called on the client side')
  }

  // Validate configuration
  validateSupabaseConfig()

  // Check for existing singleton instance
  if (window.__supabase_singleton) {
    return window.__supabase_singleton
  }
  
  // Create singleton instance with @supabase/ssr proper configuration
  const client = createBrowserClient(supabaseUrl!, supabaseAnonKey!, {
    cookieOptions: {
      name: `sb-${new URL(supabaseUrl!).hostname.split('.')[0]}-auth-token`,
      domain: undefined, // Use current domain
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false, // Must be false for browser client
    },
    isSingleton: true,
  })
  
  // Store singleton instance
  window.__supabase_singleton = client
  return client
}

// Helper function for authenticated operations - AUTHENTICATION REQUIRED
export async function getAuthenticatedSupabaseClient(): Promise<{
  supabase: SupabaseClient
  user: { id: string; email?: string }
} | null> {
  const supabase = createSupabaseClient()

  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('🔴 Authentication error:', error.message)
      return null
    }
    
    if (!user) {
      console.error('🔴 User not authenticated - login required')
      return null
    }

    return { supabase, user }
  } catch (error) {
    console.error('🔴 Authentication check failed:', error)
    return null
  }
}

// Database types
export interface UserProfile {
  user_id: string
  profile_completed: boolean
  profile_completed_at?: string
  onboarding_step: number
  birth_year?: number
  student_type?: 'university' | 'vocational' | 'high_school' | 'graduate' | 'other'
  is_student: boolean
  support_type: 'full' | 'partial' | 'none' | 'unknown'
  insurance: 'national' | 'employee' | 'none' | 'unknown'
  company_large?: boolean
  weekly_hours: number
  fuyou_line: number
  hourly_wage: number
  monthly_income_target?: number
  created_at: string
  updated_at: string
}

export interface UserMonthlyIncome {
  id: string
  user_id: string
  year: number
  month: number
  income_amount: number
  is_estimated: boolean
  input_method: 'manual' | 'bank_api' | 'estimated'
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

// Type extensions for global window object
declare global {
  interface Window {
    __supabase_singleton?: SupabaseClient
  }
}