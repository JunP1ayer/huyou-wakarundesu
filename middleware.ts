/**
 * Next.js Edge Middleware - Simplified for stable authentication
 * Focus on essential security headers and static file filtering
 */

import { NextRequest, NextResponse } from 'next/server'


/**
 * セキュリティヘッダー追加 - Simplified for better compatibility
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // 基本的なセキュリティヘッダーのみ
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Relaxed CSP for PWA compatibility
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://*.supabase.co https://api.openai.com https://api.moneytree.jp; " +
    "frame-ancestors 'none';"
  )
  
  return response
}

/**
 * メインミドルウェア関数 - Simplified for authentication stability
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 静的ファイルとPWAアセットはスキップ
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.startsWith('/icons/') ||
    pathname === '/manifest.json' ||
    pathname === '/favicon.ico' ||
    pathname === '/sw.js' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname.startsWith('/workbox-') ||
    pathname.includes('.') // ファイル拡張子がある場合
  ) {
    return NextResponse.next()
  }

  // セキュリティヘッダーのみ追加 - レートリミットなどは無効化
  const response = NextResponse.next()
  return addSecurityHeaders(response)
}

/**
 * ミドルウェア適用パスの設定 - Simplified matcher
 */
export const config = {
  matcher: [
    /*
     * Match all paths except static files and API routes that don't need middleware
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|sw\\.js|manifest\\.json).*)',
  ]
}