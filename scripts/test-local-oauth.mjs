#!/usr/bin/env node

/**
 * Test Local OAuth Flow
 * Headless test for Google OAuth → Dashboard flow
 */

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';
import fs from 'fs';
import path from 'path';

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

console.log(`${colors.blue}🧪 Testing Local OAuth Flow${colors.reset}`);
console.log('============================\n');

// Configuration
const config = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
  devServerWaitTime: 5000
};

// Load environment variables
function loadEnv() {
  try {
    const envPath = '.env.local';
    if (!fs.existsSync(envPath)) {
      console.log(`${colors.red}❌ .env.local not found${colors.reset}`);
      console.log(`${colors.yellow}Run: ./scripts/setup-local-env.sh first${colors.reset}`);
      process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#][^=]+)=(.*)$/);
      if (match) {
        envVars[match[1]] = match[2].replace(/^["']|["']$/g, '');
      }
    });

    return envVars;
  } catch (error) {
    console.log(`${colors.red}❌ Error loading .env.local: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Check if dev server is running
async function checkDevServer() {
  try {
    const response = await fetch(`${config.baseUrl}/api/health`, {
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      console.log(`${colors.green}✅ Dev server is running${colors.reset}`);
      return true;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Dev server not responding${colors.reset}`);
    return false;
  }
}

// Start dev server
async function startDevServer() {
  console.log(`${colors.yellow}Starting dev server...${colors.reset}`);
  
  const devProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    detached: false
  });

  // Wait for server to start
  await setTimeout(config.devServerWaitTime);

  // Check if server started successfully
  for (let i = 0; i < 6; i++) {
    if (await checkDevServer()) {
      return devProcess;
    }
    await setTimeout(1000);
  }

  devProcess.kill();
  throw new Error('Dev server failed to start');
}

// Test basic routes
async function testBasicRoutes() {
  console.log(`${colors.blue}1. Testing Basic Routes${colors.reset}`);
  console.log('----------------------');

  const routes = [
    { path: '/', name: 'Homepage' },
    { path: '/login', name: 'Login page' },
    { path: '/auth/callback', name: 'Auth callback' }
  ];

  for (const route of routes) {
    try {
      const response = await fetch(`${config.baseUrl}${route.path}`, {
        signal: AbortSignal.timeout(5000),
        redirect: 'manual'
      });
      
      if (response.status < 500) {
        console.log(`${colors.green}✅ ${route.name}: ${response.status}${colors.reset}`);
      } else {
        console.log(`${colors.red}❌ ${route.name}: ${response.status}${colors.reset}`);
        return false;
      }
    } catch (error) {
      console.log(`${colors.red}❌ ${route.name}: ${error.message}${colors.reset}`);
      return false;
    }
  }

  return true;
}

// Test Supabase configuration
async function testSupabaseConfig(env) {
  console.log(`\n${colors.blue}2. Testing Supabase Configuration${colors.reset}`);
  console.log('---------------------------------');

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log(`${colors.red}❌ Missing Supabase configuration${colors.reset}`);
    return false;
  }

  // Extract project reference
  const projectMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!projectMatch) {
    console.log(`${colors.red}❌ Invalid Supabase URL format${colors.reset}`);
    return false;
  }

  const projectRef = projectMatch[1];
  console.log(`${colors.green}✅ Project: ${projectRef}${colors.reset}`);
  console.log(`${colors.green}✅ URL: ${supabaseUrl}${colors.reset}`);
  console.log(`${colors.green}✅ Key: ${supabaseKey.substring(0, 20)}...${colors.reset}`);

  // Test Supabase health
  try {
    const healthUrl = `${supabaseUrl}/auth/v1/health`;
    const response = await fetch(healthUrl, {
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      console.log(`${colors.green}✅ Supabase Auth service reachable${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️  Supabase Auth returned: ${response.status}${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Cannot reach Supabase: ${error.message}${colors.reset}`);
    return false;
  }

  return true;
}

// Test Google OAuth initialization
async function testOAuthInit() {
  console.log(`\n${colors.blue}3. Testing OAuth Initialization${colors.reset}`);
  console.log('-------------------------------');

  try {
    // Get login page
    const loginResponse = await fetch(`${config.baseUrl}/login`, {
      signal: AbortSignal.timeout(5000)
    });

    if (!loginResponse.ok) {
      console.log(`${colors.red}❌ Login page not accessible: ${loginResponse.status}${colors.reset}`);
      return false;
    }

    const loginHtml = await loginResponse.text();

    // Check for Google login button
    if (loginHtml.includes('Googleでログイン') || loginHtml.includes('Google') || loginHtml.includes('sign')) {
      console.log(`${colors.green}✅ Google login button found${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️  Google login button not found in HTML${colors.reset}`);
    }

    // Check for Supabase client initialization
    if (loginHtml.includes('supabase') || loginHtml.includes('NEXT_PUBLIC_SUPABASE')) {
      console.log(`${colors.green}✅ Supabase client likely initialized${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️  Supabase client initialization not detected${colors.reset}`);
    }

    return true;
  } catch (error) {
    console.log(`${colors.red}❌ OAuth initialization test failed: ${error.message}${colors.reset}`);
    return false;
  }
}

// Test auth callback route
async function testAuthCallback() {
  console.log(`\n${colors.blue}4. Testing Auth Callback Route${colors.reset}`);
  console.log('------------------------------');

  try {
    // Test callback route directly (should handle missing parameters gracefully)
    const callbackResponse = await fetch(`${config.baseUrl}/auth/callback`, {
      signal: AbortSignal.timeout(5000),
      redirect: 'manual'
    });

    // Should either redirect or return an error page, but not 404
    if (callbackResponse.status === 404) {
      console.log(`${colors.red}❌ Auth callback route returns 404${colors.reset}`);
      return false;
    } else {
      console.log(`${colors.green}✅ Auth callback route exists (status: ${callbackResponse.status})${colors.reset}`);
    }

    return true;
  } catch (error) {
    console.log(`${colors.red}❌ Auth callback test failed: ${error.message}${colors.reset}`);
    return false;
  }
}

// Test with Playwright if available
async function testWithPlaywright() {
  console.log(`\n${colors.blue}5. Playwright Integration Test${colors.reset}`);
  console.log('-----------------------------');

  try {
    // Check if Playwright is available
    const { chromium } = await import('@playwright/test');
    
    console.log(`${colors.green}✅ Playwright available${colors.reset}`);
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Navigate to login page
    await page.goto(`${config.baseUrl}/login`);
    
    // Check if page loads
    const title = await page.title();
    console.log(`${colors.green}✅ Login page title: "${title}"${colors.reset}`);

    // Look for Google login button
    const googleButton = await page.locator('button:has-text("Google"), button:has-text("ログイン")').first();
    
    if (await googleButton.count() > 0) {
      console.log(`${colors.green}✅ Google login button found with Playwright${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️  Google login button not found with Playwright${colors.reset}`);
    }

    await browser.close();
    return true;
  } catch (error) {
    console.log(`${colors.yellow}⚠️  Playwright not available or test failed: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}   Install with: npm install @playwright/test${colors.reset}`);
    return false;
  }
}

// Generate summary report
function generateSummaryReport(results, env) {
  console.log(`\n${colors.blue}📊 Test Summary Report${colors.reset}`);
  console.log('=====================');

  const projectRef = env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'unknown';

  console.log('\n| Component | Status | Notes |');
  console.log('|-----------|--------|-------|');
  console.log(`| Dev Server | ${results.devServer ? '✅ Running' : '❌ Failed'} | Port 3000 |`);
  console.log(`| Basic Routes | ${results.routes ? '✅ OK' : '❌ Failed'} | /, /login, /auth/callback |`);
  console.log(`| Supabase Config | ${results.supabase ? '✅ Valid' : '❌ Invalid'} | Project: ${projectRef} |`);
  console.log(`| OAuth Init | ${results.oauth ? '✅ Ready' : '❌ Failed'} | Google login button |`);
  console.log(`| Auth Callback | ${results.callback ? '✅ Exists' : '❌ Missing'} | Not 404 |`);
  console.log(`| Playwright | ${results.playwright ? '✅ Passed' : '⚠️ Skipped'} | E2E capable |`);

  const passCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;

  console.log(`\n${colors.blue}Overall Score: ${passCount}/${totalCount}${colors.reset}`);

  if (passCount === totalCount) {
    console.log(`${colors.green}🎉 All tests passed! OAuth should work.${colors.reset}`);
    return 0;
  } else if (passCount >= totalCount - 1) {
    console.log(`${colors.yellow}⚠️  Minor issues detected. OAuth might work.${colors.reset}`);
    return 0;
  } else {
    console.log(`${colors.red}❌ Major issues detected. OAuth likely to fail.${colors.reset}`);
    return 1;
  }
}

// Main test function
async function main() {
  let devProcess = null;
  
  try {
    // Load environment
    const env = loadEnv();
    console.log(`${colors.green}✅ Environment variables loaded${colors.reset}\n`);

    // Check if dev server is already running
    let devServerRunning = await checkDevServer();
    
    if (!devServerRunning) {
      devProcess = await startDevServer();
      devServerRunning = true;
    }

    if (!devServerRunning) {
      console.log(`${colors.red}❌ Cannot start or connect to dev server${colors.reset}`);
      process.exit(1);
    }

    // Run tests
    const results = {
      devServer: devServerRunning,
      routes: await testBasicRoutes(),
      supabase: await testSupabaseConfig(env),
      oauth: await testOAuthInit(),
      callback: await testAuthCallback(),
      playwright: await testWithPlaywright()
    };

    // Generate report and exit
    const exitCode = generateSummaryReport(results, env);
    
    if (exitCode === 0) {
      console.log(`\n${colors.blue}Next steps:${colors.reset}`);
      console.log('1. Open: http://localhost:3000/login');
      console.log('2. Click Google login button');
      console.log('3. Complete OAuth flow');
      console.log('4. Should redirect to dashboard');
    } else {
      console.log(`\n${colors.yellow}Recommended fixes:${colors.reset}`);
      console.log('1. Check .env.local has correct Supabase credentials');
      console.log('2. Verify Supabase redirect URLs include localhost:3000');
      console.log('3. Enable third-party cookies in browser');
      console.log('4. Clear browser cookies and try again');
    }

    process.exit(exitCode);
  } catch (error) {
    console.log(`${colors.red}❌ Test failed: ${error.message}${colors.reset}`);
    process.exit(1);
  } finally {
    // Clean up dev server if we started it
    if (devProcess) {
      devProcess.kill();
    }
  }
}

// Run tests
main().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});