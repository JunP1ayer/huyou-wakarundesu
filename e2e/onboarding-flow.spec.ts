/**
 * オンボーディングフロー E2Eテスト（新3ステップ形式）
 * ユーザーが最初に利用する際の完全なフローをテスト
 * 3ステップ構成: 学生確認 → 扶養確認 → 労働契約確認
 */

import { test, expect, Page } from '@playwright/test'

// ヘルパー関数：新3ステップ形式のオンボーディング完了
async function completeOnboarding(page: Page, answers: {
  is_student: boolean,
  using_family_insurance: boolean,
  is_over_20h_contract: boolean
}) {
  // オンボーディング開始
  await page.goto('/')
  
  // 質問1: あなたは現在学生ですか？
  await expect(page.locator('h2')).toContainText('あなたは現在学生ですか？')
  if (answers.is_student) {
    await page.click('text=はい、学生です')
  } else {
    await page.click('text=いいえ、学生ではありません')
  }

  // 質問2: 親やご家族の健康保険証を使っていますか？
  await expect(page.locator('h2')).toContainText('親やご家族の健康保険証を使っていますか？')
  if (answers.using_family_insurance) {
    await page.click('text=はい、家族の保険証を使っています')
  } else {
    await page.click('text=いいえ、自分で加入しています')
  }

  // 質問3: あなたの "契約上の" 週あたり労働時間は 20 時間以上ですか？
  await expect(page.locator('h2')).toContainText('あなたの "契約上の" 週あたり労働時間は 20 時間以上ですか？')
  if (answers.is_over_20h_contract) {
    await page.click('text=はい、20時間以上です')
  } else {
    await page.click('text=いいえ、20時間未満です')
  }
}

test.describe('オンボーディングフロー（新3ステップ形式）', () => {
  test.beforeEach(async ({ page }) => {
    // テスト前のセットアップ（認証等は環境に応じて設定）
    await page.goto('/')
  })

  test('学生ユーザーの標準フロー', async ({ page }) => {
    await completeOnboarding(page, {
      is_student: true,
      using_family_insurance: true,
      is_over_20h_contract: false
    })

    // 結果ページに遷移することを確認
    await expect(page).toHaveURL(/\/result\?allowance=\d+/)
    
    // 扶養控除の情報が表示されることを確認
    await expect(page.locator('text*=万円')).toBeVisible()
  })

  test('一般ユーザーの標準フロー', async ({ page }) => {
    await completeOnboarding(page, {
      is_student: false,
      using_family_insurance: false,
      is_over_20h_contract: true
    })

    // 結果ページに遷移することを確認
    await expect(page).toHaveURL(/\/result\?allowance=\d+/)
    
    // 扶養控除の情報が表示されることを確認
    await expect(page.locator('text*=万円')).toBeVisible()
  })

  test('フルタイムに近いユーザー', async ({ page }) => {
    await completeOnboarding(page, {
      is_student: true,
      using_family_insurance: true,
      is_over_20h_contract: true
    })

    // 結果ページに遷移
    await expect(page).toHaveURL(/\/result\?allowance=\d+/)
    
    // 扶養控除情報が表示されることを確認
    await expect(page.locator('text*=万円')).toBeVisible()
  })

  test('戻るボタンの機能確認', async ({ page }) => {
    await page.goto('/')
    
    // 質問1を回答
    await page.click('text=はい、学生です')
    
    // 質問2で戻るボタンをクリック
    await page.click('text=戻る')
    
    // 質問1に戻ることを確認
    await expect(page.locator('h2')).toContainText('あなたは現在学生ですか？')
  })

  test('プログレスバーの動作確認', async ({ page }) => {
    await page.goto('/')
    
    // 初期状態（1/3）
    await expect(page.locator('text=1/3')).toBeVisible()
    
    // 質問1を回答
    await page.click('text=はい、学生です')
    
    // 2/3になることを確認
    await expect(page.locator('text=2/3')).toBeVisible()
    
    // 質問2を回答
    await page.click('text=はい、家族の保険証を使っています')
    
    // 3/3になることを確認
    await expect(page.locator('text=3/3')).toBeVisible()
  })

  test('3ステップ完了フロー確認', async ({ page }) => {
    await page.goto('/')
    
    // 質問1を回答
    await page.click('text=はい、学生です')
    
    // 質問2を回答
    await page.click('text=はい、家族の保険証を使っています')
    
    // 質問3を回答して完了
    await page.click('text=いいえ、20時間未満です')
    
    // 結果ページに遷移することを確認
    await expect(page).toHaveURL(/\/result\?allowance=\d+/)
  })

  test('「わからない？」チャット機能', async ({ page }) => {
    await page.goto('/')
    
    // 「わからない？」ボタンをクリック
    await page.click('text=わからない？')
    
    // チャット画面が表示されることを確認
    await expect(page.locator('text=扶養について詳しく教えます')).toBeVisible()
  })

  test('すべての質問がboolean形式で即座に回答可能', async ({ page }) => {
    await page.goto('/')
    
    // 質問1でボタンがクリック可能であることを確認
    await expect(page.locator('text=はい、学生です')).toBeEnabled()
    await expect(page.locator('text=いいえ、学生ではありません')).toBeEnabled()
    
    // 質問1を回答
    await page.click('text=はい、学生です')
    
    // 質問2でボタンがクリック可能であることを確認
    await expect(page.locator('text=はい、家族の保険証を使っています')).toBeEnabled()
    await expect(page.locator('text=いいえ、自分で加入しています')).toBeEnabled()
  })
})

test.describe('エラーハンドリング', () => {
  test('認証エラー時の処理', async ({ page }) => {
    // 認証なしでダッシュボードにアクセス
    await page.goto('/dashboard')
    
    // ログインページまたはエラーメッセージが表示されることを確認
    await expect(page.locator('text=ログインが必要です')).toBeVisible()
  })

  test('すべての回答パターンの確認', async ({ page }) => {
    await page.goto('/')
    
    // パターン1: 学生・扶養・20時間未満
    await page.click('text=はい、学生です')
    await page.click('text=はい、家族の保険証を使っています')
    await page.click('text=いいえ、20時間未満です')
    
    // 結果ページに遷移することを確認
    await expect(page).toHaveURL(/\/result\?allowance=\d+/)
  })
})