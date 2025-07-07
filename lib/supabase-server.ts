import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// Server client for server components and API routes (user-based)
export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Return null if environment variables are missing
  if (!url || !key) {
    console.error('Supabase server client: Missing environment variables')
    return null
  }
  
  // Only use next/headers in server context
  if (typeof window !== 'undefined') {
    console.warn('createSupabaseServerClient called in client context, use createSupabaseClientSafe instead')
    return null
  }
  
  try {
    // Dynamic import to avoid bundling in client
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    
    return createServerClient(
      url,
      key,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, {
                  ...options,
                  // Ensure cookies work across environments
                  sameSite: 'lax',
                  secure: process.env.NODE_ENV === 'production',
                  httpOnly: false, // Allow client-side access for auth tokens
                  path: '/',
                })
              )
            } catch (error) {
              // Server component - log but don't throw on cookie setting errors
              console.warn('Failed to set cookies in server component:', error)
            }
          },
        },
      }
    )
  } catch (error) {
    console.error('Failed to create Supabase server client:', error)
    return null
  }
}

// Simplified server client for read-only operations
export function createSupabaseServerClientReadOnly() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.error('Supabase server client: Missing environment variables')
    return null
  }
  
  // In client context, return null and let thresholdRepo use client-side client
  if (typeof window !== 'undefined') {
    return null
  }
  
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// Admin client for API routes (service role key)
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  // Debug logs
  console.log('URL:', url)
  console.log('Service Role Key Present:', !!serviceRoleKey)
  
  if (!url || !serviceRoleKey) {
    console.error('Supabase admin client: Missing environment variables')
    return null
  }
  
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}