import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // List of paths that should bypass all authentication and checks
  const publicPaths = [
    '/manifest.json',
    '/sw.js',
    '/sw-custom.js',
    '/favicon.ico',
    '/robots.txt',
  ]
  
  // Check if the request is for a public static asset
  const isPublicPath = publicPaths.some(path => pathname === path) ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/_next/image/')
  
  if (isPublicPath) {
    // For static assets, allow them through without auth
    const response = NextResponse.next()
    
    // Set proper headers for manifest.json
    if (pathname === '/manifest.json') {
      response.headers.set('Content-Type', 'application/manifest+json')
      response.headers.set('Cache-Control', 'public, max-age=3600')
    }
    
    // Debug headers to identify middleware behavior
    response.headers.set('X-Middleware-Public-Path', 'true')
    response.headers.set('X-Middleware-Path', pathname)
    
    return response
  }
  
  // Create a Supabase client configured for middleware
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // If Supabase is not configured, allow requests through (demo mode)
  if (!supabaseUrl || !supabaseAnonKey) {
    const response = NextResponse.next()
    response.headers.set('X-Demo-Mode', 'true')
    response.headers.set('X-Supabase-URL-Set', supabaseUrl ? 'true' : 'false')
    response.headers.set('X-Supabase-Key-Set', supabaseAnonKey ? 'true' : 'false')
    response.headers.set('X-Middleware-Path', pathname)
    return response
  }
  
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
  
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, {
            ...options,
            // Ensure cookies work in production
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
          })
        )
      },
    },
  })
  
  // Refresh session if it exists (this will extend the session)
  const { data: { session }, error } = await supabase.auth.getSession()
  
  // For auth callback routes, allow through
  if (pathname.startsWith('/api/auth/')) {
    return response
  }
  
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/signup', '/api/health', '/api/manifest']
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))
  
  if (isPublicRoute) {
    return response
  }
  
  // Protected routes require authentication
  if (!session && !isPublicRoute) {
    // Allow API routes to return 401
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }
    
    // Redirect to home for other routes
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/'
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * But DO include manifest.json and other root-level files
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}