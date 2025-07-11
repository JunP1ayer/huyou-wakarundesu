/**
 * 扶養控除計算のユニットテスト
 * 新しいcalcAllowance実装に基づく境界値テスト
 */

import { calcAllowance, CalcInput } from '@/lib/calcAllowance'
import { classifyFuyou, calculateRemaining } from '@/lib/fuyouClassifier'
import type { AnswerMap } from '@/lib/questionSchema'

// 新しいcalcAllowance実装用のテストデータ
const baseInput: CalcInput = {
  isStudent: true,
  projectedIncome: 1000000,
  isDependent: true
}

describe('calcAllowance - 扶養限度額計算', () => {

  describe('学生の扶養限度額計算', () => {
    test('年収100万円（学生・扶養）- 130万円限度額', () => {
      const input: CalcInput = {
        isStudent: true,
        projectedIncome: 1000000,
        isDependent: true
      }
      const result = calcAllowance(input)
      
      expect(result).toBe(130)
    })

    test('年収130万円（学生・扶養）- 境界値テスト', () => {
      const input: CalcInput = {
        isStudent: true,
        projectedIncome: 1300000,
        isDependent: true
      }
      const result = calcAllowance(input)
      
      expect(result).toBe(130)
    })

    test('年収140万円（学生・扶養）- 130万円超過で150万円限度', () => {
      const input: CalcInput = {
        isStudent: true,
        projectedIncome: 1400000,
        isDependent: true
      }
      const result = calcAllowance(input)
      
      expect(result).toBe(150)
    })
  })

  describe('非学生の扶養限度額計算', () => {
    test('年収100万円（非学生・扶養）- 103万円限度額', () => {
      const input: CalcInput = {
        isStudent: false,
        projectedIncome: 1000000,
        isDependent: true
      }
      const result = calcAllowance(input)
      
      expect(result).toBe(103)
    })

    test('年収103万円（非学生・扶養）- 境界値テスト', () => {
      const input: CalcInput = {
        isStudent: false,
        projectedIncome: 1030000,
        isDependent: true
      }
      const result = calcAllowance(input)
      
      expect(result).toBe(103)
    })

    test('年収110万円（非学生・扶養）- 103万円超過で130万円限度', () => {
      const input: CalcInput = {
        isStudent: false,
        projectedIncome: 1100000,
        isDependent: true
      }
      const result = calcAllowance(input)
      
      expect(result).toBe(130)
    })
  })

  describe('扶養対象外のケース', () => {
    test('扶養に入らない場合は0万円限度額', () => {
      const input: CalcInput = {
        isStudent: true,
        projectedIncome: 1000000,
        isDependent: false  // 扶養に入らない
      }
      const result = calcAllowance(input)
      
      expect(result).toBe(0)
    })

    test('非学生・扶養対象外も0万円限度額', () => {
      const input: CalcInput = {
        isStudent: false,
        projectedIncome: 1000000,
        isDependent: false
      }
      const result = calcAllowance(input)
      
      expect(result).toBe(0)
    })
  })

  describe('学生の高収入ケース', () => {
    test('年収200万円（学生・扶養）- 150万円限度額', () => {
      const input: CalcInput = {
        isStudent: true,
        projectedIncome: 2000000,
        isDependent: true
      }
      const result = calcAllowance(input)
      
      expect(result).toBe(150)
    })
  })

  describe('エラーハンドリング', () => {
    test('不正な年収（負の値）でcalcAllowance', () => {
      const input: CalcInput = {
        isStudent: true,
        projectedIncome: -1000000,
        isDependent: true
      }
      
      // calcAllowanceは現在エラーハンドリングしていないが、0を返す
      const result = calcAllowance(input)
      expect(result).toBe(130) // 学生・扶養の場合は130万円限度
    })

    test('極端に高い年収（1000万円超）でcalcAllowance', () => {
      const input: CalcInput = {
        isStudent: false,
        projectedIncome: 15000000,
        isDependent: true
      }
      
      const result = calcAllowance(input)
      expect(result).toBe(130) // 非学生・103万円超過で130万円限度
    })
  })
})

describe('calculateRemaining - 残り収入計算', () => {
  test('103万円限度で現在50万円の場合', () => {
    const result = calculateRemaining(500000, 1030000)
    
    expect(result).toBe(530000)
  })

  test('限度額に近い場合（残り3万円）', () => {
    const result = calculateRemaining(1000000, 1030000)
    
    expect(result).toBe(30000)
  })

  test('限度額を超過している場合', () => {
    const result = calculateRemaining(1200000, 1030000)
    
    expect(result).toBe(0)
  })

  test('限度額が0の場合', () => {
    const result = calculateRemaining(500000, 0)
    
    expect(result).toBe(0)
  })

  test('現在収入が負の値の場合', () => {
    const result = calculateRemaining(-100000, 1030000)
    
    expect(result).toBe(1130000) // Math.max(0, 1030000 - (-100000))
  })
})

describe('classifyFuyou - 旧システムの境界値テスト', () => {
  const testCases = [
    { amount: 1029999, expected: '103万円扶養' },
    { amount: 1030000, expected: '106万円（社保）' },
    { amount: 1059999, expected: '106万円（社保）' },
    { amount: 1060000, expected: '130万円（社保外）' },
    { amount: 1299999, expected: '130万円（社保外）' },
    { amount: 1300000, expected: '150万円まで' },
  ]

  testCases.forEach(({ amount, expected }) => {
    test(`年収 ${amount.toLocaleString()}円 の場合`, () => {
      const testAnswers = {
        estIncome: amount,
        inParentIns: true,
        isOver20hContract: false,
        month88k: false
      }
      const result = classifyFuyou(testAnswers, true)
      
      expect(result.category).toBe(expected)
    })
  })
})

describe('パフォーマンステスト', () => {
  test('calcAllowance - 大量の計算処理でもレスポンス時間が許容範囲内', () => {
    const startTime = Date.now()
    
    // 1000回の計算を実行
    for (let i = 0; i < 1000; i++) {
      const input: CalcInput = {
        isStudent: i % 2 === 0,
        projectedIncome: 500000 + i * 1000,
        isDependent: true
      }
      calcAllowance(input)
    }
    
    const executionTime = Date.now() - startTime
    
    // 1000回の計算が1秒以内に完了することを確認
    expect(executionTime).toBeLessThan(1000)
  })

  test('classifyFuyou - 大量の計算処理でもレスポンス時間が許容範囲内', () => {
    const startTime = Date.now()
    
    // 1000回の計算を実行
    for (let i = 0; i < 1000; i++) {
      const testAnswers = {
        estIncome: 500000 + i * 1000,
        inParentIns: true,
        isOver20hContract: false,
        month88k: false
      }
      classifyFuyou(testAnswers, true)
    }
    
    const executionTime = Date.now() - startTime
    
    // 1000回の計算が1秒以内に完了することを確認
    expect(executionTime).toBeLessThan(1000)
  })
})