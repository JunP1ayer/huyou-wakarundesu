import { NextResponse } from 'next/server'
import { config, validateEnvironment } from '@/lib/config'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  const { isValid, missing, warnings } = validateEnvironment()
  
  // Test server-side Supabase connection
  let supabaseTest = { connected: false, error: null, sessionTest: false }
  if (config.supabase.url && config.supabase.anonKey) {
    try {
      const cookieStore = cookies()
      const supabase = createServerClient(
        config.supabase.url,
        config.supabase.anonKey,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
            set() {},
            remove() {},
          },
        }
      )
      
      // Test getSession on server-side
      const { data: session, error: sessionError } = await supabase.auth.getSession()
      supabaseTest.connected = true
      supabaseTest.sessionTest = !sessionError
      if (sessionError) {
        supabaseTest.error = sessionError.message
      }
      console.log('Health check - Supabase session test:', { 
        hasSession: !!session?.session, 
        error: sessionError?.message 
      })
    } catch (error: any) {
      supabaseTest.error = error.message
      console.error('Health check - Supabase connection failed:', error.message)
    }
  }
  
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
        serverTest: supabaseTest,
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