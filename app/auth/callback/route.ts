import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/supabase'

export async function GET(request: Request) {
  console.log('[AUTH CALLBACK] 認証コールバック処理開始')
  
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const error = requestUrl.searchParams.get('error')
    const errorDescription = requestUrl.searchParams.get('error_description')
    
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
    
    console.log('[AUTH CALLBACK] 認証コードを検証中...')
    
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // URLから認証セッションを取得
    const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError || !data.session) {
      console.error('[AUTH CALLBACK] セッション取得失敗:', sessionError)
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
    }
    
    const { session, user } = data
    
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
    console.error('[AUTH CALLBACK] 予期しないエラー:', error)
    return NextResponse.redirect(new URL('/login?error=callback_failed', request.url))
  }
}