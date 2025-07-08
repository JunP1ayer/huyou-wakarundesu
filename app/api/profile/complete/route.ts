import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { calcAllowance } from '@/lib/calcAllowance'
import type { 
  ProfileCompleteRequest, 
  ProfileCompleteApiResponse, 
  ApiErrorResponse, 
  ProfileCompleteResponse
} from '@/types/api'

export const dynamic = 'force-dynamic'

/**
 * セキュアな入力値検証
 */
function validateInput(body: unknown): { isValid: true; data: ProfileCompleteRequest } | { isValid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Request body must be a valid JSON object' }
  }

  const data = body as Record<string, unknown>
  
  // 必須フィールドの検証
  const requiredFields = ['isStudent', 'annualIncome', 'isDependent', 'isOver20hContract'] as const
  for (const field of requiredFields) {
    if (!(field in data)) {
      return { isValid: false, error: `Missing required field: ${field}` }
    }
  }

  // 年収の範囲検証
  const annualIncome = Number(data.annualIncome)
  if (isNaN(annualIncome) || annualIncome < 0 || annualIncome > 50_000_000) {
    return { isValid: false, error: 'Annual income must be between 0 and 50,000,000 yen' }
  }

  return {
    isValid: true,
    data: {
      isStudent: Boolean(data.isStudent),
      annualIncome: annualIncome,
      isDependent: Boolean(data.isDependent),
      isOver20hContract: Boolean(data.isOver20hContract)
    }
  }
}

/**
 * 統一されたエラーレスポンス生成
 */
function createErrorResponse(
  error: string, 
  code: ApiErrorResponse['code'], 
  status: number,
  details?: string,
  redirectTo?: string
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    error,
    code,
    ...(details && { details }),
    ...(redirectTo && { redirectTo })
  }
  
  return NextResponse.json(response, { status })
}

/**
 * セッション検証の厳格化
 */
async function validateSession(supabase: ReturnType<typeof createRouteHandlerClient>): Promise<
  | { isValid: true; session: NonNullable<any> }
  | { isValid: false; errorResponse: NextResponse<ApiErrorResponse> }
> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('[AUTH] Session validation error:', sessionError.message)
      
      // セッション期限切れ vs その他のエラーを区別
      const isExpired = sessionError.message?.includes('expired') || sessionError.message?.includes('invalid')
      
      return {
        isValid: false,
        errorResponse: createErrorResponse(
          isExpired ? 'Session expired' : 'Session validation failed',
          isExpired ? 'SESSION_EXPIRED' : 'UNAUTHORIZED',
          401,
          undefined,
          '/login'
        )
      }
    }
    
    if (!session?.user?.id) {
      console.error('[AUTH] No valid session or user found')
      return {
        isValid: false,
        errorResponse: createErrorResponse(
          'Authentication required',
          'UNAUTHORIZED',
          401,
          undefined,
          '/login'
        )
      }
    }

    return { isValid: true, session }
  } catch (error) {
    console.error('[AUTH] Unexpected session validation error:', error)
    return {
      isValid: false,
      errorResponse: createErrorResponse(
        'Authentication service unavailable',
        'INTERNAL_ERROR',
        503
      )
    }
  }
}

export async function POST(request: Request): Promise<NextResponse<ProfileCompleteApiResponse>> {
  const startTime = Date.now()
  
  try {
    // Log incoming request details for debugging
    console.log(`[API] POST /api/profile/complete`)
    console.log(`[API] Headers:`, Object.fromEntries(request.headers.entries()))
    console.log(`[API] Cookie header:`, request.headers.get('cookie')?.substring(0, 100) + '...')

    // 1. リクエストボディの検証
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return createErrorResponse(
        'Invalid JSON in request body',
        'VALIDATION_ERROR',
        400
      )
    }

    const validation = validateInput(body)
    if (!validation.isValid) {
      return createErrorResponse(
        validation.error,
        'VALIDATION_ERROR',
        400
      )
    }

    const input = validation.data

    // 2. Supabaseクライアントの初期化（requestも渡すことで全てのヘッダーが利用可能になる）
    const supabase = createRouteHandlerClient({ cookies })
    console.log(`[API] Supabase client created`)
    
    // 3. セッション検証
    const sessionValidation = await validateSession(supabase)
    if (!sessionValidation.isValid) {
      console.log(`[API] Session validation failed`)
      return sessionValidation.errorResponse
    }

    console.log(`[API] Session validation successful for user: ${sessionValidation.session.user.id}`)

    const { session } = sessionValidation

    // 4. ビジネスロジック: 扶養限度額計算
    let calculatedValue: number
    try {
      calculatedValue = calcAllowance({
        isStudent: input.isStudent,
        projectedIncome: input.annualIncome,
        isDependent: input.isDependent
      })
    } catch (error) {
      console.error('[CALC] Allowance calculation error:', error)
      return createErrorResponse(
        'Failed to calculate allowance',
        'INTERNAL_ERROR',
        500
      )
    }

    // 5. データベース保存
    const profilePayload = {
      user_id: session.user.id,
      is_student: input.isStudent,
      annual_income: input.annualIncome,
      is_over_20h: input.isOver20hContract,
      fuyou_line: calculatedValue * 10000, // Convert from 万円 to 円
      profile_completed: true,
      profile_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: profileData, error: profileError } = await supabase
      .from('user_profile')
      .upsert(profilePayload)
      .select('user_id, is_student, annual_income, is_over_20h, fuyou_line, profile_completed, profile_completed_at, updated_at')
      .single()

    if (profileError) {
      console.error('[DB] Profile upsert error:', profileError.message, 'Code:', profileError.code)
      
      // データベース特有のエラーハンドリング
      const isPermissionError = profileError.message?.includes('permission') || profileError.code === 'PGRST301'
      
      return createErrorResponse(
        'Failed to save profile',
        isPermissionError ? 'UNAUTHORIZED' : 'DATABASE_ERROR',
        isPermissionError ? 403 : 500,
        process.env.NODE_ENV === 'development' ? profileError.message : undefined
      )
    }

    // 6. 成功レスポンス
    const duration = Date.now() - startTime
    console.log(`[API] Profile complete successful for user ${session.user.id} in ${duration}ms`)

    const response: ProfileCompleteResponse = {
      success: true,
      allowance: calculatedValue,
      profile: profileData
    }

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Response-Time': `${duration}ms`
      }
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[API] Unexpected error in profile complete API (${duration}ms):`, error)
    
    return createErrorResponse(
      'Internal server error',
      'INTERNAL_ERROR',
      500,
      process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    )
  }
}