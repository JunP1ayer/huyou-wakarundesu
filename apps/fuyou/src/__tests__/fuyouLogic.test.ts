import { describe, it, expect } from 'vitest';
import { judge, formatResult, formatCurrency, formatNumber } from '@/lib/fuyouLogic';
import { FUYO_THRESHOLDS } from '@/lib/constants';
import type { FuyouJudgeParams } from '@/types';

describe('judge関数のテスト', () => {
  describe('学生ルート（19-22歳）', () => {
    it('学生で150万円以下の場合は扶養内', () => {
      const params: FuyouJudgeParams = {
        isStudent19to22: true,
        weeklyHours20: null,
        company51Plus: null,
        annualIncome: 1_400_000,
      };
      expect(judge(params)).toBe('扶養内');
    });

    it('学生で150万円超過の場合は学生150万枠', () => {
      const params: FuyouJudgeParams = {
        isStudent19to22: true,
        weeklyHours20: null,
        company51Plus: null,
        annualIncome: 1_600_000,
      };
      expect(judge(params)).toBe('学生150万枠');
    });

    it('学生で150万円ちょうどの場合は扶養内', () => {
      const params: FuyouJudgeParams = {
        isStudent19to22: true,
        weeklyHours20: null,
        company51Plus: null,
        annualIncome: FUYO_THRESHOLDS.STUDENT_150,
      };
      expect(judge(params)).toBe('扶養内');
    });
  });

  describe('一般パートルート（非学生）', () => {
    it('週20時間未満で130万円以下の場合は扶養内', () => {
      const params: FuyouJudgeParams = {
        isStudent19to22: false,
        weeklyHours20: false,
        company51Plus: null,
        annualIncome: 1_200_000,
      };
      expect(judge(params)).toBe('扶養内');
    });

    it('週20時間未満で130万円超過の場合は130万壁', () => {
      const params: FuyouJudgeParams = {
        isStudent19to22: false,
        weeklyHours20: false,
        company51Plus: null,
        annualIncome: 1_400_000,
      };
      expect(judge(params)).toBe('130万壁');
    });

    it('週20時間以上、従業員51人以上で106万円以下の場合は扶養内', () => {
      const params: FuyouJudgeParams = {
        isStudent19to22: false,
        weeklyHours20: true,
        company51Plus: true,
        annualIncome: 1_000_000,
      };
      expect(judge(params)).toBe('扶養内');
    });

    it('週20時間以上、従業員51人以上で106万円超過の場合は106万壁', () => {
      const params: FuyouJudgeParams = {
        isStudent19to22: false,
        weeklyHours20: true,
        company51Plus: true,
        annualIncome: 1_100_000,
      };
      expect(judge(params)).toBe('106万壁');
    });

    it('週20時間以上、従業員50人以下で130万円以下の場合は扶養内', () => {
      const params: FuyouJudgeParams = {
        isStudent19to22: false,
        weeklyHours20: true,
        company51Plus: false,
        annualIncome: 1_200_000,
      };
      expect(judge(params)).toBe('扶養内');
    });

    it('週20時間以上、従業員50人以下で130万円超過の場合は130万壁', () => {
      const params: FuyouJudgeParams = {
        isStudent19to22: false,
        weeklyHours20: true,
        company51Plus: false,
        annualIncome: 1_400_000,
      };
      expect(judge(params)).toBe('130万壁');
    });
  });

  describe('境界値テスト', () => {
    it('各閾値ちょうどの金額をテスト', () => {
      // 106万円境界
      expect(judge({
        isStudent19to22: false,
        weeklyHours20: true,
        company51Plus: true,
        annualIncome: FUYO_THRESHOLDS.SOCIAL_INSURANCE_106,
      })).toBe('扶養内');

      expect(judge({
        isStudent19to22: false,
        weeklyHours20: true,
        company51Plus: true,
        annualIncome: FUYO_THRESHOLDS.SOCIAL_INSURANCE_106 + 1,
      })).toBe('106万壁');

      // 130万円境界
      expect(judge({
        isStudent19to22: false,
        weeklyHours20: false,
        company51Plus: null,
        annualIncome: FUYO_THRESHOLDS.SOCIAL_INSURANCE_130,
      })).toBe('扶養内');

      expect(judge({
        isStudent19to22: false,
        weeklyHours20: false,
        company51Plus: null,
        annualIncome: FUYO_THRESHOLDS.SOCIAL_INSURANCE_130 + 1,
      })).toBe('130万壁');

      // 150万円境界（学生）
      expect(judge({
        isStudent19to22: true,
        weeklyHours20: null,
        company51Plus: null,
        annualIncome: FUYO_THRESHOLDS.STUDENT_150,
      })).toBe('扶養内');

      expect(judge({
        isStudent19to22: true,
        weeklyHours20: null,
        company51Plus: null,
        annualIncome: FUYO_THRESHOLDS.STUDENT_150 + 1,
      })).toBe('学生150万枠');
    });
  });
});

describe('formatResult関数のテスト', () => {
  it('扶養内の学生の場合、正しい表示データを返す', () => {
    const params: FuyouJudgeParams = {
      isStudent19to22: true,
      weeklyHours20: null,
      company51Plus: null,
      annualIncome: 1_200_000,
    };

    const result = formatResult(params);

    expect(result.result).toBe('扶養内');
    expect(result.currentIncome).toBe(1_200_000);
    expect(result.threshold).toBe(FUYO_THRESHOLDS.STUDENT_150);
    expect(result.remainingAmount).toBe(300_000);
    expect(result.badge.color).toBe('green');
    expect(result.message).toContain('扶養内');
    expect(result.message).toContain('300,000');
  });

  it('106万壁超過の場合、正しい表示データを返す', () => {
    const params: FuyouJudgeParams = {
      isStudent19to22: false,
      weeklyHours20: true,
      company51Plus: true,
      annualIncome: 1_100_000,
    };

    const result = formatResult(params);

    expect(result.result).toBe('106万壁');
    expect(result.currentIncome).toBe(1_100_000);
    expect(result.threshold).toBe(FUYO_THRESHOLDS.SOCIAL_INSURANCE_106);
    expect(result.remainingAmount).toBe(0);
    expect(result.badge.color).toBe('yellow');
    expect(result.message).toContain('106万円壁');
  });

  it('130万壁超過の場合、正しい表示データを返す', () => {
    const params: FuyouJudgeParams = {
      isStudent19to22: false,
      weeklyHours20: false,
      company51Plus: null,
      annualIncome: 1_400_000,
    };

    const result = formatResult(params);

    expect(result.result).toBe('130万壁');
    expect(result.currentIncome).toBe(1_400_000);
    expect(result.threshold).toBe(FUYO_THRESHOLDS.SOCIAL_INSURANCE_130);
    expect(result.remainingAmount).toBe(0);
    expect(result.badge.color).toBe('red');
    expect(result.message).toContain('130万円壁');
  });
});

describe('フォーマット関数のテスト', () => {
  describe('formatCurrency', () => {
    it('日本円形式で通貨をフォーマットする', () => {
      expect(formatCurrency(1_000_000)).toBe('¥1,000,000');
      expect(formatCurrency(106_0000)).toBe('¥1,060,000');
      expect(formatCurrency(0)).toBe('¥0');
    });
  });

  describe('formatNumber', () => {
    it('三桁区切りで数値をフォーマットする', () => {
      expect(formatNumber(1_000_000)).toBe('1,000,000');
      expect(formatNumber(1_500_000)).toBe('1,500,000');
      expect(formatNumber(500)).toBe('500');
    });
  });
});

describe('実際のユースケーステスト', () => {
  it('学生アルバイト: 年120万円で扶養内', () => {
    const params: FuyouJudgeParams = {
      isStudent19to22: true,
      weeklyHours20: null,
      company51Plus: null,
      annualIncome: 1_200_000,
    };

    const result = formatResult(params);
    expect(result.result).toBe('扶養内');
    expect(result.remainingAmount).toBe(300_000);
  });

  it('パートタイマー: 週15時間、年125万円で扶養内', () => {
    const params: FuyouJudgeParams = {
      isStudent19to22: false,
      weeklyHours20: false,
      company51Plus: null,
      annualIncome: 1_250_000,
    };

    const result = formatResult(params);
    expect(result.result).toBe('扶養内');
    expect(result.remainingAmount).toBe(50_000);
  });

  it('正社員パート: 週25時間、大企業、年110万円で106万壁', () => {
    const params: FuyouJudgeParams = {
      isStudent19to22: false,
      weeklyHours20: true,
      company51Plus: true,
      annualIncome: 1_100_000,
    };

    const result = formatResult(params);
    expect(result.result).toBe('106万壁');
    expect(result.remainingAmount).toBe(0);
  });

  it('中小企業パート: 週25時間、従業員30人、年120万円で扶養内', () => {
    const params: FuyouJudgeParams = {
      isStudent19to22: false,
      weeklyHours20: true,
      company51Plus: false,
      annualIncome: 1_200_000,
    };

    const result = formatResult(params);
    expect(result.result).toBe('扶養内');
    expect(result.remainingAmount).toBe(100_000);
  });
});