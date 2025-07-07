/**
 * 扶養控除分類システム v2.1 - Dynamic Thresholds Support
 * - 複数閾値対応（103万, 106万, 130万, 150万）
 * - 月次/年次両対応
 * - 社会保険と税制の区別
 * - スマートアラート機能
 * - 動的閾値ロード（2025年税制改正対応）
 */

import { UserProfile, UserMonthlyIncome } from '@/lib/supabase'
import { ThresholdMap, DynamicThreshold, getActiveThresholds, createThresholdLabelsMap, convertToLegacyFormat } from '@/lib/thresholdRepo'

// Legacy threshold definitions (fallback/default)
export const FUYOU_THRESHOLDS = {
  // 所得税関連
  INCOME_TAX_103: 1_030_000,      // 103万円の壁（所得税扶養控除）
  SPOUSE_DEDUCTION_150: 1_500_000, // 150万円の壁（配偶者特別控除上限）
  
  // 社会保険関連  
  SOCIAL_INSURANCE_106: 1_060_000, // 106万円の壁（大企業の社会保険）
  SOCIAL_INSURANCE_130: 1_300_000, // 130万円の壁（一般的な社会保険）
} as const

export type ThresholdKey = keyof typeof FUYOU_THRESHOLDS

// アラートレベル
export type AlertLevel = 'safe' | 'info' | 'warning' | 'danger'

// 個別閾値の状況
export interface ThresholdStatus {
  threshold: ThresholdKey
  limit: number
  currentIncome: number
  remaining: number
  percentage: number
  alertLevel: AlertLevel
  message: string
  isOverLimit: boolean
  monthlyAllowance: number // 月割りでの残り許容額
}

// 全体的な扶養状況
export interface FuyouStatusV2 {
  // 基本情報
  totalIncome: number
  currentMonth: number
  
  // 各閾値の状況
  thresholds: Record<ThresholdKey, ThresholdStatus>
  
  // 最も重要な閾値（最初に到達する可能性が高いもの）
  primaryThreshold: ThresholdKey
  
  // 月次進捗
  monthlyData: MonthlyProgress[]
  
  // 総合評価
  overallAlert: AlertLevel
  recommendations: string[]
}

// 月次進捗データ
export interface MonthlyProgress {
  month: number
  income: number
  cumulativeIncome: number
  isEstimated: boolean
  inputMethod: 'manual' | 'bank_api' | 'estimated'
}

/**
 * ユーザープロファイルに基づく適用可能な閾値を取得
 */
export function getApplicableThresholds(profile: UserProfile): ThresholdKey[] {
  const thresholds: ThresholdKey[] = []
  
  // 所得税扶養控除（103万円）- 全員に適用
  thresholds.push('INCOME_TAX_103')
  
  // 社会保険関連
  if (profile.insurance === 'employee' && profile.company_large) {
    // 大企業勤務の場合は106万円の壁
    thresholds.push('SOCIAL_INSURANCE_106')
  } else if (profile.insurance === 'employee' || profile.support_type === 'partial') {
    // 一般的な社会保険の扶養の場合は130万円の壁
    thresholds.push('SOCIAL_INSURANCE_130')
  }
  
  // 配偶者控除（150万円）- 学生以外で該当する場合
  if (!profile.is_student && profile.support_type !== 'none') {
    thresholds.push('SPOUSE_DEDUCTION_150')
  }
  
  return thresholds
}

/**
 * 月次データから年間収入統計を計算
 */
export function calculateAnnualStats(monthlyData: UserMonthlyIncome[]): {
  totalIncome: number
  monthlyAverage: number
  projectedAnnual: number
  currentMonth: number
} {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  
  const totalIncome = monthlyData.reduce((sum, month) => sum + month.income_amount, 0)
  const monthlyAverage = monthlyData.length > 0 ? totalIncome / monthlyData.length : 0
  const projectedAnnual = monthlyAverage * 12
  
  return {
    totalIncome,
    monthlyAverage,
    projectedAnnual,
    currentMonth
  }
}

/**
 * 個別閾値の状況を計算 (v2.1 - Dynamic Thresholds Support)
 */
export function calculateThresholdStatus(
  thresholdKey: ThresholdKey,
  currentIncome: number,
  currentMonth: number,
  thresholdMap?: Record<string, number>,
  labelsMap?: Record<string, string>
): ThresholdStatus {
  // Use dynamic threshold if provided, otherwise fallback to legacy
  const limit = thresholdMap?.[thresholdKey] ?? FUYOU_THRESHOLDS[thresholdKey]
  const remaining = Math.max(0, limit - currentIncome)
  const percentage = Math.min(100, (currentIncome / limit) * 100)
  const monthlyAllowance = Math.max(0, remaining / Math.max(1, 12 - currentMonth))
  
  // Use dynamic label if provided, otherwise fallback to legacy
  const thresholdName = labelsMap?.[thresholdKey] ?? getThresholdName(thresholdKey)
  
  // アラートレベルの判定
  let alertLevel: AlertLevel = 'safe'
  let message = ''
  
  if (currentIncome >= limit) {
    alertLevel = 'danger'
    message = `${thresholdName}を超過しています`
  } else if (percentage >= 90) {
    alertLevel = 'danger'
    message = `${thresholdName}まであと${Math.round(remaining / 1000)}千円です`
  } else if (percentage >= 80) {
    alertLevel = 'warning'
    message = `${thresholdName}の${Math.round(percentage)}%に達しました`
  } else if (percentage >= 70) {
    alertLevel = 'info'
    message = `${thresholdName}の${Math.round(percentage)}%です`
  } else {
    alertLevel = 'safe'
    message = `${thresholdName}まで余裕があります`
  }
  
  return {
    threshold: thresholdKey,
    limit,
    currentIncome,
    remaining,
    percentage,
    alertLevel,
    message,
    isOverLimit: currentIncome >= limit,
    monthlyAllowance
  }
}

/**
 * 閾値の日本語名を取得
 */
export function getThresholdName(thresholdKey: ThresholdKey): string {
  const names = {
    INCOME_TAX_103: '103万円の壁（所得税扶養控除）',
    SOCIAL_INSURANCE_106: '106万円の壁（社会保険）',
    SOCIAL_INSURANCE_130: '130万円の壁（社会保険）',
    SPOUSE_DEDUCTION_150: '150万円の壁（配偶者特別控除）'
  }
  return names[thresholdKey]
}

/**
 * 月次進捗データを生成
 */
export function generateMonthlyProgress(monthlyData: UserMonthlyIncome[]): MonthlyProgress[] {
  let cumulativeIncome = 0
  
  return monthlyData.map(month => {
    cumulativeIncome += month.income_amount
    return {
      month: month.month,
      income: month.income_amount,
      cumulativeIncome,
      isEstimated: month.is_estimated,
      inputMethod: month.input_method
    }
  })
}

/**
 * メイン関数：扶養状況v2を計算 (v2.1 - Dynamic Thresholds Support)
 */
export function calculateFuyouStatusV2(
  profile: UserProfile,
  monthlyData: UserMonthlyIncome[],
  dynamicThresholds?: ThresholdMap
): FuyouStatusV2 {
  const annualStats = calculateAnnualStats(monthlyData)
  const applicableThresholds = getApplicableThresholds(profile)
  const monthlyProgress = generateMonthlyProgress(monthlyData)
  
  // Convert dynamic thresholds to legacy format if provided
  const thresholdMap = dynamicThresholds ? convertToLegacyFormat(dynamicThresholds) : undefined
  const labelsMap = dynamicThresholds ? createThresholdLabelsMap(dynamicThresholds) : undefined
  
  // 各閾値の状況を計算
  const thresholds: Record<ThresholdKey, ThresholdStatus> = {} as any
  applicableThresholds.forEach(thresholdKey => {
    thresholds[thresholdKey] = calculateThresholdStatus(
      thresholdKey,
      annualStats.totalIncome,
      annualStats.currentMonth,
      thresholdMap,
      labelsMap
    )
  })
  
  // 最も重要な閾値を決定（最初に到達する可能性が高いもの）
  const primaryThreshold = applicableThresholds.reduce((primary, current) => {
    if (!primary) return current
    const primaryStatus = thresholds[primary]
    const currentStatus = thresholds[current]
    
    // より危険度の高い閾値を優先
    if (currentStatus.alertLevel === 'danger' && primaryStatus.alertLevel !== 'danger') {
      return current
    }
    if (currentStatus.percentage > primaryStatus.percentage) {
      return current
    }
    return primary
  })
  
  // 総合アラートレベルを決定
  const overallAlert = applicableThresholds.reduce((maxAlert, thresholdKey) => {
    const status = thresholds[thresholdKey]
    const alertPriority = { safe: 0, info: 1, warning: 2, danger: 3 }
    const currentPriority = alertPriority[status.alertLevel]
    const maxPriority = alertPriority[maxAlert]
    return currentPriority > maxPriority ? status.alertLevel : maxAlert
  }, 'safe' as AlertLevel)
  
  // 推奨事項を生成
  const recommendations = generateRecommendations(thresholds, annualStats, thresholdMap)
  
  return {
    totalIncome: annualStats.totalIncome,
    currentMonth: annualStats.currentMonth,
    thresholds,
    primaryThreshold,
    monthlyData: monthlyProgress,
    overallAlert,
    recommendations
  }
}

/**
 * 推奨事項を生成 (v2.1 - Dynamic Thresholds Support)
 */
function generateRecommendations(
  thresholds: Record<ThresholdKey, ThresholdStatus>,
  annualStats: { projectedAnnual: number; monthlyAverage: number },
  thresholdMap?: Record<string, number>
): string[] {
  const recommendations: string[] = []
  
  // 各閾値について推奨事項をチェック
  Object.values(thresholds).forEach(status => {
    if (status.isOverLimit) {
      recommendations.push(`${status.message}のため、労働時間の調整を検討してください`)
    } else if (status.alertLevel === 'warning') {
      recommendations.push(`${status.message}。月${Math.round(status.monthlyAllowance / 1000)}千円以下に抑えることをお勧めします`)
    }
  })
  
  // 年間予測に基づく推奨事項（最低閾値を動的に取得）
  const baseThreshold = thresholdMap?.['INCOME_TAX_103'] ?? FUYOU_THRESHOLDS.INCOME_TAX_103
  if (annualStats.projectedAnnual > baseThreshold) {
    const reduction = annualStats.projectedAnnual - baseThreshold
    recommendations.push(`現在のペースだと年間で${Math.round(reduction / 10000)}万円超過する予測です。月収を${Math.round(reduction / 12 / 1000)}千円減らすことを検討してください`)
  }
  
  if (recommendations.length === 0) {
    recommendations.push('現在のペースなら扶養範囲内で安全に働けています')
  }
  
  return recommendations
}

/**
 * 金額フォーマット（万円表示対応）
 */
export function formatCurrencyV2(amount: number): string {
  if (amount >= 10000) {
    const manAmount = amount / 10000
    if (manAmount % 1 === 0) {
      return `${manAmount}万円`
    } else {
      return `${manAmount.toFixed(1)}万円`
    }
  }
  return `${amount.toLocaleString()}円`
}

// =====================================
// v2.1 Dynamic Thresholds API
// =====================================

/**
 * 動的閾値を使用した扶養状況計算（新API）
 * 自動的にSupabaseから最新の閾値を取得
 */
export async function calculateFuyouStatusV2WithDynamicThresholds(
  profile: UserProfile,
  monthlyData: UserMonthlyIncome[],
  year?: number
): Promise<FuyouStatusV2> {
  const dynamicThresholds = await getActiveThresholds(year)
  return calculateFuyouStatusV2(profile, monthlyData, dynamicThresholds)
}

/**
 * 閾値システムのヘルスチェック
 */
export async function getThresholdSystemStatus(): Promise<{
  isHealthy: boolean
  source: 'database' | 'fallback' | 'env_fallback'
  thresholdCount: number
  availableThresholds: string[]
}> {
  try {
    const dynamicThresholds = await getActiveThresholds()
    const thresholdKeys = Object.keys(dynamicThresholds)
    
    // Check if we got dynamic data or fallback
    const isDynamic = thresholdKeys.some(key => 
      dynamicThresholds[key].yen !== FUYOU_THRESHOLDS[key as ThresholdKey]
    )
    
    return {
      isHealthy: true,
      source: isDynamic ? 'database' : 'fallback',
      thresholdCount: thresholdKeys.length,
      availableThresholds: thresholdKeys
    }
  } catch (error) {
    console.error('Threshold system health check failed:', error)
    return {
      isHealthy: false,
      source: 'fallback',
      thresholdCount: Object.keys(FUYOU_THRESHOLDS).length,
      availableThresholds: Object.keys(FUYOU_THRESHOLDS)
    }
  }
}

/**
 * 特定年度の閾値プレビュー（管理機能）
 */
export async function previewThresholdsForYear(year: number): Promise<{
  currentThresholds: ThresholdMap
  changesFromPrevious: Array<{
    key: string
    previousYen: number
    newYen: number
    difference: number
    label: string
  }>
}> {
  const currentYear = new Date().getFullYear()
  const currentThresholds = await getActiveThresholds(year)
  const previousThresholds = year > currentYear ? 
    await getActiveThresholds(currentYear) : 
    await getActiveThresholds(year - 1)
  
  const changesFromPrevious = Object.values(currentThresholds)
    .map(threshold => {
      const previous = previousThresholds[threshold.key]
      if (!previous) return null
      
      return {
        key: threshold.key,
        previousYen: previous.yen,
        newYen: threshold.yen,
        difference: threshold.yen - previous.yen,
        label: threshold.label
      }
    })
    .filter(change => change !== null && change.difference !== 0) as any[]
  
  return {
    currentThresholds,
    changesFromPrevious
  }
}

/**
 * 閾値変更インパクト分析
 */
export function analyzeThresholdImpact(
  currentIncome: number,
  oldThreshold: number,
  newThreshold: number
): {
  impactType: 'positive' | 'negative' | 'neutral'
  impactAmount: number
  impactDescription: string
} {
  const difference = newThreshold - oldThreshold
  
  if (difference === 0) {
    return {
      impactType: 'neutral',
      impactAmount: 0,
      impactDescription: '閾値に変更はありません'
    }
  }
  
  const impactAmount = Math.abs(difference)
  const isPositive = difference > 0
  
  // Current income status analysis
  const wasOverLimit = currentIncome > oldThreshold
  const willBeOverLimit = currentIncome > newThreshold
  
  if (isPositive) {
    if (wasOverLimit && !willBeOverLimit) {
      return {
        impactType: 'positive',
        impactAmount,
        impactDescription: `閾値が${formatCurrencyV2(impactAmount)}引き上げられ、扶養範囲内に戻ります`
      }
    } else {
      return {
        impactType: 'positive',
        impactAmount,
        impactDescription: `閾値が${formatCurrencyV2(impactAmount)}引き上げられ、より多く稼げます`
      }
    }
  } else {
    if (!wasOverLimit && willBeOverLimit) {
      return {
        impactType: 'negative',
        impactAmount,
        impactDescription: `閾値が${formatCurrencyV2(impactAmount)}引き下げられ、扶養を超過します`
      }
    } else {
      return {
        impactType: 'negative',
        impactAmount,
        impactDescription: `閾値が${formatCurrencyV2(impactAmount)}引き下げられます`
      }
    }
  }
}