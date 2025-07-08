import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2Eテスト設定
 * 扶養わかるんです の主要ユーザーフローをテスト
 */
export default defineConfig({
  testDir: './e2e',
  /* 並列実行でテスト時間を短縮 */
  fullyParallel: true,
  /* CI環境での失敗時の動作設定 */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  /* レポート設定 */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['junit', { outputFile: 'test-results/e2e-results.xml' }]
  ],

  /* 共通テスト設定 */
  use: {
    /* ベースURL（環境変数で切り替え可能） */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    /* トレース設定（失敗時のみ） */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    /* 日本語環境設定 */
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',

    /* モバイルファーストアプリなので viewport を小さく設定 */
    viewport: { width: 375, height: 667 },

    /* テストの高速化 */
    actionTimeout: 10000,
    navigationTimeout: 30000,

    /* ブラウザ起動オプション（キャッシュ無効化でChunkLoadError回避） */
    launchOptions: {
      args: [
        '--disable-application-cache',
        '--disable-web-security',
        '--disable-dev-shm-usage',
        '--no-sandbox'
      ]
    },
  },

  /* プロジェクト設定（異なるブラウザ・デバイス） */
  projects: [
    {
      name: 'chromium-mobile',
      use: { 
        ...devices['Galaxy S8'],
        contextOptions: {
          /* 日本語環境の設定 */
          locale: 'ja-JP',
          geolocation: { longitude: 139.6917, latitude: 35.6895 }, // Tokyo
          permissions: ['notifications']
        }
      },
    },

    {
      name: 'webkit-mobile',
      use: { 
        ...devices['iPhone 12'],
        contextOptions: {
          locale: 'ja-JP',
          geolocation: { longitude: 139.6917, latitude: 35.6895 },
          permissions: ['notifications']
        }
      },
    },

    {
      name: 'firefox-mobile',
      use: { 
        ...devices['Galaxy S8'],
        browserName: 'firefox',
        contextOptions: {
          locale: 'ja-JP'
        }
      },
    },

    /* デスクトップ版（参考用） */
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },
  ],

  /* 開発サーバー設定 */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      /* テスト用環境変数 */
      NODE_ENV: 'test',
      NEXT_PUBLIC_SUPABASE_URL: process.env.TEST_SUPABASE_URL || 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.TEST_SUPABASE_ANON_KEY || 'test-key',
    }
  },

  /* テストディレクトリとファイルパターン */
  testMatch: [
    'e2e/**/*.spec.ts',
    'e2e/**/*.test.ts'
  ],

  /* グローバル設定 */
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',

  /* 出力ディレクトリ */
  outputDir: 'test-results/',

  /* メタデータ */
  metadata: {
    'test-type': 'e2e',
    'app-name': '扶養わかるんです',
    'app-version': process.env.npm_package_version || '0.1.0'
  },

  /* パフォーマンス最適化 */
  expect: {
    timeout: 10000
  },

  /* ファイル変更時の自動実行設定（開発時） */
  ...(process.env.NODE_ENV === 'development' && {
    grep: /smoke/,  // 開発時は smoke テストのみ実行
  })
})