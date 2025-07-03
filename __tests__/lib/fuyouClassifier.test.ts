/**
 * 扶養分類ロジックのユニットテスト
 * 日本の税法に基づく扶養控除の境界値テスト
 */

import { classifyFuyou, calculateRemaining, AnswerMap } from '@/lib/fuyouClassifier'

describe('classifyFuyou - 扶養分類ロジック', () => {
  // テスト用の基本回答データ
  const baseAnswers: AnswerMap = {
    question1: '学生',
    question2: '週20時間未満',
    question3: '500人以下',
    question4: '扶養に入っている',
    question5: '103万円以下に抑えたい'
  }

  describe('103万円の壁 - 所得税扶養控除', () => {
    test('年収100万円（学生）- 103万円扶養に分類', () => {
      const result = classifyFuyou(baseAnswers, true, 1000000)
      
      expect(result).toEqual({
        category: '103万円扶養',
        limit: 1030000,
        reason: '所得税の扶養控除対象',
        risks: ['103万円を超えると所得税が発生'],
        benefits: ['親の扶養控除が適用される']
      })
      expect(result.limit).toBeWithinFuyouLimit(1030000)
    })

    test('年収103万円ちょうど（学生）- 境界値テスト', () => {
      const result = classifyFuyou(baseAnswers, true, 1030000)
      
      expect(result.category).toBe('103万円扶養')
      expect(result.limit).toBe(1030000)
    })

    test('年収104万円（学生）- 103万円超過で次の段階', () => {
      const result = classifyFuyou(baseAnswers, true, 1040000)
      
      expect(result.category).not.toBe('103万円扶養')
      expect(1040000).not.toBeWithinFuyouLimit(1030000)
    })
  })

  describe('106万円の壁 - 社会保険の扶養', () => {
    const socialInsuranceAnswers: AnswerMap = {
      ...baseAnswers,
      question2: '週20時間以上',  // 社会保険適用の条件
      question3: '500人以上',     // 大企業
    }

    test('年収105万円（学生・大企業・週20時間以上）- 106万円社保適用', () => {
      const result = classifyFuyou(socialInsuranceAnswers, true, 1050000)
      
      expect(result.category).toBe('106万円（社保）')
      expect(result.limit).toBe(1060000)
      expect(result.risks).toContain('社会保険の扶養から外れる')
    })

    test('年収106万円ちょうど（境界値）', () => {
      const result = classifyFuyou(socialInsuranceAnswers, true, 1060000)
      
      expect(result.category).toBe('106万円（社保）')
      expect(result.limit).toBe(1060000)
    })

    test('小企業（500人以下）の場合は106万円の壁が適用されない', () => {
      const smallCompanyAnswers = {
        ...socialInsuranceAnswers,
        question3: '500人以下'
      }
      
      const result = classifyFuyou(smallCompanyAnswers, true, 1050000)
      
      expect(result.category).not.toBe('106万円（社保）')
    })
  })

  describe('130万円の壁 - 社会保険の扶養（一般）', () => {
    test('年収125万円（一般ケース）- 130万円社保扶養', () => {
      const generalAnswers: AnswerMap = {
        ...baseAnswers,
        question1: '学生以外',
        question4: '扶養に入っている'
      }
      
      const result = classifyFuyou(generalAnswers, false, 1250000)
      
      expect(result.category).toBe('130万円（社保）')
      expect(result.limit).toBe(1300000)
    })

    test('年収130万円ちょうど（境界値）', () => {
      const result = classifyFuyou(baseAnswers, false, 1300000)
      
      expect(result.category).toBe('130万円（社保）')
      expect(result.limit).toBe(1300000)
    })
  })

  describe('150万円の壁 - 配偶者特別控除', () => {
    test('年収140万円（配偶者）- 150万円配偶者控除', () => {
      const spouseAnswers: AnswerMap = {
        ...baseAnswers,
        question1: '配偶者',
        question4: '配偶者控除を受けている'
      }
      
      const result = classifyFuyou(spouseAnswers, false, 1400000)
      
      expect(result.category).toBe('150万円（配偶者）')
      expect(result.limit).toBe(1500000)
      expect(result.benefits).toContain('配偶者特別控除が適用')
    })
  })

  describe('エラーハンドリング', () => {
    test('不正な年収（負の値）', () => {
      expect(() => {
        classifyFuyou(baseAnswers, true, -1000000)
      }).toThrow('年収は0以上である必要があります')
    })

    test('空の回答データ', () => {
      const emptyAnswers: AnswerMap = {}
      
      expect(() => {
        classifyFuyou(emptyAnswers, true, 1000000)
      }).toThrow('回答データが不完全です')
    })

    test('極端に高い年収（1000万円超）', () => {
      const result = classifyFuyou(baseAnswers, false, 15000000)
      
      expect(result.category).toBe('扶養対象外')
      expect(result.limit).toBe(0)
    })
  })
})

describe('calculateRemaining - 残り収入計算', () => {
  test('103万円限度で現在50万円の場合', () => {
    const result = calculateRemaining(500000, 1030000, 1000)
    
    expect(result).toEqual({
      remainingAmount: 530000,
      remainingHours: 530,
      monthlyLimit: Math.floor(530000 / 12),
      daysUntilLimit: expect.any(Number)
    })
    
    expect(result.remainingAmount).toBeWithinFuyouLimit(1030000)
  })

  test('限度額に近い場合（残り3万円）', () => {
    const result = calculateRemaining(1000000, 1030000, 1500)
    
    expect(result.remainingAmount).toBe(30000)
    expect(result.remainingHours).toBe(20) // 30000 / 1500
    expect(result.monthlyLimit).toBeLessThan(10000)
  })

  test('限度額を超過している場合', () => {
    const result = calculateRemaining(1200000, 1030000, 1000)
    
    expect(result.remainingAmount).toBe(0)
    expect(result.remainingHours).toBe(0)
    expect(result.monthlyLimit).toBe(0)
  })

  test('時給が0の場合のエラーハンドリング', () => {
    expect(() => {
      calculateRemaining(500000, 1030000, 0)
    }).toThrow('時給は0より大きい必要があります')
  })

  test('現在収入が負の値の場合', () => {
    expect(() => {
      calculateRemaining(-100000, 1030000, 1000)
    }).toThrow('現在の収入は0以上である必要があります')
  })
})

describe('境界値テスト - 重要な金額での動作確認', () => {
  const testCases = [
    { amount: 1030000, expected: '103万円扶養' },
    { amount: 1030001, expected: '103万円超過' },
    { amount: 1060000, expected: '106万円（社保）' },
    { amount: 1060001, expected: '106万円超過' },
    { amount: 1300000, expected: '130万円（社保）' },
    { amount: 1300001, expected: '130万円超過' },
  ]

  testCases.forEach(({ amount, expected }) => {
    test(`年収 ${amount.toLocaleString()}円 の場合`, () => {
      const result = classifyFuyou(baseAnswers, true, amount)
      
      if (expected.includes('超過')) {
        expect(result.category).not.toBe(expected.replace('超過', ''))
      } else {
        expect(result.category).toBe(expected)
      }
    })
  })
})

describe('パフォーマンステスト', () => {
  test('大量の計算処理でもレスポンス時間が許容範囲内', () => {
    const startTime = Date.now()
    
    // 1000回の計算を実行
    for (let i = 0; i < 1000; i++) {
      classifyFuyou(baseAnswers, true, 500000 + i * 1000)
    }
    
    const executionTime = Date.now() - startTime
    
    // 1000回の計算が1秒以内に完了することを確認
    expect(executionTime).toBeLessThan(1000)
  })
})