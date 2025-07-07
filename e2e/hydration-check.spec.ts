import { test, expect } from '@playwright/test'

test.describe('Hydration Mismatch Detection', () => {
  let consoleErrors: string[] = []

  test.beforeEach(async ({ page }) => {
    consoleErrors = []
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text()
        // Check for React hydration errors
        if (text.includes('hydrated') || 
            text.includes('Hydration') || 
            text.includes('did not match') ||
            text.includes('Text content does not match') ||
            text.includes('server-rendered HTML')) {
          consoleErrors.push(text)
        }
      }
    })

    // Also listen for page errors
    page.on('pageerror', error => {
      const message = error.message
      if (message.includes('hydrat')) {
        consoleErrors.push(`Page error: ${message}`)
      }
    })
  })

  test('should not have hydration errors on login page', async ({ page }) => {
    await page.goto('/login')
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    
    // Wait a bit more to catch any delayed hydration errors
    await page.waitForTimeout(2000)
    
    // Check for hydration errors
    expect(consoleErrors, `Found hydration errors: ${consoleErrors.join('\n')}`).toHaveLength(0)
  })

  test('should not have hydration errors on home page', async ({ page }) => {
    await page.goto('/')
    
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    expect(consoleErrors, `Found hydration errors: ${consoleErrors.join('\n')}`).toHaveLength(0)
  })

  test('should not have hydration errors after Google OAuth login', async ({ page }) => {
    // Go to login page
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    // Click Google login button (but it will redirect, we just want to check for errors)
    const googleButton = page.getByRole('button', { name: /Google/i })
    await expect(googleButton).toBeVisible()
    
    // Wait to catch any hydration errors from rendering the login button
    await page.waitForTimeout(2000)
    
    expect(consoleErrors, `Found hydration errors: ${consoleErrors.join('\n')}`).toHaveLength(0)
  })

  test('should not have hydration errors on dashboard (with mock auth)', async ({ page }) => {
    // Mock authentication by setting cookies/session
    await page.addInitScript(() => {
      // Mock a logged-in state in localStorage
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh',
        user: {
          id: 'mock-user-id',
          email: 'test@example.com'
        }
      }))
    })
    
    await page.goto('/dashboard')
    
    // Dashboard might redirect to login, but we're checking for hydration errors
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    expect(consoleErrors, `Found hydration errors: ${consoleErrors.join('\n')}`).toHaveLength(0)
  })

  test('should not have className mismatch on body element', async ({ page }) => {
    await page.goto('/')
    
    // Check that body className is consistent
    const bodyClassNames = await page.evaluate(() => {
      const body = document.body
      return {
        actual: body.className,
        hasGeistFont: body.className.includes('geist'),
        hasAntialiased: body.className.includes('antialiased')
      }
    })
    
    expect(bodyClassNames.hasGeistFont).toBe(true)
    expect(bodyClassNames.hasAntialiased).toBe(true)
    
    // No hydration errors should occur
    expect(consoleErrors, `Found hydration errors: ${consoleErrors.join('\n')}`).toHaveLength(0)
  })
})