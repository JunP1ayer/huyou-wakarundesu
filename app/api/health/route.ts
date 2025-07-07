import { NextResponse } from 'next/server'
import { config, validateEnvironment } from '@/lib/config'

export async function GET() {
  const { isValid, missing, warnings } = validateEnvironment()
  
  const health = {
    status: isValid ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    mode: config.isDemoMode ? 'demo' : 'production',
    environment: {
      configured: config.isConfigured,
      missing: missing,
      warnings: warnings,
    },
    services: {
      supabase: {
        configured: !!(config.supabase.url && config.supabase.anonKey),
        status: config.supabase.url ? 'available' : 'missing',
      },
      openai: {
        configured: !!config.openai.apiKey,
        status: config.openai.apiKey ? 'available' : 'missing',
      },
      moneytree: {
        configured: !!config.moneytree.clientId,
        status: config.moneytree.clientId ? 'available' : 'missing',
      },
      sentry: {
        configured: !!config.sentry.dsn,
        status: config.sentry.dsn ? 'available' : 'missing',
      },
    },
    deployment: {
      platform: process.env.VERCEL ? 'vercel' : 'unknown',
      nodeVersion: process.version,
      region: process.env.VERCEL_REGION || 'unknown',
    },
  }
  
  // Set appropriate status code
  const statusCode = isValid ? 200 : 503
  
  return NextResponse.json(health, { 
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Health-Status': isValid ? 'healthy' : 'degraded',
    }
  })
}