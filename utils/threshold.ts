export function isOverThreshold(income: number, limit: number = 1030000): boolean {
  return income / limit >= 0.8
}

export function getThresholdPercentage(income: number, limit: number = 1030000): number {
  return Math.round((income / limit) * 100)
}

export function getRemainingUntilThreshold(income: number, limit: number = 1030000): number {
  const threshold = limit * 0.8
  return Math.max(0, threshold - income)
}

export function formatThresholdMessage(income: number, limit: number = 1030000): string {
  const percentage = getThresholdPercentage(income, limit)
  
  if (percentage >= 80) {
    return `年収が扶養限度額の${percentage}%に達しました！注意が必要です。`
  } else if (percentage >= 70) {
    return `年収が扶養限度額の${percentage}%に達しました。もうすぐ80%です。`
  } else {
    const remaining = getRemainingUntilThreshold(income, limit)
    return `あと${remaining.toLocaleString()}円で扶養限度額の80%に達します。`
  }
}

export interface ThresholdStatus {
  isOverThreshold: boolean
  percentage: number
  remaining: number
  message: string
  severity: 'low' | 'medium' | 'high'
}

export function getThresholdStatus(income: number, limit: number = 1030000): ThresholdStatus {
  const percentage = getThresholdPercentage(income, limit)
  const remaining = getRemainingUntilThreshold(income, limit)
  const isOver = isOverThreshold(income, limit)
  
  let severity: 'low' | 'medium' | 'high' = 'low'
  if (percentage >= 80) severity = 'high'
  else if (percentage >= 70) severity = 'medium'
  
  return {
    isOverThreshold: isOver,
    percentage,
    remaining,
    message: formatThresholdMessage(income, limit),
    severity
  }
}