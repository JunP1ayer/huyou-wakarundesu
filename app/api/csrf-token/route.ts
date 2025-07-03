/**
 * CSRF トークン提供API
 * フロントエンドがCSRFトークンを取得するためのエンドポイント
 */

import { NextRequest, NextResponse } from 'next/server'
import { createCSRFTokenResponse, getCSRFConfig } from '@/lib/csrf'

/**
 * CSRFトークン取得 - GET /api/csrf-token
 */
export async function GET(request: NextRequest) {
  try {
    // 新しいCSRFトークンを生成してレスポンス
    const response = createCSRFTokenResponse()
    
    // セキュリティヘッダーを追加
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    // 開発環境でのデバッグ情報
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 CSRF token generated for client')
    }
    
    return response
    
  } catch (error) {
    console.error('🔴 CSRF token generation error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate CSRF token',
        message: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

/**
 * CSRFトークン検証テスト - POST /api/csrf-token
 * 開発環境でのCSRF保護テスト用
 */
export async function POST(request: NextRequest) {
  // 開発環境のみでテスト機能を提供
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 404 }
    )
  }

  try {
    const { 
      createCSRFMiddleware, 
      getCSRFTokenFromRequest 
    } = await import('@/lib/csrf')
    
    const csrfMiddleware = createCSRFMiddleware()
    const validation = csrfMiddleware(request)
    const { headerToken, cookieToken } = getCSRFTokenFromRequest(request)
    
    const config = getCSRFConfig()
    
    return NextResponse.json({
      validation: {
        isValid: validation.isValid,
        shouldGenerateToken: validation.shouldGenerateToken,
        error: validation.error
      },
      tokens: {
        header: headerToken ? `${headerToken.slice(0, 8)}...` : null,
        cookie: cookieToken ? `${cookieToken.slice(0, 8)}...` : null,
        match: headerToken === cookieToken
      },
      config: {
        headerName: config.headerName,
        cookieName: config.cookieName,
        environment: config.isDevelopment ? 'development' : 'production'
      },
      request: {
        method: request.method,
        hasContentType: !!request.headers.get('content-type'),
        userAgent: request.headers.get('user-agent')?.slice(0, 50) + '...'
      }
    })
    
  } catch (error) {
    console.error('🔴 CSRF validation test error:', error)
    
    return NextResponse.json(
      { 
        error: 'CSRF validation test failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}