/**
 * オンボーディングフロー E2Eテスト
 * ユーザーが最初に利用する際の完全なフローをテスト
 */

import { test, expect, Page } from '@playwright/test'

// ヘルパー関数
async function completeOnboarding(page: Page, answers: {
  question1: string,
  question2: string,
  question3: string,
  question4: string,
  question5: string
}) {
  // オンボーディング開始
  await page.goto('/')
  await page.click('text=はじめる')

  // 質問1: 学生かどうか
  await expect(page.locator('h2')).toContainText('質問 1')
  await page.click(`text=${answers.question1}`)
  await page.click('text=次へ')

  // 質問2: 労働時間
  await expect(page.locator('h2')).toContainText('質問 2')
  await page.click(`text=${answers.question2}`)
  await page.click('text=次へ')

  // 質問3: 会社規模
  await expect(page.locator('h2')).toContainText('質問 3')
  await page.click(`text=${answers.question3}`)
  await page.click('text=次へ')

  // 質問4: 扶養状況
  await expect(page.locator('h2')).toContainText('質問 4')
  await page.click(`text=${answers.question4}`)
  await page.click('text=次へ')

  // 質問5: 希望する扶養範囲
  await expect(page.locator('h2')).toContainText('質問 5')
  await page.click(`text=${answers.question5}`)
  await page.click('text=結果を見る')
}

test.describe('オンボーディングフロー', () => {
  test.beforeEach(async ({ page }) => {
    // デモモードの有効化
    await page.addInitScript(() => {
      window.__demo_mode = true
    })
  })

  test('標準的な学生ユーザーのオンボーディング @smoke', async ({ page }) => {
    await test.step('ランディングページの表示確認', async () => {
      await page.goto('/')
      
      // ページタイトルの確認
      await expect(page).toHaveTitle(/扶養わかるんです/)
      
      // メインキャッチコピーの確認
      await expect(page.locator('h1')).toContainText('扶養わかるんです')
      
      // はじめるボタンが表示されている
      await expect(page.locator('text=はじめる')).toBeVisible()
      
      // デモモード表示の確認
      await expect(page.locator('text=デモモード')).toBeVisible()
    })

    await test.step('オンボーディング質問の完了', async () => {
      await completeOnboarding(page, {
        question1: '学生',
        question2: '週20時間未満',
        question3: '500人以下',
        question4: '扶養に入っている',
        question5: '103万円以下に抑えたい'
      })
    })

    await test.step('結果画面の表示確認', async () => {
      // 結果ページに遷移していることを確認
      await expect(page.url()).toMatch(/\/result/)
      
      // 扶養分類結果の表示
      await expect(page.locator('text=103万円扶養')).toBeVisible()
      
      // 限度額の表示
      await expect(page.locator('text=¥1,030,000')).toBeVisible()
      
      // 推奨事項の表示
      await expect(page.locator('text=所得税の扶養控除対象')).toBeVisible()
      
      // ダッシュボードへのボタン
      await expect(page.locator('text=ダッシュボードへ')).toBeVisible()
    })

    await test.step('ダッシュボードへの遷移', async () => {
      await page.click('text=ダッシュボードへ')
      
      // ダッシュボードページに遷移
      await expect(page.url()).toMatch(/\/dashboard/)
      
      // ダッシュボードタイトルの確認
      await expect(page.locator('h1')).toContainText('ダッシュボード')
      
      // デモモード表示の確認
      await expect(page.locator('text=デモモード')).toBeVisible()
    })
  })

  test('106万円の壁対象ユーザーのオンボーディング', async ({ page }) => {
    await completeOnboarding(page, {
      question1: '学生',
      question2: '週20時間以上',
      question3: '500人以上',
      question4: '扶養に入っている',
      question5: '社会保険の扶養を維持したい'
    })

    // 106万円の壁の結果確認
    await expect(page.locator('text=106万円（社保）')).toBeVisible()
    await expect(page.locator('text=¥1,060,000')).toBeVisible()
    await expect(page.locator('text=社会保険の扶養から外れる')).toBeVisible()
  })

  test('130万円の壁対象ユーザーのオンボーディング', async ({ page }) => {
    await completeOnboarding(page, {
      question1: '学生以外',
      question2: '週20時間未満',
      question3: '500人以下',
      question4: '扶養に入っている',
      question5: '社会保険の扶養を維持したい'
    })

    // 130万円の壁の結果確認
    await expect(page.locator('text=130万円（社保）')).toBeVisible()
    await expect(page.locator('text=¥1,300,000')).toBeVisible()
  })

  test('オンボーディング途中での戻る操作', async ({ page }) => {
    await page.goto('/')
    await page.click('text=はじめる')

    // 質問1 -> 質問2 -> 戻る
    await page.click('text=学生')
    await page.click('text=次へ')
    await page.click('text=週20時間未満')
    await page.click('text=次へ')
    
    // 戻るボタンで前の質問に戻る
    await page.click('text=戻る')
    await expect(page.locator('h2')).toContainText('質問 2')
    
    await page.click('text=戻る')
    await expect(page.locator('h2')).toContainText('質問 1')
  })

  test('無効な選択肢での進行阻止', async ({ page }) => {
    await page.goto('/')
    await page.click('text=はじめる')

    // 選択肢を選ばずに次へを押そうとする
    const nextButton = page.locator('text=次へ')
    
    // 選択なしでは次へボタンが無効化されている
    await expect(nextButton).toBeDisabled()
    
    // 選択後は有効化される
    await page.click('text=学生')
    await expect(nextButton).toBeEnabled()
  })

  test('プログレスバーの動作確認', async ({ page }) => {
    await page.goto('/')
    await page.click('text=はじめる')

    // 初期状態のプログレス確認（1/5）
    await expect(page.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '20')

    // 質問2に進む
    await page.click('text=学生')
    await page.click('text=次へ')
    await expect(page.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '40')

    // 質問3に進む
    await page.click('text=週20時間未満')
    await page.click('text=次へ')
    await expect(page.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '60')
  })
})

test.describe('ダッシュボードの基本機能', () => {
  test.beforeEach(async ({ page }) => {
    // デモモードでダッシュボードに直接アクセス
    await page.addInitScript(() => {
      window.__demo_mode = true
    })
    await page.goto('/dashboard')
  })

  test('ダッシュボードの基本表示 @smoke', async ({ page }) => {
    await test.step('基本要素の表示確認', async () => {
      // ダッシュボードタイトル
      await expect(page.locator('h1')).toContainText('ダッシュボード')
      
      // デモモード表示
      await expect(page.locator('text=デモモード')).toBeVisible()
      
      // 扶養範囲ステータス
      await expect(page.locator('text=扶養範囲ステータス')).toBeVisible()
      
      // 今年の収入進捗
      await expect(page.locator('text=今年の収入進捗')).toBeVisible()
      
      // 残り可能収入
      await expect(page.locator('text=残り可能収入')).toBeVisible()
      
      // 取引件数
      await expect(page.locator('text=取引件数')).toBeVisible()
    })

    await test.step('進捗バーの表示確認', async () => {
      // 進捗バーが表示されている
      const progressBar = page.locator('[role="progressbar"]')
      await expect(progressBar).toBeVisible()
      
      // パーセンテージが表示されている
      await expect(page.locator('text=%')).toBeVisible()
    })

    await test.step('金額表示の確認', async () => {
      // 通貨フォーマットの確認
      const amounts = page.locator('text=/¥[\\d,]+/')
      await expect(amounts.first()).toBeVisible()
      
      // 複数の金額が表示されている（現在収入、限度額、残り可能収入）
      await expect(amounts).toHaveCount(3)
    })
  })

  test('設定ボタンからの設定画面アクセス', async ({ page }) => {
    // 設定ボタンをクリック
    await page.click('[aria-label="設定"]')
    
    // 設定モーダルが表示される
    await expect(page.locator('text=設定')).toBeVisible()
    await expect(page.locator('text=プロフィール設定')).toBeVisible()
  })

  test('CSVエクスポート機能', async ({ page }) => {
    // エクスポートボタンの確認
    await expect(page.locator('text=CSV出力')).toBeVisible()
    
    // クリック可能な状態
    await expect(page.locator('text=CSV出力')).toBeEnabled()
  })

  test('通知許可リクエスト', async ({ page }) => {
    // 通知設定セクションの確認
    await expect(page.locator('text=通知設定')).toBeVisible()
    
    // 通知許可ボタンが表示されている
    await expect(page.locator('text=通知を許可')).toBeVisible()
  })

  test('デモモードでの銀行連携無効化', async ({ page }) => {
    // 銀行連携ボタンをクリック
    await page.click('text=銀行連携')
    
    // デモモードでは利用できない旨のメッセージ
    await expect(page.locator('text=デモモードでは銀行連携は利用できません')).toBeVisible()
  })
})

test.describe('レスポンシブデザイン', () => {
  test('モバイルビューでの表示確認', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // モバイル表示での要素確認
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('text=はじめる')).toBeVisible()
    
    // ボタンが押しやすいサイズで表示されている
    const startButton = page.locator('text=はじめる')
    const buttonBox = await startButton.boundingBox()
    expect(buttonBox?.height).toBeGreaterThan(44) // iOS推奨の最小タップサイズ
  })

  test('タブレットビューでの表示確認', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/dashboard')
    
    // タブレットでの表示確認
    await expect(page.locator('h1')).toContainText('ダッシュボード')
    
    // レイアウトが適切に調整されている
    const container = page.locator('.max-w-md')
    await expect(container).toBeVisible()
  })
})

test.describe('アクセシビリティ', () => {
  test('キーボードナビゲーション', async ({ page }) => {
    await page.goto('/')
    
    // Tabキーでナビゲーション
    await page.keyboard.press('Tab')
    
    // フォーカスが「はじめる」ボタンに移動
    await expect(page.locator('text=はじめる')).toBeFocused()
    
    // Enterキーでボタンを押せる
    await page.keyboard.press('Enter')
    await expect(page.url()).toMatch(/\/onboarding/)
  })

  test('スクリーンリーダー用のaria-label', async ({ page }) => {
    await page.goto('/dashboard')
    
    // 進捗バーにaria-labelが設定されている
    await expect(page.locator('[role="progressbar"]')).toHaveAttribute('aria-label')
    
    // 設定ボタンにaria-labelが設定されている
    await expect(page.locator('[aria-label="設定"]')).toBeVisible()
  })
})