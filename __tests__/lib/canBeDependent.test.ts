import { canBeDependent } from '@/lib/canBeDependent'

describe('canBeDependent util', () => {
  it('学生・20h未満・年収120万 → OK 130万ライン', () => {
    const res = canBeDependent({
      isStudent: true,
      annualIncome: 1_200_000,
      isDependent: true,
      isOver20hContract: false,
    })
    expect(res.ok).toBe(true)
    expect(res.allowance).toBe(130)
  })

  it('20h以上契約 → 扶養不可', () => {
    const res = canBeDependent({
      isStudent: false,
      annualIncome: 900_000,
      isDependent: true,
      isOver20hContract: true,
    })
    expect(res.ok).toBe(false)
    expect(res.reason).toBe('週20h以上の勤務契約')
  })

  it('扶養に入らない選択 → 扶養不可', () => {
    const res = canBeDependent({
      isStudent: true,
      annualIncome: 800_000,
      isDependent: false,
      isOver20hContract: false,
    })
    expect(res.ok).toBe(false)
    expect(res.reason).toBe('扶養に入らない選択')
  })

  it('非学生・20h未満・年収100万 → OK 103万ライン', () => {
    const res = canBeDependent({
      isStudent: false,
      annualIncome: 1_000_000,
      isDependent: true,
      isOver20hContract: false,
    })
    expect(res.ok).toBe(true)
    expect(res.allowance).toBe(103)
  })
})