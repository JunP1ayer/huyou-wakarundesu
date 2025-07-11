import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const { pathname } = req.nextUrl
  
  // Enhanced CORS headers for API routes with environment-specific origins
  if (pathname.startsWith('/api/')) {
    const origin = req.headers.get('origin')
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'https://huyou-wakarundesu.vercel.app',
      ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : [])
    ]
    
    const isAllowedOrigin = !origin || allowedOrigins.includes(origin) || 
                          (origin && origin.includes('huyou-wakarundesu') && origin.includes('.vercel.app'))
    
    res.headers.set('Access-Control-Allow-Credentials', 'true')
    res.headers.set('Access-Control-Allow-Origin', isAllowedOrigin ? (origin || '*') : 'null')
    res.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT,OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, X-Requested-With')
    
    // Security headers for API routes
    res.headers.set('X-Content-Type-Options', 'nosniff')
    res.headers.set('X-Frame-Options', 'DENY')
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: res.headers })
  }

  // Enhanced logging (conditional based on environment)
  const shouldLog = process.env.NODE_ENV === 'development' || 
                   process.env.VERCEL_ENV === 'preview' ||
                   pathname.startsWith('/api/')
  
  if (shouldLog) {
    const cookieHeader = req.headers.get('cookie')
    console.log(`[MIDDLEWARE] ${req.method} ${pathname} - ${new Date().toISOString()}`)
    console.log(`[MIDDLEWARE] Origin: ${req.headers.get('origin') || 'none'}`)
    console.log(`[MIDDLEWARE] Cookies: ${cookieHeader ? `${cookieHeader.length} chars, preview: ${cookieHeader.substring(0, 50)}...` : 'None'}`)
  }
  
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