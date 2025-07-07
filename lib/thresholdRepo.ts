/**
 * Dynamic Threshold Repository
 * Handles loading of fuyou thresholds from Supabase with fallback mechanisms
 * Supports 2025 tax reform and future changes
 */

import { createSupabaseServerClientReadOnly } from '@/lib/supabase-server'
import { createSupabaseClientSafe } from '@/lib/supabase'
import { ThresholdKey } from '@/lib/fuyouClassifierV2'

// New dynamic threshold types
export interface DynamicThreshold {
  key: string
  kind: 'tax' | 'social'
  yen: number
  label: string
  description?: string
}

export interface ThresholdMap {
  [key: string]: DynamicThreshold
}

// Cache for thresholds to avoid frequent DB queries
let cachedThresholds: ThresholdMap | null = null
let cacheTimestamp: number = 0
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

// Fallback thresholds (current 2024 values)
const FALLBACK_THRESHOLDS: ThresholdMap = {
  'INCOME_TAX_103': {
    key: 'INCOME_TAX_103',
    kind: 'tax',
    yen: 1_030_000,
    label: '103万円の壁（所得税扶養控除）',
    description: '所得税の扶養控除を受けられます。親の税金負担が軽くなります。'
  },
  'SOCIAL_INSURANCE_106': {
    key: 'SOCIAL_INSURANCE_106', 
    kind: 'social',
    yen: 1_060_000,
    label: '106万円の壁（社会保険）',
    description: '大企業勤務の場合の社会保険の扶養上限です。'
  },
  'SOCIAL_INSURANCE_130': {
    key: 'SOCIAL_INSURANCE_130',
    kind: 'social', 
    yen: 1_300_000,
    label: '130万円の壁（社会保険）',
    description: '一般的な社会保険の扶養上限です。'
  },
  'SPOUSE_DEDUCTION_150': {
    key: 'SPOUSE_DEDUCTION_150',
    kind: 'tax',
    yen: 1_500_000,
    label: '150万円の壁（配偶者特別控除）',
    description: '配偶者特別控除の上限です。学生以外で該当する場合があります。'
  }
}

/**
 * Load environment variable fallback thresholds
 * Format: THRESHOLD_FALLBACK='{"INCOME_TAX_103":{"key":"INCOME_TAX_103","yen":1230000,...}}'
 */
function loadEnvFallbackThresholds(): ThresholdMap {
  try {
    const envFallback = process.env.THRESHOLD_FALLBACK
    if (envFallback) {
      const parsed = JSON.parse(envFallback) as ThresholdMap
      console.log('✅ Loaded threshold fallback from environment variables')
      return parsed
    }
  } catch (error) {
    console.warn('⚠️ Failed to parse THRESHOLD_FALLBACK environment variable:', error)
  }
  
  return FALLBACK_THRESHOLDS
}

/**
 * Get active thresholds from Supabase database
 */
async function getActiveThresholdsFromDB(year?: number): Promise<ThresholdMap | null> {
  const targetYear = year || new Date().getFullYear()
  
  try {
    // Try server-side client first (for SSR/API routes)
    let supabase = await createSupabaseServerClientReadOnly()
    
    // Fallback to browser client if server client unavailable
    if (!supabase && typeof window !== 'undefined') {
      supabase = createSupabaseClientSafe()
    }
    
    if (!supabase) {
      console.warn('⚠️ No Supabase client available for threshold loading')
      return null
    }

    const { data, error } = await supabase
      .from('fuyou_thresholds')
      .select('key, kind, yen, label, description')
      .eq('year', targetYear)
      .eq('is_active', true)
      .order('yen', { ascending: true })

    if (error) {
      console.error('🔴 Failed to load thresholds from database:', error.message)
      return null
    }

    if (!data || data.length === 0) {
      console.warn(`⚠️ No active thresholds found for year ${targetYear}`)
      return null
    }

    // Convert array to map
    const thresholdMap: ThresholdMap = {}
    data.forEach((threshold) => {
      thresholdMap[threshold.key] = {
        key: threshold.key,
        kind: threshold.kind as 'tax' | 'social',
        yen: threshold.yen,
        label: threshold.label,
        description: threshold.description || undefined
      }
    })

    console.log(`✅ Loaded ${data.length} active thresholds for year ${targetYear} from database`)
    return thresholdMap
    
  } catch (error) {
    console.error('🔴 Error loading thresholds from database:', error)
    return null
  }
}

/**
 * Get active thresholds with caching and fallback
 */
export async function getActiveThresholds(year?: number): Promise<ThresholdMap> {
  const targetYear = year || new Date().getFullYear()
  const now = Date.now()
  
  // Return cached data if fresh
  if (cachedThresholds && (now - cacheTimestamp) < CACHE_TTL_MS) {
    console.log('✅ Using cached thresholds')
    return cachedThresholds
  }

  // Try loading from database
  const dbThresholds = await getActiveThresholdsFromDB(targetYear)
  
  if (dbThresholds && Object.keys(dbThresholds).length > 0) {
    // Cache successful DB load
    cachedThresholds = dbThresholds
    cacheTimestamp = now
    return dbThresholds
  }

  // Fallback to environment variables or hardcoded values
  console.warn(`⚠️ Using fallback thresholds for year ${targetYear}`)
  const fallbackThresholds = loadEnvFallbackThresholds()
  
  // Cache fallback with shorter TTL
  cachedThresholds = fallbackThresholds
  cacheTimestamp = now - (CACHE_TTL_MS * 0.8) // Expire earlier for fallback
  
  return fallbackThresholds
}

/**
 * Get specific threshold by key with fallback
 */
export async function getThresholdByKey(key: string, year?: number): Promise<DynamicThreshold | null> {
  const thresholds = await getActiveThresholds(year)
  return thresholds[key] || null
}

/**
 * Get all thresholds of a specific kind (tax/social)
 */
export async function getThresholdsByKind(kind: 'tax' | 'social', year?: number): Promise<DynamicThreshold[]> {
  const thresholds = await getActiveThresholds(year)
  return Object.values(thresholds).filter(t => t.kind === kind)
}

/**
 * Convert ThresholdMap to legacy FUYOU_THRESHOLDS format for backward compatibility
 */
export function convertToLegacyFormat(thresholds: ThresholdMap): Record<string, number> {
  const legacy: Record<string, number> = {}
  Object.values(thresholds).forEach(threshold => {
    legacy[threshold.key] = threshold.yen
  })
  return legacy
}

/**
 * Create threshold labels map for backward compatibility
 */
export function createThresholdLabelsMap(thresholds: ThresholdMap): Record<string, string> {
  const labels: Record<string, string> = {}
  Object.values(thresholds).forEach(threshold => {
    labels[threshold.key] = threshold.label
  })
  return labels
}

/**
 * Invalidate cache (useful for admin operations)
 */
export function invalidateThresholdCache(): void {
  cachedThresholds = null
  cacheTimestamp = 0
  console.log('🔄 Threshold cache invalidated')
}

/**
 * Admin function: Update threshold status (requires service role)
 */
export async function activateThresholdsForYear(
  year: number, 
  thresholdKeys: string[]
): Promise<{ success: boolean; affectedRows?: number; error?: string }> {
  try {
    // This would typically use service role client
    // For now, return mock response - implement with proper admin auth
    console.log(`🔧 Would activate thresholds for year ${year}:`, thresholdKeys)
    
    // Invalidate cache after successful update
    invalidateThresholdCache()
    
    return { 
      success: true, 
      affectedRows: thresholdKeys.length 
    }
  } catch (error) {
    console.error('🔴 Failed to activate thresholds:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Type guard to check if a key is a valid ThresholdKey
 */
export function isValidThresholdKey(key: string): key is ThresholdKey {
  return ['INCOME_TAX_103', 'SOCIAL_INSURANCE_106', 'SOCIAL_INSURANCE_130', 'SPOUSE_DEDUCTION_150'].includes(key)
}

/**
 * Get all valid threshold keys from current thresholds
 */
export async function getValidThresholdKeys(year?: number): Promise<string[]> {
  const thresholds = await getActiveThresholds(year)
  return Object.keys(thresholds)
}

/**
 * Health check for threshold system
 */
export async function checkThresholdSystemHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'down'
  source: 'database' | 'fallback' | 'env_fallback'
  thresholdCount: number
  lastUpdate: string
}> {
  try {
    const dbThresholds = await getActiveThresholdsFromDB()
    
    if (dbThresholds && Object.keys(dbThresholds).length > 0) {
      return {
        status: 'healthy',
        source: 'database',
        thresholdCount: Object.keys(dbThresholds).length,
        lastUpdate: new Date().toISOString()
      }
    }
    
    const envFallback = loadEnvFallbackThresholds()
    const isEnvFallback = envFallback !== FALLBACK_THRESHOLDS
    
    return {
      status: 'degraded',
      source: isEnvFallback ? 'env_fallback' : 'fallback',
      thresholdCount: Object.keys(envFallback).length,
      lastUpdate: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('🔴 Threshold system health check failed:', error)
    return {
      status: 'down',
      source: 'fallback',
      thresholdCount: 0,
      lastUpdate: new Date().toISOString()
    }
  }
}