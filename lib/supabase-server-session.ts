import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Session } from '@supabase/supabase-js'

// Server-side session fetching for SSR/App Router
export async function getServerSession(): Promise<Session | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Return null if environment variables are missing (demo mode)
  if (!url || !key) {
    console.warn('🟡 SSR Demo Mode: Missing Supabase credentials')
    return null
  }
  
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(url, key, {
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