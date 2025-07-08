/**
 * Property-Based Tests for Dynamic Threshold System
 * Tests boundary conditions with 2000+ random cases
 */

import {
  calculateThresholdStatus,
  FUYOU_THRESHOLDS,
  analyzeThresholdImpact,
  formatCurrencyV2
} from '@/lib/fuyouClassifierV2'
import {
  getActiveThresholds,
  convertToLegacyFormat,
  createThresholdLabelsMap,
  isValidThresholdKey,
  DynamicThreshold,
  ThresholdMap
} from '@/lib/thresholdRepo'

// Mock Supabase for testing
jest.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClientReadOnly: jest.fn(() => null)
}))

jest.mock('@/lib/supabase', () => ({
  createSupabaseClientSafe: jest.fn(() => null)
}))

describe('Dynamic Threshold System - Property-Based Tests', () => {
  // Test data generators
  const generateRandomIncome = () => Math.floor(Math.random() * 3_000_000) // 0-300万円
  const generateRandomThreshold = () => Math.floor(Math.random() * 2_000_000) + 500_000 // 50-250万円
  const generateRandomMonth = () => Math.floor(Math.random() * 12) + 1 // 1-12

  const generateThresholdMap = (): Record<string, number> => ({
    'INCOME_TAX_103': generateRandomThreshold(),
    'SOCIAL_INSURANCE_106': generateRandomThreshold(),
    'SOCIAL_INSURANCE_130': generateRandomThreshold(),
    'SPOUSE_DEDUCTION_150': generateRandomThreshold()
  })

  const generateLabelsMap = (): Record<string, string> => ({
    'INCOME_TAX_103': 'テスト103万円の壁',
    'SOCIAL_INSURANCE_106': 'テスト106万円の壁',
    'SOCIAL_INSURANCE_130': 'テスト130万円の壁',
    'SPOUSE_DEDUCTION_150': 'テスト150万円の壁'
  })

  // Property 1: Threshold calculation should always be consistent
  describe('Property: Threshold Calculation Consistency', () => {
    test('should maintain consistency with 2000 random threshold values', () => {
      const testCases = 2000
      
      for (let i = 0; i < testCases; i++) {
        const income = generateRandomIncome()
        const month = generateRandomMonth()
        const thresholdMap = generateThresholdMap()
        const labelsMap = generateLabelsMap()
        
        Object.keys(FUYOU_THRESHOLDS).forEach(key => {
          const result = calculateThresholdStatus(
            key as keyof typeof FUYOU_THRESHOLDS,
            income,
            month,
            thresholdMap,
            labelsMap
          )
          
          // Property: Remaining should never be negative
          expect(result.remaining).toBeGreaterThanOrEqual(0)
          
          // Property: Percentage should be between 0 and infinity (can exceed 100%)
          expect(result.percentage).toBeGreaterThanOrEqual(0)
          
          // Property: Monthly allowance should never be negative
          expect(result.monthlyAllowance).toBeGreaterThanOrEqual(0)
          
          // Property: If income equals limit, percentage should be 100%
          if (income === result.limit) {
            expect(result.percentage).toBe(100)
            expect(result.remaining).toBe(0)
            expect(result.isOverLimit).toBe(true)
          }
          
          // Property: If income is 0, percentage should be 0%
          if (income === 0) {
            expect(result.percentage).toBe(0)
            expect(result.remaining).toBe(result.limit)
            expect(result.isOverLimit).toBe(false)
          }
        })
      }
    })
  })

  // Property 2: Alert levels should follow logical progression
  describe('Property: Alert Level Logic', () => {
    test('should maintain alert level logic with 1000 random income values', () => {
      const testCases = 1000
      
      for (let i = 0; i < testCases; i++) {
        const income = generateRandomIncome()
        const month = generateRandomMonth()
        const limit = generateRandomThreshold()
        const thresholdMap = { 'INCOME_TAX_103': limit }
        
        const result = calculateThresholdStatus(
          'INCOME_TAX_103',
          income,
          month,
          thresholdMap
        )
        
        const percentage = result.percentage
        
        // Property: Alert levels should correspond to percentage ranges
        if (income >= limit) {
          expect(result.alertLevel).toBe('danger')
          expect(result.isOverLimit).toBe(true)
        } else if (percentage >= 90) {
          expect(result.alertLevel).toBe('danger')
          expect(result.isOverLimit).toBe(false)
        } else if (percentage >= 80) {
          expect(result.alertLevel).toBe('warning')
        } else if (percentage >= 70) {
          expect(result.alertLevel).toBe('info')
        } else {
          expect(result.alertLevel).toBe('safe')
        }
      }
    })
  })

  // Property 3: Conversion functions should be bijective
  describe('Property: Conversion Function Consistency', () => {
    test('should maintain conversion consistency with 500 random threshold maps', () => {
      const testCases = 500
      
      for (let i = 0; i < testCases; i++) {
        const dynamicThresholds: ThresholdMap = {
          'INCOME_TAX_103': {
            key: 'INCOME_TAX_103',
            kind: 'tax',
            yen: generateRandomThreshold(),
            label: 'Test Income Tax 103'
          },
          'SOCIAL_INSURANCE_106': {
            key: 'SOCIAL_INSURANCE_106',
            kind: 'social',
            yen: generateRandomThreshold(),
            label: 'Test Social Insurance 106'
          }
        }
        
        const legacyFormat = convertToLegacyFormat(dynamicThresholds)
        const labelsMap = createThresholdLabelsMap(dynamicThresholds)
        
        // Property: All threshold values should be preserved
        Object.values(dynamicThresholds).forEach(threshold => {
          expect(legacyFormat[threshold.key]).toBe(threshold.yen)
          expect(labelsMap[threshold.key]).toBe(threshold.label)
        })
        
        // Property: No additional keys should be created
        expect(Object.keys(legacyFormat)).toHaveLength(Object.keys(dynamicThresholds).length)
        expect(Object.keys(labelsMap)).toHaveLength(Object.keys(dynamicThresholds).length)
      }
    })
  })

  // Property 4: Impact analysis should be mathematically correct
  describe('Property: Impact Analysis Correctness', () => {
    test('should provide correct impact analysis with 1000 random scenarios', () => {
      const testCases = 1000
      
      for (let i = 0; i < testCases; i++) {
        const currentIncome = generateRandomIncome()
        const oldThreshold = generateRandomThreshold()
        const newThreshold = generateRandomThreshold()
        
        const impact = analyzeThresholdImpact(currentIncome, oldThreshold, newThreshold)
        const expectedDifference = Math.abs(newThreshold - oldThreshold)
        
        // Property: Impact amount should equal absolute difference
        expect(impact.impactAmount).toBe(expectedDifference)
        
        // Property: Impact type should be correct
        if (newThreshold === oldThreshold) {
          expect(impact.impactType).toBe('neutral')
          expect(impact.impactAmount).toBe(0)
        } else if (newThreshold > oldThreshold) {
          expect(impact.impactType).toBe('positive')
        } else {
          expect(impact.impactType).toBe('negative')
        }
        
        // Property: Description should contain relevant information
        expect(impact.impactDescription).toContain(
          newThreshold === oldThreshold ? '変更はありません' : 
          newThreshold > oldThreshold ? '引き上げ' : '引き下げ'
        )
      }
    })
  })

  // Property 5: Boundary conditions should be handled correctly
  describe('Property: Boundary Condition Handling', () => {
    const boundaryTestCases = [
      { income: 0, description: 'zero income' },
      { income: 1, description: 'minimum income' },
      { income: 1029999, description: 'just under 103万' },
      { income: 1030000, description: 'exactly 103万' },
      { income: 1030001, description: 'just over 103万' },
      { income: Number.MAX_SAFE_INTEGER, description: 'maximum safe integer' }
    ]
    
    boundaryTestCases.forEach(({ income, description }) => {
      test(`should handle ${description} correctly`, () => {
        const month = 6 // Mid-year
        const thresholds = Object.keys(FUYOU_THRESHOLDS)
        
        thresholds.forEach(key => {
          const result = calculateThresholdStatus(
            key as keyof typeof FUYOU_THRESHOLDS,
            income,
            month
          )
          
          // Property: All results should be well-defined
          expect(result.threshold).toBe(key)
          expect(typeof result.limit).toBe('number')
          expect(typeof result.currentIncome).toBe('number')
          expect(typeof result.remaining).toBe('number')
          expect(typeof result.percentage).toBe('number')
          expect(['safe', 'info', 'warning', 'danger']).toContain(result.alertLevel)
          expect(typeof result.message).toBe('string')
          expect(typeof result.isOverLimit).toBe('boolean')
          expect(typeof result.monthlyAllowance).toBe('number')
          
          // Property: No NaN or infinity values
          expect(result.remaining).not.toBeNaN()
          expect(result.percentage).not.toBeNaN()
          expect(result.monthlyAllowance).not.toBeNaN()
          expect(Number.isFinite(result.remaining)).toBe(true)
          expect(Number.isFinite(result.monthlyAllowance)).toBe(true)
        })
      })
    })
  })

  // Property 6: Month progression should affect monthly allowance correctly
  describe('Property: Monthly Allowance Calculation', () => {
    test('should calculate monthly allowance correctly across all months', () => {
      const income = 800000 // 80万円
      const limit = 1030000 // 103万円
      const remaining = limit - income // 23万円
      
      for (let month = 1; month <= 12; month++) {
        const result = calculateThresholdStatus(
          'INCOME_TAX_103',
          income,
          month,
          { 'INCOME_TAX_103': limit }
        )
        
        const expectedMonthlyAllowance = remaining / Math.max(1, 12 - month)
        
        // Property: Monthly allowance should decrease as year progresses
        expect(result.monthlyAllowance).toBeCloseTo(expectedMonthlyAllowance, 2)
        
        // Property: December should give all remaining amount
        if (month === 12) {
          expect(result.monthlyAllowance).toBeCloseTo(remaining, 2)
        }
      }
    })
  })

  // Property 7: Format currency should handle all valid inputs
  describe('Property: Currency Formatting', () => {
    test('should format currency correctly for 500 random amounts', () => {
      const testCases = 500
      
      for (let i = 0; i < testCases; i++) {
        const amount = Math.floor(Math.random() * 10_000_000) // 0-1000万円
        const formatted = formatCurrencyV2(amount)
        
        // Property: Should always return a string
        expect(typeof formatted).toBe('string')
        
        // Property: Should contain currency symbol
        expect(formatted).toMatch(/円$/)
        
        // Property: Large amounts should use 万円 notation
        if (amount >= 10000) {
          expect(formatted).toMatch(/万円$/)
        }
        
        // Property: Should not contain invalid characters
        expect(formatted).not.toMatch(/[^0-9.,万円]/g)
      }
    })
  })

  // Property 8: Threshold key validation should be consistent
  describe('Property: Threshold Key Validation', () => {
    const validKeys = ['INCOME_TAX_103', 'SOCIAL_INSURANCE_106', 'SOCIAL_INSURANCE_130', 'SPOUSE_DEDUCTION_150']
    const invalidKeys = ['INVALID_KEY', '', 'RANDOM_STRING', '123', 'income_tax_103']
    
    test('should correctly validate threshold keys', () => {
      // Property: All valid keys should return true
      validKeys.forEach(key => {
        expect(isValidThresholdKey(key)).toBe(true)
      })
      
      // Property: All invalid keys should return false  
      invalidKeys.forEach(key => {
        expect(isValidThresholdKey(key)).toBe(false)
      })
    })
  })
})

// Integration tests for the complete flow
describe('Dynamic Threshold System - Integration Tests', () => {
  test('should handle complete threshold replacement scenario', async () => {
    // Simulate 2025 tax reform: 103万 → 123万
    const newThresholds: ThresholdMap = {
      'INCOME_TAX_123': {
        key: 'INCOME_TAX_123',
        kind: 'tax',
        yen: 1_230_000,
        label: '123万円の壁（所得税扶養控除・改正後）',
        description: '2025年税制改正により103万円から引き上げ'
      },
      'SOCIAL_INSURANCE_130': {
        key: 'SOCIAL_INSURANCE_130',
        kind: 'social',
        yen: 1_300_000,
        label: '130万円の壁（社会保険・統一後）',
        description: '106万円の壁撤廃により130万円に統一'
      }
    }
    
    const legacyFormat = convertToLegacyFormat(newThresholds)
    const labelsMap = createThresholdLabelsMap(newThresholds)
    
    // Test that the new system works with completely different thresholds
    const testIncome = 1_100_000 // 110万円
    const month = 6
    
    // This should work even with non-standard threshold keys
    const result = calculateThresholdStatus(
      'INCOME_TAX_123' as any, // Type assertion for testing
      testIncome,
      month,
      legacyFormat,
      labelsMap
    )
    
    expect(result.limit).toBe(1_230_000)
    expect(result.currentIncome).toBe(testIncome)
    expect(result.percentage).toBeCloseTo((testIncome / 1_230_000) * 100, 2)
    expect(result.alertLevel).toBe('warning') // Should be in warning zone
  })
})

// Performance tests
describe('Dynamic Threshold System - Performance Tests', () => {
  test('should handle large batch calculations efficiently', () => {
    const batchSize = 10000
    const startTime = Date.now()
    
    for (let i = 0; i < batchSize; i++) {
      const income = generateRandomIncome()
      const month = generateRandomMonth()
      
      calculateThresholdStatus('INCOME_TAX_103', income, month)
    }
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    // Should complete 10,000 calculations in under 1 second
    expect(duration).toBeLessThan(1000)
  })
  
  function generateRandomIncome(): number {
    return Math.floor(Math.random() * 3_000_000)
  }
  
  function generateRandomMonth(): number {
    return Math.floor(Math.random() * 12) + 1
  }
})