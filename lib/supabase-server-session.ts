import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Session, User } from '@supabase/supabase-js'

// Helper function to check if a value is a valid (non-placeholder) environment variable
const isValidEnvValue = (value: string | undefined): boolean => {
  if (!value) return false
  
  const placeholderPatterns = [
    'your-',
    'YOUR_',
    'replace-me',
    'REPLACE_ME',
    'example.com',
    'localhost:3000',
  ]
  
  return !placeholderPatterns.some(pattern => value.includes(pattern))
}

// Server-side session fetching for SSR/App Router
export async function getServerSession(): Promise<Session | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE
  
  // Force demo mode if explicitly enabled or if credentials are invalid
  if (demoMode === 'true' || !isValidEnvValue(url) || !isValidEnvValue(key)) {
    console.warn('🟡 SSR Demo Mode: Returning mock session for preview')
    console.warn(`📊 Demo mode reasons: DEMO_MODE=${demoMode}, URL_VALID=${isValidEnvValue(url)}, KEY_VALID=${isValidEnvValue(key)}`)
    
    return {
      access_token: 'demo-ssr-token',
      refresh_token: 'demo-ssr-refresh',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'demo-user-001',
        email: 'demo@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
      } as User,
    } as Session
  }
  
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(url!, key!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                path: '/',
              })
            )
          } catch {
            // Server component - ignore cookie setting errors
          }
        },
      },
    })
    
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('🔴 SSR Session Error:', error.message)
      return null
    }
    
    return session
  } catch (error) {
    console.error('🔴 SSR Session Fetch Failed:', error)
    return null
  }
}