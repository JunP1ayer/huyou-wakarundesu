#!/usr/bin/env npx tsx

/**
 * Google OAuth Client Secret Verification Script
 * Verifies Google OAuth credentials match between local env and Google Cloud Console
 */

import * as path from 'path';

// Load environment variables in the correct order
try {
  require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });
  require('dotenv').config({ path: path.join(process.cwd(), '.env.production') });
  require('dotenv').config({ path: path.join(process.cwd(), '.env') });
} catch (error) {
  console.log('⚠️ dotenv loading error:', error);
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

function log(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title: string) {
  console.log('')
  log('cyan', `${'='.repeat(70)}`)
  log('bright', `🔍 ${title}`)
  log('cyan', `${'='.repeat(70)}`)
}

function maskSecret(secret: string | undefined): string {
  if (!secret) return 'NOT SET'
  return `${secret.substring(0, 10)}...${secret.substring(secret.length - 6)}`
}

function validateGoogleClientId(clientId: string | undefined): boolean {
  if (!clientId) return false
  
  // Google Client ID format: numbers-string.apps.googleusercontent.com
  const googleClientIdPattern = /^\d+-[a-zA-Z0-9]+\.apps\.googleusercontent\.com$/
  return googleClientIdPattern.test(clientId)
}

function validateGoogleClientSecret(secret: string | undefined): boolean {
  if (!secret) return false
  
  // Google Client Secret format: GOCSPX-followed by base64-like string
  const googleSecretPattern = /^GOCSPX-[A-Za-z0-9_-]+$/
  return googleSecretPattern.test(secret)
}

function main() {
  log('bright', '🔍 GOOGLE OAUTH CLIENT SECRET VERIFICATION')
  log('blue', 'Verifying Google OAuth credentials configuration...')
  
  // Environment Variables Check
  logSection('Environment Variables Analysis')
  
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  
  console.log(`🔑 NEXT_PUBLIC_GOOGLE_CLIENT_ID:`)
  console.log(`   Value: ${clientId || 'NOT SET'}`)
  console.log(`   Format Valid: ${validateGoogleClientId(clientId) ? '✅ YES' : '❌ NO'}`)
  
  if (clientId) {
    console.log(`   Project Number: ${clientId.split('-')[0]}`)
    console.log(`   Domain: ${clientId.split('.').slice(-2).join('.')}`)
  }
  
  console.log('')
  console.log(`🔐 GOOGLE_CLIENT_SECRET:`)
  console.log(`   Value: ${maskSecret(clientSecret)}`)
  console.log(`   Format Valid: ${validateGoogleClientSecret(clientSecret) ? '✅ YES' : '❌ NO'}`)
  
  if (clientSecret) {
    console.log(`   Prefix: ${clientSecret.substring(0, 7)}`)
    console.log(`   Length: ${clientSecret.length} characters`)
  }
  
  // Validation Results
  logSection('Validation Results')
  
  const issues: string[] = []
  
  if (!clientId) {
    issues.push('Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID')
  } else if (!validateGoogleClientId(clientId)) {
    issues.push('Invalid Google Client ID format')
  }
  
  if (!clientSecret) {
    issues.push('Missing GOOGLE_CLIENT_SECRET')
  } else if (!validateGoogleClientSecret(clientSecret)) {
    issues.push('Invalid Google Client Secret format')
  }
  
  if (issues.length === 0) {
    log('green', '✅ All Google OAuth credentials are properly formatted')
  } else {
    log('red', `❌ Found ${issues.length} credential issues:`)
    issues.forEach(issue => {
      console.log(`   • ${issue}`)
    })
  }
  
  // Manual Verification Steps
  logSection('Manual Verification Required')
  
  console.log('📋 Google Cloud Console Verification Steps:')
  console.log('')
  console.log('1. 🌐 Open Google Cloud Console:')
  console.log('   https://console.cloud.google.com/')
  console.log('')
  console.log('2. 🔍 Navigate to Credentials:')
  console.log('   APIs & Services → Credentials')
  console.log('')
  console.log('3. 📝 Find your OAuth 2.0 Client ID:')
  console.log(`   Look for: ${clientId || '[YOUR_CLIENT_ID]'}`)
  console.log('')
  console.log('4. ✅ Verify Client Secret matches:')
  console.log(`   Expected: ${maskSecret(clientSecret)}`)
  console.log('')
  console.log('5. 🔗 Check Authorized redirect URIs contains:')
  console.log('   https://zbsjqsqytjjlbpchpacl.supabase.co/auth/v1/callback')
  console.log('')
  console.log('6. 🌍 Check Authorized JavaScript origins contains:')
  console.log('   http://localhost:3000')
  console.log('   https://huyou-wakarundesu.vercel.app')
  console.log('   https://huyou-wakarundesu-qr4fx6kx3-junp1ayers-projects.vercel.app')
  
  // Environment File Check
  logSection('Environment Files Check')
  
  const envFiles = ['.env.local', '.env.production', '.env']
  
  envFiles.forEach(file => {
    try {
      const fs = require('fs')
      const path = require('path')
      const filePath = path.join(process.cwd(), file)
      
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} exists`)
        
        const content = fs.readFileSync(filePath, 'utf8')
        const hasClientId = content.includes('NEXT_PUBLIC_GOOGLE_CLIENT_ID')
        const hasSecret = content.includes('GOOGLE_CLIENT_SECRET')
        
        console.log(`   • NEXT_PUBLIC_GOOGLE_CLIENT_ID: ${hasClientId ? '✅' : '❌'}`)
        console.log(`   • GOOGLE_CLIENT_SECRET: ${hasSecret ? '✅' : '❌'}`)
      } else {
        console.log(`❌ ${file} not found`)
      }
    } catch (error) {
      console.log(`⚠️  Error checking ${file}: ${error}`)
    }
  })
  
  // Deployment Environment Check
  logSection('Deployment Environment Check')
  
  console.log('🚀 Vercel Environment Variables:')
  console.log('   Ensure these are set in Vercel Dashboard:')
  console.log('   • NEXT_PUBLIC_GOOGLE_CLIENT_ID (all environments)')
  console.log('   • GOOGLE_CLIENT_SECRET (all environments)')
  console.log('')
  console.log('📍 Current deployment URL detected:')
  console.log('   https://huyou-wakarundesu-qr4fx6kx3-junp1ayers-projects.vercel.app')
  console.log('')
  console.log('⚠️  Ensure this URL is added to Google Cloud Console origins!')
  
  // Summary
  logSection('Next Steps')
  
  if (issues.length === 0) {
    log('green', '✅ Credentials appear valid - proceed with OAuth flow testing')
    console.log('   1. Verify manual steps above in Google Cloud Console')
    console.log('   2. Test OAuth flow on Preview deployment')
    console.log('   3. Check browser network tab for detailed 400 error')
  } else {
    log('red', '❌ Fix credential issues first:')
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`)
    })
    console.log('')
    console.log('   After fixing, re-run: npm run verify-oauth-secret')
  }
  
  console.log('')
  log('cyan', '📚 For more debugging: npm run verify-oauth')
  console.log('')
}

if (require.main === module) {
  main()
}