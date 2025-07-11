#!/usr/bin/env node

/**
 * Google OAuth Configuration Verification Script
 * Comprehensive validation of OAuth setup for debugging 400 errors
 */

const fs = require('fs')
const path = require('path')

// Load environment variables
try {
  require('dotenv').config({ path: path.join(process.cwd(), '.env.local') })
  require('dotenv').config({ path: path.join(process.cwd(), '.env') })
} catch (error) {
  console.log('📝 dotenv not available, using process.env only')
}

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
}

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  console.log('')
  log('cyan', `${'='.repeat(70)}`)
  log('bright', `🔍 ${title}`)
  log('cyan', `${'='.repeat(70)}`)
}

function checkEnvironmentVariable(name, description = '') {
  const value = process.env[name]
  const exists = !!value
  const truncated = exists ? `${value.substring(0, 20)}...` : 'NOT SET'
  
  console.log(`  ${exists ? '✅' : '❌'} ${name}: ${truncated}`)
  if (description) {
    console.log(`     ${description}`)
  }
  
  return { exists, value }
}

function validateSupabaseUrl(url) {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.hostname.includes('supabase') && parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function extractSupabaseProjectId(url) {
  if (!url) return null
  try {
    const parsed = new URL(url)
    return parsed.hostname.split('.')[0]
  } catch {
    return null
  }
}

function generateExpectedUrls() {
  const baseUrls = [
    'http://localhost:3000',
    'https://huyou-wakarundesu.vercel.app',
    'https://huyou-wakarundesu-feature-onboarding-v2.vercel.app',
    'https://huyou-wakarundesu-git-feature-onboarding-v2-junp1ayers-projects.vercel.app',
    'https://huyou-wakarundesu-*.vercel.app'
  ]
  
  return baseUrls.map(url => `${url}/auth/callback`)
}

function analyzeOAuthFlow() {
  logSection('Google OAuth Flow Analysis')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
  
  console.log('🔗 OAuth Flow Components:')
  console.log('')
  
  // 1. Frontend OAuth Initiation
  console.log('  1️⃣ Frontend OAuth Initiation:')
  console.log(`     • JavaScript Origin: window.location.origin`)
  console.log(`     • Redirect Target: {origin}/auth/callback`)
  console.log(`     • Google Client ID: ${googleClientId ? googleClientId.substring(0, 20) + '...' : 'NOT SET'}`)
  
  // 2. Google OAuth Server
  console.log('')
  console.log('  2️⃣ Google OAuth Server:')
  console.log(`     • Redirects to: Supabase Auth URL`)
  console.log(`     • Expected Redirect URI: ${supabaseUrl ? supabaseUrl.replace('https://', 'https://') + '/auth/v1/callback' : 'UNKNOWN'}`)
  
  // 3. Supabase Auth
  console.log('')
  console.log('  3️⃣ Supabase Auth Processing:')
  console.log(`     • Validates with Google using Client Secret`)
  console.log(`     • Client Secret Present: ${googleClientSecret ? '✅ YES' : '❌ NO'}`)
  console.log(`     • Redirects to: App callback URL`)
  
  // 4. App Callback
  console.log('')
  console.log('  4️⃣ App Callback (/auth/callback):')
  console.log(`     • Exchanges code for session`)
  console.log(`     • Creates user session`)
  console.log(`     • Redirects to dashboard/onboarding`)
  
  return {
    supabaseUrl,
    googleClientId,
    googleClientSecret
  }
}

function analyzeCommonErrors() {
  logSection('Common OAuth 400 Error Analysis')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
  
  const issues = []
  
  // Check 1: Missing environment variables
  if (!supabaseUrl) {
    issues.push({
      severity: 'critical',
      issue: 'Missing NEXT_PUBLIC_SUPABASE_URL',
      impact: 'OAuth flow cannot initiate',
      solution: 'Add Supabase project URL to environment variables'
    })
  }
  
  if (!googleClientId) {
    issues.push({
      severity: 'critical', 
      issue: 'Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID',
      impact: 'Google OAuth cannot start',
      solution: 'Add Google OAuth Client ID to environment variables'
    })
  }
  
  if (!googleClientSecret) {
    issues.push({
      severity: 'critical',
      issue: 'Missing GOOGLE_CLIENT_SECRET', 
      impact: 'Supabase cannot validate with Google',
      solution: 'Add Google OAuth Client Secret to environment variables (server-side only)'
    })
  }
  
  // Check 2: URL format validation
  if (supabaseUrl && !validateSupabaseUrl(supabaseUrl)) {
    issues.push({
      severity: 'high',
      issue: 'Invalid Supabase URL format',
      impact: 'OAuth redirects may fail',
      solution: 'Ensure URL format is https://your-project.supabase.co'
    })
  }
  
  // Check 3: Google Client ID format
  if (googleClientId && !googleClientId.includes('googleusercontent.com')) {
    issues.push({
      severity: 'medium',
      issue: 'Google Client ID format may be incorrect',
      impact: 'OAuth may fail at Google',
      solution: 'Verify Client ID ends with .apps.googleusercontent.com'
    })
  }
  
  // Display issues
  if (issues.length === 0) {
    log('green', '✅ No critical configuration issues detected')
  } else {
    issues.forEach((issue, index) => {
      const icon = issue.severity === 'critical' ? '🔴' : 
                   issue.severity === 'high' ? '🟠' : '🟡'
      console.log(`  ${icon} Issue ${index + 1}: ${issue.issue}`)
      console.log(`     Impact: ${issue.impact}`)
      console.log(`     Solution: ${issue.solution}`)
      console.log('')
    })
  }
  
  return issues
}

function generateConfigurationChecklist() {
  logSection('Configuration Verification Checklist')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const projectId = extractSupabaseProjectId(supabaseUrl)
  
  console.log('📋 Manual Verification Steps:')
  console.log('')
  
  // Supabase Configuration
  console.log('🔹 Supabase Dashboard Verification:')
  console.log('   1. Go to https://supabase.com/dashboard')
  console.log(`   2. Select project: ${projectId || '[YOUR_PROJECT]'}`)
  console.log('   3. Navigate to Authentication → URL Configuration')
  console.log('   4. Verify these URLs are in "Redirect URLs":')
  
  const redirectUrls = generateExpectedUrls()
  redirectUrls.forEach(url => {
    console.log(`      • ${url}`)
  })
  
  console.log('')
  
  // Google Cloud Console Configuration  
  console.log('🔹 Google Cloud Console Verification:')
  console.log('   1. Go to https://console.cloud.google.com/')
  console.log('   2. Navigate to APIs & Services → Credentials')
  console.log('   3. Find your OAuth 2.0 Client ID')
  console.log('   4. Verify "Authorized redirect URIs" contains:')
  console.log(`      • ${supabaseUrl || '[SUPABASE_URL]'}/auth/v1/callback`)
  console.log('   5. Verify "Authorized JavaScript origins" contains:')
  console.log('      • http://localhost:3000')
  console.log('      • https://huyou-wakarundesu.vercel.app') 
  console.log('      • [YOUR_PREVIEW_URL]')
  
  console.log('')
  
  // Testing Procedure
  console.log('🔹 Testing Procedure:')
  console.log('   1. Deploy to Vercel Preview')
  console.log('   2. Get exact Preview URL from Vercel Dashboard')
  console.log('   3. Add Preview URL + /auth/callback to Supabase')
  console.log('   4. Add Preview URL to Google Cloud Console origins')
  console.log('   5. Test OAuth flow:')
  console.log('      • Go to [PREVIEW_URL]/login')
  console.log('      • Click "Login with Google"')
  console.log('      • Monitor console logs for errors')
  console.log('   6. Check function logs in Vercel Dashboard')
  console.log('   7. Check Auth logs in Supabase Dashboard')
}

function generateDebugScript() {
  logSection('Debug Script for Live Testing')
  
  console.log('📋 Run this in browser console during OAuth flow:')
  console.log('')
  console.log('```javascript')
  console.log('// OAuth Debug Script')
  console.log('console.log("🔍 OAuth Debug Info:", {')
  console.log('  currentUrl: window.location.href,')
  console.log('  origin: window.location.origin,')
  console.log('  expectedCallback: window.location.origin + "/auth/callback",')
  console.log('  userAgent: navigator.userAgent,')
  console.log('  timestamp: new Date().toISOString()')
  console.log('});')
  console.log('')
  console.log('// Check for URL parameters')
  console.log('const params = new URLSearchParams(window.location.search);')
  console.log('console.log("🔍 URL Parameters:", {')
  console.log('  hasCode: params.has("code"),')
  console.log('  hasError: params.has("error"),') 
  console.log('  error: params.get("error"),')
  console.log('  errorDescription: params.get("error_description"),')
  console.log('  state: params.get("state"),')
  console.log('  allParams: Object.fromEntries(params)')
  console.log('});')
  console.log('```')
  console.log('')
  
  log('yellow', '⚠️  Run this script when OAuth flow fails to capture debug info')
}

function main() {
  log('bright', '🚀 Google OAuth Configuration Verification')
  log('blue', 'Analyzing OAuth setup for 400 error debugging...')
  
  // Basic environment check
  logSection('Environment Variables')
  checkEnvironmentVariable('NEXT_PUBLIC_SUPABASE_URL', 'Supabase Project URL')
  checkEnvironmentVariable('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Supabase Anonymous Key') 
  checkEnvironmentVariable('NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'Google OAuth Client ID (public)')
  checkEnvironmentVariable('GOOGLE_CLIENT_SECRET', 'Google OAuth Client Secret (private)')
  
  // OAuth flow analysis
  const flowComponents = analyzeOAuthFlow()
  
  // Error analysis
  const issues = analyzeCommonErrors()
  
  // Configuration checklist
  generateConfigurationChecklist()
  
  // Debug script
  generateDebugScript()
  
  // Summary
  logSection('Next Steps')
  
  if (issues.length === 0) {
    log('green', '✅ Configuration appears correct')
    console.log('   • Follow the manual verification checklist above')
    console.log('   • Test OAuth flow in Preview deployment')
    console.log('   • Check function logs for detailed error analysis')
  } else {
    log('red', `❌ Found ${issues.length} configuration issues`)
    console.log('   • Fix the issues listed above first')
    console.log('   • Re-run this script to verify fixes')
    console.log('   • Then proceed with OAuth flow testing')
  }
  
  console.log('')
  log('cyan', '📚 For detailed debugging: See DEBUG_OAUTH_FLOW.md')
  console.log('')
}

if (require.main === module) {
  main()
}

module.exports = { main, analyzeOAuthFlow, analyzeCommonErrors }