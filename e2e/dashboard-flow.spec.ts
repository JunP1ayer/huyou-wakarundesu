/**
 * Dashboard Flow E2E Tests
 * Tests the complete dashboard loading and income data display flow
 */

import { test, expect, Page } from '@playwright/test'

// Helper function to mock login (since we can't do real OAuth in tests)
async function mockLoginAndNavigate(page: Page) {
  // Navigate to dashboard directly (assuming user is logged in via test setup)
  await page.goto('/dashboard')
  
  // Alternative: if we need to simulate login state
  // We can set localStorage or cookies to simulate authenticated state
  await page.addInitScript(() => {
    // Mock authenticated state for testing
    window.localStorage.setItem('test-authenticated', 'true')
  })
}

test.describe('Dashboard Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated state for each test
    await mockLoginAndNavigate(page)
  })

  test('dashboard loads and displays income data or error message', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle')
    
    // Check that either income data is displayed or a clear error message is shown
    // This test passes if we see any of these conditions:
    // 1. Income data table/grid is visible
    // 2. Loading state is shown briefly then resolves
    // 3. Clear error message is displayed
    // 4. Empty state message is shown
    
    const incomeDataVisible = page.locator('text=/今年の収入|月別収入|収入データ/i')
    const errorMessageVisible = page.locator('text=/エラー|失敗|読み込み.*失敗|データ.*取得.*失敗/i')
    const emptyStateVisible = page.locator('text=/未入力|データがありません|収入が登録されていません/i')
    const loadingStateVisible = page.locator('text=/読み込み中|loading/i')
    
    // Wait for either success or error state (not infinite loading)
    await expect(async () => {
      const hasIncomeData = await incomeDataVisible.isVisible()
      const hasError = await errorMessageVisible.isVisible()
      const hasEmptyState = await emptyStateVisible.isVisible()
      const isLoading = await loadingStateVisible.isVisible()
      
      // Test passes if we see any resolved state (not stuck in loading)
      expect(hasIncomeData || hasError || hasEmptyState || !isLoading).toBe(true)
    }).toPass({ timeout: 30000 }) // 30 second timeout to detect infinite loading
  })

  test('dashboard shows profile information', async ({ page }) => {
    // Check that user profile section is visible
    await expect(page.locator('text=/あなたの設定|プロフィール|扶養状況/i')).toBeVisible()
    
    // Check that some profile data is displayed (even if defaults)
    await expect(page.locator('text=/扶養|健康保険|月収/i')).toBeVisible()
  })

  test('dashboard handles navigation correctly', async ({ page }) => {
    // Verify we're on the dashboard page
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Check that dashboard header/title is present
    await expect(page.locator('text=/扶養わかるんです|Dashboard/i')).toBeVisible()
  })

  test('income input form is functional', async ({ page }) => {
    // Look for income input elements
    const incomeInputs = page.locator('input[type="number"], button:has-text("入力"), button:has-text("編集")')
    
    // Check if income input interface is available
    const hasInputInterface = await incomeInputs.count() > 0
    
    if (hasInputInterface) {
      // If income inputs are available, test basic interaction
      const firstInput = incomeInputs.first()
      await expect(firstInput).toBeVisible()
      
      // Check that input is interactable
      await firstInput.click()
    } else {
      // If no input interface, verify appropriate message is shown
      await expect(page.locator('text=/設定|ログイン|エラー/i')).toBeVisible()
    }
  })

  test('dashboard does not show infinite loading spinner', async ({ page }) => {
    // Wait for initial load
    await page.waitForLoadState('networkidle')
    
    // Check that loading spinner disappears within reasonable time
    const loadingSpinner = page.locator('.animate-spin, text=/読み込み中|Loading/i')
    
    // If spinner is present, it should disappear within 10 seconds
    if (await loadingSpinner.isVisible()) {
      await expect(loadingSpinner).not.toBeVisible({ timeout: 10000 })
    }
    
    // Verify page has rendered some content (not stuck in loading)
    await expect(page.locator('body')).not.toBeEmpty()
    
    // Verify we have some meaningful content
    const hasContent = await page.locator('text=/扶養|収入|Dashboard|設定|エラー/i').isVisible()
    expect(hasContent).toBe(true)
  })

  test('error messages are displayed when data loading fails', async ({ page }) => {
    // Mock network failure to test error handling
    await page.route('**/api/**', (route) => {
      // Simulate API failure for testing error handling
      route.abort('failed')
    })
    
    // Reload page to trigger failed requests
    await page.reload()
    
    // Wait for error state to appear
    await expect(page.locator('text=/エラー|失敗|問題|Error/i')).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Dashboard Performance', () => {
  test('dashboard loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Dashboard should load within 10 seconds
    expect(loadTime).toBeLessThan(10000)
  })

  test('dashboard handles offline state gracefully', async ({ page }) => {
    // Navigate to dashboard first
    await page.goto('/dashboard')
    
    // Simulate offline state
    await page.context().setOffline(true)
    
    // Reload to test offline behavior
    await page.reload({ waitUntil: 'networkidle' })
    
    // Should show some indication of offline state or cached content
    const hasOfflineIndication = await page.locator('text=/オフライン|offline|ネットワーク|接続|Error/i').isVisible()
    const hasCachedContent = await page.locator('text=/扶養|Dashboard/i').isVisible()
    
    expect(hasOfflineIndication || hasCachedContent).toBe(true)
  })
})