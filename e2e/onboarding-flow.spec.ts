/**
 * オンボーディングフロー E2Eテスト（新4問形式）
 * ユーザーが最初に利用する際の完全なフローをテスト
 */

import { test, expect, Page } from '@playwright/test'

// ヘルパー関数：新4問形式のオンボーディング完了
async function completeOnboarding(page: Page, answers: {
  under_103_last_year: boolean,
  using_family_insurance: boolean,
  annual_income: string,
  weekly_hours: string
}) {
  // オンボーディング開始
  await page.goto('/')
  
  // 質問1: 昨年のアルバイト収入は 103 万円以下でしたか？
  await expect(page.locator('h2')).toContainText('昨年のアルバイト収入は 103 万円以下でしたか？')
  if (answers.under_103_last_year) {
    await page.click('text=はい、103万円以下でした')
  } else {
    await page.click('text=いいえ、103万円を超えていました')
  }

  // 質問2: 親やご家族の健康保険証を使っていますか？
  await expect(page.locator('h2')).toContainText('親やご家族の健康保険証を使っていますか？')
  if (answers.using_family_insurance) {
    await page.click('text=はい、家族の保険証を使っています')
  } else {
    await page.click('text=いいえ、自分で加入しています')
  }

  // 質問3: 1年間（4月〜翌3月）の収入合計を入力してください
  await expect(page.locator('h2')).toContainText('1年間（4月〜翌3月）の収入合計を入力してください')
  await page.fill('input[type="number"]', answers.annual_income)
  await page.click('text=次へ')

  // 質問4: 1週間に平均どれくらい働いていますか？
  await expect(page.locator('h2')).toContainText('1週間に平均どれくらい働いていますか？')
  await page.fill('input[type="number"]', answers.weekly_hours)
  await page.click('text=設定完了')
}

test.describe('オンボーディングフロー（新4問形式）', () => {
  test.beforeEach(async ({ page }) => {
    // テスト前のセットアップ（認証等は環境に応じて設定）
    await page.goto('/')
  })

  test('学生ユーザーの標準フロー', async ({ page }) => {
    await completeOnboarding(page, {
      under_103_last_year: true,
      using_family_insurance: true,
      annual_income: '800000',
      weekly_hours: '20'
    })

    // ダッシュボードに遷移することを確認
    await expect(page).toHaveURL('/dashboard')
    
    // 扶養控除の上限が130万円に設定されることを確認
    await expect(page.locator('text=130万円')).toBeVisible()
  })

  test('一般ユーザーの標準フロー', async ({ page }) => {
    await completeOnboarding(page, {
      under_103_last_year: false,
      using_family_insurance: false,
      annual_income: '1200000',
      weekly_hours: '25'
    })

    // ダッシュボードに遷移することを確認
    await expect(page).toHaveURL('/dashboard')
    
    // 扶養控除の上限が103万円に設定されることを確認
    await expect(page.locator('text=103万円')).toBeVisible()
  })

  test('106万円の壁に近いユーザー', async ({ page }) => {
    await completeOnboarding(page, {
      under_103_last_year: true,
      using_family_insurance: true,
      annual_income: '1000000',
      weekly_hours: '22'
    })

    // ダッシュボードに遷移
    await expect(page).toHaveURL('/dashboard')
    
    // 注意喚起が表示されることを確認
    await expect(page.locator('text=注意が必要です')).toBeVisible()
  })

  test('戻るボタンの機能確認', async ({ page }) => {
    await page.goto('/')
    
    // 質問1を回答
    await page.click('text=はい、103万円以下でした')
    
    // 質問2で戻るボタンをクリック
    await page.click('text=戻る')
    
    // 質問1に戻ることを確認
    await expect(page.locator('h2')).toContainText('昨年のアルバイト収入は 103 万円以下でしたか？')
  })

  test('プログレスバーの動作確認', async ({ page }) => {
    await page.goto('/')
    
    // 初期状態（1/4）
    await expect(page.locator('text=1/4')).toBeVisible()
    
    // 質問1を回答
    await page.click('text=はい、103万円以下でした')
    
    // 2/4になることを確認
    await expect(page.locator('text=2/4')).toBeVisible()
    
    // 質問2を回答
    await page.click('text=はい、家族の保険証を使っています')
    
    // 3/4になることを確認
    await expect(page.locator('text=3/4')).toBeVisible()
  })

  test('数値入力のバリデーション確認', async ({ page }) => {
    await page.goto('/')
    
    // 質問1, 2を回答して質問3に到達
    await page.click('text=はい、103万円以下でした')
    await page.click('text=はい、家族の保険証を使っています')
    
    // 無効な値（負の数）を入力
    await page.fill('input[type="number"]', '-1000')
    await page.click('text=次へ')
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=0以上の値を入力してください')).toBeVisible()
    
    // 有効な値を入力
    await page.fill('input[type="number"]', '800000')
    await page.click('text=次へ')
    
    // 次の質問に進むことを確認
    await expect(page.locator('h2')).toContainText('1週間に平均どれくらい働いていますか？')
  })

  test('「わからない？」チャット機能', async ({ page }) => {
    await page.goto('/')
    
    // 「わからない？」ボタンをクリック
    await page.click('text=わからない？')
    
    // チャット画面が表示されることを確認
    await expect(page.locator('text=扶養について詳しく教えます')).toBeVisible()
  })

  test('空の入力値での送信防止', async ({ page }) => {
    await page.goto('/')
    
    // 質問1, 2を回答して質問3に到達
    await page.click('text=はい、103万円以下でした')
    await page.click('text=はい、家族の保険証を使っています')
    
    // 空の状態で次へボタンをクリック
    const nextButton = page.locator('text=次へ')
    await expect(nextButton).toBeDisabled()
    
    // 値を入力すると有効になることを確認
    await page.fill('input[type="number"]', '800000')
    await expect(nextButton).toBeEnabled()
  })
})

test.describe('エラーハンドリング', () => {
  test('認証エラー時の処理', async ({ page }) => {
    // 認証なしでダッシュボードにアクセス
    await page.goto('/dashboard')
    
    // ログインページまたはエラーメッセージが表示されることを確認
    await expect(page.locator('text=ログインが必要です')).toBeVisible()
  })

  test('大きすぎる値の入力制限', async ({ page }) => {
    await page.goto('/')
    
    // 質問1, 2を回答して質問3に到達
    await page.click('text=はい、103万円以下でした')
    await page.click('text=はい、家族の保険証を使っています')
    
    // 500万円を超える値を入力
    await page.fill('input[type="number"]', '6000000')
    await page.click('text=次へ')
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=5000000以下の値を入力してください')).toBeVisible()
  })
})