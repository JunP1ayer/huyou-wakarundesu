#!/usr/bin/env node

/**
 * OAuth Flow Test Script
 * Tests the Google OAuth configuration and redirect flow
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

console.log(`${colors.blue}🔍 OAuth Flow Test Script${colors.reset}`);
console.log('========================\n');

// Load environment variables
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  try {
    require('dotenv').config({ path: '.env' });
  } catch (e2) {
    console.error(`${colors.red}❌ No .env.local or .env file found${colors.reset}`);
    process.exit(1);
  }
}

// Test configuration
const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  localUrl: 'http://localhost:3000'
};

// Validation functions
function validateUrl(url, name) {
  try {
    new URL(url);
    console.log(`${colors.green}✅ ${name}: ${url}${colors.reset}`);
    return true;
  } catch (e) {
    console.log(`${colors.red}❌ ${name}: Invalid URL${colors.reset}`);
    return false;
  }
}

function extractProjectRef(supabaseUrl) {
  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : null;
}

// Test 1: Environment validation
console.log(`${colors.blue}1. Environment Validation${colors.reset}`);
console.log('-------------------------');

let valid = true;

if (!config.supabaseUrl || config.supabaseUrl.includes('___')) {
  console.log(`${colors.red}❌ NEXT_PUBLIC_SUPABASE_URL not configured${colors.reset}`);
  valid = false;
} else {
  validateUrl(config.supabaseUrl, 'Supabase URL');
}

if (!config.supabaseAnonKey || config.supabaseAnonKey.includes('___')) {
  console.log(`${colors.red}❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not configured${colors.reset}`);
  valid = false;
} else {
  console.log(`${colors.green}✅ Supabase Anon Key: ${config.supabaseAnonKey.substring(0, 20)}...${colors.reset}`);
}

if (!valid) {
  console.log(`\n${colors.yellow}Fix: Update .env.local with your Supabase credentials${colors.reset}`);
  process.exit(1);
}

const projectRef = extractProjectRef(config.supabaseUrl);
console.log(`\n${colors.blue}Project Reference: ${projectRef}${colors.reset}`);

// Test 2: OAuth URLs
console.log(`\n${colors.blue}2. OAuth URL Configuration${colors.reset}`);
console.log('--------------------------');

const oauthUrls = {
  googleCallback: `${config.supabaseUrl}/auth/v1/callback`,
  localCallback: `${config.localUrl}/auth/callback`,
  loginPage: `${config.localUrl}/login`,
  dashboard: `${config.localUrl}/dashboard`
};

console.log(`${colors.yellow}Required Google OAuth Redirect URI:${colors.reset}`);
console.log(`  ${oauthUrls.googleCallback}`);
console.log(`\n${colors.yellow}Local App URLs:${colors.reset}`);
console.log(`  Login: ${oauthUrls.loginPage}`);
console.log(`  Callback: ${oauthUrls.localCallback}`);
console.log(`  Dashboard: ${oauthUrls.dashboard}`);

// Test 3: Supabase connectivity
console.log(`\n${colors.blue}3. Testing Supabase Connectivity${colors.reset}`);
console.log('--------------------------------');

function testSupabaseConnection() {
  const url = new URL(`${config.supabaseUrl}/auth/v1/health`);
  
  https.get(url.href, (res) => {
    if (res.statusCode === 200) {
      console.log(`${colors.green}✅ Supabase Auth service is reachable${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️  Supabase Auth returned status: ${res.statusCode}${colors.reset}`);
    }
  }).on('error', (err) => {
    console.log(`${colors.red}❌ Cannot reach Supabase: ${err.message}${colors.reset}`);
  });
}

testSupabaseConnection();

// Test 4: Local server check
console.log(`\n${colors.blue}4. Checking Local Development Server${colors.reset}`);
console.log('------------------------------------');

function testLocalServer() {
  http.get('http://localhost:3000', (res) => {
    console.log(`${colors.green}✅ Local dev server is running on port 3000${colors.reset}`);
    
    // Test auth callback route
    http.get('http://localhost:3000/auth/callback', (res) => {
      if (res.statusCode < 500) {
        console.log(`${colors.green}✅ Auth callback route exists${colors.reset}`);
      } else {
        console.log(`${colors.red}❌ Auth callback route returns error: ${res.statusCode}${colors.reset}`);
      }
    }).on('error', () => {
      console.log(`${colors.red}❌ Auth callback route not reachable${colors.reset}`);
    });
  }).on('error', () => {
    console.log(`${colors.red}❌ Local dev server not running${colors.reset}`);
    console.log(`${colors.yellow}Fix: Run 'npm run dev' first${colors.reset}`);
  });
}

testLocalServer();

// Generate fix instructions
setTimeout(() => {
  console.log(`\n${colors.blue}5. Step-by-Step Fix Instructions${colors.reset}`);
  console.log('---------------------------------');
  
  console.log(`\n${colors.yellow}On the NEW PC, follow these steps:${colors.reset}\n`);
  
  console.log('1. Copy environment file from OLD PC:');
  console.log('   - Copy .env.local from OLD PC to NEW PC');
  console.log('   - Or create new .env.local with correct values\n');
  
  console.log('2. Configure browser:');
  console.log('   - Chrome Settings → Privacy → Cookies → Allow all cookies');
  console.log('   - Or add cookie exception for: [*.]supabase.co\n');
  
  console.log('3. Clear browser data:');
  console.log('   - Clear all cookies for localhost:3000');
  console.log('   - Clear all cookies for *.supabase.co\n');
  
  console.log('4. Verify Supabase Dashboard:');
  console.log(`   - Go to: https://supabase.com/dashboard/project/${projectRef}/auth/url-configuration`);
  console.log('   - Site URL should include: http://localhost:3000');
  console.log('   - Redirect URLs should include: http://localhost:3000/**\n');
  
  console.log('5. Test the fix:');
  console.log('   - Run: npm run dev');
  console.log('   - Open: http://localhost:3000/login');
  console.log('   - Click Google login');
  console.log('   - Should redirect to dashboard after success\n');
  
  console.log(`${colors.green}✅ Configuration test complete${colors.reset}`);
}, 1000);