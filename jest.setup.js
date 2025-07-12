// Jest セットアップファイル - テスト環境の初期設定

require('@testing-library/jest-dom')

// Next.js 設定のモック
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/test-path',
}))

// Supabase クライアントのモック
jest.mock('@/lib/supabase', () => ({
  getAuthenticatedSupabaseClient: jest.fn(),
  UserProfile: {},
  UserStats: {},
}))

// 環境変数のモック
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
process.env.NODE_ENV = 'test'

// window オブジェクトの拡張
Object.defineProperty(window, 'location', {
  value: {
    origin: 'https://test.example.com',
    href: 'https://test.example.com/test',
    search: '',
    pathname: '/test',
  },
  writable: true,
})

// デモモードのモック
Object.defineProperty(window, '__demo_mode', {
  value: false,
  writable: true,
})

// Notification API のモック
global.Notification = {
  requestPermission: jest.fn(() => Promise.resolve('granted')),
  permission: 'granted',
} 

// IntersectionObserver のモック
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null
  }
  disconnect() {
    return null
  }
  unobserve() {
    return null
  }
}

// ResizeObserver のモック
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null
  }
  disconnect() {
    return null
  }
  unobserve() {
    return null
  }
}

// fetch のモック（MSW を使用しない軽量テスト用）
global.fetch = jest.fn()

// console のカスタマイズ（テスト中の不要なログを抑制）
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// 各テスト後のクリーンアップ
afterEach(() => {
  jest.clearAllMocks()
  
  // fetch モックをリセット
  if (global.fetch && global.fetch.mockClear) {
    global.fetch.mockClear()
  }
  
  // localStorage をクリア
  if (typeof Storage !== 'undefined') {
    localStorage.clear()
    sessionStorage.clear()
  }
})

// カスタムマッチャーの追加
expect.extend({
  // 扶養計算用のカスタムマッチャー
  toBeWithinFuyouLimit(received, limit) {
    const pass = received <= limit
    if (pass) {
      return {
        message: () => `期待値 ${received} が扶養限度額 ${limit} 以内でした`,
        pass: true,
      }
    } else {
      return {
        message: () => `期待値 ${received} が扶養限度額 ${limit} を超過しています`,
        pass: false,
      }
    }
  },

  // 金額フォーマット用のマッチャー
  toBeFormattedCurrency(received) {
    const currencyRegex = /^¥[\d,]+$/
    const pass = currencyRegex.test(received)
    if (pass) {
      return {
        message: () => `${received} は正しい通貨フォーマットです`,
        pass: true,
      }
    } else {
      return {
        message: () => `${received} は正しい通貨フォーマットではありません（期待: ¥1,000,000）`,
        pass: false,
      }
    }
  },

  // 日付フォーマット用のマッチャー
  toBeValidJapaneseDate(received) {
    const dateRegex = /^\d{4}\/\d{1,2}\/\d{1,2}/
    const pass = dateRegex.test(received)
    if (pass) {
      return {
        message: () => `${received} は正しい日本語日付フォーマットです`,
        pass: true,
      }
    } else {
      return {
        message: () => `${received} は正しい日本語日付フォーマットではありません`,
        pass: false,
      }
    }
  }
})

// テストタイムアウトの設定
jest.setTimeout(10000)

// 未処理のPromise警告を抑制
process.on('unhandledRejection', (reason) => {
  console.warn('Unhandled Rejection in test:', reason)
})