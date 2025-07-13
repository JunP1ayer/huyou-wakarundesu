/**
 * Deposit classification logic
 * Fuzzy matching with jobs and period analysis
 */

import { createClient } from '@/lib/supabase/client';

interface Job {
  id: string;
  company_name: string;
  hourly_wage?: number;
  monthly_salary?: number;
  is_primary: boolean;
}

interface ClassificationInput {
  amount: number;
  description: string;
  transactionDate: Date;
  jobs: Job[];
  userId: string;
}

interface ClassificationResult {
  type: 'salary' | 'other' | 'needs_review';
  jobId?: string;
  confidence: number;
  isTaxable: boolean;
  reason: string;
}

/**
 * Calculate Levenshtein distance for fuzzy string matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + substitutionCost
      );
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity score between two strings (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - distance / maxLength;
}

/**
 * Check if description contains company name
 */
function fuzzyMatchCompany(description: string, companyName: string): number {
  const descriptionLower = description.toLowerCase();
  const companyLower = companyName.toLowerCase();
  
  // Direct substring match
  if (descriptionLower.includes(companyLower)) {
    return 0.9;
  }
  
  // Remove common company suffixes for better matching
  const cleanCompany = companyLower
    .replace(/株式会社|有限会社|合同会社|合名会社|合資会社/g, '')
    .replace(/\s+/g, '');
    
  if (descriptionLower.includes(cleanCompany)) {
    return 0.8;
  }
  
  // Fuzzy string similarity
  return calculateSimilarity(descriptionLower, companyLower);
}

/**
 * Analyze historical deposits to determine if this looks like salary
 */
async function analyzeDepositPattern(
  amount: number,
  userId: string,
  jobId?: string
): Promise<{ isRegular: boolean; cv: number }> {
  const supabase = createClient();
  
  // Get last 6 months of deposits
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const query = supabase
    .from('deposits')
    .select('amount, transaction_date')
    .eq('user_id', userId)
    .eq('classification', 'salary')
    .gte('transaction_date', sixMonthsAgo.toISOString().split('T')[0])
    .order('transaction_date', { ascending: false });
    
  if (jobId) {
    query.eq('job_id', jobId);
  }
  
  const { data: deposits } = await query;
  
  if (!deposits || deposits.length < 2) {
    return { isRegular: false, cv: 1 };
  }
  
  // Calculate coefficient of variation for amounts
  const amounts = deposits.map(d => d.amount);
  const mean = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
  const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - mean, 2), 0) / amounts.length;
  const standardDeviation = Math.sqrt(variance);
  const cv = standardDeviation / mean;
  
  // Check for monthly pattern (approximately 30±3 days)
  const dates = deposits.map(d => new Date(d.transaction_date));
  const intervals: number[] = [];
  
  for (let i = 1; i < dates.length; i++) {
    const daysDiff = Math.abs((dates[i-1].getTime() - dates[i].getTime()) / (1000 * 60 * 60 * 24));
    intervals.push(daysDiff);
  }
  
  const avgInterval = intervals.reduce((sum, int) => sum + int, 0) / intervals.length;
  const isRegular = avgInterval >= 27 && avgInterval <= 33; // Monthly pattern
  
  return { isRegular, cv };
}

/**
 * Check if description contains non-taxable keywords
 */
function isNonTaxableIncome(description: string): boolean {
  const nonTaxableKeywords = [
    '交通費', '通勤手当', '出張手当', '宿泊手当',
    '慶弔見舞金', '結婚祝金', '出産祝金',
    '食事手当', '住宅手当', '家賃補助'
  ];
  
  const descriptionLower = description.toLowerCase();
  return nonTaxableKeywords.some(keyword => 
    descriptionLower.includes(keyword.toLowerCase())
  );
}

/**
 * Main deposit classification function
 */
export async function classifyDeposit(input: ClassificationInput): Promise<ClassificationResult> {
  const { amount, description, transactionDate, jobs, userId } = input;
  
  // Check for non-taxable income first
  if (isNonTaxableIncome(description)) {
    return {
      type: 'other',
      confidence: 0.9,
      isTaxable: false,
      reason: 'Non-taxable allowance detected'
    };
  }
  
  // Try to match with known jobs
  let bestMatch: { job: Job; similarity: number } | null = null;
  
  for (const job of jobs) {
    const similarity = fuzzyMatchCompany(description, job.company_name);
    if (similarity > 0.6 && (!bestMatch || similarity > bestMatch.similarity)) {
      bestMatch = { job, similarity };
    }
  }
  
  if (bestMatch) {
    // Analyze deposit pattern for this job
    const { isRegular, cv } = await analyzeDepositPattern(amount, userId, bestMatch.job.id);
    
    // Strong indicators for salary classification
    if (bestMatch.similarity > 0.8 && isRegular && cv < 0.2) {
      return {
        type: 'salary',
        jobId: bestMatch.job.id,
        confidence: 0.9,
        isTaxable: true,
        reason: 'High company match + regular pattern + low variation'
      };
    }
    
    // Medium confidence - needs review
    if (bestMatch.similarity > 0.7 || (isRegular && cv < 0.3)) {
      return {
        type: 'needs_review',
        jobId: bestMatch.job.id,
        confidence: 0.6,
        isTaxable: true,
        reason: 'Partial match - requires manual verification'
      };
    }
  }
  
  // Check for general salary keywords
  const salaryKeywords = ['給与', '給料', '賞与', 'ボーナス', '時給', 'バイト', 'アルバイト'];
  const hasSalaryKeyword = salaryKeywords.some(keyword => 
    description.toLowerCase().includes(keyword)
  );
  
  if (hasSalaryKeyword) {
    return {
      type: 'needs_review',
      confidence: 0.5,
      isTaxable: true,
      reason: 'Contains salary keywords but no job match'
    };
  }
  
  // Default to other income
  return {
    type: 'other',
    confidence: 0.3,
    isTaxable: true,
    reason: 'No clear salary indicators found'
  };
}