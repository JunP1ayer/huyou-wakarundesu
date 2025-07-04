/**
 * 月次収入管理システム - 1月〜12月のシンプルな収入追跡
 */

import { createSupabaseClient, UserMonthlyIncome } from '@/lib/supabase'

export interface MonthlyIncomeData {
  month: number
  income_amount: number
  is_estimated: boolean
  input_method: 'manual' | 'bank_api' | 'estimated'
}

export interface YearlyIncomeStats {
  ytd_total: number           // 年初から今月までの合計
  ytd_months: number          // 入力済み月数
  current_month: number       // 現在の月
  projected_annual: number    // 年間予測収入
  remaining_months: number    // 残り月数
  average_monthly: number     // 月平均収入
  fuyou_limit: number        // 扶養限度額（103万円）
  remaining_allowance: number // 残り稼げる金額
  is_over_limit: boolean     // 限度額超過フラグ
}

/**
 * 月名の取得
 */
export function getMonthName(month: number): string {
  const months = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ]
  return months[month - 1] || '不明'
}

/**
 * 現在の年月を取得
 */
export function getCurrentYearMonth(): { year: number; month: number } {
  const now = new Date()
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1
  }
}

/**
 * 指定年の月次収入データを取得
 */
export async function getMonthlyIncomeData(userId: string, year: number): Promise<UserMonthlyIncome[]> {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('user_monthly_income')
    .select('*')
    .eq('user_id', userId)
    .eq('year', year)
    .order('month', { ascending: true })

  if (error) {
    console.error('月次収入データ取得エラー:', error)
    throw new Error('収入データの取得に失敗しました')
  }

  return data || []
}

/**
 * 月次収入データを保存/更新
 */
export async function saveMonthlyIncome(
  userId: string, 
  year: number, 
  month: number, 
  incomeData: Omit<MonthlyIncomeData, 'month'>
): Promise<void> {
  const supabase = createSupabaseClient()

  const record = {
    user_id: userId,
    year,
    month,
    income_amount: incomeData.income_amount,
    is_estimated: incomeData.is_estimated,
    input_method: incomeData.input_method,
    updated_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from('user_monthly_income')
    .upsert(record, {
      onConflict: 'user_id,year,month'
    })

  if (error) {
    console.error('月次収入保存エラー:', error)
    throw new Error('収入データの保存に失敗しました')
  }
}

/**
 * 年間収入統計を計算
 */
export function calculateYearlyStats(
  monthlyData: UserMonthlyIncome[], 
  year: number,
  fuyouLimit: number = 1030000
): YearlyIncomeStats {
  const { month: currentMonth } = getCurrentYearMonth()
  
  // 現在年でない場合は12月まで計算
  const effectiveCurrentMonth = new Date().getFullYear() === year ? currentMonth : 12

  // YTD（年初から現在月まで）の合計
  const ytdData = monthlyData.filter(item => item.month <= effectiveCurrentMonth)
  const ytdTotal = ytdData.reduce((sum, item) => sum + item.income_amount, 0)
  
  // 入力済み月数
  const ytdMonths = ytdData.length
  
  // 月平均収入（入力済みデータのみ）
  const averageMonthly = ytdMonths > 0 ? Math.round(ytdTotal / ytdMonths) : 0
  
  // 年間予測収入（12月まで月平均で予測）
  const projectedAnnual = averageMonthly * 12
  
  // 残り月数
  const remainingMonths = 12 - effectiveCurrentMonth
  
  // 残り稼げる金額
  const remainingAllowance = Math.max(0, fuyouLimit - ytdTotal)
  
  // 限度額超過チェック
  const isOverLimit = ytdTotal > fuyouLimit

  return {
    ytd_total: ytdTotal,
    ytd_months: ytdMonths,
    current_month: effectiveCurrentMonth,
    projected_annual: projectedAnnual,
    remaining_months: remainingMonths,
    average_monthly: averageMonthly,
    fuyou_limit: fuyouLimit,
    remaining_allowance: remainingAllowance,
    is_over_limit: isOverLimit
  }
}

/**
 * 月次収入の予測値を生成
 */
export function generateEstimatedIncome(
  existingData: UserMonthlyIncome[],
  targetMonth: number
): number {
  if (existingData.length === 0) return 0

  // 直近3ヶ月の平均を使用
  const recentData = existingData
    .filter(item => item.month < targetMonth)
    .slice(-3)

  if (recentData.length === 0) return 0

  const average = recentData.reduce((sum, item) => sum + item.income_amount, 0) / recentData.length
  return Math.round(average)
}

/**
 * 扶養限度額アラートの判定
 */
export function checkFuyouAlert(stats: YearlyIncomeStats): {
  level: 'safe' | 'warning' | 'danger'
  message: string
  recommendation: string
} {
  const { ytd_total, projected_annual, fuyou_limit, remaining_allowance } = stats

  if (ytd_total > fuyou_limit) {
    return {
      level: 'danger',
      message: '扶養限度額を超過しています',
      recommendation: '働く時間を調整するか、親御さんに相談することをお勧めします'
    }
  }

  if (projected_annual > fuyou_limit) {
    return {
      level: 'warning',
      message: 'このペースだと年末に扶養限度額を超える可能性があります',
      recommendation: `残り${Math.round(remaining_allowance / 1000)}千円程度に抑えることをお勧めします`
    }
  }

  if (remaining_allowance < 100000) {
    return {
      level: 'warning',
      message: '扶養限度額まで残り僅かです',
      recommendation: `残り${Math.round(remaining_allowance / 1000)}千円程度です。注意して働きましょう`
    }
  }

  return {
    level: 'safe',
    message: '扶養範囲内で安全に働けています',
    recommendation: `残り${Math.round(remaining_allowance / 1000)}千円程度稼ぐことができます`
  }
}

/**
 * 金額をフォーマット（万円表示対応）
 */
export function formatCurrency(amount: number): string {
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

/**
 * 入力方法の表示名を取得
 */
export function getInputMethodLabel(method: string): string {
  const labels = {
    'manual': '手入力',
    'bank_api': '銀行連携',
    'estimated': '予測値'
  }
  return labels[method as keyof typeof labels] || method
}