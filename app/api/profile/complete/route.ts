import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { calcAllowance } from '@/lib/calcAllowance'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  // Supabase クライアントをリクエストの Cookie から初期化
  const supabase = createRouteHandlerClient({ cookies })
  
  // セッション取得
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const input = await request.json() as {
    isStudent: boolean
    annualIncome: number
    isDependent: boolean
    isOver20hContract: boolean
  }

  const allowance = calcAllowance({
    isStudent: input.isStudent,
    projectedIncome: input.annualIncome,
    isDependent: input.isDependent
  })

  // profile, stats をまとめて upsert (認証済みユーザーIDを使用)
  const { error } = await supabase.from('user_profile').upsert({
    user_id: session.user.id,
    is_student: input.isStudent,
    annual_income: input.annualIncome,
    is_over_20h: input.isOver20hContract,
    fuyou_line: allowance * 10000, // Convert from 万円 to 円
    profile_completed: true,
    profile_completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })

  if (error) {
    console.error('Profile upsert error:', error)
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
  }

  return NextResponse.json({ success: true, allowance })
}