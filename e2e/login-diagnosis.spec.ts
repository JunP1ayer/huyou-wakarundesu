import { test, expect } from '@playwright/test'
import { BrowserContext, Page } from '@playwright/test'

test.describe('Login Diagnosis - Dashboard Spinning Issue', () => {
  let networkLogs: Array<{url: string, status: number, method: string}> = []
  let consoleLogs: Array<{type: string, text: string}> = []
  
  test.beforeEach(async ({ page, context }) => {
    networkLogs = []
    consoleLogs = []
    
    // Capture network requests
    page.on('response', response => {
      networkLogs.push({
        url: response.url(),
        status: response.status(),
        method: response.request().method()
      })
    })
    
    // Capture console logs
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text()
      })
    })
    
    // Capture page errors
    page.on('pageerror', error => {
      consoleLogs.push({
        type: 'pageerror',
        text: error.message
      })
    })
  })

  test('diagnose login flow and dashboard loading', async ({ page, context }) => {
    console.log('🔍 Starting login diagnosis...')
    
    // Start dev server if needed
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    // Check if Google login button is present
    const googleButton = page.getByRole('button', { name: /Google/i })
    await expect(googleButton).toBeVisible()
    
    console.log('✅ Login page loaded successfully')
    
    // Since we can't do actual Google OAuth, let's mock the auth state
    // First, let's check cookies before mock login
    const cookiesBefore = await context.cookies()
    console.log('🍪 Cookies before mock login:', cookiesBefore.map(c => c.name))
    
    // Mock authentication by injecting session data
    await page.addInitScript(() => {
      // Mock Supabase session in localStorage
      const mockSession = {
        access_token: 'mock-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'mock-refresh-token',
        user: {
          id: 'mock-user-id',
          email: 'test@example.com',
          user_metadata: {},
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
      
      // Store in localStorage as Supabase does
      localStorage.setItem('supabase.auth.token', JSON.stringify(mockSession))
    })
    
    // Set mock cookies to simulate successful auth
    await context.addCookies([
      {
        name: 'sb-access-token',
        value: 'mock-access-token',
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax'
      },
      {
        name: 'sb-refresh-token', 
        value: 'mock-refresh-token',
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax'
      }
    ])
    
    console.log('🔒 Mock authentication setup complete')
    
    // Now navigate to dashboard and monitor behavior
    await page.goto('/dashboard')
    
    console.log('📍 Navigated to dashboard, waiting for loading...')
    
    // Wait and monitor for spinning/loading state
    const loadingSpinner = page.locator('[role="status"], .animate-spin, .spinner')
    
    // Give it some time to potentially resolve
    await page.waitForTimeout(5000)
    
    // Check if still spinning
    const isStillSpinning = await loadingSpinner.count() > 0
    
    // Check cookies after navigation
    const cookiesAfter = await context.cookies()
    console.log('🍪 Cookies after dashboard navigation:', cookiesAfter.map(c => c.name))
    
    // Filter relevant network requests
    const authRequests = networkLogs.filter(log => 
      log.url.includes('/auth/') || 
      log.url.includes('supabase') ||
      log.url.includes('/user') ||
      log.url.includes('/token')
    )
    
    const failedRequests = networkLogs.filter(log => log.status >= 400)
    
    // Filter relevant console logs
    const authLogs = consoleLogs.filter(log => 
      log.text.includes('auth') || 
      log.text.includes('session') ||
      log.text.includes('token') ||
      log.text.includes('unauthorized') ||
      log.text.includes('401') ||
      log.text.includes('error')
    )
    
    console.log('=== DIAGNOSIS RESULTS ===')
    console.log('🔄 Still spinning after 5s:', isStillSpinning)
    console.log('🌐 Auth-related requests:', authRequests)
    console.log('❌ Failed requests (4xx/5xx):', failedRequests)
    console.log('📝 Auth-related console logs:', authLogs)
    console.log('🍪 Final cookies:', cookiesAfter.filter(c => c.name.includes('sb')))
    
    // Create diagnostic summary
    const diagnostic = {
      isSpinning: isStillSpinning,
      authRequests: authRequests,
      failedRequests: failedRequests,
      authLogs: authLogs,
      cookiesPresent: cookiesAfter.filter(c => c.name.startsWith('sb')).length > 0,
      potentialIssue: failedRequests.length > 0 ? 'Failed auth requests detected' : isStillSpinning ? 'Still spinning - likely getSession() vs getUser() issue' : 'No obvious issues'
    }
    
    // Output diagnosis for review
    console.log('📊 FINAL DIAGNOSIS:', JSON.stringify(diagnostic, null, 2))
    
    // The test passes regardless - we're just collecting diagnostic data
    expect(true).toBe(true)
  })

  test('check real auth endpoints without login', async ({ page }) => {
    console.log('🔍 Testing auth endpoints without authentication...')
    
    // Go to dashboard without auth to see what happens
    await page.goto('/dashboard')
    await page.waitForTimeout(3000)
    
    // Check for redirect to login
    const currentUrl = page.url()
    const redirectedToLogin = currentUrl.includes('/login')
    
    const unauthorizedRequests = networkLogs.filter(log => log.status === 401)
    const authEndpointRequests = networkLogs.filter(log => 
      log.url.includes('/auth/v1/user') || 
      log.url.includes('/auth/v1/token')
    )
    
    console.log('🔄 Redirected to login:', redirectedToLogin)
    console.log('🚫 401 Unauthorized requests:', unauthorizedRequests)
    console.log('🔑 Auth endpoint requests:', authEndpointRequests)
    
    expect(true).toBe(true) // Just collecting data
  })
})