import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Add CORS headers for API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    res.headers.set('Access-Control-Allow-Credentials', 'true')
    res.headers.set('Access-Control-Allow-Origin', req.headers.get('origin') || '*')
    res.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT,OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie')
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res
  }

  // Log cookies for debugging (remove in production)
  const cookieHeader = req.headers.get('cookie')
  console.log(`[MIDDLEWARE] ${req.method} ${req.nextUrl.pathname}`)
  console.log(`[MIDDLEWARE] Cookies: ${cookieHeader ? cookieHeader.substring(0, 100) + '...' : 'None'}`)
  
  const supabase = createServerClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = req.cookies.get(name)?.value
          console.log(`[MIDDLEWARE] Getting cookie ${name}: ${value ? 'present' : 'missing'}`)
          return value
        },
        set(name: string, value: string, options: any) {
          console.log(`[MIDDLEWARE] Setting cookie ${name}`)
          req.cookies.set({
            name,
            value,
            ...options,
          })
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          console.log(`[MIDDLEWARE] Removing cookie ${name}`)
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session }, error } = await supabase.auth.getSession()
  console.log(`[MIDDLEWARE] Session: ${session ? 'found' : 'none'}, Error: ${error ? error.message : 'none'}`)
  
  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt).*)',
  ],
}