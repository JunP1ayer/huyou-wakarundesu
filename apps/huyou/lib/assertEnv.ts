/**
 * Environment Variable Validation
 * Ensures all required environment variables are set at build time
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const

const optionalEnvVars = [
  'OPENAI_API_KEY',
  'MONEYTREE_CLIENT_ID',
  'MONEYTREE_CLIENT_SECRET',
  'SENTRY_DSN',
  'NEXT_PUBLIC_GA_ID',
] as const

// Check required variables
const missingRequired = requiredEnvVars.filter(key => !process.env[key])

if (missingRequired.length > 0) {
  console.error('❌ Missing required environment variables:')
  missingRequired.forEach(key => {
    console.error(`   - ${key}`)
  })
  console.error('\n📋 Please check .env.example for the required format')
  
  // Only throw in production builds AND not in CI environments
  if (process.env.NODE_ENV === 'production' && !process.env.CI && !process.env.VERCEL) {
    throw new Error(`Missing required environment variables: ${missingRequired.join(', ')}`)
  } else {
    console.warn('⚠️  Running in build/development mode without Supabase - using demo mode')
  }
}

// Validate Supabase URL format
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (supabaseUrl && !supabaseUrl.match(/^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/)) {
  console.error(`❌ Invalid NEXT_PUBLIC_SUPABASE_URL format: ${supabaseUrl}`)
  console.error('   Expected format: https://YOUR-PROJECT-REF.supabase.co')
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Invalid Supabase URL format')
  }
}

// Validate Supabase Anon Key format (JWT)
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (anonKey && !anonKey.startsWith('eyJ')) {
  console.error('❌ Invalid NEXT_PUBLIC_SUPABASE_ANON_KEY format')
  console.error('   Anon key should be a JWT token starting with "eyJ"')
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Invalid Supabase Anon Key format')
  }
}

// Log optional variables status in development
if (process.env.NODE_ENV !== 'production') {
  console.log('🔍 Environment variable status:')
  
  // Required vars
  requiredEnvVars.forEach(key => {
    const status = process.env[key] ? '✅' : '❌'
    console.log(`   ${status} ${key}`)
  })
  
  // Optional vars
  console.log('\n   Optional:')
  optionalEnvVars.forEach(key => {
    const status = process.env[key] ? '✅' : '⚪'
    console.log(`   ${status} ${key}`)
  })
  console.log('')
}

// Export validation status for runtime checks
export const envValidation = {
  isValid: missingRequired.length === 0,
  isDemoMode: missingRequired.length > 0 && process.env.NODE_ENV !== 'production',
  missingVars: missingRequired,
}

// Type-safe environment variable access
export const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  isDemoMode: envValidation.isDemoMode,
} as const