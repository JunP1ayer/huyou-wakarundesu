import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * ダッシュボード向けAPIバッチエンドポイント
 * 複数のAPI呼び出しを並列実行して、ロード時間を短縮
 */
export async function GET() {
  const startTime = Date.now()
  
  try {
    const cookieStore = await cookies()
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      )
    }

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

    // ユーザー認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // 🚀 並列API実行でパフォーマンス向上
    const [profileResult, statsResult, bankResult] = await Promise.allSettled([
      // 1. ユーザープロフィール取得
      supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', user.id)
        .single(),

      // 2. ユーザー統計情報取得
      supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single(),

      // 3. 銀行連携状況確認
      supabase
        .from('user_moneytree_tokens')
        .select('user_id, created_at, last_synced')
        .eq('user_id', user.id)
        .single()
    ])

    // レスポンス構築
    const response: {
      user_id: string
      timestamp: string
      performance: {
        execution_time_ms: number
        parallel_requests: number
      }
      profile?: unknown
      stats?: unknown
      bank_connected?: boolean
      bank_info?: unknown
      errors?: Record<string, string>
    } = {
      user_id: user.id,
      timestamp: new Date().toISOString(),
      performance: {
        execution_time_ms: Date.now() - startTime,
        parallel_requests: 3
      }
    }

    // プロフィール処理
    if (profileResult.status === 'fulfilled' && !profileResult.value.error) {
      response.profile = profileResult.value.data
    } else {
      response.profile = null
      response.errors = response.errors || {}
      response.errors.profile = profileResult.status === 'fulfilled' 
        ? profileResult.value.error?.message || 'Profile fetch failed'
        : 'Profile fetch failed'
    }

    // 統計情報処理
    if (statsResult.status === 'fulfilled' && !statsResult.value.error) {
      response.stats = statsResult.value.data
    } else {
      // 統計情報が存在しない場合はデフォルト作成
      if (statsResult.status === 'fulfilled' && 
          statsResult.value.error?.code === 'PGRST116') {
        
        const defaultStats = {
          user_id: user.id,
          ytd_income: 0,
          transaction_count: 0,
          last_calculated: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        try {
          const { data: newStats, error: insertError } = await supabase
            .from('user_stats')
            .insert(defaultStats)
            .select()
            .single()

          if (!insertError) {
            response.stats = newStats
          } else {
            response.stats = defaultStats
            response.errors = response.errors || {}
            response.errors.stats_insert = insertError.message
          }
        } catch {
          response.stats = defaultStats
          response.errors = response.errors || {}
          response.errors.stats_insert = 'Failed to create default stats'
        }
      } else {
        response.stats = null
        response.errors = response.errors || {}
        response.errors.stats = statsResult.status === 'fulfilled'
          ? statsResult.value.error?.message || 'Stats fetch failed'
          : 'Stats fetch failed'
      }
    }

    // 銀行連携状況処理
    if (bankResult.status === 'fulfilled' && !bankResult.value.error) {
      response.bank_connected = true
      response.bank_info = {
        connected_at: bankResult.value.data?.created_at,
        last_synced: bankResult.value.data?.last_synced
      }
    } else {
      response.bank_connected = false
      response.bank_info = null
    }

    // 成功レスポンス
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Execution-Time': `${Date.now() - startTime}ms`
      }
    })

  } catch (error: unknown) {
    console.error('🔴 Dashboard batch API error:', error)
    
    return NextResponse.json({
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
      performance: {
        execution_time_ms: Date.now() - startTime,
        failed: true
      }
    }, { 
      status: 500,
      headers: {
        'X-Execution-Time': `${Date.now() - startTime}ms`
      }
    })
  }
}