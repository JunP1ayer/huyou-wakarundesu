import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// OAuth設定検証API
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // 基本的な環境変数チェック
    const validation = {
      timestamp: new Date().toISOString(),
      environment: {
        supabaseUrl: {
          configured: !!url,
          valid: url ? !url.includes('your-') && !url.includes('example') : false,
          value: url ? `${url.substring(0, 20)}...` : 'not set'
        },
        supabaseKey: {
          configured: !!key,
          valid: key ? !key.includes('your-') && key.startsWith('eyJ') : false,
          length: key?.length || 0
        }
      },
      oauth: {
        googleProvider: {
          status: 'unknown',
          error: null,
          details: null
        }
      },
      connectivity: {
        supabaseConnection: false,
        authEndpoint: false
      },
      recommendations: [] as string[]
    }

    // Supabase接続テスト
    if (url && key && validation.environment.supabaseUrl.valid) {
      try {
        const supabase = createServerClient(url, key, {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, {
                    ...options,
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
        })

        // 基本的な接続テスト
        const { data, error } = await supabase.auth.getSession()
        validation.connectivity.supabaseConnection = !error
        
        if (error) {
          validation.recommendations.push('Supabase接続エラー: ' + error.message)
        }

        // Google OAuth プロバイダーテスト
        try {
          // OAuth設定をテスト（実際のリダイレクトは行わない）
          const oauthTest = await fetch(`${url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent('https://example.com')}&skip_http_redirect=true`)
          
          if (oauthTest.status === 400) {
            // プロバイダーが無効な場合は400エラー
            validation.oauth.googleProvider.status = 'disabled'
            validation.oauth.googleProvider.error = 'Google provider is not enabled'
            validation.recommendations.push('🔧 Supabase Dashboard でGoogle OAuth providerを有効化してください')
          } else if (oauthTest.status === 302 || oauthTest.status === 200) {
            // リダイレクトまたは成功レスポンス
            validation.oauth.googleProvider.status = 'enabled'
            validation.oauth.googleProvider.details = 'Google OAuth provider is configured'
          } else {
            validation.oauth.googleProvider.status = 'error'
            validation.oauth.googleProvider.error = `Unexpected status: ${oauthTest.status}`
          }
        } catch (oauthError: any) {
          validation.oauth.googleProvider.status = 'error'
          validation.oauth.googleProvider.error = oauthError.message
          validation.recommendations.push('OAuth設定の確認が必要です')
        }

      } catch (supabaseError: any) {
        validation.connectivity.supabaseConnection = false
        validation.recommendations.push('Supabase設定エラー: ' + supabaseError.message)
      }
    } else {
      validation.recommendations.push('環境変数NEXT_PUBLIC_SUPABASE_URLとNEXT_PUBLIC_SUPABASE_ANON_KEYを正しく設定してください')
    }

    // 設定推奨事項の追加
    if (!validation.environment.supabaseUrl.valid) {
      validation.recommendations.push('NEXT_PUBLIC_SUPABASE_URLにプレースホルダー値が含まれています')
    }
    
    if (!validation.environment.supabaseKey.valid) {
      validation.recommendations.push('NEXT_PUBLIC_SUPABASE_ANON_KEYが正しいJWT形式ではありません')
    }

    if (validation.oauth.googleProvider.status === 'disabled') {
      validation.recommendations.push('Google認証を有効にするには OAUTH_ULTRA_SETUP.md の手順に従ってください')
    }

    // 全体的な状態判定
    const overallStatus = 
      validation.connectivity.supabaseConnection && 
      validation.oauth.googleProvider.status === 'enabled' 
        ? 'ready' 
        : validation.connectivity.supabaseConnection 
          ? 'partial' 
          : 'error'

    return NextResponse.json({
      status: overallStatus,
      ...validation
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error: any) {
    console.error('🔴 OAuth validation error:', error)
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      recommendations: [
        '設定検証中にエラーが発生しました',
        'OAUTH_ULTRA_SETUP.md の手順を確認してください'
      ]
    }, { status: 500 })
  }
}

// POST: リアルタイム OAuth テスト
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testType } = body

    if (testType === 'google_oauth') {
      // Google OAuth フローのシミュレーション
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!url || !key) {
        return NextResponse.json({
          success: false,
          error: 'Supabase credentials not configured'
        })
      }

      try {
        // OAuth URLの生成テスト
        const oauthUrl = `${url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent('https://example.com')}`
        const response = await fetch(oauthUrl, {
          method: 'GET',
          redirect: 'manual' // リダイレクトを手動で処理
        })

        return NextResponse.json({
          success: response.status === 302,
          status: response.status,
          message: response.status === 302 
            ? 'Google OAuth provider is properly configured' 
            : 'Google OAuth provider may not be enabled',
          details: {
            redirectLocation: response.headers.get('location'),
            responseStatus: response.status
          }
        })

      } catch (error: any) {
        return NextResponse.json({
          success: false,
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Unknown test type'
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 400 })
  }
}