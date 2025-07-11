/**
 * Configuration validation utility
 * 設定検証ユーティリティ
 */

export interface ConfigCheckResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  environment: string
  details: {
    supabase: {
      hasUrl: boolean
      hasAnonKey: boolean
      hasServiceRoleKey: boolean
      urlFormat: 'valid' | 'invalid' | 'missing'
    }
    google: {
      hasClientId: boolean
      hasClientSecret: boolean
    }
    other: {
      hasOpenAI: boolean
      hasStripe: boolean
      hasSiteUrl: boolean
    }
  }
}

export function checkConfiguration(): ConfigCheckResult {
  const errors: string[] = []
  const warnings: string[] = []
  const environment = process.env.NODE_ENV || 'unknown'

  // Supabase configuration
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const hasSupabaseUrl = !!supabaseUrl
  const hasSupabaseAnonKey = !!supabaseAnonKey
  const hasSupabaseServiceKey = !!supabaseServiceKey

  let urlFormat: 'valid' | 'invalid' | 'missing' = 'missing'
  if (supabaseUrl) {
    urlFormat = supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co') ? 'valid' : 'invalid'
  }

  // Required checks
  if (!hasSupabaseUrl) {
    errors.push('Missing Supabase URL (SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL)')
  }
  if (!hasSupabaseAnonKey) {
    errors.push('Missing Supabase Anon Key (SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  }
  if (urlFormat === 'invalid') {
    errors.push('Invalid Supabase URL format')
  }

  // Google OAuth configuration
  const hasGoogleClientId = !!process.env.GOOGLE_CLIENT_ID
  const hasGoogleClientSecret = !!process.env.GOOGLE_CLIENT_SECRET

  if (!hasGoogleClientId) {
    errors.push('Missing Google Client ID (GOOGLE_CLIENT_ID)')
  }
  if (!hasGoogleClientSecret) {
    errors.push('Missing Google Client Secret (GOOGLE_CLIENT_SECRET)')
  }

  // Other services
  const hasOpenAI = !!process.env.OPENAI_API_KEY
  const hasStripe = !!process.env.STRIPE_SECRET_KEY
  const hasSiteUrl = !!process.env.NEXT_PUBLIC_SITE_URL

  // Warnings for optional but recommended
  if (!hasSupabaseServiceKey) {
    warnings.push('Missing Supabase Service Role Key - some admin functions may not work')
  }
  if (!hasOpenAI) {
    warnings.push('Missing OpenAI API Key - AI features may not work')
  }
  if (!hasStripe) {
    warnings.push('Missing Stripe Secret Key - payment features may not work')
  }
  if (!hasSiteUrl) {
    warnings.push('Missing NEXT_PUBLIC_SITE_URL - some redirects may not work correctly')
  }

  // Environment-specific checks
  if (environment === 'production') {
    if (supabaseUrl?.includes('localhost')) {
      errors.push('Production environment should not use localhost URLs')
    }
    if (!process.env.VERCEL_URL && !hasSiteUrl) {
      warnings.push('Production environment should have NEXT_PUBLIC_SITE_URL set')
    }
  }

  const result: ConfigCheckResult = {
    isValid: errors.length === 0,
    errors,
    warnings,
    environment,
    details: {
      supabase: {
        hasUrl: hasSupabaseUrl,
        hasAnonKey: hasSupabaseAnonKey,
        hasServiceRoleKey: hasSupabaseServiceKey,
        urlFormat
      },
      google: {
        hasClientId: hasGoogleClientId,
        hasClientSecret: hasGoogleClientSecret
      },
      other: {
        hasOpenAI,
        hasStripe,
        hasSiteUrl
      }
    }
  }

  return result
}

export function logConfigurationStatus() {
  const config = checkConfiguration()
  
  console.log(`[CONFIG] Environment: ${config.environment}`)
  console.log(`[CONFIG] Configuration status: ${config.isValid ? 'VALID' : 'INVALID'}`)
  
  if (config.errors.length > 0) {
    console.error('[CONFIG] ERRORS:')
    config.errors.forEach(error => console.error(`  ❌ ${error}`))
  }
  
  if (config.warnings.length > 0) {
    console.warn('[CONFIG] WARNINGS:')
    config.warnings.forEach(warning => console.warn(`  ⚠️  ${warning}`))
  }
  
  console.log('[CONFIG] Details:', {
    supabase: config.details.supabase,
    google: config.details.google,
    other: config.details.other
  })
  
  return config
}

export function ensureValidConfiguration() {
  const config = checkConfiguration()
  
  if (!config.isValid) {
    console.error('[CONFIG] Configuration validation failed!')
    config.errors.forEach(error => console.error(`  ❌ ${error}`))
    
    if (process.env.NODE_ENV !== 'development') {
      throw new Error(`Configuration validation failed: ${config.errors.join(', ')}`)
    }
  }
  
  return config
}