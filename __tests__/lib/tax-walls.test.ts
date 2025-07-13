/**
 * @jest-environment jsdom
 */

import { 
  decideThreshold, 
  calculateDangerLevel, 
  calculateRecommendedMonthlyIncome,
  WALLS,
  getThresholdBreakdown
} from '@/lib/tax-walls';

describe('Tax Walls Logic', () => {
  describe('decideThreshold', () => {
    const testDate = new Date('2025-01-15');

    it('should return social insurance threshold for self-insured users', () => {
      const result = decideThreshold({
        dob: new Date('2000-01-01'),
        student: false,
        insurance_status: 'self',
        eventDate: testDate
      });

      expect(result.currentWall).toBe(WALLS.socialInsurance);
      expect(result.currentWallType).toBe('socialInsurance');
      expect(result.isIndependentMode).toBe(true);
    });

    it('should return student threshold for 19-22 year old students', () => {
      const result = decideThreshold({
        dob: new Date('2003-01-01'), // 22 years old
        student: true,
        insurance_status: 'parent',
        eventDate: testDate
      });

      expect(result.currentWall).toBe(WALLS.incomeStudent);
      expect(result.currentWallType).toBe('incomeStudent');
      expect(result.isIndependentMode).toBe(false);
    });

    it('should return general threshold for non-student adults', () => {
      const result = decideThreshold({
        dob: new Date('1995-01-01'), // 30 years old
        student: false,
        insurance_status: 'parent',
        eventDate: testDate
      });

      expect(result.currentWall).toBe(WALLS.incomeGeneral);
      expect(result.currentWallType).toBe('incomeGeneral');
      expect(result.isIndependentMode).toBe(false);
    });

    it('should switch to social insurance threshold when future_self_ins_date is past', () => {
      const pastDate = new Date('2024-12-01');
      
      const result = decideThreshold({
        dob: new Date('2003-01-01'),
        student: true,
        insurance_status: 'parent',
        future_self_ins_date: pastDate,
        eventDate: testDate
      });

      expect(result.currentWall).toBe(WALLS.socialInsurance);
      expect(result.isIndependentMode).toBe(true);
    });

    it('should use student threshold when student is 18 years old (edge case)', () => {
      const result = decideThreshold({
        dob: new Date('2006-06-01'), // 18 years old
        student: true,
        insurance_status: 'parent',
        eventDate: testDate
      });

      // 18 is not in the 19-22 range, so should use general threshold
      expect(result.currentWall).toBe(WALLS.incomeGeneral);
      expect(result.currentWallType).toBe('incomeGeneral');
    });

    it('should use general threshold when student is 23 years old (edge case)', () => {
      const result = decideThreshold({
        dob: new Date('2002-01-01'), // 23 years old
        student: true,
        insurance_status: 'parent',
        eventDate: testDate
      });

      // 23 is not in the 19-22 range, so should use general threshold
      expect(result.currentWall).toBe(WALLS.incomeGeneral);
      expect(result.currentWallType).toBe('incomeGeneral');
    });
  });

  describe('calculateDangerLevel', () => {
    const threshold = 1000000; // 100万円

    it('should return "safe" for income below 90%', () => {
      expect(calculateDangerLevel(800000, threshold)).toBe('safe');
      expect(calculateDangerLevel(890000, threshold)).toBe('safe');
    });

    it('should return "warn" for income between 90-99%', () => {
      expect(calculateDangerLevel(900000, threshold)).toBe('warn');
      expect(calculateDangerLevel(990000, threshold)).toBe('warn');
    });

    it('should return "danger" for income at or above 100%', () => {
      expect(calculateDangerLevel(1000000, threshold)).toBe('danger');
      expect(calculateDangerLevel(1100000, threshold)).toBe('danger');
    });
  });

  describe('calculateRecommendedMonthlyIncome', () => {
    it('should calculate monthly recommendation correctly', () => {
      const remainingAllowance = 600000; // 60万円
      const julyDate = new Date('2025-07-15'); // 6 months remaining
      
      const result = calculateRecommendedMonthlyIncome(remainingAllowance, julyDate);
      expect(result).toBe(120000); // 60万円 ÷ 5ヶ月 = 12万円/月
    });

    it('should return 0 when no months remaining', () => {
      const remainingAllowance = 100000;
      const decemberDate = new Date('2025-12-31');
      
      const result = calculateRecommendedMonthlyIncome(remainingAllowance, decemberDate);
      expect(result).toBe(0);
    });
  });

  describe('getThresholdBreakdown', () => {
    it('should provide complete breakdown information', () => {
      const thresholdResult = {
        currentWall: 1230000,
        currentWallType: 'incomeGeneral' as const,
        residentWall: 1100000,
        isIndependentMode: false
      };
      
      const breakdown = getThresholdBreakdown(800000, thresholdResult, new Date('2025-07-15'));
      
      expect(breakdown.threshold).toBe(1230000);
      expect(breakdown.currentIncome).toBe(800000);
      expect(breakdown.remainingAllowance).toBe(430000);
      expect(breakdown.dangerLevel).toBe('safe');
      expect(breakdown.percentage).toBeCloseTo(65.04, 1);
      expect(breakdown.recommendedMonthlyIncome).toBe(86000); // 43万円 ÷ 5ヶ月
    });

    it('should handle over-threshold income correctly', () => {
      const thresholdResult = {
        currentWall: 1000000,
        currentWallType: 'incomeGeneral' as const,
        residentWall: 1100000,
        isIndependentMode: false
      };
      
      const breakdown = getThresholdBreakdown(1200000, thresholdResult);
      
      expect(breakdown.remainingAllowance).toBe(0); // Should not be negative
      expect(breakdown.dangerLevel).toBe('danger');
      expect(breakdown.percentage).toBe(100); // Capped at 100%
    });
  });
});