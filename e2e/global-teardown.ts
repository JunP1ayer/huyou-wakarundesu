/**
 * Playwright グローバルティアダウン
 * E2Eテスト実行後のクリーンアップ
 */

async function globalTeardown() {
  console.log('🧹 E2Eテスト環境クリーンアップ開始...')

  try {
    // テスト結果の集計
    const fs = await import('fs')
    const path = await import('path')

    const testResultsDir = path.join(process.cwd(), 'test-results')
    
    if (fs.existsSync(testResultsDir)) {
      // 結果ファイルの確認
      const files = fs.readdirSync(testResultsDir)
      console.log('📄 生成されたテスト結果ファイル:')
      files.forEach(file => {
        const filePath = path.join(testResultsDir, file)
        const stats = fs.statSync(filePath)
        console.log(`  - ${file} (${(stats.size / 1024).toFixed(2)} KB)`)
      })

      // テスト統計の生成
      try {
        const junitFile = path.join(testResultsDir, 'e2e-results.xml')
        const jsonFile = path.join(testResultsDir, 'e2e-results.json')
        
        let testStats = {
          timestamp: new Date().toISOString(),
          totalTests: 0,
          passedTests: 0,
          failedTests: 0,
          skippedTests: 0,
          duration: 0,
          browsers: [],
          coverage: null
        }

        // JSON結果ファイルから統計を取得
        if (fs.existsSync(jsonFile)) {
          const jsonData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'))
          
          if (jsonData.suites) {
            // 統計計算
            const allTests = jsonData.suites.flatMap((suite: any) => 
              suite.specs?.flatMap((spec: any) => spec.tests || []) || []
            )
            
            testStats.totalTests = allTests.length
            testStats.passedTests = allTests.filter((test: any) => test.outcome === 'expected').length
            testStats.failedTests = allTests.filter((test: any) => test.outcome === 'unexpected').length
            testStats.skippedTests = allTests.filter((test: any) => test.outcome === 'skipped').length
            
            // 実行時間の計算
            const durations = allTests.map((test: any) => test.results?.[0]?.duration || 0)
            testStats.duration = durations.reduce((sum: number, duration: number) => sum + duration, 0)
            
            // ブラウザ情報の取得
            const browsers = new Set(allTests.map((test: any) => 
              test.results?.[0]?.workerIndex !== undefined ? `Project-${test.results[0].workerIndex}` : 'Unknown'
            ))
            testStats.browsers = Array.from(browsers)
          }
        }

        // 統計ファイルの保存
        fs.writeFileSync(
          path.join(testResultsDir, 'test-summary.json'),
          JSON.stringify(testStats, null, 2)
        )

        // コンソールに統計表示
        console.log('📊 テスト実行統計:')
        console.log(`  総テスト数: ${testStats.totalTests}`)
        console.log(`  成功: ${testStats.passedTests}`)
        console.log(`  失敗: ${testStats.failedTests}`)
        console.log(`  スキップ: ${testStats.skippedTests}`)
        console.log(`  実行時間: ${(testStats.duration / 1000).toFixed(2)}秒`)
        console.log(`  ブラウザ: ${testStats.browsers.join(', ')}`)

        // 失敗率の警告
        if (testStats.totalTests > 0) {
          const failureRate = (testStats.failedTests / testStats.totalTests) * 100
          if (failureRate > 10) {
            console.warn(`⚠️ 失敗率が高い: ${failureRate.toFixed(1)}%`)
          } else if (failureRate === 0) {
            console.log('🎉 全テスト成功!')
          }
        }

      } catch (statsError) {
        console.warn('⚠️ テスト統計の生成に失敗:', statsError)
      }
    }

    // 一時ファイルのクリーンアップ（必要に応じて）
    console.log('🗑️ 一時ファイルクリーンアップ...')
    
    // スクリーンショットやビデオファイルのサイズチェック
    const traceDir = path.join(testResultsDir, 'trace')
    if (fs.existsSync(traceDir)) {
      const traceFiles = fs.readdirSync(traceDir)
      let totalSize = 0
      
      traceFiles.forEach(file => {
        const filePath = path.join(traceDir, file)
        totalSize += fs.statSync(filePath).size
      })
      
      console.log(`📹 トレースファイル合計サイズ: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`)
      
      // 大きすぎる場合の警告
      if (totalSize > 100 * 1024 * 1024) { // 100MB以上
        console.warn('⚠️ トレースファイルが大きすぎます。古いファイルの削除を検討してください。')
      }
    }

    // CI環境での処理
    if (process.env.CI) {
      console.log('🔄 CI環境での追加処理...')
      
      // アーティファクトの準備
      const artifactsDir = path.join(testResultsDir, 'artifacts')
      if (!fs.existsSync(artifactsDir)) {
        fs.mkdirSync(artifactsDir, { recursive: true })
      }

      // 重要なファイルをアーティファクツにコピー
      const importantFiles = [
        'test-summary.json',
        'e2e-results.json',
        'e2e-results.xml',
        'test-environment.json'
      ]

      importantFiles.forEach(file => {
        const sourcePath = path.join(testResultsDir, file)
        const destPath = path.join(artifactsDir, file)
        
        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, destPath)
          console.log(`📋 ${file} をアーティファクツにコピー`)
        }
      })
    }

    // 完了ログ
    console.log('✅ E2Eテスト環境クリーンアップ完了')
    
    // プロセス終了時の情報
    const endTime = new Date().toISOString()
    const memoryUsage = process.memoryUsage()
    
    console.log('🏁 テスト終了情報:')
    console.log(`  終了時刻: ${endTime}`)
    console.log(`  メモリ使用量: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`)

  } catch (error) {
    console.error('❌ クリーンアップ中にエラーが発生しました:', error)
    // エラーが発生してもテストの成功/失敗には影響させない
  }
}

export default globalTeardown