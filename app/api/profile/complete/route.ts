import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { calcAllowance } from '@/lib/calcAllowance'

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const input = await request.json() as {
    isStudent: boolean
    projectedIncome: number
    isDependent: boolean
  }

  const allowance = calcAllowance(input)

  // profile, stats をまとめて upsert (例)
  await supabase.from('user_profile').upsert({
    user_id: session.user.id,
    is_student: input.isStudent,
    projected_income: input.projectedIncome,
    fuyou_line: allowance * 10000, // Convert from 万円 to 円
    profile_completed: true,
    profile_completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })

  return NextResponse.json({ allowance })
}