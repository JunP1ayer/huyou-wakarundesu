import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calcAllowance } from '@/lib/calcAllowance'

// サービスロールキーで認証不要に呼び出せるクライアントを生成
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(request: NextRequest) {

  const input = await request.json() as {
    userId: string
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

  // profile, stats をまとめて upsert (例)
  await supabase.from('user_profile').upsert({
    user_id: input.userId,
    is_student: input.isStudent,
    annual_income: input.annualIncome,
    is_over_20h: input.isOver20hContract,
    fuyou_line: allowance * 10000, // Convert from 万円 to 円
    profile_completed: true,
    profile_completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })

  return NextResponse.json({ allowance })
}