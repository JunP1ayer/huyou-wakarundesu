/**
 * useDashboardData カスタムフックのテスト
 * バッチAPI統合とキャッシュ機能のテスト
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { useDashboardData } from '@/hooks/useDashboardData'

// fetch のモック設定
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

// モックレスポンスデータ
const mockSuccessResponse = {
  user_id: 'test-user-id',
  timestamp: '2025-07-03T12:00:00Z',
  profile: {
    user_id: 'test-user-id',
    fuyou_line: 1030000,
    hourly_wage: 1000,
    is_student: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  stats: {
    user_id: 'test-user-id',
    ytd_income: 500000,
    transaction_count: 25,
    last_calculated: '2025-07-01T12:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-07-01T12:00:00Z'
  },
  bank_connected: true,
  bank_info: {
    connected_at: '2025-01-01T00:00:00Z',
    last_synced: '2025-07-02T12:00:00Z'
  },
  performance: {
    execution_time_ms: 150,
    parallel_requests: 3
  }
}

describe('useDashboardData カスタムフック', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('正常なデータ取得', () => {
    test('初回ロード時に正しくデータを取得する', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSuccessResponse,
      } as Response)

      const { result } = renderHook(() => useDashboardData())

      // 初期状態の確認
      expect(result.current.loading).toBe(true)
      expect(result.current.data).toBe(null)
      expect(result.current.error).toBe(null)

      // データ取得完了まで待機
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // 正常にデータが設定されることを確認
      expect(result.current.data).toEqual({
        profile: mockSuccessResponse.profile,
        stats: mockSuccessResponse.stats
      })
      expect(result.current.bankConnected).toBe(true)
      expect(result.current.bankInfo).toEqual(mockSuccessResponse.bank_info)
      expect(result.current.error).toBe(null)
      expect(result.current.authError).toBe(false)
    })

    test('パフォーマンス情報が正しく記録される', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSuccessResponse,
      } as Response)

      const { result } = renderHook(() => useDashboardData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.performance).toMatchObject({
        execution_time_ms: 150,
        parallel_requests: 3,
        client_total_time_ms: expect.any(Number)
      })
    })
  })

  describe('エラーハンドリング', () => {
    test('401認証エラーの場合、authErrorがtrueになる', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Authentication required' }),
      } as Response)

      const { result } = renderHook(() => useDashboardData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.authError).toBe(true)
      expect(result.current.data).toBe(null)
      expect(result.current.error).toBe(null)
    })

    test('500サーバーエラーの場合、エラーメッセージが設定される', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      } as Response)

      const { result } = renderHook(() => useDashboardData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('データの取得に失敗しました。ネットワーク接続を確認してください。')
      expect(result.current.authError).toBe(false)
      expect(result.current.data).toBe(null)
    })

    test('ネットワークエラーの場合、適切なエラーメッセージが表示される', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useDashboardData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('データの取得に失敗しました。ネットワーク接続を確認してください。')
      expect(result.current.performance?.failed).toBe(true)
    })
  })

  describe('部分的なデータ欠損のハンドリング', () => {
    test('プロフィールデータが欠損している場合', async () => {
      const partialResponse = {
        ...mockSuccessResponse,
        profile: null
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => partialResponse,
      } as Response)

      const { result } = renderHook(() => useDashboardData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toBe(null)
      expect(result.current.error).toBe('ユーザープロフィールが見つかりません。セットアップを完了してください。')
    })

    test('統計データが欠損している場合', async () => {
      const partialResponse = {
        ...mockSuccessResponse,
        stats: null
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => partialResponse,
      } as Response)

      const { result } = renderHook(() => useDashboardData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toBe(null)
      expect(result.current.error).toBe('統計データの取得に失敗しました。')
    })

    test('APIエラーがあっても取得できたデータは使用される', async () => {
      const responseWithErrors = {
        ...mockSuccessResponse,
        errors: {
          profile: 'Profile fetch warning',
          stats_insert: 'Stats creation warning'
        }
      }

      // コンソール警告のモック
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseWithErrors,
      } as Response)

      const { result } = renderHook(() => useDashboardData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // データは正常に設定される
      expect(result.current.data).toEqual({
        profile: mockSuccessResponse.profile,
        stats: mockSuccessResponse.stats
      })

      // 警告がログに出力される
      expect(consoleSpy).toHaveBeenCalledWith(
        '🟡 Dashboard batch API warnings:',
        responseWithErrors.errors
      )

      consoleSpy.mockRestore()
    })
  })

  describe('refetch 機能', () => {
    test('refetch が正常に動作する', async () => {
      // 初回レスポンス
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSuccessResponse,
      } as Response)

      const { result } = renderHook(() => useDashboardData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // 更新されたデータ
      const updatedResponse = {
        ...mockSuccessResponse,
        stats: {
          ...mockSuccessResponse.stats,
          ytd_income: 750000
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => updatedResponse,
      } as Response)

      // refetch 実行
      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.data?.stats.ytd_income).toBe(750000)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    test('refetch 中はローディング状態になる', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSuccessResponse,
      } as Response)

      const { result } = renderHook(() => useDashboardData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // refetch時の遅延をシミュレート
      let resolvePromise: () => void
      const delayedPromise = new Promise<Response>((resolve) => {
        resolvePromise = () => resolve({
          ok: true,
          status: 200,
          json: async () => mockSuccessResponse,
        } as Response)
      })
      
      mockFetch.mockReturnValueOnce(delayedPromise)

      let refetchPromise: Promise<void>
      
      // refetchを開始
      await act(async () => {
        refetchPromise = result.current.refetch()
      })
      
      // ローディング状態を確認
      await waitFor(() => {
        expect(result.current.loading).toBe(true)
      })

      // プロミスを解決して完了を待つ
      await act(async () => {
        resolvePromise!()
        await refetchPromise!
      })

      expect(result.current.loading).toBe(false)
    })
  })

  describe('API呼び出しの詳細', () => {
    test('正しいAPIエンドポイントが呼び出される', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSuccessResponse,
      } as Response)

      renderHook(() => useDashboardData())

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/dashboard/batch', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })
      })
    })

    test('レスポンスヘッダーの処理', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => mockSuccessResponse,
        headers: new Headers({
          'X-Execution-Time': '150ms',
          'Cache-Control': 'private, no-cache'
        })
      }

      mockFetch.mockResolvedValueOnce(mockResponse as Response)

      const { result } = renderHook(() => useDashboardData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // ヘッダー情報が適切に処理されることを確認
      expect(result.current.performance?.execution_time_ms).toBe(150)
    })
  })

  describe('開発環境でのパフォーマンスログ', () => {
    test('開発環境でパフォーマンス情報がログ出力される', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSuccessResponse,
      } as Response)

      renderHook(() => useDashboardData())

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          '📊 Dashboard Data Performance:',
          expect.objectContaining({
            server_time: 150,
            client_time: expect.any(Number),
            total_requests: 3,
            timestamp: mockSuccessResponse.timestamp
          })
        )
      })

      process.env.NODE_ENV = originalEnv
      consoleSpy.mockRestore()
    })

    test('本番環境ではパフォーマンスログが出力されない', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSuccessResponse,
      } as Response)

      renderHook(() => useDashboardData())

      await waitFor(() => {
        expect(consoleSpy).not.toHaveBeenCalledWith(
          '📊 Dashboard Data Performance:',
          expect.any(Object)
        )
      })

      process.env.NODE_ENV = originalEnv
      consoleSpy.mockRestore()
    })
  })
})