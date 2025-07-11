import { calcAllowance } from '@/lib/calcAllowance'

interface Args {
  isStudent: boolean
  annualIncome: number     // Moneytree API で取得予定
  isDependent: boolean
  isOver20hContract: boolean
}

export function canBeDependent(a: Args) {
  if (!a.isDependent) return { ok: false, reason: '扶養に入らない選択' }
  if (a.isOver20hContract) return { ok: false, reason: '週20h以上の勤務契約' }
  const allowance = calcAllowance({
    isStudent: a.isStudent,
    projectedIncome: a.annualIncome,
    isDependent: a.isDependent,
  })
  return { ok: true, allowance }
}