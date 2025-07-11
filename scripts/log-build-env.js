#!/usr/bin/env node

/**
 * Build Environment Variables Logger
 * Logs environment variables to build output for debugging
 */

const fs = require('fs')
const path = require('path')

// Load environment variables like Next.js does
function loadEnvFiles() {
  const envFiles = [
    '.env.local',
    '.env.production',
    '.env'
  ]
  
  console.log('🔍 Loading environment files...')
  
  envFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ Loading ${file}`)
      try {
        require('dotenv').config({ path: filePath })
      } catch (error) {
        console.log(`   ❌ Failed to load ${file}:`, error.message)
      }
    } else {
      console.log(`   ⚪ ${file} not found`)
    }
  })
  
  console.log('')
}

// Try to load dotenv, but don't fail if it's not available
try {
  require('dotenv')
  loadEnvFiles()
} catch (error) {
  console.log('📝 dotenv not available, using process.env only')
  console.log('')
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
  log('cyan', `${'='.repeat(60)}`)
  log('bright', `🔧 ${title}`)
  log('cyan', `${'='.repeat(60)}`)
}

function logEnvironmentVariable(name, required = false, description = '') {
  const value = process.env[name]
  const exists = !!value
  const truncatedValue = exists ? `${value.substring(0, 20)}...` : 'NOT SET'
  
  console.log(`  ${exists ? '✅' : '❌'} ${name}: ${truncatedValue}`)
  if (description) {
    console.log(`     ${description}`)
  }
  
  if (required && !exists) {
    log('red', `     ⚠️  Required environment variable missing`)
    return false
  }
  
  return exists
}

function main() {
  logSection('Build Environment Variables')
  
  console.log(`  🏗️  Build Environment: ${process.env.NODE_ENV || 'undefined'}`)
  console.log(`  ☁️  Vercel Environment: ${process.env.VERCEL_ENV || 'undefined'}`)
  console.log(`  🌐 Vercel URL: ${process.env.VERCEL_URL || 'undefined'}`)
  console.log(`  📝 Vercel Git Provider: ${process.env.VERCEL_GIT_PROVIDER || 'undefined'}`)
  console.log(`  🔀 Vercel Git Branch: ${process.env.VERCEL_GIT_COMMIT_REF || 'undefined'}`)
  console.log(`  📦 Node Version: ${process.version}`)
  console.log(`  ⏰ Build Time: ${new Date().toISOString()}`)
  
  logSection('Authentication Environment Variables')
  
  const requiredVars = [
    ['NEXT_PUBLIC_SUPABASE_URL', 'Supabase Project URL'],
    ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Supabase Anonymous Key'],
    ['NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'Google OAuth Client ID'],
    ['GOOGLE_CLIENT_SECRET', 'Google OAuth Client Secret (server-side)']
  ]
  
  const optionalVars = [
    ['SUPABASE_SERVICE_ROLE_KEY', 'Supabase Service Role Key'],
    ['OPENAI_API_KEY', 'OpenAI API Key'],
    ['STRIPE_SECRET_KEY', 'Stripe Secret Key'],
    ['NEXT_PUBLIC_SITE_URL', 'Site URL for redirects']
  ]
  
  console.log('')
  log('blue', '📋 Required Variables:')
  let missingRequired = 0
  requiredVars.forEach(([name, desc]) => {
    if (!logEnvironmentVariable(name, true, desc)) {
      missingRequired++
    }
  })
  
  console.log('')
  log('blue', '📋 Optional Variables:')
  optionalVars.forEach(([name, desc]) => {
    logEnvironmentVariable(name, false, desc)
  })
  
  logSection('Environment Validation Summary')
  
  if (missingRequired > 0) {
    log('red', `❌ ${missingRequired} required environment variables are missing`)
    log('yellow', '⚠️  Build may fail or app may not function correctly')
    
    if (process.env.VERCEL_ENV) {
      console.log('')
      log('blue', '💡 To fix on Vercel:')
      console.log('   1. Go to Vercel Dashboard → Project Settings')
      console.log('   2. Navigate to Environment Variables')
      console.log('   3. Add the missing variables for all environments')
      console.log('   4. Redeploy the application')
    }
  } else {
    log('green', '✅ All required environment variables are present')
  }
  
  // Additional build context
  logSection('Build Context')
  
  console.log(`  📂 Working Directory: ${process.cwd()}`)
  console.log(`  🚀 Platform: ${process.platform}`)
  
  if (process.env.VERCEL_ENV) {
    console.log(`  ☁️  Vercel Deployment ID: ${process.env.VERCEL_DEPLOYMENT_ID || 'undefined'}`)
    console.log(`  🔗 Vercel Project: ${process.env.VERCEL_GIT_REPO_SLUG || 'undefined'}`)
    console.log(`  👤 Vercel Team: ${process.env.VERCEL_TEAM_ID || 'undefined'}`)
  }
  
  // Build warnings
  const warnings = []
  
  if (process.env.NODE_ENV !== 'production') {
    warnings.push('NODE_ENV is not set to "production"')
  }
  
  if (!process.env.NEXT_PUBLIC_SITE_URL && process.env.VERCEL_ENV === 'production') {
    warnings.push('NEXT_PUBLIC_SITE_URL not set for production')
  }
  
  if (warnings.length > 0) {
    console.log('')
    log('yellow', '⚠️  Build Warnings:')
    warnings.forEach(warning => {
      console.log(`   • ${warning}`)
    })
  }
  
  console.log('')
  log('cyan', '🏁 Environment validation complete')
  console.log('')
}

if (require.main === module) {
  main()
}

module.exports = { main }