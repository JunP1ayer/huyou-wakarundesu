#!/usr/bin/env node

/**
 * Pre-development Environment Check
 * Fast validation of required environment variables before starting dev server
 */

const fs = require('fs')
const path = require('path')

// Configuration
const REQUIRED_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SITE_URL'
]

const OPTIONAL_VARS = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'OPENAI_API_KEY',
  'MONEYTREE_CLIENT_ID',
  'SENTRY_DSN'
]

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
}

// Quick check mode (for predev hook)
const isQuickCheck = process.argv.includes('--quick')

// Function to load environment from .env.local
function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local')
  
  if (!fs.existsSync(envPath)) {
    return null
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8')
  const envVars = {}
  
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#][^=]+)=(.*)$/)
    if (match) {
      envVars[match[1]] = match[2].replace(/^["']|["']$/g, '')
    }
  })
  
  return envVars
}

// Function to validate a single environment variable
function validateEnvVar(key, value) {
  if (!value) {
    return { valid: false, message: 'Missing' }
  }
  
  // Check for placeholder values
  if (value.includes('YOUR_') || value.includes('your_')) {
    return { valid: false, message: 'Placeholder value' }
  }
  
  // Specific validations
  switch (key) {
    case 'NEXT_PUBLIC_SUPABASE_URL':
      if (!value.match(/^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/)) {
        return { valid: false, message: 'Invalid format (should be https://PROJECT.supabase.co)' }
      }
      break
      
    case 'NEXT_PUBLIC_SUPABASE_ANON_KEY':
      if (!value.startsWith('eyJ') || value.length < 6) {
        return { valid: false, message: 'Invalid format (should start with "eyJ" and be a valid JWT)' }
      }
      break
      
    case 'NEXT_PUBLIC_SITE_URL':
      if (!value.match(/^https?:\/\/.+/)) {
        return { valid: false, message: 'Invalid URL format' }
      }
      break
  }
  
  return { valid: true, message: 'OK' }
}

// Function to check if .env.local exists
function checkEnvFileExists() {
  const envPath = path.join(process.cwd(), '.env.local')
  return fs.existsSync(envPath)
}

// Function to provide setup instructions
function showSetupInstructions() {
  console.log(`\n${colors.blue}🚀 Quick Setup:${colors.reset}`)
  console.log('')
  console.log('Option 1 (Recommended): Automated setup')
  console.log('  npm run setup')
  console.log('')
  console.log('Option 2: Manual setup')
  console.log('  cp .env.local.template .env.local')
  console.log('  # Then edit .env.local with your credentials')
  console.log('')
  console.log('Option 3: Copy from existing setup')
  console.log('  # Ask a team member for their .env.local file')
  console.log('')
}

// Function to show quick error summary
function showQuickError(missingVars) {
  console.log(`${colors.red}❌ Missing environment variables:${colors.reset}`)
  missingVars.forEach(varName => {
    console.log(`   • ${varName}`)
  })
  console.log(`\n${colors.yellow}Run: npm run setup${colors.reset}`)
}

// Main validation function
function main() {
  // Quick header
  if (!isQuickCheck) {
    console.log(`${colors.blue}🔍 Environment Check${colors.reset}`)
    console.log('=====================')
  }
  
  // Check if .env.local exists
  if (!checkEnvFileExists()) {
    if (isQuickCheck) {
      console.log(`${colors.red}❌ .env.local not found. Run: npm run setup${colors.reset}`)
    } else {
      console.log(`${colors.red}❌ .env.local file not found${colors.reset}`)
      showSetupInstructions()
    }
    process.exit(1)
  }
  
  // Load environment variables
  const envVars = loadEnvLocal()
  if (!envVars) {
    console.log(`${colors.red}❌ Could not load .env.local${colors.reset}`)
    process.exit(1)
  }
  
  // Validate required variables
  const missingVars = []
  const invalidVars = []
  
  for (const varName of REQUIRED_VARS) {
    const value = envVars[varName]
    const validation = validateEnvVar(varName, value)
    
    if (!validation.valid) {
      if (validation.message === 'Missing') {
        missingVars.push(varName)
      } else {
        invalidVars.push({ name: varName, issue: validation.message })
      }
    }
  }
  
  // Quick check mode (for predev hook)
  if (isQuickCheck) {
    if (missingVars.length > 0 || invalidVars.length > 0) {
      const allIssues = [...missingVars, ...invalidVars.map(v => v.name)]
      showQuickError(allIssues)
      process.exit(1)
    } else {
      // Silent success for quick check
      process.exit(0)
    }
  }
  
  // Detailed check mode
  console.log(`\n${colors.blue}📋 Required Variables:${colors.reset}`)
  for (const varName of REQUIRED_VARS) {
    const value = envVars[varName]
    const validation = validateEnvVar(varName, value)
    
    if (validation.valid) {
      console.log(`   ${colors.green}✅${colors.reset} ${varName}`)
    } else {
      console.log(`   ${colors.red}❌${colors.reset} ${varName} - ${validation.message}`)
    }
  }
  
  console.log(`\n${colors.blue}🔧 Optional Variables:${colors.reset}`)
  for (const varName of OPTIONAL_VARS) {
    const value = envVars[varName]
    const status = value && !value.includes('your_') ? '✅' : '⚪'
    console.log(`   ${status} ${varName}`)
  }
  
  // Summary
  console.log(`\n${colors.blue}📊 Summary:${colors.reset}`)
  if (missingVars.length === 0 && invalidVars.length === 0) {
    console.log(`   ${colors.green}✅ Environment is ready for development${colors.reset}`)
    console.log(`   ${colors.green}🚀 You can now run: npm run dev${colors.reset}`)
    process.exit(0)
  } else {
    console.log(`   ${colors.red}❌ Environment setup incomplete${colors.reset}`)
    
    if (missingVars.length > 0) {
      console.log(`   Missing: ${missingVars.join(', ')}`)
    }
    
    if (invalidVars.length > 0) {
      invalidVars.forEach(v => {
        console.log(`   Invalid: ${v.name} (${v.issue})`)
      })
    }
    
    showSetupInstructions()
    
    // Don't exit with error in CI
    if (process.env.CI !== 'true') {
      process.exit(1)
    }
  }
}

// Export for testing
if (require.main === module) {
  main()
} else {
  module.exports = {
    validateEnvVar,
    loadEnvLocal,
    checkEnvFileExists,
    REQUIRED_VARS,
    OPTIONAL_VARS
  }
}