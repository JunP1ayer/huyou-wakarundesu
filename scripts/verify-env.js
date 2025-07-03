#!/usr/bin/env node

/**
 * Environment Variable Verification Script
 * Run with: node scripts/verify-env.js
 */

// Import the validation logic
const path = require('path')
const projectRoot = path.join(__dirname, '..')

// Simple validation without imports to avoid build issues
const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']
const optional = ['OPENAI_API_KEY', 'MONEYTREE_CLIENT_ID', 'MONEYTREE_CLIENT_SECRET', 'NEXT_PUBLIC_GA_ID', 'SENTRY_DSN']

console.log('🔍 Environment Variable Verification\n')

// Check required variables
console.log('📋 Required Variables:')
let allRequired = true
required.forEach(key => {
  const value = process.env[key]
  if (value) {
    console.log(`   ✅ ${key}`)
    
    // Additional validation
    if (key === 'NEXT_PUBLIC_SUPABASE_URL') {
      if (!value.match(/^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/)) {
        console.log(`   ⚠️  ${key} format might be incorrect`)
        console.log(`      Expected: https://YOUR-PROJECT-REF.supabase.co`)
        console.log(`      Got: ${value}`)
      }
    }
    
    if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
      if (!value.startsWith('eyJ')) {
        console.log(`   ⚠️  ${key} format might be incorrect (should start with "eyJ")`)
      }
    }
  } else {
    console.log(`   ❌ ${key} - MISSING`)
    allRequired = false
  }
})

// Check optional variables
console.log('\n🔧 Optional Variables:')
optional.forEach(key => {
  const value = process.env[key]
  const status = value ? '✅' : '⚪'
  console.log(`   ${status} ${key}`)
})

// Final verdict
console.log('\n📊 Summary:')
if (allRequired) {
  console.log('   ✅ All required environment variables are set!')
  console.log('   🚀 Ready to run: npm run dev')
} else {
  console.log('   ❌ Missing required environment variables')
  console.log('   📋 Please check .env.example and ENVIRONMENT_SETUP.md')
  if (process.env.CI !== 'true') {
    process.exit(1)
  }
}

// Browser environment check
console.log('\n🌐 Browser Environment Check:')
if (typeof window !== 'undefined') {
  console.log('   🖥️  Running in browser')
  
  // Check for old cookies/sessions
  if (document.cookie.includes('sb-')) {
    console.log('   🍪 Supabase cookies found')
    const cookies = document.cookie.split(';').filter(c => c.includes('sb-'))
    cookies.forEach(cookie => {
      console.log(`      ${cookie.trim()}`)
    })
  } else {
    console.log('   🍪 No Supabase cookies (will be set after login)')
  }
} else {
  console.log('   🖥️  Running in Node.js environment')
}

console.log('\n🔗 Quick Links:')
console.log('   📖 Setup Guide: ./ENVIRONMENT_SETUP.md')
console.log('   🔧 Template: ./.env.example')
console.log('   🌐 Supabase: https://supabase.com/dashboard')
console.log('   🤖 OpenAI: https://platform.openai.com/api-keys')