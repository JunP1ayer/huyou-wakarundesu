// 扶養控除の閾値
export const FUYO_THRESHOLDS = {
  STUDENT_150: 1_500_000, // 学生150万円枠
  SOCIAL_INSURANCE_106: 1_060_000, // 社会保険106万円壁
  SOCIAL_INSURANCE_130: 1_300_000, // 社会保険130万円壁
  INCOME_TAX_103: 1_030_000, // 所得税103万円壁
  RESIDENT_TAX_100: 1_000_000, // 住民税100万円非課税
} as const;

// 従業員数閾値
export const EMPLOYEE_COUNT_THRESHOLD = 51;

// 週労働時間閾値
export const WEEKLY_HOURS_THRESHOLD = 20;

// 年齢閾値（学生判定用）
export const STUDENT_AGE_RANGE = {
  MIN: 19,
  MAX: 22,
} as const;