/**
 * Next.js Edge Middleware - レートリミットとセキュリティ強化
 * Vercel Edge Runtime で高速実行
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  createRateLimitMiddleware, 
  RateLimitPresets, 
  getClientIP,
  getUserIdentifier 
} from '@/lib/rate-limit'

// レートリミット設定マッピング
const RATE_LIMIT_CONFIG = {
  // 認証関連のエンドポイント
  '/api/auth': RateLimitPresets.auth,
  '/login': RateLimitPresets.auth,
  '/api/login': RateLimitPresets.auth,
  
  // ダッシュボードAPI（重要度高）
  '/api/dashboard': RateLimitPresets.dashboard,
  '/api/dashboard/batch': RateLimitPresets.batch,
  
  // 一般API
  '/api/health': RateLimitPresets.loose,
  '/api/classifyFuyou': RateLimitPresets.standard,
  
  // Moneytree連携（外部API呼び出し）
  '/api/moneytree': RateLimitPresets.strict,
  
  // OAuth診断（管理機能）
  '/api/auth/validate': RateLimitPresets.standard,
  
  // デフォルト
  default: RateLimitPresets.standard
} as const

/**
 * パスに基づくレートリミット設定取得
 */
function getRateLimitConfig(pathname: string) {
  // 最長マッチでレートリミット設定を取得
  const matchingPath = Object.keys(RATE_LIMIT_CONFIG)
    .filter(path => path !== 'default' && pathname.startsWith(path))
    .sort((a, b) => b.length - a.length)[0]
  
  return matchingPath ? RATE_LIMIT_CONFIG[matchingPath as keyof typeof RATE_LIMIT_CONFIG] : RATE_LIMIT_CONFIG.default
}

/**
 * CSRFトークン検証（後で実装）
 */
function validateCSRFToken(request: NextRequest): boolean {
  // POST, PUT, DELETE リクエストでCSRFトークンをチェック
  if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
    const csrfToken = request.headers.get('x-csrf-token')
    const csrfCookie = request.cookies.get('csrf-token')?.value
    
    // 開発環境ではCSRF検証をスキップ
    if (process.env.NODE_ENV === 'development') {
      return true
    }
    
    // TODO: 実際のCSRF検証実装
    return csrfToken === csrfCookie
  }
  
  return true
}

/**
 * セキュリティヘッダー追加
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // セキュリティヘッダーの設定
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // PWAアプリなので厳格なCSP
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
 * Bot検出とブロック
 */
function detectBot(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || ''
  
  // 悪意のあるBotパターン
  const maliciousBotPatterns = [
    /curl/i,
    /wget/i,
    /python-requests/i,
    /scrapy/i,
    /bot.*attack/i,
    /malicious/i
  ]
  
  // 検索エンジンBotは許可
  const allowedBotPatterns = [
    /googlebot/i,
    /bingbot/i,
    /slackbot/i,
    /facebookexternalhit/i,
    /twitterbot/i
  ]
  
  // 許可されたBotの場合は通す
  if (allowedBotPatterns.some(pattern => pattern.test(userAgent))) {
    return false
  }
  
  // 悪意のあるBotの場合はブロック
  return maliciousBotPatterns.some(pattern => pattern.test(userAgent))
}

/**
 * ログ記録
 */
function logRequest(request: NextRequest, rateLimitResult?: any, blocked?: boolean) {
  if (process.env.NODE_ENV === 'production') {
    const logData = {
      timestamp: new Date().toISOString(),
      method: request.method,
      path: request.nextUrl.pathname,
      ip: getClientIP(request),
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
      blocked: blocked || false,
      rateLimit: rateLimitResult ? {
        success: rateLimitResult.success,
        remaining: rateLimitResult.headers['X-RateLimit-Remaining'],
        limit: rateLimitResult.headers['X-RateLimit-Limit']
      } : null
    }
    
    // 本番環境では適切なログシステムに送信
    console.log('🔒 Security Middleware Log:', JSON.stringify(logData))
  }
}

/**
 * メインミドルウェア関数
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 静的ファイルはスキップ
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') // ファイル拡張子がある場合
  ) {
    return NextResponse.next()
  }

  try {
    // Bot検出
    if (detectBot(request)) {
      logRequest(request, null, true)
      return new NextResponse('Forbidden', { status: 403 })
    }

    // CSRFトークン検証
    if (!validateCSRFToken(request)) {
      logRequest(request, null, true)
      return new NextResponse('CSRF token validation failed', { status: 403 })
    }

    // レートリミット適用パスかどうかチェック
    const shouldApplyRateLimit = pathname.startsWith('/api/') || 
                                pathname === '/login' ||
                                pathname === '/dashboard'

    if (shouldApplyRateLimit) {
      // レートリミット設定取得
      const rateLimitConfig = getRateLimitConfig(pathname)
      const rateLimitMiddleware = createRateLimitMiddleware(rateLimitConfig)
      
      // ユーザーID取得（認証済みの場合）
      // TODO: 実際の認証実装に応じて調整
      const userId = request.cookies.get('user_id')?.value
      
      // レートリミットチェック
      const rateLimitResult = await rateLimitMiddleware(request, userId)
      
      logRequest(request, rateLimitResult)
      
      if (!rateLimitResult.success) {
        const response = new NextResponse(
          JSON.stringify({
            error: 'Rate limit exceeded',
            message: rateLimitResult.message,
            retryAfter: rateLimitResult.headers['Retry-After']
          }),
          { 
            status: rateLimitResult.status,
            headers: {
              'Content-Type': 'application/json',
              ...rateLimitResult.headers
            }
          }
        )
        
        return addSecurityHeaders(response)
      }
      
      // レートリミット通過 - ヘッダーを追加してリクエストを続行
      const response = NextResponse.next()
      
      // レートリミットヘッダーを追加
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      
      return addSecurityHeaders(response)
    }

    // レートリミット対象外のパスはセキュリティヘッダーのみ追加
    const response = NextResponse.next()
    logRequest(request)
    return addSecurityHeaders(response)
    
  } catch (error) {
    console.error('🔴 Middleware error:', error)
    
    // エラー時も基本的なセキュリティヘッダーは追加
    const response = NextResponse.next()
    return addSecurityHeaders(response)
  }
}

/**
 * ミドルウェア適用パスの設定
 */
export const config = {
  matcher: [
    /*
     * 以下のパスを除く全てのパスにマッチ:
     * - api routes in /api/
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|sw\\.js|manifest\\.json).*)',
  ],
  
  // Edge Runtime使用でパフォーマンス向上
  runtime: 'edge',
}