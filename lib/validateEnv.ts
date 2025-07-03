/**
 * Runtime Environment Variable Validation
 * Call this function explicitly when you need to validate env vars
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const

// const optionalEnvVars = [
//   'OPENAI_API_KEY',
//   'MONEYTREE_CLIENT_ID',
//   'MONEYTREE_CLIENT_SECRET',
//   'SENTRY_DSN',
//   'NEXT_PUBLIC_GA_ID',
// ] as const

export function validateEnvironment(options: { throwOnMissing?: boolean } = {}) {
  const { throwOnMissing = false } = options
  
  // Check required variables
  const missingRequired = requiredEnvVars.filter(key => !process.env[key])
  
  if (missingRequired.length > 0) {
    const message = `Missing required environment variables: ${missingRequired.join(', ')}`
    
    if (throwOnMissing && process.env.NODE_ENV === 'production' && !process.env.CI && !process.env.VERCEL) {
      throw new Error(message)
    } else {
      console.warn('⚠️ ', message)
    }
  }
  
  return {
    isValid: missingRequired.length === 0,
    isDemoMode: missingRequired.length > 0,
    missingVars: missingRequired,
    hasOptional: {
      openai: !!process.env.OPENAI_API_KEY,
      moneytree: !!(process.env.MONEYTREE_CLIENT_ID && process.env.MONEYTREE_CLIENT_SECRET),
      sentry: !!process.env.SENTRY_DSN,
      analytics: !!process.env.NEXT_PUBLIC_GA_ID,
    }
  }
}

// Type-safe environment variable access
export function getEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    MONEYTREE_CLIENT_ID: process.env.MONEYTREE_CLIENT_ID,
    MONEYTREE_CLIENT_SECRET: process.env.MONEYTREE_CLIENT_SECRET,
    SENTRY_DSN: process.env.SENTRY_DSN,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
  } as const
}