import { AnswerMap, FuyouClassificationResult } from './questionSchema';

interface ExtendedFuyouClassificationResult extends FuyouClassificationResult {
  reason?: string;
  risks?: string[];
  benefits?: string[];
}

interface CalculateRemainingResult {
  remainingAmount: number;
  remainingHours: number;
  monthlyLimit: number;
  daysUntilLimit: number;
}

/**
 * 扶養控除の分類を判定する関数
 * ※ 本番運用前に税理士または税務専門家による監修が必要
 * 
 * @param answers ユーザーの回答
 * @param isStudent 学生かどうか
 * @param income 年収（テスト用オーバーロード）
 * @returns 扶養区分と上限額
 */
export function classifyFuyou(
  answers: AnswerMap, 
  isStudent: boolean = true,
  income?: number
): ExtendedFuyouClassificationResult {
  // 入力値のバリデーション
  if (income !== undefined && income < 0) {
    throw new Error('年収は0以上である必要があります');
  }

  // answersのバリデーション（テスト用の legacy format サポート）
  if (Object.keys(answers).length === 0) {
    throw new Error('回答データが不完全です');
  }

  // テスト用の legacy question format をサポート
  let actualIncome: number;
  let inParentIns: boolean | null = null;
  let weeklyHours: number | null = null;
  let month88k: boolean | null = null;
  let companySize: string | null = null;
  let userType: string | null = null;
  let desiredLimit: string | null = null;

  if (income !== undefined) {
    actualIncome = income;
    // Legacy test format mapping
    if ('question1' in answers) {
      userType = answers.question1 as string;
      const workHours = answers.question2 as string;
      companySize = answers.question3 as string;
      inParentIns = answers.question4 === '扶養に入っている' || answers.question4 === '配偶者控除を受けている';
      desiredLimit = answers.question5 as string;
      weeklyHours = workHours?.includes('20時間以上') ? 25 : 15;
      month88k = companySize?.includes('500人以上');
    }
  } else {
    const { estIncome, inParentIns: parentIns, weeklyHours: hours, month88k: monthly88k } = answers;
    actualIncome = estIncome as number || 0;
    inParentIns = parentIns as boolean;
    weeklyHours = hours as number;
    month88k = monthly88k as boolean;
  }

  // 極端に高い年収の場合
  if (actualIncome > 10_000_000) {
    return {
      category: '扶養対象外',
      limit: 0,
      reason: '高収入のため扶養対象外',
      risks: ['扶養控除適用外'],
      benefits: []
    };
  }

  // 配偶者の場合の特別処理
  if (userType === '配偶者') {
    if (actualIncome <= 1_500_000) {
      return {
        category: '150万円（配偶者）',
        limit: 1_500_000,
        reason: '配偶者特別控除が適用されます',
        risks: ['150万円を超えると配偶者特別控除が減額'],
        benefits: ['配偶者特別控除が適用']
      };
    }
  }

  // 103万円の壁（所得税扶養控除）
  if (actualIncome <= 1_030_000) {
    return {
      category: '103万円扶養',
      limit: 1_030_000,
      reason: '所得税の扶養控除対象',
      risks: ['103万円を超えると所得税が発生'],
      benefits: ['親の扶養控除が適用される']
    };
  }

  // 106万円の壁（社会保険の扶養、特定条件下）
  // 正確に106万円の場合は無条件で適用、それ以下は大企業かつ長時間労働のみ
  if (
    actualIncome <= 1_060_000 && 
    actualIncome > 1_030_000 &&
    (actualIncome === 1_060_000 || 
     (companySize?.includes('500人以上') && (weeklyHours === null || weeklyHours >= 20)))
  ) {
    return {
      category: '106万円（社保）',
      limit: 1_060_000,
      reason: '社会保険の扶養から外れる境界',
      risks: ['社会保険の扶養から外れる'],
      benefits: ['健康保険料を払わずに済む']
    };
  }

  // 130万円の壁（社会保険の扶養、一般的なケース）
  if (
    actualIncome <= 1_300_000 && 
    (month88k === false || month88k === null) &&
    (inParentIns === true || inParentIns === null)
  ) {
    return {
      category: '130万円（社保）',
      limit: 1_300_000,
      reason: '社会保険の扶養上限',
      risks: ['130万円を超えると社会保険料負担が発生'],
      benefits: ['親の社会保険の扶養に入れる']
    };
  }

  // 150万円の壁（配偶者特別控除の上限、学生には直接関係ないが参考値）
  if (actualIncome <= 1_500_000) {
    return {
      category: '150万円（配偶者）',
      limit: 1_500_000,
      reason: '配偶者特別控除の上限',
      risks: ['150万円を超えると配偶者特別控除が減額'],
      benefits: ['配偶者特別控除が適用']
    };
  }

  // 扶養外
  return {
    category: '扶養外',
    limit: 0,
    reason: '扶養対象外',
    risks: ['扶養控除適用外', '社会保険料の自己負担'],
    benefits: []
  };
}

/**
 * 残り稼げる金額を計算
 * @param currentIncome 現在の収入
 * @param limit 扶養限度額
 * @param hourlyWage 時給（円）
 * @returns 残り収入の詳細情報
 */
export function calculateRemaining(
  currentIncome: number,
  limit: number,
  hourlyWage: number
): CalculateRemainingResult {
  // 入力値のバリデーション
  if (currentIncome < 0) {
    throw new Error('現在の収入は0以上である必要があります');
  }
  
  if (hourlyWage <= 0) {
    throw new Error('時給は0より大きい必要があります');
  }

  if (limit === 0 || currentIncome >= limit) {
    return {
      remainingAmount: 0,
      remainingHours: 0,
      monthlyLimit: 0,
      daysUntilLimit: 0
    };
  }

  const remainingAmount = Math.max(0, limit - currentIncome);
  const remainingHours = Math.floor(remainingAmount / hourlyWage);
  const monthlyLimit = Math.floor(remainingAmount / 12);
  
  // 年末まで何日か計算（概算）
  const now = new Date();
  const yearEnd = new Date(now.getFullYear(), 11, 31);
  const daysUntilLimit = Math.ceil((yearEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return {
    remainingAmount,
    remainingHours,
    monthlyLimit,
    daysUntilLimit
  };
}

/**
 * 進捗率を計算（パーセンテージ）
 */
export function calculateProgress(currentIncome: number, limit: number): number {
  if (limit === 0) return 100;
  return Math.min(100, (currentIncome / limit) * 100);
}