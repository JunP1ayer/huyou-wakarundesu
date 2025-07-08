export interface CalcInput {
  isStudent: boolean
  projectedIncome: number        // 年収見込み（円）
  isDependent: boolean           // 親の扶養に入る予定か
}

/**
 * 学生／非学生と収入見込みから扶養限度額を返す  
 * 103, 130, 150（万円）のいずれか
 */
export function calcAllowance({ isStudent, projectedIncome, isDependent }: CalcInput): number {
  if (!isDependent) return 0      // そもそも扶養に入らない
  if (isStudent) {
    if (projectedIncome <= 1_300_000) return 130
    return 150
  }
  return projectedIncome <= 1_030_000 ? 103 : 130
}