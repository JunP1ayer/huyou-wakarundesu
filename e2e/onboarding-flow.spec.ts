/**
 * オンボーディングフロー E2Eテスト（新4ステップ形式）
 * ユーザーが最初に利用する際の完全なフローをテスト
 * 年間収入入力ステップを削除し、4ステップ構成に変更
 */

import { test, expect, Page } from '@playwright/test'

// ヘルパー関数：新4ステップ形式のオンボーディング完了（年間収入ステップ削除）
async function completeOnboarding(page: Page, answers: {
  is_student: boolean,
  under_103_last_year: boolean,
  using_family_insurance: boolean,
  weekly_hours: string
}) {
  // オンボーディング開始
  await page.goto('/')
  
  // 質問1: あなたは現在学生ですか？
  await expect(page.locator('h2')).toContainText('あなたは現在学生ですか？', { timeout: 10000 })
  const question1Button = answers.is_student 
    ? page.getByRole('button', { name: 'はい、学生です' })
    : page.getByRole('button', { name: 'いいえ、学生ではありません' })
  await question1Button.click()
  
  // 質問2への遷移を待機
  await expect(page.locator('h2')).toContainText('昨年のアルバイト収入は 103 万円以下でしたか？', { timeout: 10000 })
  const question2Button = answers.under_103_last_year
    ? page.getByRole('button', { name: 'はい、103万円以下でした' })
    : page.getByRole('button', { name: 'いいえ、103万円を超えていました' })
  await question2Button.click()

  // 質問3への遷移を待機
  await expect(page.locator('h2')).toContainText('親やご家族の健康保険証を使っていますか？', { timeout: 10000 })
  const question3Button = answers.using_family_insurance
    ? page.getByRole('button', { name: 'はい、家族の保険証を使っています' })
    : page.getByRole('button', { name: 'いいえ、自分で加入しています' })
  await question3Button.click()

  // 質問4への遷移を待機
  await expect(page.locator('h2')).toContainText('1週間に平均どれくらい働いていますか？', { timeout: 10000 })
  await page.fill('input[type="number"]', answers.weekly_hours)
  
  // 設定完了ボタンをクリック
  const completeButton = page.getByRole('button', { name: '設定完了' })
  await expect(completeButton).toBeEnabled()
  await completeButton.click()
  
  // ダッシュボードへの遷移を待機（最大30秒）
  await page.waitForURL('**/dashboard', { timeout: 30000 })
}

test.describe('オンボーディングフロー（新4ステップ形式）', () => {
  test.beforeEach(async ({ page }) => {
    // テスト前のセットアップ（認証等は環境に応じて設定）
    await page.goto('/')
  })

  test('学生ユーザーの標準フロー', async ({ page }) => {
    await completeOnboarding(page, {
      is_student: true,
      under_103_last_year: true,
      using_family_insurance: true,
      weekly_hours: '20'
    })

    // ダッシュボードに遷移することを確認
    await expect(page).toHaveURL('/dashboard')
    
    // E2Eテスト環境での成功確認
    await expect(page.locator('text=E2Eテスト: ダッシュボード遷移成功')).toBeVisible({ timeout: 10000 })
  })

  test('一般ユーザーの標準フロー', async ({ page }) => {
    await completeOnboarding(page, {
      is_student: false,
      under_103_last_year: false,
      using_family_insurance: false,
      weekly_hours: '25'
    })

    // ダッシュボードに遷移することを確認
    await expect(page).toHaveURL('/dashboard')
    
    // E2Eテスト環境での成功確認
    await expect(page.locator('text=E2Eテスト: ダッシュボード遷移成功')).toBeVisible({ timeout: 10000 })
  })

  test('フルタイムに近いユーザー', async ({ page }) => {
    await completeOnboarding(page, {
      is_student: true,
      under_103_last_year: true,
      using_family_insurance: true,
      weekly_hours: '35'
    })

    // ダッシュボードに遷移
    await expect(page).toHaveURL('/dashboard')
    
    // E2Eテスト環境での成功確認
    await expect(page.locator('text=E2Eテスト: ダッシュボード遷移成功')).toBeVisible({ timeout: 10000 })
  })

  test('戻るボタンの機能確認', async ({ page }) => {
    await page.goto('/')
    
    // 質問1を回答
    await expect(page.locator('h2')).toContainText('あなたは現在学生ですか？', { timeout: 10000 })
    await page.getByRole('button', { name: 'はい、学生です' }).click()
    
    // 質問2への遷移を待機
    await expect(page.locator('h2')).toContainText('昨年のアルバイト収入は 103 万円以下でしたか？', { timeout: 10000 })
    
    // 質問2で戻るボタンをクリック
    await page.getByRole('button', { name: '戻る' }).click()
    
    // 質問1に戻ることを確認
    await expect(page.locator('h2')).toContainText('あなたは現在学生ですか？', { timeout: 10000 })
  })

  test('プログレスバーの動作確認', async ({ page }) => {
    await page.goto('/')
    
    // 初期状態（1/4）
    await expect(page.locator('text=1/4')).toBeVisible({ timeout: 10000 })
    
    // 質問1を回答
    await expect(page.locator('h2')).toContainText('あなたは現在学生ですか？', { timeout: 10000 })
    await page.getByRole('button', { name: 'はい、学生です' }).click()
    
    // 2/4になることを確認
    await expect(page.locator('text=2/4')).toBeVisible({ timeout: 10000 })
    
    // 質問2を回答
    await expect(page.locator('h2')).toContainText('昨年のアルバイト収入は 103 万円以下でしたか？', { timeout: 10000 })
    await page.getByRole('button', { name: 'はい、103万円以下でした' }).click()
    
    // 3/4になることを確認
    await expect(page.locator('text=3/4')).toBeVisible({ timeout: 10000 })
    
    // 質問3を回答
    await expect(page.locator('h2')).toContainText('親やご家族の健康保険証を使っていますか？', { timeout: 10000 })
    await page.getByRole('button', { name: 'はい、家族の保険証を使っています' }).click()
    
    // 4/4になることを確認
    await expect(page.locator('text=4/4')).toBeVisible({ timeout: 10000 })
  })

  test('数値入力のバリデーション確認', async ({ page }) => {
    await page.goto('/')
    
    // 質問1, 2, 3を回答して質問4に到達
    await expect(page.locator('h2')).toContainText('あなたは現在学生ですか？', { timeout: 10000 })
    await page.getByRole('button', { name: 'はい、学生です' }).click()
    
    await expect(page.locator('h2')).toContainText('昨年のアルバイト収入は 103 万円以下でしたか？', { timeout: 10000 })
    await page.getByRole('button', { name: 'はい、103万円以下でした' }).click()
    
    await expect(page.locator('h2')).toContainText('親やご家族の健康保険証を使っていますか？', { timeout: 10000 })
    await page.getByRole('button', { name: 'はい、家族の保険証を使っています' }).click()
    
    // 質問4に到達
    await expect(page.locator('h2')).toContainText('1週間に平均どれくらい働いていますか？', { timeout: 10000 })
    
    // 無効な値（負の数）を入力
    await page.fill('input[type="number"]', '-5')
    await page.getByRole('button', { name: '設定完了' }).click()
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=0以上の値を入力してください')).toBeVisible({ timeout: 5000 })
    
    // 有効な値を入力
    await page.fill('input[type="number"]', '20')
    await page.getByRole('button', { name: '設定完了' }).click()
    
    // ダッシュボードに遷移することを確認
    await page.waitForURL('**/dashboard', { timeout: 30000 })
    
    // E2Eテスト環境での成功確認
    await expect(page.locator('text=E2Eテスト: ダッシュボード遷移成功')).toBeVisible({ timeout: 10000 })
  })

  test('「わからない？」チャット機能', async ({ page }) => {
    await page.goto('/')
    
    // オンボーディングが表示されることを確認
    await expect(page.locator('h2')).toContainText('あなたは現在学生ですか？', { timeout: 10000 })
    
    // 「わからない？」ボタンをクリック
    await page.getByRole('button', { name: 'わからない？' }).click()
    
    // チャット画面が表示されることを確認
    await expect(page.locator('text=扶養について詳しく教えます')).toBeVisible({ timeout: 10000 })
  })

  test('空の入力値での送信防止', async ({ page }) => {
    await page.goto('/')
    
    // 質問1, 2, 3を回答して質問4に到達
    await expect(page.locator('h2')).toContainText('あなたは現在学生ですか？', { timeout: 10000 })
    await page.getByRole('button', { name: 'はい、学生です' }).click()
    
    await expect(page.locator('h2')).toContainText('昨年のアルバイト収入は 103 万円以下でしたか？', { timeout: 10000 })
    await page.getByRole('button', { name: 'はい、103万円以下でした' }).click()
    
    await expect(page.locator('h2')).toContainText('親やご家族の健康保険証を使っていますか？', { timeout: 10000 })
    await page.getByRole('button', { name: 'はい、家族の保険証を使っています' }).click()
    
    // 質問4に到達
    await expect(page.locator('h2')).toContainText('1週間に平均どれくらい働いていますか？', { timeout: 10000 })
    
    // 空の状態で設定完了ボタンが無効になっていることを確認
    const submitButton = page.getByRole('button', { name: '設定完了' })
    await expect(submitButton).toBeDisabled()
    
    // 値を入力すると有効になることを確認
    await page.fill('input[type="number"]', '20')
    await expect(submitButton).toBeEnabled()
  })
})

test.describe('エラーハンドリング', () => {
  test('認証エラー時の処理', async ({ page }) => {
    // 認証なしでダッシュボードにアクセス
    await page.goto('/dashboard')
    
    // ログインページまたはエラーメッセージが表示されることを確認
    await expect(page.locator('text=ログインが必要です')).toBeVisible({ timeout: 10000 })
  })

  test('大きすぎる値の入力制限', async ({ page }) => {
    await page.goto('/')
    
    // 質問1, 2, 3を回答して質問4に到達
    await expect(page.locator('h2')).toContainText('あなたは現在学生ですか？', { timeout: 10000 })
    await page.getByRole('button', { name: 'はい、学生です' }).click()
    
    await expect(page.locator('h2')).toContainText('昨年のアルバイト収入は 103 万円以下でしたか？', { timeout: 10000 })
    await page.getByRole('button', { name: 'はい、103万円以下でした' }).click()
    
    await expect(page.locator('h2')).toContainText('親やご家族の健康保険証を使っていますか？', { timeout: 10000 })
    await page.getByRole('button', { name: 'はい、家族の保険証を使っています' }).click()
    
    // 質問4に到達
    await expect(page.locator('h2')).toContainText('1週間に平均どれくらい働いていますか？', { timeout: 10000 })
    
    // 40時間を超える値を入力
    await page.fill('input[type="number"]', '50')
    await page.getByRole('button', { name: '設定完了' }).click()
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=40以下の値を入力してください')).toBeVisible({ timeout: 5000 })
  })
})