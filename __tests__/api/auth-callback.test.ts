/**
 * 認証コールバック API テスト: /auth/callback
 * createRouteHandlerClient の cookieStore 処理を検証
 */

/**
 * @jest-environment node
 */

// Mock NextRequest and NextResponse
const mockRedirect = jest.fn()
jest.mock('next/server', () => {
  return {
    NextResponse: {
      redirect: mockRedirect
    }
  }
})

// Mock cookies
const mockCookies = jest.fn()
jest.mock('next/headers', () => ({
  cookies: mockCookies
}))

// Supabase モック
const mockSupabaseAuth = {
  exchangeCodeForSession: jest.fn(),
  getSession: jest.fn()
}

const mockSupabaseFrom = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn()
}

const mockSupabase = {
  auth: mockSupabaseAuth,
  from: jest.fn(() => mockSupabaseFrom)
}

// createRouteHandlerClient モック
const mockCreateRouteHandlerClient = jest.fn(() => mockSupabase)
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: mockCreateRouteHandlerClient
}))

import { GET } from '@/app/auth/callback/route'

describe('/auth/callback - Cookie Store 検証テスト', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // デフォルト成功レスポンス
    mockSupabaseAuth.exchangeCodeForSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          user: {
            id: 'test-user-123',
            email: 'test@example.com'
          }
        },
        user: {
          id: 'test-user-123',
          email: 'test@example.com',
          app_metadata: { provider: 'google' }
        }
      },
      error: null
    })
    
    mockSupabaseFrom.single.mockResolvedValue({
      data: {
        user_id: 'test-user-123',
        profile_completed: false
      },
      error: null
    })
    
    mockRedirect.mockImplementation((url) => ({ redirect: url.toString() }))
  })

  describe('🍪 Cookie Store 処理テスト', () => {
    test('createRouteHandlerClient が cookies 引数で正しく呼び出される', async () => {
      const mockCookieStore = {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
        has: jest.fn(),
        getAll: jest.fn()
      }
      
      mockCookies.mockReturnValue(mockCookieStore)
      
      const request = new Request('http://localhost:3000/auth/callback?code=test-auth-code')
      
      await GET(request)
      
      // createRouteHandlerClient が cookies を引数として呼び出されることを確認
      expect(mockCreateRouteHandlerClient).toHaveBeenCalledWith({
        cookies: mockCookies
      })
    })

    test('cookies が undefined の場合でもエラーにならない', async () => {
      mockCookies.mockReturnValue(undefined)
      
      const request = new Request('http://localhost:3000/auth/callback?code=test-auth-code')
      
      // エラーなく実行されることを確認
      await expect(GET(request)).resolves.not.toThrow()
      
      expect(mockCreateRouteHandlerClient).toHaveBeenCalledWith({
        cookies: mockCookies
      })
    })

    test('cookies が null の場合でもエラーにならない', async () => {
      mockCookies.mockReturnValue(null)
      
      const request = new Request('http://localhost:3000/auth/callback?code=test-auth-code')
      
      // エラーなく実行されることを確認
      await expect(GET(request)).resolves.not.toThrow()
      
      expect(mockCreateRouteHandlerClient).toHaveBeenCalledWith({
        cookies: mockCookies
      })
    })

    test('複数回の createRouteHandlerClient 呼び出しで同じ cookies が使用される', async () => {
      const mockCookieStore = {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn()
      }
      
      mockCookies.mockReturnValue(mockCookieStore)
      
      const request = new Request('http://localhost:3000/auth/callback?code=test-auth-code')
      
      await GET(request)
      
      // createRouteHandlerClient が1回だけ呼び出されることを確認
      expect(mockCreateRouteHandlerClient).toHaveBeenCalledTimes(1)
      expect(mockCreateRouteHandlerClient).toHaveBeenCalledWith({
        cookies: mockCookies
      })
    })
  })

  describe('🔐 Supabase 認証フロー統合テスト', () => {
    test('exchangeCodeForSession が正しく呼び出される', async () => {
      const testCode = 'test-oauth-code-12345'
      const request = new Request(`http://localhost:3000/auth/callback?code=${testCode}`)
      
      await GET(request)
      
      expect(mockSupabaseAuth.exchangeCodeForSession).toHaveBeenCalledWith(testCode)
    })

    test('exchangeCodeForSession エラー時は適切にリダイレクトされる', async () => {
      mockSupabaseAuth.exchangeCodeForSession.mockResolvedValue({
        data: null,
        error: {
          message: 'Invalid authorization code',
          status: 400,
          name: 'AuthError',
          code: 'invalid_grant'
        }
      })
      
      const request = new Request('http://localhost:3000/auth/callback?code=invalid-code')
      
      await GET(request)
      
      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/login?error=auth_failed')
        })
      )
    })

    test('exchangeCodeForSession で例外が発生した場合の処理', async () => {
      mockSupabaseAuth.exchangeCodeForSession.mockRejectedValue(
        new Error('Network connection failed')
      )
      
      const request = new Request('http://localhost:3000/auth/callback?code=test-code')
      
      await GET(request)
      
      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/login?error=exchange_exception')
        })
      )
    })
  })

  describe('🎯 エラーケース処理テスト', () => {
    test('認証コードが存在しない場合', async () => {
      const request = new Request('http://localhost:3000/auth/callback')
      
      await GET(request)
      
      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/login?error=no_code')
        })
      )
    })

    test('OAuth エラーパラメータが存在する場合', async () => {
      const request = new Request('http://localhost:3000/auth/callback?error=access_denied&error_description=User%20denied%20access')
      
      await GET(request)
      
      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/login?error=access_denied')
        })
      )
    })

    test('セッションが存在しない場合', async () => {
      mockSupabaseAuth.exchangeCodeForSession.mockResolvedValue({
        data: { session: null, user: null },
        error: null
      })
      
      const request = new Request('http://localhost:3000/auth/callback?code=test-code')
      
      await GET(request)
      
      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/login?error=no_session')
        })
      )
    })
  })

  describe('📊 ログ・デバッグ機能テスト', () => {
    test('console.log が適切に呼び出される', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      
      const request = new Request('http://localhost:3000/auth/callback?code=test-code')
      
      await GET(request)
      
      // 開始ログ
      expect(consoleSpy).toHaveBeenCalledWith(
        '[AUTH CALLBACK] 認証コールバック処理開始',
        expect.any(Object)
      )
      
      // リクエスト詳細ログ
      expect(consoleSpy).toHaveBeenCalledWith(
        '[AUTH CALLBACK] リクエスト詳細:',
        expect.any(Object)
      )
      
      // exchangeCodeForSession ログ
      expect(consoleSpy).toHaveBeenCalledWith(
        '[AUTH CALLBACK] exchangeCodeForSession開始...'
      )
      
      consoleSpy.mockRestore()
      consoleErrorSpy.mockRestore()
    })

    test('エラー時のデバッグ情報が出力される', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      
      mockSupabaseAuth.exchangeCodeForSession.mockResolvedValue({
        data: null,
        error: {
          message: 'Test error',
          status: 400,
          name: 'TestError',
          code: 'test_error'
        }
      })
      
      const request = new Request('http://localhost:3000/auth/callback?code=test-code')
      
      await GET(request)
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[AUTH CALLBACK] セッション取得エラー詳細:',
        expect.objectContaining({
          message: 'Test error',
          status: 400,
          name: 'TestError',
          code: 'test_error'
        })
      )
      
      consoleErrorSpy.mockRestore()
    })
  })

  describe('🔄 リダイレクト処理テスト', () => {
    test('プロファイル完了済みユーザーは dashboard にリダイレクト', async () => {
      mockSupabaseFrom.single.mockResolvedValue({
        data: {
          user_id: 'test-user-123',
          profile_completed: true
        },
        error: null
      })
      
      const request = new Request('http://localhost:3000/auth/callback?code=test-code')
      
      await GET(request)
      
      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/dashboard')
        })
      )
    })

    test('プロファイル未完了ユーザーは / にリダイレクト', async () => {
      mockSupabaseFrom.single.mockResolvedValue({
        data: {
          user_id: 'test-user-123',
          profile_completed: false
        },
        error: null
      })
      
      const request = new Request('http://localhost:3000/auth/callback?code=test-code')
      
      await GET(request)
      
      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/')
        })
      )
    })

    test('新規ユーザー（プロファイル不存在）は / にリダイレクト', async () => {
      mockSupabaseFrom.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' } // Record not found
      })
      
      const request = new Request('http://localhost:3000/auth/callback?code=test-code')
      
      await GET(request)
      
      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/')
        })
      )
    })
  })

  describe('⚡ パフォーマンス・タイミングテスト', () => {
    test('処理時間が記録される', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      const request = new Request('http://localhost:3000/auth/callback?code=test-code')
      
      await GET(request)
      
      // 完了時のログで処理時間が記録されることを確認
      expect(consoleSpy).toHaveBeenCalledWith(
        '[AUTH CALLBACK] 処理完了',
        expect.objectContaining({
          totalProcessingTime: expect.any(Number),
          timestamp: expect.any(String)
        })
      )
      
      consoleSpy.mockRestore()
    })

    test('exchangeCodeForSession の実行時間が測定される', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      const request = new Request('http://localhost:3000/auth/callback?code=test-code')
      
      await GET(request)
      
      // exchangeCodeForSession の完了ログで実行時間が記録されることを確認
      expect(consoleSpy).toHaveBeenCalledWith(
        '[AUTH CALLBACK] exchangeCodeForSession完了',
        expect.objectContaining({
          duration: expect.any(Number)
        })
      )
      
      consoleSpy.mockRestore()
    })
  })
})