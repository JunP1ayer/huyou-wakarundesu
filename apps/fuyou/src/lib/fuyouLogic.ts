import { FUYO_THRESHOLDS } from './constants';
import type { FuyouResult, FuyouJudgeParams, FuyouResultDisplay } from '@/types';

/**
 * 扶養区分を判定する決定木ロジック
 * 
 * 決定フロー:
 * 1. 19-22歳の学生か？ -> Yes: 学生150万円枠
 * 2. 週20時間以上働いているか？ -> No: 130万円壁
 * 3. 勤務先の従業員数は51人以上か？ -> Yes: 106万円壁, No: 130万円壁
 */
export function judge(params: FuyouJudgeParams): FuyouResult {
  const { isStudent19to22, weeklyHours20, company51Plus, annualIncome } = params;

  // 学生ルート（19-22歳）
  if (isStudent19to22) {
    return annualIncome <= FUYO_THRESHOLDS.STUDENT_150 ? '扶養内' : '学生150万枠';
  }

  // 一般パートルート
  if (weeklyHours20 === false) {
    // 週20時間未満 -> 130万円壁
    return annualIncome <= FUYO_THRESHOLDS.SOCIAL_INSURANCE_130 ? '扶養内' : '130万壁';
  }

  if (weeklyHours20 === true) {
    // 週20時間以上
    if (company51Plus === true) {
      // 従業員51人以上 -> 106万円壁
      return annualIncome <= FUYO_THRESHOLDS.SOCIAL_INSURANCE_106 ? '扶養内' : '106万壁';
    } else {
      // 従業員50人以下 -> 130万円壁
      return annualIncome <= FUYO_THRESHOLDS.SOCIAL_INSURANCE_130 ? '扶養内' : '130万壁';
    }
  }

  // デフォルト（通常ここには到達しない）
  return '扶養内';
}

/**
 * 判定結果を表示用データに変換
 */
export function formatResult(params: FuyouJudgeParams): FuyouResultDisplay {
  const result = judge(params);
  const { annualIncome, isStudent19to22 } = params;
  
  let threshold: number;
  let message: string;
  let badge: FuyouResultDisplay['badge'];

  switch (result) {
    case '扶養内':
      threshold = isStudent19to22 
        ? FUYO_THRESHOLDS.STUDENT_150 
        : getApplicableThreshold(params);
      message = `現在は扶養内です。あと${formatCurrency(threshold - annualIncome)}稼げます。`;
      badge = { text: '扶養内', color: 'green' };
      break;

    case '学生150万枠':
      threshold = FUYO_THRESHOLDS.STUDENT_150;
      message = `学生150万円枠を超過しています。`;
      badge = { text: '学生150万枠超過', color: 'red' };
      break;

    case '106万壁':
      threshold = FUYO_THRESHOLDS.SOCIAL_INSURANCE_106;
      message = `106万円壁に到達しています。社会保険への加入が必要です。`;
      badge = { text: '106万壁', color: 'yellow' };
      break;

    case '130万壁':
      threshold = FUYO_THRESHOLDS.SOCIAL_INSURANCE_130;
      message = `130万円壁に到達しています。配偶者控除から外れます。`;
      badge = { text: '130万壁', color: 'red' };
      break;

    default:
      threshold = FUYO_THRESHOLDS.SOCIAL_INSURANCE_130;
      message = '判定できませんでした。';
      badge = { text: '不明', color: 'blue' };
  }

  const remainingAmount = Math.max(0, threshold - annualIncome);

  return {
    result,
    currentIncome: annualIncome,
    remainingAmount,
    threshold,
    message,
    badge,
  };
}

/**
 * 適用される閾値を取得
 */
function getApplicableThreshold(params: FuyouJudgeParams): number {
  const { weeklyHours20, company51Plus } = params;

  if (weeklyHours20 === false) {
    return FUYO_THRESHOLDS.SOCIAL_INSURANCE_130;
  }

  if (weeklyHours20 === true && company51Plus === true) {
    return FUYO_THRESHOLDS.SOCIAL_INSURANCE_106;
  }

  return FUYO_THRESHOLDS.SOCIAL_INSURANCE_130;
}

/**
 * 通貨フォーマット（日本円）
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * 数値を三桁区切りでフォーマット
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('ja-JP').format(amount);
}