/**
 * Playwright E2E Security Test: Profile Complete Flow
 * セキュリティ、認証フロー、UXの包括的E2Eテスト
 */

import { test, expect, Page, BrowserContext } from '@playwright/test'

// テスト用ユーザー
const TEST_USER = {
  email: 'test@example.com',
  password: 'test-password-123'
}

// テストユーティリティ
async function fillOnboardingForm(page: Page, data: {
  isStudent: boolean
  usingFamilyInsurance: boolean
  isOver20hContract: boolean
}) {
  // Step 1: 学生確認
  await page.click(data.isStudent ? 'text=はい、学生です' : 'text=いいえ、学生ではありません')
  
  // Step 2: 健康保険確認
  await page.click(data.usingFamilyInsurance ? 'text=はい、家族の保険証を使っています' : 'text=いいえ、自分で加入しています')
  
  // Step 3: 労働契約確認
  await page.click(data.isOver20hContract ? 'text=はい、20時間以上です' : 'text=いいえ、20時間未満です')
}

async function interceptApiCall(page: Page, responseOverride?: any) {
  return await page.route('**/api/profile/complete', async route => {
    if (responseOverride) {
      await route.fulfill({
        status: responseOverride.status || 200,
        contentType: 'application/json',
        body: JSON.stringify(responseOverride.body)
      })
    } else {
      await route.continue()
    }
  })
}

test.describe('Profile Complete - セキュリティ & 認証フロー', () => {
  
  test.describe('🔐 認証フロー検証', () => {
    test('未認証ユーザーは401エラーでログイン画面にリダイレクト', async ({ page }) => {
      // 認証なしでAPIを直接呼び出し
      await interceptApiCall(page, {
        status: 401,
        body: {
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
          redirectTo: '/login'
        }
      })

      await page.goto('/onboarding')
      
      // オンボーディングフォーム完了
      await fillOnboardingForm(page, {
        isStudent: true,
        usingFamilyInsurance: true,
        isOver20hContract: false
      })

      // リダイレクトの確認
      await expect(page).toHaveURL('/login')
      
      // エラーメッセージの確認
      await expect(page.locator('text=認証エラー')).toBeVisible({ timeout: 5000 })
    })

    test('セッション期限切れは適切なエラーメッセージを表示', async ({ page }) => {
      await interceptApiCall(page, {
        status: 401,
        body: {
          error: 'Session expired',
          code: 'SESSION_EXPIRED',
          redirectTo: '/login'
        }
      })

      await page.goto('/onboarding')
      
      await fillOnboardingForm(page, {
        isStudent: true,
        usingFamilyInsurance: true,
        isOver20hContract: false
      })

      // セッション期限切れ専用メッセージの確認
      await expect(page.locator('text=セッションが期限切れです')).toBeVisible({ timeout: 5000 })
      await expect(page).toHaveURL('/login')
    })

    test('認証済みユーザーは正常にプロフィール完了', async ({ page }) => {
      await interceptApiCall(page, {
        status: 200,
        body: {
          success: true,
          allowance: 103,
          profile: {
            user_id: 'test-user-123',
            is_student: true,
            annual_income: 1000000,
            is_over_20h: false,
            fuyou_line: 1030000,
            profile_completed: true,
            profile_completed_at: '2025-01-01T00:00:00.000Z',
            updated_at: '2025-01-01T00:00:00.000Z'
          }
        }
      })

      await page.goto('/onboarding')
      
      await fillOnboardingForm(page, {
        isStudent: true,
        usingFamilyInsurance: true,
        isOver20hContract: false
      })

      // 成功時の結果ページ遷移
      await expect(page).toHaveURL(/\\/result\\?allowance=103/)
      await expect(page.locator('text=103')).toBeVisible()
      await expect(page.locator('text=万円')).toBeVisible()
    })
  })

  test.describe('🛡️ 入力値検証 & セキュリティ', () => {
    test('不正な入力値で適切なエラーメッセージ表示', async ({ page }) => {
      await interceptApiCall(page, {
        status: 400,
        body: {
          error: 'Annual income must be between 0 and 50,000,000 yen',
          code: 'VALIDATION_ERROR'
        }
      })

      await page.goto('/onboarding')
      
      await fillOnboardingForm(page, {
        isStudent: true,
        usingFamilyInsurance: true,
        isOver20hContract: false
      })

      await expect(page.locator('text=入力データに問題があります')).toBeVisible({ timeout: 5000 })
    })

    test('データベースエラーで適切なエラーメッセージ表示', async ({ page }) => {
      await interceptApiCall(page, {
        status: 500,
        body: {
          error: 'Failed to save profile',
          code: 'DATABASE_ERROR'
        }
      })

      await page.goto('/onboarding')
      
      await fillOnboardingForm(page, {
        isStudent: true,
        usingFamilyInsurance: true,
        isOver20hContract: false
      })

      await expect(page.locator('text=データの保存に失敗しました')).toBeVisible({ timeout: 5000 })
    })

    test('内部サーバーエラーで適切なエラーメッセージ表示', async ({ page }) => {
      await interceptApiCall(page, {
        status: 500,
        body: {
          error: 'Internal server error',
          code: 'INTERNAL_ERROR'
        }
      })

      await page.goto('/onboarding')
      
      await fillOnboardingForm(page, {
        isStudent: true,
        usingFamilyInsurance: true,
        isOver20hContract: false
      })

      await expect(page.locator('text=システムエラーが発生しました')).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('🎯 UX & パフォーマンス', () => {
    test('ローディング状態の適切な表示', async ({ page }) => {
      // API呼び出しを遅延させる
      await page.route('**/api/profile/complete', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000)) // 2秒遅延
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            allowance: 103,
            profile: {}
          })
        })
      })

      await page.goto('/onboarding')
      
      await fillOnboardingForm(page, {
        isStudent: true,
        usingFamilyInsurance: true,
        isOver20hContract: false
      })

      // ローディングスピナーの確認
      await expect(page.locator('text=設定を保存中')).toBeVisible({ timeout: 1000 })
      
      // 最終的に結果ページに到達
      await expect(page).toHaveURL(/\\/result\\?allowance=103/, { timeout: 10000 })
    })

    test('API呼び出しの妥当なレスポンス時間', async ({ page }) => {
      let apiCallTime = 0
      
      await page.route('**/api/profile/complete', async route => {
        const start = Date.now()
        await route.continue()
        apiCallTime = Date.now() - start
      })

      await page.goto('/onboarding')
      
      const start = Date.now()
      await fillOnboardingForm(page, {
        isStudent: true,
        usingFamilyInsurance: true,
        isOver20hContract: false
      })
      const totalTime = Date.now() - start

      // API呼び出しが5秒以内に完了することを確認
      expect(apiCallTime).toBeLessThan(5000)
      
      // 全体フローが10秒以内に完了することを確認
      expect(totalTime).toBeLessThan(10000)
    })

    test('ネットワークエラー時の適切なエラーハンドリング', async ({ page }) => {
      // ネットワークエラーをシミュレート
      await page.route('**/api/profile/complete', route => route.abort('failed'))

      await page.goto('/onboarding')
      
      await fillOnboardingForm(page, {
        isStudent: true,
        usingFamilyInsurance: true,
        isOver20hContract: false
      })

      // ネットワークエラー時のフォールバックメッセージ
      await expect(page.locator('text=設定の保存に失敗しました')).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('📱 レスポンシブ & アクセシビリティ', () => {
    test('モバイル画面でのオンボーディング完了', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE

      await interceptApiCall(page, {
        status: 200,
        body: {
          success: true,
          allowance: 130,
          profile: {}
        }
      })

      await page.goto('/onboarding')
      
      await fillOnboardingForm(page, {
        isStudent: true,
        usingFamilyInsurance: true,
        isOver20hContract: false
      })

      await expect(page).toHaveURL(/\\/result\\?allowance=130/)
      
      // モバイルでのレイアウト確認
      const resultText = page.locator('text=130')
      await expect(resultText).toBeVisible()
      
      // タップ可能な要素のサイズ確認
      const dashboardButton = page.locator('text=ダッシュボードへ')
      const boundingBox = await dashboardButton.boundingBox()
      expect(boundingBox?.height).toBeGreaterThan(44) // iOS推奨最小タップサイズ
    })

    test('キーボードナビゲーション対応', async ({ page }) => {
      await page.goto('/onboarding')
      
      // Tab キーでの移動
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter') // 最初の選択肢を選択
      
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter') // 次の選択肢を選択
      
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter') // 最後の選択肢を選択

      // オンボーディング完了
      await expect(page.locator('text=設定を保存中')).toBeVisible({ timeout: 1000 })
    })

    test('適切なARIAラベルとセマンティックHTML', async ({ page }) => {
      await page.goto('/onboarding')
      
      // 進捗インジケーターの確認
      const progressBars = page.locator('[role="progressbar"]')
      await expect(progressBars).toHaveCount(1)
      
      // ヘッダー構造の確認
      const headings = page.locator('h1, h2, h3')
      await expect(headings).toHaveCount(1) // Step表示
      
      // ボタンの適切なラベル
      const buttons = page.locator('button')
      for (let i = 0; i < await buttons.count(); i++) {
        const button = buttons.nth(i)
        const text = await button.textContent()
        expect(text?.trim()).toBeTruthy() // 空のボタンがないことを確認
      }
    })
  })

  test.describe('🔄 エラー復旧フロー', () => {
    test('エラー後の再試行が正常動作', async ({ page }) => {
      let callCount = 0
      
      await page.route('**/api/profile/complete', async route => {
        callCount++
        if (callCount === 1) {
          // 1回目は失敗
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Temporary error',
              code: 'INTERNAL_ERROR'
            })
          })
        } else {
          // 2回目は成功
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              allowance: 103,
              profile: {}
            })
          })
        }
      })

      await page.goto('/onboarding')
      
      // 1回目の試行（失敗）
      await fillOnboardingForm(page, {
        isStudent: true,
        usingFamilyInsurance: true,
        isOver20hContract: false
      })
      
      await expect(page.locator('text=システムエラーが発生しました')).toBeVisible()
      
      // 再試行（最後のステップをもう一度実行）
      await page.click('text=いいえ、20時間未満です')
      
      // 2回目は成功
      await expect(page).toHaveURL(/\\/result\\?allowance=103/)
      expect(callCount).toBe(2)
    })
  })
})