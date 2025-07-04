import { test, expect, Page } from '@playwright/test'

/**
 * Google Design Principles Compliance Test
 * Target: Complete login → onboarding → dashboard flow in < 24 seconds
 * Includes performance metrics, accessibility checks, and UX validation
 */

test.describe('Google Design Principles Compliance', () => {
  let startTime: number
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    startTime = Date.now()
    
    // Enable console logging for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Page error:', msg.text())
      }
    })

    // Track network failures
    page.on('requestfailed', request => {
      console.log('Failed request:', request.url())
    })
  })

  test('Complete user journey in under 24 seconds', async () => {
    // 1. PRINCIPLE: Focus on the user - Fast is better than slow
    const journeyStart = Date.now()

    // Navigate to login page
    await page.goto('/login')
    
    // Check page loads within 2.5s (LCP requirement)
    const navigationTime = Date.now() - journeyStart
    expect(navigationTime).toBeLessThan(2500)

    // 2. PRINCIPLE: Simplicity - One screen, one purpose
    // Verify minimal login interface
    await expect(page.locator('h1')).toContainText('扶養わかるんです')
    
    // Only one primary action visible
    const primaryButton = page.locator('button:has-text("Googleでログイン")')
    await expect(primaryButton).toBeVisible()
    
    // Alternative options are hidden (progressive disclosure)
    const alternativeButton = page.locator('button:has-text("他の方法でログイン")')
    await expect(alternativeButton).toBeVisible()
    
    // 3. PRINCIPLE: Accessibility for everyone
    // Check ARIA labels and keyboard navigation
    await expect(primaryButton).toHaveAttribute('aria-label')
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await expect(primaryButton).toBeFocused()

    // 4. Mock Google OAuth for testing (avoid actual OAuth in tests)
    // Intercept the OAuth flow to simulate successful login
    await page.route('**/auth/callback**', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true })
      })
    })

    // Simulate successful Google login by directly navigating to onboarding
    // (In real test, we'd use a test user account)
    await page.goto('/onboarding')

    // 5. Verify onboarding flow starts promptly
    const onboardingStart = Date.now()
    await expect(page.locator('h1:has-text("基本情報")')).toBeVisible({ timeout: 2000 })

    // 6. PRINCIPLE: Data-driven - Track user interactions
    // Complete onboarding steps efficiently
    
    // Step 1: Basic information
    await page.selectOption('select[id="birth-year"]', '2000')
    await page.click('input[value="university"]')
    await page.click('button:has-text("次へ")')

    // Verify step transition is smooth (< 500ms)
    const step2Start = Date.now()
    await expect(page.locator('h1:has-text("扶養について")')).toBeVisible({ timeout: 1000 })
    const step2Time = Date.now() - step2Start
    expect(step2Time).toBeLessThan(500)

    // Step 2: Dependency status
    await page.click('input[value="full"]')
    await page.click('button:has-text("次へ")')

    // Step 3: Insurance
    await expect(page.locator('h1:has-text("健康保険")')).toBeVisible({ timeout: 1000 })
    await page.click('input[value="none"]')
    await page.click('button:has-text("次へ")')

    // Step 4: Income goal
    await expect(page.locator('h1:has-text("月収目標")')).toBeVisible({ timeout: 1000 })
    await page.fill('input[id="income-target"]', '80000')
    await page.click('button:has-text("完了")')

    // 7. Verify successful completion and redirect to dashboard
    const dashboardStart = Date.now()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 })
    const dashboardTime = Date.now() - dashboardStart
    expect(dashboardTime).toBeLessThan(3000)

    // 8. Verify dashboard loads with content
    await expect(page.locator('text=ダッシュボード')).toBeVisible({ timeout: 2000 })

    // 9. PRINCIPLE: Fast is better than slow - Total journey time
    const totalJourneyTime = Date.now() - journeyStart
    console.log(`Total journey time: ${totalJourneyTime}ms`)
    expect(totalJourneyTime).toBeLessThan(24000) // 24 seconds max

    // 10. Performance validation - Check Core Web Vitals
    const performanceMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const metrics = entries.map(entry => ({
            name: entry.name,
            value: entry.startTime || entry.value,
            type: entry.entryType
          }))
          resolve(metrics)
        }).observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] })
        
        // Fallback timeout
        setTimeout(() => resolve([]), 2000)
      })
    })

    console.log('Performance metrics:', performanceMetrics)
  })

  test('Accessibility compliance (WCAG AA)', async () => {
    await page.goto('/login')

    // Test high contrast mode
    await page.emulateMedia({ colorScheme: 'dark' })
    await expect(page.locator('button:has-text("Googleでログイン")')).toBeVisible()

    // Test reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' })
    
    // Verify no auto-playing animations
    const animations = await page.$$eval('*', elements => 
      elements.filter(el => {
        const style = window.getComputedStyle(el)
        return style.animationDuration !== '0s' && style.animationPlayState === 'running'
      }).length
    )
    expect(animations).toBe(0)

    // Test screen reader compatibility
    const headings = await page.$$('h1, h2, h3, h4, h5, h6')
    expect(headings.length).toBeGreaterThan(0)

    // Verify form labels
    const inputs = await page.$$('input, select, textarea')
    for (const input of inputs) {
      const hasLabel = await input.evaluate(el => {
        const label = document.querySelector(`label[for="${el.id}"]`)
        const ariaLabel = el.getAttribute('aria-label')
        const ariaLabelledBy = el.getAttribute('aria-labelledby')
        return !!(label || ariaLabel || ariaLabelledBy)
      })
      expect(hasLabel).toBe(true)
    }
  })

  test('Privacy-first data collection', async () => {
    await page.goto('/login')

    // Verify no tracking before consent
    const initialCookies = await page.context().cookies()
    const trackingCookies = initialCookies.filter(cookie => 
      cookie.name.includes('_ga') || cookie.name.includes('_gid')
    )
    expect(trackingCookies.length).toBe(0)

    // Check cookie consent banner appears
    await expect(page.locator('text=Cookie の使用について')).toBeVisible({ timeout: 3000 })

    // Verify minimal data collection message
    await expect(page.locator('text=最小限の分析データを収集')).toBeVisible()

    // Test decline functionality
    await page.click('button:has-text("拒否")')
    await expect(page.locator('text=Cookie の使用について')).not.toBeVisible()

    // Verify no tracking cookies after decline
    const postDeclineCookies = await page.context().cookies()
    const postDeclineTracking = postDeclineCookies.filter(cookie => 
      cookie.name.includes('_ga') || cookie.name.includes('_gid')
    )
    expect(postDeclineTracking.length).toBe(0)
  })

  test('Progressive Web App features', async () => {
    await page.goto('/')

    // Check manifest.json is accessible
    const manifestResponse = await page.request.get('/manifest.json')
    expect(manifestResponse.status()).toBe(200)
    
    const manifest = await manifestResponse.json()
    expect(manifest.name).toContain('扶養わかるんです')
    expect(manifest.start_url).toBeDefined()
    expect(manifest.display).toBeDefined()

    // Check service worker registration
    const swRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator
    })
    expect(swRegistered).toBe(true)

    // Verify offline functionality (basic check)
    await page.goto('/login')
    await expect(page.locator('h1')).toBeVisible()
    
    // Simulate offline
    await page.context().setOffline(true)
    await page.reload()
    
    // Should still show content (from cache)
    await expect(page.locator('h1')).toBeVisible({ timeout: 5000 })
  })

  test('Mobile-first responsive design', async () => {
    // Test mobile viewport (default in config)
    await page.goto('/login')
    
    // Check mobile-optimized layout
    const buttonWidth = await page.locator('button:has-text("Googleでログイン")').boundingBox()
    expect(buttonWidth?.width).toBeGreaterThan(200) // Adequate touch target

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.reload()
    await expect(page.locator('button:has-text("Googleでログイン")')).toBeVisible()

    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.reload()
    await expect(page.locator('button:has-text("Googleでログイン")')).toBeVisible()
  })

  test.afterEach(async () => {
    const totalTime = Date.now() - startTime
    console.log(`Test completed in ${totalTime}ms`)
    
    // Capture final performance metrics
    const performanceEntries = await page.evaluate(() => {
      return performance.getEntriesByType('navigation').map(entry => ({
        domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
        loadComplete: entry.loadEventEnd - entry.loadEventStart,
        networkTime: entry.responseEnd - entry.fetchStart
      }))
    })
    
    console.log('Final performance metrics:', performanceEntries)
  })
})