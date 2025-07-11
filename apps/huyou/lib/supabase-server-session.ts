import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Session } from '@supabase/supabase-js'

// Helper function to validate required environment variables
const validateEnvVars = (url: string | undefined, key: string | undefined): void => {
  if (!url || !key) {
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
    url.includes(pattern) || key.includes(pattern)
  )
  
  if (hasPlaceholder) {
    throw new Error('Supabase environment variables contain placeholder values. Please set proper values.')
  }
}

// Server-side session fetching for SSR/App Router - Authentication Required
export async function getServerSession(): Promise<Session | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Validate environment variables - no demo mode fallback
  validateEnvVars(url, key)
  
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(url as string, key as string, {
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
    
    // Use getUser() to validate the authentication first
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.log('🔴 SSR User validation failed:', userError.message)
      return null
    }
    
    if (!user) {
      return null
    }
    
    // If user is authenticated, get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('🔴 SSR Session Error:', sessionError.message)
      return null
    }
    
    return session
  } catch (error) {
    console.error('🔴 SSR Session Fetch Failed:', error)
    return null
  }
}