import { AnswerMap, FuyouClassificationResult } from './questionSchema';

/**
 * 扶養控除の分類を判定する関数
 * ※ 本番運用前に税理士または税務専門家による監修が必要
 * 
 * @param answers ユーザーの回答
 * @param isStudent 学生かどうか
 * @returns 扶養区分と上限額
 */
export function classifyFuyou(
  answers: AnswerMap, 
  isStudent: boolean = true
): FuyouClassificationResult {
  const { estIncome, inParentIns, weeklyHours, month88k } = answers;

  // 103万円の壁（所得税扶養控除）
  if (typeof estIncome === 'number' && estIncome < 1_030_000) {
    return {
      category: '103万円扶養',
      limit: 1_030_000,
      description: '所得税の扶養控除を受けられます。親の税金負担が軽くなります。'
    };
  }

  // 106万円の壁（社会保険の扶養、学生かつ短時間労働者の場合）
  if (
    typeof estIncome === 'number' && 
    estIncome < 1_060_000 && 
    typeof weeklyHours === 'number' && 
    weeklyHours < 20 &&
    isStudent
  ) {
    return {
      category: '106万円（社保）',
      limit: 1_060_000,
      description: '親の社会保険の扶養に入れます。健康保険料を払わずに済みます。'
    };
  }

  // 130万円の壁（社会保険の扶養、月8.8万円未満の場合）
  if (
    typeof estIncome === 'number' && 
    estIncome < 1_300_000 && 
    month88k === false &&
    inParentIns === true
  ) {
    return {
      category: '130万円（社保外）',
      limit: 1_300_000,
      description: '親の社会保険の扶養に入れますが、106万円ルールの適用外です。'
    };
  }

  // 150万円の壁（配偶者特別控除の上限、学生には直接関係ないが参考値）
  if (typeof estIncome === 'number' && estIncome < 1_500_000) {
    return {
      category: '150万円まで',
      limit: 1_500_000,
      description: '扶養から外れますが、大きな税負担の急増はありません。'
    };
  }

  // 扶養外
  return {
    category: '扶養外',
    limit: 0,
    description: '扶養の対象外です。自分で税金と社会保険料を負担する必要があります。'
  };
}

/**
 * 残り稼げる金額を計算
 */
export function calculateRemaining(currentIncome: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.max(0, limit - currentIncome);
}

/**
 * 進捗率を計算（パーセンテージ）
 */
export function calculateProgress(currentIncome: number, limit: number): number {
  if (limit === 0) return 100;
  return Math.min(100, (currentIncome / limit) * 100);
}