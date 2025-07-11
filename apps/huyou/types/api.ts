// API型定義の厳格化

export interface ProfileCompleteRequest {
  isStudent: boolean
  annualIncome: number
  isDependent: boolean
  isOver20hContract: boolean
}

export interface ProfileCompleteResponse {
  success: true
  allowance: number
  profile: {
    user_id: string
    is_student: boolean
    annual_income: number
    is_over_20h: boolean
    fuyou_line: number
    profile_completed: boolean
    profile_completed_at: string
    updated_at: string
  }
}

export interface ApiErrorResponse {
  error: string
  code: 'UNAUTHORIZED' | 'SESSION_EXPIRED' | 'VALIDATION_ERROR' | 'DATABASE_ERROR' | 'INTERNAL_ERROR'
  details?: string
  redirectTo?: string
}

export type ProfileCompleteApiResponse = ProfileCompleteResponse | ApiErrorResponse

// 入力値検証スキーマ
export const VALIDATION_RULES = {
  annualIncome: {
    min: 0,
    max: 50_000_000, // 5000万円上限
  },
  requiredFields: ['isStudent', 'annualIncome', 'isDependent', 'isOver20hContract'] as const
} as const