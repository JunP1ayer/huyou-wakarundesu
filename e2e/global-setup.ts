/**
 * Playwright グローバルセットアップ
 * E2Eテスト実行前の環境準備
 */

import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 E2Eテスト環境セットアップ開始...')

  // ベースURLの確認
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000'
  console.log(`📍 ベースURL: ${baseURL}`)

  // ブラウザ起動（ヘルスチェック用）
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // アプリケーションのヘルスチェック
    console.log('🔍 アプリケーションヘルスチェック...')
    
    // ルートページアクセステスト
    const response = await page.goto(baseURL, {
      waitUntil: 'networkidle',
      timeout: 30000
    })

    if (!response || response.status() !== 200) {
      throw new Error(`アプリケーションが応答しません。ステータス: ${response?.status()}`)
    }

    // 基本要素の存在確認
    await page.waitForSelector('h1', { timeout: 10000 })
    console.log('✅ ルートページ正常')

    // API ヘルスチェック
    console.log('🔍 APIヘルスチェック...')
    
    try {
      const apiResponse = await page.request.get(`${baseURL}/api/health`)
      if (apiResponse.status() === 200) {
        const health = await apiResponse.json()
        console.log('✅ API正常:', health.status)
      } else {
        console.warn('⚠️ API応答異常:', apiResponse.status())
      }
    } catch (apiError) {
      console.warn('⚠️ APIヘルスチェック失敗:', apiError)
    }

    // デモモードの確認
    console.log('🔍 デモモード設定確認...')
    await page.addInitScript(() => {
      window.__demo_mode = true
    })
    
    await page.reload()
    const demoMode = await page.evaluate(() => window.__demo_mode)
    
    if (demoMode) {
      console.log('✅ デモモード有効')
    } else {
      console.warn('⚠️ デモモード設定に問題がある可能性があります')
    }

    // ダッシュボードアクセステスト
    console.log('🔍 ダッシュボードアクセステスト...')
    await page.goto(`${baseURL}/dashboard`)
    await page.waitForSelector('h1', { timeout: 10000 })
    
    const dashboardTitle = await page.textContent('h1')
    if (dashboardTitle?.includes('ダッシュボード')) {
      console.log('✅ ダッシュボード正常')
    } else {
      console.warn('⚠️ ダッシュボード表示に問題がある可能性があります')
    }

    // OAuth診断ページのテスト
    console.log('🔍 OAuth診断ページテスト...')
    try {
      await page.goto(`${baseURL}/admin/oauth-diagnostics`)
      await page.waitForSelector('h1', { timeout: 5000 })
      console.log('✅ OAuth診断ページ正常')
    } catch {
      console.warn('⚠️ OAuth診断ページアクセス失敗')
    }

  } catch (error) {
    console.error('❌ セットアップ中にエラーが発生しました:', error)
    throw error
  } finally {
    await browser.close()
  }

  // テスト結果保存ディレクトリの準備
  console.log('📁 テスト結果ディレクトリ準備...')
  const fs = await import('fs')
  const path = await import('path')
  
  const testResultsDir = path.join(process.cwd(), 'test-results')
  if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, { recursive: true })
    console.log('✅ test-results ディレクトリ作成完了')
  }

  const e2eResultsDir = path.join(testResultsDir, 'e2e')
  if (!fs.existsSync(e2eResultsDir)) {
    fs.mkdirSync(e2eResultsDir, { recursive: true })
    console.log('✅ test-results/e2e ディレクトリ作成完了')
  }

  // 環境情報をファイルに保存
  const envInfo = {
    timestamp: new Date().toISOString(),
    baseURL: baseURL,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    testType: 'e2e',
    demoMode: true
  }

  fs.writeFileSync(
    path.join(testResultsDir, 'test-environment.json'),
    JSON.stringify(envInfo, null, 2)
  )

  console.log('✅ E2Eテスト環境セットアップ完了')
  console.log('📊 環境情報:', envInfo)

  return envInfo
}

export default globalSetup