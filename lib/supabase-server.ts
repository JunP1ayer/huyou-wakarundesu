import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Server client for server components and API routes (user-based)
export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Return null if environment variables are missing
  if (!url || !key) {
    console.error('Supabase server client: Missing environment variables')
    return null
  }
  
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
                httpOnly: true,
                path: '/',
              })
            )
          } catch {
            // Server component - ignore cookie setting errors
          }
        },
      },
    }
  )
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