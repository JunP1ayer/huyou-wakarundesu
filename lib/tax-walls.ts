/**
 * Tax walls and threshold logic for 2025 tax reform
 * 扶養わかるんです - 2025年税制改正対応
 */

export const WALLS = {
  resident: 1_100_000,        // 住民税 非課税 2025-
  incomeGeneral: 1_230_000,   // 所得税 一般扶養 2025-
  incomeStudent: 1_500_000,   // 所得税 特定扶養 19-22 歳
  socialInsurance: 1_300_000  // 社保被扶養
} as const;

export type WallType = keyof typeof WALLS;

export interface ThresholdParams {
  dob: Date;
  student: boolean;
  insurance_status: 'parent' | 'self';
  future_self_ins_date?: Date | null;
  eventDate?: Date;
}

export interface ThresholdResult {
  currentWall: number;
  currentWallType: WallType;
  residentWall: number;
  isIndependentMode: boolean;
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dob: Date, referenceDate: Date = new Date()): number {
  const diff = referenceDate.getTime() - dob.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

/**
 * Determine the appropriate tax threshold based on user conditions
 * 
 * Rules:
 * 1. If insurance_status === "self" OR today >= future_self_ins_date → socialInsurance
 * 2. If age 19-22 AND student === true → incomeStudent
 * 3. Otherwise → incomeGeneral
 * 4. Always track residentWall separately
 */
export function decideThreshold({
  dob,
  student,
  insurance_status,
  future_self_ins_date,
  eventDate = new Date()
}: ThresholdParams): ThresholdResult {
  const age = calculateAge(dob, eventDate);
  
  // Check if user is in independent mode (self-insured)
  const isIndependentMode = 
    insurance_status === 'self' || 
    (future_self_ins_date !== null && 
     future_self_ins_date !== undefined && 
     eventDate >= future_self_ins_date);

  let currentWall: number;
  let currentWallType: WallType;

  if (isIndependentMode) {
    // Social insurance threshold applies
    currentWall = WALLS.socialInsurance;
    currentWallType = 'socialInsurance';
  } else if (age >= 19 && age <= 22 && student) {
    // Student threshold for ages 19-22
    currentWall = WALLS.incomeStudent;
    currentWallType = 'incomeStudent';
  } else {
    // General income threshold
    currentWall = WALLS.incomeGeneral;
    currentWallType = 'incomeGeneral';
  }

  return {
    currentWall,
    currentWallType,
    residentWall: WALLS.resident,
    isIndependentMode
  };
}

/**
 * Get threshold display name in Japanese
 */
export function getThresholdDisplayName(wallType: WallType): string {
  const displayNames: Record<WallType, string> = {
    resident: '住民税非課税限度額',
    incomeGeneral: '所得税扶養控除限度額',
    incomeStudent: '特定扶養控除限度額',
    socialInsurance: '社会保険扶養限度額'
  };
  
  return displayNames[wallType];
}

/**
 * Format currency amount in Japanese yen
 */
export function formatYen(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Calculate danger level based on current income vs threshold
 */
export function calculateDangerLevel(currentIncome: number, threshold: number): 'safe' | 'warn' | 'danger' {
  const percentage = (currentIncome / threshold) * 100;
  
  if (percentage >= 100) {
    return 'danger';
  } else if (percentage >= 90) {
    return 'warn';
  } else {
    return 'safe';
  }
}

/**
 * Calculate remaining months in the year
 */
export function getRemainingMonths(date: Date = new Date()): number {
  return 12 - date.getMonth();
}

/**
 * Calculate recommended monthly income to stay within threshold
 */
export function calculateRecommendedMonthlyIncome(
  remainingAllowance: number,
  date: Date = new Date()
): number {
  const remainingMonths = getRemainingMonths(date);
  if (remainingMonths <= 0) return 0;
  
  return Math.floor(remainingAllowance / remainingMonths);
}

/**
 * Get threshold breakdown information
 */
export interface ThresholdBreakdown {
  threshold: number;
  thresholdType: WallType;
  displayName: string;
  currentIncome: number;
  remainingAllowance: number;
  dangerLevel: 'safe' | 'warn' | 'danger';
  percentage: number;
  recommendedMonthlyIncome: number;
  remainingMonths: number;
}

export function getThresholdBreakdown(
  currentIncome: number,
  thresholdResult: ThresholdResult,
  date: Date = new Date()
): ThresholdBreakdown {
  const remainingAllowance = Math.max(0, thresholdResult.currentWall - currentIncome);
  const percentage = Math.min(100, (currentIncome / thresholdResult.currentWall) * 100);
  const remainingMonths = getRemainingMonths(date);
  
  return {
    threshold: thresholdResult.currentWall,
    thresholdType: thresholdResult.currentWallType,
    displayName: getThresholdDisplayName(thresholdResult.currentWallType),
    currentIncome,
    remainingAllowance,
    dangerLevel: calculateDangerLevel(currentIncome, thresholdResult.currentWall),
    percentage,
    recommendedMonthlyIncome: calculateRecommendedMonthlyIncome(remainingAllowance, date),
    remainingMonths
  };
}