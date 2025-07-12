import { useState, useEffect, useCallback } from 'react'
import { UserProfile, UserStats } from '@/lib/supabase'

interface DashboardBatchResponse {
  user_id: string
  timestamp: string
  profile: UserProfile | null
  stats: UserStats | null
  bank_connected: boolean
  bank_info: {
    connected_at?: string
    last_synced?: string
  } | null
  errors?: {
    profile?: string
    stats?: string
    stats_insert?: string
  }
  performance: {
    execution_time_ms: number
    parallel_requests: number
    failed?: boolean
    client_total_time_ms?: number
  }
}

interface UseDashboardDataReturn {
  data: {
    profile: UserProfile | null
    stats: UserStats | null
  } | null
  bankConnected: boolean
  bankInfo: DashboardBatchResponse['bank_info']
  loading: boolean
  error: string | null
  authError: boolean
  performance: (DashboardBatchResponse['performance'] & { client_total_time_ms?: number }) | null
  refetch: () => Promise<void>
}

/**
 * ダッシュボードデータ取得用カスタムフック
 * バッチAPIを使用してパフォーマンスを最適化
 */
export function useDashboardData(): UseDashboardDataReturn {
  const [data, setData] = useState<{
    profile: UserProfile | null
    stats: UserStats | null
  } | null>(null)
  const [bankConnected, setBankConnected] = useState(false)
  const [bankInfo, setBankInfo] = useState<DashboardBatchResponse['bank_info']>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authError, setAuthError] = useState(false)
  const [performance, setPerformance] = useState<DashboardBatchResponse['performance'] | null>(null)

  const fetchDashboardData = useCallback(async () => {
    const startTime = Date.now()
    setLoading(true)
    setError(null)
    setAuthError(false)

    try {
      // 🚀 バッチAPIを使用して並列処理でパフォーマンス向上
      const response = await fetch('/api/dashboard/batch', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Cookieを含める
      })

      if (!response.ok) {
        if (response.status === 401) {
          setAuthError(true)
          return
        }
        throw new Error(`API Error: ${response.status}`)
      }

      const batchData: DashboardBatchResponse = await response.json()

      // パフォーマンス情報を記録
      setPerformance({
        ...batchData.performance,
        client_total_time_ms: Date.now() - startTime
      })

      // エラーハンドリング
      if (batchData.errors) {
        const errorMessages = Object.values(batchData.errors).filter(Boolean)
        if (errorMessages.length > 0) {
          console.warn('🟡 Dashboard batch API warnings:', batchData.errors)
          // 部分的なエラーは警告として扱い、取得できたデータは使用
        }
      }

      // データ設定
      if (batchData.profile && batchData.stats) {
        setData({
          profile: batchData.profile,
          stats: batchData.stats
        })
      } else {
        // プロフィールまたは統計データが不足している場合
        if (!batchData.profile) {
          setError('ユーザープロフィールが見つかりません。セットアップを完了してください。')
        } else if (!batchData.stats) {
          // 統計データは自動作成されるため、通常はここに到達しない
          setError('統計データの取得に失敗しました。')
        }
      }

      // 銀行連携情報設定
      setBankConnected(batchData.bank_connected)
      setBankInfo(batchData.bank_info)

      // パフォーマンスログ（開発環境のみ）
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Dashboard Data Performance:', {
          server_time: batchData.performance.execution_time_ms,
          client_time: Date.now() - startTime,
          total_requests: batchData.performance.parallel_requests,
          timestamp: batchData.timestamp
        })
      }

    } catch (fetchError: unknown) {
      console.error('🔴 Dashboard data fetch error:', fetchError)
      setError('データの取得に失敗しました。ネットワーク接続を確認してください。')
      setPerformance({
        execution_time_ms: Date.now() - startTime,
        parallel_requests: 0,
        failed: true
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  return {
    data,
    bankConnected,
    bankInfo,
    loading,
    error,
    authError,
    performance,
    refetch: fetchDashboardData
  }
}