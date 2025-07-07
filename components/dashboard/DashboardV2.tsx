'use client'

import { useState, useEffect } from 'react'
import { getAuthenticatedSupabaseClient, UserProfile, UserMonthlyIncome } from '@/lib/supabase'
import { 
  calculateFuyouStatusV2WithDynamicThresholds,
  getThresholdSystemStatus,
  FuyouStatusV2, 
  formatCurrencyV2,
  getThresholdName,
  FUYOU_THRESHOLDS 
} from '@/lib/fuyouClassifierV2'
import { getMonthlyIncomeData } from '@/lib/income-manager'
import { checkThresholdSystemHealth } from '@/lib/thresholdRepo'
import { AlertTriangle, Settings, Banknote, Clock, Info, TrendingUp, Calendar } from 'lucide-react'
import ExportCsvButton from '@/components/ExportCsvButton'
import RequestPermission from '@/components/notifications/RequestPermission'
import { useToastFallback } from '@/components/notifications/Toast'
import LoginPrompt from '@/components/auth/LoginPrompt'
import EmptyState from '@/components/dashboard/EmptyState'

interface DashboardDataV2 {
  profile: UserProfile
  monthlyData: UserMonthlyIncome[]
  fuyouStatus: FuyouStatusV2
  systemHealth: {
    isHealthy: boolean
    source: 'database' | 'fallback' | 'env_fallback'
    thresholdCount: number
  }
}

export default function DashboardV2() {
  const [data, setData] = useState<DashboardDataV2 | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authError, setAuthError] = useState(false)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [bankConnected, setBankConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showWelcomeToast, setShowWelcomeToast] = useState(false)
  const { showToast, ToastContainer } = useToastFallback()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleBankConnect = async () => {
    setIsConnecting(true)
    try {
      const response = await fetch('/api/moneytree/connect', {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Failed to initiate bank connection')
      }
      
      const { authUrl } = await response.json()
      window.location.href = authUrl
    } catch (error) {
      console.error('Error connecting bank:', error)
      showToast('銀行連携の開始中にエラーが発生しました', 'error')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSyncTransactions = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/moneytree/sync', {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Failed to sync transactions')
      }
      
      const result = await response.json()
      showToast(`${result.syncedTransactions}件の取引を同期しました`, 'success')
      
      // Refresh dashboard data
      await fetchDashboardData()
    } catch (error) {
      console.error('Error syncing transactions:', error)
      showToast('取引の同期中にエラーが発生しました', 'error')
    } finally {
      setIsSyncing(false)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setError(null)
      setAuthError(false)
      setNeedsSetup(false)
      
      const authClient = await getAuthenticatedSupabaseClient()
      
      if (!authClient) {
        setAuthError(true)
        setLoading(false)
        return
      }
      
      const { supabase, user } = authClient

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          setNeedsSetup(true)
          setLoading(false)
          return
        }
        throw profileError
      }

      // Check if bank is connected
      const { data: tokenData } = await supabase
        .from('user_moneytree_tokens')
        .select('user_id')
        .eq('user_id', user.id)
        .single()
      
      setBankConnected(!!tokenData)

      // Fetch monthly income data for current year
      const currentYear = new Date().getFullYear()
      const monthlyData = await getMonthlyIncomeData(user.id, currentYear)
      
      // Calculate enhanced fuyou status with dynamic thresholds
      const fuyouStatus = await calculateFuyouStatusV2WithDynamicThresholds(profile, monthlyData, currentYear)
      
      // Get system health information
      const systemHealthStatus = await getThresholdSystemStatus()
      const systemHealth = {
        isHealthy: systemHealthStatus.isHealthy,
        source: systemHealthStatus.source,
        thresholdCount: systemHealthStatus.thresholdCount
      }
      
      setData({ profile, monthlyData, fuyouStatus, systemHealth })
      
      // Show welcome toast for new users
      const isNewUser = monthlyData.length === 0 || fuyouStatus.totalIncome === 0
      if (isNewUser && profile.fuyou_line) {
        setShowWelcomeToast(true)
        setTimeout(() => setShowWelcomeToast(false), 6000)
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('データの取得中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (authError) {
    return <LoginPrompt message="ダッシュボードを利用するにはログインが必要です" />
  }

  if (needsSetup) {
    return <EmptyState />
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-gray-600">{error || 'データが見つかりません'}</p>
        </div>
      </div>
    )
  }

  const { profile, fuyouStatus, systemHealth } = data
  const primaryStatus = fuyouStatus.thresholds[fuyouStatus.primaryThreshold]
  
  const getAlertColor = (alertLevel: string) => {
    switch (alertLevel) {
      case 'danger': return 'bg-red-500'
      case 'warning': return 'bg-yellow-500'
      case 'info': return 'bg-blue-500'
      default: return 'bg-green-500'
    }
  }

  const getAlertTextColor = (alertLevel: string) => {
    switch (alertLevel) {
      case 'danger': return 'text-red-600'
      case 'warning': return 'text-yellow-600'
      case 'info': return 'text-blue-600'
      default: return 'text-green-600'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-6">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">扶養わかるんです</h1>
              {process.env.NEXT_PUBLIC_APP_VERSION && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                  v{process.env.NEXT_PUBLIC_APP_VERSION}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-600">
                {profile.is_student ? '学生' : '一般'}扶養 v2.1
              </p>
              <div className={`h-2 w-2 rounded-full ${
                systemHealth.source === 'database' ? 'bg-green-400' : 'bg-yellow-400'
              }`} title={
                systemHealth.source === 'database' ? 'データベース接続中' : 'フォールバック値使用中'
              }></div>
            </div>
          </div>
          <button 
            onClick={() => window.location.href = '/settings'}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <Settings className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6">
        <div className="max-w-md mx-auto space-y-6">
          
          {/* Primary Status Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">現在の状況</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAlertTextColor(primaryStatus.alertLevel)}`}>
                {primaryStatus.alertLevel === 'danger' ? '危険' : 
                 primaryStatus.alertLevel === 'warning' ? '注意' : 
                 primaryStatus.alertLevel === 'info' ? '確認' : '安全'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Banknote className="h-5 w-5 text-indigo-600 mr-1" />
                  <span className="text-sm font-medium text-gray-600">あと</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {Math.floor(primaryStatus.remaining / 10000)}
                </div>
                <div className="text-lg text-gray-600">万円</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Calendar className="h-5 w-5 text-indigo-600 mr-1" />
                  <span className="text-sm font-medium text-gray-600">月割り</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {Math.floor(primaryStatus.monthlyAllowance / 1000)}
                </div>
                <div className="text-lg text-gray-600">千円</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>使用済み: {formatCurrencyV2(fuyouStatus.totalIncome)}</span>
                <span>上限: {formatCurrencyV2(primaryStatus.limit)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${getAlertColor(primaryStatus.alertLevel)}`}
                  style={{ width: `${Math.min(100, primaryStatus.percentage)}%` }}
                />
              </div>
              <div className="text-center mt-2">
                <span className={`text-sm font-medium ${getAlertTextColor(primaryStatus.alertLevel)}`}>
                  {Math.round(primaryStatus.percentage)}% 使用済み
                </span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700">{primaryStatus.message}</p>
            </div>
          </div>

          {/* All Thresholds Overview */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="font-bold text-gray-900 mb-4">全扶養限度額の状況</h3>
            <div className="space-y-3">
              {Object.entries(fuyouStatus.thresholds).map(([key, status]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">
                      {getThresholdName(status.threshold)}
                    </div>
                    <div className="text-xs text-gray-600">
                      残り {formatCurrencyV2(status.remaining)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getAlertTextColor(status.alertLevel)}`}>
                      {Math.round(status.percentage)}%
                    </div>
                    <div className={`w-16 h-2 rounded-full bg-gray-200 mt-1`}>
                      <div 
                        className={`h-2 rounded-full ${getAlertColor(status.alertLevel)}`}
                        style={{ width: `${Math.min(100, status.percentage)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {fuyouStatus.recommendations.length > 0 && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
              <div className="flex items-start">
                <Info className="h-6 w-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-blue-900 mb-2">推奨事項</h3>
                  <div className="space-y-2">
                    {fuyouStatus.recommendations.map((recommendation, index) => (
                      <p key={index} className="text-sm text-blue-800">
                        • {recommendation}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Monthly Progress Chart */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="font-bold text-gray-900 mb-4">月別収入推移</h3>
            <div className="space-y-3">
              {fuyouStatus.monthlyData.length > 0 ? (
                fuyouStatus.monthlyData.map((month) => (
                  <div key={month.month} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-700 w-8">
                        {month.month}月
                      </span>
                      {month.isEstimated && (
                        <span className="text-xs text-gray-500 ml-2">(予測)</span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrencyV2(month.income)}
                      </div>
                      <div className="text-xs text-gray-600">
                        累計: {formatCurrencyV2(month.cumulativeIncome)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600 text-center py-4">
                  月別データがまだありません
                </p>
              )}
            </div>
          </div>

          {/* Bank Connection Status */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">銀行連携</h3>
                <p className="text-sm text-gray-600">
                  {bankConnected ? '銀行アカウントが連携済み' : '自動で収入を追跡'}
                </p>
                {bankConnected && (
                  <div className="flex items-center mt-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-xs text-green-600 font-medium">連携中</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col space-y-2">
                {!bankConnected ? (
                  <button 
                    onClick={handleBankConnect}
                    disabled={isConnecting}
                    className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {isConnecting ? '接続中...' : '連携する'}
                  </button>
                ) : (
                  <button 
                    onClick={handleSyncTransactions}
                    disabled={isSyncing}
                    className="bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isSyncing ? '同期中...' : '同期する'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Data Export */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">データエクスポート</h3>
                <p className="text-sm text-gray-600">
                  収入データをCSVファイルでダウンロード
                </p>
              </div>
              <ExportCsvButton />
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="font-bold text-gray-900 mb-4">通知設定</h3>
            <RequestPermission />
          </div>
        </div>
      </div>

      {/* Welcome Toast */}
      {showWelcomeToast && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto">
          <div className="bg-green-600 text-white p-4 rounded-xl shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold mb-1">扶養計算v2.0が利用可能！</h4>
                <p className="text-sm">
                  複数の扶養限度額を同時に追跡できます。
                  主要な限度額は <strong>{getThresholdName(fuyouStatus.primaryThreshold)}</strong> です 🎉
                </p>
              </div>
              <button 
                onClick={() => setShowWelcomeToast(false)}
                className="text-white hover:text-green-200 ml-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <ToastContainer />
    </div>
  )
}