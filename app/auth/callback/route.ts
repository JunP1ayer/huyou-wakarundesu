import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/supabase'
import type { AuthResponse } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const startTime = Date.now()
  console.log('[AUTH CALLBACK] 認証コールバック処理開始', {
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method
  })
  
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const error = requestUrl.searchParams.get('error')
    const errorDescription = requestUrl.searchParams.get('error_description')
    const state = requestUrl.searchParams.get('state')
    
    console.log('[AUTH CALLBACK] リクエスト詳細:', {
      host: requestUrl.host,
      pathname: requestUrl.pathname,
      searchParams: Object.fromEntries(requestUrl.searchParams),
      hasCode: !!code,
      codeLength: code?.length || 0,
      hasError: !!error,
      hasState: !!state
    })
    
    // 環境変数の確認
    console.log('[AUTH CALLBACK] 環境変数確認:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      supabaseUrlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    })
    
    // エラーパラメータが存在する場合の処理
    if (error) {
      console.error('[AUTH CALLBACK] OAuth エラー:', error, errorDescription)
      
      if (error === 'access_denied') {
        return NextResponse.redirect(new URL('/login?error=access_denied', request.url))
      } else if (error === 'unauthorized_client') {
        return NextResponse.redirect(new URL('/login?error=unauthorized_client', request.url))
      } else {
        return NextResponse.redirect(new URL('/login?error=oauth_error', request.url))
      }
    }
    
    // コードパラメータが存在しない場合
    if (!code) {
      console.error('[AUTH CALLBACK] 認証コードが見つかりません')
      return NextResponse.redirect(new URL('/login?error=no_code', request.url))
    }
    
    console.log('[AUTH CALLBACK] 認証コードを検証中...', {
      codePreview: code.substring(0, 10) + '...',
      codeLength: code.length
    })
    
    const supabase = createRouteHandlerClient<Database>({ cookies })
    console.log('[AUTH CALLBACK] Supabaseクライアント作成完了')
    
    // URLから認証セッションを取得
    console.log('[AUTH CALLBACK] exchangeCodeForSession開始...')
    const exchangeStartTime = Date.now()
    
    let data: AuthResponse['data'] | null = null
    let sessionError: AuthResponse['error'] | null = null
    try {
      console.log('[AUTH CALLBACK] exchangeCodeForSession実行詳細:', {
        codeFormat: code.substring(0, 10) + '...' + code.substring(code.length - 10),
        codeLength: code.length,
        supabaseClientReady: !!supabase,
        requestOrigin: requestUrl.origin,
        userAgent: request.headers.get('user-agent')?.substring(0, 100)
      })
      
      const result = await supabase.auth.exchangeCodeForSession(code)
      data = result.data
      sessionError = result.error
      
      console.log('[AUTH CALLBACK] exchangeCodeForSession結果詳細:', {
        hasResult: !!result,
        resultKeys: result ? Object.keys(result) : [],
        hasData: !!result?.data,
        dataKeys: result?.data ? Object.keys(result.data) : [],
        hasError: !!result?.error,
        errorType: result?.error ? typeof result.error : 'none'
      })
    } catch (exchangeException) {
      const exchangeEndTime = Date.now()
      console.error('[AUTH CALLBACK] exchangeCodeForSession例外発生:', {
        exceptionName: exchangeException instanceof Error ? exchangeException.name : 'Unknown',
        exceptionMessage: exchangeException instanceof Error ? exchangeException.message : String(exchangeException),
        exceptionStack: exchangeException instanceof Error ? exchangeException.stack?.split('\n').slice(0, 5).join('\n') : undefined,
        duration: exchangeEndTime - exchangeStartTime,
        codeUsed: code.substring(0, 20) + '...',
        timestamp: new Date().toISOString()
      })
      return NextResponse.redirect(new URL(`/login?error=exchange_exception&details=${encodeURIComponent(exchangeException instanceof Error ? exchangeException.message : 'Exchange failed')}`, request.url))
    }
    
    const exchangeEndTime = Date.now()
    console.log('[AUTH CALLBACK] exchangeCodeForSession完了', {
      duration: exchangeEndTime - exchangeStartTime,
      hasData: !!data,
      hasSession: !!data?.session,
      hasUser: !!data?.user,
      hasError: !!sessionError,
      sessionTokenPreview: data?.session?.access_token?.substring(0, 20) + '...',
      userIdPreview: data?.user?.id?.substring(0, 8) + '...',
      userEmail: data?.user?.email
    })
    
    if (sessionError) {
      console.error('[AUTH CALLBACK] セッション取得エラー詳細:', {
        message: sessionError.message,
        status: sessionError.status,
        name: sessionError.name,
        code: sessionError.code,
        // details: sessionError.details, // May not exist on all error types
        // hint: sessionError.hint, // May not exist on all error types
        stack: sessionError.stack?.split('\n').slice(0, 3).join('\n'),
        fullErrorObject: JSON.stringify(sessionError, null, 2)
      })
      return NextResponse.redirect(new URL(`/login?error=auth_failed&details=${encodeURIComponent(sessionError.message)}&code=${encodeURIComponent(sessionError.code || 'unknown')}`, request.url))
    }
    
    if (!data?.session) {
      console.error('[AUTH CALLBACK] セッションが存在しません:', {
        dataKeys: Object.keys(data || {}),
        dataSessionValue: data?.session
      })
      return NextResponse.redirect(new URL('/login?error=no_session', request.url))
    }
    
    const { session, user } = data
    
    if (!user) {
      console.error('[AUTH CALLBACK] ユーザー情報が存在しません')
      return NextResponse.redirect(new URL('/login?error=no_user', request.url))
    }
    
    console.log('[AUTH CALLBACK] 認証成功:', {
      userId: user.id,
      email: user.email,
      provider: user.app_metadata?.provider,
      hasAccessToken: !!session.access_token,
      hasRefreshToken: !!session.refresh_token
    })
    
    // ユーザープロファイルの確認（新規ユーザーの場合、データベーストリガーで自動作成される）
    try {
      const { data: profile, error: profileError } = await supabase
        .from('user_profile')
        .select('user_id, profile_completed')
        .eq('user_id', user.id)
        .single()
      
      if (profile) {
        console.log('[AUTH CALLBACK] ユーザープロファイル確認済み:', {
          profileCompleted: profile.profile_completed
        })
        
        // プロファイル完了状況に応じてリダイレクト先を決定
        if (profile.profile_completed) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        } else {
          return NextResponse.redirect(new URL('/', request.url))
        }
      } else if (profileError?.code === 'PGRST116') {
        console.log('[AUTH CALLBACK] 新規ユーザー - プロファイル自動作成予定')
        // 新規ユーザーはオンボーディングフローへ
        return NextResponse.redirect(new URL('/', request.url))
      } else {
        console.error('[AUTH CALLBACK] プロファイル確認エラー:', profileError)
        // エラーがあってもオンボーディングフローへ
        return NextResponse.redirect(new URL('/', request.url))
      }
    } catch (profileCheckError) {
      console.error('[AUTH CALLBACK] プロファイル確認例外:', profileCheckError)
      // 例外が発生してもオンボーディングフローへ
      return NextResponse.redirect(new URL('/', request.url))
    }
    
  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error('[AUTH CALLBACK] 予期しないエラー:', {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5).join('\n') : undefined,
      totalProcessingTime: totalTime
    })
    return NextResponse.redirect(new URL(`/login?error=callback_failed&details=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`, request.url))
  } finally {
    const totalTime = Date.now() - startTime
    console.log('[AUTH CALLBACK] 処理完了', {
      totalProcessingTime: totalTime,
      timestamp: new Date().toISOString()
    })
  }
}