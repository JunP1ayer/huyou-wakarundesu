import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { calcAllowance } from '@/lib/calcAllowance'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // リクエストの Cookie を渡して Supabase を初期化
    const supabase = createRouteHandlerClient({ cookies })
    
    // セッション取得 - エラーハンドリングを強化
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json({ error: 'Session validation failed' }, { status: 401 })
    }
    
    if (!session || !session.user) {
      console.error('No valid session found')
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    // 正常時はここでボディを読み込み、保存＆計算ロジックを実行
    const body = await request.json()
    
    // 入力データの検証
    const input = {
      isStudent: Boolean(body.isStudent),
      annualIncome: Number(body.annualIncome) || 1000000, // Default 100万円
      isDependent: Boolean(body.isDependent),
      isOver20hContract: Boolean(body.isOver20hContract)
    }

    // 扶養限度額の計算
    const calculatedValue = calcAllowance({
      isStudent: input.isStudent,
      projectedIncome: input.annualIncome,
      isDependent: input.isDependent
    })

    // プロフィール情報をデータベースに保存
    const { data: profileData, error: profileError } = await supabase
      .from('user_profile')
      .upsert({
        user_id: session.user.id,
        is_student: input.isStudent,
        annual_income: input.annualIncome,
        is_over_20h: input.isOver20hContract,
        fuyou_line: calculatedValue * 10000, // Convert from 万円 to 円
        profile_completed: true,
        profile_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Profile upsert error:', profileError)
      return NextResponse.json({ 
        error: 'Failed to save profile', 
        details: profileError.message 
      }, { status: 500 })
    }

    // 成功レスポンス
    return NextResponse.json({ 
      success: true, 
      allowance: calculatedValue,
      profile: profileData
    })

  } catch (error) {
    console.error('Unexpected error in profile complete API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}