import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
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
    // For manifest.json specifically, ensure proper headers
    if (pathname === '/manifest.json') {
      const response = NextResponse.next()
      response.headers.set('Content-Type', 'application/manifest+json')
      response.headers.set('Cache-Control', 'public, max-age=3600')
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }
    
    // Allow other public paths to proceed normally
    return NextResponse.next()
  }
  
  // For API routes that might fail due to missing env vars, add warning headers
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    
    // Add a warning header if environment is not properly configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      response.headers.set('X-Config-Warning', 'Missing-Environment-Variables')
    }
    
    return response
  }
  
  // For all other routes, proceed normally
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * But DO include manifest.json and other root-level files
     */
    '/((?!_next/static|_next/image).*)',
  ],
}