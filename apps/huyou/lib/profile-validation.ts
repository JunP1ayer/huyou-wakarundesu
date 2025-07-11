/**
 * プロフィール完了状態の検証とオンボーディング管理
 */

import { UserProfile } from '@/lib/supabase'

// プロフィール完了に必要な必須フィールド
interface RequiredProfileFields {
  birth_year: number
  student_type: string
  support_type: string
  insurance: string
  monthly_income_target: number
}

/**
 * プロフィールが完了しているかチェック
 */
export function isProfileComplete(profile: Partial<UserProfile> | null): boolean {
  if (!profile) return false

  // 必須フィールドがすべて埋まっているかチェック
  const hasBirthYear = Boolean(profile.birth_year && typeof profile.birth_year === 'number' && profile.birth_year > 0)
  const hasStudentType = Boolean(profile.student_type)
  const hasSupportType = Boolean(profile.support_type && profile.support_type !== 'unknown')
  const hasInsurance = Boolean(profile.insurance && profile.insurance !== 'unknown')
  const hasIncomeTarget = Boolean(profile.monthly_income_target && profile.monthly_income_target > 0)
  
  const hasAllRequiredFields = hasBirthYear && hasStudentType && hasSupportType && hasInsurance && hasIncomeTarget

  // 月収目標が0より大きいかチェック (既にhasIncomeTargetで確認済み)
  return hasAllRequiredFields
}

/**
 * 次のオンボーディングステップを決定
 */
export function getNextOnboardingStep(profile: Partial<UserProfile> | null): number {
  if (!profile) return 1

  // Step 1: 基本情報（生年月日、学生種別）
  if (!profile.birth_year || !profile.student_type) {
    return 1
  }

  // Step 2: 扶養状況
  if (!profile.support_type || profile.support_type === 'unknown') {
    return 2
  }

  // Step 3: 健康保険
  if (!profile.insurance || profile.insurance === 'unknown') {
    return 3
  }

  // Step 4: 月収目標
  if (!profile.monthly_income_target || profile.monthly_income_target <= 0) {
    return 4
  }

  // すべて完了
  return 5
}

/**
 * オンボーディングの進捗率を計算
 */
export function getOnboardingProgress(profile: Partial<UserProfile> | null): number {
  const currentStep = getNextOnboardingStep(profile)
  const totalSteps = 4
  
  if (currentStep > totalSteps) return 100
  
  return Math.round(((currentStep - 1) / totalSteps) * 100)
}

/**
 * プロフィール完了に不足している項目を取得
 */
export function getMissingProfileFields(profile: Partial<UserProfile> | null): {
  field: keyof RequiredProfileFields
  label: string
  description: string
}[] {
  const missing: {
    field: keyof RequiredProfileFields
    label: string
    description: string
  }[] = []

  if (!profile) {
    return [
      { field: 'birth_year', label: '生年月日', description: '年齢確認のため' },
      { field: 'student_type', label: '学生種別', description: '適切な扶養判定のため' },
      { field: 'support_type', label: '扶養状況', description: '税務処理の決定のため' },
      { field: 'insurance', label: '健康保険', description: '社会保険料の計算のため' },
      { field: 'monthly_income_target', label: '月収目標', description: 'アラート設定のため' }
    ]
  }

  if (!profile.birth_year) {
    missing.push({
      field: 'birth_year',
      label: '生年月日',
      description: '年齢に応じた適切な扶養判定を行うため'
    })
  }

  if (!profile.student_type) {
    missing.push({
      field: 'student_type',
      label: '学生種別',
      description: '学生特有の控除や制度を適用するため'
    })
  }

  if (!profile.support_type || profile.support_type === 'unknown') {
    missing.push({
      field: 'support_type',
      label: '扶養状況',
      description: '親の扶養に入っているかどうかで税金計算が変わるため'
    })
  }

  if (!profile.insurance || profile.insurance === 'unknown') {
    missing.push({
      field: 'insurance',
      label: '健康保険',
      description: '社会保険料の計算に必要なため'
    })
  }

  if (!profile.monthly_income_target || profile.monthly_income_target <= 0) {
    missing.push({
      field: 'monthly_income_target',
      label: '月収目標',
      description: '扶養を外れないよう適切なタイミングでアラートを出すため'
    })
  }

  return missing
}

/**
 * 年齢を計算
 */
export function calculateAge(birthYear: number): number {
  const currentYear = new Date().getFullYear()
  return currentYear - birthYear
}

/**
 * 学生種別の表示名を取得
 */
export function getStudentTypeLabel(studentType: string): string {
  const labels = {
    'university': '大学生',
    'vocational': '専門学生',
    'high_school': '高校生',
    'graduate': '大学院生',
    'other': 'その他'
  }
  return labels[studentType as keyof typeof labels] || studentType
}

/**
 * 扶養状況の表示名を取得
 */
export function getSupportTypeLabel(supportType: string): string {
  const labels = {
    'full': '完全扶養（親の扶養に入っている）',
    'partial': '一部扶養（親の扶養には入っているが、自分でも税金を払っている）',
    'none': '独立（親の扶養に入っていない）',
    'unknown': '不明'
  }
  return labels[supportType as keyof typeof labels] || supportType
}

/**
 * 健康保険の表示名を取得
 */
export function getInsuranceLabel(insurance: string): string {
  const labels = {
    'national': '国民健康保険（自分で加入）',
    'employee': '健康保険（自分の勤務先）',
    'none': '親の健康保険（扶養として加入）',
    'unknown': '不明'
  }
  return labels[insurance as keyof typeof labels] || insurance
}