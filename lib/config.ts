// Centralized configuration with fallbacks
export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  moneytree: {
    clientId: process.env.MONEYTREE_CLIENT_ID || '',
    clientSecret: process.env.MONEYTREE_CLIENT_SECRET || '',
    redirectUri: process.env.MONEYTREE_REDIRECT_URI || '',
  },
  sentry: {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  },
  app: {
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    url: process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  isDemoMode: !process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NODE_ENV === 'production',
  isConfigured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
}

// Validate required environment variables
export function validateEnvironment(): { 
  isValid: boolean
  missing: string[]
  warnings: string[] 
} {
  const required = {
    'NEXT_PUBLIC_SUPABASE_URL': config.supabase.url,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': config.supabase.anonKey,
  }
  
  const optional = {
    'OPENAI_API_KEY': config.openai.apiKey,
    'MONEYTREE_CLIENT_ID': config.moneytree.clientId,
    'SENTRY_DSN': config.sentry.dsn,
  }
  
  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key)
  
  const warnings = Object.entries(optional)
    .filter(([, value]) => !value)
    .map(([key]) => key)
  
  return {
    isValid: missing.length === 0,
    missing,
    warnings
  }
}

// Get appropriate error message for missing configuration
export function getConfigurationError(): string | null {
  const { isValid, missing } = validateEnvironment()
  
  if (isValid) return null
  
  if (config.isDemoMode) {
    return 'アプリはデモモードで実行中です。全機能を利用するには環境変数の設定が必要です。'
  }
  
  return `必要な環境変数が設定されていません: ${missing.join(', ')}`
}