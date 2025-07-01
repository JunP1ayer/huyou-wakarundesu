import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Server client for server components and API routes
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
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server component - ignore
          }
        },
      },
    }
  )
}